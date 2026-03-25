import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * 数据全景审计
 * 
 * 目标：
 * 1. 统计所有数据源
 * 2. 检查数据质量
 * 3. 识别制造商 vs 供应商
 * 4. 发现重复和冲突
 * 5. 生成清洗建议
 */

interface AuditReport {
  timestamp: string;
  dataSources: {
    equipment: any;
    exhibitionSuppliers: any;
    crawledSuppliers: any;
  };
  qualityIssues: string[];
  duplicates: any[];
  recommendations: string[];
}

async function auditEquipment() {
  console.log('\n📦 【1/4】检查产品数据 (equipment 表)...\n');

  const total = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM equipment
  `;

  const withManufacturer = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM equipment WHERE manufacturer IS NOT NULL
  `;

  const withSupplier = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM equipment WHERE supplier_id IS NOT NULL
  `;

  const withNationalStandard = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM equipment 
    WHERE parameters->>'nationalStandard' IS NOT NULL
  `;

  // 统计制造商
  const manufacturers = await prisma.$queryRaw<Array<{ manufacturer: string; count: bigint }>>`
    SELECT manufacturer, COUNT(*) as count
    FROM equipment
    WHERE manufacturer IS NOT NULL
    GROUP BY manufacturer
    ORDER BY count DESC
  `;

  console.log(`   总产品数: ${Number(total[0].count)}`);
  console.log(`   有制造商: ${Number(withManufacturer[0].count)} (${((Number(withManufacturer[0].count) / Number(total[0].count)) * 100).toFixed(1)}%)`);
  console.log(`   有供应商: ${Number(withSupplier[0].count)} (${((Number(withSupplier[0].count) / Number(total[0].count)) * 100).toFixed(1)}%)`);
  console.log(`   有国标号: ${Number(withNationalStandard[0].count)} (${((Number(withNationalStandard[0].count) / Number(total[0].count)) * 100).toFixed(1)}%)`);
  console.log(`\n   制造商统计: ${manufacturers.length} 家`);
  console.log(`   前 10 大制造商:`);
  manufacturers.slice(0, 10).forEach((m, i) => {
    console.log(`      ${i + 1}. ${m.manufacturer}: ${Number(m.count)} 个产品`);
  });

  return {
    total: Number(total[0].count),
    withManufacturer: Number(withManufacturer[0].count),
    withSupplier: Number(withSupplier[0].count),
    withNationalStandard: Number(withNationalStandard[0].count),
    manufacturers: manufacturers.map((m) => ({
      name: m.manufacturer,
      productCount: Number(m.count),
    })),
  };
}

async function auditExhibitionSuppliers() {
  console.log('\n🏢 【2/4】检查展会供应商数据 (exhibition_suppliers 表)...\n');

  const total = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM exhibition_suppliers
  `;

  const withPhone = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM exhibition_suppliers WHERE phone IS NOT NULL
  `;

  const withEmail = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM exhibition_suppliers WHERE email IS NOT NULL
  `;

  const withWebsite = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM exhibition_suppliers WHERE website IS NOT NULL
  `;

  console.log(`   总供应商数: ${Number(total[0].count)}`);
  console.log(`   有电话: ${Number(withPhone[0].count)} (${((Number(withPhone[0].count) / Number(total[0].count)) * 100).toFixed(1)}%)`);
  console.log(`   有邮箱: ${Number(withEmail[0].count)} (${((Number(withEmail[0].count) / Number(total[0].count)) * 100).toFixed(1)}%)`);
  console.log(`   有网址: ${Number(withWebsite[0].count)} (${((Number(withWebsite[0].count) / Number(total[0].count)) * 100).toFixed(1)}%)`);

  return {
    total: Number(total[0].count),
    withPhone: Number(withPhone[0].count),
    withEmail: Number(withEmail[0].count),
    withWebsite: Number(withWebsite[0].count),
  };
}

async function auditCrawledSuppliers() {
  console.log('\n🌐 【3/4】检查爬取供应商数据 (JSON 文件)...\n');

  const jsonPath = '/Users/rabbit-y/Documents/消防装备供应商资料/供应商产品数据/crawl_results.json';
  const dataObj = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  // 转换为数组
  const data = Object.entries(dataObj).map(([name, info]: [string, any]) => ({
    company_name: name,
    ...info,
  }));

  const total = data.length;
  const success = data.filter((s: any) => s.status === 'success').length;
  const withProducts = data.filter((s: any) => s.products && s.products.length > 0).length;

  let totalProducts = 0;
  data.forEach((s: any) => {
    if (s.products) {
      totalProducts += s.products.length;
    }
  });

  console.log(`   总供应商数: ${total}`);
  console.log(`   成功爬取: ${success} (${((success / total) * 100).toFixed(1)}%)`);
  console.log(`   有产品: ${withProducts} (${((withProducts / total) * 100).toFixed(1)}%)`);
  console.log(`   总产品数: ${totalProducts}`);

  return {
    total,
    success,
    withProducts,
    totalProducts,
  };
}

async function findDuplicatesAndConflicts() {
  console.log('\n🔍 【4/4】检查重复和冲突...\n');

  // 1. 检查展会供应商和制造商的重叠
  const manufacturers = await prisma.$queryRaw<Array<{ manufacturer: string }>>`
    SELECT DISTINCT manufacturer FROM equipment WHERE manufacturer IS NOT NULL
  `;

  const exhibitionSuppliers = await prisma.$queryRaw<Array<{ company_name: string }>>`
    SELECT company_name FROM exhibition_suppliers
  `;

  const manufacturerNames = new Set(manufacturers.map((m) => m.manufacturer.trim().toLowerCase()));
  const exhibitionNames = new Set(exhibitionSuppliers.map((s) => s.company_name.trim().toLowerCase()));

  // 精确匹配
  const exactMatches: string[] = [];
  exhibitionNames.forEach((name) => {
    if (manufacturerNames.has(name)) {
      exactMatches.push(name);
    }
  });

  console.log(`   制造商 vs 展会供应商:`);
  console.log(`      制造商总数: ${manufacturers.length}`);
  console.log(`      展会供应商总数: ${exhibitionSuppliers.length}`);
  console.log(`      精确重叠: ${exactMatches.length} 家`);

  if (exactMatches.length > 0) {
    console.log(`\n   重叠的公司（前 10 个）:`);
    exactMatches.slice(0, 10).forEach((name, i) => {
      console.log(`      ${i + 1}. ${name}`);
    });
  }

  // 2. 模糊匹配（包含关系）
  const fuzzyMatches: Array<{ manufacturer: string; exhibition: string }> = [];
  manufacturers.forEach((m) => {
    const mName = m.manufacturer.trim().toLowerCase();
    exhibitionSuppliers.forEach((s) => {
      const sName = s.company_name.trim().toLowerCase();
      if (mName.includes(sName) || sName.includes(mName)) {
        fuzzyMatches.push({
          manufacturer: m.manufacturer,
          exhibition: s.company_name,
        });
      }
    });
  });

  console.log(`\n   模糊重叠: ${fuzzyMatches.length} 对`);
  if (fuzzyMatches.length > 0) {
    console.log(`   模糊匹配示例（前 10 对）:`);
    fuzzyMatches.slice(0, 10).forEach((pair, i) => {
      console.log(`      ${i + 1}. "${pair.manufacturer}" ≈ "${pair.exhibition}"`);
    });
  }

  return {
    exactMatches: exactMatches.length,
    fuzzyMatches: fuzzyMatches.length,
    examples: fuzzyMatches.slice(0, 20),
  };
}

async function analyzeCompanyTypes() {
  console.log('\n🏭 【额外】分析公司类型（制造商 vs 供应商）...\n');

  // 从制造商名称推断类型
  const manufacturers = await prisma.$queryRaw<Array<{ manufacturer: string; count: bigint }>>`
    SELECT manufacturer, COUNT(*) as count
    FROM equipment
    WHERE manufacturer IS NOT NULL
    GROUP BY manufacturer
  `;

  const manufacturerKeywords = ['制造', '工厂', '科技', '股份', '集团', '重工'];
  const supplierKeywords = ['贸易', '销售', '经销', '代理'];

  let likelyManufacturers = 0;
  let likelySuppliers = 0;
  let unclear = 0;

  manufacturers.forEach((m) => {
    const name = m.manufacturer.toLowerCase();
    const isManufacturer = manufacturerKeywords.some((kw) => name.includes(kw));
    const isSupplier = supplierKeywords.some((kw) => name.includes(kw));

    if (isManufacturer && !isSupplier) {
      likelyManufacturers++;
    } else if (isSupplier && !isManufacturer) {
      likelySuppliers++;
    } else {
      unclear++;
    }
  });

  console.log(`   推测类型分布:`);
  console.log(`      可能是制造商: ${likelyManufacturers} 家`);
  console.log(`      可能是供应商: ${likelySuppliers} 家`);
  console.log(`      类型不明确: ${unclear} 家`);

  return {
    likelyManufacturers,
    likelySuppliers,
    unclear,
  };
}

async function generateRecommendations(auditData: any) {
  console.log('\n💡 【建议】数据清洗和整合方案...\n');

  const recommendations: string[] = [];

  // 1. 数据质量建议
  if (auditData.equipment.withManufacturer / auditData.equipment.total < 0.9) {
    recommendations.push('⚠️  部分产品缺少制造商信息，建议补全');
  }

  if (auditData.duplicates.exactMatches > 0) {
    recommendations.push(`✅ 发现 ${auditData.duplicates.exactMatches} 家公司既是制造商又是展会供应商，应合并为同一条记录`);
  }

  if (auditData.duplicates.fuzzyMatches > 0) {
    recommendations.push(`⚠️  发现 ${auditData.duplicates.fuzzyMatches} 对模糊匹配，需要人工审核确认是否为同一公司`);
  }

  // 2. 数据整合建议
  recommendations.push(`✅ 建议创建统一 companies 表，包含 ${auditData.equipment.manufacturers.length + auditData.exhibitionSuppliers.total} 家公司`);
  recommendations.push(`✅ 为 ${auditData.equipment.total} 个产品建立与供应商的关联关系`);
  recommendations.push(`✅ 展会供应商（${auditData.exhibitionSuppliers.total} 家）标记为 partnership_status = 'exhibition'`);
  recommendations.push(`✅ 爬取供应商（${auditData.crawledSuppliers.success} 家）可补充产品详情`);

  // 3. 优先级建议
  recommendations.push(`\n📋 建议执行顺序:`);
  recommendations.push(`   1. 去重合并：处理 ${auditData.duplicates.exactMatches} 个精确重复`);
  recommendations.push(`   2. 模糊匹配：人工审核 ${auditData.duplicates.fuzzyMatches} 对相似公司`);
  recommendations.push(`   3. 类型标注：区分制造商（${auditData.companyTypes.likelyManufacturers}）和供应商`);
  recommendations.push(`   4. 导入数据：创建 companies 表并导入所有公司`);
  recommendations.push(`   5. 建立关联：创建 equipment_suppliers 多对多关联表`);

  recommendations.forEach((rec) => console.log(`   ${rec}`));

  return recommendations;
}

async function main() {
  console.log('🚀 开始数据全景审计...\n');
  console.log('=' .repeat(60));

  try {
    const auditData: any = {};

    auditData.equipment = await auditEquipment();
    auditData.exhibitionSuppliers = await auditExhibitionSuppliers();
    auditData.crawledSuppliers = await auditCrawledSuppliers();
    auditData.duplicates = await findDuplicatesAndConflicts();
    auditData.companyTypes = await analyzeCompanyTypes();

    console.log('\n' + '='.repeat(60));

    const recommendations = await generateRecommendations(auditData);

    // 生成报告
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      dataSources: auditData,
      qualityIssues: [],
      duplicates: auditData.duplicates.examples,
      recommendations,
    };

    const reportPath = '/Users/rabbit-y/firegrid/backend/scripts/data-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n💾 审计报告已保存到: ${reportPath}`);
    console.log('\n✅ 审计完成！\n');
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

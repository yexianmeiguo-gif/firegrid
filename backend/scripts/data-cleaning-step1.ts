import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * 数据清洗 - 第一步
 * 
 * 任务：
 * 1. 清理展会供应商名称（移除展台号）
 * 2. 提取展台号到独立字段
 * 3. 标准化公司名称（去除空格、特殊字符）
 * 4. 生成清洗后的数据
 */

interface CleanedCompany {
  originalName: string;
  cleanedName: string;
  booth?: string;
  source: 'manufacturer' | 'exhibition' | 'crawled';
  isManufacturer: boolean;
  isSupplier: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  productCount?: number;
}

/**
 * 清理公司名称
 */
function cleanCompanyName(name: string): { cleanedName: string; booth?: string } {
  if (!name) return { cleanedName: '' };

  let cleaned = name;
  let booth: string | undefined;

  // 1. 提取展台号（常见格式：W1-58, E3-72, OD5-04 等）
  const boothPatterns = [
    /\s+([WEOD]+\d+[-\/]\d+[A-Z]?(?:[-\/]\d+[A-Z]?)*)\s*$/i, // 末尾展台号
    /\s+([WEOD]+\d+[-]\d+[A-Z]?(?:[-\/]\d+[A-Z]?)*)\s+/i,     // 中间展台号
  ];

  for (const pattern of boothPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      booth = match[1].trim();
      cleaned = cleaned.replace(match[0], ' ').trim();
    }
  }

  // 2. 移除英文公司名称（通常在末尾）
  cleaned = cleaned.replace(/\s+[A-Z][a-zA-Z\s&.,()]+$/g, '').trim();

  // 3. 移除多余空格和特殊字符
  cleaned = cleaned.replace(/\s+/g, '');  // 移除所有空格
  cleaned = cleaned.replace(/[　\u3000]/g, '');  // 移除全角空格

  // 4. 移除常见的无意义后缀
  cleaned = cleaned.replace(/（.*?）$/, ''); // 移除括号内容
  cleaned = cleaned.replace(/\(.*?\)$/, '');

  return { cleanedName: cleaned, booth };
}

/**
 * 判断公司类型
 */
function inferCompanyType(name: string): { isManufacturer: boolean; isSupplier: boolean } {
  const lowerName = name.toLowerCase();

  // 制造商关键词
  const manufacturerKeywords = [
    '制造', '工厂', '科技', '股份', '集团', '重工', '装备',
    '机械', '电气', '设备', '技术', '研发',
  ];

  // 供应商关键词
  const supplierKeywords = ['贸易', '销售', '经销', '代理', '商贸'];

  const isManufacturer = manufacturerKeywords.some((kw) => lowerName.includes(kw));
  const isSupplier = supplierKeywords.some((kw) => lowerName.includes(kw));

  // 如果都不匹配，默认为供应商（展会供应商很多是销售方）
  if (!isManufacturer && !isSupplier) {
    return { isManufacturer: false, isSupplier: true };
  }

  return { isManufacturer, isSupplier };
}

/**
 * 清洗展会供应商数据
 */
async function cleanExhibitionSuppliers() {
  console.log('\n🏢 【1/4】清洗展会供应商数据...\n');

  const suppliers = await prisma.$queryRaw<
    Array<{
      company_name: string;
      booth: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      address: string | null;
    }>
  >`SELECT company_name, booth, phone, email, website, address FROM exhibition_suppliers`;

  const cleaned: CleanedCompany[] = [];

  for (const supplier of suppliers) {
    const { cleanedName, booth } = cleanCompanyName(supplier.company_name);
    const { isManufacturer, isSupplier } = inferCompanyType(cleanedName);

    cleaned.push({
      originalName: supplier.company_name,
      cleanedName,
      booth: booth || supplier.booth || undefined,
      source: 'exhibition',
      isManufacturer,
      isSupplier,
      contactInfo: {
        phone: supplier.phone || undefined,
        email: supplier.email || undefined,
        website: supplier.website || undefined,
        address: supplier.address || undefined,
      },
    });
  }

  console.log(`   原始数据: ${suppliers.length}`);
  console.log(`   清洗完成: ${cleaned.length}`);
  console.log(`   提取展台号: ${cleaned.filter((c) => c.booth).length}`);

  return cleaned;
}

/**
 * 清洗制造商数据
 */
async function cleanManufacturers() {
  console.log('\n🏭 【2/4】清洗制造商数据...\n');

  const manufacturers = await prisma.$queryRaw<
    Array<{ manufacturer: string; count: bigint }>
  >`
    SELECT manufacturer, COUNT(*) as count
    FROM equipment
    WHERE manufacturer IS NOT NULL
    GROUP BY manufacturer
  `;

  const cleaned: CleanedCompany[] = [];

  for (const mfr of manufacturers) {
    const { cleanedName } = cleanCompanyName(mfr.manufacturer);
    const { isManufacturer, isSupplier } = inferCompanyType(cleanedName);

    cleaned.push({
      originalName: mfr.manufacturer,
      cleanedName,
      source: 'manufacturer',
      isManufacturer: true, // 默认制造商
      isSupplier,
      productCount: Number(mfr.count),
    });
  }

  console.log(`   原始数据: ${manufacturers.length}`);
  console.log(`   清洗完成: ${cleaned.length}`);

  return cleaned;
}

/**
 * 去重合并
 */
function deduplicateCompanies(
  exhibitionCompanies: CleanedCompany[],
  manufacturerCompanies: CleanedCompany[]
): { unique: CleanedCompany[]; duplicates: Array<{ name: string; sources: string[] }> } {
  console.log('\n🔄 【3/4】去重合并...\n');

  const companyMap = new Map<string, CleanedCompany>();
  const duplicates: Array<{ name: string; sources: string[] }> = [];

  // 先处理制造商
  for (const company of manufacturerCompanies) {
    companyMap.set(company.cleanedName, company);
  }

  // 再处理展会供应商（合并或补充信息）
  for (const company of exhibitionCompanies) {
    const existing = companyMap.get(company.cleanedName);

    if (existing) {
      // 合并信息
      duplicates.push({
        name: company.cleanedName,
        sources: [existing.source, company.source],
      });

      // 更新为两者都是
      existing.isManufacturer = existing.isManufacturer || company.isManufacturer;
      existing.isSupplier = existing.isSupplier || company.isSupplier;

      // 补充联系信息（优先展会供应商的联系方式）
      if (!existing.contactInfo) {
        existing.contactInfo = company.contactInfo;
      } else {
        existing.contactInfo = {
          ...existing.contactInfo,
          ...company.contactInfo,
        };
      }

      // 补充展台号
      if (company.booth && !existing.booth) {
        existing.booth = company.booth;
      }
    } else {
      // 新公司
      companyMap.set(company.cleanedName, company);
    }
  }

  const unique = Array.from(companyMap.values());

  console.log(`   展会供应商: ${exhibitionCompanies.length}`);
  console.log(`   制造商: ${manufacturerCompanies.length}`);
  console.log(`   合计: ${exhibitionCompanies.length + manufacturerCompanies.length}`);
  console.log(`   去重后: ${unique.length}`);
  console.log(`   发现重复: ${duplicates.length} 家`);

  // 统计类型
  const manufacturerOnly = unique.filter((c) => c.isManufacturer && !c.isSupplier).length;
  const supplierOnly = unique.filter((c) => !c.isManufacturer && c.isSupplier).length;
  const both = unique.filter((c) => c.isManufacturer && c.isSupplier).length;

  console.log(`\n   类型分布:`);
  console.log(`      仅制造商: ${manufacturerOnly} 家`);
  console.log(`      仅供应商: ${supplierOnly} 家`);
  console.log(`      两者兼有: ${both} 家`);

  return { unique, duplicates };
}

/**
 * 生成待审核清单
 */
function generateReviewList(
  companies: CleanedCompany[],
  duplicates: Array<{ name: string; sources: string[] }>
) {
  console.log('\n📋 【4/4】生成待审核清单...\n');

  // 1. 需要人工审核的相似公司
  const fuzzyMatches: Array<{ company1: string; company2: string; similarity: number }> = [];

  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      const name1 = companies[i].cleanedName;
      const name2 = companies[j].cleanedName;

      // 简单相似度检查（包含关系）
      if (name1.includes(name2) || name2.includes(name1)) {
        const similarity = Math.min(name1.length, name2.length) / Math.max(name1.length, name2.length);
        if (similarity > 0.5) {
          fuzzyMatches.push({ company1: name1, company2: name2, similarity });
        }
      }
    }
  }

  console.log(`   发现模糊匹配: ${fuzzyMatches.length} 对`);
  console.log(`   需要审核的重复: ${duplicates.length} 家`);

  // 2. 类型不明确的公司
  const unclearType = companies.filter((c) => !c.isManufacturer && !c.isSupplier);
  console.log(`   类型不明确: ${unclearType.length} 家`);

  return {
    fuzzyMatches: fuzzyMatches.slice(0, 100), // 只保留前 100 对
    duplicates,
    unclearType: unclearType.slice(0, 50), // 只保留前 50 个
  };
}

async function main() {
  console.log('🚀 开始数据清洗（第一步）...\n');
  console.log('=' .repeat(60));

  try {
    // 1. 清洗展会供应商
    const cleanedExhibition = await cleanExhibitionSuppliers();

    // 2. 清洗制造商
    const cleanedManufacturers = await cleanManufacturers();

    // 3. 去重合并
    const { unique, duplicates } = deduplicateCompanies(cleanedExhibition, cleanedManufacturers);

    // 4. 生成待审核清单
    const reviewList = generateReviewList(unique, duplicates);

    console.log('\n' + '='.repeat(60));

    // 保存结果
    const outputDir = '/Users/rabbit-y/firegrid/backend/scripts/cleaned-data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 保存清洗后的公司数据
    fs.writeFileSync(
      `${outputDir}/companies-cleaned.json`,
      JSON.stringify(unique, null, 2)
    );

    // 保存待审核清单
    fs.writeFileSync(
      `${outputDir}/review-list.json`,
      JSON.stringify(reviewList, null, 2)
    );

    // 生成统计报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCompanies: unique.length,
        manufacturers: unique.filter((c) => c.isManufacturer).length,
        suppliers: unique.filter((c) => c.isSupplier).length,
        both: unique.filter((c) => c.isManufacturer && c.isSupplier).length,
        withContact: unique.filter((c) => c.contactInfo?.phone || c.contactInfo?.email).length,
        withWebsite: unique.filter((c) => c.contactInfo?.website).length,
      },
      issues: {
        duplicates: duplicates.length,
        fuzzyMatches: reviewList.fuzzyMatches.length,
        unclearType: reviewList.unclearType.length,
      },
    };

    fs.writeFileSync(
      `${outputDir}/cleaning-report.json`,
      JSON.stringify(report, null, 2)
    );

    console.log(`\n✅ 清洗完成！\n`);
    console.log(`📊 统计:`);
    console.log(`   总公司数: ${report.summary.totalCompanies}`);
    console.log(`   制造商: ${report.summary.manufacturers}`);
    console.log(`   供应商: ${report.summary.suppliers}`);
    console.log(`   两者兼有: ${report.summary.both}`);
    console.log(`   有联系方式: ${report.summary.withContact}`);
    console.log(`   有网址: ${report.summary.withWebsite}`);
    console.log(`\n⚠️  需要审核:`);
    console.log(`   重复公司: ${report.issues.duplicates}`);
    console.log(`   模糊匹配: ${report.issues.fuzzyMatches}`);
    console.log(`   类型不明确: ${report.issues.unclearType}`);
    console.log(`\n💾 文件已保存到: ${outputDir}/`);
    console.log(`   - companies-cleaned.json (清洗后的公司数据)`);
    console.log(`   - review-list.json (待审核清单)`);
    console.log(`   - cleaning-report.json (统计报告)`);
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

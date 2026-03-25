import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

/**
 * 导出典型数据样本到 Excel
 */

async function exportSampleData() {
  console.log('📊 开始导出数据样本...\n');

  // 1. 公司数据样本
  console.log('🏢 【1/3】导出公司数据样本...');

  const companySamples = await prisma.$queryRaw<
    Array<{
      name: string;
      is_manufacturer: boolean;
      is_supplier: boolean;
      partnership_status: string;
      partnership_level: number;
      contact_phone: string | null;
      contact_email: string | null;
      website: string | null;
      address: string | null;
      exhibition_booth: string | null;
      source: string;
      product_count: number;
    }>
  >`
    SELECT 
      name, 
      is_manufacturer, 
      is_supplier, 
      partnership_status, 
      partnership_level,
      contact_phone, 
      contact_email, 
      website, 
      address,
      exhibition_booth,
      source,
      product_count
    FROM companies
    WHERE 
      -- 抽取不同类型的公司
      (is_manufacturer = true AND is_supplier = false) OR  -- 仅制造商
      (is_supplier = true AND is_manufacturer = false) OR  -- 仅供应商
      (is_manufacturer = true AND is_supplier = true) OR   -- 两者兼有
      (source = 'crawled')                                -- 爬取的供应商
    ORDER BY 
      partnership_level DESC,
      product_count DESC,
      source
    LIMIT 50
  `;

  console.log(`   导出 ${companySamples.length} 家公司样本`);

  // 转换为表格格式
  const companyData = companySamples.map((c) => ({
    公司名称: c.name,
    制造商: c.is_manufacturer ? '是' : '否',
    供应商: c.is_supplier ? '是' : '否',
    合作状态: c.partnership_status === 'exhibition' ? '展会商' : c.partnership_status === 'partner' ? '合作商' : c.partnership_status === 'subscriber' ? '订阅商' : '普通',
    优先级: c.partnership_level,
    电话: c.contact_phone || '',
    邮箱: c.contact_email || '',
    官网: c.website || '',
    地址: c.address || '',
    展台号: c.exhibition_booth || '',
    数据来源: c.source === 'manufacturer' ? '制造商' : c.source === 'exhibition' ? '展会' : c.source === 'crawled' ? '爬取' : c.source,
    产品数量: c.product_count,
  }));

  // 2. 产品数据样本
  console.log('📦 【2/3】导出产品数据样本...');

  const productSamples = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      manufacturer: string;
      category: string;
      sub_category: string | null;
      standards: string[] | null;
      applications: string[] | null;
      scenario_tags: string[] | null;
      parameters: any;
      images: string[] | null;
    }>
  >`
    SELECT 
      id,
      name,
      manufacturer,
      category,
      sub_category,
      standards,
      applications,
      scenario_tags,
      parameters,
      images
    FROM equipment
    ORDER BY 
      CASE 
        WHEN category = 'fire-truck' THEN 1
        WHEN category = 'rescue-equipment' THEN 2
        WHEN category = 'fire-extinguisher' THEN 3
        WHEN category = 'protective-equipment' THEN 4
        ELSE 5
      END,
      RANDOM()
    LIMIT 50
  `;

  console.log(`   导出 ${productSamples.length} 个产品样本`);

  const productData = productSamples.map((p) => ({
    产品ID: p.id,
    产品名称: p.name,
    制造商: p.manufacturer,
    分类: p.category,
    子分类: p.sub_category || '',
    国家标准: p.standards ? p.standards.join('; ') : '',
    应用场景: p.applications ? p.applications.join('; ') : '',
    场景标签: p.scenario_tags ? p.scenario_tags.join('; ') : '',
    参数数量: p.parameters ? Object.keys(p.parameters).length : 0,
    图片数量: p.images ? p.images.length : 0,
    主要参数: p.parameters ? JSON.stringify(p.parameters).substring(0, 100) + '...' : '',
  }));

  // 3. 产品-供应商关联样本
  console.log('🔗 【3/3】导出产品-供应商关联样本...');

  const linkSamples = await prisma.$queryRaw<
    Array<{
      product_name: string;
      supplier_name: string;
      supplier_type: string;
      priority: number;
      partnership_status: string;
      is_available: boolean;
    }>
  >`
    SELECT 
      e.name as product_name,
      c.name as supplier_name,
      es.supplier_type,
      es.priority,
      c.partnership_status,
      es.is_available
    FROM equipment_suppliers es
    JOIN equipment e ON es.equipment_id = e.id
    JOIN companies c ON es.supplier_id = c.id
    ORDER BY 
      es.priority DESC,
      e.name
    LIMIT 50
  `;

  console.log(`   导出 ${linkSamples.length} 条关联样本`);

  const linkData = linkSamples.map((l) => ({
    产品名称: l.product_name,
    供应商名称: l.supplier_name,
    供应商类型: l.supplier_type === 'manufacturer' ? '制造商' : l.supplier_type === 'reseller' ? '经销商' : l.supplier_type === 'agent' ? '代理商' : l.supplier_type,
    优先级: l.priority,
    合作状态: l.partnership_status === 'exhibition' ? '展会商' : l.partnership_status === 'partner' ? '合作商' : l.partnership_status === 'subscriber' ? '订阅商' : '普通',
    是否可用: l.is_available ? '是' : '否',
  }));

  // 创建 Excel 工作簿
  console.log('\n📝 生成 Excel 文件...');

  const workbook = XLSX.utils.book_new();

  // 添加公司数据表
  const companySheet = XLSX.utils.json_to_sheet(companyData);
  XLSX.utils.book_append_sheet(workbook, companySheet, '公司数据');

  // 添加产品数据表
  const productSheet = XLSX.utils.json_to_sheet(productData);
  XLSX.utils.book_append_sheet(workbook, productSheet, '产品数据');

  // 添加关联数据表
  const linkSheet = XLSX.utils.json_to_sheet(linkData);
  XLSX.utils.book_append_sheet(workbook, linkSheet, '产品-供应商关联');

  // 保存文件
  const outputPath = '/Users/rabbit-y/firegrid/backend/scripts/FireGrid数据样本.xlsx';
  XLSX.writeFile(workbook, outputPath);

  console.log(`\n✅ Excel 文件已生成！`);
  console.log(`📁 文件路径: ${outputPath}`);
  console.log(`\n📊 包含数据:`);
  console.log(`   - 公司数据: ${companyData.length} 条`);
  console.log(`   - 产品数据: ${productData.length} 条`);
  console.log(`   - 关联数据: ${linkData.length} 条`);
}

async function main() {
  try {
    await exportSampleData();
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

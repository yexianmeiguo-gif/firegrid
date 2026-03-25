import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * 导入爬取供应商数据（79 家推荐导入的新公司）
 */

interface CrawledSupplier {
  company_name: string;
  url?: string;
  status: string;
  product_count?: number;
  image_count?: number;
  products?: Array<{
    name?: string;
    specs?: string;
    imgs?: number | string;
    text?: string;
    url?: string;
  }>;
}

async function importCrawledSuppliers() {
  console.log('🚀 开始导入爬取供应商数据...\n');
  console.log('=' .repeat(60));

  const jsonPath = '/Users/rabbit-y/firegrid/backend/scripts/crawled-suppliers-importable.json';
  const suppliers: CrawledSupplier[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`\n📊 读取到 ${suppliers.length} 家推荐导入的供应商\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const supplier of suppliers) {
    try {
      // 清理公司名称
      const cleanedName = supplier.company_name.trim();

      // 插入 companies 表
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO companies 
          (name, is_manufacturer, is_supplier, partnership_status, partnership_level, 
           website, source, product_count)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (name) DO UPDATE SET
          website = COALESCE(EXCLUDED.website, companies.website),
          product_count = COALESCE(EXCLUDED.product_count, companies.product_count),
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
        `,
        cleanedName,
        false, // 爬取数据默认不是制造商
        true,  // 爬取数据默认是供应商
        'none', // 普通供应商
        0,      // 优先级 0
        supplier.url || null,
        'crawled',
        supplier.products?.length || 0
      );

      successCount++;

      if (successCount <= 10) {
        console.log(`✅ ${successCount}. ${cleanedName}`);
        if (supplier.url) {
          console.log(`   官网: ${supplier.url}`);
        }
        if (supplier.products && supplier.products.length > 0) {
          console.log(`   产品数: ${supplier.products.length}`);
        }
      } else if (successCount % 20 === 0) {
        console.log(`✅ 已导入 ${successCount} 家供应商...`);
      }
    } catch (error: any) {
      if (error.code === '23505') {
        skipCount++;
      } else {
        console.error(`❌ 导入失败: ${supplier.company_name}`);
        console.error(`   错误: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ 导入完成！\n');
  console.log(`📊 统计:`);
  console.log(`   成功导入: ${successCount}`);
  console.log(`   跳过重复: ${skipCount}`);
  console.log(`   导入失败: ${errorCount}`);

  // 验证结果
  const totalCount = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM companies
  `;
  console.log(`\n✅ 数据库中共有 ${totalCount[0].count} 家公司`);

  const crawledCount = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM companies WHERE source = 'crawled'
  `;
  console.log(`   其中爬取供应商: ${crawledCount[0].count} 家\n`);

  // 统计供应商类型
  const stats = await prisma.$queryRaw<
    [
      {
        total: bigint;
        manufacturers: bigint;
        suppliers: bigint;
        both: bigint;
        exhibition: bigint;
        crawled: bigint;
        partners: bigint;
      }
    ]
  >`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_manufacturer = true AND is_supplier = false THEN 1 END) as manufacturers,
      COUNT(CASE WHEN is_supplier = true AND is_manufacturer = false THEN 1 END) as suppliers,
      COUNT(CASE WHEN is_manufacturer = true AND is_supplier = true THEN 1 END) as both,
      COUNT(CASE WHEN partnership_status = 'exhibition' THEN 1 END) as exhibition,
      COUNT(CASE WHEN source = 'crawled' THEN 1 END) as crawled,
      COUNT(CASE WHEN partnership_status IN ('partner', 'subscriber') THEN 1 END) as partners
    FROM companies
  `;

  console.log(`📊 公司类型分布:`);
  console.log(`   总公司数: ${Number(stats[0].total)}`);
  console.log(`   制造商: ${Number(stats[0].manufacturers)}`);
  console.log(`   供应商: ${Number(stats[0].suppliers)}`);
  console.log(`   两者兼有: ${Number(stats[0].both)}`);
  console.log(`\n📊 数据来源:`);
  console.log(`   展会商: ${Number(stats[0].exhibition)}`);
  console.log(`   爬取商: ${Number(stats[0].crawled)}`);
  console.log(`   合作商/订阅商: ${Number(stats[0].partners)}`);
}

async function main() {
  try {
    await importCrawledSuppliers();
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

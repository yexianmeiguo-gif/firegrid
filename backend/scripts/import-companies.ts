import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * 导入清洗后的公司数据到 companies 表
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

async function importCompanies() {
  console.log('🚀 开始导入公司数据...\n');

  const jsonPath = '/Users/rabbit-y/firegrid/backend/scripts/cleaned-data/companies-cleaned.json';
  const companies: CleanedCompany[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`📊 读取到 ${companies.length} 家公司\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const company of companies) {
    try {
      // 确定合作状态和优先级
      let partnershipStatus = 'none';
      let partnershipLevel = 0;

      if (company.source === 'exhibition') {
        partnershipStatus = 'exhibition';
        partnershipLevel = 10; // 展会商优先级 10
      }

      // 插入数据库
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO companies 
          (name, is_manufacturer, is_supplier, partnership_status, partnership_level, 
           contact_phone, contact_email, website, address, exhibition_booth, exhibition_year, source)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (name) DO UPDATE SET
          is_manufacturer = EXCLUDED.is_manufacturer OR companies.is_manufacturer,
          is_supplier = EXCLUDED.is_supplier OR companies.is_supplier,
          partnership_status = COALESCE(NULLIF(EXCLUDED.partnership_status, 'none'), companies.partnership_status),
          partnership_level = GREATEST(EXCLUDED.partnership_level, companies.partnership_level),
          contact_phone = COALESCE(EXCLUDED.contact_phone, companies.contact_phone),
          contact_email = COALESCE(EXCLUDED.contact_email, companies.contact_email),
          website = COALESCE(EXCLUDED.website, companies.website),
          address = COALESCE(EXCLUDED.address, companies.address),
          exhibition_booth = COALESCE(EXCLUDED.exhibition_booth, companies.exhibition_booth),
          updated_at = CURRENT_TIMESTAMP
        `,
        company.cleanedName,
        company.isManufacturer,
        company.isSupplier,
        partnershipStatus,
        partnershipLevel,
        company.contactInfo?.phone || null,
        company.contactInfo?.email || null,
        company.contactInfo?.website || null,
        company.contactInfo?.address || null,
        company.booth || null,
        company.source === 'exhibition' ? 2025 : null,
        company.source
      );

      successCount++;

      if (successCount <= 10) {
        console.log(`✅ ${successCount}. ${company.cleanedName}`);
      } else if (successCount % 100 === 0) {
        console.log(`✅ 已导入 ${successCount} 家公司...`);
      }
    } catch (error: any) {
      if (error.code === '23505') {
        skipCount++;
      } else {
        console.error(`❌ 导入失败: ${company.cleanedName}`);
        console.error(`   错误: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n==================================');
  console.log('✅ 导入完成！\n');
  console.log(`📊 统计:`);
  console.log(`   成功导入: ${successCount}`);
  console.log(`   跳过重复: ${skipCount}`);
  console.log(`   导入失败: ${errorCount}`);
  console.log('==================================\n');

  // 验证数据
  const totalCount = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM companies
  `;
  console.log(`✅ 数据库中共有 ${totalCount[0].count} 家公司\n`);

  // 统计数据完整性
  const stats = await prisma.$queryRaw<
    [
      {
        manufacturers: bigint;
        suppliers: bigint;
        both: bigint;
        with_phone: bigint;
        with_email: bigint;
        with_website: bigint;
        exhibition: bigint;
      }
    ]
  >`
    SELECT 
      COUNT(CASE WHEN is_manufacturer = true AND is_supplier = false THEN 1 END) as manufacturers,
      COUNT(CASE WHEN is_supplier = true AND is_manufacturer = false THEN 1 END) as suppliers,
      COUNT(CASE WHEN is_manufacturer = true AND is_supplier = true THEN 1 END) as both,
      COUNT(CASE WHEN contact_phone IS NOT NULL THEN 1 END) as with_phone,
      COUNT(CASE WHEN contact_email IS NOT NULL THEN 1 END) as with_email,
      COUNT(CASE WHEN website IS NOT NULL THEN 1 END) as with_website,
      COUNT(CASE WHEN partnership_status = 'exhibition' THEN 1 END) as exhibition
    FROM companies
  `;

  const total = Number(totalCount[0].count);
  console.log(`📊 公司类型分布:`);
  console.log(`   仅制造商: ${Number(stats[0].manufacturers)}`);
  console.log(`   仅供应商: ${Number(stats[0].suppliers)}`);
  console.log(`   两者兼有: ${Number(stats[0].both)}`);
  console.log(`\n📊 数据完整性:`);
  console.log(`   电话: ${Number(stats[0].with_phone)}/${total} (${((Number(stats[0].with_phone) / total) * 100).toFixed(1)}%)`);
  console.log(`   邮箱: ${Number(stats[0].with_email)}/${total} (${((Number(stats[0].with_email) / total) * 100).toFixed(1)}%)`);
  console.log(`   网址: ${Number(stats[0].with_website)}/${total} (${((Number(stats[0].with_website) / total) * 100).toFixed(1)}%)`);
  console.log(`\n📊 合作状态:`);
  console.log(`   展会商: ${Number(stats[0].exhibition)}`);
}

async function main() {
  try {
    await importCompanies();
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

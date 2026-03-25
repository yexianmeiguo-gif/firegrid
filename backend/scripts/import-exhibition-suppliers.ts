import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * 导入展会供应商数据到数据库
 */

interface ExhibitionSupplier {
  company_name: string;
  booth?: string;
  address?: string;
  postcode?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  products?: string;
}

async function importExhibitionSuppliers() {
  console.log('🚀 开始导入展会供应商数据...\n');

  // 读取 JSON 数据
  const jsonPath = '/Users/rabbit-y/firegrid/backend/scripts/exhibition-suppliers.json';
  const suppliers: ExhibitionSupplier[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`📊 读取到 ${suppliers.length} 家供应商\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const supplier of suppliers) {
    try {
      // 数据清洗
      const cleanedSupplier = {
        companyName: supplier.company_name.trim(),
        booth: supplier.booth?.trim() || null,
        address: supplier.address?.trim() || null,
        postcode: supplier.postcode?.trim() || null,
        phone: supplier.phone?.trim() || null,
        fax: supplier.fax?.trim() || null,
        email: supplier.email?.trim().toLowerCase() || null,
        website: supplier.website?.trim() || null,
        contactPerson: supplier.contact_person?.trim() || null,
        products: supplier.products?.trim() || null,
        source: 'FIRE_2025',
      };

      // 插入数据库
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO exhibition_suppliers 
          (company_name, booth, address, postcode, phone, fax, email, website, contact_person, products, source)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (company_name) DO UPDATE SET
          booth = COALESCE(EXCLUDED.booth, exhibition_suppliers.booth),
          address = COALESCE(EXCLUDED.address, exhibition_suppliers.address),
          postcode = COALESCE(EXCLUDED.postcode, exhibition_suppliers.postcode),
          phone = COALESCE(EXCLUDED.phone, exhibition_suppliers.phone),
          fax = COALESCE(EXCLUDED.fax, exhibition_suppliers.fax),
          email = COALESCE(EXCLUDED.email, exhibition_suppliers.email),
          website = COALESCE(EXCLUDED.website, exhibition_suppliers.website),
          contact_person = COALESCE(EXCLUDED.contact_person, exhibition_suppliers.contact_person),
          products = COALESCE(EXCLUDED.products, exhibition_suppliers.products),
          updated_at = CURRENT_TIMESTAMP
        `,
        cleanedSupplier.companyName,
        cleanedSupplier.booth,
        cleanedSupplier.address,
        cleanedSupplier.postcode,
        cleanedSupplier.phone,
        cleanedSupplier.fax,
        cleanedSupplier.email,
        cleanedSupplier.website,
        cleanedSupplier.contactPerson,
        cleanedSupplier.products,
        cleanedSupplier.source
      );

      successCount++;

      if (successCount <= 10) {
        console.log(`✅ ${successCount}. ${cleanedSupplier.companyName}`);
      } else if (successCount % 100 === 0) {
        console.log(`✅ 已导入 ${successCount} 家供应商...`);
      }
    } catch (error: any) {
      if (error.code === '23505') {
        // 唯一约束冲突（重复）
        skipCount++;
      } else {
        console.error(`❌ 导入失败: ${supplier.company_name}`);
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
    SELECT COUNT(*) as count FROM exhibition_suppliers
  `;
  console.log(`✅ 数据库中共有 ${totalCount[0].count} 家展会供应商\n`);

  // 统计数据完整性
  const stats = await prisma.$queryRaw<
    [
      {
        with_phone: bigint;
        with_email: bigint;
        with_website: bigint;
        with_booth: bigint;
      }
    ]
  >`
    SELECT 
      COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
      COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
      COUNT(CASE WHEN website IS NOT NULL THEN 1 END) as with_website,
      COUNT(CASE WHEN booth IS NOT NULL THEN 1 END) as with_booth
    FROM exhibition_suppliers
  `;

  const total = Number(totalCount[0].count);
  console.log(`📊 数据完整性:`);
  console.log(`   电话: ${Number(stats[0].with_phone)}/${total} (${((Number(stats[0].with_phone) / total) * 100).toFixed(1)}%)`);
  console.log(`   邮箱: ${Number(stats[0].with_email)}/${total} (${((Number(stats[0].with_email) / total) * 100).toFixed(1)}%)`);
  console.log(`   网址: ${Number(stats[0].with_website)}/${total} (${((Number(stats[0].with_website) / total) * 100).toFixed(1)}%)`);
  console.log(`   展台号: ${Number(stats[0].with_booth)}/${total} (${((Number(stats[0].with_booth) / total) * 100).toFixed(1)}%)`);
}

async function main() {
  try {
    await importExhibitionSuppliers();
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

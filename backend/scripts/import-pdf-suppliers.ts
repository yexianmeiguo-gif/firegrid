/**
 * 导入 PDF 提取的优质供应商数据
 * - 导入 163 家优质供应商（good-suppliers.json）
 * - 导入产品数据
 * - 建立产品-供应商关联
 * - 图片路径暂存本地
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// 数据库连接配置（使用本地 PostgreSQL）
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'firegrid_dev',
  user: 'rabbit-y'
});

// 数据源路径
const GOOD_SUPPLIERS_PATH = '/Users/rabbit-y/firegrid/backend/scripts/pdf-audit-results/good-suppliers.json';
const BASE_PATH = '/Users/rabbit-y/Documents/消防装备供应商资料/供应商产品数据';

interface Product {
  name: string;
  source_url: string;
  images: { filename: string; size: number }[];
  specs?: string;  // PDF 提取的原始数据使用 specs 字段
}

interface Supplier {
  name: string;
  path: string;
  product_count: number;
  image_count: number;
  total_size: number;
  has_specs: boolean;
  products: Product[];
}

async function main() {
  console.log('🚀 开始导入 PDF 提取的优质供应商数据...\n');
  console.log('=' .repeat(60));

  // 1. 读取优质供应商数据
  const suppliers: Supplier[] = JSON.parse(fs.readFileSync(GOOD_SUPPLIERS_PATH, 'utf-8'));

  console.log(`\n📂 发现 ${suppliers.length} 家优质供应商\n`);

  let importedCompanies = 0;
  let skippedCompanies = 0;
  let importedProducts = 0;
  let skippedProducts = 0;
  let importedRelations = 0;

  // 2. 逐个导入供应商
  for (let i = 0; i < suppliers.length; i++) {
    const supplier = suppliers[i];
    console.log(`\n📦 [${i + 1}/${suppliers.length}] 处理供应商: ${supplier.name}`);

    try {
      // 2.1 检查公司是否已存在
      const existingCompany = await pool.query(
        'SELECT id FROM companies WHERE name = $1',
        [supplier.name]
      );

      let companyId: number;

      if (existingCompany.rows.length > 0) {
        // 公司已存在，更新产品数量
        companyId = existingCompany.rows[0].id;
        console.log(`   ⚠️  公司已存在 (ID: ${companyId})，更新产品数量...`);
        
        await pool.query(
          `UPDATE companies 
           SET product_count = GREATEST(product_count, $1),
               updated_at = NOW()
           WHERE id = $2`,
          [supplier.product_count, companyId]
        );
        
        skippedCompanies++;
      } else {
        // 新公司，插入
        const companyResult = await pool.query(
          `INSERT INTO companies (
            name, product_count, 
            partnership_status, partnership_level, priority,
            data_source, created_at, updated_at
          ) VALUES ($1, $2, 'none', 0, 0, 'pdf_extraction', NOW(), NOW())
          RETURNING id`,
          [supplier.name, supplier.product_count]
        );
        
        companyId = companyResult.rows[0].id;
        console.log(`   ✅ 公司导入成功 (ID: ${companyId})`);
        importedCompanies++;
      }

      // 2.2 导入产品
      for (const product of supplier.products) {
        try {
          // 检查产品是否已存在（按名称和制造商去重）
          const existingProduct = await pool.query(
            'SELECT id FROM equipment WHERE name = $1 AND manufacturer = $2',
            [product.name, supplier.name]
          );

          let productId: string;

          if (existingProduct.rows.length > 0) {
            // 产品已存在，跳过
            productId = existingProduct.rows[0].id;
            console.log(`   ⏭️  产品已存在: ${product.name.substring(0, 30)}...`);
            skippedProducts++;
          } else {
            // 新产品，插入
            // 生成产品 ID（使用时间戳 + 随机字符串）
            productId = `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // 清理产品名称（移除不必要的后缀）
            let cleanName = product.name
              .replace(/-产品中心.*$/, '')
              .replace(/-智慧消防.*$/, '')
              .replace(/\.+$/, '')  // 移除尾部多余的点号
              .trim();

            // 限制产品名称长度（最多 200 字符）
            if (cleanName.length > 200) {
              cleanName = cleanName.substring(0, 197) + '...';
            }

            // 确保产品名称不为空
            if (cleanName.length < 2) {
              console.log(`   ⚠️  产品名称无效: "${product.name}"，跳过`);
              skippedProducts++;
              continue;
            }

            // 构建产品参数（JSONB）
            const parameters: any = {};
            // JSON 中字段名是 specs，不是 raw_specs
            const specs = (product as any).specs || '';
            if (specs && specs.trim().length > 0) {
              // 限制 raw_specs 长度（最多 1000 字符）
              const rawSpecs = specs.length > 1000 
                ? specs.substring(0, 997) + '...'
                : specs;
              parameters.raw_specs = rawSpecs;
            }

            // 构建图片 URL 列表（本地路径）
            const images = product.images.map(img => {
              return `${supplier.path}/images/${img.filename}`;
            });

            // 插入产品（注意：parameters 需要作为 JSONB 类型传入）
            await pool.query(
              `INSERT INTO equipment (
                id, name, manufacturer, category,
                images, parameters,
                manufacturer_id,
                created_at, updated_at
              ) VALUES ($1, $2, $3, 'other', $4, $5::jsonb, $6, NOW(), NOW())`,
              [
                productId,
                cleanName,
                supplier.name,
                images,  // ✅ 直接传入数组，让 pg 驱动自动转换为 PostgreSQL 数组
                JSON.stringify(parameters),  // 参数（将被 cast 为 JSONB）
                companyId  // 制造商 ID
              ]
            );

            console.log(`   ✅ 产品导入成功: ${cleanName.substring(0, 30)}...`);
            importedProducts++;
          }

          // 2.3 建立产品-供应商关联
          const existingRelation = await pool.query(
            'SELECT * FROM equipment_suppliers WHERE equipment_id = $1 AND supplier_id = $2',
            [productId, companyId]
          );

          if (existingRelation.rows.length === 0) {
            await pool.query(
              `INSERT INTO equipment_suppliers (
                equipment_id, supplier_id, priority, supplier_type,
                created_at, updated_at
              ) VALUES ($1, $2, 0, 'manufacturer', NOW(), NOW())`,
              [productId, companyId]
            );
            importedRelations++;
          }

        } catch (productError: any) {
          console.error(`   ❌ 产品导入失败: ${product.name.substring(0, 30)}...`);
          console.error(`      错误: ${productError.message}`);
          skippedProducts++;
        }
      }

    } catch (error: any) {
      console.error(`   ❌ 供应商导入失败: ${supplier.name}`);
      console.error(`      错误: ${error.message}`);
      skippedCompanies++;
    }

    // 每处理 20 家供应商输出一次统计
    if ((i + 1) % 20 === 0) {
      console.log('\n' + '='.repeat(60));
      console.log(`📊 中间统计 (${i + 1}/${suppliers.length})`);
      console.log(`   导入公司: ${importedCompanies} 家`);
      console.log(`   跳过公司: ${skippedCompanies} 家`);
      console.log(`   导入产品: ${importedProducts} 个`);
      console.log(`   跳过产品: ${skippedProducts} 个`);
      console.log(`   导入关联: ${importedRelations} 条`);
      console.log('='.repeat(60));
    }
  }

  // 3. 输出最终统计
  console.log('\n' + '='.repeat(60));
  console.log('🎉 导入完成！\n');
  console.log('📊 最终统计：\n');
  console.log(`   ✅ 导入公司: ${importedCompanies} 家`);
  console.log(`   ⏭️  跳过公司: ${skippedCompanies} 家（已存在）`);
  console.log(`   ✅ 导入产品: ${importedProducts} 个`);
  console.log(`   ⏭️  跳过产品: ${skippedProducts} 个（已存在或无效）`);
  console.log(`   ✅ 导入关联: ${importedRelations} 条`);
  console.log('='.repeat(60));

  // 4. 查询最新数据库状态
  const companiesCount = await pool.query('SELECT COUNT(*) FROM companies');
  const equipmentCount = await pool.query('SELECT COUNT(*) FROM equipment');
  const relationsCount = await pool.query('SELECT COUNT(*) FROM equipment_suppliers');

  console.log('\n📊 数据库当前状态：\n');
  console.log(`   公司总数: ${companiesCount.rows[0].count}`);
  console.log(`   产品总数: ${equipmentCount.rows[0].count}`);
  console.log(`   关联总数: ${relationsCount.rows[0].count}`);
  console.log('='.repeat(60));

  await pool.end();
}

main().catch(error => {
  console.error('❌ 导入失败:', error);
  process.exit(1);
});

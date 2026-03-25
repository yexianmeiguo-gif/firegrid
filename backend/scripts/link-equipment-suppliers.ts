import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 建立产品-供应商关联
 * 
 * 规则：
 * 1. 每个产品关联其制造商（作为主供应商）
 * 2. 自动计算优先级（展会商 = 10, 普通 = 0）
 * 3. 更新 equipment.manufacturer_id 和 primary_supplier_id
 */

async function linkEquipmentToSuppliers() {
  console.log('🚀 开始建立产品-供应商关联...\n');

  // 1. 更新 equipment 表的 manufacturer_id
  console.log('📦 【1/3】更新产品表的制造商外键...\n');

  const updateResult = await prisma.$executeRaw`
    UPDATE equipment e
    SET manufacturer_id = c.id
    FROM companies c
    WHERE e.manufacturer = c.name
      AND c.is_manufacturer = true
      AND e.manufacturer_id IS NULL
  `;

  console.log(`   更新了 ${updateResult} 个产品的 manufacturer_id\n`);

  // 2. 为每个产品创建与制造商的关联
  console.log('🔗 【2/3】创建产品-制造商关联（equipment_suppliers）...\n');

  const linkResult = await prisma.$executeRaw`
    INSERT INTO equipment_suppliers (equipment_id, supplier_id, supplier_type, priority, is_available)
    SELECT 
      e.id,
      c.id,
      'manufacturer',
      CASE 
        WHEN c.partnership_status = 'partner' THEN 100
        WHEN c.partnership_status = 'subscriber' THEN 50
        WHEN c.partnership_status = 'exhibition' THEN 10
        ELSE 0
      END,
      true
    FROM equipment e
    JOIN companies c ON e.manufacturer = c.name
    WHERE c.is_manufacturer = true
    ON CONFLICT (equipment_id, supplier_id) DO NOTHING
  `;

  console.log(`   创建了 ${linkResult} 条产品-供应商关联\n`);

  // 3. 更新 primary_supplier_id（选择优先级最高的供应商）
  console.log('⭐ 【3/3】设置主供应商（primary_supplier_id）...\n');

  const primaryResult = await prisma.$executeRaw`
    UPDATE equipment e
    SET primary_supplier_id = sub.supplier_id
    FROM (
      SELECT DISTINCT ON (equipment_id) 
        equipment_id, 
        supplier_id
      FROM equipment_suppliers
      ORDER BY equipment_id, priority DESC, created_at ASC
    ) sub
    WHERE e.id = sub.equipment_id
      AND e.primary_supplier_id IS NULL
  `;

  console.log(`   更新了 ${primaryResult} 个产品的 primary_supplier_id\n`);

  // 验证结果
  console.log('=' .repeat(60));
  console.log('\n✅ 关联完成！验证数据...\n');

  const stats = await prisma.$queryRaw<
    [
      {
        total_equipment: bigint;
        with_manufacturer_id: bigint;
        with_primary_supplier: bigint;
        total_links: bigint;
        avg_suppliers_per_product: number;
      }
    ]
  >`
    SELECT 
      (SELECT COUNT(*) FROM equipment) as total_equipment,
      (SELECT COUNT(*) FROM equipment WHERE manufacturer_id IS NOT NULL) as with_manufacturer_id,
      (SELECT COUNT(*) FROM equipment WHERE primary_supplier_id IS NOT NULL) as with_primary_supplier,
      (SELECT COUNT(*) FROM equipment_suppliers) as total_links,
      (SELECT ROUND(AVG(supplier_count), 2) 
       FROM (
         SELECT equipment_id, COUNT(*) as supplier_count 
         FROM equipment_suppliers 
         GROUP BY equipment_id
       ) sub
      ) as avg_suppliers_per_product
  `;

  console.log(`📊 统计:`);
  console.log(`   总产品数: ${Number(stats[0].total_equipment)}`);
  console.log(`   有制造商ID: ${Number(stats[0].with_manufacturer_id)} (${((Number(stats[0].with_manufacturer_id) / Number(stats[0].total_equipment)) * 100).toFixed(1)}%)`);
  console.log(`   有主供应商: ${Number(stats[0].with_primary_supplier)} (${((Number(stats[0].with_primary_supplier) / Number(stats[0].total_equipment)) * 100).toFixed(1)}%)`);
  console.log(`   总关联数: ${Number(stats[0].total_links)}`);
  console.log(`   平均每个产品关联供应商数: ${stats[0].avg_suppliers_per_product}`);

  // 展示几个示例
  console.log(`\n📋 示例（前 5 个产品的供应商）:\n`);

  const examples = await prisma.$queryRaw<
    Array<{
      product_name: string;
      supplier_name: string;
      supplier_type: string;
      priority: number;
      partnership_status: string;
    }>
  >`
    SELECT 
      e.name as product_name,
      c.name as supplier_name,
      es.supplier_type,
      es.priority,
      c.partnership_status
    FROM equipment e
    JOIN equipment_suppliers es ON e.id = es.equipment_id
    JOIN companies c ON es.supplier_id = c.id
    WHERE e.id IN (
      SELECT id FROM equipment LIMIT 5
    )
    ORDER BY e.name, es.priority DESC
  `;

  let currentProduct = '';
  examples.forEach((ex) => {
    if (ex.product_name !== currentProduct) {
      console.log(`\n   产品: ${ex.product_name}`);
      currentProduct = ex.product_name;
    }
    const badge =
      ex.partnership_status === 'partner'
        ? '🏆 合作商'
        : ex.partnership_status === 'subscriber'
          ? '⭐ 订阅商'
          : ex.partnership_status === 'exhibition'
            ? '📋 展会商'
            : '普通供应商';
    console.log(`      ├─ ${badge} ${ex.supplier_name} (优先级: ${ex.priority})`);
  });

  console.log('\n');
}

async function main() {
  try {
    await linkEquipmentToSuppliers();
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

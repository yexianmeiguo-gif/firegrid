import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 步骤 1: 修复 sub_category（将车辆型号移到参数中）
 */
async function fixSubCategories() {
  console.log('🔧 修复 sub_category...\n');

  const vehicleModelPattern = /^[A-Z]{2,5}\d{4}[A-Z]+\d+/;
  
  const equipment = await prisma.equipment.findMany({
    where: {
      subCategory: {
        not: null,
      },
    },
  });

  let fixedCount = 0;

  for (const item of equipment) {
    if (!item.subCategory) continue;

    // 如果 sub_category 是车辆型号
    if (vehicleModelPattern.test(item.subCategory)) {
      // 将车辆型号移到 parameters.vehicleModel
      const currentParams = (item.parameters as Record<string, any>) || {};
      const newParams = {
        ...currentParams,
        vehicleModel: item.subCategory,
      };

      // 根据产品名称推断正确的 sub_category
      let newSubCategory: string | null = null;

      if (item.name.includes('水罐')) {
        newSubCategory = 'water-tanker';
      } else if (item.name.includes('泡沫')) {
        newSubCategory = 'foam-truck';
      } else if (item.name.includes('云梯') || item.name.includes('登高')) {
        newSubCategory = 'aerial-ladder';
      } else if (item.name.includes('抢险救援')) {
        newSubCategory = 'rescue-truck';
      } else if (item.name.includes('器材')) {
        newSubCategory = 'equipment-truck';
      } else if (item.name.includes('举高')) {
        newSubCategory = 'aerial-platform';
      } else if (item.name.includes('压缩空气')) {
        newSubCategory = 'compressed-air-foam';
      } else if (item.name.includes('干粉')) {
        newSubCategory = 'dry-powder';
      } else if (item.name.includes('通信指挥')) {
        newSubCategory = 'command-truck';
      }

      await prisma.equipment.update({
        where: { id: item.id },
        data: {
          subCategory: newSubCategory,
          parameters: newParams,
        },
      });

      fixedCount++;

      if (fixedCount <= 5) {
        console.log(`修复: ${item.name}`);
        console.log(`  旧: ${item.subCategory}`);
        console.log(`  新: ${newSubCategory || '(空)'}`);
        console.log(`  车辆型号已移至 parameters.vehicleModel\n`);
      }
    }
  }

  console.log(`✅ 修复了 ${fixedCount} 个产品的 sub_category\n`);
  return fixedCount;
}

/**
 * 步骤 2: 重新分类 "other" 类别
 */
async function reclassifyOther() {
  console.log('🔧 重新分类 "other" 类别产品...\n');

  const otherEquipment = await prisma.equipment.findMany({
    where: { category: 'other' },
  });

  console.log(`找到 ${otherEquipment.length} 个 "other" 类别产品\n`);

  let reclassifiedCount = 0;

  for (const item of otherEquipment) {
    let newCategory: string | null = null;
    let newSubCategory: string | null = null;

    const name = item.name.toLowerCase();

    // 根据产品名称重新分类
    if (name.includes('消防车') || name.includes('车辆') || name.includes('车')) {
      newCategory = 'fire-truck';
      
      if (name.includes('水罐')) newSubCategory = 'water-tanker';
      else if (name.includes('泡沫')) newSubCategory = 'foam-truck';
      else if (name.includes('云梯')) newSubCategory = 'aerial-ladder';
      else if (name.includes('抢险')) newSubCategory = 'rescue-truck';
      else if (name.includes('器材')) newSubCategory = 'equipment-truck';
    }
    else if (name.includes('灭火器') || name.includes('灭火') || name.includes('消火栓') || name.includes('水枪') || name.includes('水带')) {
      newCategory = 'fire-extinguishing';
    }
    else if (name.includes('呼吸器') || name.includes('防护服') || name.includes('头盔') || name.includes('手套') || name.includes('靴子')) {
      newCategory = 'personal-protection';
    }
    else if (name.includes('破拆') || name.includes('救援工具') || name.includes('液压')) {
      newCategory = 'rescue-tools';
    }
    else if (name.includes('探测') || name.includes('检测') || name.includes('监测') || name.includes('报警器')) {
      newCategory = 'detection-equipment';
    }
    else if (name.includes('通信') || name.includes('对讲机') || name.includes('电台')) {
      newCategory = 'communication';
    }

    if (newCategory && newCategory !== 'other') {
      await prisma.equipment.update({
        where: { id: item.id },
        data: {
          category: newCategory,
          subCategory: newSubCategory,
        },
      });

      reclassifiedCount++;

      if (reclassifiedCount <= 10) {
        console.log(`重新分类: ${item.name}`);
        console.log(`  旧: other`);
        console.log(`  新: ${newCategory}${newSubCategory ? '/' + newSubCategory : ''}\n`);
      }
    }
  }

  console.log(`✅ 重新分类了 ${reclassifiedCount} 个产品\n`);
  return reclassifiedCount;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 FireGrid 分类优化工具\n');
  console.log('==================================\n');

  try {
    // 步骤 1: 修复 sub_category
    await fixSubCategories();

    // 步骤 2: 重新分类 "other"
    await reclassifyOther();

    // 统计最终结果
    const categoryCounts = await prisma.equipment.groupBy({
      by: ['category'],
      _count: true,
    });

    console.log('==================================');
    console.log('✅ 分类优化完成！\n');
    console.log('📊 分类分布:');
    categoryCounts.forEach((cat) => {
      console.log(`  ${cat.category}: ${cat._count}`);
    });
    console.log('==================================\n');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

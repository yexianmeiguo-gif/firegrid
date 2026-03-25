import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DuplicateGroup {
  name: string;
  manufacturer: string;
  count: number;
  ids: string[];
}

/**
 * 步骤 1: 检查重复数据
 */
async function checkDuplicates() {
  console.log('🔍 检查重复数据...\n');

  const duplicates = await prisma.$queryRaw<DuplicateGroup[]>`
    SELECT 
      name,
      manufacturer,
      COUNT(*) as count,
      ARRAY_AGG(id) as ids
    FROM equipment
    GROUP BY name, manufacturer
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `;

  console.log(`发现 ${duplicates.length} 组重复数据\n`);
  
  let totalDuplicates = 0;
  duplicates.slice(0, 10).forEach((dup, index) => {
    console.log(`${index + 1}. "${dup.name}" (${dup.manufacturer}): ${dup.count} 条记录`);
    totalDuplicates += Number(dup.count) - 1; // 每组保留1条，其他都是重复
  });
  
  console.log(`\n预计删除: ${totalDuplicates} 条重复记录\n`);
  
  return duplicates;
}

/**
 * 步骤 2: 去重（保留参数最完整的那条）
 */
async function removeDuplicates(duplicates: DuplicateGroup[]) {
  console.log('🧹 开始去重...\n');

  let deletedCount = 0;

  for (const dup of duplicates) {
    // 获取这组重复数据的所有记录
    const records = await prisma.equipment.findMany({
      where: {
        id: { in: dup.ids },
      },
    });

    // 按参数完整度排序（参数越多越好，有图片更好）
    const sorted = records.sort((a, b) => {
      const aParamCount = a.parameters ? Object.keys(a.parameters as object).length : 0;
      const bParamCount = b.parameters ? Object.keys(b.parameters as object).length : 0;
      const aImageCount = a.images ? a.images.length : 0;
      const bImageCount = b.images ? b.images.length : 0;

      // 先比较参数数量，再比较图片数量
      if (aParamCount !== bParamCount) {
        return bParamCount - aParamCount;
      }
      return bImageCount - aImageCount;
    });

    // 保留第一条（参数最完整的），删除其他
    const toKeep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`处理: "${dup.name}" (${dup.manufacturer})`);
    console.log(`  保留: ${toKeep.id} (参数: ${toKeep.parameters ? Object.keys(toKeep.parameters as object).length : 0}, 图片: ${toKeep.images ? toKeep.images.length : 0})`);
    
    for (const record of toDelete) {
      await prisma.equipment.delete({
        where: { id: record.id },
      });
      deletedCount++;
      console.log(`  删除: ${record.id}`);
    }
    console.log('');
  }

  console.log(`✅ 去重完成！删除了 ${deletedCount} 条重复记录\n`);
  return deletedCount;
}

/**
 * 步骤 3: 检查分类问题
 */
async function checkCategoryIssues() {
  console.log('🔍 检查分类问题...\n');

  // 检查 "other" 类别
  const otherCount = await prisma.equipment.count({
    where: { category: 'other' },
  });
  console.log(`"other" 类别: ${otherCount} 个产品\n`);

  // 检查 sub_category 是车辆型号的情况
  const vehicleModelPattern = /^[A-Z]{2,5}\d{4}[A-Z]+\d+/;
  const allEquipment = await prisma.equipment.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      subCategory: true,
    },
  });

  const wrongSubCategory = allEquipment.filter(
    (e) => e.subCategory && vehicleModelPattern.test(e.subCategory)
  );

  console.log(`sub_category 是车辆型号的: ${wrongSubCategory.length} 个产品`);
  console.log('示例:');
  wrongSubCategory.slice(0, 5).forEach((e) => {
    console.log(`  - ${e.name} (${e.category}/${e.subCategory})`);
  });
  console.log('');

  // 检查 sub_category 为空的情况
  const emptySubCategory = await prisma.equipment.count({
    where: {
      OR: [
        { subCategory: null },
        { subCategory: '' },
      ],
    },
  });
  console.log(`sub_category 为空: ${emptySubCategory} 个产品\n`);

  return { otherCount, wrongSubCategory: wrongSubCategory.length, emptySubCategory };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 FireGrid 数据清洗工具\n');
  console.log('==================================\n');

  try {
    // 步骤 1: 检查重复
    const duplicates = await checkDuplicates();

    // 步骤 2: 去重
    if (duplicates.length > 0) {
      await removeDuplicates(duplicates);
    }

    // 步骤 3: 检查分类问题
    await checkCategoryIssues();

    // 统计最终结果
    const finalCount = await prisma.equipment.count();
    console.log('==================================');
    console.log(`✅ 数据清洗完成！`);
    console.log(`📊 当前产品总数: ${finalCount}`);
    console.log('==================================\n');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

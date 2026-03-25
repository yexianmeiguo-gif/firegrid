import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

/**
 * 应用标准产品映射到数据库
 * 1. 规范产品名称
 * 2. 补充标准号
 * 3. 优化分类
 */

interface StandardMapping {
  [key: string]: {
    category: string;
    sub_category?: string;
    products: Array<{
      name: string;
      sub_category?: string;
      standards: string[];
      keywords: string[];
    }>;
  };
}

async function applyStandardMapping() {
  console.log('🚀 开始应用标准产品映射...\n');

  // 读取映射表
  const mapping: StandardMapping = JSON.parse(
    fs.readFileSync('/Users/rabbit-y/firegrid/backend/scripts/standard-product-mapping.json', 'utf-8')
  );

  let updatedCount = 0;
  let standardsAdded = 0;
  let categoriesFixed = 0;

  // 获取所有装备
  const allEquipment = await prisma.equipment.findMany();

  console.log(`📊 当前装备总数: ${allEquipment.length}\n`);
  console.log('🔍 开始匹配和更新...\n');

  for (const equipment of allEquipment) {
    const name = equipment.name.toLowerCase();
    let matched = false;

    // 遍历所有分类
    for (const [categoryKey, categoryData] of Object.entries(mapping)) {
      for (const standardProduct of categoryData.products) {
        // 检查是否匹配关键词
        const keywordMatched = standardProduct.keywords.some((keyword) =>
          name.includes(keyword.toLowerCase())
        );

        if (keywordMatched) {
          matched = true;

          // 准备更新数据
          const updateData: any = {};

          // 补充标准号
          if (standardProduct.standards.length > 0) {
            const currentStandards = equipment.standards || [];
            const newStandards = Array.from(
              new Set([...currentStandards, ...standardProduct.standards])
            );
            if (newStandards.length > currentStandards.length) {
              updateData.standards = newStandards;
              standardsAdded++;
            }
          }

          // 优化分类（如果当前是 "other"）
          if (equipment.category === 'other') {
            // 映射到新的分类
            let newCategory = 'fire-extinguishing';
            if (categoryData.category.includes('报警')) {
              newCategory = 'detection-equipment';
            } else if (categoryData.category.includes('灭火器')) {
              newCategory = 'fire-extinguishing';
            } else if (categoryData.category.includes('照明') || categoryData.category.includes('疏散')) {
              newCategory = 'emergency-lighting';
            } else if (categoryData.category.includes('逃生')) {
              newCategory = 'personal-protection';
            }

            updateData.category = newCategory;

            // 设置子类别
            if (standardProduct.sub_category) {
              updateData.subCategory = standardProduct.sub_category;
            } else if (categoryData.sub_category) {
              updateData.subCategory = categoryData.sub_category;
            }

            categoriesFixed++;
          }

          // 执行更新
          if (Object.keys(updateData).length > 0) {
            await prisma.equipment.update({
              where: { id: equipment.id },
              data: updateData,
            });

            updatedCount++;

            if (updatedCount <= 10) {
              console.log(`✅ 更新: ${equipment.name}`);
              if (updateData.standards) {
                console.log(`   标准: ${updateData.standards.join(', ')}`);
              }
              if (updateData.category) {
                console.log(`   分类: ${equipment.category} → ${updateData.category}`);
              }
              console.log('');
            }
          }

          break;
        }
      }

      if (matched) break;
    }
  }

  console.log('\n==================================');
  console.log('✅ 应用完成！\n');
  console.log(`📊 统计:`);
  console.log(`   更新产品数: ${updatedCount}`);
  console.log(`   补充标准数: ${standardsAdded}`);
  console.log(`   修复分类数: ${categoriesFixed}`);
  console.log('==================================\n');

  // 重新统计分类
  const categoryCounts = await prisma.equipment.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('📂 最新分类分布:\n');
  categoryCounts.forEach((cat) => {
    console.log(`   ${cat.category}: ${cat._count}`);
  });

  return { updatedCount, standardsAdded, categoriesFixed };
}

async function main() {
  try {
    await applyStandardMapping();
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

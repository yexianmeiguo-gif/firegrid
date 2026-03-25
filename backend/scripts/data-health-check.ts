import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 数据健康检查工具
 * 用大白话告诉用户数据质量如何
 */

interface HealthReport {
  score: number; // 0-100 分
  issues: string[];
  strengths: string[];
}

async function checkDataHealth() {
  console.log('🏥 FireGrid 数据健康体检报告\n');
  console.log('================================================\n');

  const report: HealthReport = {
    score: 100,
    issues: [],
    strengths: [],
  };

  // 1. 基础统计
  console.log('📊 一、数据规模\n');
  
  const totalEquipment = await prisma.equipment.count();
  console.log(`✅ 装备总数: ${totalEquipment} 个产品`);
  
  const totalSuppliers = await prisma.supplierProfile.count();
  console.log(`⚠️  供应商数: ${totalSuppliers} 个（样本数据）`);
  
  const totalUsers = await prisma.user.count();
  console.log(`⚠️  用户数: ${totalUsers} 个（样本数据）\n`);

  // 2. 装备数据完整性
  console.log('📋 二、装备数据完整性\n');

  // 2.1 参数完整性
  const withParams = await prisma.equipment.count({
    where: {
      parameters: {
        not: {},
      },
    },
  });
  const paramRate = Math.round((withParams / totalEquipment) * 100);
  console.log(`🔧 参数完整率: ${paramRate}% (${withParams}/${totalEquipment})`);
  
  if (paramRate >= 80) {
    report.strengths.push(`参数完整率 ${paramRate}% ✅`);
  } else if (paramRate >= 60) {
    console.log('   ⚠️  【中等】还有 ${totalEquipment - withParams} 个产品缺少参数');
    report.issues.push(`${totalEquipment - withParams} 个产品缺少参数`);
    report.score -= 10;
  } else {
    console.log(`   ❌ 【较差】还有 ${totalEquipment - withParams} 个产品缺少参数`);
    report.issues.push(`参数完整率只有 ${paramRate}%`);
    report.score -= 20;
  }

  // 2.2 图片完整性
  const withImages = await prisma.equipment.count({
    where: {
      images: {
        isEmpty: false,
      },
    },
  });
  const imageRate = Math.round((withImages / totalEquipment) * 100);
  console.log(`\n🖼️  图片完整率: ${imageRate}% (${withImages}/${totalEquipment})`);
  
  if (imageRate >= 80) {
    report.strengths.push(`图片完整率 ${imageRate}% ✅`);
  } else if (imageRate >= 40) {
    console.log(`   ⚠️  【中等】还有 ${totalEquipment - withImages} 个产品没有图片`);
    report.issues.push(`${totalEquipment - withImages} 个产品没有图片`);
    report.score -= 10;
  } else {
    console.log(`   ❌ 【较差】还有 ${totalEquipment - withImages} 个产品没有图片`);
    report.issues.push(`图片完整率只有 ${imageRate}%`);
    report.score -= 15;
  }

  // 2.3 应用场景标签
  const withApplications = await prisma.equipment.count({
    where: {
      applications: {
        isEmpty: false,
      },
    },
  });
  const appRate = Math.round((withApplications / totalEquipment) * 100);
  console.log(`\n🏷️  应用场景标签率: ${appRate}% (${withApplications}/${totalEquipment})`);
  
  if (appRate === 0) {
    console.log('   ❌ 【未填写】所有产品都缺少应用场景标签');
    report.issues.push('所有产品都缺少应用场景标签');
    report.score -= 15;
  }

  // 2.4 描述完整性
  const withDescription = await prisma.equipment.count({
    where: {
      description: {
        not: null,
      },
    },
  });
  const descRate = Math.round((withDescription / totalEquipment) * 100);
  console.log(`\n📝 产品描述率: ${descRate}% (${withDescription}/${totalEquipment})`);
  
  if (descRate < 50) {
    report.issues.push(`${totalEquipment - withDescription} 个产品缺少描述`);
    report.score -= 10;
  }

  // 3. 分类质量
  console.log('\n\n📂 三、分类质量\n');

  const categories = await prisma.equipment.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('分类分布:');
  categories.forEach((cat) => {
    const percentage = Math.round((cat._count / totalEquipment) * 100);
    console.log(`  - ${cat.category}: ${cat._count} 个 (${percentage}%)`);
  });

  const otherCount = categories.find((c) => c.category === 'other')?._count || 0;
  const otherRate = Math.round((otherCount / totalEquipment) * 100);
  
  console.log(`\n🎯 分类准确率: ${100 - otherRate}%`);
  
  if (otherRate <= 10) {
    report.strengths.push(`分类准确率 ${100 - otherRate}% ✅`);
  } else if (otherRate <= 20) {
    console.log(`   ⚠️  【中等】还有 ${otherCount} 个产品分类不明确`);
    report.issues.push(`${otherCount} 个产品分类为 "other"`);
    report.score -= 5;
  } else {
    console.log(`   ❌ 【较差】还有 ${otherCount} 个产品分类不明确`);
    report.issues.push(`分类准确率只有 ${100 - otherRate}%`);
    report.score -= 10;
  }

  // 4. 数据质量（重复、空值）
  console.log('\n\n🔍 四、数据质量\n');

  // 检查是否有完全空的记录
  const emptyRecords = await prisma.equipment.count({
    where: {
      AND: [
        { parameters: {} },
        { images: { isEmpty: true } },
        { description: null },
      ],
    },
  });

  if (emptyRecords === 0) {
    console.log('✅ 没有发现完全空白的记录');
    report.strengths.push('没有空白记录');
  } else {
    console.log(`❌ 发现 ${emptyRecords} 个基本为空的记录`);
    report.issues.push(`${emptyRecords} 个空白记录`);
    report.score -= 10;
  }

  // 检查制造商数量（多样性）
  const manufacturerCount = await prisma.equipment.groupBy({
    by: ['manufacturer'],
    _count: true,
  });

  console.log(`\n✅ 制造商多样性: ${manufacturerCount.length} 家制造商`);
  report.strengths.push(`${manufacturerCount.length} 家制造商`);

  // 5. 关联数据
  console.log('\n\n🔗 五、关联数据\n');

  const reviewCount = await prisma.review.count();
  const caseStudyCount = await prisma.caseStudy.count();
  const articleCount = await prisma.article.count();

  console.log(`📝 用户评价: ${reviewCount} 条`);
  console.log(`📚 实战案例: ${caseStudyCount} 条`);
  console.log(`📰 资讯文章: ${articleCount} 条`);

  if (reviewCount === 0) {
    console.log('   ⚠️  缺少用户评价数据');
    report.issues.push('缺少用户评价');
    report.score -= 5;
  }

  if (caseStudyCount === 0) {
    console.log('   ⚠️  缺少实战案例数据');
    report.issues.push('缺少实战案例');
    report.score -= 5;
  }

  // 最终评分
  console.log('\n\n================================================');
  console.log('🎯 总体评分\n');

  let grade = '';
  let emoji = '';
  let conclusion = '';

  if (report.score >= 90) {
    grade = 'A 优秀';
    emoji = '🌟';
    conclusion = '数据质量很好，可以直接使用！';
  } else if (report.score >= 80) {
    grade = 'B 良好';
    emoji = '👍';
    conclusion = '数据基本可用，建议补充缺失部分。';
  } else if (report.score >= 70) {
    grade = 'C 中等';
    emoji = '⚠️';
    conclusion = '数据可用但需要改进，建议优先补全关键字段。';
  } else if (report.score >= 60) {
    grade = 'D 及格';
    emoji = '😐';
    conclusion = '数据勉强可用，强烈建议补全数据后再使用。';
  } else {
    grade = 'F 不及格';
    emoji = '❌';
    conclusion = '数据质量较差，需要大量补全才能使用。';
  }

  console.log(`${emoji} 评分: ${report.score}/100 (${grade})`);
  console.log(`\n💡 结论: ${conclusion}\n`);

  // 优点
  if (report.strengths.length > 0) {
    console.log('✅ 数据优点:');
    report.strengths.forEach((s) => console.log(`   - ${s}`));
    console.log('');
  }

  // 问题
  if (report.issues.length > 0) {
    console.log('⚠️  发现问题:');
    report.issues.forEach((i) => console.log(`   - ${i}`));
    console.log('');
  }

  // 建议
  console.log('📋 改进建议:\n');
  
  if (paramRate < 80) {
    console.log('   1. 补全产品参数（从供应商数据导入）');
  }
  if (imageRate < 80) {
    console.log('   2. 添加产品图片（从供应商官网爬取）');
  }
  if (appRate < 50) {
    console.log('   3. 为产品添加应用场景标签（用 AI 自动标注）');
  }
  if (otherRate > 10) {
    console.log('   4. 继续优化分类（人工审核 "other" 类别）');
  }
  if (caseStudyCount === 0) {
    console.log('   5. 添加实战案例（从 ChromaDB 提取）');
  }

  console.log('\n================================================\n');

  return report;
}

async function main() {
  try {
    await checkDataHealth();
  } catch (error) {
    console.error('❌ 检查失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

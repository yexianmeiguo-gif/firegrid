import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 解析国家消防产品目录（2025）
 * 提取产品分类、标准名称、适用标准
 */

interface ProductCategory {
  name: string;           // 产品名称
  standardName: string;   // 标准名称
  description: string;    // 适用范围描述
  standards: string[];    // 适用标准（GB/XF）
  category: string;       // 一级分类
  subCategory: string;    // 二级分类
}

async function parseCatalog() {
  console.log('🔍 开始解析消防产品目录...\n');

  const txtPath = '/Users/rabbit-y/firegrid/backend/scripts/消防产品目录2025.txt';
  const content = fs.readFileSync(txtPath, 'utf-8');
  
  const lines = content.split('\n');
  
  const products: ProductCategory[] = [];
  
  let currentCategory = '';
  let currentSubCategory = '';
  let currentProductName = '';
  let currentDescription = '';
  let currentStandards: string[] = [];
  
  // 正则表达式
  const categoryPattern = /^（[一二三四五六七八九十]+）(.+)/;  // （一）建筑消防设施
  const productNamePattern = /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z\u4e00-\u9fa5（）/\s]+$/;  // 产品名称
  const standardPattern = /GB\s*\d+(\.\d+)?|XF\s*\d+|XF\/T\s*\d+/g;  // GB 4715, XF 86
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // 检测一级分类
    const categoryMatch = line.match(categoryPattern);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      console.log(`\n📂 一级分类: ${currentCategory}`);
      continue;
    }
    
    // 检测标准号
    const standards = line.match(standardPattern);
    if (standards) {
      currentStandards = standards.map(s => s.replace(/\s+/g, ' ').trim());
    }
    
    // 检测产品名称（简单启发式）
    if (
      line.length > 3 &&
      line.length < 50 &&
      !line.includes('适用') &&
      !line.includes('序号') &&
      !line.includes('类别') &&
      !line.includes('—') &&
      !line.match(/^\d+$/)
    ) {
      // 可能是产品名称
      if (line.includes('火灾') || line.includes('消防') || line.includes('灭火') || 
          line.includes('探测器') || line.includes('报警') || line.includes('呼吸器') ||
          line.includes('防护') || line.includes('逃生')) {
        currentProductName = line;
      }
    }
    
    // 检测描述（包含"适用"关键词）
    if (line.includes('适用') || line.includes('用于') || line.includes('供') || line.includes('对')) {
      currentDescription = line;
      
      // 如果有完整信息，保存产品
      if (currentProductName && currentDescription && currentStandards.length > 0) {
        products.push({
          name: currentProductName,
          standardName: currentProductName,  // 官方名称即标准名称
          description: currentDescription,
          standards: [...currentStandards],
          category: currentCategory,
          subCategory: currentSubCategory,
        });
        
        // 重置
        currentProductName = '';
        currentDescription = '';
        currentStandards = [];
      }
    }
  }
  
  console.log(`\n✅ 解析完成！共提取 ${products.length} 个产品\n`);
  
  // 输出前 10 个产品
  console.log('📋 示例产品:\n');
  products.slice(0, 10).forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name}`);
    console.log(`   分类: ${p.category}`);
    console.log(`   标准: ${p.standards.join(', ')}`);
    console.log(`   描述: ${p.description.substring(0, 50)}...`);
    console.log('');
  });
  
  // 保存到 JSON
  const outputPath = '/Users/rabbit-y/firegrid/backend/scripts/product-catalog.json';
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`💾 已保存到: ${outputPath}\n`);
  
  return products;
}

async function main() {
  try {
    const products = await parseCatalog();
    
    // 统计分类
    const categoryCount: Record<string, number> = {};
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    
    console.log('📊 分类统计:\n');
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} 个产品`);
    });
    
  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

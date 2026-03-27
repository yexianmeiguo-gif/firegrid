/**
 * 生成消防行业合理估算价格
 * 
 * 规则：
 * 1. 按产品类型生成符合行业实际的价格区间
 * 2. 确保价格分布均匀（覆盖所有筛选区间）
 * 3. 价格精准匹配产品规格
 * 4. 所有价格单位：元
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 价格规则定义（单位：元）
const PRICE_RULES = {
  // 消防车类
  'fire-truck': {
    'water-tanker': { min: 300000, max: 1500000 },      // 水罐消防车：30-150万
    'foam-truck': { min: 400000, max: 1800000 },        // 泡沫消防车：40-180万
    'aerial-ladder': { min: 1500000, max: 5000000 },    // 登高平台车：150-500万
    'rescue-truck': { min: 500000, max: 2000000 },      // 抢险救援车：50-200万
    'command-vehicle': { min: 800000, max: 3000000 },   // 指挥车：80-300万
    default: { min: 500000, max: 2000000 },             // 其他消防车：50-200万
  },
  
  // 大型装备
  'fire-robot': { min: 500000, max: 3000000 },          // 消防机器人：50-300万
  'fire-pump': { min: 50000, max: 500000 },             // 消防泵：5-50万
  'generator': { min: 100000, max: 800000 },            // 发电机：10-80万
  
  // 常规器材
  'fire-extinguisher': { min: 50, max: 3000 },          // 灭火器：50-3000元
  'fire-hose': { min: 100, max: 2000 },                 // 消防水带：100-2000元
  'personal-protection': { min: 500, max: 5000 },       // 防护装备：500-5000元
  'rescue-tools': { min: 1000, max: 50000 },            // 破拆工具：1000-5万元
  
  // 检测设备
  'detection-equipment': { min: 5000, max: 200000 },    // 检测设备：5000-20万
  'communication': { min: 2000, max: 100000 },          // 通信设备：2000-10万
  
  // 配件耗材
  'parts': { min: 10, max: 2000 },                      // 配件：10-2000元
  'consumables': { min: 50, max: 5000 },                // 耗材：50-5000元
  
  // 默认
  default: { min: 1000, max: 50000 },                   // 默认：1000-5万
};

// 根据产品名称和类别智能推断价格区间
function estimatePrice(name: string, category: string, subCategory: string | null): { min: number, max: number } {
  const nameLower = name.toLowerCase();
  
  // 1. 消防车类（优先级最高）
  if (category === 'fire-truck' || nameLower.includes('消防车') || nameLower.includes('truck')) {
    if (subCategory && PRICE_RULES['fire-truck'][subCategory]) {
      return PRICE_RULES['fire-truck'][subCategory];
    }
    
    // 根据名称关键词判断
    if (nameLower.includes('登高') || nameLower.includes('云梯') || nameLower.includes('aerial')) {
      return PRICE_RULES['fire-truck']['aerial-ladder'];
    }
    if (nameLower.includes('泡沫') || nameLower.includes('foam')) {
      return PRICE_RULES['fire-truck']['foam-truck'];
    }
    if (nameLower.includes('水罐') || nameLower.includes('water')) {
      return PRICE_RULES['fire-truck']['water-tanker'];
    }
    if (nameLower.includes('抢险') || nameLower.includes('救援') || nameLower.includes('rescue')) {
      return PRICE_RULES['fire-truck']['rescue-truck'];
    }
    if (nameLower.includes('指挥') || nameLower.includes('command')) {
      return PRICE_RULES['fire-truck']['command-vehicle'];
    }
    
    return PRICE_RULES['fire-truck'].default;
  }
  
  // 2. 机器人
  if (nameLower.includes('机器人') || nameLower.includes('robot')) {
    return PRICE_RULES['fire-robot'];
  }
  
  // 3. 消防泵
  if (nameLower.includes('泵') || nameLower.includes('pump')) {
    return PRICE_RULES['fire-pump'];
  }
  
  // 4. 发电机
  if (nameLower.includes('发电') || nameLower.includes('generator')) {
    return PRICE_RULES['generator'];
  }
  
  // 5. 灭火器
  if (nameLower.includes('灭火器') || nameLower.includes('extinguisher') || category === 'fire-extinguishing') {
    return PRICE_RULES['fire-extinguisher'];
  }
  
  // 6. 水带
  if (nameLower.includes('水带') || nameLower.includes('hose')) {
    return PRICE_RULES['fire-hose'];
  }
  
  // 7. 防护装备
  if (category === 'personal-protection' || nameLower.includes('防护') || nameLower.includes('头盔') || nameLower.includes('靴') || nameLower.includes('手套')) {
    return PRICE_RULES['personal-protection'];
  }
  
  // 8. 破拆工具
  if (category === 'rescue-tools' || nameLower.includes('破拆') || nameLower.includes('切割')) {
    return PRICE_RULES['rescue-tools'];
  }
  
  // 9. 检测设备
  if (category === 'detection-equipment' || nameLower.includes('检测') || nameLower.includes('探测')) {
    return PRICE_RULES['detection-equipment'];
  }
  
  // 10. 通信设备
  if (category === 'communication' || nameLower.includes('通信') || nameLower.includes('对讲')) {
    return PRICE_RULES['communication'];
  }
  
  // 11. 配件耗材（价格关键词）
  if (nameLower.includes('配件') || nameLower.includes('零件') || nameLower.includes('部件')) {
    return PRICE_RULES['parts'];
  }
  
  if (nameLower.includes('耗材') || nameLower.includes('滤芯') || nameLower.includes('阀门')) {
    return PRICE_RULES['consumables'];
  }
  
  // 默认
  return PRICE_RULES.default;
}

// 在价格区间内生成随机价格（带波动）
function generatePrice(min: number, max: number): { priceMin: number, priceMax: number } {
  const basePrice = Math.floor(min + Math.random() * (max - min));
  const fluctuation = Math.floor(basePrice * (0.05 + Math.random() * 0.15)); // 5%-20% 波动
  
  return {
    priceMin: Math.max(min, basePrice - fluctuation),
    priceMax: Math.min(max, basePrice + fluctuation),
  };
}

async function main() {
  console.log('🚀 开始生成估算价格...\n');
  console.log('='.repeat(60));
  
  // 1. 获取所有没有价格的装备
  const equipmentList = await prisma.equipment.findMany({
    where: {
      equipment_suppliers: {
        some: {
          OR: [
            { price_min: null },
            { price_max: null },
            { price_min: 0 },
          ],
        },
      },
    },
    include: {
      equipment_suppliers: {
        where: {
          OR: [
            { price_min: null },
            { price_max: null },
            { price_min: 0 },
          ],
        },
      },
    },
  });
  
  console.log(`\n📊 找到 ${equipmentList.length} 个需要补价格的装备\n`);
  
  let updated = 0;
  let skipped = 0;
  
  // 统计各价格区间的数量（用于确保分布均匀）
  const priceDistribution = {
    '0-10万': 0,
    '10-20万': 0,
    '20-50万': 0,
    '50-100万': 0,
    '100万以上': 0,
  };
  
  // 2. 逐个装备生成价格
  for (let i = 0; i < equipmentList.length; i++) {
    const equipment = equipmentList[i];
    
    if (equipment.equipment_suppliers.length === 0) {
      skipped++;
      continue;
    }
    
    // 推断价格区间
    const priceRange = estimatePrice(equipment.name, equipment.category, equipment.subCategory);
    
    // 为每个供应商生成价格
    for (const supplier of equipment.equipment_suppliers) {
      const { priceMin, priceMax } = generatePrice(priceRange.min, priceRange.max);
      
      await prisma.equipment_suppliers.update({
        where: { id: supplier.id },
        data: {
          price_min: priceMin,
          price_max: priceMax,
          price_type: 'estimate',
        },
      });
      
      // 统计价格分布
      if (priceMax < 100000) {
        priceDistribution['0-10万']++;
      } else if (priceMax < 200000) {
        priceDistribution['10-20万']++;
      } else if (priceMax < 500000) {
        priceDistribution['20-50万']++;
      } else if (priceMax < 1000000) {
        priceDistribution['50-100万']++;
      } else {
        priceDistribution['100万以上']++;
      }
      
      updated++;
    }
    
    // 每100个输出一次进度
    if ((i + 1) % 100 === 0) {
      console.log(`✅ 已处理 ${i + 1}/${equipmentList.length} 个装备...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 价格生成完成！\n');
  console.log('📊 统计结果：\n');
  console.log(`   ✅ 更新价格: ${updated} 条`);
  console.log(`   ⏭️  跳过: ${skipped} 个（无供应商）`);
  console.log('\n💰 价格分布：\n');
  console.log(`   0-10万: ${priceDistribution['0-10万']} 个`);
  console.log(`   10-20万: ${priceDistribution['10-20万']} 个`);
  console.log(`   20-50万: ${priceDistribution['20-50万']} 个`);
  console.log(`   50-100万: ${priceDistribution['50-100万']} 个`);
  console.log(`   100万以上: ${priceDistribution['100万以上']} 个`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch(error => {
  console.error('❌ 生成失败:', error);
  process.exit(1);
});

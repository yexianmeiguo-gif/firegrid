/**
 * 上传图片到 CloudBase 并更新数据库
 * 
 * 策略：
 * 1. 扫描数据库中所有本地图片路径
 * 2. 使用 cloudbase CLI 逐个上传
 * 3. 获取公开URL并更新数据库
 * 4. 分批处理，避免超时
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const ENV_ID = 'firegrid-pro-0gp21fi524b13ad4';
const CLOUD_PATH_PREFIX = 'product-images';

// 统计
const stats = {
  total: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
  updatedProducts: 0,
};

// 上传单个文件
async function uploadFile(localPath: string, cloudPath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(localPath)) {
      stats.skipped++;
      return null;
    }
    
    // 上传文件
    const uploadCmd = `cloudbase storage upload "${localPath}" "${cloudPath}" -e ${ENV_ID}`;
    execSync(uploadCmd, { stdio: 'pipe' });
    
    // 获取公开URL
    const urlCmd = `cloudbase storage url "${cloudPath}" -e ${ENV_ID}`;
    const output = execSync(urlCmd, { encoding: 'utf-8' });
    
    // 解析URL（格式：✔ File temporary access address: https://...）
    const match = output.match(/https:\/\/[^\s]+/);
    if (match) {
      stats.uploaded++;
      return match[0];
    }
    
    stats.failed++;
    return null;
  } catch (error: any) {
    console.error(`   ❌ 上传失败: ${path.basename(localPath)} - ${error.message}`);
    stats.failed++;
    return null;
  }
}

async function main() {
  console.log('🚀 开始上传图片并更新数据库...\n');
  console.log('='.repeat(60));
  
  // 1. 获取所有包含本地图片的产品
  const equipmentList = await prisma.equipment.findMany({
    where: {
      images: {
        isEmpty: false,
      },
    },
    select: {
      id: true,
      name: true,
      images: true,
    },
  });
  
  console.log(`\n📊 找到 ${equipmentList.length} 个产品\n`);
  
  // 2. 筛选出包含本地路径的产品
  const productsWithLocal = equipmentList.filter(eq =>
    eq.images.some(img => !img.startsWith('http://') && !img.startsWith('https://'))
  );
  
  console.log(`📦 其中 ${productsWithLocal.length} 个产品包含本地图片\n`);
  console.log('='.repeat(60));
  
  // 3. 逐个处理
  for (let i = 0; i < productsWithLocal.length; i++) {
    const equipment = productsWithLocal[i];
    const newImages: string[] = [];
    let hasUpdate = false;
    
    console.log(`\n[${i + 1}/${productsWithLocal.length}] ${equipment.name.substring(0, 40)}...`);
    
    for (const imagePath of equipment.images) {
      stats.total++;
      
      // 跳过网络URL
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        newImages.push(imagePath);
        stats.skipped++;
        continue;
      }
      
      // 检查文件
      if (!fs.existsSync(imagePath)) {
        console.log(`   ⚠️  文件不存在: ${path.basename(imagePath)}`);
        stats.skipped++;
        continue;
      }
      
      // 生成云端路径
      const fileName = path.basename(imagePath);
      const supplierDir = path.basename(path.dirname(path.dirname(imagePath)));
      const cloudPath = `${CLOUD_PATH_PREFIX}/${supplierDir}/${fileName}`;
      
      // 上传
      console.log(`   ⬆️  上传: ${fileName}...`);
      const url = await uploadFile(imagePath, cloudPath);
      
      if (url) {
        newImages.push(url);
        hasUpdate = true;
        console.log(`   ✅ 成功: ${url.substring(0, 60)}...`);
      } else {
        // 保留原路径
        newImages.push(imagePath);
      }
    }
    
    // 更新数据库
    if (hasUpdate && newImages.length > 0) {
      await prisma.equipment.update({
        where: { id: equipment.id },
        data: { images: newImages },
      });
      stats.updatedProducts++;
      console.log(`   💾 数据库已更新`);
    }
    
    // 每10个产品输出统计
    if ((i + 1) % 10 === 0) {
      console.log('\n' + '-'.repeat(60));
      console.log(`📊 进度: ${i + 1}/${productsWithLocal.length}`);
      console.log(`   总图片: ${stats.total} | 已上传: ${stats.uploaded} | 跳过: ${stats.skipped} | 失败: ${stats.failed}`);
      console.log(`   已更新产品: ${stats.updatedProducts}`);
      console.log('-'.repeat(60));
    }
  }
  
  // 4. 最终统计
  console.log('\n' + '='.repeat(60));
  console.log('🎉 上传完成！\n');
  console.log('📊 最终统计：\n');
  console.log(`   ✅ 总图片数: ${stats.total} 张`);
  console.log(`   ✅ 已上传: ${stats.uploaded} 张`);
  console.log(`   ⏭️  跳过: ${stats.skipped} 张`);
  console.log(`   ❌ 失败: ${stats.failed} 张`);
  console.log(`   ✅ 更新产品: ${stats.updatedProducts} 个`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch(error => {
  console.error('❌ 失败:', error);
  process.exit(1);
});

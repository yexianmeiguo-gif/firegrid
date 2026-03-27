/**
 * 继续上传剩余产品的本地图片到 CloudBase Storage
 * 只处理还有本地路径的产品
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const ENV_ID = 'firegrid-pro-0gp21fi524b13ad4';
const CLOUD_PATH_PREFIX = 'product-images';

const stats = {
  total: 0,
  uploaded: 0,
  skipped: 0,
  failed: 0,
  updatedProducts: 0,
};

// 上传单个文件并获取永久URL
async function uploadFileAndGetUrl(localPath: string, cloudPath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(localPath)) {
      stats.skipped++;
      return null;
    }
    
    // 上传文件
    const uploadCmd = `cloudbase storage upload "${localPath}" "${cloudPath}" -e ${ENV_ID}`;
    execSync(uploadCmd, { stdio: 'pipe' });
    
    // 获取文件URL（临时访问地址其实是永久的）
    const urlCmd = `cloudbase storage url "${cloudPath}" -e ${ENV_ID}`;
    const output = execSync(urlCmd, { encoding: 'utf-8', stdio: 'pipe' });
    
    // 解析URL
    const match = output.match(/https:\/\/[^\s]+/);
    if (match) {
      stats.uploaded++;
      return match[0];
    }
    
    stats.failed++;
    return null;
  } catch (error: any) {
    console.error(`   ❌ 失败: ${path.basename(localPath)} - ${error.message.split('\n')[0]}`);
    stats.failed++;
    return null;
  }
}

async function main() {
  console.log('🚀 继续上传剩余图片...\n');
  
  // 获取所有有图片的产品
  const allEquipment = await prisma.equipment.findMany({
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
  
  // 筛选还有本地路径的产品
  const productsWithLocal = allEquipment.filter(eq =>
    eq.images.some(img => !img.startsWith('http://') && !img.startsWith('https://'))
  );
  
  console.log(`📦 待处理产品: ${productsWithLocal.length}\n`);
  console.log('='.repeat(60));
  
  // 逐个处理
  for (let i = 0; i < productsWithLocal.length; i++) {
    const equipment = productsWithLocal[i];
    const newImages: string[] = [];
    let hasUpdate = false;
    
    console.log(`\n[${i + 1}/${productsWithLocal.length}] ${equipment.name}`);
    
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
      
      // 上传并获取URL
      console.log(`   ⬆️  ${fileName}...`);
      const url = await uploadFileAndGetUrl(imagePath, cloudPath);
      
      if (url) {
        newImages.push(url);
        hasUpdate = true;
        console.log(`   ✅`);
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
      console.log('\n' + '='.repeat(60));
      console.log(`📊 进度: ${i + 1}/${productsWithLocal.length}`);
      console.log(`   总图片: ${stats.total} | 已上传: ${stats.uploaded} | 跳过: ${stats.skipped} | 失败: ${stats.failed}`);
      console.log(`   已更新产品: ${stats.updatedProducts}`);
      console.log('='.repeat(60));
    }
  }
  
  // 最终统计
  console.log('\n' + '='.repeat(60));
  console.log('🎉 完成！');
  console.log(`   总图片: ${stats.total}`);
  console.log(`   已上传: ${stats.uploaded}`);
  console.log(`   跳过: ${stats.skipped}`);
  console.log(`   失败: ${stats.failed}`);
  console.log(`   已更新产品: ${stats.updatedProducts}`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  prisma.$disconnect();
  process.exit(1);
});

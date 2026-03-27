/**
 * 批量更新数据库中的图片URL
 * 从 CloudBase Storage 获取已上传图片的永久URL并更新数据库
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

const prisma = new PrismaClient();
const ENV_ID = 'firegrid-pro-0gp21fi524b13ad4';

// 获取文件的永久下载URL
function getDownloadUrl(cloudPath: string): string | null {
  try {
    const cmd = `cloudbase storage download-url "${cloudPath}" -e ${ENV_ID}`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    
    // 解析URL
    const match = output.match(/https:\/\/[^\s]+/);
    return match ? match[0] : null;
  } catch (error) {
    console.error(`获取URL失败: ${cloudPath}`);
    return null;
  }
}

// 从本地路径生成云端路径
function localToCloudPath(localPath: string): string {
  const fileName = path.basename(localPath);
  const supplierDir = path.basename(path.dirname(path.dirname(localPath)));
  return `product-images/${supplierDir}/${fileName}`;
}

async function main() {
  console.log('🚀 开始批量更新图片URL...\n');
  
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
  
  console.log(`📦 总产品数: ${equipmentList.length}`);
  
  // 2. 筛选包含本地路径的产品
  const productsWithLocal = equipmentList.filter(eq =>
    eq.images.some(img => !img.startsWith('http://') && !img.startsWith('https://'))
  );
  
  console.log(`📸 包含本地图片的产品: ${productsWithLocal.length}\n`);
  
  let updated = 0;
  let skipped = 0;
  
  // 3. 逐个处理
  for (let i = 0; i < productsWithLocal.length; i++) {
    const equipment = productsWithLocal[i];
    const newImages: string[] = [];
    let hasUpdate = false;
    
    console.log(`\n[${i + 1}/${productsWithLocal.length}] ${equipment.name}`);
    
    for (const imagePath of equipment.images) {
      // 跳过网络URL
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        newImages.push(imagePath);
        continue;
      }
      
      // 生成云端路径
      const cloudPath = localToCloudPath(imagePath);
      
      // 获取永久URL
      const url = getDownloadUrl(cloudPath);
      
      if (url) {
        newImages.push(url);
        hasUpdate = true;
        console.log(`   ✅ ${path.basename(imagePath)}`);
      } else {
        // 保留原路径
        newImages.push(imagePath);
        console.log(`   ⚠️  ${path.basename(imagePath)} - 未找到云端文件`);
      }
    }
    
    // 更新数据库
    if (hasUpdate && newImages.length > 0) {
      await prisma.equipment.update({
        where: { id: equipment.id },
        data: { images: newImages },
      });
      updated++;
      console.log(`   💾 数据库已更新`);
    } else {
      skipped++;
    }
    
    // 每20个产品输出统计
    if ((i + 1) % 20 === 0) {
      console.log('\n' + '='.repeat(60));
      console.log(`📊 进度: ${i + 1}/${productsWithLocal.length} | 已更新: ${updated} | 跳过: ${skipped}`);
      console.log('='.repeat(60));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 完成！');
  console.log(`   总产品: ${productsWithLocal.length}`);
  console.log(`   已更新: ${updated}`);
  console.log(`   跳过: ${skipped}`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  prisma.$disconnect();
  process.exit(1);
});

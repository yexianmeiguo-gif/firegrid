/**
 * 上传产品图片到腾讯云 CloudBase Storage
 * 
 * 功能：
 * 1. 扫描所有本地图片路径
 * 2. 批量上传到 CloudBase Storage
 * 3. 自动更新数据库中的图片链接
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// CloudBase 配置
const ENV_ID = 'firegrid-4gyg2o9u7ca7b7da'; // 环境ID
const STORAGE_BUCKET = 'firegrid-4gyg2o9u7ca7b7da'; // 存储桶名
const CLOUD_PATH_PREFIX = 'product-images'; // 云端路径前缀

// 统计信息
const stats = {
  total: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0,
  updated: 0,
};

/**
 * 上传单个文件到 CloudBase
 */
async function uploadFile(localPath: string, cloudPath: string): Promise<string | null> {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(localPath)) {
      console.log(`   ⚠️  文件不存在: ${localPath}`);
      stats.skipped++;
      return null;
    }
    
    // 使用 cloudbase storage upload 命令上传
    const command = `cloudbase storage upload "${localPath}" "${cloudPath}" -e ${ENV_ID}`;
    
    execSync(command, { stdio: 'pipe' });
    
    // 生成公开访问URL
    const fileUrl = `https://${STORAGE_BUCKET}.tcb.qcloud.la/${cloudPath}`;
    
    stats.uploaded++;
    return fileUrl;
  } catch (error: any) {
    console.error(`   ❌ 上传失败: ${localPath}`);
    console.error(`      错误: ${error.message}`);
    stats.failed++;
    return null;
  }
}

/**
 * 处理单个产品的图片
 */
async function processEquipment(equipment: any): Promise<void> {
  const newImages: string[] = [];
  let updated = false;
  
  for (const imagePath of equipment.images) {
    stats.total++;
    
    // 如果已经是网络URL，跳过
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      newImages.push(imagePath);
      stats.skipped++;
      continue;
    }
    
    // 检查本地文件是否存在
    if (!fs.existsSync(imagePath)) {
      console.log(`   ⚠️  本地文件不存在: ${imagePath}`);
      stats.skipped++;
      continue;
    }
    
    // 生成云端路径（保持文件名唯一性）
    const fileName = path.basename(imagePath);
    const supplierName = path.basename(path.dirname(path.dirname(imagePath)));
    const cloudPath = `${CLOUD_PATH_PREFIX}/${supplierName}/${fileName}`;
    
    // 上传文件
    const fileUrl = await uploadFile(imagePath, cloudPath);
    
    if (fileUrl) {
      newImages.push(fileUrl);
      updated = true;
    } else {
      // 上传失败，保留原路径
      newImages.push(imagePath);
    }
  }
  
  // 如果有更新，保存到数据库
  if (updated && newImages.length > 0) {
    await prisma.equipment.update({
      where: { id: equipment.id },
      data: { images: newImages },
    });
    stats.updated++;
  }
}

async function main() {
  console.log('🚀 开始上传产品图片到 CloudBase...\n');
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
  
  console.log(`\n📊 找到 ${equipmentList.length} 个产品包含图片\n`);
  
  // 2. 逐个处理产品
  for (let i = 0; i < equipmentList.length; i++) {
    const equipment = equipmentList[i];
    
    // 只处理包含本地路径的产品
    const hasLocal = equipment.images.some(
      img => !img.startsWith('http://') && !img.startsWith('https://')
    );
    
    if (!hasLocal) {
      continue;
    }
    
    console.log(`\n📦 [${i + 1}/${equipmentList.length}] ${equipment.name.substring(0, 40)}...`);
    
    try {
      await processEquipment(equipment);
    } catch (error: any) {
      console.error(`   ❌ 处理失败: ${error.message}`);
      stats.failed++;
    }
    
    // 每处理 50 个输出一次统计
    if ((i + 1) % 50 === 0) {
      console.log('\n' + '='.repeat(60));
      console.log(`📊 中间统计 (${i + 1}/${equipmentList.length})`);
      console.log(`   总图片数: ${stats.total}`);
      console.log(`   已上传: ${stats.uploaded}`);
      console.log(`   跳过: ${stats.skipped}`);
      console.log(`   失败: ${stats.failed}`);
      console.log(`   更新产品: ${stats.updated}`);
      console.log('='.repeat(60));
    }
  }
  
  // 3. 输出最终统计
  console.log('\n' + '='.repeat(60));
  console.log('🎉 上传完成！\n');
  console.log('📊 最终统计：\n');
  console.log(`   ✅ 总图片数: ${stats.total} 张`);
  console.log(`   ✅ 已上传: ${stats.uploaded} 张`);
  console.log(`   ⏭️  跳过: ${stats.skipped} 张（已是网络URL或文件不存在）`);
  console.log(`   ❌ 失败: ${stats.failed} 张`);
  console.log(`   ✅ 更新产品: ${stats.updated} 个`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch(error => {
  console.error('❌ 上传失败:', error);
  process.exit(1);
});

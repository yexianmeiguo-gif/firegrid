import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// 产品类别映射
const CATEGORY_MAP: { [key: string]: string } = {
  '通信指挥车': 'command-vehicle',
  '后勤保障车辆': 'logistics-vehicle',
  '消防车辆': 'fire-truck',
  '救援装备': 'rescue-tools',
  '检测设备': 'detection-equipment',
  '个人防护装备': 'personal-protection',
  '灭火器材': 'fire-extinguishing',
  '其他': 'other'
}

async function importProductsFinal() {
  console.log('\n📦 导入 products_final.json...')
  const dataPath = path.join(__dirname, '../../..', 'firegrid-weixin', 'data', 'crawl', 'products_final.json')
  
  if (!fs.existsSync(dataPath)) {
    console.log('  ⚠️ 文件不存在，跳过')
    return 0
  }

  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`  加载了 ${products.length} 个产品`)

  const supplier = await prisma.supplierProfile.findFirst()
  if (!supplier) {
    console.error('  ❌ 没有供应商！')
    return 0
  }

  let imported = 0
  for (const p of products) {
    try {
      // 检查是否已存在
      const existing = await prisma.equipment.findFirst({
        where: { name: p.name }
      })
      if (existing) continue

      await prisma.equipment.create({
        data: {
          name: p.name || '未知产品',
          manufacturer: p.supplier || '未知',
          category: CATEGORY_MAP[p.category] || 'other',
          standards: [],
          applications: [],
          scenarioTags: p.category ? [p.category] : [],
          parameters: {},
          description: p.description || '',
          images: Array.isArray(p.images) ? p.images : [],
          supplierId: supplier.id,
        }
      })
      imported++
      if (imported % 50 === 0) {
        console.log(`    已导入 ${imported} 个...`)
      }
    } catch (err: any) {
      // 跳过重复或格式错误
    }
  }

  console.log(`  ✅ 导入完成: ${imported} 个`)
  return imported
}

async function importMiitVehicles() {
  console.log('\n🚗 导入 miit_vehicles.json...')
  const dataPath = path.join(__dirname, '../../..', 'firegrid-weixin', 'data', 'crawl', 'miit_vehicles.json')
  
  if (!fs.existsSync(dataPath)) {
    console.log('  ⚠️ 文件不存在，跳过')
    return 0
  }

  const vehicles = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`  加载了 ${vehicles.length} 个车辆`)

  const supplier = await prisma.supplierProfile.findFirst()
  if (!supplier) {
    console.error('  ❌ 没有供应商！')
    return 0
  }

  let imported = 0
  for (const v of vehicles) {
    try {
      // 检查是否已存在
      const existing = await prisma.equipment.findFirst({
        where: { 
          name: v.vehicle_name,
          manufacturer: v.enterprise
        }
      })
      if (existing) continue

      await prisma.equipment.create({
        data: {
          name: v.vehicle_name || '未知车辆',
          manufacturer: v.enterprise || '未知',
          category: 'fire-truck', // MIIT 数据都是消防车
          subCategory: v.vehicle_model || null,
          standards: ['工信部认证', `批次${v.batch}`],
          applications: [],
          scenarioTags: ['MIIT认证车辆'],
          parameters: {
            vehicleModel: v.vehicle_model,
            brand: v.brand,
            batch: v.batch,
            source: 'MIIT'
          },
          description: `${v.brand} ${v.vehicle_name}，工信部批次${v.batch}认证`,
          images: [],
          supplierId: supplier.id,
        }
      })
      imported++
      if (imported % 100 === 0) {
        console.log(`    已导入 ${imported} 个...`)
      }
    } catch (err: any) {
      // 跳过重复或格式错误
    }
  }

  console.log(`  ✅ 导入完成: ${imported} 个`)
  return imported
}

async function main() {
  console.log('='.repeat(50))
  console.log('🚀 开始批量导入产品数据')
  console.log('='.repeat(50))

  const count1 = await importProductsFinal()
  const count2 = await importMiitVehicles()

  const total = count1 + count2
  const dbCount = await prisma.equipment.count()

  console.log('\n' + '='.repeat(50))
  console.log('✅ 导入完成！')
  console.log(`  products_final: ${count1}`)
  console.log(`  miit_vehicles: ${count2}`)
  console.log(`  本次导入: ${total}`)
  console.log(`  数据库总计: ${dbCount}`)
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ 导入失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

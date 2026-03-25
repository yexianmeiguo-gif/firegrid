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

interface SourceProduct {
  _id: string
  name: string
  model: string
  category: string
  brand: string
  manufacturer: string
  dimensions: string
  weight: string
  key_specs: string
  main_features: string
  certifications: string
  summary: string
  source_file: string
  images?: any[]
}

async function main() {
  console.log('📥 开始导入真实产品数据...')

  // 读取 products.json
  const dataPath = path.join(__dirname, '../../..', 'firegrid-weixin', 'data', 'products.json')
  console.log(`📂 数据文件: ${dataPath}`)

  if (!fs.existsSync(dataPath)) {
    console.error('❌ 数据文件不存在！')
    process.exit(1)
  }

  const products: SourceProduct[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`✅ 加载了 ${products.length} 个产品`)

  // 先获取或创建一个供应商（用于关联产品）
  let supplier = await prisma.supplierProfile.findFirst()
  if (!supplier) {
    console.log('⚠️ 没有找到供应商，创建默认供应商...')
    const defaultUser = await prisma.user.create({
      data: {
        openId: 'default_supplier',
        role: 'SUPPLIER',
        nickname: '默认供应商',
      },
    })
    supplier = await prisma.supplierProfile.create({
      data: {
        userId: defaultUser.id,
        companyName: '默认供应商',
        mainCategories: [],
      },
    })
  }

  console.log(`📦 使用供应商: ${supplier.companyName}`)

  // 批量导入产品
  let imported = 0
  let skipped = 0

  for (const product of products) {
    try {
      // 检查是否已存在
      const existing = await prisma.equipment.findFirst({
        where: {
          name: product.name,
          manufacturer: product.manufacturer,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      // 解析参数
      const parameters: any = {}
      
      // 从 dimensions 提取尺寸
      if (product.dimensions) {
        parameters.dimensions = product.dimensions
      }

      // 从 weight 提取重量
      if (product.weight) {
        parameters.weight = product.weight
      }

      // 从 key_specs 提取关键规格
      if (product.key_specs) {
        parameters.keySpecs = product.key_specs
      }

      // 提取图片路径
      const images: string[] = []
      if (product.images && Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img.local_path) {
            images.push(img.local_path)
          }
        }
      }

      // 创建产品
      await prisma.equipment.create({
        data: {
          name: product.name,
          manufacturer: product.manufacturer,
          category: CATEGORY_MAP[product.category] || 'other',
          subCategory: product.model || null,
          standards: product.certifications ? [product.certifications] : [],
          applications: product.main_features ? [product.main_features] : [],
          scenarioTags: product.category ? [product.category] : [],
          parameters,
          description: product.summary || product.main_features,
          images,
          supplierId: supplier.id,
        },
      })

      imported++
      if (imported % 10 === 0) {
        console.log(`  已导入 ${imported} 个...`)
      }
    } catch (error) {
      console.error(`❌ 导入失败: ${product.name}`, error)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ 导入完成！')
  console.log(`  导入: ${imported}`)
  console.log(`  跳过: ${skipped}`)
  console.log(`  总计: ${products.length}`)
}

main()
  .catch((e) => {
    console.error('❌ 导入失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

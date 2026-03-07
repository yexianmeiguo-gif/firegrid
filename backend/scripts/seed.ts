import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始导入种子数据...')

  // 0. 先清空旧数据（按依赖倒序删除）
  console.log('🧹 清理旧数据...')
  await prisma.tender.deleteMany().catch(() => {})
  await prisma.article.deleteMany().catch(() => {})
  await prisma.equipment.deleteMany().catch(() => {})
  await prisma.review.deleteMany().catch(() => {})
  await prisma.favorite.deleteMany().catch(() => {})
  await prisma.aIPromptLog.deleteMany().catch(() => {})
  await prisma.supplierProfile.deleteMany().catch(() => {})
  await prisma.firefighterProfile.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})
  console.log('✅ 旧数据清理完成')

  // 1. 先创建供应商用户
  console.log('👤 创建供应商用户...')
  await prisma.user.createMany({
    data: [
      { id: 'user-s1', openId: 'wx_supplier_1', role: 'SUPPLIER', nickname: '中联重科', phone: '13800138001' },
      { id: 'user-s2', openId: 'wx_supplier_2', role: 'SUPPLIER', nickname: '德尔格', phone: '13800138002' },
      { id: 'user-s3', openId: 'wx_supplier_3', role: 'SUPPLIER', nickname: 'LUKAS', phone: '13800138003' },
      { id: 'user-s4', openId: 'wx_supplier_4', role: 'SUPPLIER', nickname: '大疆', phone: '13800138004' },
    ],
  })
  console.log('✅ 创建了 4 个供应商用户')

  // 2. 创建供应商档案，并获取他们的真实 ID
  console.log('📦 创建供应商档案...')
  
  // 分别创建，获取真实 ID
  const supplier1 = await prisma.supplierProfile.create({
    data: {
      userId: 'user-s1',
      companyName: '中联重科消防装备有限公司',
      mainCategories: ['fire-truck', 'fire-extinguishing'],
      contactPhone: '400-XXX-XXXX',
      address: '湖南省长沙市',
      subscription: 'PRO',
    },
  })
  
  const supplier2 = await prisma.supplierProfile.create({
    data: {
      userId: 'user-s2',
      companyName: '德尔格安全设备（中国）有限公司',
      mainCategories: ['personal-protection'],
      contactPhone: '400-XXX-XXXX',
      address: '上海市',
      subscription: 'ENTERPRISE',
    },
  })
  
  const supplier3 = await prisma.supplierProfile.create({
    data: {
      userId: 'user-s3',
      companyName: 'LUKAS救援装备中国代表处',
      mainCategories: ['rescue-tools'],
      contactPhone: '400-XXX-XXXX',
      address: '北京市',
      subscription: 'PRO',
    },
  })
  
  const supplier4 = await prisma.supplierProfile.create({
    data: {
      userId: 'user-s4',
      companyName: '大疆行业应用',
      mainCategories: ['communication'],
      contactPhone: '400-XXX-XXXX',
      address: '广东省深圳市',
      subscription: 'FREE',
    },
  })
  
  console.log('✅ 创建了 4 个供应商档案')
  console.log(`   - 中联重科 ID: ${supplier1.id}`)
  console.log(`   - 德尔格 ID: ${supplier2.id}`)
  console.log(`   - LUKAS ID: ${supplier3.id}`)
  console.log(`   - 大疆 ID: ${supplier4.id}`)

  // 3. 创建装备（使用真实的 supplier ID）
  console.log('🚒 创建装备数据...')
  const equipment = await prisma.equipment.createMany({
    data: [
      {
        id: 'equip-1',
        name: '水罐消防车（8吨）',
        manufacturer: '中联重科',
        category: 'fire-truck',
        subCategory: 'water-tanker',
        standards: ['GB7956', 'CCC'],
        parameters: {
          tankCapacity: '8000L',
          pumpFlow: '60L/s',
          range: '65m',
          engine: 'Diesel',
          dimensions: '8500×2500×3400mm',
        },
        description: '大型水罐消防车，适用于城市建筑火灾扑救',
        supplierId: supplier1.id,  // 使用真实的 ID
      },
      {
        id: 'equip-2',
        name: '泡沫消防车（6吨）',
        manufacturer: '中联重科',
        category: 'fire-truck',
        subCategory: 'foam-truck',
        standards: ['GB7956'],
        parameters: {
          waterTank: '4000L',
          foamTank: '2000L',
          pumpFlow: '50L/s',
          range: '60m',
        },
        description: '泡沫消防车，适用于油类火灾扑救',
        supplierId: supplier1.id,
      },
      {
        id: 'equip-3',
        name: '正压式空气呼吸器 PSS 3600',
        manufacturer: '德尔格',
        category: 'personal-protection',
        subCategory: 'breathing-apparatus',
        standards: ['GA124', 'EN137'],
        parameters: {
          cylinderCapacity: '6.8L',
          workingPressure: '30MPa',
          duration: '约45分钟',
          weight: '8.5kg',
          certification: 'CCC, CE',
        },
        description: '专业级空气呼吸器，配备智能压力监测',
        supplierId: supplier2.id,
      },
      {
        id: 'equip-4',
        name: '灭火防护服（战斗服）',
        manufacturer: '德尔格',
        category: 'personal-protection',
        subCategory: 'fire-suit',
        standards: ['GA10', 'NFPA1971'],
        parameters: {
          material: '芳纶阻燃面料',
          layers: '4层',
          weight: '2.8kg',
          heatResistance: '260°C',
        },
        description: '四层结构灭火防护服，符合国际标准',
        supplierId: supplier2.id,
      },
      {
        id: 'equip-5',
        name: '液压破拆工具组 SC 350',
        manufacturer: 'LUKAS',
        category: 'rescue-tools',
        subCategory: 'hydraulic-tools',
        standards: ['ISO', 'EN'],
        parameters: {
          spreadingForce: '120kN',
          cuttingForce: '320kN',
          pullingForce: '60kN',
          workingPressure: '63MPa',
        },
        description: '德国进口液压破拆工具，适用于车辆事故救援',
        supplierId: supplier3.id,
      },
      {
        id: 'equip-6',
        name: '消防无人机 Mavic 3T',
        manufacturer: '大疆',
        category: 'communication',
        subCategory: 'uav',
        standards: ['CE', 'FCC'],
        parameters: {
          flightTime: '45分钟',
          controlRange: '15km',
          camera: '4K热成像',
          maxSpeed: '21m/s',
          windResistance: '12m/s',
        },
        description: '行业级消防无人机，配备热成像相机',
        supplierId: supplier4.id,
      },
    ],
  })
  console.log(`✅ 创建了 ${equipment.count} 个装备`)

  // 4. 创建招标信息
  console.log('📋 创建招标信息...')
  await prisma.tender.createMany({
    data: [
      {
        id: 'tender-1',
        title: '江苏省消防救援总队消防车辆采购项目',
        tenderId: 'JS-2024-001',
        purchaser: '江苏省消防救援总队',
        amount: 2580.00,
        status: 'OPEN',
        publishDate: new Date('2024-03-15'),
        deadline: new Date('2024-04-15'),
        region: '江苏省南京市',
        category: 'fire-truck',
        content: '采购水罐消防车3辆、泡沫消防车2辆、云梯消防车1辆',
      },
      {
        id: 'tender-2',
        title: '广州市消防救援支队个人防护装备采购',
        tenderId: 'GZ-2024-002',
        purchaser: '广州市消防救援支队',
        amount: 860.00,
        status: 'OPEN',
        publishDate: new Date('2024-03-14'),
        deadline: new Date('2024-04-14'),
        region: '广东省广州市',
        category: 'personal-protection',
        content: '采购空气呼吸器200套、灭火防护服500套',
      },
      {
        id: 'tender-3',
        title: '杭州市消防救援支队抢险救援装备采购',
        tenderId: 'HZ-2024-003',
        purchaser: '杭州市消防救援支队',
        amount: 520.00,
        status: 'OPEN',
        publishDate: new Date('2024-03-13'),
        deadline: new Date('2024-04-13'),
        region: '浙江省杭州市',
        category: 'rescue-tools',
        content: '采购液压破拆工具组10套、起重气垫20套',
      },
      {
        id: 'tender-4',
        title: '四川省消防救援总队通信装备采购',
        tenderId: 'SC-2024-004',
        purchaser: '四川省消防救援总队',
        amount: 1200.00,
        status: 'OPEN',
        publishDate: new Date('2024-03-12'),
        deadline: new Date('2024-04-12'),
        region: '四川省成都市',
        category: 'communication',
        content: '采购消防无人机20架、对讲机500台',
      },
      {
        id: 'tender-5',
        title: '北京市消防救援局灭火器材采购',
        tenderId: 'BJ-2024-005',
        purchaser: '北京市消防救援局',
        amount: 320.00,
        status: 'AWARDED',
        publishDate: new Date('2024-02-20'),
        deadline: new Date('2024-03-20'),
        region: '北京市',
        category: 'fire-extinguishing',
        content: '采购干粉灭火器5000具、消防水带10000米',
        winner: '北京消防器材有限公司',
        winAmount: 298.50,
      },
    ],
  })
  console.log('✅ 创建了 5 条招标信息')

  // 5. 创建资讯文章
  console.log('📰 创建资讯文章...')
  await prisma.article.createMany({
    data: [
      {
        id: 'article-1',
        title: '高层建筑火灾扑救战术要点解析',
        summary: '本文详细分析了高层建筑火灾的特点，总结了扑救过程中的战术要点和注意事项',
        content: '详细内容...',
        category: '业务培训',
        type: 'ARTICLE',
        author: '消防救援局',
        viewCount: 2300,
        likeCount: 156,
      },
      {
        id: 'article-2',
        title: '新型压缩空气泡沫消防车技术特点',
        summary: '介绍新一代压缩空气泡沫消防车的技术原理、性能参数和实战应用效果',
        content: '详细内容...',
        category: '装备知识',
        type: 'ARTICLE',
        author: '装备研究',
        viewCount: 1800,
        likeCount: 98,
      },
      {
        id: 'article-3',
        title: '2024年消防信息化建设优秀案例',
        summary: '整理了全国各地消防信息化建设的优秀案例，包括智慧消防、数字化指挥等',
        content: '详细内容...',
        category: '信息化',
        type: 'CASE',
        author: '消防科技',
        viewCount: 3100,
        likeCount: 234,
      },
    ],
  })
  console.log('✅ 创建了 3 篇文章')

  console.log('🎉 种子数据导入完成！')
}

main()
  .catch((e) => {
    console.error('❌ 导入失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
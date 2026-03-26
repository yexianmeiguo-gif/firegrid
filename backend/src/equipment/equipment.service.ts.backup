import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  // 获取装备分类树
  async getCategories() {
    // 返回预定义的消防装备分类
    return [
      {
        id: 'fire-truck',
        name: '消防车辆',
        children: [
          { id: 'water-tanker', name: '水罐消防车' },
          { id: 'foam-truck', name: '泡沫消防车' },
          { id: 'aerial-platform', name: '云梯消防车' },
          { id: 'rescue-truck', name: '抢险救援车' },
          { id: 'special-duty', name: '专勤消防车' },
        ],
      },
      {
        id: 'personal-protection',
        name: '个人防护装备',
        children: [
          { id: 'fire-suit', name: '灭火防护服' },
          { id: 'breathing-apparatus', name: '空气呼吸器' },
          { id: 'fire-helmet', name: '消防头盔' },
          { id: 'fire-boots', name: '消防靴' },
          { id: 'fire-gloves', name: '消防手套' },
        ],
      },
      {
        id: 'rescue-tools',
        name: '抢险救援器材',
        children: [
          { id: 'hydraulic-tools', name: '液压破拆工具' },
          { id: 'lifting-tools', name: '顶撑起重装备' },
          { id: 'cutting-tools', name: '切割器材' },
          { id: 'detection-tools', name: '侦检探测器材' },
          { id: 'lighting-tools', name: '照明排烟装备' },
        ],
      },
      {
        id: 'fire-extinguishing',
        name: '灭火器材',
        children: [
          { id: 'fire-hose', name: '消防水带' },
          { id: 'nozzle', name: '消防水枪' },
          { id: 'fire-extinguisher', name: '灭火器' },
          { id: 'fire-hydrant', name: '消火栓' },
        ],
      },
      {
        id: 'communication',
        name: '通信指挥装备',
        children: [
          { id: 'radio', name: '无线通信设备' },
          { id: 'command-system', name: '指挥调度系统' },
          { id: 'image-transmission', name: '图像传输设备' },
        ],
      },
    ];
  }

  // 获取装备列表
  async findAll(filters: any) {
    try {
      const where: any = {};
      
      if (filters.category) {
        where.category = filters.category;
      }
      
      if (filters.keyword) {
        where.OR = [
          { name: { contains: filters.keyword } },
          { manufacturer: { contains: filters.keyword } },
        ];
      }

      const equipment = await this.prisma.equipment.findMany({
        where,
        include: {
          supplier: {
            select: {
              companyName: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

      return equipment.length > 0 ? equipment : this.getMockEquipment(filters.limit || 4);
    } catch (error) {
      console.error('获取装备列表失败:', error);
      return this.getMockEquipment(filters.limit || 4);
    }
  }

  // 模拟装备数据
  private getMockEquipment(limit: number) {
    const mockEquipment = [
      {
        id: '1',
        name: '水罐消防车',
        manufacturer: '中联重科',
        category: 'fire-truck',
        subCategory: 'water-tanker',
        standards: ['GB7956'],
        parameters: { capacity: '8000L', flow: '60L/s' },
        description: '大型水罐消防车',
        images: [],
        supplierId: '1',
        supplier: { companyName: '中联重科消防装备有限公司' },
        _count: { reviews: 12 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '正压式空气呼吸器',
        manufacturer: '德尔格',
        category: 'personal-protection',
        subCategory: 'breathing-apparatus',
        standards: ['GA124'],
        parameters: { capacity: '6.8L', duration: '45min' },
        description: '专业空气呼吸器',
        images: [],
        supplierId: '2',
        supplier: { companyName: '德尔格安全设备' },
        _count: { reviews: 28 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: '液压破拆工具组',
        manufacturer: 'LUKAS',
        category: 'rescue-tools',
        subCategory: 'hydraulic-tools',
        standards: ['ISO']
        ,parameters: { force: '100kN' },
        description: '进口液压破拆工具',
        images: [],
        supplierId: '3',
        supplier: { companyName: 'LUKAS救援装备' },
        _count: { reviews: 15 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: '消防无人机',
        manufacturer: '大疆',
        category: 'communication',
        subCategory: 'uav',
        standards: ['CE'],
        parameters: { flightTime: '30min', range: '5km' },
        description: '消防侦查无人机',
        images: [],
        supplierId: '4',
        supplier: { companyName: '大疆行业应用' },
        _count: { reviews: 8 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return mockEquipment.slice(0, limit);
  }

  // 获取装备详情
  async findById(id: string) {
    return this.prisma.equipment.findUnique({
      where: { id },
      include: {
        supplier: true,
        reviews: {
          include: {
            user: {
              select: {
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  // 对比装备
  async compare(ids: string[]) {
    return this.prisma.equipment.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        supplier: {
          select: {
            companyName: true,
          },
        },
      },
    });
  }
}
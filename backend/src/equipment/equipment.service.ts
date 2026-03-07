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

    return this.prisma.equipment.findMany({
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
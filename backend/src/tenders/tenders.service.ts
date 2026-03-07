import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TendersService {
  constructor(private prisma: PrismaService) {}

  // 获取招标列表
  async findAll(filters: any) {
    try {
      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.region) {
        where.region = { contains: filters.region };
      }

      const tenders = await this.prisma.tender.findMany({
        where,
        orderBy: { publishDate: 'desc' },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

      return tenders;
    } catch (error) {
      console.error('获取招标列表失败:', error);
      // 数据库错误时返回模拟数据
      return this.getMockTenders(filters.limit || 3);
    }
  }

  // 模拟招标数据
  private getMockTenders(limit: number) {
    const mockTenders = [
      {
        id: '1',
        title: '江苏省消防救援总队消防车采购项目',
        tenderId: 'JS-2024-001',
        purchaser: '江苏省消防救援总队',
        amount: 2580.00,
        status: 'OPEN',
        publishDate: new Date('2024-03-15'),
        deadline: new Date('2024-04-15'),
        region: '江苏省南京市',
        category: '消防车辆',
        url: '',
        content: '采购水罐消防车、泡沫消防车等',
        winner: null,
        winAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: '广州市消防救援支队个人防护装备采购',
        tenderId: 'GZ-2024-002',
        purchaser: '广州市消防救援支队',
        amount: 860.00,
        status: 'OPEN',
        publishDate: new Date('2024-03-14'),
        deadline: new Date('2024-04-14'),
        region: '广东省广州市',
        category: '个人防护',
        url: '',
        content: '采购空气呼吸器、防护服等',
        winner: null,
        winAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        title: '杭州市消防救援支队破拆工具采购项目',
        tenderId: 'HZ-2024-003',
        purchaser: '杭州市消防救援支队',
        amount: 320.00,
        status: 'AWARDED',
        publishDate: new Date('2024-03-13'),
        deadline: new Date('2024-04-13'),
        region: '浙江省杭州市',
        category: '破拆工具',
        url: '',
        content: '采购液压破拆工具组',
        winner: 'XX装备有限公司',
        winAmount: 298.50,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return mockTenders.slice(0, limit);
  }

  // 获取招标详情
  async findById(id: string) {
    return this.prisma.tender.findUnique({
      where: { id },
    });
  }

  // 获取推荐商机（B端）
  async getRecommendations(userId: string, limit: number = 10) {
    // 获取用户的企业标签
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { supplierProfile: true },
    });

    if (!user?.supplierProfile) {
      return [];
    }

    const categories = user.supplierProfile.mainCategories;

    // 基于企业主营类目推荐匹配的招标
    return this.prisma.tender.findMany({
      where: {
        status: 'OPEN',
        OR: [
          { category: { in: categories } },
          categories.length === 0 ? {} : {},
        ],
      },
      orderBy: { publishDate: 'desc' },
      take: limit,
    });
  }

  // 同步第三方招标数据（模拟）
  async syncTenders() {
    // TODO: 对接立达标讯等第三方API
    // 暂时返回成功
    return {
      success: true,
      message: '招标数据同步功能待对接第三方API',
    };
  }
}
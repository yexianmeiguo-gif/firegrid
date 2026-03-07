import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TendersService {
  constructor(private prisma: PrismaService) {}

  // 获取招标列表
  async findAll(filters: any) {
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

    return this.prisma.tender.findMany({
      where,
      orderBy: { publishDate: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
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
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  // 获取文章列表
  async findAll(filters: any) {
    const where: any = {
      isPublished: true,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.article.findMany({
      where,
      orderBy: { publishAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  }

  // 获取文章详情
  async findById(id: string) {
    // 更新浏览量
    await this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return this.prisma.article.findUnique({
      where: { id },
    });
  }

  // 获取分类列表
  async getCategories() {
    return [
      { id: 'training', name: '业务培训', count: 0 },
      { id: 'case', name: '实战案例', count: 0 },
      { id: 'equipment', name: '装备知识', count: 0 },
      { id: 'policy', name: '政策法规', count: 0 },
      { id: 'informatization', name: '信息化项目', count: 0 },
    ];
  }

  // 获取首页推荐
  async getFeatured() {
    return this.prisma.article.findMany({
      where: {
        isPublished: true,
        type: 'CASE',
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
    });
  }
}
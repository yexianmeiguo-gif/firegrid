import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { 
  ProcurementDemand, 
  SupplyOffer, 
  DemandMatch,
  DemandStatus,
  OfferStatus,
  MatchStatus,
  InterestStatus
} from '@prisma/client';

// 匹配结果接口
interface MatchResult {
  offer: SupplyOffer;
  score: number;
  reasons: string[];
}

@Injectable()
export class MatchmakingService {
  constructor(private prisma: PrismaService) {}

  // ==================== 需求管理 ====================
  
  // 创建采购需求
  async createDemand(data: {
    publisherId: string;
    publisherType: string;
    title: string;
    description?: string;
    department?: string;
    region: string;
    contactName?: string;
    contactPhone?: string;
    category: string;
    subCategory?: string;
    budgetMin?: number;
    budgetMax?: number;
    quantity?: number;
    requirements?: any;
    deadline?: Date;
    validDays?: number;
  }): Promise<ProcurementDemand> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validDays || 30));

    const demand = await this.prisma.procurementDemand.create({
      data: {
        ...data,
        validUntil,
        status: DemandStatus.OPEN,
      },
    });

    // 创建后自动执行匹配
    await this.findMatchesForDemand(demand.id);

    return demand;
  }

  // 获取需求列表
  async getDemands(filters: {
    category?: string;
    region?: string;
    status?: DemandStatus;
    page?: number;
    limit?: number;
  }): Promise<{ items: ProcurementDemand[]; total: number }> {
    const { category, region, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (category) where.category = category;
    if (region) where.region = { contains: region };
    if (status) where.status = status;
    
    // 只返回有效期内的需求
    where.validUntil = { gte: new Date() };

    const [items, total] = await Promise.all([
      this.prisma.procurementDemand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          matches: {
            where: { matchScore: { gte: 70 } },
            orderBy: { matchScore: 'desc' },
            take: 3,
            include: { offer: true },
          },
        },
      }),
      this.prisma.procurementDemand.count({ where }),
    ]);

    return { items, total };
  }

  // 获取需求详情
  async getDemandById(id: string): Promise<ProcurementDemand & { matches: any[] }> {
    const demand = await this.prisma.procurementDemand.findUnique({
      where: { id },
      include: {
        matches: {
          orderBy: { matchScore: 'desc' },
          include: { offer: true },
        },
      },
    });

    if (!demand) throw new NotFoundException('需求不存在');
    return demand;
  }

  // ==================== 供应管理 ====================

  // 创建供应发布
  async createOffer(data: {
    supplierId: string;
    companyName: string;
    title: string;
    description?: string;
    region: string;
    contactName?: string;
    contactPhone?: string;
    category: string;
    subCategory?: string;
    brand?: string;
    model?: string;
    price?: number;
    quantity?: number;
    specifications?: any;
    certificates?: string[];
    stockStatus?: string;
    deliveryDays?: number;
    validDays?: number;
  }): Promise<SupplyOffer> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validDays || 30));

    const offer = await this.prisma.supplyOffer.create({
      data: {
        ...data,
        validUntil,
        status: OfferStatus.ACTIVE,
      },
    });

    // 创建后自动执行匹配
    await this.findMatchesForOffer(offer.id);

    return offer;
  }

  // 获取供应列表
  async getOffers(filters: {
    category?: string;
    region?: string;
    status?: OfferStatus;
    page?: number;
    limit?: number;
  }): Promise<{ items: SupplyOffer[]; total: number }> {
    const { category, region, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (category) where.category = category;
    if (region) where.region = { contains: region };
    if (status) where.status = status;
    
    // 只返回有效期内的供应
    where.validUntil = { gte: new Date() };

    const [items, total] = await Promise.all([
      this.prisma.supplyOffer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplyOffer.count({ where }),
    ]);

    return { items, total };
  }

  // 获取供应详情
  async getOfferById(id: string): Promise<SupplyOffer & { matches: any[] }> {
    const offer = await this.prisma.supplyOffer.findUnique({
      where: { id },
      include: {
        matches: {
          orderBy: { matchScore: 'desc' },
          include: { demand: true },
        },
      },
    });

    if (!offer) throw new NotFoundException('供应信息不存在');
    return offer;
  }

  // ==================== 智能匹配算法 ====================

  // 为需求寻找匹配
  async findMatchesForDemand(demandId: string): Promise<MatchResult[]> {
    const demand = await this.prisma.procurementDemand.findUnique({
      where: { id: demandId },
    });

    if (!demand) return [];

    // 获取同类别且有效期内的供应
    const offers = await this.prisma.supplyOffer.findMany({
      where: {
        category: demand.category,
        status: OfferStatus.ACTIVE,
        validUntil: { gte: new Date() },
      },
    });

    // 计算匹配分数
    const matches: MatchResult[] = offers.map(offer => {
      const { score, reasons } = this.calculateMatchScore(demand, offer);
      return { offer, score, reasons };
    });

    // 过滤低分匹配（低于40分不考虑）
    const validMatches = matches.filter(m => m.score >= 40);

    // 按分数排序
    validMatches.sort((a, b) => b.score - a.score);

    // 保存匹配记录（只保存前10个高分匹配）
    const topMatches = validMatches.slice(0, 10);
    
    await Promise.all(
      topMatches.map(match =>
        this.prisma.demandMatch.upsert({
          where: {
            demandId_offerId: {
              demandId: demand.id,
              offerId: match.offer.id,
            },
          },
          update: {
            matchScore: match.score,
            matchReasons: match.reasons,
          },
          create: {
            demandId: demand.id,
            offerId: match.offer.id,
            matchScore: match.score,
            matchReasons: match.reasons,
            status: MatchStatus.PENDING,
            demandInterest: InterestStatus.PENDING,
            offerInterest: InterestStatus.PENDING,
          },
        }),
      ),
    );

    return topMatches;
  }

  // 为供应寻找匹配
  async findMatchesForOffer(offerId: string): Promise<MatchResult[]> {
    const offer = await this.prisma.supplyOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) return [];

    // 获取同类别且有效期内的需求
    const demands = await this.prisma.procurementDemand.findMany({
      where: {
        category: offer.category,
        status: DemandStatus.OPEN,
        validUntil: { gte: new Date() },
      },
    });

    // 计算匹配分数
    const matches: MatchResult[] = demands.map(demand => {
      const { score, reasons } = this.calculateMatchScore(demand, offer);
      return { offer, score, reasons };
    });

    // 过滤低分匹配
    const validMatches = matches.filter(m => m.score >= 40);
    validMatches.sort((a, b) => b.score - a.score);

    // 保存匹配记录
    const topMatches = validMatches.slice(0, 10);
    
    await Promise.all(
      topMatches.map(match =>
        this.prisma.demandMatch.upsert({
          where: {
            demandId_offerId: {
              demandId: match.offer.id,
              offerId: offer.id,
            },
          },
          update: {
            matchScore: match.score,
            matchReasons: match.reasons,
          },
          create: {
            demandId: match.offer.id,
            offerId: offer.id,
            matchScore: match.score,
            matchReasons: match.reasons,
            status: MatchStatus.PENDING,
            demandInterest: InterestStatus.PENDING,
            offerInterest: InterestStatus.PENDING,
          },
        }),
      ),
    );

    return topMatches;
  }

  // 智能匹配算法核心
  private calculateMatchScore(
    demand: ProcurementDemand,
    offer: SupplyOffer,
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // 1. 地域匹配 (25分)
    if (demand.region && offer.region) {
      if (demand.region === offer.region) {
        score += 25;
        reasons.push('同地区');
      } else if (demand.region.includes(offer.region) || offer.region.includes(demand.region)) {
        score += 15;
        reasons.push('邻近地区');
      }
    }

    // 2. 预算匹配 (25分)
    if (demand.budgetMax && offer.price) {
      const price = offer.price.toNumber();
      const budgetMax = demand.budgetMax.toNumber();
      
      if (price <= budgetMax) {
        score += 25;
        reasons.push('预算符合');
      } else if (price <= budgetMax * 1.1) {
        score += 15;
        reasons.push('预算接近');
      }
    }

    // 3. 类别匹配 (20分)
    if (demand.category === offer.category) {
      score += 20;
      reasons.push('品类匹配');
    }

    // 4. 子类别匹配 (10分)
    if (demand.subCategory && offer.subCategory && 
        demand.subCategory === offer.subCategory) {
      score += 10;
      reasons.push('型号匹配');
    }

    // 5. 库存状态 (10分)
    if (offer.stockStatus === 'IN_STOCK') {
      score += 10;
      reasons.push('现货供应');
    } else if (offer.stockStatus === 'PRE_ORDER') {
      score += 5;
      reasons.push('可预订');
    }

    // 6. 资质认证 (10分)
    if (offer.certificates && offer.certificates.length > 0) {
      score += 10;
      reasons.push('资质齐全');
    }

    return { score, reasons };
  }

  // ==================== 撮合操作 ====================

  // 表达意向
  async expressInterest(
    matchId: string,
    party: 'demand' | 'offer',
    interest: InterestStatus,
  ): Promise<DemandMatch> {
    const updateData: any = {};
    
    if (party === 'demand') {
      updateData.demandInterest = interest;
    } else {
      updateData.offerInterest = interest;
    }

    // 如果双方都表达有意向，更新撮合状态为"已联系"
    const match = await this.prisma.demandMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    if (
      match.demandInterest === InterestStatus.INTERESTED &&
      match.offerInterest === InterestStatus.INTERESTED
    ) {
      await this.prisma.demandMatch.update({
        where: { id: matchId },
        data: { status: MatchStatus.CONTACTED },
      });
    }

    return match;
  }

  // 获取我的需求列表（发布者视角）
  async getMyDemands(publisherId: string): Promise<ProcurementDemand[]> {
    return this.prisma.procurementDemand.findMany({
      where: { publisherId },
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          orderBy: { matchScore: 'desc' },
          include: { offer: true },
        },
      },
    });
  }

  // 获取我的供应列表（供应商视角）
  async getMyOffers(supplierId: string): Promise<SupplyOffer[]> {
    return this.prisma.supplyOffer.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          orderBy: { matchScore: 'desc' },
          include: { demand: true },
        },
      },
    });
  }
}
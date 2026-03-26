import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { FilterEquipmentResponseDto, EquipmentCardDto } from './dto/equipment-response.dto';
import { FilterOptionsResponseDto } from './dto/filter-options-response.dto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 装备服务
 */
@Injectable()
export class EquipmentService {
  private standardMapping: any; // 国标产品映射表

  constructor(private prisma: PrismaService) {
    // 加载国标产品映射表
    this.loadStandardMapping();
  }

  /**
   * 加载国标产品映射表
   */
  private loadStandardMapping() {
    try {
      const mappingPath = path.join(__dirname, '../../../scripts/standard-product-mapping.json');
      const mappingData = fs.readFileSync(mappingPath, 'utf-8');
      this.standardMapping = JSON.parse(mappingData);
      console.log('✅ 国标产品映射表加载成功');
    } catch (error) {
      console.error('❌ 国标产品映射表加载失败:', error.message);
      this.standardMapping = {};
    }
  }

  /**
   * 获取分类的中文名称
   */
  private getCategoryLabel(categoryKey: string): string {
    const labels = {
      fire_detection: '火灾报警系统',
      fire_extinguisher: '灭火器',
      sprinkler_system: '自动喷水灭火系统',
      hydrant_equipment: '消火栓系统',
      fire_truck: '消防车辆',
      personal_protection: '个人防护装备',
      rescue_tools: '消防救援工具',
      emergency_lighting: '消防应急照明',
      escape_equipment: '逃生设备',
    };
    return labels[categoryKey] || categoryKey;
  }

  /**
   * 筛选装备
   */
  async filterEquipment(dto: FilterEquipmentDto): Promise<FilterEquipmentResponseDto> {
    const {
      priceRange,
      categories,
      productTypes,
      standards,
      partnershipStatus,
      sortBy = 'inquiry_count',
      page = 1,
      pageSize = 20,
    } = dto;

    // 构建查询条件
    const whereConditions: any = {};
    const havingConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 1. 类别筛选（一级分类）
    if (categories && categories.length > 0) {
      whereConditions.category = { in: categories };
    }

    // 2. 二级分类筛选（具体产品名称）
    if (productTypes && productTypes.length > 0) {
      whereConditions.OR = productTypes.map(pt => ({
        name: { contains: pt },
      }));
    }

    // 3. 认证标准筛选
    if (standards && standards.length > 0) {
      whereConditions.standards = {
        hasSome: standards,
      };
    }

    // 4. 价格筛选（需要 JOIN equipment_suppliers）
    const priceFilter: any = {};
    if (priceRange) {
      if (priceRange.min !== undefined) {
        priceFilter.price_min = { gte: priceRange.min };
      }
      if (priceRange.max !== undefined) {
        priceFilter.price_max = { lte: priceRange.max };
      }
    }

    // 5. 供应商合作状态筛选
    const supplierFilter: any = {};
    if (partnershipStatus && partnershipStatus.length > 0) {
      supplierFilter.partnershipStatus = { in: partnershipStatus };
    }

    // 查询装备
    const equipment = await this.prisma.equipment.findMany({
      where: whereConditions,
      include: {
        companies_equipment_manufacturer_idTocompanies: {
          select: {
            id: true,
            name: true,
          },
        },
        companies_equipment_primary_supplier_idTocompanies: {
          select: {
            id: true,
            name: true,
            partnership_status: true,
            partnership_level: true,
          },
        },
        equipment_suppliers: {
          where: {
            ...priceFilter,
            companies: supplierFilter,
          },
          include: {
            companies: {
              select: {
                id: true,
                name: true,
                partnership_status: true,
                partnership_level: true,
              },
            },
          },
          orderBy: {
            priority: 'desc',
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 统计总数
    const total = await this.prisma.equipment.count({
      where: whereConditions,
    });

    // 转换为 DTO
    const items: EquipmentCardDto[] = equipment.map(eq => {
      // 计算价格区间（从所有供应商中取最小和最大）
      let minPrice = Infinity;
      let maxPrice = 0;
      eq.equipment_suppliers.forEach(es => {
        const priceMin = es.price_min ? Number(es.price_min) : 0;
        const priceMax = es.price_max ? Number(es.price_max) : 0;
        if (priceMin > 0 && priceMin < minPrice) minPrice = priceMin;
        if (priceMax > maxPrice) maxPrice = priceMax;
      });

      // 如果没有价格数据，使用默认值
      if (minPrice === Infinity) minPrice = 0;

      const manufacturerData = eq.companies_equipment_manufacturer_idTocompanies;
      const primarySupplierData = eq.companies_equipment_primary_supplier_idTocompanies;

      return {
        id: eq.id,
        name: eq.name,
        category: eq.category,
        subCategory: eq.subCategory,
        manufacturer: {
          id: manufacturerData?.id || '',
          name: manufacturerData?.name || '',
        },
        images: eq.images || [],
        priceRange: {
          min: minPrice,
          max: maxPrice,
          unit: 'CNY',
        },
        standards: eq.standards || [],
        supplierCount: eq.equipment_suppliers.length,
        inquiryCount: eq.equipment_suppliers.reduce((sum, es) => sum + (es.inquiry_count || 0), 0),
        primarySupplier: primarySupplierData
          ? {
              id: primarySupplierData.id,
              name: primarySupplierData.name,
              partnershipStatus: primarySupplierData.partnership_status,
              partnershipLevel: primarySupplierData.partnership_level,
            }
          : undefined,
      };
    });

    // 排序
    items.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.priceRange.min - b.priceRange.min;
        case 'price_desc':
          return b.priceRange.max - a.priceRange.max;
        case 'inquiry_count':
          return b.inquiryCount - a.inquiryCount;
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN');
        default:
          return 0;
      }
    });

    // 筛选摘要
    let appliedFiltersCount = 0;
    if (priceRange && (priceRange.min || priceRange.max)) appliedFiltersCount++;
    if (categories && categories.length > 0) appliedFiltersCount++;
    if (productTypes && productTypes.length > 0) appliedFiltersCount++;
    if (standards && standards.length > 0) appliedFiltersCount++;
    if (partnershipStatus && partnershipStatus.length > 0) appliedFiltersCount++;

    const filterSummary = {
      appliedFiltersCount,
      priceRange: priceRange
        ? `${(priceRange.min || 0) / 10000}万-${(priceRange.max || 0) / 10000}万`
        : undefined,
      categories: categories?.map(c => this.getCategoryLabel(c)),
      standards,
    };

    return {
      success: true,
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      filterSummary,
    };
  }

  /**
   * 获取筛选条件统计
   */
  async getFilterOptions(): Promise<FilterOptionsResponseDto> {
    // 1. 统计各分类的装备数量
    const categoryStats = await this.prisma.equipment.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const categories = categoryStats.map(stat => ({
      value: stat.category,
      label: this.getCategoryLabel(stat.category),
      count: stat._count.id,
      subCategories: [], // TODO: 统计子分类
    }));

    // 2. 统计价格区间
    const priceRanges = [
      { min: 0, max: 50000, label: '5万以下', count: 0 },
      { min: 50000, max: 100000, label: '5-10万', count: 0 },
      { min: 100000, max: 200000, label: '10-20万', count: 0 },
      { min: 200000, max: 500000, label: '20-50万', count: 0 },
      { min: 500000, max: 1000000, label: '50-100万', count: 0 },
      { min: 1000000, max: 99999999, label: '100万以上', count: 0 },
    ];

    // TODO: 统计每个价格区间的装备数量（需要 JOIN equipment_suppliers）

    // 3. 统计认证标准
    const equipmentWithStandards = await this.prisma.equipment.findMany({
      select: {
        standards: true,
      },
      where: {
        standards: {
          isEmpty: false,
        },
      },
    });

    const standardsMap = new Map<string, number>();
    equipmentWithStandards.forEach(eq => {
      eq.standards?.forEach(std => {
        standardsMap.set(std, (standardsMap.get(std) || 0) + 1);
      });
    });

    const standards = Array.from(standardsMap.entries())
      .map(([value, count]) => ({
        value,
        label: value,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // 取前 20 个常用标准

    // 4. 统计供应商合作状态
    const partnershipStatusStats = await this.prisma.companies.groupBy({
      by: ['partnership_status'],
      _count: {
        id: true,
      },
    });

    const partnershipStatusLabels = {
      partner: '合作商',
      subscriber: '订阅商',
      exhibition: '展会商',
      none: '普通',
    };

    const partnershipStatus = partnershipStatusStats.map(stat => ({
      value: stat.partnership_status,
      label: partnershipStatusLabels[stat.partnership_status] || stat.partnership_status,
      count: stat._count.id,
    }));

    return {
      success: true,
      categories,
      priceRanges,
      standards,
      partnershipStatus,
    };
  }

  /**
   * 获取装备详情
   */
  async getEquipmentDetail(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        companies_equipment_manufacturer_idTocompanies: true,
        equipment_suppliers: {
          include: {
            companies: true,
          },
          orderBy: {
            priority: 'desc',
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('装备不存在');
    }

    return {
      success: true,
      data: {
        id: equipment.id,
        name: equipment.name,
        description: equipment.description,
        category: equipment.category,
        subCategory: equipment.subCategory,
        manufacturer: equipment.companies_equipment_manufacturer_idTocompanies,
        images: equipment.images,
        parameters: equipment.parameters,
        standards: equipment.standards,
        applications: equipment.applications,
        scenarioTags: equipment.scenarioTags,
        suppliers: equipment.equipment_suppliers.map(es => ({
          id: es.companies.id,
          name: es.companies.name,
          partnershipStatus: es.companies.partnership_status,
          partnershipLevel: es.companies.partnership_level,
          priceRange: {
            min: es.price_min ? Number(es.price_min) : 0,
            max: es.price_max ? Number(es.price_max) : 0,
          },
          isAvailable: es.is_available,
          inquiryCount: es.inquiry_count,
          contactPhone: es.companies.contact_phone,
        })),
      },
    };
  }

  // ==================== 以下是原有方法（保留兼容性）====================

  /**
   * 获取装备分类树（原有方法）
   */
  async getCategories() {
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
    ];
  }

  /**
   * 获取装备列表（原有方法）
   */
  async findAll(filters: any) {
    try {
      const where: any = {};

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.keyword) {
        where.OR = [
          { name: { contains: filters.keyword } },
        ];
      }

      const equipment = await this.prisma.equipment.findMany({
        where,
        include: {
          companies_equipment_manufacturer_idTocompanies: true,
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

      return equipment;
    } catch (error) {
      console.error('获取装备列表失败:', error);
      return [];
    }
  }

  /**
   * 获取装备详情（原有方法，已重写为 getEquipmentDetail）
   */
  async findById(id: string) {
    return this.getEquipmentDetail(id);
  }

  /**
   * 对比装备（原有方法）
   */
  async compare(ids: string[]) {
    return this.prisma.equipment.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        companies_equipment_manufacturer_idTocompanies: true,
      },
    });
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * 制造商信息
 */
export class ManufacturerDto {
  @ApiProperty({ description: '制造商 ID', example: 'uuid-xxx' })
  id: string;

  @ApiProperty({ description: '制造商名称', example: '中联重科' })
  name: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  logo?: string;
}

/**
 * 价格区间
 */
export class PriceRangeDto {
  @ApiProperty({ description: '最低价格（元）', example: 1800000 })
  min: number;

  @ApiProperty({ description: '最高价格（元）', example: 2200000 })
  max: number;

  @ApiProperty({ description: '价格单位', example: 'CNY', default: 'CNY' })
  unit: string = 'CNY';
}

/**
 * 主供应商信息
 */
export class PrimarySupplierDto {
  @ApiProperty({ description: '供应商 ID', example: 'uuid-xxx' })
  id: string;

  @ApiProperty({ description: '供应商名称', example: '供应商A' })
  name: string;

  @ApiProperty({
    description: '合作状态',
    example: 'partner',
    enum: ['partner', 'subscriber', 'exhibition', 'none'],
  })
  partnershipStatus: string;

  @ApiProperty({ description: '合作等级（1-5）', example: 5 })
  partnershipLevel: number;
}

/**
 * 装备卡片（列表项）
 */
export class EquipmentCardDto {
  @ApiProperty({ description: '装备 ID', example: 'equip-001' })
  id: string;

  @ApiProperty({ description: '装备名称', example: '水罐消防车（8吨）' })
  name: string;

  @ApiProperty({ description: '一级分类', example: 'fire_truck' })
  category: string;

  @ApiProperty({ description: '二级分类', example: 'water-tanker' })
  subCategory: string;

  @ApiProperty({ description: '制造商信息', type: ManufacturerDto })
  manufacturer: ManufacturerDto;

  @ApiProperty({ description: '图片 URL 数组', type: [String] })
  images: string[];

  @ApiProperty({ description: '价格区间', type: PriceRangeDto })
  priceRange: PriceRangeDto;

  @ApiProperty({ description: '认证标准', type: [String], example: ['GB 7956'] })
  standards: string[];

  @ApiProperty({ description: '供应商数量', example: 5 })
  supplierCount: number;

  @ApiProperty({ description: '询价次数', example: 123 })
  inquiryCount: number;

  @ApiProperty({ description: '主供应商信息', type: PrimarySupplierDto, required: false })
  primarySupplier?: PrimarySupplierDto;
}

/**
 * 分页信息
 */
export class PaginationDto {
  @ApiProperty({ description: '总记录数', example: 156 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 20 })
  pageSize: number;

  @ApiProperty({ description: '总页数', example: 8 })
  totalPages: number;
}

/**
 * 筛选摘要
 */
export class FilterSummaryDto {
  @ApiProperty({ description: '已应用的筛选条件数量', example: 3 })
  appliedFiltersCount: number;

  @ApiProperty({ description: '价格区间描述', example: '10-20万', required: false })
  priceRange?: string;

  @ApiProperty({ description: '已选分类', type: [String], required: false })
  categories?: string[];

  @ApiProperty({ description: '已选认证标准', type: [String], required: false })
  standards?: string[];
}

/**
 * 装备筛选响应
 */
export class FilterEquipmentResponseDto {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '装备列表', type: [EquipmentCardDto] })
  items: EquipmentCardDto[];

  @ApiProperty({ description: '分页信息', type: PaginationDto })
  pagination: PaginationDto;

  @ApiProperty({ description: '筛选摘要', type: FilterSummaryDto })
  filterSummary: FilterSummaryDto;
}

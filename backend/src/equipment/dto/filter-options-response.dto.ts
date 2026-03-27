import { ApiProperty } from '@nestjs/swagger';

/**
 * 分类选项（一级分类）
 */
export class CategoryOptionDto {
  @ApiProperty({ description: '分类值', example: 'fire_detection' })
  value: string;

  @ApiProperty({ description: '分类标签（中文）', example: '火灾报警系统' })
  label: string;

  @ApiProperty({ description: '该分类下的装备数量', example: 234 })
  count: number;

  @ApiProperty({ description: '子分类（二级分类）', type: [Object], required: false })
  subCategories?: Array<{
    value: string;
    label: string;
    count: number;
  }>;
}

/**
 * 价格区间选项
 */
export class PriceRangeOptionDto {
  @ApiProperty({ description: '最低价格（元）', example: 0 })
  min: number;

  @ApiProperty({ description: '最高价格（元）', example: 50000 })
  max: number;

  @ApiProperty({ description: '价格区间标签', example: '5万以下' })
  label: string;

  @ApiProperty({ description: '该价格区间的装备数量', example: 120 })
  count: number;
}

/**
 * 认证标准选项
 */
export class StandardOptionDto {
  @ApiProperty({ description: '标准号', example: 'GB 7956' })
  value: string;

  @ApiProperty({ description: '标准说明', example: 'GB 7956（消防车）' })
  label: string;

  @ApiProperty({ description: '符合该标准的装备数量', example: 784 })
  count: number;
}

/**
 * 供应商合作状态选项
 */
export class PartnershipStatusOptionDto {
  @ApiProperty({ description: '合作状态值', example: 'partner' })
  value: string;

  @ApiProperty({ description: '合作状态标签', example: '合作商' })
  label: string;

  @ApiProperty({ description: '该状态的供应商数量', example: 500 })
  count: number;
}

/**
 * 筛选条件统计响应
 */
export class FilterOptionsResponseDto {
  @ApiProperty({ description: '是否成功', example: true })
  success: boolean;

  @ApiProperty({ description: '分类选项', type: [CategoryOptionDto] })
  categories: CategoryOptionDto[];

  @ApiProperty({ description: '价格区间选项', type: [PriceRangeOptionDto] })
  priceRanges: PriceRangeOptionDto[];

  @ApiProperty({ description: '认证标准选项', type: [StandardOptionDto] })
  standards: StandardOptionDto[];

  @ApiProperty({ description: '供应商合作状态选项', type: [PartnershipStatusOptionDto] })
  partnershipStatus: PartnershipStatusOptionDto[];
}

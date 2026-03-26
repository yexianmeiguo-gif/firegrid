import { IsOptional, IsArray, IsInt, Min, Max, IsString, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 价格区间 DTO
 */
class PriceRangeDto {
  @ApiProperty({ description: '最低价格（元）', required: false, example: 100000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  min?: number;

  @ApiProperty({ description: '最高价格（元）', required: false, example: 200000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max?: number;
}

/**
 * 装备筛选请求 DTO
 */
export class FilterEquipmentDto {
  @ApiProperty({
    description: '价格区间',
    required: false,
    type: PriceRangeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;

  @ApiProperty({
    description: '一级分类（国标大类）',
    required: false,
    example: ['fire_detection', 'fire_truck'],
    enum: [
      'fire_detection',
      'fire_extinguisher',
      'sprinkler_system',
      'hydrant_equipment',
      'fire_truck',
      'personal_protection',
      'rescue_tools',
      'emergency_lighting',
      'escape_equipment',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({
    description: '二级分类（具体产品名称）',
    required: false,
    example: ['点型感烟火灾探测器', '水罐消防车'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productTypes?: string[];

  @ApiProperty({
    description: '认证标准',
    required: false,
    example: ['GB 4715', 'GB 7956'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  standards?: string[];

  @ApiProperty({
    description: '供应商合作状态',
    required: false,
    example: ['partner', 'subscriber'],
    enum: ['partner', 'subscriber', 'exhibition', 'none'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  partnershipStatus?: string[];

  @ApiProperty({
    description: '排序方式',
    required: false,
    example: 'price_asc',
    enum: ['price_asc', 'price_desc', 'inquiry_count', 'name', 'created_at'],
    default: 'inquiry_count',
  })
  @IsOptional()
  @IsString()
  @IsIn(['price_asc', 'price_desc', 'inquiry_count', 'name', 'created_at'])
  sortBy?: string = 'inquiry_count';

  @ApiProperty({
    description: '页码（从 1 开始）',
    required: false,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '每页数量（最大 50）',
    required: false,
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}

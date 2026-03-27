import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { FilterEquipmentResponseDto } from './dto/equipment-response.dto';
import { FilterOptionsResponseDto } from './dto/filter-options-response.dto';

@ApiTags('装备')
@Controller('equipment')
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

  /**
   * 装备筛选接口（核心）
   */
  @Post('filter')
  @ApiOperation({ summary: '筛选装备', description: '多维度筛选消防装备，支持价格、类别、认证标准等条件' })
  @ApiResponse({ status: 200, description: '筛选成功', type: FilterEquipmentResponseDto })
  async filterEquipment(@Body() dto: FilterEquipmentDto): Promise<FilterEquipmentResponseDto> {
    return this.equipmentService.filterEquipment(dto);
  }

  /**
   * 筛选条件统计接口（辅助）
   */
  @Get('filter-options')
  @ApiOperation({ summary: '获取筛选条件统计', description: '返回所有可用的筛选条件及其数量' })
  @ApiResponse({ status: 200, description: '获取成功', type: FilterOptionsResponseDto })
  async getFilterOptions(): Promise<FilterOptionsResponseDto> {
    return this.equipmentService.getFilterOptions();
  }

  /**
   * 装备详情接口
   */
  @Get(':id')
  @ApiOperation({ summary: '获取装备详情', description: '根据装备 ID 获取完整的装备信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '装备不存在' })
  async getEquipmentDetail(@Param('id') id: string) {
    return this.equipmentService.getEquipmentDetail(id);
  }

  // ==================== 以下是原有接口（保留兼容性）====================

  @Get('categories')
  @ApiOperation({ summary: '获取装备分类' })
  async getCategories() {
    return this.equipmentService.getCategories();
  }

  @Get()
  @ApiOperation({ summary: '获取装备列表' })
  async findAll(
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.equipmentService.findAll({
      category,
      keyword,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Post('compare')
  @ApiOperation({ summary: '对比装备' })
  async compare(@Body('ids') ids: string[]) {
    return this.equipmentService.compare(ids);
  }
}

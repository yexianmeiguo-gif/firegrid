import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';

@ApiTags('装备')
@Controller('equipment')
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

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

  @Get(':id')
  @ApiOperation({ summary: '获取装备详情' })
  async findById(@Param('id') id: string) {
    return this.equipmentService.findById(id);
  }

  @Post('compare')
  @ApiOperation({ summary: '对比装备' })
  async compare(@Body('ids') ids: string[]) {
    return this.equipmentService.compare(ids);
  }
}
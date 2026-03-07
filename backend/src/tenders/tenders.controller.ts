import { Controller, Get, Post, Query, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TendersService } from './tenders.service';

@ApiTags('招投标')
@Controller('tenders')
export class TendersController {
  constructor(private tendersService: TendersService) {}

  @Get()
  @ApiOperation({ summary: '获取招标列表' })
  async findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.tendersService.findAll({
      status,
      category,
      region,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('recommendations')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取推荐商机（B端）' })
  async getRecommendations(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.tendersService.getRecommendations(
      req.user.userId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取招标详情' })
  async findById(@Param('id') id: string) {
    return this.tendersService.findById(id);
  }

  @Post('sync')
  @ApiOperation({ summary: '同步招标数据' })
  async sync() {
    return this.tendersService.syncTenders();
  }
}
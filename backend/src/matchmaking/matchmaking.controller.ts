import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';

// DTO 类
class CreateDemandDto {
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
  deadline?: string;
  validDays?: number;
}

class CreateOfferDto {
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
}

class ExpressInterestDto {
  interest: 'INTERESTED' | 'NOT_INTERESTED';
}

@ApiTags('供需撮合中心')
@ApiBearerAuth()
@Controller('matchmaking')
export class MatchmakingController {
  constructor(private matchmakingService: MatchmakingService) {}

  // ==================== 需求管理 ====================

  @Post('demands')
  @ApiOperation({ summary: '发布采购需求' })
  async createDemand(
    @Request() req,
    @Body() data: CreateDemandDto,
  ) {
    // 从请求中获取用户信息（简化处理）
    const publisherId = req.user?.userId || 'test-user';
    const publisherType = req.user?.role || 'FIREFIGHTER';

    return this.matchmakingService.createDemand({
      ...data,
      publisherId,
      publisherType,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
  }

  @Get('demands')
  @ApiOperation({ summary: '获取需求列表' })
  async getDemands(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchmakingService.getDemands({
      category,
      region,
      status: status as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('demands/my')
  @ApiOperation({ summary: '获取我发布的需求' })
  async getMyDemands(@Request() req) {
    const publisherId = req.user?.userId || 'test-user';
    return this.matchmakingService.getMyDemands(publisherId);
  }

  @Get('demands/:id')
  @ApiOperation({ summary: '获取需求详情' })
  async getDemandById(@Param('id') id: string) {
    return this.matchmakingService.getDemandById(id);
  }

  // ==================== 供应管理 ====================

  @Post('offers')
  @ApiOperation({ summary: '发布供应信息' })
  async createOffer(
    @Request() req,
    @Body() data: CreateOfferDto,
  ) {
    // 获取供应商信息（从用户档案中）
    const supplierId = req.user?.userId || 'test-supplier';
    const companyName = req.user?.companyName || '测试供应商';

    return this.matchmakingService.createOffer({
      ...data,
      supplierId,
      companyName,
    });
  }

  @Get('offers')
  @ApiOperation({ summary: '获取供应列表' })
  async getOffers(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchmakingService.getOffers({
      category,
      region,
      status: status as any,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('offers/my')
  @ApiOperation({ summary: '获取我发布的供应' })
  async getMyOffers(@Request() req) {
    const supplierId = req.user?.userId || 'test-supplier';
    return this.matchmakingService.getMyOffers(supplierId);
  }

  @Get('offers/:id')
  @ApiOperation({ summary: '获取供应详情' })
  async getOfferById(@Param('id') id: string) {
    return this.matchmakingService.getOfferById(id);
  }

  // ==================== 撮合操作 ====================

  @Get('matches/demand/:demandId')
  @ApiOperation({ summary: '获取需求的最佳匹配' })
  async getMatchesForDemand(@Param('demandId') demandId: string) {
    return this.matchmakingService.findMatchesForDemand(demandId);
  }

  @Get('matches/offer/:offerId')
  @ApiOperation({ summary: '获取供应的最佳匹配' })
  async getMatchesForOffer(@Param('offerId') offerId: string) {
    return this.matchmakingService.findMatchesForOffer(offerId);
  }

  @Post('matches/:matchId/interest')
  @ApiOperation({ summary: '表达撮合意向' })
  async expressInterest(
    @Param('matchId') matchId: string,
    @Query('party') party: 'demand' | 'offer',
    @Body() data: ExpressInterestDto,
  ) {
    return this.matchmakingService.expressInterest(
      matchId,
      party,
      data.interest as any,
    );
  }
}
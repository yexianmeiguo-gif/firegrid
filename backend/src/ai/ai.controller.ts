import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';

class GenerateBiddingDto {
  category: string;
  budget: string;
  requirements: string;
}

@ApiTags('AI工具')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('generate-bidding')
  @ApiOperation({ summary: 'AI生成招标文件' })
  async generateBidding(
    @Request() req,
    @Body() dto: GenerateBiddingDto,
  ) {
    return this.aiService.generateBiddingDocument(
      req.user.userId,
      dto.category,
      dto.budget,
      dto.requirements,
    );
  }

  @Get('history')
  @ApiOperation({ summary: '获取历史生成记录' })
  async getHistory(@Request() req) {
    return this.aiService.getUserHistory(req.user.userId);
  }
}
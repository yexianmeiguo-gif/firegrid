import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AIService } from './ai.service';

class GenerateBiddingDto {
  @IsString()
  category: string;

  @IsString()
  budget: string;

  @IsString()
  @IsOptional()
  requirements?: string;
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
    // 如果没有用户信息，使用测试用户ID
    const userId = req.user?.userId || 'test-user';
    
    return this.aiService.generateBiddingDocument(
      userId,
      dto.category,
      dto.budget,
      dto.requirements || '',
    );
  }

  @Get('history')
  @ApiOperation({ summary: '获取历史生成记录' })
  async getHistory(@Request() req) {
    const userId = req.user?.userId || 'test-user';
    return this.aiService.getUserHistory(userId);
  }
}
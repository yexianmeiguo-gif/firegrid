import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';

@ApiTags('资讯')
@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: '获取文章列表' })
  async findAll(
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.articlesService.findAll({
      category,
      type,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: '获取文章分类' })
  async getCategories() {
    return this.articlesService.getCategories();
  }

  @Get('featured')
  @ApiOperation({ summary: '获取推荐内容' })
  async getFeatured() {
    return this.articlesService.getFeatured();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  async findById(@Param('id') id: string) {
    return this.articlesService.findById(id);
  }
}
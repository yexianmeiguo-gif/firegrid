import { Controller, Get, Query } from '@nestjs/common';
import { ChromaService } from './chroma.service';

@Controller('api/test/chroma')
export class TestChromaController {
  constructor(private readonly chromaService: ChromaService) {}

  @Get('search')
  async testSearch(
    @Query('q') query: string = '消防车',
    @Query('n') nResults: number = 3,
  ) {
    const results = await this.chromaService.searchKnowledge(query, nResults);
    
    return {
      success: true,
      query: query,
      count: results.length,
      results: results,
    };
  }
}

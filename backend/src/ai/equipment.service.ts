import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChromaService } from './chroma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chromaService: ChromaService,
  ) {}

  async searchByNaturalLanguage(query: string, limit: number = 5) {
    try {
      // 🔥 新增：使用 ChromaDB 进行混合搜索
      const chromaResults = await this.chromaService.hybridSearch(query);
      
      // 使用 ChromaDB 提取的关键词 + 原始查询
      const keywords = [...new Set([
        ...query.split(' ').filter(kw => kw.length > 1),
        ...chromaResults.keywords,
      ])];

      console.log('🔍 Searching with keywords:', keywords);
      console.log('📚 ChromaDB knowledge results:', chromaResults.knowledge.length);

      const results = await this.prisma.equipment.findMany({
        where: {
          OR: [
            ...keywords.map(kw => ({ name: { contains: kw, mode: 'insensitive' as Prisma.QueryMode } })),
            ...keywords.map(kw => ({ description: { contains: kw, mode: 'insensitive' as Prisma.QueryMode } })),
            ...keywords.map(kw => ({ category: { contains: kw, mode: 'insensitive' as Prisma.QueryMode } })),
            { scenarioTags: { hasSome: keywords } },
          ],
        },
        take: limit,
      });

      // 增强评分：结合关键词匹配和专业知识相关性
      const scoredResults = results.map(equipment => {
        let score = 0;
        const content = `${equipment.name} ${equipment.description} ${equipment.category} ${equipment.scenarioTags.join(' ')}`;
        keywords.forEach(kw => {
          score += (content.match(new RegExp(kw, 'gi')) || []).length;
        });
        return { 
          ...equipment, 
          score,
          knowledgeReferences: chromaResults.knowledge.slice(0, 2), // 附带专业知识引用
        };
      });

      return scoredResults.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('❌ Search failed, falling back to basic search:', error);
      
      // 降级方案：如果 ChromaDB 失败，使用基础搜索
      const keywords = query.split(' ').filter(kw => kw.length > 1);
      const results = await this.prisma.equipment.findMany({
        where: {
          OR: [
            ...keywords.map(kw => ({ name: { contains: kw, mode: 'insensitive' as Prisma.QueryMode } })),
            ...keywords.map(kw => ({ description: { contains: kw, mode: 'insensitive' as Prisma.QueryMode } })),
            ...keywords.map(kw => ({ category: { contains: kw, mode: 'insensitive' as Prisma.QueryMode } })),
            { scenarioTags: { hasSome: keywords } },
          ],
        },
        take: limit,
      });

      const scoredResults = results.map(equipment => {
        let score = 0;
        const content = `${equipment.name} ${equipment.description} ${equipment.category} ${equipment.scenarioTags.join(' ')}`;
        keywords.forEach(kw => {
          score += (content.match(new RegExp(kw, 'gi')) || []).length;
        });
        return { ...equipment, score };
      });

      return scoredResults.sort((a, b) => b.score - a.score);
    }
  }

  async recommendByForm(formData: any) {
    const { category, filters, limit = 5, sortBy } = formData;

    const where: any = {
      category: category,
    };

    if (filters) {
      // This is a simplified filter handler. A real implementation would be more robust.
      // It assumes filters on the JSON 'parameters' field.
      // e.g., filters: { "扬程": { "min": 150 }, "流量": { "min": 50 } }
      Object.keys(filters).forEach(key => {
        const filter = filters[key];
        if (filter.min) {
          where.parameters = {
            ...where.parameters,
            path: [key, 'value'], // Assuming structure like { "扬程": { "value": 200, "unit": "m" } }
            gte: filter.min,
          };
        }
      });
    }
    
    // Sorting logic needs to be implemented based on sortBy parameter
    
    return this.prisma.equipment.findMany({
      where,
      take: limit,
    });
  }

  async getEquipmentDetails(id: string) {
    return this.prisma.equipment.findUnique({
      where: { id },
      include: {
        supplier: true,
        reviews: true,
        caseStudies: true,
      },
    });
  }
}

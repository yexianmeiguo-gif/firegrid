import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class ChromaService {
  private pythonScriptPath: string;
  private pythonEnv: string;

  constructor() {
    // Python 脚本路径（从 dist/ 向上两级到项目根目录）
    this.pythonScriptPath = path.join(__dirname, '../../../scripts/chroma_search.py');
    this.pythonEnv = process.env.CHROMA_PYTHON_ENV || '/Users/rabbit-y/.openclaw/workspace/chroma-env';
    
    console.log('🔗 Initializing ChromaDB + bge-m3...');
    console.log('Python Script:', this.pythonScriptPath);
    console.log('Python Env:', this.pythonEnv);
  }

  /**
   * 向量搜索 - 查询消防专业知识
   * 使用 Python 脚本调用 ChromaDB（bge-m3 1024维向量）
   */
  async searchKnowledge(query: string, nResults: number = 5): Promise<any[]> {
    return new Promise((resolve, reject) => {
      console.log('🔍 Searching ChromaDB for:', query);

      // 调用 Python 脚本
      const pythonPath = `${this.pythonEnv}/bin/python`;
      const process = spawn(pythonPath, [this.pythonScriptPath, query, nResults.toString()]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ ChromaDB search failed:', stderr);
          resolve([]); // 失败时返回空数组，不中断服务
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            console.log(`✅ Found ${result.count} results from ChromaDB`);
            resolve(result.results);
          } else {
            console.error('❌ ChromaDB search error:', result.error);
            resolve([]);
          }
        } catch (error) {
          console.error('❌ Failed to parse ChromaDB response:', error);
          resolve([]);
        }
      });
    });
  }

  /**
   * 混合搜索 - 结合向量搜索和结构化数据
   */
  async hybridSearch(query: string, category?: string) {
    try {
      // 1. 先从 ChromaDB 获取相关专业知识
      const knowledgeResults = await this.searchKnowledge(query, 3);

      // 2. 提取关键词用于结构化搜索
      const keywords = this.extractKeywords(query, knowledgeResults);

      return {
        knowledge: knowledgeResults,
        keywords: keywords,
        query: query,
      };
    } catch (error) {
      console.error('❌ Hybrid search failed:', error);
      return {
        knowledge: [],
        keywords: [],
        query: query,
      };
    }
  }

  /**
   * 从 ChromaDB 结果中提取关键词
   */
  private extractKeywords(query: string, results: any[]): string[] {
    const keywords = new Set<string>();
    
    // 添加查询词
    query.split(/\s+/).forEach(word => {
      if (word.length > 1) keywords.add(word);
    });

    // 从检索结果的元数据中提取关键词
    results.forEach(result => {
      if (result.metadata) {
        // 假设元数据中有 keywords 或 tags 字段
        const meta = result.metadata;
        if (meta.keywords) {
          meta.keywords.split(',').forEach((kw: string) => keywords.add(kw.trim()));
        }
      }
    });

    return Array.from(keywords);
  }
}

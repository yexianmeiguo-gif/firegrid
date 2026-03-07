import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import OpenAI from 'openai';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

const HunyuanClient = tencentcloud.hunyuan.v20230901.Client;

@Injectable()
export class AIService {
  private openai: OpenAI;
  private hunyuanClient: any;
  private useHunyuan: boolean = false;

  constructor(private prisma: PrismaService) {
    // 检查是否使用腾讯云混元
    const tencentSecretId = process.env.TENCENTCLOUD_SECRET_ID;
    const tencentSecretKey = process.env.TENCENTCLOUD_SECRET_KEY;
    
    if (tencentSecretId && tencentSecretKey) {
      // 使用腾讯云混元
      this.useHunyuan = true;
      
      const clientConfig = {
        credential: {
          secretId: tencentSecretId,
          secretKey: tencentSecretKey,
        },
        region: process.env.TENCENTCLOUD_REGION || 'ap-guangzhou',
        profile: {
          signMethod: 'TC3-HMAC-SHA256',
          httpProfile: {
            reqMethod: 'POST',
            reqTimeout: 30,
          },
        },
      };
      
      this.hunyuanClient = new HunyuanClient(clientConfig);
      console.log('AI Service initialized with Tencent Hunyuan');
    } else {
      // 使用 OpenAI / Kimi 兼容格式
      const apiKey = process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY || '';
      const baseURL = process.env.KIMI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      
      this.openai = new OpenAI({
        apiKey,
        baseURL,
      });
      
      console.log('AI Service initialized with baseURL:', baseURL);
    }
  }

  // AI生成招标文件
  async generateBiddingDocument(
    userId: string,
    category: string,
    budget: string,
    requirements: string,
  ) {
    const prompt = this.buildPrompt(category, budget, requirements);
    
    try {
      let generatedContent: string;
      let modelName: string;
      let tokens: number;

      if (this.useHunyuan && this.hunyuanClient) {
        // 使用腾讯云混元
        const result = await this.callHunyuan(prompt);
        generatedContent = result.content;
        modelName = 'hunyuan-lite';
        tokens = result.tokens;
      } else {
        // 使用 OpenAI / Kimi 兼容格式
        const model = process.env.KIMI_API_KEY ? 'moonshot-v1-8k' : (process.env.AI_MODEL || 'gpt-4');
        const completion = await this.openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `你是一位专业的消防装备采购专家，熟悉政府采购法规和消防装备技术标准。\n请根据用户需求生成规范的消防装备采购招标文件，包含：\n1. 项目概况\n2. 采购需求和技术规格要求\n3. 商务条款\n4. 评标办法\n5. 投标文件格式要求\n\n要求：\n- 符合政府采购"三家以上比选"等规范\n- 技术参数要具体、可量化\n- 语言正式、规范\n- 格式清晰，适合直接用于正式招标`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });
        
        generatedContent = completion.choices[0]?.message?.content || '';
        modelName = model;
        tokens = completion.usage?.total_tokens || 0;
      }

      // 保存生成记录
      await this.prisma.aIPromptLog.create({
        data: {
          userId,
          category,
          budget,
          requirements,
          output: generatedContent,
          model: modelName,
          tokens: tokens,
        },
      });

      return {
        success: true,
        content: generatedContent,
        category,
        budget,
      };
    } catch (error) {
      console.error('AI生成失败:', error);
      
      // 如果AI服务不可用，返回模板内容
      return {
        success: true,
        content: this.getTemplateDocument(category, budget, requirements),
        category,
        budget,
        note: '使用模板生成（AI服务暂不可用）',
      };
    }
  }

  // 调用腾讯云混元API
  private async callHunyuan(prompt: string): Promise<{ content: string; tokens: number }> {
    const params = {
      Model: 'hunyuan-lite',  // 使用轻量版，性价比最高
      Messages: [
        {
          Role: 'system',
          Content: `你是一位专业的消防装备采购专家，熟悉政府采购法规和消防装备技术标准。请根据用户需求生成规范的消防装备采购招标文件。`,
        },
        {
          Role: 'user',
          Content: prompt,
        },
      ],
    };

    try {
      const response = await this.hunyuanClient.ChatCompletions(params);
      
      return {
        content: response.Choices?.[0]?.Message?.Content || '',
        tokens: response.Usage?.TotalTokens || 0,
      };
    } catch (error) {
      console.error('Hunyuan API error:', error);
      throw error;
    }
  }

  private buildPrompt(category: string, budget: string, requirements: string): string {
    return `请为以下消防装备采购项目生成完整的招标文件：\n\n采购类别：${category}\n预算金额：${budget}\n核心要求：${requirements}\n\n请生成包含以下内容的完整招标文件：\n1. 招标公告\n2. 投标人须知\n3. 采购需求和技术规格\n4. 评标办法\n5. 合同条款\n6. 投标文件格式\n\n要求技术参数具体、可量化，符合政府采购规范。`;
  }

  // 模板文档（备用）
  private getTemplateDocument(category: string, budget: string, requirements: string): string {
    return `# ${category}采购招标文件\n\n## 一、招标公告\n\n**项目名称：** ${category}采购项目\n**预算金额：** ${budget}\n**采购方式：** 公开招标\n\n### 项目概况\n根据消防工作实际需要，现对${category}进行采购，欢迎符合条件的供应商参加投标。\n\n## 二、采购需求\n\n### 技术规格要求\n${requirements}\n\n### 具体参数要求\n1. 产品须符合国家相关质量标准\n2. 提供完整的售后服务保障\n3. 质保期不少于12个月\n\n## 三、商务条款\n\n### 交货要求\n- 交货地点：采购人指定地点\n- 交货时间：合同签订后30日内\n\n### 付款方式\n- 合同签订后支付30%预付款\n- 验收合格后支付65%货款\n- 质保期满后支付5%尾款\n\n## 四、评标办法\n\n采用综合评分法，总分100分：\n- 价格分：40分\n- 技术分：40分  \n- 商务分：20分\n\n## 五、投标文件要求\n\n1. 投标函\n2. 法定代表人授权书\n3. 营业执照副本复印件\n4. 产品技术参数响应表\n5. 售后服务承诺书\n6. 业绩证明材料\n\n---\n*本文件由 FireGrid AI 辅助生成系统生成*`;
  }

  // 获取用户的历史生成记录
  async getUserHistory(userId: string) {
    return this.prisma.aIPromptLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        category: true,
        budget: true,
        createdAt: true,
      },
    });
  }
}
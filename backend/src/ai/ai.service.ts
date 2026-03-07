import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    // 初始化OpenAI客户端
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
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
      // 调用大语言模型
      const completion = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的消防装备采购专家，熟悉政府采购法规和消防装备技术标准。
请根据用户需求生成规范的消防装备采购招标文件，包含：
1. 项目概况
2. 采购需求和技术规格要求
3. 商务条款
4. 评标办法
5. 投标文件格式要求

要求：
- 符合政府采购"三家以上比选"等规范
- 技术参数要具体、可量化
- 语言正式、规范
- 格式清晰，适合直接用于正式招标`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const generatedContent = completion.choices[0]?.message?.content || '';

      // 保存生成记录
      await this.prisma.aIPromptLog.create({
        data: {
          userId,
          category,
          budget,
          requirements,
          output: generatedContent,
          model: process.env.AI_MODEL || 'gpt-4',
          tokens: completion.usage?.total_tokens || 0,
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

  private buildPrompt(category: string, budget: string, requirements: string): string {
    return `请为以下消防装备采购项目生成完整的招标文件：

采购类别：${category}
预算金额：${budget}
核心要求：${requirements}

请生成包含以下内容的完整招标文件：
1. 招标公告
2. 投标人须知
3. 采购需求和技术规格
4. 评标办法
5. 合同条款
6. 投标文件格式

要求技术参数具体、可量化，符合政府采购规范。`;
  }

  // 模板文档（备用）
  private getTemplateDocument(category: string, budget: string, requirements: string): string {
    return `# ${category}采购招标文件

## 一、招标公告

**项目名称：** ${category}采购项目
**预算金额：** ${budget}
**采购方式：** 公开招标

### 项目概况
根据消防工作实际需要，现对${category}进行采购，欢迎符合条件的供应商参加投标。

## 二、采购需求

### 技术规格要求
${requirements}

### 具体参数要求
1. 产品须符合国家相关质量标准
2. 提供完整的售后服务保障
3. 质保期不少于12个月

## 三、商务条款

### 交货要求
- 交货地点：采购人指定地点
- 交货时间：合同签订后30日内

### 付款方式
- 合同签订后支付30%预付款
- 验收合格后支付65%货款
- 质保期满后支付5%尾款

## 四、评标办法

采用综合评分法，总分100分：
- 价格分：40分
- 技术分：40分  
- 商务分：20分

## 五、投标文件要求

1. 投标函
2. 法定代表人授权书
3. 营业执照副本复印件
4. 产品技术参数响应表
5. 售后服务承诺书
6. 业绩证明材料

---
*本文件由 FireGrid AI 辅助生成系统生成*`;
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
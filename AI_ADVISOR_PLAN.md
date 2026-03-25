# 🤖 AI 装备顾问 - 完整开发方案

**项目代号**: FireGrid AI Equipment Advisor v1.0  
**开始时间**: 2026-03-21 20:03 PDT  
**目标完成**: 2026-03-23（3 天）  
**主要开发者**: Claude Code

---

## 📋 需求确认表

| 需求项 | 决策 | 备注 |
|--------|------|------|
| **位置** | 服务页面内 | 作为服务菜单的一个工具 |
| **数据来源** | 仅后端数据库 | 不调用外网 AI，避免幻觉 |
| **输入模式** | 双模式 | 自然语言对话 + 表单式选择 |
| **对比数量** | 5 个（可调） | 支持 3/5/7/10 个 |
| **语音功能** | 暂不开发 | 流程成熟后完善 |
| **联系供应商** | 咨询参数 + 询价 | 显示联系方式、链接询价 |

---

## 🎯 功能清单

### **Phase 1: 核心功能（本周完成）**

#### **1.1 后端 API 设计**

**新增 3 个 Endpoint**:

```
POST /api/ai/query-equipment
├─ 功能: 智能查询装备（自然语言 + 结构化参数双模式）
├─ 输入:
│  ├─ query?: string              // 自然语言查询（可选）
│  ├─ category?: string           // 装备类别（可选）
│  ├─ scenario?: string           // 应用场景（可选）
│  ├─ budget?: { min, max }       // 预算范围（可选）
│  ├─ priorities?: string[]       // 优先级排序（性能/价格/维保等）
│  └─ limit?: number              // 返回数量（3-10，默认 5）
│
├─ 处理流程:
│  ├─ Step 1: 解析用户输入（自然语言 NLP 或直接结构化）
│  ├─ Step 2: 构建数据库查询条件
│  ├─ Step 3: 执行数据库查询
│  ├─ Step 4: 本地排序（匹配度算法）
│  └─ Step 5: 返回结果
│
└─ 输出:
   ├─ recommendation: string     // 快速建议（1 句话）
   ├─ equipments: [
   │  ├─ id: string
   │  ├─ rank: number           // 排序位置（1-5）
   │  ├─ name: string
   │  ├─ manufacturer: string
   │  ├─ price: number
   │  ├─ category: string
   │  ├─ parameters: object      // 完整参数（结构化 JSON）
   │  ├─ matchScore: number      // 匹配度评分（0-100）
   │  ├─ supplier: {
   │  │  ├─ id: string
   │  │  ├─ name: string
   │  │  ├─ phone: string
   │  │  ├─ email: string
   │  │  └─ website: string
   │  │}
   │  └─ caseStudies: []         // 应用案例（可选）
   │]
   └─ totalMatches: number       // 符合条件的总数
```

```
GET /api/ai/equipment/:equipmentId
├─ 功能: 获取单个装备的详细信息
├─ 输出: 完整装备数据 + 供应商信息 + 用户评价
└─ 用途: 点击装备卡片时展开详情
```

```
POST /api/ai/inquiry
├─ 功能: 提交询价请求
├─ 输入:
│  ├─ equipmentIds: string[]      // 选中的装备 IDs
│  ├─ question?: string           // 用户提问内容
│  ├─ userId: string              // 消防人员 ID
│  └─ supplierId?: string         // 指定供应商（可选）
│
├─ 处理: 
│  ├─ 创建询价记录
│  ├─ 通知供应商
│  └─ 返回联系方式
│
└─ 输出:
   ├─ inquiryId: string           // 询价单号
   ├─ suppliers: [
   │  ├─ name: string
   │  ├─ phone: string
   │  ├─ wechat: string           // 微信 ID（如有）
   │  ├─ email: string
   │  └─ website: string
   │]
   └─ status: 'submitted'
```

---

#### **1.2 前端 UI 设计**

**新增页面**: `pages/advisor/advisor.{js,wxml,json,wxss}`

```
【AI 装备顾问页面结构】

┌─────────────────────────────────────────┐
│ 🤖 AI 装备顾问                           │
│ 智能推荐消防装备                         │
└─────────────────────────────────────────┘

【输入区】（两种模式切换）
┌─────────────────────────────────────────┐
│ 💬 对话模式 ▼  | 📋 表单模式            │
├─────────────────────────────────────────┤
│                                         │
│  请输入需求...                          │
│  例如：采购高层建筑灭火消防车            │
│       预算 500 万                       │
│       求助选什么牌子                    │
│                                         │
│                 [🔍 查询]               │
└─────────────────────────────────────────┘

【快速建议】（展示 AI 推荐语句）
┌─────────────────────────────────────────┐
│ ✨ 推荐: 中联重科水罐车性价比最高，      │
│    适合高层火灾扑救，预算充足            │
└─────────────────────────────────────────┘

【对比表格】（可调整行数：3/5/7/10）
┌─────────────────────────────────────────┐
│ 对比 5 个装备 [▼] 调整数量               │
├─────────────────────────────────────────┤
│ 排名 │ 车型     │ 价格   │ 核心优势     │
├─────────────────────────────────────────┤
│ 🥇  │ 中联重科 │480万  │性能最强      │
│ 🥈  │ 德尔格   │450万  │维保便利      │
│ 🥉  │ LUKAS   │420万  │技术可靠      │
│ 4️⃣   │ XX品牌  │350万  │价格友好      │
│ 5️⃣   │ YY品牌  │520万  │功能齐全      │
└─────────────────────────────────────────┘

【展开详情】（点击任意装备）
┌─────────────────────────────────────────┐
│ 中联重科 水罐消防车 (8 吨)              │
│                                         │
│ 📊 详细参数:                             │
│ • 罐体容量: 8000L                       │
│ • 泵流量: 60L/s                         │
│ • 射程距离: 65m                         │
│ • 发动机: 柴油引擎                      │
│ • 重量: 12 吨                           │
│ • 规格: 8500×2500×3400mm               │
│                                         │
│ 🏢 供应商: 中联重科消防装备有限公司      │
│ 📞 400-XXXX-XXXX                       │
│ 🌐 www.xxx.com                         │
│                                         │
│ 👥 用户评价: 4.8★ (156 条评价)         │
│ "性能稳定，维保便利"                   │
│ "价格公道，交货快"                     │
│                                         │
│ [📞 咨询参数&询价] [❤️ 收藏]           │
└─────────────────────────────────────────┘

【底部功能栏】
┌─────────────────────────────────────────┐
│ [💾保存] [📋报告] [📞询价] [❤️收藏]     │
└─────────────────────────────────────────┘
```

---

#### **1.3 匹配度算法**

```javascript
// 核心排序逻辑

function calculateMatchScore(
  equipment,
  userRequirements
) {
  let score = 0;

  // 1. 参数匹配度 (40%)
  const paramScore = calculateParameterMatch(
    equipment.parameters,
    userRequirements.priorities
  ) * 0.4;

  // 2. 应用场景匹配度 (30%)
  const scenarioScore = calculateScenarioMatch(
    equipment.category,
    equipment.applications,
    userRequirements.scenario
  ) * 0.3;

  // 3. 价格合理性 (20%)
  const priceScore = calculatePriceRatio(
    equipment.price,
    userRequirements.budget
  ) * 0.2;

  // 4. 供应商信誉度 (10%)
  const reputationScore = calculateSupplierReputation(
    equipment.supplierId,
    userRequirements.region
  ) * 0.1;

  return paramScore + scenarioScore + priceScore + reputationScore;
}

// 参数匹配：根据优先级加权
// 场景匹配：装备历史案例中是否有类似应用
// 价格匹配：装备价格与预算的贴近度
// 信誉匹配：供应商在该地区的案例、评价、认证
```

---

#### **1.4 数据库优化**

**需要在 Equipment 表中补充的字段**:

```prisma
model Equipment {
  // 现有字段...
  
  // 新增字段（必要）
  applications     String[]          // 应用场景标签
  scenarioTags     String[]          // 灾害类型标签
  performanceRating Float           // 性能评分 (0-5)
  
  // 可选字段（未来用）
  casestudies      CaseStudy[]       // 应用案例
  similarProducts  String[]          // 相似产品 IDs
}

model CaseStudy {
  id              String @id @default(uuid())
  equipmentId     String
  equipment       Equipment @relation(fields: [equipmentId], references: [id])
  
  title           String              // 案例标题
  region          String              // 地区
  fireType        String              // 火灾类型
  description     String @db.Text     // 案例描述
  outcome         String              // 处理结果
  
  createdAt       DateTime @default(now())
}
```

---

### **Phase 2: 完善功能（下周）**

- [ ] 表单式快速查询入口优化
- [ ] 生成采购建议报告（PDF/Word）
- [ ] 收藏清单管理
- [ ] 询价单状态追踪
- [ ] 供应商反馈通知

---

## 🛠️ 开发步骤

### **第 1 天（2026-03-21 晚）**
- [ ] 设计后端 3 个 API 的详细入参/出参
- [ ] 优化数据库 Schema（补充 applications/scenarioTags）
- [ ] 实现匹配度算法（本地排序逻辑）

### **第 2 天（2026-03-22）**
- [ ] 前端页面框架（输入区 + 对比表格）
- [ ] 集成后端 API 调用
- [ ] 表单模式 vs 对话模式切换逻辑
- [ ] 数量调整功能（3/5/7/10）

### **第 3 天（2026-03-23）**
- [ ] 装备详情展开逻辑
- [ ] 咨询参数 + 询价功能
- [ ] 底部功能栏（保存/报告/询价/收藏）
- [ ] 测试 + Bug 修复

---

## 📍 文件清单

**后端新增**:
```
backend/src/ai/
├─ equipment.service.ts     // 装备查询 + 排序逻辑
├─ equipment.controller.ts  // API 路由
└─ equipment.module.ts      // 模块注册
```

**前端新增**:
```
weixin-miniprogram/pages/advisor/
├─ advisor.js              // 页面逻辑
├─ advisor.wxml            // UI 结构
├─ advisor.json            // 页面配置
└─ advisor.wxss            // 样式
```

**数据库**:
```
backend/prisma/
└─ schema.prisma           // 补充 Equipment 字段 + CaseStudy 表
```

---

## ✅ 验收标准

- [ ] 用户可用自然语言查询装备
- [ ] 返回 Top 5 装备的对比表格
- [ ] 可调整对比数量（3/5/7/10）
- [ ] 可点击查看装备详情 + 供应商信息
- [ ] 可快速联系供应商（咨询参数 + 询价）
- [ ] 底部功能栏可用（保存/报告/询价/收藏）
- [ ] 没有外网 API 调用（全部本地数据库查询）

---

## 🎯 预期成果

**完成后**：
- 🚀 用户可在服务页快速找到"AI 装备顾问"
- 🤖 AI 基于 1457 件装备智能推荐
- 📊 对比表格清晰展示 5 款最适合的装备
- 💬 支持自然语言提问和表单快速查询
- 📞 支持一键咨询供应商参数和询价
- ✨ 完全本地化（不依赖外网，避免幻觉）

---

## 📌 开发注意

1. **数据完整性**：确保 1457 件装备都有结构化参数
2. **性能优化**：大数据集查询需要索引优化
3. **用户体验**：表格在手机端需要合理折叠/展开
4. **错误处理**：无匹配结果时需要友好提示

---

**项目启动时间**: 2026-03-21 20:03 PDT ✨  
**预计完成**: 2026-03-23 ✅


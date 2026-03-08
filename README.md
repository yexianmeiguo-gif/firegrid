# FireGrid - 消防车辆装备信息化服务平台

<p align="center">
  <img src="https://img.shields.io/badge/Platform-WeChat%20Mini%20Program-brightgreen" alt="Platform">
  <img src="https://img.shields.io/badge/Frontend-Uni--app%20(Vue3)-blue" alt="Frontend">
  <img src="https://img.shields.io/badge/Backend-NestJS%20(Typescript)-red" alt="Backend">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-orange" alt="Database">
</p>

## 🎯 项目定位

FireGrid 是一款面向中国消防行业的**全栈**微信小程序平台，连接消防队伍（C/G端）与装备供应商（B端）。

**MVP 核心目标：** 跑通「信息聚合 → AI工具辅助 → 商机对接」的业务闭环。

---

## ✨ 核心功能

### 🔐 模块 1: 统一认证与档案
- ✅ 微信快捷登录（OpenID获取）
- ✅ 手机号一键绑定
- ✅ C端档案（职级、部门、关注类目）
- ✅ B端档案（企业认证、主营类目、订阅等级）

### 🚒 模块 2: 智能装备参数池
- ✅ 树状分类导航（车辆/防护/救援/器材/通信）
- ✅ 结构化参数对比（2-3款装备并排对比）
- ✅ 产品详情页（规格、厂商、联系按钮）
- ✅ 用户评价系统

### 🤖 模块 3: AI 辅助招标文件生成器（**核心亮点**）
- ✅ 需求输入表单（类别+预算+参数要求）
- ✅ 大语言模型生成规范招标文件
- ✅ 符合「三家以上比选」等政府采购规范
- ✅ 导出与分享功能

### 📋 模块 4: 全国招投标商机看板
- ✅ 标讯列表流（挂网/中标/流标）
- ✅ 精准商机推送（基于B端标签画像）
- ✅ 项目详情与比价分析
- ✅ 对接第三方数据API预留

### 📚 模块 5: 专业资讯与培训展示
- ✅ 信息流首页（类似微信看一看）
- ✅ 分类：业务培训/实战案例/装备知识/政策法规/信息化
- ✅ 全国信息化项目库

---

## 🏗️ 技术架构

```
FireGrid/
├── frontend/          # Uni-app (Vue3) 微信小程序
│   ├── src/pages/     # 页面
│   ├── src/components/# 组件
│   └── package.json
├── backend/           # NestJS (TypeScript) 后端
│   ├── src/
│   │   ├── auth/      # 认证模块
│   │   ├── users/     # 用户模块
│   │   ├── equipment/ # 装备模块
│   │   ├── tenders/   # 招标模块
│   │   ├── ai/        # AI模块（核心）
│   │   └── articles/  # 文章模块
│   ├── prisma/        # 数据库Schema
│   └── Dockerfile
├── docker-compose.yml # Docker编排
└── docs/              # 文档
```

---

## 🚀 快速启动

### Docker 一键部署

```bash
# 克隆项目
git clone <repository>
cd firegrid

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

访问 API 文档: http://localhost:3000/api/docs

### 详细部署指南

查看 [DEPLOY.md](docs/DEPLOY.md) 获取完整的部署说明。

---

## 📱 用户角色

| 角色 | 权限 |
|------|------|
| 👤 游客 | 浏览公开资讯、基础装备列表 |
| 👨‍🚒 消防用户(C/G端) | 查询装备、AI招标文件工具、查看评价 |
| 🏢 供应商(B端) | 发布产品、接收商机推送、查看市场报告 |

---

## 🗄️ 数据库设计

核心表：
- `users` - 用户基础信息
- `firefighter_profiles` - C端档案
- `supplier_profiles` - B端档案
- `equipment` - 装备信息（JSONB参数）
- `tenders` - 招标信息
- `ai_prompt_logs` - AI生成记录
- `articles` - 资讯文章

查看完整 Schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

---

## 🔧 开发计划

### ✅ MVP (已完成)
- [x] 后端框架搭建 (NestJS + Prisma)
- [x] 前端框架搭建 (Uni-app + Vue3)
- [x] 数据库设计 (PostgreSQL)
- [x] 核心页面开发
- [x] AI招标文件生成器
- [x] Docker部署配置

### 🚧 待开发 (第二期)
- [ ] 微信登录集成
- [ ] 对接第三方招标数据API
- [ ] AI大模型接入
- [ ] 装备对比功能优化
- [ ] 消息推送系统

---

## 📞 联系我们

**FireGrid** - 消防装备信息化服务平台

*让消防装备采购更简单、更智能*

---

## 📄 License

MIT License

---

<p align="center">
  🔥 FireGrid - 为消防行业赋能 🔥
</p># Deploy Trigger Sat Mar  7 20:26:43 PST 2026

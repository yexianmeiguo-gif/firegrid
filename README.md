# FireGrid 消防装备供需平台

连接中国消防队伍与优质装备供应商的 B2G 产业互联网平台。

## 🎯 核心功能

- **智能装备库** - 参数化检索与对比
- **招标商机看板** - 全国消防装备招投标信息
- **AI 招标文件生成器** - 智能生成专业招标文件
- **供需撮合中心** - 智能匹配供需双方
- **行业资讯** - 消防专业内容聚合

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS + TypeScript + Prisma + PostgreSQL |
| 前端 | 微信小程序原生 |
| AI | 腾讯云混元大模型 |
| 部署 | 腾讯云 CloudBase |

## 🚀 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/yexianmeiguo-gif/firegrid.git
cd firegrid
```

### 2. 后端配置
```bash
cd backend
cp .env.example .env
# 编辑 .env 填入数据库和 API 密钥

npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 3. 小程序配置
```bash
cd ../firegrid-weixin
# 用微信开发者工具打开
# 配置 appid 和域名
```

## 📋 项目结构

```
firegrid/
├── backend/           # NestJS 后端
│   ├── src/
│   │   ├── auth/     # 认证模块
│   │   ├── equipment/# 装备模块
│   │   ├── tenders/  # 招标模块
│   │   ├── matchmaking/ # 撮合模块
│   │   └── ai/       # AI 模块
│   ├── prisma/       # 数据库 Schema
│   └── cloudbaserc.json # CloudBase 配置
├── firegrid-weixin/   # 微信小程序
│   ├── pages/        # 页面
│   └── CONFIG.md     # 配置指南
└── .github/workflows/ # CI/CD
```

## 🔧 部署

自动部署已配置，推送代码到 main 分支即可触发：

```bash
git push origin main
```

部署流程：
1. 运行测试
2. 构建 TypeScript
3. 执行数据库迁移
4. 部署到 CloudBase

## 📄 许可证

MIT © FireGrid Team

#!/bin/bash
# CloudBase CLI 部署脚本

echo "🚀 FireGrid CloudBase 部署脚本"
echo "================================"

# 检查环境变量
if [ -z "$TENCENTCLOUD_SECRET_ID" ] || [ -z "$TENCENTCLOUD_SECRET_KEY" ]; then
  echo "❌ 错误：缺少腾讯云 API 密钥"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误：缺少数据库连接字符串"
  exit 1
fi

# 安装 CloudBase CLI
if ! command -v tcb &> /dev/null; then
  echo "📦 安装 CloudBase CLI..."
  npm install -g @cloudbase/cli
fi

# 登录 CloudBase
echo "🔐 登录 CloudBase..."
tcb login --apiKeyId "$TENCENTCLOUD_SECRET_ID" --apiKey "$TENCENTCLOUD_SECRET_KEY"

# 进入后端目录
cd backend

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma 客户端
echo "🔄 生成 Prisma 客户端..."
npx prisma generate

# 构建项目
echo "🏗️  构建项目..."
npm run build

# 执行数据库迁移
echo "🗄️  执行数据库迁移..."
npx prisma migrate deploy

# 部署到 CloudBase
echo "☁️  部署到 CloudBase..."
tcb fn deploy firegrid-backend

echo "✅ 部署完成！"
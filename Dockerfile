# 使用 Node.js 18 LTS 作为基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建 NestJS 应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 设置 NODE_ENV
ENV NODE_ENV=production

# 创建工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 生成 Prisma 客户端（生产环境）
RUN npx prisma generate

# 从 builder 阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口（CloudBase 云托管默认使用 10000，Render 使用 3000）
EXPOSE 10000

# 启动命令
CMD ["node", "dist/main.js"]
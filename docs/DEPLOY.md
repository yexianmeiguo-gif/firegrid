# FireGrid 部署指南

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

#### 1. 环境要求
- Docker 20.10+
- Docker Compose 2.0+
- 服务器内存 ≥ 2GB

#### 2. 部署步骤

```bash
# 进入项目目录
cd firegrid

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

#### 3. 数据库迁移

```bash
# 进入后端容器
docker-compose exec backend sh

# 执行迁移
npx prisma migrate dev

# 退出容器
exit
```

#### 4. 访问服务
- API 文档: http://localhost:3000/api/docs
- 后端服务: http://localhost:3000
- 数据库: localhost:5432

---

### 方式二：手动部署

#### 后端部署

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 4. 数据库迁移
npx prisma migrate dev
npx prisma generate

# 5. 启动开发环境
npm run start:dev

# 6. 生产环境构建
npm run build
npm run start:prod
```

#### 前端部署

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 开发环境
npm run dev:mp-weixin

# 4. 构建微信小程序
npm run build:mp-weixin

# 5. 使用微信开发者工具打开 dist/build/mp-weixin 目录
```

---

## ⚙️ 环境变量配置

### 后端 (.env)

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/firegrid?schema=public"

# JWT
JWT_SECRET="your-super-secret-key"

# 微信
WECHAT_APPID="your-appid"
WECHAT_SECRET="your-secret"

# AI
OPENAI_API_KEY="your-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4"

# 服务器
PORT=3000
NODE_ENV=production
```

---

## 📱 微信小程序配置

### 1. 注册小程序
- 访问 [微信公众平台](https://mp.weixin.qq.com)
- 注册小程序账号
- 获取 AppID 和 AppSecret

### 2. 配置服务器域名
登录小程序后台 → 开发 → 开发管理 → 服务器域名

```
request合法域名: https://your-domain.com
uploadFile合法域名: https://your-domain.com
downloadFile合法域名: https://your-domain.com
```

### 3. 配置业务域名（如需webview）

### 4. 上传代码
使用微信开发者工具上传代码，提交审核

---

## 🔧 生产环境优化

### 1. Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.firegrid.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. SSL 证书

```bash
# 使用 Certbot 申请免费证书
certbot --nginx -d api.firegrid.com
```

### 3. PM2 进程管理（非Docker部署）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name firegrid-backend

# 查看状态
pm2 status

# 开机自启
pm2 startup
pm2 save
```

---

## 📊 监控与日志

### 查看日志

```bash
# Docker 方式
docker-compose logs -f backend

# PM2 方式
pm2 logs firegrid-backend
```

### 数据库备份

```bash
# 备份
docker-compose exec postgres pg_dump -U firegrid firegrid > backup.sql

# 恢复
docker-compose exec -T postgres psql -U firegrid firegrid < backup.sql
```

---

## 🆘 常见问题

### 1. 数据库连接失败
- 检查数据库服务是否启动
- 确认环境变量中的连接字符串正确
- 检查防火墙设置

### 2. 微信登录失败
- 确认 AppID 和 AppSecret 正确
- 检查服务器 IP 是否在白名单中
- 确认域名配置正确

### 3. AI 生成失败
- 检查 API Key 是否有效
- 确认账户余额充足
- 检查网络连接

---

## 📞 技术支持

如有问题，请联系技术支持团队。

---

*FireGrid - 消防装备信息化服务平台*
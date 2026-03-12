# FireGrid 部署检查清单

## ✅ 开发环境配置

- [x] 后端框架 (NestJS)
- [x] Prisma ORM 配置
- [x] 数据库 Schema
- [x] API 控制器 (7个)
- [x] 微信小程序页面 (6个)
- [x] 本地 .env 文件
- [x] GitHub Actions CI/CD
- [x] CloudBase 配置

## 🚀 部署前待完成

### GitHub Secrets 配置
登录 GitHub → Settings → Secrets and variables → Actions

需要添加以下 Secrets：

| Secret Name | 说明 | 获取方式 |
|-------------|------|----------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | Render 控制台 |
| `JWT_SECRET` | JWT 签名密钥 | 随机生成 |
| `TENCENTCLOUD_SECRET_ID` | 腾讯云 API ID | 腾讯云控制台 |
| `TENCENTCLOUD_SECRET_KEY` | 腾讯云 API Key | 腾讯云控制台 |
| `CLOUDBASE_ENV_ID` | CloudBase 环境 ID | CloudBase 控制台 |

### 腾讯云配置

#### 1. 开通 CloudBase
- [ ] 登录 [腾讯云 CloudBase](https://console.cloud.tencent.com/tcb)
- [ ] 创建新环境
- [ ] 记录环境 ID

#### 2. 创建 API 密钥
- [ ] 访问 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
- [ ] 创建密钥
- [ ] 复制 SecretId 和 SecretKey

#### 3. 混元大模型
- [ ] 开通 [混元大模型](https://console.cloud.tencent.com/hunyuan)
- [ ] 获取 API 密钥
- [ ] 确认免费额度

### 数据库配置

#### Render PostgreSQL
- [ ] 创建 Render 账号
- [ ] 创建 PostgreSQL 实例
- [ ] 获取连接字符串
- [ ] 配置白名单

### 微信小程序配置

#### 开发者账号
- [ ] 注册 [微信小程序](https://mp.weixin.qq.com)
- [ ] 获取 AppID
- [ ] 配置服务器域名

#### 域名配置
```
request 合法域名:
- https://你的环境.cloudbaseapp.com

uploadFile 合法域名:
- https://你的存储.cos.ap-guangzhou.myqcloud.com

downloadFile 合法域名:
- https://你的存储.cos.ap-guangzhou.myqcloud.com
```

## 📝 环境变量模板

### 开发环境 (.env)
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev-secret-key
TENCENTCLOUD_SECRET_ID=
TENCENTCLOUD_SECRET_KEY=
TENCENTCLOUD_REGION=ap-guangzhou
```

### 生产环境 (GitHub Secrets)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=production-random-secret
TENCENTCLOUD_SECRET_ID=AKID...
TENCENTCLOUD_SECRET_KEY=...
CLOUDBASE_ENV_ID=firegrid-xxx
```

## 🧪 测试清单

### API 测试
- [ ] 用户注册/登录
- [ ] 装备列表查询
- [ ] 招标信息获取
- [ ] AI 招标文件生成
- [ ] 供需撮合匹配

### 小程序测试
- [ ] 首页加载
- [ ] 装备筛选
- [ ] AI 工具调用
- [ ] 个人中心

## 📊 上线检查

- [ ] 代码提交到 main 分支
- [ ] GitHub Actions 运行成功
- [ ] CloudBase 部署完成
- [ ] 数据库迁移成功
- [ ] API 健康检查通过
- [ ] 小程序上传代码
- [ ] 小程序提交审核
- [ ] 审核通过上线

## 🚨 应急预案

### 部署失败
1. 检查 GitHub Actions 日志
2. 确认 Secrets 配置正确
3. 检查 CloudBase 配额
4. 联系腾讯云客服

### 数据库问题
1. 检查 Render 连接状态
2. 查看迁移日志
3. 必要时手动回滚

### 小程序审核不通过
1. 查看审核反馈
2. 补充资质材料
3. 修改代码后重新提交

---
更新日期: 2026-03-08

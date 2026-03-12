# FireGrid - 腾讯云 CloudBase 云托管部署指南

## 📋 前置准备

1. **腾讯云账号**（已完成实名认证）
2. **CloudBase 环境**（已开通云托管服务）
3. **PostgreSQL 数据库**（可以使用 Render 的或腾讯云数据库）

---

## 1. Dockerfile 说明

已创建 `Dockerfile.cloudbase`，关键配置：

```dockerfile
# 使用多阶段构建，减少镜像体积
# 暴露端口 10000（CloudBase 默认端口）
# 启动命令: node dist/main.js
```

**注意**：
- CloudBase 云托管默认使用 **10000 端口**
- 必须绑定 `0.0.0.0`（已修改 main.ts）
- 多阶段构建优化镜像大小

---

## 2. 数据库连接配置

### 2.1 如果使用 Render 的 PostgreSQL（当前方案）

在腾讯云 CloudBase 云托管控制台配置环境变量：

```
DATABASE_URL=postgresql://firegrid:xxxx@dpg-xxxx.oregon-postgres.render.com:5432/firegrid_xxxx
```

**注意**：
- Render 数据库在国外，国内访问可能有延迟
- 建议后续迁移到腾讯云数据库

### 2.2 如果使用腾讯云 PostgreSQL（推荐）

```
DATABASE_URL=postgresql://用户名:密码@10.x.x.x:5432/firegrid
```

---

## 3. 腾讯云 CloudBase 部署步骤

### 步骤 1：登录腾讯云控制台

1. 访问 https://console.cloud.tencent.com/tcb
2. 进入你的 CloudBase 环境
3. 点击左侧菜单 **"云托管"**

### 步骤 2：创建服务

1. 点击 **"新建服务"**
2. 服务名称：`firegrid-backend`
3. 部署方式：**镜像部署**

### 步骤 3：配置端口

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **端口** | `10000` | CloudBase 默认端口 |
| **协议** | HTTP | |

### 步骤 4：配置环境变量

在 **"环境变量"** 标签页添加：

```env
# 数据库连接（必须）
DATABASE_URL=postgresql://用户名:密码@主机:5432/数据库名

# JWT 密钥（必须）
JWT_SECRET=your-super-secret-jwt-key-change-this

# 端口（可选，默认10000）
PORT=10000

# AI API Key（阶段2再配置）
# OPENAI_API_KEY=sk-xxx
```

### 步骤 5：上传代码并构建

#### 方式 A：通过 CloudBase CLI（推荐）

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录
tcb login

# 3. 进入后端目录
cd backend

# 4. 部署（使用 Dockerfile.cloudbase）
tcb cloudrun:deploy --envId 你的环境ID --serviceName firegrid-backend --dockerfile Dockerfile.cloudbase
```

#### 方式 B：通过控制台上传

1. 将 `backend` 文件夹打包成 zip
2. 在控制台选择 **"本地上传"**
3. 指定 Dockerfile 路径：`Dockerfile.cloudbase`

### 步骤 6：验证部署

1. 等待服务状态变为 **"运行中"**
2. 复制 **访问链接**（格式：`https://firegrid-backend-xxx.service.tcloudbase.com`）
3. 浏览器访问：`https://你的链接/api/docs`
4. 看到 Swagger 文档 → ✅ 部署成功

---

## 4. 前端适配

### 修改小程序 app.js

文件：`firegrid-weixin/app.js`

```javascript
App({
  onLaunch() {
    console.log('FireGrid App Launch')
  },
  globalData: {
    // 改为腾讯云 CloudBase 地址
    apiBaseUrl: 'https://firegrid-backend-xxx.service.tcloudbase.com'
  }
})
```

### 配置微信小程序服务器域名

1. 登录 https://mp.weixin.qq.com
2. 进入 **"开发"** → **"开发管理"** → **"服务器域名"**
3. 在 **request合法域名** 中添加：
   ```
   https://firegrid-backend-xxx.service.tcloudbase.com
   ```
4. 保存并提交

---

## 5. 重要配置检查清单

### 后端配置
- [ ] Dockerfile 使用 10000 端口
- [ ] main.ts 绑定 0.0.0.0
- [ ] DATABASE_URL 环境变量配置正确
- [ ] CORS 允许微信小程序域名

### 前端配置
- [ ] app.js 中的 apiBaseUrl 更新为 CloudBase 地址
- [ ] 微信小程序后台配置了 request 合法域名
- [ ] 关闭了开发者工具的"不校验合法域名"（正式上线前）

---

## 6. 常见问题

### Q1: 部署后访问返回 502
**解决**：检查 Dockerfile 中的端口是否和 CloudBase 配置的端口一致（都是 10000）

### Q2: 数据库连接失败
**解决**：
- 检查 DATABASE_URL 环境变量
- 确认数据库允许外部访问（Render 需要设置 Trusted IPs）

### Q3: CORS 错误
**解决**：
- 确认 main.ts 中的 CORS 配置包含微信小程序域名
- 或者临时在开发者工具开启"不校验合法域名"

---

## 7. 后续优化建议

### 数据库迁移到腾讯云
1. 购买腾讯云 PostgreSQL 实例
2. 使用 pg_dump 导出 Render 数据库
3. 导入到腾讯云数据库
4. 更新 DATABASE_URL 环境变量

### 配置 CDN 加速
1. 在 CloudBase 开启 CDN
2. 配置自定义域名（可选）

---

## 8. 部署命令速查

```bash
# 快速部署（在 backend 目录执行）
tcb cloudrun:deploy \
  --envId prod-xxx \
  --serviceName firegrid-backend \
  --dockerfile Dockerfile.cloudbase \
  --port 10000
```

---

**准备好开始部署了吗？有任何问题随时问我！** 🦐
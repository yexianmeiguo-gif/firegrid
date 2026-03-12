# 503 Service Unavailable 排查指南

## 🔍 错误分析

```
503 Service Temporarily Unavailable
```

**含义**：CloudBase 后端服务暂时不可用

**可能原因**：
1. ⏳ **正在部署** - 代码刚推送，服务正在重新部署
2. 🛑 **服务停止** - CloudBase 服务可能已停止
3. ⚙️ **配置错误** - 启动参数或端口配置有问题
4. 🗄️ **数据库连接失败** - 无法连接 PostgreSQL

---

## ✅ 排查步骤

### 步骤 1：等待部署完成（最常见）

刚刚推送了代码修复（`4b0aa9e`），CloudBase 正在自动部署：

**等待时间**：2-5 分钟

**操作**：
1. 等待 3 分钟
2. 在微信开发者工具中点击 **「编译」**（或按 Command+B）
3. 查看是否恢复正常

---

### 步骤 2：检查 CloudBase 控制台

**访问腾讯云控制台**：
```
https://console.cloud.tencent.com/tcb
```

**检查项目**：
1. 进入你的 CloudBase 环境
2. 点击 **「云托管」** 或 **「云函数」**
3. 查看服务状态：
   - 🟢 运行中 = 正常
   - 🟡 部署中 = 等待
   - 🔴 异常/停止 = 需要重启

---

### 步骤 3：查看部署日志

在 CloudBase 控制台：
1. 云托管 → 服务列表 → 点击你的服务
2. 查看 **「版本」** 标签页
3. 查看最新版本的 **「构建日志」** 和 **「运行日志」**

**常见问题**：
- 数据库连接失败
- 端口绑定错误
- 依赖安装失败

---

### 步骤 4：本地测试后端

如果 CloudBase 一直 503，先在本地测试后端是否正常：

```bash
cd firegrid/backend
npm install
npx prisma generate
npm run start:dev
```

然后访问：
```
http://localhost:3000/api/tenders
```

如果本地正常，说明代码没问题，是 CloudBase 配置问题。

---

## 🔧 快速修复方案

### 方案 1：重启 CloudBase 服务

在 CloudBase 控制台：
1. 云托管 → 服务列表
2. 找到你的服务
3. 点击 **「重启」** 或 **「重新部署」**

### 方案 2：检查数据库连接

确保 `DATABASE_URL` 环境变量正确配置：
- 检查 Render PostgreSQL 是否运行
- 检查 CloudBase 环境变量是否设置

### 方案 3：查看端口配置

确保后端监听正确的端口：
```typescript
// main.ts
const port = process.env.PORT || 10000;
await app.listen(port, '0.0.0.0');
```

CloudBase 默认使用 10000 端口。

---

## 📝 现在需要你做的

1. **等待 3 分钟**，然后重新编译测试
2. **如果还是 503**，登录 CloudBase 控制台查看服务状态
3. **把 CloudBase 控制台的截图或状态发给我**

我可以根据具体情况帮你修复！🦐

# GitHub Actions 自动部署到腾讯云 CloudBase

## 🎯 功能
每次 push 代码到 `main` 分支，自动部署到腾讯云 CloudBase 云托管。

---

## 🔧 前置配置（只需一次）

### 步骤 1：获取腾讯云密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cam/capi)
2. 点击 **"新建密钥"**
3. 复制 **SecretId** 和 **SecretKey**

**⚠️ 安全提示**：SecretKey 只会显示一次，请立即保存！

---

### 步骤 2：在 GitHub 仓库配置 Secrets

1. 打开你的 GitHub 仓库页面
2. 点击 **"Settings"** 标签
3. 左侧菜单选择 **"Secrets and variables"** → **"Actions"**
4. 点击 **"New repository secret"**，添加以下 secrets：

| Secret 名称 | 值 | 说明 |
|-------------|-----|------|
| `TENCENT_SECRET_ID` | 你的 SecretId | 腾讯云 API 密钥 ID |
| `TENCENT_SECRET_KEY` | 你的 SecretKey | 腾讯云 API 密钥 |
| `TENCENT_CLOUDBASE_ENV_ID` | 你的环境 ID | 如：`prod-xxx` |

**如何获取环境 ID？**
- 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
- 在你的环境卡片上能看到环境 ID（如 `prod-4g8k2xxx`）

---

### 步骤 3：确保 CloudBase 服务已创建

在腾讯云控制台：
1. 进入 **CloudBase** → **云托管**
2. 确保已创建服务 `firegrid-backend`
3. 记录服务名称（默认就是 `firegrid-backend`）

---

## 🚀 使用方法

配置完成后，每次你 push 代码到 `main` 分支：

```bash
git add .
git commit -m "你的修改"
git push origin main
```

GitHub Actions 会自动：
1. ✅ 检出代码
2. ✅ 安装依赖
3. ✅ 生成 Prisma 客户端
4. ✅ 构建 NestJS 应用
5. ✅ 构建 Docker 镜像
6. ✅ 部署到腾讯云 CloudBase
7. ✅ 通知部署结果

---

## 📊 查看部署状态

1. 打开 GitHub 仓库页面
2. 点击 **"Actions"** 标签
3. 点击最新的 workflow run
4. 查看详细的部署日志

---

## 🔧 环境变量配置

除了 GitHub Secrets，你还需要在腾讯云 CloudBase 控制台配置环境变量：

### 在 CloudBase 控制台设置：

1. 进入 **云托管** → **firegrid-backend** → **版本配置**
2. 点击 **"环境变量"**
3. 添加以下变量：

```env
# 数据库（必须）
DATABASE_URL=postgresql://用户名:密码@主机:5432/数据库名

# JWT 密钥（必须）
JWT_SECRET=你的JWT密钥（建议随机生成64位字符串）

# 端口（可选，默认10000）
PORT=10000

# AI API Key（可选，阶段2配置）
# OPENAI_API_KEY=sk-xxx
```

---

## ❓ 常见问题

### Q1: 部署失败，提示 "Unauthorized"
**解决**：检查 GitHub Secrets 中的 `TENCENT_SECRET_ID` 和 `TENCENT_SECRET_KEY` 是否正确

### Q2: 部署成功但服务无法访问
**解决**：
- 检查 CloudBase 环境变量是否配置正确
- 检查 Dockerfile 中的端口是否为 10000
- 查看 CloudBase 服务日志

### Q3: 数据库连接失败
**解决**：
- 确认 DATABASE_URL 格式正确
- 确认数据库允许外部访问（Render 需设置 Trusted IPs）
- 如果使用腾讯云数据库，确认内网访问配置

---

## 📝 手动触发部署

如果你不想等待 push，可以手动触发：

1. 打开 GitHub 仓库
2. 点击 **"Actions"** 标签
3. 选择 **"Deploy to Tencent CloudBase"**
4. 点击 **"Run workflow"**

---

配置完成后，每次 push 代码就会自动部署了！🎉
# FireGrid 部署验证指南

## 🦐 部署状态检查

### 1. 查看 GitHub Actions 运行状态

**方法 1：GitHub 网站**
1. 访问：https://github.com/yexianmeiguo-gif/firegrid/actions
2. 查看最新工作流运行状态
3. 点击运行记录查看详细日志

**方法 2：检查邮件通知**
- GitHub 会发送部署成功/失败邮件

---

## ✅ 部署成功验证

### 检查点 1：API 健康检查
```bash
# 替换为你的 CloudBase 环境 URL
curl https://你的环境ID.cloudbaseapp.com/api/health

# 预期返回：
{"status":"ok","timestamp":"..."}
```

### 检查点 2：招标列表 API
```bash
curl https://你的环境ID.cloudbaseapp.com/api/tenders

# 预期返回：招标列表 JSON
```

### 检查点 3：装备列表 API
```bash
curl https://你的环境ID.cloudbaseapp.com/api/equipment

# 预期返回：装备列表 JSON
```

---

## ❌ 常见问题及修复

### 问题 1：GitHub Actions 运行失败

**症状**：Actions 页面显示红色 ❌

**排查步骤**：
1. 点击失败的运行记录
2. 查看具体失败的 Job（Build / Migrate / Deploy）
3. 查看日志找出错误信息

**常见原因**：
- Secrets 配置错误 → 检查 GitHub Secrets
- 数据库连接失败 → 检查 DATABASE_URL
- CloudBase 登录失败 → 检查腾讯云密钥

### 问题 2：数据库迁移失败

**症状**：Migrate job 失败

**修复**：
```bash
# 手动运行迁移
cd backend
npx prisma migrate deploy
```

### 问题 3：CloudBase 部署失败

**症状**：Deploy job 失败

**检查清单**：
- [ ] CloudBase 环境是否正常运行
- [ ] 环境 ID 是否正确
- [ ] 腾讯云 API 密钥是否有权限
- [ ] CloudBase 服务配额是否足够

---

## 🚀 手动部署（备用方案）

如果 GitHub Actions 一直失败，可以使用手动部署：

### 步骤 1：本地构建
```bash
cd firegrid/backend
npm install
npm run build
```

### 步骤 2：安装 CloudBase CLI
```bash
npm install -g @cloudbase/cli
```

### 步骤 3：登录 CloudBase
```bash
cloudbase login
```

### 步骤 4：部署
```bash
cd firegrid/backend
cloudbase framework:deploy
```

---

## 📱 小程序配置（部署后）

后端部署成功后，需要配置小程序：

### 1. 获取 API 地址
```
https://你的环境ID.cloudbaseapp.com/api
```

### 2. 更新小程序配置
编辑 `firegrid-weixin/utils/api.js`：
```javascript
production: {
  baseURL: 'https://你的环境ID.cloudbaseapp.com',
  apiPrefix: '/api'
}
```

### 3. 配置微信服务器域名
登录微信公众平台 → 开发 → 开发设置 → 服务器域名：
```
request 合法域名: https://你的环境ID.cloudbaseapp.com
```

### 4. 提交审核
在微信开发者工具中：
1. 点击「上传」
2. 填写版本号
3. 提交审核

---

## 🆘 需要帮助？

如果部署遇到问题，请提供：
1. GitHub Actions 失败日志截图
2. 错误信息文本
3. 你的 CloudBase 环境 ID

我可以帮你分析和修复！🦐

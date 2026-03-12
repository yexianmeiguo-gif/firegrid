# 🔧 后端 503 错误修复指南

## 问题原因

CloudBase 后端服务目前返回 503，说明服务没有正常运行。可能原因：

1. **服务未启动** - CloudBase 云托管服务被停止
2. **部署失败** - 最近代码推送导致部署出错
3. **数据库连接失败** - 无法连接 Render PostgreSQL
4. **环境变量缺失** - 缺少必要的环境变量配置

---

## 快速修复步骤

### 步骤 1：登录 CloudBase 控制台检查

1. 访问 https://console.cloud.tencent.com/tcb
2. 登录你的腾讯云账号
3. 进入你的 CloudBase 环境（应该是 `firegrid-backend-230828-6`）
4. 点击左侧菜单 **「云托管」**

**查看服务状态：**
- 🟢 **运行中** → 服务正常，可能是其他问题
- 🔴 **已停止/异常** → 需要重启服务
- 🟡 **部署中** → 等待部署完成

### 步骤 2：重启服务

如果服务状态不是"运行中"：

1. 在云托管页面找到你的服务
2. 点击 **「重启」** 或 **「重新部署」** 按钮
3. 等待 2-3 分钟
4. 刷新微信小程序，测试 API 连接

### 步骤 3：查看运行日志

如果重启后还是 503：

1. 在云托管页面点击你的服务名称
2. 切换到 **「版本」** 标签页
3. 点击 **「查看日志」**
4. 查看最新的错误日志，常见错误：
   - `DATABASE_URL is not defined` → 缺少数据库连接
   - `port is already in use` → 端口冲突
   - `Cannot find module` → 依赖安装失败

---

## 本地测试（验证代码是否正常）

如果你想先确认代码没问题，可以在本地运行：

```bash
# 1. 进入后端目录
cd firegrid/backend

# 2. 安装依赖（如果还没安装）
npm install

# 3. 生成 Prisma 客户端
npx prisma generate

# 4. 创建本地数据库
npx prisma migrate dev --name init

# 5. 启动开发服务器
npm run start:dev
```

然后访问 http://localhost:3000/api/tenders

如果本地能跑起来，说明代码没问题，是 CloudBase 配置问题。

---

## 常见 CloudBase 配置问题

### 问题 1：环境变量没设置

需要在 CloudBase 控制台设置以下环境变量：

| 变量名 | 值 | 来源 |
|--------|----|------|
| `DATABASE_URL` | postgresql://... | Render 控制台 |
| `JWT_SECRET` | 随机字符串 | 自己生成 |
| `TENCENTCLOUD_SECRET_ID` | AKID... | 腾讯云 API 密钥 |
| `TENCENTCLOUD_SECRET_KEY` | xxx | 腾讯云 API 密钥 |

**设置方法：**
1. CloudBase 控制台 → 云托管 → 服务设置 → 环境变量
2. 添加以上变量

### 问题 2：数据库连接失败

Render PostgreSQL 默认只允许特定 IP 访问，需要：

1. 登录 Render 控制台 https://dashboard.render.com
2. 找到你的 PostgreSQL 实例
3. 在 **「Connections」** 中添加 CloudBase 的出口 IP
4. 或者设置为 **「Allow connections from anywhere」**（测试用）

### 问题 3：端口配置错误

确保 CloudBase 配置和代码中的端口一致：

- 代码中：`const port = process.env.PORT || 10000;`
- CloudBase 默认使用 10000 端口

---

## 临时解决方案

如果后端暂时修不好，小程序可以使用**模拟数据**继续开发：

```javascript
// 在 app.js 中设置使用本地模拟数据
const USE_MOCK_DATA = true;

if (USE_MOCK_DATA) {
  // 使用本地模拟数据
} else {
  // 调用真实 API
}
```

---

## 需要帮助？

如果你：
1. ✅ 登录了 CloudBase 控制台
2. ✅ 看到了服务状态
3. ✅ 拍了一张截图

把截图发给我，我可以帮你具体分析问题！

或者你可以：
- 把 CloudBase 的 **环境 ID** 发给我
- 告诉我 **最后一次部署** 是什么时候
- 有没有收到过部署失败的邮件通知

---

## 📞 腾讯云客服

如果以上方法都不行，可以联系腾讯云客服：
- 电话：4009-100-100
- 在线客服：腾讯云控制台右下角

记住告诉他们：CloudBase 云托管服务返回 503 错误

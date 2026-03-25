# AI 装备顾问开发启动指南

## 🚀 快速开始

### 1. 打开微信开发者工具
```bash
# macOS
open -a "wechatwebdevtools" firegrid/weixin-miniprogram

# Windows
# 手动打开微信开发者工具，导入项目目录
```

### 2. 验证页面文件
```bash
ls -l firegrid/weixin-miniprogram/pages/advisor/
# 应该看到：
# - advisor.js
# - advisor.wxml
# - advisor.wxss
# - advisor.json
# - README.md
```

### 3. 检查配置
```bash
# 验证页面已添加到 app.json
grep "advisor" firegrid/weixin-miniprogram/app.json

# 验证 API 地址
grep "apiBaseUrl" firegrid/weixin-miniprogram/app.js
```

## 📋 文件清单

### 核心页面文件
- ✅ `pages/advisor/advisor.js` (13KB) - 页面逻辑
- ✅ `pages/advisor/advisor.wxml` (6.8KB) - UI 结构
- ✅ `pages/advisor/advisor.wxss` (7.9KB) - 样式
- ✅ `pages/advisor/advisor.json` (230B) - 页面配置
- ✅ `pages/advisor/README.md` - 开发文档

### 修改的文件
- ✅ `app.json` - 添加了 advisor 页面路由
- ✅ `pages/ai/ai.wxml` - 添加了跳转入口
- ✅ `pages/ai/ai.wxss` - 添加了快捷链接样式

### 文档文件
- ✅ `ADVISOR_TEST_GUIDE.md` - 测试指南
- ✅ `START_ADVISOR_DEV.md` - 本文档

## 🎯 快速测试路径

### 路径 1: 直接访问（推荐）
1. 微信开发者工具中点击"编译"
2. 在模拟器顶部输入页面路径：
   ```
   pages/advisor/advisor
   ```
3. 回车访问

### 路径 2: 从 AI 工具页跳转
1. 点击底部 Tab "AI工具"
2. 点击顶部的粉色卡片 "🎯 AI装备顾问"

## 🧪 快速测试代码

在微信开发者工具的控制台（Console）中执行：

```javascript
// 跳转到 advisor 页面
wx.navigateTo({ url: '/pages/advisor/advisor' })

// 加载模拟数据
const page = getCurrentPages().slice(-1)[0]
page.loadMockData()

// 查看装备列表
console.log(page.data.equipmentList)

// 模拟自然语言查询
page.setData({ 
  inputMode: 'natural',
  naturalQuery: '城市高层消防车，扬程150米以上'
})
page.handleSearch()

// 模拟表单查询
page.setData({
  inputMode: 'form',
  categoryIndex: 0,
  selectedScenarios: ['城市高层'],
  budget: 500
})
page.handleSearch()
```

## 🔧 开发调试技巧

### 1. 查看数据流
```javascript
// 监听数据变化
const page = getCurrentPages().slice(-1)[0]
console.log('当前输入模式:', page.data.inputMode)
console.log('装备列表:', page.data.equipmentList)
console.log('对比数量:', page.data.compareCount)
console.log('加载状态:', page.data.loading)
```

### 2. 模拟 API 调用
```javascript
// 测试自然语言搜索
page.searchByNaturalLanguage('城市高层消防车')
  .then(res => console.log('搜索结果:', res))
  .catch(err => console.error('搜索失败:', err))

// 测试表单推荐
page.recommendByForm({
  category: '消防车',
  scenarios: ['城市高层'],
  budget: 500
})
  .then(res => console.log('推荐结果:', res))
  .catch(err => console.error('推荐失败:', err))
```

### 3. 测试功能按钮
```javascript
const page = getCurrentPages().slice(-1)[0]

// 测试保存对比
page.saveComparison()

// 测试生成报告
page.generateReport()

// 测试收藏
const firstEquipment = page.data.equipmentList[0]
page.handleFavorite({ 
  currentTarget: { dataset: { id: firstEquipment.id } },
  stopPropagation: () => {}
})
```

## 📊 数据格式参考

### 后端返回格式
```json
{
  "data": [
    {
      "id": "eq001",
      "name": "XLF5280GXFPM150型泵浦消防车",
      "category": "消防车",
      "price": 4500000,
      "supplier": {
        "name": "中联重科",
        "contact": "400-8878-222"
      },
      "description": "大功率泵浦消防车...",
      "parameters": {
        "扬程": { "value": 180, "unit": "m" },
        "流量": { "value": 150, "unit": "L/s" }
      },
      "score": 95
    }
  ],
  "recommendation": "根据您的需求，推荐..."
}
```

### 前端显示格式
```json
{
  "id": "eq001",
  "name": "XLF5280GXFPM150型泵浦消防车",
  "category": "消防车",
  "price": "450万",
  "supplier": "中联重科",
  "supplierContact": "400-8878-222",
  "description": "大功率泵浦消防车...",
  "keyParams": [
    { "label": "扬程", "value": "180m" },
    { "label": "流量", "value": "150L/s" }
  ],
  "allParams": [...],
  "expanded": false,
  "favorited": false,
  "score": 95
}
```

## 🐛 常见问题

### 问题 1: 页面找不到
**症状**: 点击跳转后显示 "页面不存在"
**解决**:
```bash
# 1. 确认 app.json 已添加页面路由
grep "advisor" firegrid/weixin-miniprogram/app.json

# 2. 确认页面文件存在
ls firegrid/weixin-miniprogram/pages/advisor/

# 3. 重新编译项目（开发者工具：项目 > 清除缓存 > 全部清除）
```

### 问题 2: 样式不显示
**症状**: 页面布局混乱或无样式
**解决**:
```bash
# 1. 确认 wxss 文件存在
ls -lh firegrid/weixin-miniprogram/pages/advisor/advisor.wxss

# 2. 检查 wxss 语法错误（开发者工具会有红色提示）

# 3. 清除缓存重新编译
```

### 问题 3: 数据不显示
**症状**: 点击查询后列表为空
**解决**:
```javascript
// 1. 在控制台检查 API 调用
console.log('API 地址:', app.globalData.apiBaseUrl)

// 2. 手动加载模拟数据
const page = getCurrentPages().slice(-1)[0]
page.loadMockData()

// 3. 检查数据处理
console.log('装备列表:', page.data.equipmentList)
```

### 问题 4: 后端 API 不可用
**症状**: 请求超时或返回错误
**解决**:
- ✅ 页面会自动切换到模拟数据模式
- ✅ 5 条预设装备数据可供测试
- ✅ 所有功能正常工作（除了真实询价）

## 🔗 后端 API 端点

```
基础 URL: https://firegrid-backend-230828-6-1409174142.sh.run.tcloudbase.com

POST /ai/equipment/search       # 自然语言搜索
POST /ai/equipment/recommend    # 表单推荐
GET  /ai/equipment/:id          # 获取详情
POST /ai/inquiry                # 发起询价
```

## 📝 开发检查清单

开始开发前确认：
- [ ] 微信开发者工具已安装
- [ ] 项目已正确导入
- [ ] app.json 包含 advisor 页面
- [ ] 4 个页面文件都存在
- [ ] API 地址已配置

开始测试前确认：
- [ ] 页面可以正常打开
- [ ] 两种输入模式可以切换
- [ ] 查询功能正常（模拟数据）
- [ ] 装备列表显示正常
- [ ] 展开/收起功能正常
- [ ] 底部功能栏显示正常

## 🎉 完成！

现在你可以开始开发和测试 AI 装备顾问页面了！

**下一步**:
1. 打开微信开发者工具
2. 按照"快速测试路径"访问页面
3. 参考 ADVISOR_TEST_GUIDE.md 进行详细测试
4. 根据测试结果优化功能

**需要帮助？**
- 📖 查看 `pages/advisor/README.md` 了解功能详情
- 🧪 查看 `ADVISOR_TEST_GUIDE.md` 了解测试方法
- 💻 在开发者工具控制台运行上面的调试代码

---

祝开发顺利！🚀

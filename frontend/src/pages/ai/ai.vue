<template>
  <view class="ai-container">
    <!-- 页面标题 -->
    <view class="header">
      <text class="title">🤖 AI招标文件生成器</text>
      <text class="subtitle">输入需求，AI自动生成专业招标文件</text>
    </view>
    
    <!-- 输入表单 -->
    <view class="form-container" v-if="!generatedContent">
      <view class="form-item">
        <text class="label">* 采购装备类别</text>
        <picker mode="selector" :range="categories" :value="categoryIndex" @change="onCategoryChange">
          <view class="picker">
            <text>{{ form.category || '请选择装备类别' }}</text>
            <text class="arrow">></text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">* 预算金额</text>
        <input 
          class="input" 
          type="text" 
          v-model="form.budget" 
          placeholder="例如：500万元"
        />
      </view>
      
      <view class="form-item">
        <text class="label">核心参数要求</text>
        <textarea 
          class="textarea" 
          v-model="form.requirements" 
          placeholder="请描述您的具体需求，例如：
- 水罐容量要求
- 泵浦流量参数
- 特殊功能需求
- 品牌偏好等"
          maxlength="500"
        />
        <text class="counter">{{ form.requirements.length }}/500</text>
      </view>
      
      <view class="tips">
        <text class="tips-title">💡 填写提示</text>
        <text class="tips-item">• 预算金额请包含单位（万/元）</text>
        <text class="tips-item">• 技术参数越详细，生成质量越高</text>
        <text class="tips-item">• 生成的文档符合政府采购规范</text>
      </view>
      
      <button class="submit-btn btn-primary" @click="generateDocument" :disabled="loading">
        {{ loading ? '生成中...' : '🚀 生成招标文件' }}
      </button>
    </view>
    
    <!-- 生成结果 -->
    <view class="result-container" v-else>
      <view class="result-header">
        <text class="result-title">✅ 生成成功！</text>
        <text class="result-info">类别：{{ form.category }} | 预算：{{ form.budget }}</text>
      </view>
      
      <view class="document-content">
        <scroll-view scroll-y class="content-scroll">
          <text class="content-text">{{ generatedContent }}</text>
        </scroll-view>
      </view>
      
      <view class="action-buttons">
        <button class="action-btn copy-btn" @click="copyContent">📋 复制全文</button>
        <button class="action-btn share-btn" @click="shareDocument">📤 分享文档</button>
        <button class="action-btn back-btn" @click="resetForm">🔄 重新生成</button>
      </view>
    </view>
    
    <!-- 历史记录 -->
    <view class="history-section" v-if="history.length > 0 && !generatedContent">
      <view class="section-title">📚 历史生成记录</text>
      
      <view class="history-item" v-for="(item, index) in history" :key="index">
        <view class="history-info">
          <text class="history-category">{{ item.category }}</text>
          <text class="history-budget">{{ item.budget }}</text>
        </view>        
        <text class="history-date">{{ item.date }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 表单数据
const form = reactive({
  category: '',
  budget: '',
  requirements: ''
})

const categoryIndex = ref(0)
const loading = ref(false)
const generatedContent = ref('')

// 装备类别选项
const categories = [
  '水罐消防车',
  '泡沫消防车',
  '云梯消防车',
  '抢险救援车',
  '空气呼吸器',
  '灭火防护服',
  '液压破拆工具',
  '消防无人机',
  '通信指挥装备',
  '个人防护装备',
  '灭火器材',
  '其他'
]

// 历史记录（模拟数据）
const history = ref([
  { category: '水罐消防车', budget: '280万元', date: '2024-03-10' },
  { category: '空气呼吸器', budget: '150万元', date: '2024-03-08' },
])

const onCategoryChange = (e) => {
  categoryIndex.value = e.detail.value
  form.category = categories[e.detail.value]
}

const generateDocument = async () => {
  // 表单验证
  if (!form.category) {
    uni.showToast({ title: '请选择装备类别', icon: 'none' })
    return
  }
  if (!form.budget) {
    uni.showToast({ title: '请输入预算金额', icon: 'none' })
    return
  }

  loading.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成模拟文档
    generatedContent.value = generateMockDocument()
    
    // 添加到历史记录
    history.value.unshift({
      category: form.category,
      budget: form.budget,
      date: new Date().toISOString().split('T')[0]
    })
    
    uni.showToast({ title: '生成成功！', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const generateMockDocument = () => {
  return `# ${form.category}采购招标文件

## 一、招标公告

**项目名称：** ${form.category}采购项目
**预算金额：** ${form.budget}
**采购方式：** 公开招标

### 项目概况
根据消防工作实际需要，现对${form.category}进行采购，欢迎符合条件的供应商参加投标。

## 二、采购需求

### 技术规格要求
${form.requirements || '具体技术参数详见附件'}

### 基本要求
1. 产品须符合国家相关质量标准
2. 提供完整的售后服务保障
3. 质保期不少于12个月
4. 提供产品合格证和相关检测报告

## 三、商务条款

### 交货要求
- 交货地点：采购人指定地点
- 交货时间：合同签订后30日内
- 运输方式：供应商负责运输并承担费用

### 付款方式
- 合同签订后支付30%预付款
- 验收合格后支付65%货款
- 质保期满后支付5%尾款

## 四、评标办法

采用综合评分法，总分100分：
- 价格分：40分
- 技术分：40分  
- 商务分：20分

## 五、投标文件要求

1. 投标函
2. 法定代表人授权书
3. 营业执照副本复印件
4. 产品技术参数响应表
5. 售后服务承诺书
6. 业绩证明材料
7. 产品质量证明文件

## 六、联系方式

采购单位：XX市消防救援支队
联系人：XXX
联系电话：XXXXXXXX

---
*本文件由 FireGrid AI 辅助生成系统生成*
*生成时间：${new Date().toLocaleString()}*` 
}

const copyContent = () => {
  uni.setClipboardData({
    data: generatedContent.value,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
}

const shareDocument = () => {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

const resetForm = () => {
  generatedContent.value = ''
  form.category = ''
  form.budget = ''
  form.requirements = ''
  categoryIndex.value = 0
}
</script>

<style scoped>
.ai-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form-container {
  padding: 30rpx;
}

.form-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.arrow {
  color: #999;
}

.input {
  height: 80rpx;
  font-size: 28rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.textarea {
  width: 100%;
  height: 200rpx;
  font-size: 28rpx;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.counter {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
}

.tips {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.tips-title {
  display: block;
  font-size: 26rpx;
  color: #667eea;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.tips-item {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
}

.submit-btn {
  width: 100%;
  margin-top: 20rpx;
}

.submit-btn[disabled] {
  opacity: 0.6;
}

.result-container {
  padding: 30rpx;
}

.result-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.result-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #26de81;
  margin-bottom: 12rpx;
}

.result-info {
  font-size: 26rpx;
  color: #666;
}

.document-content {
  background: #fff;
  border-radius: 16rpx;
  height: 800rpx;
  margin-bottom: 30rpx;
}

.content-scroll {
  height: 100%;
  padding: 24rpx;
}

.content-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.action-btn::after {
  border: none;
}

.copy-btn {
  background: #667eea;
  color: #fff;
}

.share-btn {
  background: #26de81;
  color: #fff;
}

.back-btn {
  background: #f0f0f0;
  color: #666;
}

.history-section {
  padding: 0 30rpx 40rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.history-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-info {
  flex: 1;
}

.history-category {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.history-budget {
  font-size: 24rpx;
  color: #ee5a24;
}

.history-date {
  font-size: 22rpx;
  color: #999;
}
</style>
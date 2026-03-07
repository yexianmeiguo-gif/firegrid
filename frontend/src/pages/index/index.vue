<template>
  <view class="index-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="logo">
        <text class="logo-text">🔥 FireGrid</text>
        <text class="logo-sub">消防装备信息化服务平台</text>
      </view>
      <view class="search-box" @click="goSearch">
        <text class="search-placeholder">🔍 搜索装备、招标信息...</text>
      </view>
    </view>
    
    <!-- 功能入口 -->
    <view class="feature-grid">
      <view class="feature-item" v-for="(item, index) in features" :key="index" @click="goToPage(item.path)">
        <view class="feature-icon" :style="{ background: item.bgColor }">
          <text>{{ item.icon }}</text>
        </view>
        <text class="feature-name">{{ item.name }}</text>
      </view>
    </view>
    
    <!-- AI工具卡片 -->
    <view class="ai-card card" @click="goToPage('/pages/ai/ai')">
      <view class="flex-between">
        <view>
          <text class="ai-title">🤖 AI招标文件生成器</text>
          <text class="ai-desc">输入需求，AI自动生成专业招标文件</text>
        </view>
        <text class="ai-btn">立即使用 ></text>
      </view>
    </view>
    
    <!-- 最新招标 -->
    <view class="section">
      <view class="section-header flex-between">
        <text class="section-title">📋 最新招标</text>
        <text class="more" @click="goToPage('/pages/tender/tender')">更多 ></text>
      </view>
      
      <view class="tender-list">
        <view class="tender-item" v-for="(item, index) in tenders" :key="index" @click="goTenderDetail(item.id)">
          <view class="tender-title">{{ item.title }}</view>
          <view class="tender-info flex-between">
            <text class="tender-region">📍 {{ item.region }}</text>
            <text class="tender-amount">💰 {{ item.amount }}</text>
          </view>
          <view class="tender-date">⏰ {{ item.date }}</view>
        </view>
      </view>
    </view>
    
    <!-- 热门装备 -->
    <view class="section">
      <view class="section-header flex-between">
        <text class="section-title">🚒 热门装备</text>
        <text class="more" @click="goToPage('/pages/equipment/equipment')">更多 ></text>
      </view>
      
      <view class="equipment-grid">
        <view class="equipment-item" v-for="(item, index) in equipments" :key="index" @click="goEquipmentDetail(item.id)">
          <view class="equipment-img">
            <text>{{ item.icon }}</text>
          </view>
          <text class="equipment-name">{{ item.name }}</text>
          <text class="equipment-manufacturer">{{ item.manufacturer }}</text>
        </view>
      </view>
    </view>
    
    <!-- 专业资讯 -->
    <view class="section">
      <view class="section-header flex-between">
        <text class="section-title">📰 专业资讯</text>
        <text class="more" @click="goToPage('/pages/article/article')">更多 ></text>
      </view>
      
      <view class="article-list">
        <view class="article-item flex" v-for="(item, index) in articles" :key="index" @click="goArticleDetail(item.id)">
          <view class="article-cover">
            <text>{{ item.cover }}</text>
          </view>
          <view class="article-content">
            <text class="article-title">{{ item.title }}</text>
            <view class="article-meta">
              <text class="article-tag">{{ item.tag }}</text>
              <text class="article-views">👁 {{ item.views }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/request.js'

// 功能入口
const features = ref([
  { name: '装备库', icon: '🚒', path: '/pages/equipment/equipment', bgColor: '#ff6b6b' },
  { name: '招标信息', icon: '📋', path: '/pages/tender/tender', bgColor: '#4ecdc4' },
  { name: 'AI工具', icon: '🤖', path: '/pages/ai/ai', bgColor: '#a55eea' },
  { name: '培训资讯', icon: '📚', path: '/pages/article/article', bgColor: '#26de81' },
])

// 数据列表
const tenders = ref([])
const equipments = ref([])
const articles = ref([])
const loading = ref(false)

// 获取首页数据
const fetchData = async () => {
  loading.value = true
  try {
    // 并行请求三个接口
    const [tenderRes, equipRes, articleRes] = await Promise.all([
      api.getTenderList({ limit: 3 }),
      api.getEquipmentList({ limit: 4 }),
      api.getArticleList({ limit: 3 })
    ])
    
    // 处理招标数据
    tenders.value = (tenderRes || []).map(item => ({
      id: item.id,
      title: item.title,
      region: item.region || '全国',
      amount: item.amount ? `${item.amount}万` : '待定',
      date: item.publishDate ? item.publishDate.split('T')[0] : ''
    }))
    
    // 处理装备数据
    equipments.value = (equipRes || []).map((item, index) => ({
      id: item.id,
      name: item.name,
      manufacturer: item.manufacturer,
      icon: ['🚒', '😷', '🔧', '🚁', '🧯', '📡'][index % 6]
    }))
    
    // 处理文章数据
    articles.value = (articleRes || []).map((item, index) => ({
      id: item.id,
      title: item.title,
      tag: item.category || '资讯',
      views: item.viewCount > 1000 ? `${(item.viewCount/1000).toFixed(1)}k` : item.viewCount,
      cover: ['🏢', '🔥', '💻', '🚒', '📋', '🎯'][index % 6]
    }))
    
  } catch (error) {
    console.error('获取数据失败:', error)
    uni.showToast({ title: '数据加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchData()
})

const goToPage = (path) => {
  uni.navigateTo({ url: path })
}

const goSearch = () => {
  uni.showToast({ title: '搜索功能开发中', icon: 'none' })
}

const goTenderDetail = (id) => {
  uni.navigateTo({ url: `/pages/tender/detail?id=${id}` })
}

const goEquipmentDetail = (id) => {
  uni.navigateTo({ url: `/pages/equipment/detail?id=${id}` })
}

const goArticleDetail = (id) => {
  uni.navigateTo({ url: `/pages/article/detail?id=${id}` })
}
</script>

<style scoped>
.index-container {
  padding-bottom: 40rpx;
}

.header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  padding: 40rpx 30rpx;
  border-radius: 0 0 40rpx 40rpx;
}

.logo {
  margin-bottom: 30rpx;
}

.logo-text {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

.logo-sub {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.search-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx;
  padding: 20rpx 30rpx;
}

.search-placeholder {
  color: #999;
  font-size: 28rpx;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  padding: 30rpx;
  background: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.feature-name {
  font-size: 24rpx;
  color: #333;
}

.ai-card {
  margin: 0 20rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.ai-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12rpx;
}

.ai-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.ai-btn {
  font-size: 26rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
}

.section {
  padding: 0 20rpx;
  margin-bottom: 30rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more {
  font-size: 26rpx;
  color: #999;
}

.tender-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.tender-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.tender-info {
  margin-bottom: 12rpx;
}

.tender-region {
  font-size: 24rpx;
  color: #666;
}

.tender-amount {
  font-size: 28rpx;
  color: #ee5a24;
  font-weight: 500;
}

.tender-date {
  font-size: 22rpx;
  color: #999;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.equipment-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: center;
}

.equipment-img {
  width: 100rpx;
  height: 100rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin: 0 auto 16rpx;
}

.equipment-name {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.equipment-manufacturer {
  display: block;
  font-size: 22rpx;
  color: #999;
}

.article-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.article-cover {
  width: 140rpx;
  height: 100rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.article-content {
  flex: 1;
}

.article-title {
  display: block;
  font-size: 30rpx;
  color: #333;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.article-meta {
  display: flex;
  align-items: center;
}

.article-tag {
  font-size: 20rpx;
  color: #ee5a24;
  background: rgba(238, 90, 36, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}

.article-views {
  font-size: 22rpx;
  color: #999;
}
</style>
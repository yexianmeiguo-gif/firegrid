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
import { ref } from 'vue'

// 功能入口
const features = ref([
  { name: '装备库', icon: '🚒', path: '/pages/equipment/equipment', bgColor: '#ff6b6b' },
  { name: '招标信息', icon: '📋', path: '/pages/tender/tender', bgColor: '#4ecdc4' },
  { name: 'AI工具', icon: '🤖', path: '/pages/ai/ai', bgColor: '#a55eea' },
  { name: '培训资讯', icon: '📚', path: '/pages/article/article', bgColor: '#26de81' },
])

// 最新招标（模拟数据）
const tenders = ref([
  { id: 1, title: 'XX市消防救援支队消防车采购项目', region: '江苏省', amount: '2,580万', date: '2024-03-15' },
  { id: 2, title: 'XX区应急管理局装备器材采购', region: '广东省', amount: '860万', date: '2024-03-14' },
  { id: 3, title: 'XX县消防救援大队空气呼吸器采购', region: '浙江省', amount: '320万', date: '2024-03-13' },
])

// 热门装备（模拟数据）
const equipments = ref([
  { id: 1, name: '水罐消防车', manufacturer: '中联重科', icon: '🚒' },
  { id: 2, name: '空气呼吸器', manufacturer: '德尔格', icon: '😷' },
  { id: 3, name: '液压破拆工具', manufacturer: 'LUKAS', icon: '🔧' },
  { id: 4, name: '消防无人机', manufacturer: '大疆', icon: '🚁' },
])

// 专业资讯（模拟数据）
const articles = ref([
  { id: 1, title: '高层建筑火灾扑救战术要点解析', tag: '业务培训', views: '2.3k', cover: '🏢' },
  { id: 2, title: '新型消防装备技术应用案例分享', tag: '装备知识', views: '1.8k', cover: '🔥' },
  { id: 3, title: '2024年消防信息化建设项目汇总', tag: '信息化', views: '3.1k', cover: '💻' },
])

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
<template>
  <view class="article-container">
    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-tabs">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === index }"
        v-for="(tab, index) in categories" 
        :key="index"
        @click="switchTab(index)"
      >
        {{ tab.name }}
      </view>
    </scroll-view>
    
    <!-- 文章列表 -->
    <view class="article-list">
      <view class="article-card" v-for="(item, index) in articles" :key="index">
        <view class="article-cover">
          <text class="cover-icon">{{ item.cover }}</text>
          <view class="article-type">{{ item.type }}</view>
        </view>
        
        <view class="article-content">
          <text class="article-title">{{ item.title }}</text>
          
          <text class="article-summary">{{ item.summary }}</text>
          
          <view class="article-meta">
            <text class="article-source">{{ item.source }}</text>
            <text class="article-views">👁 {{ item.views }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const currentTab = ref(0)

const categories = ref([
  { name: '推荐', id: 'featured' },
  { name: '业务培训', id: 'training' },
  { name: '实战案例', id: 'case' },
  { name: '装备知识', id: 'equipment' },
  { name: '政策法规', id: 'policy' },
  { name: '信息化', id: 'informatization' },
])

const articles = ref([
  {
    cover: '🏢',
    type: '业务培训',
    title: '高层建筑火灾扑救战术要点解析与实战应用',
    summary: '本文详细分析了高层建筑火灾的特点，总结了扑救过程中的战术要点和注意事项，为基层指挥员提供参考...',
    source: '中国消防',
    views: '2.3k',
  },
  {
    cover: '🔥',
    type: '实战案例',
    title: '某大型商业综合体火灾扑救战例评析',
    summary: '通过对近期某大型商业综合体火灾扑救过程的复盘，分析战术运用、力量调度和装备使用的经验教训...',
    source: '消防救援局',
    views: '1.8k',
  },
  {
    cover: '🤖',
    type: '信息化',
    title: '2024年消防信息化建设项目优秀案例汇总',
    summary: '整理了全国各地消防信息化建设的优秀案例，包括智慧消防、数字化指挥、装备管理等领域的创新实践...',
    source: '消防科技',
    views: '3.1k',
  },
  {
    cover: '🚒',
    type: '装备知识',
    title: '新型压缩空气泡沫消防车技术特点与应用',
    summary: '介绍新一代压缩空气泡沫消防车的技术原理、性能参数和实战应用效果，对比传统水罐消防车的优势...',
    source: '装备研究',
    views: '1.5k',
  },
  {
    cover: '📋',
    type: '政策法规',
    title: '《消防救援队伍训练大纲》解读与实施要点',
    summary: '对新修订的《消防救援队伍训练大纲》进行详细解读，分析主要变化和实施过程中的注意事项...',
    source: '消防法规',
    views: '2.1k',
  },
])

const switchTab = (index) => {
  currentTab.value = index
}
</script>

<style scoped>
.article-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.category-tabs {
  background: #fff;
  padding: 20rpx;
  white-space: nowrap;
  border-bottom: 2rpx solid #f0f0f0;
}

.tab-item {
  display: inline-block;
  padding: 16rpx 32rpx;
  margin-right: 16rpx;
  font-size: 28rpx;
  color: #666;
  border-radius: 32rpx;
  background: #f5f5f5;
}

.tab-item.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
}

.article-list {
  padding: 20rpx;
}

.article-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.article-cover {
  height: 300rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cover-icon {
  font-size: 120rpx;
}

.article-type {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  background: rgba(255, 255, 255, 0.9);
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #667eea;
}

.article-content {
  padding: 24rpx;
}

.article-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.article-summary {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-source {
  font-size: 24rpx;
  color: #667eea;
}

.article-views {
  font-size: 24rpx;
  color: #999;
}
</style>
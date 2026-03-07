<template>
  <view class="equipment-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-box">
        <text>🔍 搜索装备名称、制造商...</text>
      </view>
    </view>
    
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
    
    <!-- 装备列表 -->
    <view class="equipment-list">
      <view class="equipment-card" v-for="(item, index) in equipments" :key="index">
        <view class="equipment-header">
          <view class="equipment-icon">{{ item.icon }}</view>
          <view class="equipment-info">
            <text class="equipment-name">{{ item.name }}</text>
            <text class="equipment-manufacturer">{{ item.manufacturer }}</text>
          </view>
        </view>
        
        <view class="equipment-params">
          <view class="param-item" v-for="(param, pIndex) in item.params" :key="pIndex">
            <text class="param-label">{{ param.label }}:</text>
            <text class="param-value">{{ param.value }}</text>
          </view>
        </view>
        
        <view class="equipment-actions">
          <button class="action-btn compare">对比</button>
          <button class="action-btn contact">联系供应商</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const currentTab = ref(0)

const categories = ref([
  { name: '全部', id: 'all' },
  { name: '消防车辆', id: 'truck' },
  { name: '个人防护', id: 'protection' },
  { name: '抢险救援', id: 'rescue' },
  { name: '灭火器材', id: 'extinguishing' },
  { name: '通信指挥', id: 'communication' },
])

const equipments = ref([
  {
    icon: '🚒',
    name: '泡沫水罐消防车',
    manufacturer: '中联重科',
    params: [
      { label: '水罐容量', value: '8000L' },
      { label: '泡沫罐容量', value: '2000L' },
      { label: '水泵流量', value: '60L/s' },
      { label: '射程', value: '65m' },
    ]
  },
  {
    icon: '😷',
    name: '正压式空气呼吸器',
    manufacturer: '德尔格',
    params: [
      { label: '气瓶容量', value: '6.8L' },
      { label: '使用时间', value: '约45分钟' },
      { label: '工作压力', value: '30MPa' },
      { label: '重量', value: '≤10kg' },
    ]
  },
  {
    icon: '🔧',
    name: '液压破拆工具组',
    manufacturer: 'LUKAS',
    params: [
      { label: '扩张力', value: '≥100kN' },
      { label: '剪切力', value: '≥300kN' },
      { label: '牵引力', value: '≥60kN' },
      { label: '工作压力', value: '63MPa' },
    ]
  },
])

const switchTab = (index) => {
  currentTab.value = index
}
</script>

<style scoped>
.equipment-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-header {
  background: #fff;
  padding: 20rpx 30rpx;
}

.search-box {
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 20rpx 30rpx;
  color: #999;
  font-size: 28rpx;
}

.category-tabs {
  background: #fff;
  padding: 0 20rpx 20rpx;
  white-space: nowrap;
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

.equipment-list {
  padding: 20rpx;
}

.equipment-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.equipment-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.equipment-icon {
  width: 100rpx;
  height: 100rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 20rpx;
}

.equipment-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.equipment-manufacturer {
  font-size: 24rpx;
  color: #999;
}

.equipment-params {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.param-item {
  display: flex;
  align-items: center;
}

.param-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 8rpx;
}

.param-value {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.equipment-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 26rpx;
  border-radius: 36rpx;
  border: none;
}

.action-btn::after {
  border: none;
}

.compare {
  background: #f0f0f0;
  color: #666;
}

.contact {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
}
</style>
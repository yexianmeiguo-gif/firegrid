<template>
  <view class="tender-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" v-for="(filter, index) in filters" :key="index">
        <text>{{ filter.name }} ▼</text>
      </view>
    </view>
    
    <!-- 招标列表 -->
    <view class="tender-list">
      <view class="tender-card" v-for="(item, index) in tenders" :key="index">
        <view class="tender-status" :class="item.status">{{ item.statusText }}</view>
        
        <text class="tender-title">{{ item.title }}</text>
        
        <view class="tender-info">
          <view class="info-row">
            <text class="info-label">采购单位：</text>
            <text class="info-value">{{ item.purchaser }}</text>
          </view>          
          <view class="info-row">
            <text class="info-label">预算金额：</text>
            <text class="info-value amount">{{ item.amount }}</text>
          </view>          
          <view class="info-row">
            <text class="info-label">截止时间：</text>
            <text class="info-value">{{ item.deadline }}</text>
          </view>          
          <view class="info-row">
            <text class="info-label">所在地区：</text>
            <text class="info-value">📍 {{ item.region }}</text>
          </view>
        </view>
        
        <view class="tender-tags">
          <text class="tag" v-for="(tag, tIndex) in item.tags" :key="tIndex">{{ tag }}</text>
        </view>
        
        <view class="tender-actions">
          <button class="action-btn view">查看详情</button>
          <button class="action-btn favor">⭐ 关注</button>
        </view>
      </view>
    </view>
    
    <!-- 加载更多 -->
    <view class="load-more">
      <text>上拉加载更多...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const filters = ref([
  { name: '全部状态', id: 'all' },
  { name: '招标中', id: 'open' },
  { name: '全国', id: 'region' },
  { name: '全部分类', id: 'category' },
])

const tenders = ref([
  {
    status: 'open',
    statusText: '招标中',
    title: '江苏省消防救援总队消防车及装备采购项目',
    purchaser: '江苏省消防救援总队',
    amount: '2,580万元',
    deadline: '2024-03-25 17:00',
    region: '江苏省南京市',
    tags: ['消防车', '装备', '公开招标'],
  },
  {
    status: 'open',
    statusText: '招标中',
    title: '广州市消防救援支队个人防护装备采购',
    purchaser: '广州市消防救援支队',
    amount: '860万元',
    deadline: '2024-03-22 16:00',
    region: '广东省广州市',
    tags: ['防护装备', '竞争性磋商'],
  },
  {
    status: 'awarded',
    statusText: '已中标',
    title: '杭州市消防救援支队破拆工具采购项目',
    purchaser: '杭州市消防救援支队',
    amount: '320万元',
    deadline: '2024-03-10 已截止',
    region: '浙江省杭州市',
    tags: ['破拆工具', '公开招标'],
  },
  {
    status: 'open',
    statusText: '招标中',
    title: '四川省消防救援总队通信装备采购',
    purchaser: '四川省消防救援总队',
    amount: '1,200万元',
    deadline: '2024-03-28 17:30',
    region: '四川省成都市',
    tags: ['通信装备', '公开招标'],
  },
])
</script>

<style scoped>
.tender-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.filter-bar {
  display: flex;
  background: #fff;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.filter-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #666;
}

.tender-list {
  padding: 20rpx;
}

.tender-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  position: relative;
}

.tender-status {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.tender-status.open {
  background: rgba(38, 222, 129, 0.1);
  color: #26de81;
}

.tender-status.awarded {
  background: rgba(238, 90, 36, 0.1);
  color: #ee5a24;
}

.tender-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 20rpx;
  padding-right: 120rpx;
}

.tender-info {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  margin-bottom: 12rpx;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  width: 140rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.info-value.amount {
  color: #ee5a24;
  font-weight: 500;
}

.tender-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tag {
  font-size: 20rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.tender-actions {
  display: flex;
  gap: 16rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f0f0;
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

.view {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.favor {
  background: #f0f0f0;
  color: #666;
}

.load-more {
  text-align: center;
  padding: 40rpx;
}

.load-more text {
  font-size: 26rpx;
  color: #999;
}
</style>
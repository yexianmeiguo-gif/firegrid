<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-header">
        <view class="avatar">👨‍🚒</view>
        <view class="user-info">
          <text class="nickname">{{ isLogin ? '消防指挥员' : '未登录' }}</text>
          <text class="user-type">{{ isLogin ? '消防核心用户' : '点击登录' }}</text>
        </view>
        <text class="arrow">></text>
      </view>
      
      <view class="user-stats" v-if="isLogin">
        <view class="stat-item">
          <text class="stat-value">12</text>
          <text class="stat-label">我的收藏</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">8</text>
          <text class="stat-label">AI生成</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">156</text>
          <text class="stat-label">浏览历史</text>
        </view>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-section">
      <text class="section-title">我的服务</text>
      
      <view class="menu-list">
        <view class="menu-item" v-for="(item, index) in services" :key="index">
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-name">{{ item.name }}</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
    
    <!-- 设置菜单 -->
    <view class="menu-section">
      <text class="section-title">系统设置</text>
      
      <view class="menu-list">
        <view class="menu-item" v-for="(item, index) in settings" :key="index">
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-name">{{ item.name }}</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
    
    <!-- 登录/退出按钮 -->
    <view class="action-section">
      <button class="login-btn btn-primary" v-if="!isLogin">微信一键登录</button>
      <button class="logout-btn" v-else>退出登录</button>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text>FireGrid v1.0.0 | 消防装备信息化服务平台</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const isLogin = ref(true)

const services = ref([
  { name: '我的收藏', icon: '⭐' },
  { name: 'AI生成记录', icon: '🤖' },
  { name: '浏览历史', icon: '👁' },
  { name: '我的招标', icon: '📋' },
  { name: '企业认证', icon: '🏢' },
  { name: '联系客服', icon: '💬' },
])

const settings = ref([
  { name: '账号与安全', icon: '🔒' },
  { name: '消息通知', icon: '🔔' },
  { name: '清除缓存', icon: '🗑' },
  { name: '关于我们', icon: 'ℹ' },
])
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.user-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  padding: 40rpx 30rpx;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  margin-right: 24rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.user-type {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.arrow {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
}

.user-stats {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 24rpx 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.menu-section {
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.menu-list {
  border-top: 2rpx solid #f0f0f0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 40rpx;
}

.menu-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}

.action-section {
  margin: 40rpx 20rpx;
}

.login-btn {
  width: 100%;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #f0f0f0;
  color: #666;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.logout-btn::after {
  border: none;
}

.version-info {
  text-align: center;
  padding: 20rpx;
}

.version-info text {
  font-size: 22rpx;
  color: #999;
}
</style>
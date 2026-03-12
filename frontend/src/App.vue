<template>
  <view class="app">
    <slot />
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('FireGrid App Launch')
    // 检查登录状态
    const token = uni.getStorageSync('token')
    if (!token) {
      // 未登录，跳转到登录页
      // uni.navigateTo({ url: '/pages/login/login' })
    }
  },
  onShow() {
    console.log('FireGrid App Show')
  },
  onHide() {
    console.log('FireGrid App Hide')
  }
}
</script>

<style>
/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #f5f5f5;
}

.app {
  min-height: 100vh;
}

/* 通用样式类 */
.container {
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
  border-radius: 40rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.btn-primary::after {
  border: none;
}

.text-primary {
  color: #ee5a24;
}

.text-secondary {
  color: #666;
}

.text-muted {
  color: #999;
  font-size: 24rpx;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
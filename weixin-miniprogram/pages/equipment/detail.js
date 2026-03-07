// pages/equipment/detail.js
const app = getApp()

Page({
  data: {
    id: '',
    equipment: null,
    loading: true,
    isFavorite: false,
    icon: '🧯'
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.loadEquipmentDetail(options.id)
    }
  },

  // 加载装备详情
  loadEquipmentDetail(id) {
    this.setData({ loading: true })
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/equipment/${id}`,
      success: (res) => {
        if (res.data) {
          // 设置图标
          const iconMap = {
            'fire-truck': '🚒',
            'personal-protection': '😷',
            'rescue-tools': '🔧',
            'communication': '📡',
            'fire-extinguishing': '🧯'
          }
          
          this.setData({
            equipment: res.data,
            icon: iconMap[res.data.category] || '🧯',
            loading: false
          })
        } else {
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  // 切换收藏
  toggleFavorite() {
    this.setData({
      isFavorite: !this.data.isFavorite
    })
    
    wx.showToast({
      title: this.data.isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    })
  },

  // 联系供应商
  contactSupplier() {
    if (this.data.equipment?.supplier?.contactPhone) {
      wx.makePhoneCall({
        phoneNumber: this.data.equipment.supplier.contactPhone
      })
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
    }
  }
})
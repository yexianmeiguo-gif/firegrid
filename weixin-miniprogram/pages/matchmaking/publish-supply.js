// pages/matchmaking/publish-supply.js
const app = getApp()

Page({
  data: {
    form: {
      title: '',
      description: '',
      category: '',
      brand: '',
      model: '',
      price: '',
      quantity: '',
      stockStatus: 'IN_STOCK',
      deliveryDays: '',
      region: '',
      contactName: '',
      contactPhone: '',
      validDays: 30
    },
    categories: [
      { id: 'fire-truck', name: '消防车辆' },
      { id: 'personal-protection', name: '个人防护' },
      { id: 'rescue-tools', name: '抢险救援' },
      { id: 'fire-extinguishing', name: '灭火器材' },
      { id: 'communication', name: '通信指挥' },
      { id: 'other', name: '其他装备' }
    ],
    stockOptions: [
      { value: 'IN_STOCK', label: '现货' },
      { value: 'PRE_ORDER', label: '预订' },
      { value: 'CUSTOM', label: '定制' },
      { value: 'LIMITED', label: '限量' }
    ],
    validityOptions: [
      { days: 7, label: '7天' },
      { days: 15, label: '15天' },
      { days: 30, label: '30天' },
      { days: 60, label: '60天' },
      { days: 90, label: '90天' }
    ],
    loading: false
  },

  onLoad() {
    // 可以从用户档案中预填公司信息
  },

  // 输入处理
  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`form.${field}`]: value
    })
  },

  // 类别选择
  onCategoryChange(e) {
    const index = e.detail.value
    const category = this.data.categories[index]
    this.setData({
      'form.category': category.id
    })
  },

  // 地区选择
  onRegionChange(e) {
    const region = e.detail.value.join(' ')
    this.setData({
      'form.region': region
    })
  },

  // 库存状态选择
  selectStockStatus(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      'form.stockStatus': value
    })
  },

  // 有效期选择
  selectValidity(e) {
    const days = e.currentTarget.dataset.days
    this.setData({
      'form.validDays': days
    })
  },

  // 表单验证
  validateForm() {
    const { form } = this.data
    const errors = []

    if (!form.title.trim()) {
      errors.push('请输入供应标题')
    }
    if (!form.category) {
      errors.push('请选择装备类别')
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      errors.push('请输入有效的单价')
    }
    if (!form.region) {
      errors.push('请选择所在地区')
    }

    return errors
  },

  // 提交表单
  async submitForm() {
    const errors = this.validateForm()
    if (errors.length > 0) {
      wx.showToast({
        title: errors[0],
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      const { form } = this.data
      
      wx.request({
        url: `${app.globalData.apiBaseUrl}/matchmaking/offers`,
        method: 'POST',
        data: {
          title: form.title,
          description: form.description,
          category: form.category,
          brand: form.brand,
          model: form.model,
          price: parseFloat(form.price),
          quantity: form.quantity ? parseInt(form.quantity) : undefined,
          stockStatus: form.stockStatus,
          deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays) : undefined,
          region: form.region,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          validDays: form.validDays
        },
        success: (res) => {
          this.setData({ loading: false })
          
          if (res.statusCode === 201 || res.data?.id) {
            wx.showToast({
              title: '发布成功',
              icon: 'success'
            })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: res.data?.message || '发布失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          this.setData({ loading: false })
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          })
          console.error('发布供应失败:', err)
        }
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      })
      console.error('提交表单错误:', error)
    }
  }
})
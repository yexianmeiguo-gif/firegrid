// pages/matchmaking/publish-demand.js
const app = getApp()

Page({
  data: {
    form: {
      title: '',
      description: '',
      department: '',
      region: '',
      contactName: '',
      contactPhone: '',
      category: '',
      subCategory: '',
      budgetMin: '',
      budgetMax: '',
      quantity: '',
      deadline: '',
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
    subCategories: {
      'fire-truck': ['水罐消防车', '泡沫消防车', '登高平台车', '云梯车', '抢险救援车'],
      'personal-protection': ['消防服', '空气呼吸器', '头盔', '手套', '消防靴'],
      'rescue-tools': ['液压破拆工具', '起重气垫', '救援绳索', '照明设备'],
      'fire-extinguishing': ['灭火器', '消防水带', '消防水枪', '消火栓'],
      'communication': ['对讲机', '指挥中心设备', '无人机', '卫星通信'],
      'other': ['其他']
    },
    currentSubCategories: [],
    validityOptions: [
      { days: 7, label: '7天' },
      { days: 15, label: '15天' },
      { days: 30, label: '30天' },
      { days: 60, label: '60天' },
      { days: 90, label: '90天' }
    ],
    today: '',
    loading: false
  },

  onLoad() {
    // 设置今天日期为最小值
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    this.setData({
      today: `${year}-${month}-${day}`
    })
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
    const subCategories = this.data.subCategories[category.id] || []
    
    this.setData({
      'form.category': category.id,
      'form.subCategory': '',
      currentSubCategories: subCategories
    })
  },

  // 子类别选择
  onSubCategoryChange(e) {
    const index = e.detail.value
    const subCategory = this.data.currentSubCategories[index]
    this.setData({
      'form.subCategory': subCategory
    })
  },

  // 地区选择
  onRegionChange(e) {
    const region = e.detail.value.join(' ')
    this.setData({
      'form.region': region
    })
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'form.deadline': e.detail.value
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
      errors.push('请输入需求标题')
    }
    if (!form.category) {
      errors.push('请选择装备类别')
    }
    if (!form.region) {
      errors.push('请选择所在地区')
    }
    if (!form.department.trim()) {
      errors.push('请输入所在单位')
    }
    if (form.budgetMin && form.budgetMax) {
      if (parseFloat(form.budgetMin) > parseFloat(form.budgetMax)) {
        errors.push('预算下限不能大于上限')
      }
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
        url: `${app.globalData.apiBaseUrl}/matchmaking/demands`,
        method: 'POST',
        data: {
          title: form.title,
          description: form.description,
          department: form.department,
          region: form.region,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          category: form.category,
          subCategory: form.subCategory,
          budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
          quantity: form.quantity ? parseInt(form.quantity) : undefined,
          deadline: form.deadline || undefined,
          validDays: form.validDays
        },
        success: (res) => {
          this.setData({ loading: false })
          
          if (res.statusCode === 201 || res.data?.id) {
            wx.showToast({
              title: '发布成功',
              icon: 'success'
            })
            
            // 延迟返回并刷新列表
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
          console.error('发布需求失败:', err)
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
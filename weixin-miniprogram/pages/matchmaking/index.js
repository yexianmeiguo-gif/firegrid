// pages/matchmaking/index.js
const app = getApp()

Page({
  data: {
    activeTab: 'demand',
    categories: [
      { id: '', name: '全部类别' },
      { id: 'fire-truck', name: '消防车辆' },
      { id: 'personal-protection', name: '个人防护' },
      { id: 'rescue-tools', name: '抢险救援' },
      { id: 'fire-extinguishing', name: '灭火器材' },
      { id: 'communication', name: '通信指挥' },
    ],
    selectedCategory: '',
    selectedRegion: '',
    demands: [],
    offers: [],
    myItems: [],
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示页面刷新数据
    this.loadData()
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadData()
  },

  // 加载数据
  loadData() {
    const { activeTab } = this.data
    
    if (activeTab === 'demand') {
      this.loadDemands()
    } else if (activeTab === 'supply') {
      this.loadOffers()
    } else if (activeTab === 'match') {
      this.loadMyItems()
    }
  },

  // 加载需求列表
  loadDemands() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/matchmaking/demands`,
      data: {
        category: this.data.selectedCategory,
        region: this.data.selectedRegion,
        limit: 20
      },
      success: (res) => {
        if (res.data?.items) {
          this.setData({
            demands: res.data.items.map(item => ({
              ...item,
              createdAt: this.formatDate(item.createdAt)
            }))
          })
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 加载供应列表
  loadOffers() {
    this.setData({ loading: true })
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/matchmaking/offers`,
      data: {
        category: this.data.selectedCategory,
        region: this.data.selectedRegion,
        limit: 20
      },
      success: (res) => {
        if (res.data?.items) {
          this.setData({ offers: res.data.items })
        }
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 加载我的发布
  loadMyItems() {
    // 合并我的需求和我的供应
    Promise.all([
      this.loadMyDemands(),
      this.loadMyOffers()
    ]).then(([demands, offers]) => {
      const myItems = [
        ...demands.map(d => ({ ...d, type: 'demand' })),
        ...offers.map(o => ({ ...o, type: 'supply' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      this.setData({ myItems })
    })
  },

  loadMyDemands() {
    return new Promise((resolve) => {
      wx.request({
        url: `${app.globalData.apiBaseUrl}/matchmaking/demands/my`,
        success: (res) => {
          resolve(res.data || [])
        },
        fail: () => resolve([])
      })
    })
  },

  loadMyOffers() {
    return new Promise((resolve) => {
      wx.request({
        url: `${app.globalData.apiBaseUrl}/matchmaking/offers/my`,
        success: (res) => {
          resolve(res.data || [])
        },
        fail: () => resolve([])
      })
    })
  },

  // 类别筛选
  onCategoryChange(e) {
    const index = e.detail.value
    const category = this.data.categories[index].id
    this.setData({ selectedCategory: category })
    this.loadData()
  },

  // 地区筛选
  onRegionChange(e) {
    const region = e.detail.value.join('')
    this.setData({ selectedRegion: region })
    this.loadData()
  },

  // 查看需求详情
  viewDemandDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/matchmaking/demand-detail?id=${id}`
    })
  },

  // 查看供应详情
  viewOfferDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/matchmaking/offer-detail?id=${id}`
    })
  },

  // 发布需求
  goPublishDemand() {
    wx.navigateTo({
      url: '/pages/matchmaking/publish-demand'
    })
  },

  // 发布供应
  goPublishSupply() {
    wx.navigateTo({
      url: '/pages/matchmaking/publish-supply'
    })
  },

  // 去发布
  goPublish() {
    wx.showActionSheet({
      itemList: ['发布采购需求', '发布供应信息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.goPublishDemand()
        } else {
          this.goPublishSupply()
        }
      }
    })
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
})
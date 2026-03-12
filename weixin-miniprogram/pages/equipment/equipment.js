// pages/equipment/equipment.js
const app = getApp()

Page({
  data: {
    categories: [],
    equipments: [],
    currentCategory: '',
    loading: false,
    page: 1,
    hasMore: true,
    keyword: ''
  },

  onLoad() {
    this.loadCategories()
    this.loadEquipments()
  },

  // 加载分类
  loadCategories() {
    const categories = [
      { id: '', name: '全部' },
      { id: 'fire-truck', name: '消防车辆' },
      { id: 'personal-protection', name: '个人防护' },
      { id: 'rescue-tools', name: '抢险救援' },
      { id: 'fire-extinguishing', name: '灭火器材' },
      { id: 'communication', name: '通信指挥' },
    ]
    this.setData({ categories })
  },

  // 加载装备列表
  loadEquipments() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/equipment`,
      data: {
        category: this.data.currentCategory,
        keyword: this.data.keyword,
        limit: 10,
        offset: (this.data.page - 1) * 10
      },
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const equipments = this.data.page === 1 
            ? res.data 
            : [...this.data.equipments, ...res.data]
          
          this.setData({
            equipments,
            hasMore: res.data.length === 10,
            page: this.data.page + 1
          })
        }
      },
      complete: () => {
        this.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
    })
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      equipments: [],
      page: 1,
      hasMore: true
    })
    this.loadEquipments()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 搜索
  doSearch() {
    this.setData({
      equipments: [],
      page: 1,
      hasMore: true
    })
    this.loadEquipments()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      equipments: [],
      page: 1,
      hasMore: true
    })
    this.loadEquipments()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadEquipments()
  },

  // 进入详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/equipment/detail?id=${id}`
    })
  }
})
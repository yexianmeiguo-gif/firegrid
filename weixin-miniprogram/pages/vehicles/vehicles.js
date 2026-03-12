// pages/vehicles/vehicles.js
const app = getApp()

Page({
  data: {
    categories: [],
    vehicles: [],
    currentCategory: '',
    loading: false,
    page: 1,
    hasMore: true,
    keyword: ''
  },

  onLoad() {
    this.loadCategories()
    this.loadVehicles()
  },

  // 加载分类
  loadCategories() {
    const categories = [
      { id: '', name: '全部' },
      { id: 'water-tank', name: '水罐消防车' },
      { id: 'foam', name: '泡沫消防车' },
      { id: 'ladder', name: '云梯消防车' },
      { id: 'rescue', name: '抢险救援车' },
      { id: 'special', name: '特种消防车' },
    ]
    this.setData({ categories })
  },

  // 加载车辆列表
  loadVehicles() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    // 这里可以调用API获取数据，目前使用模拟数据
    setTimeout(() => {
      // 模拟数据
      const mockVehicles = [
        {
          id: 1,
          name: 'JY5150GXFPM60/H水罐消防车',
          manufacturer: '中联重科',
          category: 'water-tank',
          parameters: {
            '水罐容积': '6000L',
            '最大功率': '309kW',
            '最高车速': '90km/h',
            '泵流量': '60L/s'
          }
        },
        {
          id: 2,
          name: 'PM32H云梯消防车',
          manufacturer: '徐工消防',
          category: 'ladder',
          parameters: {
            '工作高度': '32m',
            '载重量': '300kg',
            '最大功率': '280kW',
            '出梯时间': '120s'
          }
        },
        {
          id: 3,
          name: 'AP60/PM泡沫消防车',
          manufacturer: '中卓时代',
          category: 'foam',
          parameters: {
            '泡沫罐容积': '2000L',
            '水罐容积': '6000L',
            '最大功率': '320kW',
            '泵流量': '60L/s'
          }
        },
        {
          id: 4,
          name: 'JY5170TXFJY120/Z抢险救援消防车',
          manufacturer: '江南专用特种车有限公司',
          category: 'rescue',
          parameters: {
            '整车质量': '17000kg',
            '最大功率': '265kW',
            '装备配置': '液压破拆、照明、救生设备',
            '救援人数': '8人'
          }
        },
        {
          id: 5,
          name: 'JY5252GPXF40/W泡沫水罐联用消防车',
          manufacturer: '上海金盾',
          category: 'foam',
          parameters: {
            '水罐容积': '8000L',
            '泡沫罐容积': '2000L',
            '最大功率': '320kW',
            '泵流量': '40L/s'
          }
        }
      ]

      // 根据分类和关键词筛选
      let filteredVehicles = [...mockVehicles]

      if (this.data.currentCategory) {
        filteredVehicles = filteredVehicles.filter(item =>
          item.category === this.data.currentCategory
        )
      }

      if (this.data.keyword) {
        const keyword = this.data.keyword.toLowerCase()
        filteredVehicles = filteredVehicles.filter(item =>
          item.name.toLowerCase().includes(keyword) ||
          item.manufacturer.toLowerCase().includes(keyword)
        )
      }

      // 模拟分页
      const startIndex = (this.data.page - 1) * 10
      const endIndex = startIndex + 10
      const pageData = filteredVehicles.slice(startIndex, endIndex)

      const vehicles = this.data.page === 1
        ? pageData
        : [...this.data.vehicles, ...pageData]

      this.setData({
        vehicles,
        hasMore: pageData.length === 10,
        page: this.data.page + 1,
        loading: false
      })

      wx.stopPullDownRefresh()
    }, 500)
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      vehicles: [],
      page: 1,
      hasMore: true
    })
    this.loadVehicles()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 搜索
  doSearch() {
    this.setData({
      vehicles: [],
      page: 1,
      hasMore: true
    })
    this.loadVehicles()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      vehicles: [],
      page: 1,
      hasMore: true
    })
    this.loadVehicles()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadVehicles()
  },

  // 进入详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '详情功能开发中',
      icon: 'none'
    })
    // 后续实现
    // wx.navigateTo({
    //   url: `/pages/vehicles/detail?id=${id}`
    // })
  }
})
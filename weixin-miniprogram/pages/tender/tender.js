// pages/tender/tender.js
const app = getApp()

Page({
  data: {
    tenders: [],
    filters: [
      { id: 'all', name: '全部' },
      { id: 'OPEN', name: '招标中' },
      { id: 'AWARDED', name: '已中标' },
      { id: 'CLOSED', name: '已截止' },
    ],
    currentFilter: 'all',
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadTenders()
  },

  // 加载招标列表
  loadTenders() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })
    
    const params = {
      limit: 10,
      offset: (this.data.page - 1) * 10
    }
    
    if (this.data.currentFilter !== 'all') {
      params.status = this.data.currentFilter
    }
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/tenders`,
      data: params,
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const tenders = this.data.page === 1 
            ? res.data 
            : [...this.data.tenders, ...res.data]
          
          this.setData({
            tenders,
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

  // 切换筛选
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      currentFilter: filter,
      tenders: [],
      page: 1,
      hasMore: true
    })
    this.loadTenders()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      tenders: [],
      page: 1,
      hasMore: true
    })
    this.loadTenders()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadTenders()
  },

  // 进入详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/tender/detail?id=${id}`
    })
  }
})
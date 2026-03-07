// pages/index/index.js
const app = getApp()

Page({
  data: {
    loading: false,
    tenders: [],
    equipments: [
      { id: 1, name: '水罐消防车', manufacturer: '中联重科', icon: '🚒' },
      { id: 2, name: '空气呼吸器', manufacturer: '德尔格', icon: '😷' },
      { id: 3, name: '液压破拆工具', manufacturer: 'LUKAS', icon: '🔧' },
      { id: 4, name: '消防无人机', manufacturer: '大疆', icon: '🚁' },
    ],
    stats: {
      equipments: 6,
      tenders: 5,
      suppliers: 4
    }
  },

  onLoad() {
    this.fetchData()
    this.loadStats()
  },

  onPullDownRefresh() {
    this.fetchData()
    this.loadStats()
  },

  // 加载统计数据
  loadStats() {
    // 这里可以调用后端API获取真实统计数据
    // 暂时使用模拟数据
    this.setData({
      stats: {
        equipments: 6,
        tenders: 5,
        suppliers: 4
      }
    })
  },

  // 获取首页数据
  fetchData() {
    this.setData({ loading: true })
    
    const that = this
    
    // 调用后端 API 获取招标列表
    wx.request({
      url: `${app.globalData.apiBaseUrl}/tenders`,
      method: 'GET',
      data: { limit: 3 },
      success: (res) => {
        console.log('API 返回:', res.data)
        console.log('状态码:', res.statusCode)
        
        // 检查响应是否成功
        if (res.statusCode === 200 && res.data) {
          // 处理两种情况：直接数组或嵌套在 data 属性中
          const responseData = Array.isArray(res.data) ? res.data : (res.data.data || [])
          
          if (responseData.length > 0) {
            const tenders = responseData.map((item, index) => ({
              id: item.id,
              title: item.title,
              region: item.region || '全国',
              amount: item.amount ? `¥${item.amount}万` : '待定',
              date: item.publishDate ? item.publishDate.split('T')[0] : '',
              status: item.status || 'OPEN',
              // 添加入场动画延迟
              animationDelay: index * 0.1
            }))
            that.setData({ tenders })
            console.log('设置 tenders 成功:', tenders.length, '条数据')
          } else {
            console.log('API 返回空数组')
            that.setMockData()
          }
        } else {
          console.error('API 响应异常:', res)
          that.setMockData()
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        that.setMockData()
      },
      complete: () => {
        that.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
    })
  },

  // 模拟数据（备用）
  setMockData() {
    this.setData({
      tenders: [
        { id: '1', title: '江苏省消防救援总队消防车采购项目', region: '江苏省南京市', amount: '¥2580万', date: '2024-03-15', status: 'OPEN', animationDelay: 0 },
        { id: '2', title: '广州市消防救援支队个人防护装备采购', region: '广东省广州市', amount: '¥860万', date: '2024-03-14', status: 'OPEN', animationDelay: 0.1 },
        { id: '3', title: '杭州市消防救援支队破拆工具采购项目', region: '浙江省杭州市', amount: '¥520万', date: '2024-03-13', status: 'AWARDED', animationDelay: 0.2 },
      ]
    })
  },

  // 页面跳转
  goToPage(e) {
    const url = e.currentTarget.dataset.url
    wx.switchTab({ url })
  }
})
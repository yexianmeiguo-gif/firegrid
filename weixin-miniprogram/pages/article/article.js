// pages/article/article.js
const app = getApp()

Page({
  data: {
    apiUrl: ''
  },
  onLoad: function() {
    this.setData({
      apiUrl: app.globalData.apiBaseUrl
    })
  }
})

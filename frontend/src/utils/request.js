import { BASE_URL, API, TIMEOUT } from './config'

// 请求拦截器
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取 token
    const token = uni.getStorageSync('token')
    
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.header
      },
      timeout: TIMEOUT,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 过期，清除登录状态
          uni.removeStorageSync('token')
          uni.showToast({ title: '登录已过期', icon: 'none' })
          reject(res.data)
        } else {
          uni.showToast({ 
            title: res.data?.message || '请求失败', 
            icon: 'none' 
          })
          reject(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({ 
          title: '网络错误，请检查网络', 
          icon: 'none' 
        })
        reject(err)
      }
    })
  })
}

// 封装常用方法
export const http = {
  get: (url, params) => request({ url, method: 'GET', data: params }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url) => request({ url, method: 'DELETE' }),
}

// 业务 API 封装
export const api = {
  // 认证
  wxLogin: (code) => http.post(API.WX_LOGIN, { code }),
  bindPhone: (phone) => http.post(API.BIND_PHONE, { phone }),
  
  // 用户
  getProfile: () => http.get(API.USER_PROFILE),
  updateProfile: (data) => http.put(API.UPDATE_PROFILE, data),
  
  // 装备
  getCategories: () => http.get(API.EQUIPMENT_CATEGORIES),
  getEquipmentList: (params) => http.get(API.EQUIPMENT_LIST, params),
  getEquipmentDetail: (id) => http.get(API.EQUIPMENT_DETAIL(id)),
  compareEquipment: (ids) => http.post(API.EQUIPMENT_COMPARE, { ids }),
  
  // AI
  generateBidding: (data) => http.post(API.AI_GENERATE, data),
  getAIHistory: () => http.get(API.AI_HISTORY),
  
  // 招标
  getTenderList: (params) => http.get(API.TENDER_LIST, params),
  getTenderDetail: (id) => http.get(API.TENDER_DETAIL(id)),
  getTenderRecommendations: () => http.get(API.TENDER_RECOMMENDATIONS),
  
  // 资讯
  getArticleList: (params) => http.get(API.ARTICLE_LIST, params),
  getArticleCategories: () => http.get(API.ARTICLE_CATEGORIES),
  getArticleDetail: (id) => http.get(API.ARTICLE_DETAIL(id)),
}

export default api
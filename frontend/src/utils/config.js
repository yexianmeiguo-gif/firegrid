// API 配置文件
const isDev = process.env.NODE_ENV === 'development'

// 后端 API 地址
export const BASE_URL = 'https://firegrid.onrender.com'

// API 端点
export const API = {
  // 认证
  WX_LOGIN: '/auth/wx-login',
  BIND_PHONE: '/auth/bind-phone',
  
  // 用户
  USER_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  
  // 装备
  EQUIPMENT_CATEGORIES: '/equipment/categories',
  EQUIPMENT_LIST: '/equipment',
  EQUIPMENT_DETAIL: (id) => `/equipment/${id}`,
  EQUIPMENT_COMPARE: '/equipment/compare',
  
  // AI
  AI_GENERATE: '/ai/generate-bidding',
  AI_HISTORY: '/ai/history',
  
  // 招标
  TENDER_LIST: '/tenders',
  TENDER_DETAIL: (id) => `/tenders/${id}`,
  TENDER_RECOMMENDATIONS: '/tenders/recommendations',
  
  // 资讯
  ARTICLE_LIST: '/articles',
  ARTICLE_CATEGORIES: '/articles/categories',
  ARTICLE_DETAIL: (id) => `/articles/${id}`,
}

// 请求超时时间
export const TIMEOUT = 30000

// 微信小程序 AppID（需要换成你自己的）
export const WECHAT_APPID = ''
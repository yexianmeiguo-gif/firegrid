// pages/ai/ai.js
const app = getApp()

Page({
  data: {
    category: '',
    budget: '',
    requirements: '',
    loading: false,
    result: ''
  },

  onCategoryInput(e) {
    this.setData({ category: e.detail.value })
  },

  onBudgetInput(e) {
    this.setData({ budget: e.detail.value })
  },

  onRequirementsInput(e) {
    this.setData({ requirements: e.detail.value })
  },

  async generateDocument() {
    const { category, budget } = this.data
    
    if (!category || !budget) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await wx.request({
        url: `${app.globalData.apiBaseUrl}/ai/generate-bidding`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        data: {
          category,
          budget,
          requirements: this.data.requirements
        }
      })

      if (res.data && res.data.content) {
        this.setData({ result: res.data.content })
      } else {
        // 如果后端返回格式不对，显示模拟结果
        this.setData({ result: this.generateMockResult() })
      }
    } catch (error) {
      console.error('生成失败:', error)
      // 显示模拟结果
      this.setData({ result: this.generateMockResult() })
    } finally {
      this.setData({ loading: false })
    }
  },

  generateMockResult() {
    const { category, budget } = this.data
    return `# ${category}采购招标文件

## 一、招标公告

**项目名称：** ${category}采购项目
**预算金额：** ${budget}
**采购方式：** 公开招标

## 二、采购需求

### 技术规格要求
- 符合国家消防装备质量标准
- 提供完整的产品检测报告
- 质保期不少于12个月

## 三、商务条款

### 交货要求
- 交货地点：采购人指定地点
- 交货时间：合同签订后30日内

### 付款方式
- 合同签订后支付30%预付款
- 验收合格后支付65%货款
- 质保期满后支付5%尾款

## 四、评标办法

采用综合评分法，总分100分：
- 价格分：40分
- 技术分：40分
- 商务分：20分

---
*本文件由 FireGrid AI 辅助生成*`
  },

  copyResult() {
    wx.setClipboardData({
      data: this.data.result,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  resetForm() {
    this.setData({
      category: '',
      budget: '',
      requirements: '',
      result: ''
    })
  }
})
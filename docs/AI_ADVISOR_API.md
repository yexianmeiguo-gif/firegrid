# AI 装备顾问 API 设计

## 1. 自然语言智能搜索

- **Endpoint**: `POST /api/ai/equipment/search`
- **描述**:接收用户的自然语言输入（如“推荐一款适合高层建筑灭火的消防泵”），通过语义分析，返回最匹配的装备列表。
- **请求体 (Request Body)**:
  ```json
  {
    "query": "适合高层建筑灭火的消防泵",
    "limit": 5
  }
  ```
- **响应体 (Response Body)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-1234",
        "name": "XX型号高层供水消防泵",
        "score": 95.5,
        "summary": "专为高层建筑设计，扬程高，流量大。",
        "tags": ["高层建筑", "消防泵", "大流量"]
      }
    ]
  }
  ```

## 2. 表单式高级推荐

- **Endpoint**: `POST /api/ai/equipment/recommend`
- **描述**: 根据用户通过表单选择的结构化参数，进行精确筛选和排序，返回推荐装备列表。
- **请求体 (Request Body)**:
  ```json
  {
    "category": "消防泵",
    "filters": {
      "扬程": { "min": 150, "unit": "m" },
      "流量": { "min": 50, "unit": "L/s" },
      "认证": ["CCCf"]
    },
    "limit": 5,
    "sortBy": "matchScore" // or "price_asc", "price_desc"
  }
  ```
- **响应体 (Response Body)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-1234",
        "name": "XX型号高层供水消防泵",
        "score": 98.0,
        "parameters": {
          "扬程": "160m",
          "流量": "60L/s"
        },
        "supplier": "ABC消防设备有限公司"
      }
    ]
  }
  ```

## 3. 获取装备详情

- **Endpoint**: `GET /api/ai/equipment/:id`
- **描述**: 获取单个装备的完整信息，包括详细参数、供应商信息、实战案例和用户评价。
- **URL 参数**:
  - `id`: 装备的唯一ID
- **响应体 (Response Body)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-1234",
      "name": "XX型号高层供水消防泵",
      "description": "...",
      "parameters": { "...": "..." },
      "supplier": {
        "id": "sup-uuid-5678",
        "name": "ABC消防设备有限公司",
        "contact": "13800138000"
      },
      "caseStudies": [
        {
          "title": "XX大厦火灾实战应用",
          "summary": "在此次灭火救援中，该消防泵表现出色..."
        }
      ],
      "reviews": [
        {
          "user": "李消防",
          "rating": 5,
          "comment": "性能非常可靠！"
        }
      ]
    }
  }
  ```

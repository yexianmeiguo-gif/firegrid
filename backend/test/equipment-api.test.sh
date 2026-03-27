#!/bin/bash

# 测试装备筛选 API
echo "========================================="
echo "FireGrid 装备筛选 API 测试脚本"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"

# 测试 1: 筛选条件统计
echo "【测试 1】获取筛选条件统计"
echo "-------------------------------------------"
curl -s "${BASE_URL}/api/equipment/filter-options" | jq '.'
echo ""
echo ""

# 测试 2: 筛选装备（无条件，默认排序）
echo "【测试 2】筛选装备（无条件，前 5 条）"
echo "-------------------------------------------"
curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试 3: 筛选装备（价格 10-20万）
echo "【测试 3】筛选装备（价格 10-20万）"
echo "-------------------------------------------"
curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "priceRange": {
      "min": 100000,
      "max": 200000
    },
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试 4: 筛选装备（消防车辆类别）
echo "【测试 4】筛选装备（消防车辆类别）"
echo "-------------------------------------------"
curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["fire_truck"],
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试 5: 筛选装备（GB 7956 标准）
echo "【测试 5】筛选装备（GB 7956 标准）"
echo "-------------------------------------------"
curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "standards": ["GB 7956"],
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试 6: 筛选装备（合作商）
echo "【测试 6】筛选装备（合作商）"
echo "-------------------------------------------"
curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "partnershipStatus": ["partner"],
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试 7: 筛选装备（组合条件）
echo "【测试 7】筛选装备（组合条件：消防车辆 + GB 7956 + 价格排序）"
echo "-------------------------------------------"
curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["fire_truck"],
    "standards": ["GB 7956"],
    "sortBy": "price_asc",
    "page": 1,
    "pageSize": 5
  }' | jq '.'
echo ""
echo ""

# 测试 8: 获取装备详情
echo "【测试 8】获取装备详情（第一个装备）"
echo "-------------------------------------------"
# 先获取第一个装备的 ID
FIRST_ID=$(curl -s -X POST "${BASE_URL}/api/equipment/filter" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 1}' | jq -r '.items[0].id')

echo "装备 ID: $FIRST_ID"
curl -s "${BASE_URL}/api/equipment/${FIRST_ID}" | jq '.'
echo ""
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="

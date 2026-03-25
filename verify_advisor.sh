#!/bin/bash

echo "🔍 FireGrid AI 装备顾问 - 文件完整性检查"
echo "================================================"
echo ""

# 检查页面文件
echo "📄 检查页面文件..."
files=(
  "weixin-miniprogram/pages/advisor/advisor.js"
  "weixin-miniprogram/pages/advisor/advisor.wxml"
  "weixin-miniprogram/pages/advisor/advisor.wxss"
  "weixin-miniprogram/pages/advisor/advisor.json"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    size=$(ls -lh "$file" | awk '{print $5}')
    echo "  ✅ $file ($size)"
  else
    echo "  ❌ $file (缺失)"
    all_exist=false
  fi
done

# 检查配置
echo ""
echo "⚙️  检查配置..."
if grep -q "pages/advisor/advisor" weixin-miniprogram/app.json; then
  echo "  ✅ app.json 已添加路由"
else
  echo "  ❌ app.json 未添加路由"
  all_exist=false
fi

# 检查跳转入口
echo ""
echo "🔗 检查跳转入口..."
if grep -q "/pages/advisor/advisor" weixin-miniprogram/pages/ai/ai.wxml; then
  echo "  ✅ AI 页面已添加跳转入口"
else
  echo "  ⚠️  AI 页面未添加跳转入口（可选）"
fi

# 检查文档
echo ""
echo "📚 检查文档..."
docs=(
  "ADVISOR_DELIVERY_SUMMARY.md"
  "ADVISOR_TEST_GUIDE.md"
  "START_ADVISOR_DEV.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ⚠️  $doc (可选)"
  fi
done

# 总结
echo ""
echo "================================================"
if [ "$all_exist" = true ]; then
  echo "✅ 所有必需文件都已就绪！"
  echo ""
  echo "🚀 下一步："
  echo "   1. 打开微信开发者工具"
  echo "   2. 导入 weixin-miniprogram 目录"
  echo "   3. 访问 pages/advisor/advisor 页面"
  echo "   4. 参考 START_ADVISOR_DEV.md 开始测试"
else
  echo "❌ 有文件缺失，请检查！"
fi

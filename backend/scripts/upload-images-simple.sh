#!/bin/bash

# 简单批量上传脚本
# 使用 cloudbase CLI 批量上传图片

ENV_ID="firegrid-4gyg2o9u7ca7b7da"
SOURCE_DIR="/Users/rabbit-y/Documents/消防装备供应商资料/供应商产品数据"
CLOUD_PATH="product-images"

echo "🚀 开始批量上传图片到 CloudBase..."
echo "========================================"
echo

# 使用 cloudbase storage upload 命令批量上传整个目录
cloudbase storage upload "$SOURCE_DIR" "$CLOUD_PATH" -e "$ENV_ID" --verbose

echo
echo "========================================"
echo "✅ 上传完成！"

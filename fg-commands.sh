#!/bin/bash
# FireGrid 快捷管理命令
# 使用方法: source ~/.openclaw/workspace/firegrid/fg-commands.sh
# 或者添加到 .zshrc: source ~/.openclaw/workspace/firegrid/fg-commands.sh

echo "🔥 FireGrid 快捷命令已加载"
echo "可用命令: fg-status, fg-fix, fg-deploy, fg-log, fg-open"

# 基础路径
export FG_ROOT="$HOME/.openclaw/workspace/firegrid"
export FG_WEIXIN="$FG_ROOT/firegrid-weixin"
export FG_BACKEND="$FG_ROOT/backend"

# 查看所有状态
fg-status() {
    echo "📊 FireGrid 状态检查"
    echo "===================="
    
    # 检查微信开发者工具
    echo "📱 小程序项目:"
    if [ -d "$FG_WEIXIN" ]; then
        echo "  ✅ 项目存在"
        echo "  📄 页面数: $(find $FG_WEIXIN/pages -name '*.wxml' | wc -l)"
        echo "  📝 最后修改: $(ls -lt $FG_WEIXIN/pages | head -2 | tail -1 | awk '{print $6, $7, $8}')"
    else
        echo "  ❌ 项目不存在"
    fi
    
    # 检查后端
    echo ""
    echo "☁️ 后端服务:"
    if curl -s https://firegrid-backend-230828-6-1409174142.sh.run.tcloudbase.com/api/tenders > /dev/null; then
        echo "  ✅ CloudBase 运行正常"
    else
        echo "  ⚠️  CloudBase 可能异常 (503错误)"
        echo "     修复命令: fg-deploy"
    fi
    
    # 检查Git状态
    echo ""
    echo "📦 Git状态:"
    cd $FG_ROOT
    git status --short | head -5
    
    echo ""
    echo "💡 提示: 使用 fg-help 查看所有命令"
}

# 一键修复常见错误
fg-fix() {
    echo "🔧 FireGrid 自动修复"
    echo "===================="
    
    # 修复1: WXML标签错误
    echo "📄 修复WXML标签..."
    cd $FG_WEIXIN
    
    # 查找并修复未闭合的view标签
    find pages -name "*.wxml" -exec sed -i '' 's/<view\([^>]*\)>\([^<]*\)<\/text>/<view\1>\2<\/view>/g' {} \; 2>/dev/null
    
    echo "  ✅ WXML标签检查完成"
    
    # 修复2: 检查JS语法
    echo "📜 检查JS语法..."
    if command -v eslint &> /dev/null; then
        eslint pages --fix 2>/dev/null || echo "  ⚠️  ESLint未配置，跳过"
    else
        echo "  ⚠️  ESLint未安装，跳过"
    fi
    
    echo ""
    echo "✅ 修复完成！请重新编译小程序"
    echo "   在微信开发者工具中按 Command+B"
}

# 部署后端
fg-deploy() {
    echo "🚀 部署后端到CloudBase"
    echo "===================="
    
    cd $FG_BACKEND
    
    # 检查环境变量
    if [ -z "$TENCENTCLOUD_SECRET_ID" ]; then
        echo "❌ 缺少环境变量 TENCENTCLOUD_SECRET_ID"
        echo "   请先设置环境变量:"
        echo "   export TENCENTCLOUD_SECRET_ID=your-id"
        echo "   export TENCENTCLOUD_SECRET_KEY=your-key"
        return 1
    fi
    
    echo "📦 安装依赖..."
    npm install
    
    echo "🏗️  构建项目..."
    npm run build
    
    echo "☁️  部署到CloudBase..."
    ./deploy.sh
    
    echo ""
    echo "✅ 部署完成！"
    echo "   等待2-3分钟后测试: fg-status"
}

# 查看日志
fg-log() {
    echo "📋 FireGrid 日志"
    echo "==============="
    echo "选择查看日志:"
    echo "1. 小程序编译日志"
    echo "2. 后端部署日志"
    echo "3. 错误日志"
    
    read -p "选择 (1-3): " choice
    
    case $choice in
        1)
            echo "小程序编译日志需要手动在微信开发者工具查看"
            echo "路径: 调试器 -> Console"
            ;;
        2)
            cd $FG_BACKEND
            cat deploy.log 2>/dev/null || echo "暂无部署日志"
            ;;
        3)
            cat $FG_ROOT/error.log 2>/dev/null || echo "暂无错误日志"
            ;;
        *)
            echo "无效选择"
            ;;
    esac
}

# 打开项目
fg-open() {
    echo "📂 打开FireGrid项目"
    
    # 打开小程序目录
    open $FG_WEIXIN
    
    # 打开后端目录
    open $FG_BACKEND
    
    # 在VS Code中打开（如果安装了code命令）
    if command -v code &> /dev/null; then
        code $FG_ROOT
    fi
    
    echo "✅ 已打开项目目录"
}

# 备份项目
fg-backup() {
    echo "💾 备份FireGrid项目"
    
    backup_dir="$HOME/Documents/firegrid-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $backup_dir
    
    cp -r $FG_WEIXIN $backup_dir/
    cp -r $FG_BACKEND $backup_dir/
    
    echo "✅ 备份完成: $backup_dir"
}

# 重置项目
fg-reset() {
    echo "⚠️  警告: 这将重置项目到Git最后一次提交"
    read -p "确定继续? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        cd $FG_ROOT
        git reset --hard
        git clean -fd
        echo "✅ 项目已重置"
    else
        echo "已取消"
    fi
}

# 查看Agent状态
fg-agents() {
    bash ~/.openclaw/workspace/firegrid/fg-agents.sh "$@"
}

# 自动验证代码
fg-validate() {
    bash ~/.openclaw/workspace/firegrid/agents/auto-validate.sh
}

# 自动修复代码
fg-autofix() {
    node ~/.openclaw/workspace/firegrid/agents/scripts/auto-fix.js
}

# 查看Agent工作流
fg-workflow() {
    bash ~/.openclaw/workspace/firegrid/agents/workflow.sh "$@"
}

# Agent帮助
fg-help() {
    cat << 'EOF'
🔥 FireGrid 快捷命令帮助
====================

📊 状态检查
  fg-status    查看所有服务状态

🔧 错误修复
  fg-fix       一键修复常见错误(WXML标签等)

🚀 部署发布
  fg-deploy    部署后端到CloudBase

📋 日志查看
  fg-log       查看各类日志

📂 项目操作
  fg-open      打开项目目录
  fg-backup    备份项目
  fg-reset     重置项目(⚠️ 危险)

💡 使用示例:
  fg-status    # 检查状态
  fg-fix       # 修复错误
  fg-deploy    # 部署后端

🆘 故障排除:
  1. 小程序报错 → fg-fix → 重新编译
  2. 后端503   → fg-deploy → 等待2分钟
  3. 数据库问题 → 检查Render控制台

EOF
}

# 欢迎信息
fg-help

# 自动扫描项目
fg-scan() {
    case "${1:-run}" in
        run)
            bash ~/.openclaw/workspace/firegrid/agents/auto-scan.sh run
            ;;
        report)
            bash ~/.openclaw/workspace/firegrid/agents/auto-scan.sh report
            ;;
        log)
            bash ~/.openclaw/workspace/firegrid/agents/auto-scan.sh log
            ;;
        install)
            bash ~/.openclaw/workspace/firegrid/agents/auto-scan.sh install
            ;;
        *)
            echo "用法: fg-scan {run|report|log|install}"
            ;;
    esac
}

# 手动执行备份
fg-backup() {
    bash ~/.openclaw/workspace/firegrid/agents/backup.sh
}

# 恢复备份
fg-restore() {
    bash ~/.openclaw/workspace/firegrid/agents/restore.sh "$@"
}

# 查看备份列表
fg-backups() {
    bash ~/.openclaw/workspace/firegrid/agents/restore.sh list
}

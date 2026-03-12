#!/bin/bash
# FireGrid Agent Monitor - 自动监控和修复系统
# 运行方式: nohup ~/.openclaw/workspace/firegrid/agents/agent-monitor.sh &

FG_ROOT="$HOME/.openclaw/workspace/firegrid"
WEIXIN_DIR="$FG_ROOT/firegrid-weixin"
AGENTS_DIR="$FG_ROOT/agents"
LOG_FILE="$AGENTS_DIR/logs/monitor.log"

# 创建日志目录
mkdir -p "$AGENTS_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🤖 Agent Monitor 启动"
log "====================="

# 自动修复WXML错误的函数
auto_fix_wxml() {
    local file="$1"
    log "🔧 自动修复WXML: $file"
    
    # 使用Node.js脚本修复
    node "$AGENTS_DIR/scripts/fix-wxml.js" "$file"
    
    if [ $? -eq 0 ]; then
        log "✅ 修复成功: $file"
        # 发送飞书通知
        notify_feishu "🤖 Agent自动修复" "已自动修复WXML标签错误: $file"
    else
        log "❌ 修复失败: $file"
        notify_feishu "⚠️ Agent修复失败" "WXML错误需要人工处理: $file"
    fi
}

# 飞书通知函数
notify_feishu() {
    local title="$1"
    local content="$2"
    
    # 这里可以集成飞书API
    log "📱 通知: $title - $content"
}

# 检查后端健康状态
check_backend_health() {
    local url="https://firegrid-backend-230828-6-1409174142.sh.run.tcloudbase.com/api/tenders"
    
    if ! curl -s "$url" > /dev/null; then
        log "⚠️ 后端服务异常 (503错误)"
        notify_feishu "🚨 Agent监控告警" "CloudBase后端服务异常，建议执行: fg-deploy"
    fi
}

# 使用fswatch监控文件变化（如果安装了fswatch）
monitor_with_fswatch() {
    if command -v fswatch > /dev/null; then
        log "📁 启动文件监控 (fswatch)"
        
        fswatch -o "$WEIXIN_DIR/pages" | while read -r event; do
            log "📄 检测到文件变化"
            
            # 查找所有wxml文件并检查
            find "$WEIXIN_DIR/pages" -name "*.wxml" -newer "$LOG_FILE" | while read -r file; do
                # 检查是否有标签错误
                if grep -q "<view.*>.*</text>" "$file" 2>/dev/null; then
                    auto_fix_wxml "$file"
                fi
            done
        done
    else
        log "⚠️ fswatch未安装，使用轮询模式"
        monitor_with_polling
    fi
}

# 使用轮询模式监控
monitor_with_polling() {
    log "📁 启动文件监控 (轮询模式，每30秒)"
    
    LAST_CHECK=$(date +%s)
    
    while true; do
        sleep 30
        
        # 检查后端健康（每5分钟）
        CURRENT_TIME=$(date +%s)
        if [ $((CURRENT_TIME - LAST_CHECK)) -ge 300 ]; then
            check_backend_health
            LAST_CHECK=$CURRENT_TIME
        fi
        
        # 检查文件变化
        find "$WEIXIN_DIR/pages" -name "*.wxml" -mtime -0.001 | while read -r file; do
            if grep -q "<view.*>.*</text>" "$file" 2>/dev/null; then
                auto_fix_wxml "$file"
            fi
        done
    done
}

# 主程序
main() {
    log "Agent Team Status: ACTIVE"
    log "Mode: Autonomous"
    log "Auto-fix: ENABLED"
    log ""
    
    # 启动监控
    if command -v fswatch > /dev/null; then
        monitor_with_fswatch
    else
        monitor_with_polling
    fi
}

# 信号处理
trap 'log "Agent Monitor 停止"; exit 0' SIGINT SIGTERM

main "$@"

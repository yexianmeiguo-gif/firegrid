#!/bin/bash
# FireGrid 定时自动扫描系统
# 每小时自动检查代码，发现问题自动修复

FG_ROOT="$HOME/.openclaw/workspace"
WEIXIN_DIR="$FG_ROOT/firegrid-weixin"
AGENTS_DIR="$FG_ROOT/firegrid/agents"
LOG_FILE="$AGENTS_DIR/logs/auto-scan.log"
REPORT_FILE="$AGENTS_DIR/logs/last-scan-report.txt"

# 确保日志目录存在
mkdir -p "$AGENTS_DIR/logs"

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 发送飞书通知（简化版，实际可接入飞书API）
notify_feishu() {
    local message="$1"
    log "📱 通知: $message"
    # 这里可以调用飞书webhook
}

# 主扫描流程
main() {
    log "🤖 定时扫描启动"
    log "===================="
    
    local start_time=$(date +%s)
    local errors_found=0
    local errors_fixed=0
    local warnings=0
    
    # 1. 扫描WXML文件
    log "📄 扫描WXML文件..."
    while IFS= read -r file; do
        # 检查未闭合标签
        if grep -E '<view[^/]*>[^<]*</text>' "$file" > /dev/null 2>&1; then
            log "  ❌ 发现错误: $file"
            ((errors_found++))
            
            # 自动修复
            sed -i '' 's/<view\([^>]*\)>\([^<]*\)<\/text>/<view\1>\2<\/view>/g' "$file"
            log "  🔧 已自动修复"
            ((errors_found++))
        fi
    done < <(find "$WEIXIN_DIR/pages" -name "*.wxml" 2>/dev/null)
    
    # 2. 扫描JS文件
    log "📜 扫描JS文件..."
    while IFS= read -r file; do
        if ! node --check "$file" 2>/dev/null; then
            log "  ❌ JS错误: $file"
            ((errors_found++))
        fi
    done < <(find "$WEIXIN_DIR/pages" -name "*.js" 2>/dev/null)
    
    # 3. 扫描JSON文件
    log "📋 扫描JSON文件..."
    while IFS= read -r file; do
        if ! python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
            log "  ⚠️ JSON格式警告: $file"
            ((warnings++))
        fi
    done < <(find "$WEIXIN_DIR" -name "*.json" 2>/dev/null)
    
    # 计算耗时
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # 生成报告
    local report="🤖 FireGrid 定时扫描报告
================================
扫描时间: $(date '+%Y-%m-%d %H:%M:%S')
扫描耗时: ${duration}秒

扫描结果:
  ❌ 发现错误: $errors_found
  🔧 自动修复: $errors_fixed
  ⚠️  警告: $warnings

详细日志: $LOG_FILE
"

    echo "$report" > "$REPORT_FILE"
    
    log ""
    log "📊 扫描完成:"
    log "  错误: $errors_found"
    log "  修复: $errors_fixed"
    log "  警告: $warnings"
    log "  耗时: ${duration}秒"
    
    # 如果有严重问题，发送通知
    if [ $errors_found -gt 0 ]; then
        notify_feishu "发现 $errors_found 个错误，已自动修复 $errors_fixed 个"
    fi
    
    log "===================="
    log ""
}

# 根据参数执行
case "${1:-run}" in
    run)
        main
        ;;
    report)
        cat "$REPORT_FILE" 2>/dev/null || echo "暂无报告"
        ;;
    log)
        tail -50 "$LOG_FILE"
        ;;
    install)
        # 安装定时任务（每30分钟运行一次）
        cron_job="*/30 * * * * $AGENTS_DIR/auto-scan.sh run > /dev/null 2>&1"
        
        # 检查是否已安装
        if crontab -l 2>/dev/null | grep -q "auto-scan.sh"; then
            echo "定时任务已存在"
        else
            (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
            echo "✅ 定时任务已安装（每30分钟扫描一次）"
        fi
        ;;
    uninstall)
        # 卸载定时任务
        crontab -l 2>/dev/null | grep -v "auto-scan.sh" | crontab -
        echo "✅ 定时任务已卸载"
        ;;
    *)
        echo "用法: $0 {run|report|log|install|uninstall}"
        ;;
esac

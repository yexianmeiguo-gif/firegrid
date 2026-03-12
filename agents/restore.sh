#!/bin/bash
# FireGrid 备份恢复系统
# 从备份恢复所有设置和工作文件

BACKUP_ROOT="$HOME/Documents/FireGrid-Backups"
OPENCLAW_ROOT="$HOME/.openclaw"
WORKSPACE="$OPENCLAW_ROOT/workspace"

# 显示帮助
show_help() {
    echo "🤖 FireGrid 备份恢复系统"
    echo "========================="
    echo ""
    echo "用法:"
    echo "  $0 list              - 列出所有备份"
    echo "  $0 latest            - 恢复到最新备份"
    echo "  $0 restore <日期>    - 恢复到指定备份 (如: 20260309_030000)"
    echo "  $0 preview <日期>    - 预览备份内容"
    echo ""
    echo "示例:"
    echo "  $0 list              # 查看所有备份"
    echo "  $0 latest            # 恢复最新备份"
    echo "  $0 restore 20260309_030000  # 恢复到指定日期"
    echo ""
}

# 列出所有备份
list_backups() {
    echo "📦 可用的备份列表:"
    echo "=================="
    echo ""
    
    if [ ! -d "$BACKUP_ROOT" ]; then
        echo "❌ 备份目录不存在"
        return 1
    fi
    
    local count=0
    for backup in "$BACKUP_ROOT"/backup_*; do
        if [ -d "$backup" ]; then
            local name=$(basename "$backup")
            local date=$(echo "$name" | sed 's/backup_//' | sed 's/_/ /' | sed 's/\(........\)/\1 /')
            local size=$(du -sh "$backup" 2>/dev/null | cut -f1)
            local files=$(find "$backup" -type f 2>/dev/null | wc -l)
            
            if [ $count -eq 0 ]; then
                echo "  ⭐ $name (最新) - $size - $files 个文件"
            else
                echo "     $name - $size - $files 个文件"
            fi
            ((count++))
        fi
    done
    
    if [ $count -eq 0 ]; then
        echo "  ❌ 没有找到备份"
    else
        echo ""
        echo "共找到 $count 个备份"
    fi
}

# 预览备份内容
preview_backup() {
    local backup_date="$1"
    local backup_dir="$BACKUP_ROOT/backup_$backup_date"
    
    if [ ! -d "$backup_dir" ]; then
        echo "❌ 备份不存在: $backup_date"
        return 1
    fi
    
    echo "🔍 备份预览: $backup_date"
    echo "========================"
    echo ""
    
    if [ -f "$backup_dir/backup-manifest.txt" ]; then
        cat "$backup_dir/backup-manifest.txt"
    else
        echo "备份内容:"
        find "$backup_dir" -type f | head -20
        echo "... (共 $(find "$backup_dir" -type f | wc -l) 个文件)"
    fi
}

# 恢复备份
restore_backup() {
    local backup_date="$1"
    local backup_dir="$BACKUP_ROOT/backup_$backup_date"
    
    if [ ! -d "$backup_dir" ]; then
        echo "❌ 备份不存在: $backup_date"
        echo ""
        echo "可用备份:"
        list_backups
        return 1
    fi
    
    echo "⚠️  警告: 恢复备份将覆盖当前所有文件！"
    echo ""
    echo "备份信息:"
    echo "  版本: $backup_date"
    echo "  位置: $backup_dir"
    echo "  大小: $(du -sh "$backup_dir" | cut -f1)"
    echo ""
    
    read -p "确定要恢复吗？输入 'YES' 确认: " confirm
    
    if [ "$confirm" != "YES" ]; then
        echo "❌ 已取消恢复"
        return 1
    fi
    
    echo ""
    echo "🔄 开始恢复..."
    echo "================"
    
    # 创建当前状态的临时备份（以防万一）
    local temp_backup="$BACKUP_ROOT/temp_before_restore_$(date +%Y%m%d_%H%M%S)"
    echo "📦 创建临时备份..."
    cp -r "$OPENCLAW_ROOT" "$temp_backup" 2>/dev/null || true
    echo "  ✅ 临时备份已创建: $temp_backup"
    echo ""
    
    # 恢复 OpenClaw 配置
    echo "📋 恢复 OpenClaw 配置..."
    if [ -d "$backup_dir/openclaw" ]; then
        rm -rf "$OPENCLAW_ROOT"
        cp -r "$backup_dir/openclaw/.openclaw" "$OPENCLAW_ROOT" 2>/dev/null || \
        cp -r "$backup_dir/openclaw" "$OPENCLAW_ROOT" 2>/dev/null
        echo "  ✅ OpenClaw 配置已恢复"
    fi
    
    # 恢复 FireGrid 项目
    echo "📁 恢复 FireGrid 项目..."
    if [ -d "$backup_dir/firegrid-weixin" ]; then
        rm -rf "$WORKSPACE/firegrid-weixin"
        cp -r "$backup_dir/firegrid-weixin" "$WORKSPACE/"
        echo "  ✅ firegrid-weixin 已恢复"
    fi
    
    if [ -d "$backup_dir/firegrid" ]; then
        rm -rf "$WORKSPACE/firegrid"
        cp -r "$backup_dir/firegrid" "$WORKSPACE/"
        echo "  ✅ firegrid 配置已恢复"
    fi
    
    # 恢复 memory 文件
    echo "🧠 恢复记忆文件..."
    if [ -d "$backup_dir/memory" ]; then
        rm -rf "$WORKSPACE/memory"
        cp -r "$backup_dir/memory" "$WORKSPACE/"
        echo "  ✅ memory 已恢复"
    fi
    
    # 恢复核心配置文件
    echo "⚙️  恢复核心配置文件..."
    for file in AGENTS.md SOUL.md USER.md MEMORY.md TOOLS.md; do
        if [ -f "$backup_dir/$file" ]; then
            cp "$backup_dir/$file" "$WORKSPACE/"
            echo "  ✅ $file 已恢复"
        fi
    done
    
    echo ""
    echo "✅ 恢复完成！"
    echo "================"
    echo ""
    echo "📌 重要提示:"
    echo "  1. 请重启 OpenClaw 以应用配置更改:"
    echo "     openclaw gateway restart"
    echo ""
    echo "  2. 如果恢复后有问题，可以恢复到临时备份:"
    echo "     $0 restore $(basename $temp_backup | sed 's/temp_before_restore_//')"
    echo ""
}

# 恢复到最新备份
restore_latest() {
    local latest_link="$BACKUP_ROOT/latest"
    
    if [ ! -L "$latest_link" ] || [ ! -d "$latest_link" ]; then
        echo "❌ 没有找到最新备份链接"
        echo ""
        echo "可用备份:"
        list_backups
        return 1
    fi
    
    local latest_dir=$(readlink "$latest_link")
    local backup_date=$(basename "$latest_dir" | sed 's/backup_//')
    
    echo "🔄 恢复到最新备份: $backup_date"
    restore_backup "$backup_date"
}

# 主程序
case "${1:-help}" in
    list|ls)
        list_backups
        ;;
    preview|show)
        if [ -z "$2" ]; then
            echo "❌ 请指定备份日期"
            echo "用法: $0 preview <日期>"
            exit 1
        fi
        preview_backup "$2"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "❌ 请指定备份日期"
            echo "用法: $0 restore <日期>"
            exit 1
        fi
        restore_backup "$2"
        ;;
    latest)
        restore_latest
        ;;
    help|--help|-h|*)
        show_help
        ;;
esac

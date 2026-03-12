#!/bin/bash
# FireGrid 每日自动备份系统
# 每天凌晨3点自动备份所有设置和工作文件

BACKUP_ROOT="$HOME/Documents/FireGrid-Backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/backup_$DATE"
LOG_FILE="$BACKUP_ROOT/backup.log"
LATEST_LINK="$BACKUP_ROOT/latest"

# 要备份的目录和文件
OPENCLAW_ROOT="$HOME/.openclaw"
WORKSPACE="$OPENCLAW_ROOT/workspace"

# 创建备份目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/openclaw"
mkdir -p "$BACKUP_DIR/configs"

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🤖 FireGrid 自动备份启动"
log "======================="
log "备份时间: $(date)"
log "备份位置: $BACKUP_DIR"
log ""

# 1. 备份 OpenClaw 配置文件
log "📋 步骤1/6: 备份 OpenClaw 配置..."
if [ -d "$OPENCLAW_ROOT" ]; then
    # 备份主配置
    cp -r "$OPENCLAW_ROOT" "$BACKUP_DIR/openclaw/" 2>/dev/null || true
    log "  ✅ OpenClaw 目录已备份"
else
    log "  ⚠️  OpenClaw 目录不存在"
fi

# 2. 备份 FireGrid 项目文件
log "📁 步骤2/6: 备份 FireGrid 项目..."
if [ -d "$WORKSPACE/firegrid-weixin" ]; then
    cp -r "$WORKSPACE/firegrid-weixin" "$BACKUP_DIR/"
    log "  ✅ firegrid-weixin 已备份"
else
    log "  ⚠️  firegrid-weixin 不存在"
fi

if [ -d "$WORKSPACE/firegrid" ]; then
    cp -r "$WORKSPACE/firegrid" "$BACKUP_DIR/"
    log "  ✅ firegrid 配置已备份"
else
    log "  ⚠️  firegrid 配置不存在"
fi

# 3. 备份 memory 文件
log "🧠 步骤3/6: 备份记忆文件..."
if [ -d "$WORKSPACE/memory" ]; then
    cp -r "$WORKSPACE/memory" "$BACKUP_DIR/"
    log "  ✅ memory 已备份"
fi

# 4. 备份核心配置文件
log "⚙️  步骤4/6: 备份核心配置文件..."

# 备份 AGENTS.md
if [ -f "$WORKSPACE/AGENTS.md" ]; then
    cp "$WORKSPACE/AGENTS.md" "$BACKUP_DIR/"
    log "  ✅ AGENTS.md 已备份"
fi

# 备份 SOUL.md
if [ -f "$WORKSPACE/SOUL.md" ]; then
    cp "$WORKSPACE/SOUL.md" "$BACKUP_DIR/"
    log "  ✅ SOUL.md 已备份"
fi

# 备份 USER.md
if [ -f "$WORKSPACE/USER.md" ]; then
    cp "$WORKSPACE/USER.md" "$BACKUP_DIR/"
    log "  ✅ USER.md 已备份"
fi

# 备份 MEMORY.md
if [ -f "$WORKSPACE/MEMORY.md" ]; then
    cp "$WORKSPACE/MEMORY.md" "$BACKUP_DIR/"
    log "  ✅ MEMORY.md 已备份"
fi

# 备份 TOOLS.md
if [ -f "$WORKSPACE/TOOLS.md" ]; then
    cp "$WORKSPACE/TOOLS.md" "$BACKUP_DIR/"
    log "  ✅ TOOLS.md 已备份"
fi

# 5. 备份快捷命令
log "🔧 步骤5/6: 备份快捷命令..."
if [ -f "$WORKSPACE/firegrid/fg-commands.sh" ]; then
    cp "$WORKSPACE/firegrid/fg-commands.sh" "$BACKUP_DIR/configs/"
    log "  ✅ fg-commands.sh 已备份"
fi

# 备份 Agent 配置
if [ -d "$WORKSPACE/firegrid/agents" ]; then
    cp -r "$WORKSPACE/firegrid/agents" "$BACKUP_DIR/configs/"
    log "  ✅ agents 配置已备份"
fi

# 6. 生成备份清单
log "📄 步骤6/6: 生成备份清单..."
cat > "$BACKUP_DIR/backup-manifest.txt" << EOF
FireGrid 备份清单
==================
备份时间: $(date)
备份版本: $DATE

包含内容:
  ✅ OpenClaw 完整配置
  ✅ FireGrid 小程序项目
  ✅ FireGrid Agent 配置
  ✅ 所有记忆文件 (memory/)
  ✅ 核心配置文件 (*.md)
  ✅ 快捷命令脚本
  ✅ 自动化脚本

备份大小: $(du -sh "$BACKUP_DIR" | cut -f1)
文件数量: $(find "$BACKUP_DIR" -type f | wc -l)

恢复方法:
  运行: bash $BACKUP_ROOT/restore.sh $DATE

EOF

log "  ✅ 备份清单已生成"

# 创建 latest 软链接
rm -f "$LATEST_LINK"
ln -s "$BACKUP_DIR" "$LATEST_LINK"
log "  ✅ 最新备份链接已更新"

# 计算备份大小
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

log ""
log "📊 备份统计:"
log "  备份版本: $DATE"
log "  备份大小: $BACKUP_SIZE"
log "  文件数量: $FILE_COUNT"
log "  备份位置: $BACKUP_DIR"
log ""

# 清理旧备份（保留最近30天）
log "🧹 清理旧备份..."
find "$BACKUP_ROOT" -name "backup_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
log "  ✅ 已清理30天前的旧备份"

# 发送通知
log "📱 发送完成通知..."
log "  ✅ 备份完成！"
log "======================="
log ""

# 输出到控制台（如果手动运行）
echo ""
echo "✅ FireGrid 自动备份完成！"
echo "备份版本: $DATE"
echo "备份大小: $BACKUP_SIZE"
echo "备份位置: $BACKUP_DIR"
echo ""
echo "💡 恢复方法:"
echo "  fg-restore $DATE"
echo ""

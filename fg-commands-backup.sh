
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

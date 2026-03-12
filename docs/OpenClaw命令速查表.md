# 🔥 OpenClaw 常用命令速查表

> 保存在飞书，随时查阅！

---

## 🚀 快速启动

```bash
# 启动 OpenClaw
openclaw gateway start

# 停止 OpenClaw
openclaw gateway stop

# 重启 OpenClaw
openclaw gateway restart

# 查看状态
openclaw status
```

---

## 🔥 FireGrid 项目命令

### 一键修复
```bash
fg-fix           # 自动修复所有代码错误
fg-autofix       # 同上
```

### 自动验证
```bash
fg-validate      # 验证所有代码
fg-scan          # 扫描项目错误
fg-scan report   # 查看扫描报告
fg-scan log      # 查看扫描日志
```

### 备份恢复
```bash
fg-backup              # 立即手动备份
fg-backups             # 查看所有备份
fg-restore latest      # 恢复到最新备份
fg-restore 20260309    # 恢复到指定日期
```

### Agent 管理
```bash
fg-agents start        # 启动 Agent 团队
fg-agents status       # 查看 Agent 状态
fg-agents stop         # 停止 Agent 团队
fg-workflow full "任务" # 执行完整工作流
```

### 快捷操作
```bash
fg-status        # 查看项目状态
fg-deploy        # 部署后端到 CloudBase
fg-log           # 查看日志
fg-open          # 打开项目目录
```

---

## 📝 常用工具命令

### 文件操作
```bash
# 查看当前目录
pwd

# 列出文件
ls
ls -la           # 详细列表

# 切换目录
cd 目录名
cd ..            # 返回上级
cd ~             # 返回 home 目录

# 创建目录
mkdir 目录名

# 创建文件
touch 文件名

# 查看文件内容
cat 文件名

# 编辑文件
nano 文件名
# 或
code 文件名      # 用 VS Code 打开
```

### Git 操作
```bash
# 查看状态
git status

# 添加文件到暂存区
git add .
git add 文件名

# 提交更改
git commit -m "提交说明"

# 推送到远程
git push

# 拉取最新代码
git pull

# 查看提交历史
git log --oneline
```

### Node.js/npm
```bash
# 安装依赖
npm install

# 运行项目
npm start
npm run dev

# 构建项目
npm run build

# 运行测试
npm test
```

---

## 🔧 系统命令

### 进程管理
```bash
# 查看运行的进程
ps aux | grep openclaw

# 结束进程
kill 进程号
killall 进程名

# 强制结束
kill -9 进程号
```

### 网络相关
```bash
# 测试网络连接
ping www.baidu.com

# 查看网络配置
ifconfig

# 查看端口占用
lsof -i :8080
```

### 磁盘管理
```bash
# 查看磁盘空间
df -h

# 查看目录大小
du -sh 目录名

# 查看当前目录大小
du -sh .
```

---

## 💡 实用技巧

### 快捷键
```bash
Ctrl + C         # 终止当前命令
Ctrl + Z         # 暂停当前命令
Ctrl + L         # 清屏
Tab              # 自动补全
↑ / ↓            # 查看历史命令
Ctrl + R         # 搜索历史命令
```

### 命令别名（已配置）
```bash
fg-fix           # 修复代码
fg-validate      # 验证代码
fg-backup        # 备份项目
fg-restore       # 恢复备份
fg-scan          # 扫描项目
fg-status        # 查看状态
fg-deploy        # 部署后端
fg-agents        # Agent 管理
```

### 路径快捷
```bash
~                # Home 目录
.                # 当前目录
..               # 上级目录
-                # 上次所在的目录
```

---

## 🆘 故障排除

### OpenClaw 无法启动
```bash
# 检查端口占用
lsof -i :8080

# 强制重启
pkill openclaw
openclaw gateway start

# 查看详细错误
openclaw gateway start --verbose
```

### 权限问题
```bash
# 给文件执行权限
chmod +x 文件名

# 给目录读写权限
chmod -R 755 目录名

# 使用 sudo（谨慎）
sudo 命令
```

### 清理缓存
```bash
# 清理 npm 缓存
npm cache clean --force

# 清理系统缓存
sudo purge
```

---

## 📚 学习资源

```bash
# 查看命令帮助
命令 --help
命令 -h
man 命令

# 查看 OpenClaw 文档
cat ~/.openclaw/docs/README.md

# 查看项目文档
cat ~/.openclaw/workspace/firegrid/docs/*.md
```

---

## 📝 备忘录

**最常用的10个命令：**
1. `fg-fix` - 修复代码
2. `fg-backup` - 备份项目
3. `fg-restore latest` - 恢复备份
4. `openclaw gateway restart` - 重启服务
5. `git add . && git commit -m "xxx"` - 提交代码
6. `cd ~/.openclaw/workspace/firegrid` - 进入项目
7. `ls -la` - 查看文件
8. `cat 文件名` - 查看内容
9. `pwd` - 查看当前路径
10. `fg-status` - 查看状态

---

**遇到问题？**
- 截图终端报错
- 发给我
- 我来帮你解决！

---

最后更新：2026-03-09  
版本：v1.0

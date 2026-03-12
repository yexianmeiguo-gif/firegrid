#!/bin/bash
# FireGrid Multi-Agent 启动器
# 一键启动Agent团队协作

FG_ROOT="$HOME/.openclaw/workspace/firegrid"
AGENTS_DIR="$FG_ROOT/agents"

echo "🤖 FireGrid 多Agent系统启动器"
echo "=============================="
echo ""

# 显示菜单
show_menu() {
    echo "请选择操作："
    echo ""
    echo "1. 🚀 启动完整Agent团队 (推荐)"
    echo "   - 规划Agent + 开发Agent + 测试Agent + 部署Agent"
    echo ""
    echo "2. 👨‍💻 仅启动开发Agent"
    echo "   - 只负责写代码"
    echo ""
    echo "3. 🧪 仅启动测试Agent"
    echo "   - 只负责测试验证"
    echo ""
    echo "4. 📊 查看Agent工作状态"
    echo "   - 查看当前Agent运行情况"
    echo ""
    echo "5. ⏹️  停止所有Agent"
    echo ""
    echo "6. ❓ 查看帮助"
    echo ""
}

# 启动完整Agent团队
start_full_team() {
    echo "🚀 启动完整Agent团队..."
    echo ""
    
    # 创建任务看板
    mkdir -p "$AGENTS_DIR/tasks"
    cat > "$AGENTS_DIR/tasks/current.yaml" << 'EOF'
team: FireGrid Development Team
started_at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
status: active

agents:
  - name: Planner
    role: 规划Agent
    status: idle
    last_action: null
    
  - name: Developer
    role: 开发Agent
    status: idle
    last_action: null
    
  - name: Tester
    role: 测试Agent
    status: idle
    last_action: null
    
  - name: Deployer
    role: 部署Agent
    status: idle
    last_action: null

tasks: []
logs: []
EOF
    
    echo "✅ Agent团队已启动"
    echo ""
    echo "当前团队配置："
    echo "  🎯 规划Agent - 负责需求分析和任务拆解"
    echo "  💻 开发Agent - 负责编写代码"
    echo "  🧪 测试Agent - 负责测试验证"
    echo "  🚀 部署Agent - 负责部署上线"
    echo ""
    echo "💡 使用方法："
    echo "  1. 在飞书告诉我你的需求"
    echo "  2. Agent团队自动工作"
    echo "  3. 完成后飞书通知你"
    echo ""
    echo "📊 查看状态: fg-agents status"
}

# 查看Agent状态
show_status() {
    echo "📊 Agent工作状态"
    echo "================"
    echo ""
    
    if [ -f "$AGENTS_DIR/tasks/current.yaml" ]; then
        echo "✅ Agent团队运行中"
        echo ""
        echo "当前任务："
        cat "$AGENTS_DIR/tasks/current.yaml" | grep -E "(team:|status:|agents:)" | head -10
    else
        echo "⚠️  Agent团队未启动"
        echo "   运行: fg-agents start"
    fi
}

# 停止所有Agent
stop_agents() {
    echo "⏹️  停止所有Agent..."
    
    if [ -f "$AGENTS_DIR/tasks/current.yaml" ]; then
        mv "$AGENTS_DIR/tasks/current.yaml" "$AGENTS_DIR/tasks/archived-$(date +%Y%m%d-%H%M%S).yaml"
        echo "✅ Agent团队已停止"
    else
        echo "⚠️  没有运行中的Agent"
    fi
}

# 主逻辑
case "${1:-menu}" in
    start|1)
        start_full_team
        ;;
    status|4)
        show_status
        ;;
    stop|5)
        stop_agents
        ;;
    help|6)
        show_menu
        ;;
    *)
        show_menu
        read -p "选择 (1-6): " choice
        case $choice in
            1) start_full_team ;;
            4) show_status ;;
            5) stop_agents ;;
            *) show_menu ;;
        esac
        ;;
esac

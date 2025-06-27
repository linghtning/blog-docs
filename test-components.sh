#!/bin/bash

# UI组件测试脚本
# 这个脚本会启动开发服务器，让您可以在浏览器中测试UI组件

echo "🧪 启动UI组件测试环境..."
echo "============================================"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    pnpm install
fi

echo "🚀 启动开发服务器..."
echo "组件测试页面将在以下地址可用："
echo "主页面: http://localhost:3000"
echo "组件测试页面: http://localhost:3000/components-test"
echo ""
echo "✨ 在组件测试页面您可以验证："
echo "  • Button 组件的所有变体和状态"
echo "  • Input 组件的不同类型和验证"
echo "  • Card 组件的样式和布局"
echo "  • 组件之间的交互和组合"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "============================================"

# 启动开发服务器
pnpm dev

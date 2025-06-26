#!/bin/bash

echo "🐳 启动博客平台开发环境..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "✅ Docker 已运行"

# 启动开发环境
echo "🚀 启动开发服务..."
docker compose -f docker-compose.dev.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker compose -f docker-compose.dev.yml ps

# 验证 MySQL 连接
echo "🔍 验证 MySQL 连接..."
docker exec blog-mysql-dev mysql -u bloguser -pblogpassword -e "SELECT 'MySQL 连接成功' as status;"

# 验证 Redis 连接
echo "🔍 验证 Redis 连接..."
docker exec blog-redis-dev redis-cli ping

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📋 服务访问地址："
echo "  • MySQL: localhost:3306"
echo "  • Redis: localhost:6379"
echo "  • Adminer (数据库管理): http://localhost:8080"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "📋 数据库连接信息："
echo "  • 主机: localhost"
echo "  • 端口: 3306"
echo "  • 数据库: blog_platform"
echo "  • 用户名: bloguser"
echo "  • 密码: blogpassword"
echo ""
echo "🛑 停止服务命令："
echo "  docker compose -f docker-compose.dev.yml down" 
# Docker 开发环境设置指南

## 📋 前置要求

确保您的 macOS 系统满足以下要求：
- macOS 10.15 或更高版本
- 至少 4GB RAM
- 至少 2GB 可用磁盘空间

## 🔧 安装 Docker Desktop

### 方法 1: 使用 Homebrew (推荐)
```bash
# 安装 Docker Desktop
brew install --cask docker

# 启动 Docker Desktop
open /Applications/Docker.app
```

### 方法 2: 手动下载
1. 访问 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. 下载 `.dmg` 文件
3. 拖拽到 Applications 文件夹
4. 启动 Docker Desktop

## 🚀 启动开发环境

### 1. 检查 Docker 安装
```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version
```

### 2. 使用自动化脚本启动
```bash
# 运行启动脚本
./docker-startup.sh
```

### 3. 手动启动步骤
```bash
# 启动所有服务
docker compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 查看服务日志
docker compose -f docker-compose.dev.yml logs
```

## 📊 服务验证

### MySQL 验证
```bash
# 连接测试
docker exec blog-mysql-dev mysql -u bloguser -pblogpassword -e "SELECT 'MySQL 连接成功' as status;"

# 查看数据库
docker exec blog-mysql-dev mysql -u bloguser -pblogpassword -e "SHOW DATABASES;"
```

### Redis 验证
```bash
# Ping 测试
docker exec blog-redis-dev redis-cli ping

# 设置和获取测试
docker exec blog-redis-dev redis-cli set test "hello"
docker exec blog-redis-dev redis-cli get test
```

## 🌐 管理界面访问

### Adminer (数据库管理)
- **地址**: http://localhost:8080
- **服务器**: mysql
- **用户名**: bloguser
- **密码**: blogpassword
- **数据库**: blog_platform

### Redis Commander (Redis 管理)
- **地址**: http://localhost:8081

## 🛠 常用命令

### 启动服务
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 停止服务
```bash
docker compose -f docker-compose.dev.yml down
```

### 重启服务
```bash
docker compose -f docker-compose.dev.yml restart
```

### 查看日志
```bash
# 查看所有服务日志
docker compose -f docker-compose.dev.yml logs

# 查看特定服务日志
docker compose -f docker-compose.dev.yml logs mysql
docker compose -f docker-compose.dev.yml logs redis
```

### 进入容器
```bash
# 进入 MySQL 容器
docker exec -it blog-mysql-dev bash

# 进入 Redis 容器
docker exec -it blog-redis-dev sh
```

## 🔍 故障排除

### Docker Desktop 未启动
```bash
# 检查 Docker 是否运行
docker info

# 如果报错，请确保 Docker Desktop 应用已启动
```

### 端口冲突
如果端口被占用，可以修改 `docker-compose.dev.yml` 中的端口映射：
```yaml
ports:
  - "3307:3306"  # 将 MySQL 端口改为 3307
  - "6380:6379"  # 将 Redis 端口改为 6380
```

### 数据持久化
```bash
# 查看数据卷
docker volume ls

# 删除数据卷（重置数据）
docker compose -f docker-compose.dev.yml down -v
```

## 📋 环境变量配置

创建 `.env.local` 文件（参考 `env.example`）：

```env
# 数据库配置 (Docker 开发环境)
DATABASE_URL="mysql://bloguser:blogpassword@localhost:3306/blog_platform"

# Redis 配置 (Docker 开发环境)
REDIS_URL="redis://localhost:6379"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"

# 其他配置
SITE_URL="http://localhost:3000"
SITE_NAME="博客平台"
```

## ✅ 验证清单

- [ ] Docker Desktop 已安装并运行
- [ ] 所有容器状态为 "running"
- [ ] MySQL 连接测试成功
- [ ] Redis 连接测试成功
- [ ] Adminer 界面可访问
- [ ] Redis Commander 界面可访问
- [ ] 环境变量文件已配置

## 🎯 下一步

环境验证成功后，您可以：

1. **初始化数据库**:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

2. **启动开发服务器**:
   ```bash
   pnpm dev
   ```

3. **运行测试**:
   ```bash
   pnpm test
   ```

## 🆘 获取帮助

如果遇到问题，请检查：
1. Docker Desktop 是否正在运行
2. 端口是否被其他服务占用
3. 系统资源是否充足
4. 防火墙设置是否正确 
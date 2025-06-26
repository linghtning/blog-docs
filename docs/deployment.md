# 博客平台部署指南

## 1. 环境要求

### 1.1 开发环境
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐) 或 **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **Next.js**: >= 14.0.0
- **MySQL**: >= 8.0 (本地或云服务)
- **Redis**: >= 6.0 (可选，用于缓存)
- **Git**: >= 2.30.0

### 1.2 生产环境
- **服务器**: Linux (Ubuntu 20.04+ 推荐)
- **内存**: >= 4GB (推荐 8GB+)
- **存储**: >= 20GB SSD
- **网络**: 稳定的网络连接
- **域名**: 已备案的域名
- **SSL证书**: Let's Encrypt 或商业证书

## 2. 开发环境搭建

### 2.1 克隆项目
```bash
# 克隆代码仓库
git clone https://github.com/your-username/blog-platform.git
cd blog-platform

# 安装依赖
pnpm install
```

### 2.2 数据库配置
```bash
# 安装 MySQL (Ubuntu)
sudo apt update
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 创建数据库
mysql -u root -p
CREATE DATABASE blog_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON blog_dev.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2.3 Redis 配置
```bash
# 安装 Redis (Ubuntu)
sudo apt install redis-server

# 启动 Redis 服务
sudo systemctl start redis
sudo systemctl enable redis

# 测试 Redis 连接
redis-cli ping
```

### 2.4 环境变量配置
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

**Next.js全栈环境变量 (.env.local)**:
```env
# 数据库配置
DATABASE_URL="mysql://blog_user:your_password@localhost:3306/blog_dev"

# Redis 配置 (可选)
REDIS_URL="redis://localhost:6379"

# NextAuth.js 配置
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# 应用配置
NEXT_PUBLIC_APP_NAME=博客平台
NEXT_PUBLIC_APP_VERSION=1.0.0

# 文件上传配置
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# 或使用 Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 开发配置
NODE_ENV=development
```

### 2.5 数据库迁移
```bash
# 初始化 Prisma
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 或使用迁移文件
npx prisma migrate dev --name init

# 运行种子数据
npx prisma db seed
```

### 2.6 启动开发服务器
```bash
# 启动 Next.js 全栈开发服务器
pnpm run dev

# 访问应用
# 前端和API: http://localhost:3000
# API端点: http://localhost:3000/api/*
```

## 3. 生产环境部署

### 3.1 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git unzip

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo pnpm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

### 3.2 数据库部署
```bash
# 安装 MySQL
sudo apt install -y mysql-server

# 安全配置
sudo mysql_secure_installation

# 创建生产数据库
mysql -u root -p
CREATE DATABASE blog_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog_prod'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON blog_prod.* TO 'blog_prod'@'localhost';
FLUSH PRIVILEGES;
```

### 3.3 应用部署
```bash
# 克隆项目到服务器
cd /var/www
sudo git clone https://github.com/your-username/blog-platform.git
sudo chown -R $USER:$USER blog-platform
cd blog-platform

# 安装后端依赖
cd backend
pnpm install --production

# 构建后端
pnpm run build

# 配置生产环境变量
cp .env.example .env.production
vim .env.production

# 注意：Next.js前端将部署到Vercel
```

**生产环境变量**:
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blog_prod
DB_USER=blog_prod
DB_PASSWORD=strong_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=very_strong_jwt_secret
JWT_EXPIRES_IN=7d

# 应用配置
PORT=3000
NODE_ENV=production
API_BASE_URL=https://yourdomain.com
```

### 3.4 PM2 配置
**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'blog-api',
    script: './backend/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    max_memory_restart: '1G'
  }]
};
```

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置 PM2 开机启动
pm2 startup
```

### 3.5 Nginx 配置
**/etc/nginx/sites-available/blog-platform**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态文件
    location / {
        root /var/www/blog-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 文件上传
    location /uploads {
        alias /var/www/blog-platform/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/blog-platform /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 3.6 SSL 证书
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 4. Next.js全栈部署

### 4.1 Vercel部署 (推荐)
```bash
# 安装Vercel CLI
pnpm i -g vercel

# 执行部署
vercel

# 配置环境变量
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add UPLOADTHING_SECRET
vercel env add UPLOADTHING_APP_ID

# 配置数据库连接 (推荐使用云数据库)
# PlanetScale, Railway, Neon 等

# 重新部署
vercel --prod
```

### 4.2 自托管部署
```bash
# 构建Next.js应用
pnpm run build

# 启动生产服务器
pnpm start

# 或使用PM2管理
pm2 start pnpm --name "blog-app" -- start
```

### 4.3 云数据库配置 (推荐)
```bash
# PlanetScale 配置示例
DATABASE_URL="mysql://[username]:[password]@[host]/[database]?sslaccept=strict"

# Railway 配置示例  
DATABASE_URL="mysql://root:[password]@[host]:[port]/railway"

# Neon 配置示例
DATABASE_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"
```

## 5. Docker 部署 (可选)

### 5.1 Dockerfile
**后端 Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --production

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]
```

**前端 Dockerfile (本地部署可选)**:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

FROM node:18-alpine as runner
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001

CMD ["node", "server.js"]
```

### 5.2 Docker Compose
**docker-compose.yml**:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: blog_prod
      MYSQL_USER: blog_user
      MYSQL_PASSWORD: userpassword
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on:
      - mysql
      - redis
    environment:
      DB_HOST: mysql
      REDIS_HOST: redis
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

```bash
# 使用 Docker Compose 部署
docker-compose up -d
```

## 6. 监控和日志

### 6.1 应用监控
```bash
# 安装监控工具
pnpm install -g pm2-logrotate
pm2 install pm2-server-monit

# 查看应用状态
pm2 status
pm2 logs
pm2 monit
```

### 6.2 系统监控
```bash
# 安装 htop
sudo apt install htop

# 查看系统资源
htop
df -h
free -h
```

### 6.3 日志管理
```bash
# 配置 logrotate
sudo vim /etc/logrotate.d/blog-platform

/var/www/blog-platform/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 7. 备份策略

### 7.1 数据库备份
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mysql"
DB_NAME="blog_prod"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u blog_prod -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/blog_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/blog_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: blog_backup_$DATE.sql.gz"
```

### 7.2 文件备份
```bash
#!/bin/bash
# file_backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/files"
SOURCE_DIR="/var/www/blog-platform/backend/uploads"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C $SOURCE_DIR .

# 删除30天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Files backup completed: files_backup_$DATE.tar.gz"
```

### 7.3 自动备份
```bash
# 设置定时任务
sudo crontab -e

# 每天凌晨2点备份数据库
0 2 * * * /path/to/backup.sh

# 每天凌晨3点备份文件
0 3 * * * /path/to/file_backup.sh
```

## 8. 故障排除

### 8.1 常见问题

**问题**: 数据库连接失败
```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql

# 查看 MySQL 错误日志
sudo tail -f /var/log/mysql/error.log

# 测试数据库连接
mysql -u blog_prod -p -h localhost
```

**问题**: 应用无法启动
```bash
# 查看 PM2 日志
pm2 logs blog-api

# 查看详细错误
pm2 logs blog-api --lines 100

# 重启应用
pm2 restart blog-api
```

**问题**: Nginx 配置错误
```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重载配置
sudo systemctl reload nginx
```

### 8.2 性能优化

**数据库优化**:
```sql
-- 添加索引
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author ON posts(author_id);

-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
```

**Redis 优化**:
```bash
# 配置 Redis 内存限制
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 9. 安全加固

### 9.1 服务器安全
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# 禁用 root SSH 登录
sudo vim /etc/ssh/sshd_config
# PermitRootLogin no
sudo systemctl restart sshd
```

### 9.2 应用安全
- 定期更新依赖包
- 使用强密码
- 启用 HTTPS
- 配置 CORS
- 实施输入验证
- 启用日志审计

---

**文档版本**: v1.0  
**最后更新**: 2024年12月  
**负责人**: 运维团队 
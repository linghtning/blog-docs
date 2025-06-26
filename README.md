# 博客产品开发项目

## 项目概述

这是一个现代化的博客平台项目，包含前端用户界面和后端API服务。本项目旨在提供一个功能完善、用户体验优秀的博客发布和管理平台。

## 项目特色

- 🚀 现代化的Next.js全栈架构
- 💼 一体化应用，支持SSR/SSG/API Routes
- 📱 响应式设计，支持多端访问
- 🔐 完善的用户认证和权限管理
- 📝 富文本编辑器支持
- 🏷️ 标签和分类系统
- 💬 评论互动功能
- 🔍 全文搜索功能
- ⚡ 极致的性能优化和SEO支持
- 🎯 一键部署，运维简单

## 文档结构

本项目包含以下核心文档：

### 产品文档
- [产品需求文档 (PRD)](./docs/PRD.md) - 详细的产品功能需求
- [用户故事](./docs/user-stories.md) - 用户使用场景描述

### 技术文档
- [技术栈说明文档](./docs/tech-stack.md) - 技术选型说明和对比分析
- [技术架构文档](./docs/architecture.md) - 整体技术架构设计
- [API设计文档](./docs/api-design.md) - 后端API接口设计
- [数据库设计文档](./docs/database-design.md) - 数据库结构设计
- [前端设计文档](./docs/frontend-design.md) - 前端架构和组件设计
- [Next.js配置文档](./docs/nextjs-config.md) - Next.js项目配置和最佳实践

### 管理文档
- [项目计划](./docs/project-plan.md) - 开发计划和里程碑
- [部署指南](./docs/deployment.md) - 项目部署相关文档

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐包管理器)

### 安装 pnpm (如果尚未安装)
```bash
npm install -g pnpm
# 或者
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 开发环境搭建
```bash
# 1. 克隆项目
git clone <repository-url>
cd blog-platform

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp env.example .env.local

# 4. 启动开发环境 (Docker)
docker-compose -f docker-compose.dev.yml up -d

# 5. 初始化数据库
pnpm run db:generate
pnpm run db:push

# 6. 启动开发服务器
pnpm run dev
```

### 开发命令
- `pnpm run dev` - 启动开发服务器
- `pnpm run build` - 构建生产版本
- `pnpm run start` - 启动生产服务器
- `pnpm run lint` - 代码检查
- `pnpm run test` - 运行测试
- `pnpm run db:studio` - 打开数据库管理界面

### 文档阅读指南
1. 查看 [产品需求文档](./docs/PRD.md) 了解产品功能
2. 阅读 [技术架构文档](./docs/architecture.md) 了解技术选型
3. 按照 [项目计划](./docs/project-plan.md) 开始开发
4. 参考 [开发规范文档](./docs/development-guide.md) 了解开发流程

## 项目状态

🚧 当前处于文档设计阶段，后续将进行代码实现

## 联系方式

如有问题请联系项目维护者。

---

**最后更新时间**: 2024年12月 
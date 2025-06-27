# 第3-4周核心功能开发 - 使用说明

## 🎯 概述

本项目已完成第3-4周的核心功能开发，实现了完整的用户认证系统和用户资料管理功能。

## ✨ 已实现功能

### 用户认证系统
- ✅ 用户注册 (`/auth/register`)
- ✅ 用户登录 (`/auth/login`)
- ✅ 会话管理 (NextAuth.js)
- ✅ 权限控制 (Middleware)
- ✅ 安全防护 (密码加密、速率限制)

### 用户资料管理
- ✅ 个人资料页面 (`/profile`)
- ✅ 资料编辑功能
- ✅ 头像和社交链接管理
- ✅ 用户统计信息

### API接口
- ✅ 用户注册 API (`POST /api/auth/register`)
- ✅ NextAuth 认证 (`/api/auth/[...nextauth]`)
- ✅ 用户资料 API (`GET/PUT /api/users/profile`)

### 安全特性
- ✅ 密码加密存储 (bcrypt)
- ✅ API速率限制
- ✅ 输入验证 (Zod)
- ✅ SQL注入防护

## 🚀 快速开始

### 1. 环境配置

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp env.example .env.local

# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 推送数据库架构
pnpm run db:push

# 生成 Prisma 客户端
pnpm run db:generate
```

### 2. 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:3000 开始使用！

### 3. 运行自动化测试

```bash
# 运行第3-4周功能验证脚本
./test-week3-4.sh
```

## 📚 功能使用指南

### 用户注册

1. 访问 http://localhost:3000/auth/register
2. 填写用户名、邮箱和密码
3. 点击注册按钮
4. 注册成功后会提示跳转到登录页面

**验证规则**:
- 用户名：3-20个字符，只能包含字母、数字、下划线
- 密码：至少6个字符，必须包含字母和数字
- 邮箱：标准邮箱格式

### 用户登录

1. 访问 http://localhost:3000/auth/login
2. 输入邮箱和密码
3. 点击登录按钮
4. 登录成功后会自动跳转到首页

### 个人资料管理

1. 登录后访问 http://localhost:3000/profile
2. 查看个人资料信息
3. 点击"编辑资料"按钮进行修改
4. 填写各项信息并保存

**可编辑项**:
- 用户名
- 个人简介
- 头像URL
- 个人网站
- GitHub用户名
- Twitter用户名
- 所在地
- 公司

## 🔧 API使用示例

### 用户注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 获取用户资料

```javascript
// 需要在登录状态下调用
fetch('/api/users/profile')
  .then(res => res.json())
  .then(data => console.log(data))
```

### 更新用户资料

```javascript
// 需要在登录状态下调用
fetch('/api/users/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'newusername',
    bio: '这是我的新简介'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

## 🛡️ 安全特性

### 密码安全
- 使用 bcrypt 加密存储
- 强制密码复杂度要求
- 登录失败次数限制

### API 保护
- 请求速率限制（注册：每小时5次）
- 输入验证和清理
- SQL注入防护

### 会话管理
- JWT Token 认证
- 安全的会话存储
- 自动会话过期

## 🧪 测试和验证

### 手动测试

1. **注册流程**：访问注册页面，测试各种输入情况
2. **登录流程**：测试正确和错误的登录凭据
3. **资料管理**：测试资料查看和编辑功能
4. **权限控制**：测试未登录时访问受保护页面

### 自动化测试

运行测试脚本：
```bash
./test-week3-4.sh
```

测试内容包括：
- 服务状态检查
- 页面访问测试
- 用户注册功能
- 安全功能验证
- 输入验证测试
- 性能指标测试

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts      # 注册API
│   │   │   └── [...nextauth]/route.ts # NextAuth处理器
│   │   └── users/
│   │       └── profile/route.ts       # 用户资料API
│   ├── auth/
│   │   ├── login/page.tsx            # 登录页面
│   │   └── register/page.tsx         # 注册页面
│   ├── profile/page.tsx              # 个人资料页面
│   └── page.tsx                      # 首页
├── components/
│   ├── layout/
│   │   └── Navbar.tsx                # 导航栏组件
│   ├── providers/
│   │   └── SessionProvider.tsx       # 会话提供器
│   └── ui/                           # UI组件
├── lib/
│   ├── auth.ts                       # NextAuth配置
│   ├── db.ts                         # 数据库连接
│   ├── rate-limit.ts                 # 速率限制
│   └── utils.ts                      # 工具函数
└── middleware.ts                     # 路由中间件
```

## 📋 数据库表结构

### users 表
- id (BigInt, 主键)
- username (String, 唯一)
- email (String, 唯一)
- password_hash (String)
- avatar_url (String, 可选)
- bio (Text, 可选)
- role (Enum: USER/AUTHOR/ADMIN)
- 时间戳字段

### user_profiles 表
- user_id (BigInt, 外键)
- website (String, 可选)
- github (String, 可选)
- twitter (String, 可选)
- location (String, 可选)
- company (String, 可选)
- 统计字段

## 🚨 已知限制

1. **邮箱验证**：暂不支持邮箱验证功能
2. **忘记密码**：暂不支持密码重置功能
3. **第三方登录**：暂不支持社交登录
4. **头像上传**：目前只支持URL形式，不支持文件上传

## 🔄 下一步计划

### 第5-6周：内容管理系统
- 文章编写和发布
- 分类和标签系统
- 文件上传功能
- Markdown编辑器

## 📞 支持和反馈

如遇到问题或需要帮助，请：

1. 查看验证报告：`docs/week3-4-verification-report.md`
2. 参考验证指南：`docs/week3-4-verification-guide.md`
3. 运行测试脚本：`./test-week3-4.sh`

---

**项目版本**: v1.0 (第3-4周完成版)  
**最后更新**: 2024年12月  
**开发团队**: 博客平台项目组 
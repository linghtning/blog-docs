# 开发规范文档

## 1. 开发环境设置

### 1.1 环境要求
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0

### 1.2 本地开发环境搭建

#### 使用 Docker Compose (推荐)
```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 停止开发环境
docker-compose -f docker-compose.dev.yml down
```

#### 手动搭建
```bash
# 1. 克隆项目
git clone <repository-url>
cd blog-platform

# 2. 安装依赖
pnpm install

# 3. 复制环境变量文件
cp env.example .env.local

# 4. 配置数据库连接
# 编辑 .env.local 文件，设置 DATABASE_URL

# 5. 初始化数据库
pnpm run db:migrate
pnpm run db:generate

# 6. 启动开发服务器
pnpm run dev
```

## 2. 代码规范

### 2.1 命名规范

#### 文件和目录命名
- **组件文件**: PascalCase (例: `UserProfile.tsx`)
- **工具文件**: camelCase (例: `utils.ts`)
- **页面文件**: kebab-case (例: `user-profile.tsx`)
- **目录**: kebab-case (例: `user-settings/`)

#### 变量和函数命名
```typescript
// ✅ 正确
const userName = 'john'
const fetchUserData = async () => {}
const isUserActive = true

// ❌ 错误
const user_name = 'john'
const IsUserActive = true
const FetchUserData = async () => {}
```

#### 组件命名
```typescript
// ✅ 正确
export default function UserProfile() {}
export const UserCard = () => {}

// ❌ 错误
export default function userProfile() {}
export const userCard = () => {}
```

### 2.2 代码格式

#### TypeScript 规范
```typescript
// ✅ 正确的接口定义
interface User {
  id: string
  username: string
  email: string
  profile?: UserProfile
}

// ✅ 正确的类型定义
type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// ✅ 正确的函数定义
const createUser = async (data: CreateUserData): Promise<User> => {
  // 实现
}
```

#### React 组件规范
```typescript
// ✅ 正确的组件结构
interface Props {
  user: User
  onUpdate?: (user: User) => void
}

export default function UserProfile({ user, onUpdate }: Props) {
  // Hooks
  const [loading, setLoading] = useState(false)
  
  // 事件处理函数
  const handleSubmit = useCallback(() => {
    // 实现
  }, [])
  
  // 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### 2.3 导入规范

```typescript
// ✅ 正确的导入顺序
// 1. Node.js 内置模块
import fs from 'fs'

// 2. 第三方包
import React from 'react'
import { NextApiRequest, NextApiResponse } from 'next'

// 3. 项目内部模块（绝对路径）
import { prisma } from '@/lib/db'
import { UserProfile } from '@/components/UserProfile'

// 4. 相对路径导入
import './styles.css'
```

## 3. Git 工作流程

### 3.1 分支命名规范
- **主分支**: `main`
- **开发分支**: `develop`
- **功能分支**: `feature/功能名称` (例: `feature/user-authentication`)
- **修复分支**: `fix/修复内容` (例: `fix/login-validation`)
- **发布分支**: `release/版本号` (例: `release/v1.0.0`)

### 3.2 提交消息规范
使用 Conventional Commits 规范：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

#### 类型说明
- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 重构
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动

#### 示例
```
feat(auth): 添加用户登录功能

- 实现邮箱密码登录
- 添加 JWT token 验证
- 集成 NextAuth.js

Closes #123
```

### 3.3 代码提交流程
```bash
# 1. 创建功能分支
git checkout -b feature/user-profile

# 2. 开发功能
# ... 编码 ...

# 3. 提交代码
git add .
git commit -m "feat(profile): 添加用户资料编辑功能"

# 4. 推送分支
git push origin feature/user-profile

# 5. 创建 Pull Request
```

## 4. 测试规范

### 4.1 测试类型
- **单元测试**: 测试单个函数或组件
- **集成测试**: 测试多个模块的交互
- **端到端测试**: 测试完整的用户流程

### 4.2 测试文件结构
```
src/
├── components/
│   ├── UserProfile.tsx
│   └── __tests__/
│       └── UserProfile.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── __tests__/
    └── e2e/
        └── user-flow.spec.ts
```

### 4.3 测试命名规范
```typescript
// ✅ 正确的测试描述
describe('UserProfile 组件', () => {
  it('应该正确显示用户信息', () => {
    // 测试实现
  })
  
  it('当用户更新资料时应该调用 onUpdate 回调', () => {
    // 测试实现
  })
})
```

## 5. API 设计规范

### 5.1 RESTful API 规范
```
GET    /api/users           # 获取用户列表
GET    /api/users/[id]      # 获取单个用户
POST   /api/users           # 创建用户
PUT    /api/users/[id]      # 更新用户
DELETE /api/users/[id]      # 删除用户

GET    /api/posts           # 获取文章列表
GET    /api/posts/[id]      # 获取单个文章
POST   /api/posts           # 创建文章
PUT    /api/posts/[id]      # 更新文章
DELETE /api/posts/[id]      # 删除文章
```

### 5.2 响应格式规范
```typescript
// ✅ 成功响应
{
  "success": true,
  "data": {
    "id": "1",
    "username": "john",
    "email": "john@example.com"
  }
}

// ✅ 错误响应
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "用户不存在"
}

// ✅ 分页响应
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 5.3 错误处理规范
```typescript
// API 路由中的错误处理
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 业务逻辑
    const result = await someOperation()
    
    return res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误'
    })
  }
}
```

## 6. 性能优化规范

### 6.1 Next.js 优化
- 使用 `Image` 组件优化图片
- 合理使用 SSR、SSG 和 ISR
- 代码分割和动态导入
- 优化字体加载

### 6.2 数据库优化
- 合理使用索引
- 避免 N+1 查询
- 使用数据库连接池
- 定期清理过期数据

### 6.3 缓存策略
- Redis 缓存热点数据
- Next.js 内置缓存
- CDN 缓存静态资源
- 浏览器缓存优化

## 7. 安全规范

### 7.1 输入验证
```typescript
import { z } from 'zod'

const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8)
})

// 在 API 路由中验证
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = userSchema.safeParse(req.body)
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: '输入数据无效'
    })
  }
}
```

### 7.2 认证和授权
- 使用 NextAuth.js 统一认证
- JWT token 安全存储
- 角色权限控制
- API 路由保护

### 7.3 数据安全
- 密码 bcrypt 加密
- 防止 SQL 注入（使用 Prisma）
- XSS 防护
- CSRF 保护

## 8. 部署规范

### 8.1 环境配置
- **开发环境**: 本地开发和测试
- **预览环境**: PR 自动部署预览
- **生产环境**: 正式线上环境

### 8.2 部署流程
1. 代码提交到 GitHub
2. 自动运行 CI/CD 流水线
3. 通过所有测试和检查
4. 自动部署到对应环境

### 8.3 监控和日志
- 应用性能监控
- 错误日志收集
- 用户行为分析
- 系统资源监控

## 9. 文档规范

### 9.1 代码注释
```typescript
/**
 * 计算文章阅读时间
 * @param content 文章内容
 * @returns 预计阅读时间（分钟）
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}
```

### 9.2 API 文档
每个 API 端点都应该有详细的文档说明：
- 请求方法和路径
- 请求参数
- 响应格式
- 错误码说明
- 使用示例

### 9.3 README 更新
项目 README 应该包含：
- 项目简介
- 安装和运行指南
- 技术栈说明
- 贡献指南
- 许可证信息

## 10. 代码审查规范

### 10.1 Pull Request 规范
- 标题清晰描述变更内容
- 详细的描述和变更说明
- 关联相关的 Issue
- 添加必要的截图或演示

### 10.2 审查要点
- 代码质量和规范
- 功能实现的正确性
- 性能影响评估
- 安全问题检查
- 测试覆盖率

### 10.3 审查流程
1. 创建 Pull Request
2. 自动化检查通过
3. 至少一人代码审查
4. 解决所有评论和问题
5. 合并到目标分支 
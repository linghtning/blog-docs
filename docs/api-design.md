# 博客平台API设计文档 (Next.js API Routes)

## 1. API概述

### 1.1 基本信息
- **Base URL**: `https://yourblog.vercel.app/api`
- **协议**: HTTPS
- **数据格式**: JSON
- **认证方式**: NextAuth.js Session + API Key
- **实现方式**: Next.js API Routes

### 1.2 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "code": 200,
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### 1.3 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": []
  },
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### 1.4 状态码说明
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `429`: 请求频率限制
- `500`: 服务器内部错误

### 1.5 API Routes实现示例
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // 业务逻辑处理
    const posts = await getPosts()
    
    return NextResponse.json({
      success: true,
      data: posts
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}
```

## 2. 认证接口 (NextAuth.js)

### 2.1 认证提供者配置
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        // 验证用户逻辑
        const user = await verifyUser(credentials)
        return user || null
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signUp: '/register'
  }
}
```

### 2.2 用户注册
**API Route实现**
```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    })
    
    return NextResponse.json({
      success: true,
      data: { user: { id: user.id, username, email } }
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { message: 'Registration failed' }
    }, { status: 400 })
  }
}
```

**请求**
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "avatar_url": null,
      "bio": null,
      "created_at": "2024-12-01T10:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
  }
}
```

### 2.2 用户登录
**请求**
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "技术博客作者"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
  }
}
```

### 2.3 刷新Token
**请求**
```
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.4 用户登出
**请求**
```
POST /auth/logout
Authorization: Bearer {access_token}
```

## 3. 用户管理接口

### 3.1 获取用户信息
**请求**
```
GET /users/me
Authorization: Bearer {access_token}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "技术博客作者",
    "posts_count": 15,
    "followers_count": 120,
    "following_count": 45,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
}
```

### 3.2 更新用户信息
**请求**
```
PUT /users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "johndoe_new",
  "bio": "更新后的个人简介",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### 3.3 修改密码
**请求**
```
PUT /users/me/password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

## 4. 文章管理接口

### 4.1 获取文章列表
**请求**
```
GET /posts?page=1&limit=10&category=tech&sort=created_at&order=desc
```

**查询参数**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10, 最大: 50)
- `category`: 分类ID
- `tag`: 标签名
- `author`: 作者ID
- `sort`: 排序字段 (created_at, updated_at, views)
- `order`: 排序方向 (asc, desc)
- `status`: 文章状态 (published, draft) - 需要权限

**响应**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "React 18新特性详解",
        "summary": "详细介绍React 18的新特性...",
        "content": "...",
        "status": "published",
        "author": {
          "id": 1,
          "username": "johndoe",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "category": {
          "id": 1,
          "name": "技术"
        },
        "tags": ["React", "JavaScript", "前端"],
        "views": 1250,
        "likes_count": 45,
        "comments_count": 12,
        "created_at": "2024-12-01T10:00:00Z",
        "updated_at": "2024-12-01T12:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_count": 95,
      "per_page": 10
    }
  }
}
```

### 4.2 获取文章详情
**请求**
```
GET /posts/{id}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "React 18新特性详解",
    "content": "# React 18新特性详解\n\n内容...",
    "summary": "详细介绍React 18的新特性...",
    "status": "published",
    "author": {
      "id": 1,
      "username": "johndoe",
      "avatar_url": "https://example.com/avatar.jpg",
      "bio": "技术博客作者"
    },
    "category": {
      "id": 1,
      "name": "技术",
      "description": "技术相关文章"
    },
    "tags": ["React", "JavaScript", "前端"],
    "views": 1250,
    "likes_count": 45,
    "comments_count": 12,
    "related_posts": [
      {
        "id": 2,
        "title": "Vue 3组合式API入门",
        "summary": "..."
      }
    ],
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T12:00:00Z"
  }
}
```

### 4.3 创建文章
**请求**
```
POST /posts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "新文章标题",
  "content": "# 新文章\n\n这是内容...",
  "summary": "文章摘要",
  "category_id": 1,
  "tags": ["JavaScript", "教程"],
  "status": "draft"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "新文章标题",
    "content": "# 新文章\n\n这是内容...",
    "summary": "文章摘要",
    "status": "draft",
    "author_id": 1,
    "category_id": 1,
    "tags": ["JavaScript", "教程"],
    "views": 0,
    "created_at": "2024-12-01T15:00:00Z",
    "updated_at": "2024-12-01T15:00:00Z"
  }
}
```

### 4.4 更新文章
**请求**
```
PUT /posts/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "更新的文章标题",
  "content": "更新的内容...",
  "summary": "更新的摘要",
  "category_id": 2,
  "tags": ["JavaScript", "React", "更新"],
  "status": "published"
}
```

### 4.5 删除文章
**请求**
```
DELETE /posts/{id}
Authorization: Bearer {access_token}
```

## 5. 分类和标签接口

### 5.1 获取分类列表
**请求**
```
GET /categories
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "description": "技术相关文章",
      "posts_count": 25,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### 5.2 获取标签列表
**请求**
```
GET /tags?popular=true&limit=20
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "name": "JavaScript",
      "posts_count": 15,
      "color": "#f39c12"
    },
    {
      "name": "React",
      "posts_count": 12,
      "color": "#61dafb"
    }
  ]
}
```

## 6. 评论接口

### 6.1 获取文章评论
**请求**
```
GET /posts/{post_id}/comments?page=1&limit=10
```

**响应**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "很好的文章！",
        "author": {
          "id": 2,
          "username": "reader1",
          "avatar_url": "https://example.com/avatar2.jpg"
        },
        "replies": [
          {
            "id": 2,
            "content": "谢谢！",
            "author": {
              "id": 1,
              "username": "johndoe",
              "avatar_url": "https://example.com/avatar.jpg"
            },
            "created_at": "2024-12-01T11:00:00Z"
          }
        ],
        "created_at": "2024-12-01T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_count": 25
    }
  }
}
```

### 6.2 创建评论
**请求**
```
POST /posts/{post_id}/comments
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "这是我的评论",
  "parent_id": null
}
```

## 7. 搜索接口

### 7.1 搜索文章
**请求**
```
GET /search?q=React&type=posts&page=1&limit=10
```

**响应**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "title": "React 18新特性详解",
        "summary": "详细介绍React 18的新特性...",
        "highlight": "...React 18带来了许多新特性...",
        "author": {
          "username": "johndoe"
        },
        "created_at": "2024-12-01T10:00:00Z"
      }
    ],
    "total_count": 15,
    "query": "React",
    "suggestions": ["React Hooks", "React Router"]
  }
}
```

## 8. 文件上传接口

### 8.1 上传图片
**请求**
```
POST /upload/image
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

{
  "file": [binary data],
  "type": "avatar|post|general"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.yourblog.com/images/uuid.jpg",
    "filename": "image.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

## 9. 统计接口

### 9.1 获取网站统计
**请求**
```
GET /stats
```

**响应**
```json
{
  "success": true,
  "data": {
    "total_posts": 150,
    "total_users": 1200,
    "total_comments": 3500,
    "total_views": 45000,
    "popular_tags": [
      {"name": "JavaScript", "count": 25},
      {"name": "React", "count": 20}
    ]
  }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2024年12月  
**负责人**: 后端团队 
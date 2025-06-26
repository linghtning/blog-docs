# Next.js 配置文档

## 1. 项目配置

### 1.1 next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启实验性功能
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['prisma']
  },
  
  // 图片优化配置
  images: {
    domains: ['yourdomain.com', 'cdn.yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: 'value',
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/old-blog/:path*',
        destination: '/blog/:path*',
        permanent: true,
      },
    ]
  },
  
  // 重写配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/:path*`,
      },
    ]
  },
  
  // 压缩配置
  compress: true,
  
  // 生成配置
  output: 'standalone',
  
  // Webpack配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
```

### 1.2 TypeScript配置 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

## 2. 项目结构

### 2.1 App Router结构
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   ├── [slug]/
│   │   │   └── page.tsx
│   │   └── category/
│   │       └── [category]/
│   │           └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── posts/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── route.ts
│       ├── posts/
│       │   └── route.ts
│       └── upload/
│           └── route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── blog/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   └── CommentSection.tsx
│   └── editor/
│       ├── MarkdownEditor.tsx
│       └── PreviewPanel.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   └── api.ts
├── types/
│   ├── auth.ts
│   ├── blog.ts
│   └── api.ts
└── styles/
    └── globals.css
```

## 3. 路由和导航

### 3.1 App Router基础用法
```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '博客平台',
  description: '现代化的博客发布平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### 3.2 动态路由
```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/api'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const post = await getPostBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found'
    }
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [post.featuredImage],
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  
  return posts.map((post) => ({
    slug: post.slug,
  }))
}
```

### 3.3 中间件
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // 保护需要认证的路由
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value

    if (!token || !await verifyJWT(token)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // API路由限流
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 实现限流逻辑
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', '100')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

## 4. 数据获取策略

### 4.1 静态生成 (SSG)
```typescript
// app/blog/page.tsx
import { PostCard } from '@/components/blog/PostCard'
import { getAllPosts } from '@/lib/api'

export default async function BlogPage() {
  // 构建时获取数据
  const posts = await getAllPosts()

  return (
    <div>
      <h1>博客文章</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

// 启用ISR (增量静态再生)
export const revalidate = 3600 // 1小时
```

### 4.2 服务端渲染 (SSR)
```typescript
// app/dashboard/page.tsx
import { cookies } from 'next/headers'
import { getUserPosts } from '@/lib/api'

export default async function DashboardPage() {
  // 每次请求都获取最新数据
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  
  const posts = await getUserPosts(token)

  return (
    <div>
      <h1>我的文章</h1>
      {/* 渲染用户文章 */}
    </div>
  )
}

// 禁用缓存，确保每次都是最新数据
export const dynamic = 'force-dynamic'
```

### 4.3 客户端数据获取
```typescript
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

interface Comment {
  id: string
  content: string
  author: string
  createdAt: string
}

export function CommentSection({ postId }: { postId: string }) {
  const { data: comments, mutate } = useSWR<Comment[]>(
    `/api/posts/${postId}/comments`,
    fetch
  )

  const addComment = async (content: string) => {
    // 乐观更新
    const newComment = {
      id: Date.now().toString(),
      content,
      author: 'Current User',
      createdAt: new Date().toISOString()
    }

    mutate([...comments, newComment], false)

    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      mutate() // 重新获取数据
    } catch (error) {
      mutate() // 回滚
    }
  }

  return (
    <div>
      {/* 评论列表和表单 */}
    </div>
  )
}
```

## 5. 性能优化

### 5.1 图片优化
```typescript
import Image from 'next/image'

export function PostCard({ post }) {
  return (
    <div>
      <Image
        src={post.featuredImage}
        alt={post.title}
        width={400}
        height={300}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        priority={post.featured}
      />
      <h3>{post.title}</h3>
      <p>{post.summary}</p>
    </div>
  )
}
```

### 5.2 字体优化
```typescript
// app/layout.tsx
import { Inter, Noto_Serif_SC } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-serif-sc'
})

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSerifSC.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### 5.3 代码分割
```typescript
import dynamic from 'next/dynamic'

// 动态导入重型组件
const MarkdownEditor = dynamic(() => import('@/components/editor/MarkdownEditor'), {
  loading: () => <p>Loading editor...</p>,
  ssr: false
})

// 条件加载
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  ssr: false
})

export function Dashboard({ user }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <MarkdownEditor />
      {user.isAdmin && <AdminPanel />}
    </div>
  )
}
```

## 6. API Routes

### 6.1 基础API路由
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPosts, createPost } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const posts = await getPosts({ page, limit })
    
    return NextResponse.json({ posts })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const post = await createPost(data)
    
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
```

### 6.2 动态API路由
```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await getPostById(params.id)
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ post })
}
```

---

**文档版本**: v1.0  
**最后更新**: 2024年12月  
**负责人**: 前端团队 
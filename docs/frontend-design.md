# 博客平台前端设计文档 (Next.js)

## 1. 设计概述

### 1.1 设计理念
- **简洁优雅**: 采用简洁的设计风格，突出内容
- **用户体验**: 注重交互细节，提供流畅的用户体验
- **响应式**: 适配各种设备和屏幕尺寸
- **可访问性**: 遵循Web可访问性标准
- **SEO优化**: 利用Next.js的SSR/SSG能力提升搜索排名

### 1.2 设计原则
- **内容为王**: 设计服务于内容展示
- **性能优先**: 利用Next.js的优化特性提升性能
- **SEO友好**: 服务端渲染确保搜索引擎可索引
- **渐进增强**: 从基础功能开始，逐步增强
- **一致性**: 保持设计和交互的一致性

## 2. 视觉设计

### 2.1 色彩系统
```css
/* 主色调 */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-900: #1e3a8a;

/* 中性色 */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* 功能色 */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #06b6d4;
```

### 2.2 字体系统
```css
/* 字体家族 */
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", Consolas, monospace;
--font-serif: "Noto Serif SC", Georgia, serif;

/* 字体大小 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### 2.3 间距系统
```css
/* 间距尺寸 */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## 3. 页面布局设计

### 3.1 整体布局结构
```
┌─────────────────────────────────────────────┐
│                   Header                    │
├─────────────────────────────────────────────┤
│                                             │
│  Sidebar    │         Main Content         │
│  (可选)     │                              │
│             │                              │
│             │                              │
├─────────────────────────────────────────────┤
│                   Footer                    │
└─────────────────────────────────────────────┘
```

### 3.2 Header设计
- **Logo**: 左侧放置品牌Logo
- **导航菜单**: 中央放置主要导航
- **用户操作**: 右侧放置搜索、用户头像、通知等
- **移动端**: 折叠式汉堡菜单

### 3.3 响应式断点
```css
/* 断点设置 */
--breakpoint-sm: 640px;   /* 小屏设备 */
--breakpoint-md: 768px;   /* 平板设备 */
--breakpoint-lg: 1024px;  /* 笔记本 */
--breakpoint-xl: 1280px;  /* 桌面显示器 */
--breakpoint-2xl: 1536px; /* 大屏显示器 */
```

## 4. 关键页面设计

### 4.1 首页 (Homepage)
**布局结构**:
```
┌─────────────────────────────────────────────┐
│                 Header                      │
├─────────────────────────────────────────────┤
│               Hero Section                  │
│            (特色文章/标语)                   │
├─────────────────────────────────────────────┤
│  Sidebar        │    Article List          │
│  - 分类列表     │    ┌──────────────────┐   │
│  - 热门标签     │    │  Article Card    │   │
│  - 最新评论     │    │  - 标题           │   │
│  - 统计信息     │    │  - 摘要           │   │
│                 │    │  - 作者/时间      │   │
│                 │    │  - 标签           │   │
│                 │    └──────────────────┘   │
│                 │    ┌──────────────────┐   │
│                 │    │  Article Card    │   │
│                 │    └──────────────────┘   │
│                 │         分页导航          │
└─────────────────────────────────────────────┘
```

**组件特性**:
- 文章卡片支持图片预览
- 无限滚动或分页加载
- 筛选和排序功能
- 搜索高亮显示

### 4.2 文章详情页 (Post Detail)
**布局结构**:
```
┌─────────────────────────────────────────────┐
│                 Header                      │
├─────────────────────────────────────────────┤
│           Article Header                    │
│           - 标题                            │
│           - 作者信息                        │
│           - 发布时间/阅读量                  │
│           - 标签                            │
├─────────────────────────────────────────────┤
│  TOC          │    Article Content         │
│  (目录)       │    - Markdown渲染          │
│               │    - 代码高亮              │
│               │    - 图片预览              │
│               │                            │
├─────────────────────────────────────────────┤
│               Action Bar                    │
│            点赞 | 收藏 | 分享               │
├─────────────────────────────────────────────┤
│             Comments Section                │
│              评论列表和回复                 │
├─────────────────────────────────────────────┤
│            Related Posts                    │
│              相关文章推荐                   │
└─────────────────────────────────────────────┘
```

**特色功能**:
- 阅读进度条
- 目录导航
- 代码复制功能
- 图片放大预览
- 社交分享

### 4.3 编辑器页面 (Editor)
**布局结构**:
```
┌─────────────────────────────────────────────┐
│               Editor Header                 │
│    保存 | 发布 | 预览 | 设置               │
├─────────────────────────────────────────────┤
│                                             │
│  Editor Panel    │    Preview Panel        │
│  - Markdown编辑  │    - 实时预览           │
│  - 工具栏        │    - 滚动同步           │
│  - 行号          │                         │
│                  │                         │
│                  │                         │
├─────────────────────────────────────────────┤
│               Settings Panel                │
│        分类 | 标签 | 封面图 | 发布设置      │
└─────────────────────────────────────────────┘
```

**编辑器功能**:
- 语法高亮
- 自动补全
- 快捷键支持
- 图片拖拽上传
- 自动保存草稿

### 4.4 用户中心 (User Dashboard)
**布局结构**:
```
┌─────────────────────────────────────────────┐
│                 Header                      │
├─────────────────────────────────────────────┤
│  Sidebar        │    Content Area          │
│  - 个人信息     │    ┌──────────────────┐   │
│  - 我的文章     │    │   Profile Info   │   │
│  - 草稿箱       │    │   - 头像         │   │
│  - 收藏夹       │    │   - 基本信息     │   │
│  - 评论管理     │    │   - 统计数据     │   │
│  - 账户设置     │    └──────────────────┘   │
│                 │                          │
│                 │    ┌──────────────────┐   │
│                 │    │  Recent Posts    │   │
│                 │    └──────────────────┘   │
└─────────────────────────────────────────────┘
```

## 5. 组件设计系统

### 5.1 基础组件

#### Button组件
```typescript
'use client';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

export default function Button({ variant, size, ...props }: ButtonProps) {
  // Next.js客户端组件实现
}
```

#### Input组件
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'search';
  size: 'sm' | 'md' | 'lg';
  placeholder?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
}
```

#### Card组件
```typescript
interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  border?: boolean;
  children: ReactNode;
}
```

### 5.2 业务组件

#### ArticleCard组件
```typescript
interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    summary: string;
    author: User;
    category: Category;
    tags: Tag[];
    publishedAt: Date;
    readingTime: number;
    views: number;
    featuredImage?: string;
  };
  variant: 'default' | 'featured' | 'compact';
}
```

#### CommentItem组件
```typescript
interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    author: User;
    createdAt: Date;
    replies?: Comment[];
    likesCount: number;
  };
  level: number;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
}
```

### 5.3 布局组件

#### Layout组件
```typescript
interface LayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  sidebarPosition?: 'left' | 'right';
}
```

#### Container组件
```typescript
interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}
```

## 6. 交互设计

### 6.1 微交互
- **悬停效果**: 按钮、链接的悬停状态
- **加载状态**: 骨架屏、进度条、加载动画
- **反馈动画**: 点赞、收藏的动画效果
- **过渡动画**: 页面切换、模态框的过渡

### 6.2 表单交互
- **实时验证**: 输入时即时验证反馈
- **错误状态**: 清晰的错误提示和修复建议
- **成功反馈**: 操作成功的确认提示
- **自动保存**: 表单数据的自动保存

### 6.3 手势支持
- **移动端滑动**: 文章切换、侧边栏唤出
- **下拉刷新**: 列表页面的下拉刷新
- **上拉加载**: 无限滚动加载更多

## 7. 可访问性设计

### 7.1 键盘导航
- Tab键顺序合理
- 快捷键支持
- 焦点指示清晰

### 7.2 屏幕阅读器
- 语义化HTML标签
- Alt文本图片描述
- ARIA标签支持

### 7.3 视觉辅助
- 高对比度模式
- 字体大小调节
- 色盲友好设计

## 8. 性能优化

### 8.1 Next.js内置优化
- **自动代码分割**: 基于页面的代码分割
- **Image组件**: 自动图片优化和懒加载
- **Font优化**: 自动字体优化
- **Static Generation**: 静态页面生成

### 8.2 渲染优化
- **SSR/SSG**: 服务端渲染和静态生成
- **ISR**: 增量静态再生
- **memo优化**: React组件的记忆化
- **Streaming**: 流式渲染

### 8.3 缓存策略
- **Next.js缓存**: 内置的智能缓存
- **SWR缓存**: 数据获取缓存
- **CDN缓存**: Vercel Edge Network
- **本地存储**: 用户偏好设置缓存

## 9. 主题系统

### 9.1 明暗主题
```css
/* 明亮主题 */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
}

/* 暗黑主题 */
[data-theme="dark"] {
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
}
```

### 9.2 主题切换
- 用户偏好记忆
- 系统主题跟随
- 平滑过渡动画

---

**文档版本**: v1.0  
**最后更新**: 2024年12月  
**负责人**: 前端团队 
import { User, Post, Comment, Category, Tag } from '@prisma/client'

// 扩展的用户类型
export type UserWithProfile = User & {
  profile?: UserProfile
  _count?: {
    posts: number
    comments: number
  }
}

// 扩展的文章类型
export type PostWithDetails = Post & {
  author: User
  category?: Category
  tags?: Tag[]
  _count?: {
    comments: number
    likes: number
    views: number
  }
}

// 扩展的评论类型
export type CommentWithDetails = Comment & {
  user: User
  replies?: CommentWithDetails[]
  _count?: {
    replies: number
    likes: number
  }
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页类型
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

// 搜索参数类型
export interface SearchParams {
  q?: string
  category?: string
  tag?: string
  author?: string
  page?: number
  limit?: number
  sort?: 'latest' | 'popular' | 'oldest'
}

// 表单数据类型
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface PostFormData {
  title: string
  content: string
  summary?: string
  categoryId?: number
  tags?: string[]
  featuredImage?: string
  status: 'DRAFT' | 'PUBLISHED'
}

export interface UserProfileData {
  username?: string
  bio?: string
  avatarUrl?: string
  website?: string
  github?: string
  twitter?: string
  location?: string
  company?: string
}

// 用户角色和权限
export enum UserRole {
  USER = 'USER',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum CommentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

// 通知类型
export interface Notification {
  id: string
  type: 'COMMENT' | 'LIKE' | 'FOLLOW' | 'SYSTEM'
  title: string
  content: string
  isRead: boolean
  createdAt: Date
  data?: Record<string, any>
}

// 统计数据类型
export interface DashboardStats {
  totalPosts: number
  totalViews: number
  totalComments: number
  totalLikes: number
  recentPosts: PostWithDetails[]
  recentComments: CommentWithDetails[]
  viewsChart: Array<{ date: string; views: number }>
  popularPosts: PostWithDetails[]
} 
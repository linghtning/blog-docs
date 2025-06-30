/**
 * TypeScript 类型定义文件 - 项目中使用的所有数据类型
 *
 * 主要功能：
 * 1. 定义数据库模型的扩展类型
 * 2. API响应和请求的数据结构
 * 3. 表单数据和验证类型
 * 4. 枚举类型和常量定义
 * 5. 通用工具类型和接口
 *
 * 类型分类：
 * - 用户相关：UserProfile, UserWithProfile
 * - 文章相关：PostWithDetails, PostFormData
 * - 评论相关：CommentWithDetails
 * - API通用：ApiResponse, PaginatedResponse
 * - 表单数据：LoginFormData, RegisterFormData
 * - 枚举类型：UserRole, PostStatus, CommentStatus
 *
 * 设计原则：
 * - 基于Prisma模型扩展
 * - 类型安全和可复用
 * - 清晰的命名约定
 * - 支持泛型和组合
 *
 * 使用场景：
 * - API接口类型定义
 * - 组件Props类型
 * - 数据库查询结果
 * - 表单验证和处理
 * - 状态管理类型
 *
 * 使用技术：
 * - TypeScript 高级类型
 * - Prisma 客户端类型
 * - 泛型和联合类型
 * - 接口继承和组合
 */
import { User, Post, Comment, Category, Tag } from '@prisma/client';

// 用户资料类型
export interface UserProfile {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  github?: string;
  twitter?: string;
  location?: string;
  company?: string;
}

// 扩展的用户类型
export type UserWithProfile = User & {
  profile?: UserProfile;
  _count?: {
    posts: number;
    comments: number;
  };
};

// 扩展的文章类型
export type PostWithDetails = Post & {
  author: User;
  category?: Category;
  tags?: Tag[];
  _count?: {
    comments: number;
    likes: number;
    views: number;
  };
};

// 扩展的评论类型
export type CommentWithDetails = Comment & {
  user: User;
  replies?: CommentWithDetails[];
  _count?: {
    replies: number;
    likes: number;
  };
};

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// 搜索参数类型
export interface SearchParams {
  q?: string;
  category?: string;
  tag?: string;
  author?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'popular' | 'oldest';
}

// 表单数据类型
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PostFormData {
  title: string;
  content: string;
  summary?: string;
  categoryId?: number;
  tags?: string[];
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

// UserProfileData 已移动到文件顶部作为 UserProfile

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
  id: string;
  type: 'COMMENT' | 'LIKE' | 'FOLLOW' | 'SYSTEM';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

// 统计数据类型
export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  recentPosts: PostWithDetails[];
  recentComments: CommentWithDetails[];
  viewsChart: Array<{ date: string; views: number }>;
  popularPosts: PostWithDetails[];
}

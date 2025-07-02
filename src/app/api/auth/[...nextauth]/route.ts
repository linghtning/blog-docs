/**
 * Auth.js v5 API 路由处理器 - 认证服务端点
 *
 * 主要功能：
 * 1. 处理所有 Auth.js 相关的 API 请求
 * 2. 统一管理认证路由（登录、登出、会话等）
 * 3. 使用 catch-all 路由处理多个端点
 * 4. 导出 GET 和 POST 处理器
 *
 * 支持的端点：
 * - /api/auth/signin - 登录页面和处理
 * - /api/auth/signout - 登出处理
 * - /api/auth/session - 获取当前会话
 * - /api/auth/csrf - CSRF 令牌
 * - /api/auth/providers - 可用的认证提供者
 * - /api/auth/callback/* - OAuth 回调处理
 *
 * 配置来源：
 * - 使用 @/lib/auth 中的 handlers 配置
 * - 包含认证提供者、数据库、回调等设置
 *
 * 路由模式：
 * - [...nextauth] 动态路由捕获所有认证相关请求
 * - 支持 GET 和 POST 方法
 *
 * 使用技术：
 * - Next.js 15 App Router API
 * - Auth.js v5
 * - 动态路由参数
 */
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

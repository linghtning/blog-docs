/**
 * Next.js 中间件 - 路由保护和认证检查
 *
 * 主要功能：
 * 1. 检查用户身份认证状态
 * 2. 保护需要登录的路由
 * 3. 实现基于角色的访问控制（RBAC）
 * 4. 处理未认证用户的重定向
 *
 * 路由保护策略：
 * - 公开路由：首页、文章列表、搜索、登录、注册
 * - 作者路由：写作控制台、文章编辑（需要 AUTHOR 或 ADMIN 角色）
 * - 管理员路由：后台管理（需要 ADMIN 角色）
 *
 * 使用技术：
 * - Auth.js v5 认证
 * - Next.js 15 中间件 API
 * - 路径匹配配置
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // 公开路由，不需要认证
  const publicRoutes = [
    '/',
    '/posts',
    '/search',
    '/auth/login',
    '/auth/register',
    '/api/auth',
  ];

  // 检查是否为公开路由
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // 检查是否已登录，未登录则重定向到登录页
    if (!session || !session.user) {
      const loginUrl = new URL('/auth/login', req.url);
      if (pathname !== '/auth/login') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // 管理员路由保护
    if (pathname.startsWith('/admin')) {
      if (session.user.role !== 'ADMIN') {
        return NextResponse.redirect(
          new URL('/auth/login?error=admin_required', req.url)
        );
      }
    }

    // 作者路由保护
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/write')) {
      if (session.user.role !== 'AUTHOR' && session.user.role !== 'ADMIN') {
        return NextResponse.redirect(
          new URL('/auth/login?error=author_required', req.url)
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // 如果认证验证失败，重定向到登录页
    return NextResponse.redirect(
      new URL('/auth/login?error=auth_error', req.url)
    );
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下情况：
     * - api/auth/* (Auth.js API路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - 其他静态资源
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

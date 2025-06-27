import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
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
    // 获取JWT token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    // 检查是否已登录，未登录则重定向到登录页
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      if (pathname !== '/auth/login') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // 管理员路由保护
    if (pathname.startsWith('/admin')) {
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(
          new URL('/auth/login?error=admin_required', req.url)
        );
      }
    }

    // 作者路由保护
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/write')) {
      if (token.role !== 'AUTHOR' && token.role !== 'ADMIN') {
        return NextResponse.redirect(
          new URL('/auth/login?error=author_required', req.url)
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // 如果JWT验证失败，重定向到登录页
    return NextResponse.redirect(
      new URL('/auth/login?error=auth_error', req.url)
    );
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下情况：
     * - api/auth/* (NextAuth API路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - 其他静态资源
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

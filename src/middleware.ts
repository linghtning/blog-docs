import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // 检查用户角色权限
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // 管理员路由保护
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/login?error=admin_required', req.url))
      }
    }

    // 作者路由保护
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/write')) {
      if (!token || (token.role !== 'AUTHOR' && token.role !== 'ADMIN')) {
        return NextResponse.redirect(new URL('/auth/login?error=author_required', req.url))
      }
    }

    // 个人资料路由保护
    if (pathname.startsWith('/profile')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login?redirect=' + pathname, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // 公开路由，不需要认证
        const publicRoutes = [
          '/',
          '/posts',
          '/search',
          '/auth/login',
          '/auth/register',
          '/api/auth',
        ]

        // 检查是否为公开路由
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // 其他路由需要登录
        return !!token
      },
    },
  }
)

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
} 
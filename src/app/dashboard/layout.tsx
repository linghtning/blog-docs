/**
 * Dashboard 布局 - 用户个人仪表板的统一布局
 *
 * 主要功能：
 * 1. 侧边栏导航
 * 2. 页面标题管理
 * 3. 用户权限检查
 * 4. 响应式布局
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: '我的文章', href: '/dashboard/posts', icon: '📝' },
  { name: '草稿箱', href: '/dashboard/drafts', icon: '📄' },
  { name: '统计分析', href: '/dashboard/analytics', icon: '📊' },
  { name: '个人设置', href: '/profile', icon: '⚙️' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 权限检查
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 侧边栏 */}
        <div className="hidden w-64 bg-white shadow-sm lg:block">
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <h1 className="text-xl font-semibold text-gray-900">个人中心</h1>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 lg:pl-0">
          {/* 移动端顶部导航 */}
          <div className="sticky top-0 z-10 flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900">个人中心</h1>
          </div>

          {/* 页面内容 */}
          <main className="flex-1">{children}</main>
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex">
          {navigation.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-2 text-xs',
                pathname === item.href ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 全局导航栏组件 - 网站顶部导航和用户菜单
 *
 * 主要功能：
 * 1. 显示网站品牌标识和主导航
 * 2. 根据用户登录状态显示不同菜单
 * 3. 用户头像和下拉菜单
 * 4. 响应式移动端菜单
 * 5. 用户登录登出操作
 *
 * 导航结构：
 * - 左侧：网站Logo和标题
 * - 中间：主导航链接（首页、文章、搜索）
 * - 右侧：用户菜单或登录注册按钮
 *
 * 用户状态：
 * - 未登录：显示登录/注册按钮
 * - 已登录：显示用户头像和下拉菜单
 * - 角色相关：控制台、写文章等功能链接
 *
 * 特性：
 * - 客户端组件（useSession）
 * - 响应式设计（桌面端/移动端）
 * - 悬停和交互动画
 * - 无障碍访问支持
 *
 * 使用技术：
 * - NextAuth.js 会话管理
 * - React Hooks (useState, useEffect, useRef)
 * - Tailwind CSS 样式
 * - Next.js Link 导航
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: '首页', href: '/' },
    { name: '分类', href: '/categories' },
  ];

  const userNavigation = [
    { name: '个人资料', href: '/profile' },
    { name: '我的文章', href: '/dashboard/posts' },
  ];

  // 管理员专用菜单
  const adminNavigation = [{ name: '分类管理', href: '/admin/categories' }];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ESC 键关闭菜单
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* 左侧：品牌和导航 */}
          <div className="flex items-center">
            {/* 品牌标识 */}
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-2xl font-bold text-blue-600">博客平台</span>
            </Link>

            {/* 桌面导航菜单 */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors',
                    isActivePath(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* 右侧：用户区域 */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="h-8 w-20 animate-pulse rounded-full bg-gray-300"></div>
            ) : session ? (
              <>
                {/* 写文章按钮 */}
                <Link
                  href="/posts/create"
                  className="hidden items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:inline-flex"
                >
                  写文章
                </Link>

                {/* 用户菜单 */}
                <div className="relative ml-3" ref={userMenuRef}>
                  <div>
                    <button
                      type="button"
                      className="flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="true"
                    >
                      <span className="sr-only">打开用户菜单</span>
                      {session.user?.avatarUrl ? (
                        <Image
                          src={session.user.avatarUrl}
                          alt={session.user.username || '用户头像'}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400">
                          <span className="text-sm font-medium text-white">
                            {session.user?.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* 用户下拉菜单 */}
                  {isUserMenuOpen && (
                    <div
                      className={cn(
                        'absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
                        'transform transition-all duration-200 ease-out',
                        isUserMenuOpen
                          ? 'scale-100 opacity-100'
                          : 'scale-95 opacity-0'
                      )}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="border-b border-gray-200 px-4 py-2 text-sm text-gray-700">
                        <p className="font-medium">{session.user?.username}</p>
                        <p className="text-gray-500">{session.user?.email}</p>
                      </div>
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      {/* 管理员专用菜单 */}
                      {session.user?.role === 'ADMIN' && (
                        <>
                          <div className="my-1 border-t border-gray-200"></div>
                          {adminNavigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                              role="menuitem"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <span className="flex items-center">
                                <svg
                                  className="mr-2 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {item.name}
                              </span>
                            </Link>
                          ))}
                        </>
                      )}
                      <div className="my-1 border-t border-gray-200"></div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        role="menuitem"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  注册
                </Link>
              </div>
            )}

            {/* 移动端菜单按钮 */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">打开主菜单</span>
                <svg
                  className={cn(
                    'h-6 w-6',
                    isMobileMenuOpen ? 'hidden' : 'block'
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={cn(
                    'h-6 w-6',
                    isMobileMenuOpen ? 'block' : 'hidden'
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 border-t border-gray-200 px-2 pb-3 pt-2 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium transition-colors',
                  isActivePath(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {session && (
              <Link
                href="/posts/create"
                className="block rounded-md px-3 py-2 text-base font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                写文章
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">📝</span>
            <span className="text-xl font-bold text-gray-900">博客平台</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            <Link 
              href="/" 
              className="text-gray-700 transition-colors hover:text-gray-900"
            >
              首页
            </Link>
            <Link 
              href="/posts" 
              className="text-gray-700 transition-colors hover:text-gray-900"
            >
              文章
            </Link>
            <Link 
              href="/search" 
              className="text-gray-700 transition-colors hover:text-gray-900"
            >
              搜索
            </Link>
            
            {status === 'loading' ? (
              <div className="text-gray-500">加载中...</div>
            ) : session ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 transition-colors hover:text-gray-900"
                >
                  控制台
                </Link>
                <Link 
                  href="/write" 
                  className="text-gray-700 transition-colors hover:text-gray-900"
                >
                  写文章
                </Link>
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 transition-colors hover:text-gray-900"
                  >
                    {session.user.username && (
                      <div className="flex justify-center items-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                        {session.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{session.user.username}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md border border-gray-200 shadow-lg">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          个人资料
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          设置
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setIsMenuOpen(false)
                            handleSignOut()
                          }}
                          className="block px-4 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-100"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    登录
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-400 rounded-md md:hidden hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </Link>
              <Link
                href="/posts"
                className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                文章
              </Link>
              <Link
                href="/search"
                className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                搜索
              </Link>
              
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    控制台
                  </Link>
                  <Link
                    href="/write"
                    className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    写文章
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    个人资料
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleSignOut()
                    }}
                    className="block px-3 py-2 w-full text-base font-medium text-left text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2 text-base font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 
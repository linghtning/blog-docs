/**
 * 分类列表页面 - 显示所有分类
 *
 * 主要功能：
 * 1. 显示所有分类卡片
 * 2. 显示每个分类的文章数量
 * 3. 分类搜索和筛选
 * 4. 响应式网格布局
 *
 * 使用技术：
 * - Next.js App Router
 * - 服务端渲染 (SSR)
 * - Tailwind CSS 样式
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '分类 - 博客平台',
  description: '浏览所有文章分类，发现感兴趣的内容',
  keywords: '分类, 博客, 文章',
};

// 获取所有分类
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      postsCount: category._count.posts,
      _count: undefined,
    }));
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">文章分类</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            浏览所有分类，发现你感兴趣的内容。每个分类都包含相关主题的精选文章。
          </p>
        </div>

        {/* 统计信息 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
            共 {categories.length} 个分类，
            {categories.reduce((total, cat) => total + cat.postsCount, 0)}{' '}
            篇文章
          </div>
        </div>

        {/* 分类网格 */}
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">暂无分类</h3>
            <p className="text-gray-500">还没有创建任何分类</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group"
              >
                <Card className="h-full cursor-pointer p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  {/* 分类头部 */}
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-gray-500">
                      {category.postsCount} 篇文章
                    </span>
                  </div>

                  {/* 分类名称 */}
                  <h2 className="mb-3 text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    {category.name}
                  </h2>

                  {/* 分类描述 */}
                  {category.description ? (
                    <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                      {category.description}
                    </p>
                  ) : (
                    <p className="mb-4 text-sm italic text-gray-400">
                      暂无描述
                    </p>
                  )}

                  {/* 文章数量指示器 */}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      别名: {category.slug}
                    </span>

                    {category.postsCount > 0 && (
                      <div className="flex items-center text-blue-600">
                        <svg
                          className="mr-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <span className="text-sm font-medium">查看文章</span>
                      </div>
                    )}
                  </div>

                  {/* 悬停效果指示器 */}
                  <div className="mt-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="h-0.5 scale-x-0 transform rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-transform duration-300 group-hover:scale-x-100"></div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        {categories.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              点击任意分类卡片可以查看该分类下的所有文章
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

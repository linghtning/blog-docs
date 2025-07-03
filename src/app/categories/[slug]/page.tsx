/**
 * 分类详情页面 - 显示特定分类下的所有文章
 *
 * 主要功能：
 * 1. 显示分类信息
 * 2. 显示该分类下的文章列表
 * 3. 分页功能
 * 4. SEO优化
 *
 * 使用技术：
 * - Next.js App Router
 * - 服务端渲染 (SSR)
 * - 动态元数据
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

// 获取分类数据
async function getCategory(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
    });

    return category;
  } catch (error) {
    console.error('获取分类失败:', error);
    return null;
  }
}

// 获取分类下的文章
async function getCategoryPosts(
  categoryId: number,
  page: number = 1,
  limit: number = 12
) {
  try {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          categoryId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          categoryId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
      }),
    ]);

    return {
      posts: posts.map((post) => ({
        ...post,
        id: post.id.toString(),
        authorId: post.authorId.toString(),
        author: {
          ...post.author!,
          id: post.author!.id.toString(),
        },
        tags: post.tags.map((pt) => pt.tag),
        commentsCount: post._count.comments,
      })),
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('获取分类文章失败:', error);
    return {
      posts: [],
      total: 0,
      totalPages: 0,
    };
  }
}

// 动态生成元数据
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: '分类不存在',
    };
  }

  return {
    title: `${category.name} - 分类文章`,
    description: category.description || `浏览${category.name}分类下的所有文章`,
    keywords: category.name,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const currentPage = parseInt(pageParam || '1', 10);
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const { posts, total, totalPages } = await getCategoryPosts(
    category.id,
    currentPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 分类头部 */}
        <div className="mb-8">
          <div className="mb-4 flex items-center space-x-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-3xl font-bold text-gray-900">
              {category.name}
            </h1>
          </div>

          {category.description && (
            <p className="mb-4 text-lg text-gray-600">{category.description}</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">共 {total} 篇文章</p>

            {/* 面包屑导航 */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-700">
                首页
              </Link>
              <span>/</span>
              <span className="text-gray-900">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* 文章列表 */}
        {posts.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">暂无文章</h3>
            <p className="text-gray-500">该分类下还没有发布的文章</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden transition-shadow hover:shadow-lg"
              >
                {/* 特色图片 */}
                {post.featuredImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      width={400}
                      height={225}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* 标题 */}
                  <h2 className="mb-3">
                    <Link
                      href={`/posts/${post.id}`}
                      className="line-clamp-2 text-xl font-semibold text-gray-900 transition-colors hover:text-blue-600"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  {/* 摘要 */}
                  {post.summary && (
                    <p className="mb-4 line-clamp-3 text-gray-600">
                      {post.summary}
                    </p>
                  )}

                  {/* 标签 */}
                  {post.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {post.tags
                        .filter((tag) => tag !== null)
                        .slice(0, 3)
                        .map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full px-2 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      {post.tags.filter((tag) => tag !== null).length > 3 && (
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                          +{post.tags.filter((tag) => tag !== null).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 文章元信息 */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      {post.author.avatarUrl ? (
                        <Image
                          src={post.author.avatarUrl}
                          alt={post.author.username}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-300" />
                      )}
                      <span>{post.author.username}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span>{post.views} 阅读</span>
                      <span>{post.commentsCount} 评论</span>
                      {post.publishedAt && (
                        <span>
                          {formatDistanceToNow(new Date(post.publishedAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex space-x-2">
              {/* 上一页 */}
              {currentPage > 1 && (
                <Link
                  href={`/categories/${slug}?page=${currentPage - 1}`}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  上一页
                </Link>
              )}

              {/* 页码 */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/categories/${slug}?page=${pageNum}`}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              {/* 下一页 */}
              {currentPage < totalPages && (
                <Link
                  href={`/categories/${slug}?page=${currentPage + 1}`}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  下一页
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

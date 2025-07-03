/**
 * 首页 - 文章列表展示
 *
 * 主要功能：
 * 1. 文章列表展示（SSG + ISR）
 * 2. 分类筛选
 * 3. 分页功能
 * 4. SEO优化
 * 5. 响应式设计
 *
 * 使用技术：
 * - Next.js App Router
 * - 静态生成 (SSG)
 * - 增量静态再生 (ISR)
 */

import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export const metadata: Metadata = {
  title: '首页 | 博客平台',
  description: '现代化的博客发布平台，为内容创作者提供优秀的写作发布体验',
};

// 每30分钟重新生成页面
export const revalidate = 1800;

interface Post {
  id: string;
  title: string;
  summary: string | null;
  featuredImage: string | null;
  views: number;
  likesCount: number;
  commentsCount: number;
  readingTime: number;
  publishedAt: Date | null;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    color: string;
  } | null;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
  }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  postsCount: number;
}

async function getPosts(): Promise<Post[]> {
  try {
    const posts = await prisma.post.findMany({
      where: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
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
      take: 12,
    });

    return posts.map((post) => ({
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      author: {
        ...post.author!,
        id: post.author!.id.toString(),
      },
      tags: post.tags.map((pt) => pt.tag),
      commentsCount: post._count.comments,
    })) as Post[];
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 10,
    });

    return categories as Category[];
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return [];
  }
}

export default async function HomePage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部横幅 */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              欢迎来到博客平台
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
              分享知识，记录思考，与世界连接。在这里发现优质内容，与优秀的创作者交流。
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/posts/create">
                <Button size="lg">开始写作</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">
                  立即注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* 主要内容区域 */}
          <div className="lg:col-span-3">
            {/* 最新文章 */}
            <div className="mb-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                最新文章
              </h2>

              {posts.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-lg text-gray-500">暂无文章</p>
                  <p className="mt-2 text-gray-400">成为第一个发布文章的人</p>
                  <Link href="/posts/create" className="mt-4 inline-block">
                    <Button>写第一篇文章</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      className="overflow-hidden transition-shadow hover:shadow-lg"
                    >
                      {/* 特色图片 */}
                      {post.featuredImage && (
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="p-6">
                        {/* 分类 */}
                        {post.category && (
                          <span
                            className="mb-3 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: post.category.color }}
                          >
                            {post.category.name}
                          </span>
                        )}

                        {/* 标题 */}
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">
                          <Link
                            href={`/posts/${post.id}`}
                            className="transition-colors hover:text-blue-600"
                          >
                            {post.title}
                          </Link>
                        </h3>

                        {/* 摘要 */}
                        {post.summary && (
                          <p className="mb-4 line-clamp-3 text-gray-600">
                            {post.summary}
                          </p>
                        )}

                        {/* 标签 */}
                        {post.tags.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center rounded px-2 py-1 text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                #{tag.name}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 文章元信息 */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            {/* 作者 */}
                            <div className="flex items-center space-x-2">
                              {post.author.avatarUrl ? (
                                <Image
                                  src={post.author.avatarUrl}
                                  alt={post.author.username}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                                  <span className="text-xs font-medium text-gray-600">
                                    {post.author.username[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium">
                                {post.author.username}
                              </span>
                            </div>

                            {/* 发布时间 */}
                            {post.publishedAt && (
                              <span>
                                {formatDistanceToNow(
                                  new Date(post.publishedAt),
                                  {
                                    addSuffix: true,
                                    locale: zhCN,
                                  }
                                )}
                              </span>
                            )}
                          </div>

                          {/* 统计信息 */}
                          <div className="flex items-center space-x-3">
                            <span>{post.views} 阅读</span>
                            <span>{post.likesCount} 点赞</span>
                            <span>{post.readingTime}分钟</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* 查看更多按钮 */}
            {posts.length >= 12 && (
              <div className="text-center">
                <Button variant="outline" size="lg">
                  查看更多文章
                </Button>
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-8">
            {/* 分类 */}
            {categories.length > 0 && (
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  分类
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="flex items-center justify-between rounded p-2 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-gray-700">{category.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {category.postsCount}
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* 推荐操作 */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                快速开始
              </h3>
              <div className="space-y-3">
                <Link href="/posts/create">
                  <Button variant="primary" className="w-full">
                    写文章
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" className="w-full">
                    注册账号
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

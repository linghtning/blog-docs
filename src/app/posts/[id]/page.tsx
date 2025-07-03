/**
 * 文章详情页面 - 显示文章内容和相关信息
 *
 * 主要功能：
 * 1. 文章内容渲染
 * 2. 作者信息显示
 * 3. 分类和标签展示
 * 4. 阅读统计
 * 5. SEO优化
 *
 * 使用技术：
 * - Next.js App Router
 * - 服务端渲染 (SSR)
 * - Markdown渲染
 * - 动态元数据
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// 获取文章数据
async function getPost(id: string) {
  try {
    // 验证 id 参数
    if (!id || id === 'undefined' || id === 'null') {
      return null;
    }

    // 尝试解析 id，如果无效则返回 null
    let postId: bigint;
    try {
      postId = BigInt(id);
    } catch {
      return null;
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
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
      },
    });

    if (!post) {
      return null;
    }

    // 增加浏览量
    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

    return {
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      tags: post.tags.map((pt) => pt.tag),
    };
  } catch (error) {
    console.error('获取文章失败:', error);
    return null;
  }
}

// 动态生成元数据
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: '文章不存在',
    };
  }

  return {
    title: post.title,
    description: post.summary || post.content.slice(0, 160),
    keywords: post.tags
      .filter((tag) => tag !== null)
      .map((tag) => tag.name)
      .join(', '),
    authors: post.author ? [{ name: post.author.username }] : undefined,
    openGraph: {
      title: post.title,
      description: post.summary || post.content.slice(0, 160),
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author ? [post.author.username] : undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary || post.content.slice(0, 160),
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 文章头部 */}
        <header className="mb-8">
          {/* 分类 */}
          {post.category && (
            <div className="mb-4">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </span>
            </div>
          )}

          {/* 标题 */}
          <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
            {post.title}
          </h1>

          {/* 摘要 */}
          {post.summary && (
            <p className="mb-6 text-xl leading-relaxed text-gray-600">
              {post.summary}
            </p>
          )}

          {/* 文章元信息 */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-6">
            <div className="flex items-center space-x-4">
              {/* 作者信息 */}
              {post.author && (
                <div className="flex items-center space-x-3">
                  {post.author.avatarUrl ? (
                    <Image
                      src={post.author.avatarUrl}
                      alt={post.author.username}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                      <span className="font-medium text-gray-600">
                        {post.author.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {post.author.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {post.publishedAt &&
                        formatDistanceToNow(new Date(post.publishedAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 阅读统计 */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{post.views} 次阅读</span>
              <span>{post.readingTime} 分钟阅读</span>
              <span>{post.likesCount} 点赞</span>
            </div>
          </div>
        </header>

        {/* 特色图片 */}
        {post.featuredImage && (
          <div className="mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={800}
              height={400}
              className="h-64 w-full rounded-lg object-cover shadow-lg md:h-96"
            />
          </div>
        )}

        {/* 文章内容 */}
        <article className="prose prose-lg mb-12 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-6 text-3xl font-bold text-gray-900">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-4 border-b border-gray-200 pb-2 text-2xl font-semibold text-gray-900">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-3 text-xl font-medium text-gray-900">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-6 leading-relaxed text-gray-700">{children}</p>
              ),
              img: ({ src, alt }) => {
                if (!src || typeof src !== 'string') return null;
                return (
                  <Image
                    src={src}
                    alt={alt || ''}
                    width={800}
                    height={400}
                    className="my-8 h-auto w-full rounded-lg shadow-md"
                  />
                );
              },
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-800">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-8 overflow-x-auto rounded-lg bg-gray-900 p-6 text-sm text-gray-100">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-8 border-l-4 border-blue-500 pl-6 italic text-gray-700">
                  {children}
                </blockquote>
              ),
              ul: ({ children }) => (
                <ul className="mb-6 list-inside list-disc space-y-2 text-gray-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 list-inside list-decimal space-y-2 text-gray-700">
                  {children}
                </ol>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        {/* 标签 */}
        {post.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium text-gray-900">标签</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags
                .filter((tag) => tag !== null)
                .map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    #{tag.name}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* 作者简介 */}
        {post.author && post.author.bio && (
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-start space-x-4">
              {post.author.avatarUrl ? (
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.username}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-xl font-medium text-gray-600">
                    {post.author.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  关于 {post.author.username}
                </h3>
                <p className="leading-relaxed text-gray-600">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 草稿箱页面 - 用户管理自己的草稿文章
 *
 * 主要功能：
 * 1. 查看所有草稿文章
 * 2. 编辑草稿
 * 3. 发布草稿
 * 4. 删除草稿
 * 5. 搜索草稿
 *
 * 权限要求：
 * - 需要登录
 * - 只能管理自己的草稿
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Post {
  id: string;
  title: string;
  summary?: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  wordCount: number;
  readingTime: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

interface PostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function DraftsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 权限检查
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // 加载草稿列表
  const loadDrafts = async (page = 1) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        authorId: session.user.id,
        status: 'DRAFT',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const data: PostsResponse = await response.json();
        if (data.success) {
          setPosts(data.data.posts);
          setCurrentPage(data.data.pagination.page);
          setTotalPages(data.data.pagination.totalPages);
          setTotal(data.data.pagination.total);
        }
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadDrafts(1);
    }
  }, [session?.user?.id, searchTerm]);

  // 删除草稿
  const handleDeleteDraft = async (postId: string) => {
    if (!confirm('确定要删除这篇草稿吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
        setTotal(total - 1);
        alert('草稿删除成功');
      } else {
        const error = await response.json();
        alert(error.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除草稿失败:', error);
      alert('删除失败');
    }
  };

  // 发布草稿
  const handlePublishDraft = async (postId: string) => {
    if (!confirm('确定要发布这篇草稿吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 从草稿列表中移除已发布的文章
          setPosts(posts.filter((post) => post.id !== postId));
          setTotal(total - 1);
          alert('草稿发布成功');
        }
      } else {
        const error = await response.json();
        alert(error.error?.message || '发布失败');
      }
    } catch (error) {
      console.error('发布草稿失败:', error);
      alert('发布失败');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">草稿箱</h1>
              <p className="mt-2 text-gray-600">共 {total} 篇草稿</p>
            </div>
            <Link href="/posts/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                写新文章
              </Button>
            </Link>
          </div>

          {/* 搜索 */}
          <div className="mt-6">
            <Input
              type="text"
              placeholder="搜索草稿标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-lg"
            />
          </div>
        </div>

        {/* 草稿列表 */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-gray-500">
              {searchTerm ? '没有找到符合条件的草稿' : '还没有草稿'}
            </p>
            <p className="mt-2 text-gray-400">
              {searchTerm ? '试试调整搜索条件' : '开始写作，保存为草稿'}
            </p>
            {!searchTerm && (
              <Link href="/posts/create" className="mt-4 inline-block">
                <Button>开始写作</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-6 lg:space-y-0">
                  {/* 草稿信息 */}
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        草稿
                      </span>
                      {post.category && (
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                      )}
                    </div>

                    <Link href={`/posts/${post.id}`}>
                      <h3 className="mb-2 text-xl font-semibold text-gray-900 hover:text-blue-600">
                        {post.title || '无标题草稿'}
                      </h3>
                    </Link>

                    {post.summary && (
                      <p className="mb-3 line-clamp-2 text-gray-600">
                        {post.summary}
                      </p>
                    )}

                    {/* 标签 */}
                    {post.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded px-2 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 草稿统计 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>{post.wordCount} 字</span>
                      <span>{post.readingTime} 分钟阅读</span>
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                      创建于 {formatDate(post.createdAt)}
                      <span className="ml-4">
                        更新于 {formatDate(post.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-row space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2">
                    <Link href={`/posts/edit/${post.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        编辑
                      </Button>
                    </Link>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublishDraft(post.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      发布
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDraft(post.id)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => loadDrafts(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => loadDrafts(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => loadDrafts(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

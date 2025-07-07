/**
 * 我的文章管理页面 - 用户管理自己的文章
 *
 * 主要功能：
 * 1. 查看所有自己的文章
 * 2. 按状态筛选（草稿、已发布、已归档）
 * 3. 编辑文章
 * 4. 删除文章
 * 5. 管理文章状态
 * 6. 搜索文章
 *
 * 权限要求：
 * - 需要登录
 * - 只能管理自己的文章
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'ARCHIVED', label: '已归档' },
];

const statusConfig = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PUBLISHED: { label: '已发布', color: 'bg-green-100 text-green-800' },
  ARCHIVED: { label: '已归档', color: 'bg-yellow-100 text-yellow-800' },
};

export default function MyPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 权限检查
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // 加载文章列表
  const loadPosts = useCallback(
    async (page = 1) => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          authorId: session.user.id,
        });

        if (statusFilter) {
          params.append('status', statusFilter);
        }

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
        console.error('加载文章失败:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, statusFilter, searchTerm]
  );

  useEffect(() => {
    if (session?.user?.id) {
      loadPosts(1);
    }
  }, [session?.user?.id, statusFilter, searchTerm, loadPosts]);

  // 删除文章
  const handleDeletePost = async (postId: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
        setTotal(total - 1);
        alert('文章删除成功');
      } else {
        const error = await response.json();
        alert(error.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败');
    }
  };

  // 更新文章状态
  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPosts(
            posts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    status: newStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                  }
                : post
            )
          );
          alert('状态更新成功');
        }
      } else {
        const error = await response.json();
        alert(error.error?.message || '更新失败');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新失败');
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
              <h1 className="text-3xl font-bold text-gray-900">我的文章</h1>
              <p className="mt-2 text-gray-600">共 {total} 篇文章</p>
            </div>
            <Link href="/posts/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                写新文章
              </Button>
            </Link>
          </div>

          {/* 搜索和筛选 */}
          <div className="mt-6 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="搜索文章标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 文章列表 */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-gray-500">
              {searchTerm || statusFilter
                ? '没有找到符合条件的文章'
                : '还没有文章'}
            </p>
            <p className="mt-2 text-gray-400">
              {searchTerm || statusFilter
                ? '试试调整搜索条件'
                : '写第一篇文章开始你的创作之旅'}
            </p>
            {!searchTerm && !statusFilter && (
              <Link href="/posts/create" className="mt-4 inline-block">
                <Button>写第一篇文章</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-6 lg:space-y-0">
                  {/* 文章信息 */}
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusConfig[post.status].color
                        }`}
                      >
                        {statusConfig[post.status].label}
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
                        {post.title}
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

                    {/* 文章统计 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>{post.views} 阅读</span>
                      <span>{post.likesCount} 点赞</span>
                      <span>{post.commentsCount} 评论</span>
                      <span>{post.wordCount} 字</span>
                      <span>{post.readingTime} 分钟阅读</span>
                    </div>

                    <div className="mt-2 text-sm text-gray-500">
                      创建于 {formatDate(post.createdAt)}
                      {post.publishedAt && (
                        <span className="ml-4">
                          发布于 {formatDate(post.publishedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-row space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2">
                    <Link href={`/posts/edit/${post.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        编辑
                      </Button>
                    </Link>

                    {/* 状态切换 */}
                    <div className="relative">
                      <select
                        value={post.status}
                        onChange={(e) =>
                          handleUpdateStatus(post.id, e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DRAFT">草稿</option>
                        <option value="PUBLISHED">已发布</option>
                        <option value="ARCHIVED">已归档</option>
                      </select>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
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
                onClick={() => loadPosts(currentPage - 1)}
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
                      onClick={() => loadPosts(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => loadPosts(currentPage + 1)}
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

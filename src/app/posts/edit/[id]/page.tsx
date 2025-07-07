/**
 * 文章编辑页面 - 编辑现有文章
 *
 * 主要功能：
 * 1. 加载现有文章数据
 * 2. Markdown编辑器
 * 3. 文章元信息编辑
 * 4. 分类和标签选择
 * 5. 草稿保存和发布
 * 6. 图片上传
 *
 * 使用技术：
 * - Next.js App Router
 * - Server-side validation
 * - Client-side state management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/FileUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [postId, setPostId] = useState<string>('');

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    featuredImage: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  // 加载文章ID
  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  // 加载文章数据
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.post) {
            const post = result.data.post;
            setFormData({
              title: post.title || '',
              summary: post.summary || '',
              content: post.content || '',
              categoryId: post.categoryId ? post.categoryId.toString() : '',
              featuredImage: post.featuredImage || '',
              status: post.status,
            });
            setSelectedTags(
              post.tags?.map((tag: { name: string }) => tag.name) || []
            );
          }
        } else {
          alert('加载文章失败');
          router.push('/');
        }
      } catch (error) {
        console.error('加载文章失败:', error);
        alert('加载文章失败');
        router.push('/');
      } finally {
        setIsLoadingPost(false);
      }
    };

    loadPost();
  }, [postId, router]);

  // 加载分类
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesRes = await fetch('/api/categories');

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (categoriesData.success && categoriesData.data?.categories) {
            setCategories(categoriesData.data.categories);
          }
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    };

    loadCategories();
  }, []);

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    // 对于草稿，只需要标题或内容其中一个不为空即可
    if (status === 'DRAFT') {
      if (!formData.title.trim() && !formData.content.trim()) {
        alert('请至少填写标题或内容');
        return;
      }
    } else {
      // 对于发布，需要标题和内容都不为空
      if (!formData.title.trim() || !formData.content.trim()) {
        alert('发布文章需要填写标题和内容');
        return;
      }
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        status,
        categoryId: formData.categoryId
          ? parseInt(formData.categoryId)
          : undefined,
        tags: selectedTags,
      };

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      const result = await response.json();
      if (result.success) {
        router.push(`/posts/${postId}`);
      } else {
        throw new Error('保存文章失败');
      }
    } catch (error) {
      console.error('保存文章失败:', error);
      alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAdd = (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
    }
    setTagInput('');
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagName));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleTagAdd(tagInput);
    }
  };

  if (status === 'loading' || isLoadingPost) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">编辑文章</h1>
          <p className="mt-2 text-gray-600">修改你的文章内容</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 主要内容 */}
          <div className="space-y-6 lg:col-span-2">
            {/* 标题 */}
            <Card className="p-6">
              <Input
                label="文章标题"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="输入文章标题..."
                helperText="一个好的标题能吸引更多读者"
                className="text-xl font-semibold"
                required
              />
            </Card>

            {/* 摘要 */}
            <Card className="p-6">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                文章摘要
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="简要描述文章内容..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                rows={3}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                摘要将显示在文章列表中，建议控制在100-200字
              </p>
            </Card>

            {/* Markdown编辑器 */}
            <Card className="p-6">
              <label className="mb-4 block text-sm font-medium text-gray-700">
                文章内容
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={(content: string) =>
                  setFormData({ ...formData, content })
                }
                placeholder="开始写作你的文章..."
              />
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 发布操作 */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">发布</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => handleSubmit('DRAFT')}
                  variant="outline"
                  className="w-full"
                  loading={isLoading}
                >
                  保存草稿
                </Button>
                <Button
                  onClick={() => handleSubmit('PUBLISHED')}
                  variant="default"
                  className="w-full"
                  loading={isLoading}
                >
                  {formData.status === 'PUBLISHED' ? '更新发布' : '立即发布'}
                </Button>
              </div>
            </Card>

            {/* 分类选择 */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">分类</h3>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* 标签 */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">标签</h3>
              <div className="space-y-3">
                <Input
                  label="添加标签"
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTagInput(e.target.value)
                  }
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="输入标签名，按回车或逗号添加"
                  helperText="标签有助于读者发现相关内容"
                />
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagRemove(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* 特色图片 */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                特色图片
              </h3>
              <FileUpload
                onUpload={(url: string) =>
                  setFormData({ ...formData, featuredImage: url })
                }
                onError={(error: string) => alert(error)}
              />
              {formData.featuredImage && (
                <div className="mt-4">
                  <Image
                    src={formData.featuredImage}
                    alt="特色图片"
                    width={128}
                    height={128}
                    className="rounded-lg object-cover"
                  />
                  <button
                    onClick={() =>
                      setFormData({ ...formData, featuredImage: '' })
                    }
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    删除图片
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 文章创建页面 - 写作和发布新文章
 *
 * 主要功能：
 * 1. Markdown编辑器
 * 2. 文章元信息编辑
 * 3. 分类和标签选择
 * 4. 草稿保存和发布
 * 5. 图片上传
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

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    featuredImage: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  // 加载分类和标签
  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesRes = await fetch('/api/categories');

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          // 从 API 响应中提取分类数组
          if (categoriesData.success && categoriesData.data?.categories) {
            setCategories(categoriesData.data.categories);
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };

    loadData();
  }, []);

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
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

      const response = await fetch('/api/posts', {
        method: 'POST',
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
      if (result.success && result.data?.post?.id) {
        router.push(`/posts/${result.data.post.id}`);
      } else {
        throw new Error('创建文章成功但无法获取文章ID');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建文章</h1>
          <p className="mt-2 text-gray-600">分享你的想法和见解</p>
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
                className="text-xl font-semibold"
                required
              />
            </Card>

            {/* 摘要 */}
            <Card className="p-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                文章摘要
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="简要描述文章内容..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </Card>

            {/* Markdown编辑器 */}
            <Card className="p-6">
              <label className="mb-4 block text-sm font-medium text-gray-700">
                文章内容
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
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
                  立即发布
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
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTagInput(e.target.value)
                  }
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="输入标签名，按回车添加"
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
                onUpload={(url) =>
                  setFormData({ ...formData, featuredImage: url })
                }
                onError={(error) => alert(error)}
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

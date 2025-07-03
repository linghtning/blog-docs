/**
 * 分类管理页面 - 管理员管理所有分类
 *
 * 主要功能：
 * 1. 分类列表展示
 * 2. 创建新分类
 * 3. 编辑分类信息
 * 4. 删除分类
 * 5. 分类排序
 *
 * 权限要求：
 * - 仅管理员可访问
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  postsCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryData {
  name: string;
  description: string;
  color: string;
  sortOrder: number;
}

export default function CategoriesManagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    description: '',
    color: '#007bff',
    sortOrder: 0,
  });

  // 权限检查
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories(data.data.categories);
        }
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      loadCategories();
    }
  }, [status, session]);

  // 创建分类
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories([...categories, data.data.category]);
          setFormData({
            name: '',
            description: '',
            color: '#007bff',
            sortOrder: 0,
          });
          setIsModalOpen(false);
          alert('分类创建成功');
        }
      } else {
        const error = await response.json();
        alert(error.error?.message || '创建失败');
      }
    } catch (error) {
      console.error('创建分类失败:', error);
      alert('创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 编辑分类
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      sortOrder: category.sortOrder,
    });
    setIsModalOpen(true);
  };

  // 更新分类
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories(
            categories.map((cat) =>
              cat.id === editingCategory.id ? data.data.category : cat
            )
          );
          setFormData({
            name: '',
            description: '',
            color: '#007bff',
            sortOrder: 0,
          });
          setEditingCategory(null);
          setIsModalOpen(false);
          alert('分类更新成功');
        }
      } else {
        const error = await response.json();
        alert(error.error?.message || '更新失败');
      }
    } catch (error) {
      console.error('更新分类失败:', error);
      alert('更新失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (categoryId: number) => {
    if (
      !confirm(
        '确定要删除这个分类吗？删除后该分类下的文章将不再归属于任何分类。'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== categoryId));
        alert('分类删除成功');
      } else {
        const error = await response.json();
        alert(error.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      alert('删除失败');
    }
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#007bff',
      sortOrder: 0,
    });
  };

  if (
    status === 'loading' ||
    (status === 'authenticated' && session?.user?.role !== 'ADMIN')
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
            <p className="mt-2 text-gray-600">管理博客的所有分类</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            创建分类
          </Button>
        </div>

        {/* 分类列表 */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {category.postsCount} 篇文章
                  </span>
                </div>

                {category.description && (
                  <p className="mb-4 line-clamp-2 text-gray-600">
                    {category.description}
                  </p>
                )}

                <div className="mb-4 text-sm text-gray-500">
                  <p>别名: {category.slug}</p>
                  <p>排序: {category.sortOrder}</p>
                  <p>
                    创建时间:{' '}
                    {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    删除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 创建/编辑分类模态框 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {editingCategory ? '编辑分类' : '创建分类'}
              </h3>

              <form
                onSubmit={
                  editingCategory ? handleUpdateCategory : handleCreateCategory
                }
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      分类名称 *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="输入分类名称"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      分类描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="输入分类描述"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      分类颜色
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="h-10 w-20 rounded border border-gray-300"
                      />
                      <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="#007bff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      排序权重
                    </label>
                    <Input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={isCreating}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating
                      ? '保存中...'
                      : editingCategory
                        ? '更新分类'
                        : '创建分类'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

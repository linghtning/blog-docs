'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  createdAt: string;
  profile?: {
    website?: string;
    github?: string;
    twitter?: string;
    location?: string;
    company?: string;
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
}

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatarUrl: '',
    website: '',
    github: '',
    twitter: '',
    location: '',
    company: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setFormData({
          username: data.data.user.username || '',
          bio: data.data.user.bio || '',
          avatarUrl: data.data.user.avatarUrl || '',
          website: data.data.user.profile?.website || '',
          github: data.data.user.profile?.github || '',
          twitter: data.data.user.profile?.twitter || '',
          location: data.data.user.profile?.location || '',
          company: data.data.user.profile?.company || '',
        });
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除错误
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setIsEditing(false);
      } else {
        if (data.error?.code === 'USERNAME_EXISTS') {
          setErrors({ username: '用户名已存在' });
        } else if (data.error?.code === 'VALIDATION_ERROR') {
          const fieldErrors: { [key: string]: string } = {};
          data.error.details?.forEach(
            (error: { path: string[]; message: string }) => {
              fieldErrors[error.path[0]] = error.message;
            }
          );
          setErrors(fieldErrors);
        } else {
          setErrors({ submit: data.error?.message || '更新失败' });
        }
      }
    } catch (error) {
      console.error('更新资料失败:', error);
      setErrors({ submit: '网络错误，请稍后重试' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        website: user.profile?.website || '',
        github: user.profile?.github || '',
        twitter: user.profile?.twitter || '',
        location: user.profile?.location || '',
        company: user.profile?.company || '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="text-center">用户不存在</div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 用户信息卡片 */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.username}
                    width={80}
                    height={80}
                    className="mx-auto rounded-full"
                  />
                ) : (
                  <div className="flex justify-center items-center mx-auto w-20 h-20 bg-gray-300 rounded-full">
                    <span className="text-xl font-bold text-gray-600">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="text-gray-600">{user.email}</p>
              {user.bio && (
                <p className="mt-2 text-sm text-gray-700">{user.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <div className="font-bold">
                    {user.profile?.postsCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">文章</div>
                </div>
                <div>
                  <div className="font-bold">
                    {user.profile?.followersCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">关注者</div>
                </div>
                <div>
                  <div className="font-bold">
                    {user.profile?.followingCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">关注中</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 编辑资料表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>个人资料</CardTitle>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>编辑资料</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="用户名"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    placeholder="用户名"
                  />

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      个人简介
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="介绍一下自己..."
                      rows={3}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.bio && (
                      <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                    )}
                  </div>

                  <Input
                    label="头像URL"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    error={errors.avatarUrl}
                    placeholder="https://example.com/avatar.jpg"
                  />

                  <Input
                    label="个人网站"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    error={errors.website}
                    placeholder="https://yourwebsite.com"
                  />

                  <Input
                    label="GitHub"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    error={errors.github}
                    placeholder="github用户名"
                  />

                  <Input
                    label="Twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    error={errors.twitter}
                    placeholder="twitter用户名"
                  />

                  <Input
                    label="所在地"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                    placeholder="城市, 国家"
                  />

                  <Input
                    label="公司"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    error={errors.company}
                    placeholder="公司名称"
                  />

                  {errors.submit && (
                    <div className="text-sm text-red-600">{errors.submit}</div>
                  )}

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                    >
                      取消
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        用户名
                      </label>
                      <p className="mt-1">{user.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        邮箱
                      </label>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        角色
                      </label>
                      <p className="mt-1">
                        {user.role === 'ADMIN'
                          ? '管理员'
                          : user.role === 'AUTHOR'
                            ? '作者'
                            : '用户'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        注册时间
                      </label>
                      <p className="mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {user.profile?.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          网站
                        </label>
                        <p className="mt-1">
                          <a
                            href={user.profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {user.profile.website}
                          </a>
                        </p>
                      </div>
                    )}
                    {user.profile?.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          所在地
                        </label>
                        <p className="mt-1">{user.profile.location}</p>
                      </div>
                    )}
                    {user.profile?.company && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          公司
                        </label>
                        <p className="mt-1">{user.profile.company}</p>
                      </div>
                    )}
                  </div>

                  {user.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        个人简介
                      </label>
                      <p className="mt-1">{user.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

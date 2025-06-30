/**
 * 用户登录页面 - 用户身份验证和登录表单
 *
 * 主要功能：
 * 1. 用户邮箱密码登录表单
 * 2. 客户端表单验证
 * 3. 登录状态管理和错误处理
 * 4. 登录成功后的页面重定向
 * 5. 注册页面链接引导
 *
 * 表单验证：
 * - 邮箱格式验证
 * - 密码长度验证
 * - 实时错误提示
 * - 防止重复提交
 *
 * 用户体验：
 * - 加载状态指示
 * - 错误信息显示
 * - 响应式布局
 * - 无障碍访问
 *
 * 安全特性：
 * - NextAuth.js 认证
 * - CSRF 保护
 * - 客户端验证
 * - 安全重定向
 *
 * 使用技术：
 * - Next.js 客户端组件
 * - NextAuth.js signIn
 * - React Hooks 状态管理
 * - TypeScript 类型安全
 */
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 清除该字段的错误
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = '邮箱不能为空';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      console.log('result :>> ', result);

      if (result?.error) {
        setErrors({ submit: '邮箱或密码错误' });
      } else {
        // 登录成功，重定向到首页
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('登录失败:', error);
      setErrors({ submit: '登录失败，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">登录账户</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="邮箱"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="请输入邮箱"
              required
            />

            <Input
              label="密码"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="请输入密码"
              required
            />

            {errors.submit && (
              <div className="text-center text-sm text-red-600">
                {errors.submit}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            还没有账户？
            <Link
              href="/auth/register"
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              立即注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

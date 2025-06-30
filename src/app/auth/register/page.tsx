/**
 * 用户注册页面 - 新用户账户创建表单
 *
 * 主要功能：
 * 1. 新用户注册表单处理
 * 2. 服务器操作集成（Server Actions）
 * 3. 实时表单验证和错误显示
 * 4. 注册成功后重定向到登录页
 * 5. 登录页面链接引导
 *
 * 表单字段：
 * - 用户名（3-20字符，字母数字下划线）
 * - 邮箱地址（有效邮箱格式）
 * - 密码（至少6字符，包含字母数字）
 * - 确认密码（密码一致性验证）
 *
 * 错误处理：
 * - 服务器端验证错误显示
 * - 用户名/邮箱重复检查
 * - 详细的验证错误列表
 * - 网络错误处理
 *
 * 特性：
 * - React 19 useTransition
 * - Server Actions 集成
 * - 无 JavaScript 降级支持
 * - 实时状态更新
 *
 * 使用技术：
 * - Next.js 15 Server Actions
 * - React 19 Transitions
 * - TypeScript 类型定义
 * - 表单原生提交
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { registerUser } from '@/lib/actions';

type RegisterState = {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      path: (string | number)[];
      message: string;
      code?: string;
    }>;
  };
  data?: {
    user?: {
      id: string;
      username: string;
      email: string;
      createdAt: Date;
    };
  };
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<RegisterState>({ success: true });

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await registerUser(formData);
      setState(result);

      if (result.success) {
        router.push('/auth/login?message=注册成功，请登录');
      }
    });
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">注册账户</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <Input
              label="用户名"
              type="text"
              name="username"
              error={
                state?.error?.code === 'USERNAME_EXISTS'
                  ? '用户名已存在'
                  : undefined
              }
              placeholder="3-20个字符，只能包含字母、数字和下划线"
              required
            />

            <Input
              label="邮箱"
              type="email"
              name="email"
              error={
                state?.error?.code === 'EMAIL_EXISTS'
                  ? '邮箱已被使用'
                  : undefined
              }
              placeholder="请输入邮箱地址"
              required
            />

            <Input
              label="密码"
              type="password"
              name="password"
              placeholder="至少6个字符，必须包含字母和数字"
              required
            />

            <Input
              label="确认密码"
              type="password"
              name="confirmPassword"
              placeholder="请再次输入密码"
              required
            />

            {state?.error && state.error.code === 'VALIDATION_ERROR' && (
              <div className="text-sm text-red-600">
                <ul className="list-inside list-disc">
                  {state.error.details?.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {state?.error && ['INTERNAL_ERROR'].includes(state.error.code) && (
              <div className="text-center text-sm text-red-600">
                {state.error.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              loading={isPending}
            >
              {isPending ? '注册中...' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            已有账户？
            <Link
              href="/auth/login"
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

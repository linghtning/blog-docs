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
    <div className="container px-4 py-16 mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">注册账户</CardTitle>
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
                <ul className="list-disc list-inside">
                  {state.error.details?.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {state?.error && ['INTERNAL_ERROR'].includes(state.error.code) && (
              <div className="text-sm text-center text-red-600">
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

          <div className="mt-6 text-sm text-center text-gray-600">
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

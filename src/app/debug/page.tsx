/**
 * 调试页面 - 用于检查用户文章查询问题
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DebugInfo {
  session: unknown;
  userId?: string;
  userIdType: string;
  username?: string;
  email?: string;
}

interface ApiResponse {
  success?: boolean;
  data?: unknown;
  error?: string | { message?: string };
}

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  // 检查用户信息
  const checkUserInfo = () => {
    console.log('Session:', session);
    setDebugInfo({
      session: session,
      userId: session?.user?.id,
      userIdType: typeof session?.user?.id,
      username: session?.user?.username,
      email: session?.user?.email,
    });
  };

  // 测试API调用
  const testApiCall = async () => {
    if (!session?.user?.id) return;

    try {
      console.log('测试API调用，用户ID:', session.user.id);

      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        authorId: session.user.id,
      });

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();

      console.log('API响应:', data);
      setApiResponse(data);
    } catch (error) {
      console.error('API调用失败:', error);
      setApiResponse({ error: (error as Error).message });
    }
  };

  // 创建测试文章
  const createTestPost = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '测试文章',
          content: '这是一篇测试文章的内容。',
          summary: '测试文章摘要',
          status: 'DRAFT',
        }),
      });

      const data = await response.json();
      console.log('创建文章响应:', data);

      if (data.success) {
        alert('测试文章创建成功！');
        testApiCall(); // 重新获取文章列表
      } else {
        alert('创建失败: ' + (data.error?.message || '未知错误'));
      }
    } catch (error) {
      console.error('创建文章失败:', error);
      alert('创建失败: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      checkUserInfo();
      testApiCall();
    }
  }, [session?.user?.id]);

  if (status === 'loading') {
    return <div>加载中...</div>;
  }

  if (!session) {
    return <div>请先登录</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-2xl font-bold">调试页面</h1>

      <div className="space-y-6">
        {/* 用户信息 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">用户信息</h2>
          <div className="space-y-2">
            <Button onClick={checkUserInfo}>刷新用户信息</Button>
            {debugInfo && (
              <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            )}
          </div>
        </Card>

        {/* API测试 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">API测试</h2>
          <div className="space-y-2">
            <Button onClick={testApiCall}>测试获取文章API</Button>
            {apiResponse && (
              <pre className="max-h-64 overflow-auto rounded bg-gray-100 p-4 text-sm">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        </Card>

        {/* 创建测试数据 */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">测试数据</h2>
          <div className="space-y-2">
            <Button
              onClick={createTestPost}
              className="bg-green-600 hover:bg-green-700"
            >
              创建测试文章
            </Button>
            <p className="text-sm text-gray-600">
              如果您没有任何文章，可以点击此按钮创建一篇测试文章
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

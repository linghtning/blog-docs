/**
 * Auth.js v5 会话提供者组件 - 客户端认证状态管理
 *
 * 主要功能：
 * 1. 为整个应用提供认证上下文
 * 2. 管理客户端会话状态
 * 3. 支持会话的自动刷新和同步
 * 4. 提供 useSession hook 的上下文环境
 *
 * 使用场景：
 * - 在 root layout 中包装整个应用
 * - 为子组件提供认证状态访问
 * - 处理登录状态的全局同步
 *
 * 配置选项：
 * - refetchInterval: 会话刷新间隔
 * - refetchOnWindowFocus: 窗口获得焦点时是否刷新
 * - basePath: Auth.js API 的基础路径
 *
 * 使用技术：
 * - Auth.js v5 React Provider
 * - React Context API
 * - Next.js 15 App Router
 */
'use client';

import { SessionProvider as AuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <AuthSessionProvider
      // 配置会话刷新间隔（5分钟）
      refetchInterval={5 * 60}
      // 当窗口重新获得焦点时刷新会话
      refetchOnWindowFocus={true}
      // Auth.js API 基础路径
      basePath="/api/auth"
    >
      {children}
    </AuthSessionProvider>
  );
}

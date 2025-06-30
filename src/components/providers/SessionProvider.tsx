/**
 * NextAuth.js 会话提供者组件 - 全局用户会话状态管理
 *
 * 主要功能：
 * 1. 包装 NextAuth 的 SessionProvider
 * 2. 为整个应用提供用户会话上下文
 * 3. 管理登录状态和用户信息
 * 4. 处理会话更新和同步
 *
 * 设计目的：
 * - 简化 NextAuth SessionProvider 的使用
 * - 提供一致的会话管理接口
 * - 便于后续扩展和自定义
 * - 保持代码的清洁和可维护性
 *
 * 使用位置：
 * - 在根布局 (layout.tsx) 中包装整个应用
 * - 作为所有页面和组件的会话上下文
 *
 * 依赖关系：
 * - NextAuth.js 会话管理
 * - React Context API
 * - 客户端组件标识
 *
 * 使用技术：
 * - NextAuth.js SessionProvider
 * - React 客户端组件
 * - TypeScript 接口定义
 */
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

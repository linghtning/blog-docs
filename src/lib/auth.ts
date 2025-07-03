/**
 * Auth.js v5 认证配置 - 用户身份验证和会话管理
 *
 * 主要功能：
 * 1. 配置认证提供者（邮箱密码登录）
 * 2. 处理用户登录验证逻辑
 * 3. 管理 JWT 令牌和会话
 * 4. 扩展 Auth.js 类型定义
 * 5. 集成 Prisma 数据库适配器
 *
 * 认证流程：
 * - 用户输入邮箱和密码
 * - 验证输入数据格式
 * - 查询数据库中的用户信息
 * - 比较密码哈希值
 * - 生成 JWT 令牌和会话
 *
 * 安全特性：
 * - bcryptjs 密码哈希
 * - Zod 数据验证
 * - JWT 会话策略
 * - 角色权限控制
 *
 * 使用技术：
 * - Auth.js v5
 * - Prisma ORM
 * - bcryptjs 加密
 * - Zod 验证库
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 扩展 Auth.js 类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      avatarUrl?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    avatarUrl?: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string;
    username?: string;
    avatarUrl?: string | null;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
          });

          console.log('email :>> ', email);

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
});

/**
 * Next.js 服务器操作 - 表单处理和数据操作
 *
 * 主要功能：
 * 1. 用户注册逻辑处理
 * 2. 用户资料更新操作
 * 3. 表单数据验证和清洗
 * 4. 数据库操作封装
 * 5. 错误处理和响应格式化
 *
 * 安全特性：
 * - Zod 数据验证模式
 * - bcryptjs 密码加密
 * - 重复性检查（用户名、邮箱）
 * - 会话认证验证
 *
 * 错误处理：
 * - 统一错误响应格式
 * - 详细的验证错误信息
 * - 数据库约束冲突处理
 * - 服务器内部错误捕获
 *
 * 使用技术：
 * - Next.js 15 Server Actions
 * - Prisma ORM 数据操作
 * - Zod 数据验证
 * - NextAuth.js 会话管理
 * - bcryptjs 密码哈希
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 表单数据验证模式
const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(50, '密码最多50个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含字母和数字'),
});

const profileUpdateSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().max(50).optional(),
  twitter: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
});

// 用户注册 Server Action
export async function registerUser(formData: FormData) {
  try {
    const rawData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const { username, email, password } = registerSchema.parse(rawData);

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return {
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: '用户名已存在',
        },
      };
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: '邮箱已被使用',
        },
      };
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        profile: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: { user: { ...user, id: user.id.toString() } },
      message: '注册成功',
    };
  } catch (error) {
    console.error('注册失败:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details: error.errors,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      },
    };
  }
}

// 更新用户资料 Server Action
export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未登录',
        },
      };
    }

    const rawData = {
      username: (formData.get('username') as string) || undefined,
      bio: (formData.get('bio') as string) || undefined,
      avatarUrl: (formData.get('avatarUrl') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      github: (formData.get('github') as string) || undefined,
      twitter: (formData.get('twitter') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      company: (formData.get('company') as string) || undefined,
    };

    const validatedData = profileUpdateSchema.parse(rawData);

    // 如果更新用户名，检查是否已存在
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: BigInt(session.user.id) },
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: '用户名已存在',
          },
        };
      }
    }

    // 分离用户表和资料表的数据
    const { username, bio, avatarUrl, ...profileData } = validatedData;

    // 更新用户基本信息
    const userUpdateData: {
      username?: string;
      bio?: string;
      avatarUrl?: string;
    } = {};
    if (username !== undefined) userUpdateData.username = username;
    if (bio !== undefined) userUpdateData.bio = bio;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(session.user.id) },
      data: {
        ...userUpdateData,
        profile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            website: true,
            github: true,
            twitter: true,
            location: true,
            company: true,
            postsCount: true,
            followersCount: true,
            followingCount: true,
          },
        },
      },
    });

    // 重新验证缓存
    revalidatePath('/profile');

    return {
      success: true,
      data: { user: { ...updatedUser, id: updatedUser.id.toString() } },
      message: '资料更新成功',
    };
  } catch (error) {
    console.error('更新用户资料失败:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details: error.errors,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      },
    };
  }
}

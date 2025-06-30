/**
 * 用户资料 API 路由 - 处理用户个人信息的获取和更新
 *
 * 支持的HTTP方法：
 * - GET: 获取当前用户的详细资料信息
 * - PUT: 更新当前用户的资料信息
 *
 * 主要功能：
 * 1. 身份验证和权限检查
 * 2. 用户资料信息查询
 * 3. 用户资料信息更新
 * 4. 数据验证和格式化
 * 5. 错误处理和响应
 *
 * GET 端点功能：
 * - 验证用户登录状态
 * - 查询用户基本信息和扩展资料
 * - 包含社交链接和统计数据
 * - 返回序列化的用户数据
 *
 * PUT 端点功能：
 * - 验证用户登录状态和权限
 * - 数据验证（用户名、链接等）
 * - 检查用户名唯一性
 * - 分别更新用户表和资料表
 * - 返回更新后的完整数据
 *
 * 数据验证规则：
 * - 用户名：3-20字符，仅字母数字下划线
 * - 个人简介：最多500字符
 * - 头像URL：有效的URL格式
 * - 网站链接：有效的URL格式
 * - 社交账号：最多100字符
 *
 * 安全特性：
 * - NextAuth 会话验证
 * - Zod 数据验证
 * - 用户名重复检查
 * - 数据库事务处理
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - NextAuth.js 会话管理
 * - Prisma ORM 数据操作
 * - Zod 数据验证
 * - BigInt 序列化处理
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
    .optional(),
  bio: z.string().max(500, '个人简介最多500个字符').optional(),
  avatarUrl: z.string().url('头像URL格式不正确').optional(),
  website: z.string().url('网站URL格式不正确').optional(),
  github: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
});

// 获取用户资料
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未登录',
          },
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.user.id) },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
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

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        },
        { status: 404 }
      );
    }

    // 转换 BigInt 为字符串以避免序列化问题
    const serializedUser = {
      ...user,
      id: user.id.toString(),
    };

    return NextResponse.json({
      success: true,
      data: { user: serializedUser },
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
        },
      },
      { status: 500 }
    );
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未登录',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 如果更新用户名，检查是否已存在
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: BigInt(session.user.id) },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USERNAME_EXISTS',
              message: '用户名已存在',
            },
          },
          { status: 400 }
        );
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

    // 转换 BigInt 为字符串以避免序列化问题
    const serializedUpdatedUser = {
      ...updatedUser,
      id: updatedUser.id.toString(),
    };

    return NextResponse.json({
      success: true,
      data: { user: serializedUpdatedUser },
      message: '资料更新成功',
    });
  } catch (error) {
    console.error('更新用户资料失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '数据验证失败',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
        },
      },
      { status: 500 }
    );
  }
}

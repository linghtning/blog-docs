/**
 * 用户注册 API 路由 - 处理新用户注册请求
 *
 * 主要功能：
 * 1. 处理用户注册表单提交
 * 2. 数据验证和安全检查
 * 3. 密码加密和用户创建
 * 4. 防止恶意注册攻击
 * 5. 返回标准化的 API 响应
 *
 * 安全特性：
 * - 请求频率限制（防止暴力注册）
 * - Zod 数据验证（防止无效数据）
 * - bcryptjs 密码哈希（密码安全）
 * - 重复性检查（用户名、邮箱唯一性）
 * - IP 地址追踪（安全审计）
 *
 * 验证规则：
 * - 用户名：3-20字符，仅字母数字下划线
 * - 邮箱：有效邮箱格式
 * - 密码：6-50字符，必须包含字母和数字
 *
 * 错误处理：
 * - 验证错误：400状态码，详细错误信息
 * - 重复数据：400状态码，具体冲突提示
 * - 频率限制：429状态码，重试提示
 * - 服务器错误：500状态码，通用错误信息
 *
 * 数据库操作：
 * - 创建用户记录
 * - 创建关联的用户资料
 * - 事务性操作确保数据一致性
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - Prisma ORM 数据操作
 * - bcryptjs 密码加密
 * - Zod 数据验证
 * - 自定义限流中间件
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

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

export async function POST(request: NextRequest) {
  try {
    // 速率限制 - Next.js 15 中使用 headers 获取客户端 IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const identifier = forwarded?.split(',')[0] ?? realIp ?? 'anonymous';

    try {
      await rateLimit.consume(identifier);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 数据验证
    const { username, email, password } = registerSchema.parse(body);

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
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

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: '邮箱已被使用',
          },
        },
        { status: 400 }
      );
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
        avatarUrl: true,
        createdAt: true,
        profile: true,
      },
    });

    // 转换BigInt为字符串以避免序列化错误
    const userData = {
      ...user,
      id: user.id.toString(),
      profile: user.profile
        ? {
            ...user.profile,
            userId: user.profile.userId.toString(),
          }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: { user: userData },
        message: '注册成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('注册失败:', error);

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

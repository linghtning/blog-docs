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

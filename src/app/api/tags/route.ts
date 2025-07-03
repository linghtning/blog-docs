/**
 * 标签 API 路由 - 处理博客标签的管理操作
 *
 * 主要功能：
 * 1. 获取标签列表（支持搜索和限制数量）
 * 2. 创建新标签（需要登录）
 * 3. 标签去重处理（避免重复创建）
 * 4. 自动生成标签别名
 * 5. 按文章数量和名称排序
 *
 * 安全特性：
 * - 身份验证检查（创建标签需要登录）
 * - Zod 数据验证（防止无效数据）
 * - 标签重复检查（返回已存在的标签）
 * - 颜色格式验证（HEX格式）
 * - 标签名称长度限制
 *
 * 验证规则：
 * - 标签名称：1-50字符，必填
 * - 标签颜色：HEX格式，默认#6c757d
 * - 搜索关键词：可选，用于过滤标签
 * - 限制数量：默认20个，可调整
 *
 * 查询功能：
 * - 支持按名称搜索标签
 * - 按文章数量降序排列
 * - 次要按名称升序排列
 * - 支持限制返回数量
 *
 * 错误处理：
 * - 未授权：401状态码，未登录提示
 * - 验证错误：400状态码，详细错误信息
 * - 服务器错误：500状态码，通用错误信息
 *
 * 数据库操作：
 * - 查询标签列表（支持搜索）
 * - 创建标签记录
 * - 检查标签唯一性
 * - 生成标签别名
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - NextAuth.js 身份验证
 * - Prisma ORM 数据操作
 * - Zod 数据验证
 * - slugify 别名生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const createTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称最多50个字符'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '颜色格式不正确，请使用HEX格式')
    .default('#6c757d'),
});

const querySchema = z.object({
  search: z.string().optional(),
  limit: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 20 : Math.min(Math.max(num, 1), 100);
    })
    .default('20'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      search: searchParams.get('search'),
      limit: searchParams.get('limit') || '20',
    });

    const where = query.search
      ? {
          name: {
            contains: query.search,
          },
        }
      : {};

    const tags = await prisma.tag.findMany({
      where,
      orderBy: [{ postsCount: 'desc' }, { name: 'asc' }],
      take: query.limit,
    });

    return NextResponse.json({
      success: true,
      data: { tags },
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '查询参数验证失败',
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
          message: '获取标签列表失败',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
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
    const data = createTagSchema.parse(body);

    // 检查标签是否已存在
    const existingTag = await prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (existingTag) {
      return NextResponse.json({
        success: true,
        data: { tag: existingTag },
        message: '标签已存在',
      });
    }

    // 生成标签别名
    const slug = slugify(data.name, { lower: true, strict: true });

    const tag = await prisma.tag.create({
      data: {
        ...data,
        slug,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { tag },
        message: '标签创建成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建标签失败:', error);

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
          message: '创建标签失败',
        },
      },
      { status: 500 }
    );
  }
}

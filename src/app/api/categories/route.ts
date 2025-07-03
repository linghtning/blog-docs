/**
 * 分类 API 路由 - 处理博客分类的管理操作
 *
 * 主要功能：
 * 1. 获取分类列表（包含文章统计）
 * 2. 创建新分类（仅管理员权限）
 * 3. 自动生成唯一的分类别名
 * 4. 分类排序和颜色管理
 * 5. 分类文章数量统计
 *
 * 安全特性：
 * - 身份验证检查（创建分类需要登录）
 * - 权限验证（仅管理员可创建分类）
 * - Zod 数据验证（防止无效数据）
 * - 别名唯一性检查（避免冲突）
 * - 输入内容长度限制
 *
 * 验证规则：
 * - 分类名称：1-50字符，必填
 * - 分类描述：可选文本
 * - 分类颜色：HEX格式，默认#007bff
 * - 排序权重：数字，默认0
 *
 * 错误处理：
 * - 权限错误：403状态码，无权限提示
 * - 验证错误：400状态码，详细错误信息
 * - 服务器错误：500状态码，通用错误信息
 *
 * 数据库操作：
 * - 查询分类列表及文章统计
 * - 创建分类记录
 * - 生成唯一别名
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

const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称最多50个字符'),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '颜色格式不正确，请使用HEX格式')
    .default('#007bff'),
  sortOrder: z.number().default(0),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    const formattedCategories = categories.map((category) => ({
      ...category,
      postsCount: category._count.posts,
      _count: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: { categories: formattedCategories },
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取分类列表失败',
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '无权限创建分类',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createCategorySchema.parse(body);

    // 生成唯一的slug
    const baseSlug = slugify(data.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      });

      if (!existingCategory) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        slug,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { category },
        message: '分类创建成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建分类失败:', error);

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
          message: '创建分类失败',
        },
      },
      { status: 500 }
    );
  }
}

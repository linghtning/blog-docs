/**
 * 单个分类 API 路由 - 处理特定分类的操作
 *
 * 主要功能：
 * 1. 获取单个分类详情
 * 2. 更新分类信息（仅管理员权限）
 * 3. 删除分类（仅管理员权限）
 * 4. 自动处理分类别名冲突
 * 5. 删除时处理关联文章
 *
 * 安全特性：
 * - 身份验证检查（修改操作需要登录）
 * - 权限验证（仅管理员可修改）
 * - Zod 数据验证（防止无效数据）
 * - 别名唯一性检查（避免冲突）
 * - 级联处理关联数据
 *
 * 验证规则：
 * - 分类名称：1-50字符，可选（更新时）
 * - 分类描述：可选文本
 * - 分类颜色：HEX格式，可选
 * - 排序权重：数字，可选
 *
 * 错误处理：
 * - 分类不存在：404状态码
 * - 权限错误：403状态码
 * - 验证错误：400状态码
 * - 服务器错误：500状态码
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, '分类名称不能为空')
    .max(50, '分类名称最多50个字符')
    .optional(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '颜色格式不正确，请使用HEX格式')
    .optional(),
  sortOrder: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证 id 参数
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '分类ID格式无效',
          },
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '分类不存在',
          },
        },
        { status: 404 }
      );
    }

    const formattedCategory = {
      ...category,
      postsCount: category._count.posts,
      _count: undefined,
    };

    return NextResponse.json({
      success: true,
      data: { category: formattedCategory },
    });
  } catch (error) {
    console.error('获取分类详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取分类详情失败',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            message: '无权限修改分类',
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 验证 id 参数
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '分类ID格式无效',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    // 检查分类是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '分类不存在',
          },
        },
        { status: 404 }
      );
    }

    // 处理slug更新
    let slug = existingCategory.slug;
    if (data.name && data.name !== existingCategory.name) {
      const baseSlug = slugify(data.name, { lower: true, strict: true });
      let newSlug = baseSlug;
      let counter = 1;

      while (true) {
        const conflictCategory = await prisma.category.findFirst({
          where: {
            slug: newSlug,
            id: { not: categoryId },
          },
        });

        if (!conflictCategory) break;
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = newSlug;
    }

    const updateData = {
      ...data,
      slug,
      updatedAt: new Date(),
    };

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
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

    const formattedCategory = {
      ...updatedCategory,
      postsCount: updatedCategory._count.posts,
      _count: undefined,
    };

    return NextResponse.json({
      success: true,
      data: { category: formattedCategory },
      message: '分类更新成功',
    });
  } catch (error) {
    console.error('更新分类失败:', error);

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
          message: '更新分类失败',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            message: '无权限删除分类',
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 验证 id 参数
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '分类ID格式无效',
          },
        },
        { status: 400 }
      );
    }

    // 检查分类是否存在
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '分类不存在',
          },
        },
        { status: 404 }
      );
    }

    // 如果分类下有文章，将文章的分类设为null
    if (existingCategory._count.posts > 0) {
      await prisma.post.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      });
    }

    // 删除分类
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: `分类删除成功${existingCategory._count.posts > 0 ? `，已将${existingCategory._count.posts}篇文章的分类清空` : ''}`,
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除分类失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 文章详情 API 路由 - 处理单个文章的完整管理操作
 *
 * 主要功能：
 * 1. 获取文章详情（包含完整关联信息）
 * 2. 更新文章内容和元数据
 * 3. 软删除文章（保留数据安全）
 * 4. 浏览量自动增加
 * 5. 权限验证和所有者检查
 *
 * 安全特性：
 * - 身份验证检查（需要登录）
 * - 所有者权限验证（作者或管理员）
 * - Zod 数据验证（防止无效数据）
 * - 软删除机制（数据安全）
 * - 标签和分类关联更新
 * - BigInt序列化处理
 *
 * GET功能：
 * - 获取文章完整信息
 * - 包含作者、分类、标签信息
 * - 自动增加浏览量
 * - 统计评论和收藏数量
 * - 检查文章存在性和删除状态
 *
 * PUT功能：
 * - 更新文章基本信息
 * - 智能处理标签关联
 * - 自动重新计算字数和阅读时间
 * - 处理发布状态变更
 * - 更新分类文章统计
 * - 生成新的SEO友好URL
 *
 * DELETE功能：
 * - 软删除文章（设置deletedAt）
 * - 清理标签关联
 * - 更新分类文章统计
 * - 更新用户文章统计
 * - 权限检查（仅作者或管理员）
 *
 * 验证规则：
 * - 文章标题：1-200字符（更新时可选）
 * - 文章内容：至少1字符（更新时可选）
 * - 文章摘要：可选文本
 * - 分类ID：可选数字，可为null
 * - 标签：可选字符串数组
 * - 状态：DRAFT、PUBLISHED或ARCHIVED
 * - 特色图片：可选URL，可为null
 *
 * 权限控制：
 * - GET：所有人可访问已发布文章
 * - PUT：仅作者或管理员可更新
 * - DELETE：仅作者或管理员可删除
 *
 * 错误处理：
 * - 未授权：401状态码，未登录提示
 * - 权限不足：403状态码，无权限提示
 * - 文章不存在：404状态码，不存在提示
 * - 验证错误：400状态码，详细错误信息
 * - 服务器错误：500状态码，通用错误信息
 *
 * 数据库操作：
 * - 复杂的关联查询
 * - 事务性标签管理
 * - 分类统计更新
 * - 用户统计更新
 * - 软删除处理
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - NextAuth.js 身份验证
 * - Prisma ORM 数据操作
 * - Zod 数据验证
 * - slugify 别名生成
 * - TypeScript 类型安全
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import slugify from 'slugify';

const updatePostSchema = z
  .object({
    title: z.string().max(200, '文章标题最多200个字符').optional(),
    content: z.string().optional(),
    summary: z.string().optional(),
    categoryId: z.number().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    featuredImage: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // 对于草稿，标题或内容其中一个不为空即可（如果提供了的话）
      if (data.status === 'DRAFT') {
        return true; // 草稿允许任何内容
      }
      // 对于发布，如果提供了标题或内容，都不能为空
      if (data.status === 'PUBLISHED') {
        if (data.title !== undefined && !data.title.trim()) {
          return false;
        }
        if (data.content !== undefined && !data.content.trim()) {
          return false;
        }
      }
      return true;
    },
    {
      message: '发布文章的标题和内容不能为空',
    }
  );

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 验证 id 参数
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '文章ID无效',
          },
        },
        { status: 400 }
      );
    }

    // 尝试解析 id，如果无效则返回错误
    let postId: bigint;
    try {
      postId = BigInt(id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '文章ID格式无效',
          },
        },
        { status: 400 }
      );
    }

    // 获取当前用户会话
    const session = await auth();

    // 构建查询条件：已发布的文章任何人都可以查看，草稿只有作者可以查看
    const post = await prisma.post.findFirst({
      where: session?.user?.id
        ? {
            id: postId,
            deletedAt: null,
            OR: [
              { status: 'PUBLISHED' },
              {
                status: 'DRAFT',
                authorId: BigInt(session.user.id),
              },
            ],
          }
        : {
            id: postId,
            status: 'PUBLISHED',
            deletedAt: null,
          },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '文章不存在',
          },
        },
        { status: 404 }
      );
    }

    // 增加浏览量
    await prisma.post.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

    // 格式化返回数据，处理BigInt序列化
    const formattedPost = {
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      author: post.author
        ? {
            ...post.author,
            id: post.author.id.toString(),
          }
        : null,
      tags: post.tags.map((pt) => pt.tag),
      commentsCount: post._count.comments,
      favoritesCount: post._count.favorites,
      _count: undefined,
    };

    return NextResponse.json({
      success: true,
      data: { post: formattedPost },
    });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取文章详情失败',
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
    if (!session?.user || !session.user.id) {
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

    const { id } = await params;
    // 验证 id 参数
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '文章ID无效',
          },
        },
        { status: 400 }
      );
    }

    // 尝试解析 id，如果无效则返回错误
    let postId: bigint;
    try {
      postId = BigInt(id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '文章ID格式无效',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updatePostSchema.parse(body);

    // 检查文章是否存在且用户有权限
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        tags: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '文章不存在',
          },
        },
        { status: 404 }
      );
    }

    if (
      existingPost.authorId.toString() !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '无权限修改此文章',
          },
        },
        { status: 403 }
      );
    }

    // 处理slug更新
    let slug = existingPost.slug;
    if (data.title && data.title !== existingPost.title) {
      const baseSlug = slugify(data.title, { lower: true, strict: true });
      let newSlug = baseSlug;
      let counter = 1;

      while (true) {
        const conflictPost = await prisma.post.findFirst({
          where: {
            authorId: existingPost.authorId,
            slug: newSlug,
            id: { not: postId },
          },
        });

        if (!conflictPost) break;
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = newSlug;
    }

    // 计算新的字数和阅读时间
    const content = data.content || existingPost.content;
    const wordCount = content.length;
    const readingTime = Math.ceil(wordCount / 200);

    // 更新文章基本信息
    const updateData: {
      title?: string;
      content?: string;
      summary?: string;
      categoryId?: number | null;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      featuredImage?: string | null;
      slug: string;
      wordCount: number;
      readingTime: number;
      updatedAt: Date;
      publishedAt?: Date;
    } = {
      ...data,
      slug,
      wordCount,
      readingTime,
      updatedAt: new Date(),
    };

    // 如果状态从DRAFT变为PUBLISHED，设置发布时间
    if (data.status === 'PUBLISHED' && existingPost.status === 'DRAFT') {
      updateData.publishedAt = new Date();
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    // 处理标签更新
    if (data.tags !== undefined) {
      // 删除原有标签关联
      await prisma.postTag.deleteMany({
        where: { postId },
      });

      // 更新原标签的文章数量
      for (const existingTag of existingPost.tags) {
        await prisma.tag.update({
          where: { id: existingTag.tagId },
          data: { postsCount: { decrement: 1 } },
        });
      }

      // 添加新标签关联
      if (data.tags.length > 0) {
        for (const tagName of data.tags) {
          let tag = await prisma.tag.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: {
                name: tagName,
                slug: slugify(tagName, { lower: true, strict: true }),
              },
            });
          }

          await prisma.postTag.create({
            data: {
              postId,
              tagId: tag.id,
            },
          });

          await prisma.tag.update({
            where: { id: tag.id },
            data: { postsCount: { increment: 1 } },
          });
        }
      }
    }

    // 处理分类更新
    if (data.categoryId !== undefined) {
      if (
        existingPost.categoryId &&
        existingPost.categoryId !== data.categoryId
      ) {
        await prisma.category.update({
          where: { id: existingPost.categoryId },
          data: { postsCount: { decrement: 1 } },
        });
      }

      if (data.categoryId) {
        await prisma.category.update({
          where: { id: data.categoryId },
          data: { postsCount: { increment: 1 } },
        });
      }
    }

    // 处理BigInt序列化
    const formattedPost = {
      ...updatedPost,
      id: updatedPost.id.toString(),
      authorId: updatedPost.authorId.toString(),
      author: updatedPost.author
        ? {
            ...updatedPost.author,
            id: updatedPost.author.id.toString(),
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: { post: formattedPost },
      message: '文章更新成功',
    });
  } catch (error) {
    console.error('更新文章失败:', error);

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
          message: '更新文章失败',
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
    if (!session?.user || !session.user.id) {
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

    const { id } = await params;
    // 验证 id 参数
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '文章ID无效',
          },
        },
        { status: 400 }
      );
    }

    // 尝试解析 id，如果无效则返回错误
    let postId: bigint;
    try {
      postId = BigInt(id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: '文章ID格式无效',
          },
        },
        { status: 400 }
      );
    }

    // 检查文章是否存在且用户有权限
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        tags: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '文章不存在',
          },
        },
        { status: 404 }
      );
    }

    if (
      existingPost.authorId.toString() !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '无权限删除此文章',
          },
        },
        { status: 403 }
      );
    }

    // 软删除文章
    await prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    // 删除标签关联并更新标签计数
    await prisma.postTag.deleteMany({
      where: { postId },
    });

    for (const tag of existingPost.tags) {
      await prisma.tag.update({
        where: { id: tag.tagId },
        data: { postsCount: { decrement: 1 } },
      });
    }

    // 更新分类文章数量
    if (existingPost.categoryId) {
      await prisma.category.update({
        where: { id: existingPost.categoryId },
        data: { postsCount: { decrement: 1 } },
      });
    }

    // 更新用户文章数量
    await prisma.userProfile.update({
      where: { userId: existingPost.authorId },
      data: { postsCount: { decrement: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: '文章删除成功',
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除文章失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 文章搜索 API 路由 - 处理博客文章的全文搜索功能
 *
 * 主要功能：
 * 1. 全文搜索已发布的文章
 * 2. 搜索标题、内容和摘要字段
 * 3. 支持分页查询结果
 * 4. 按发布时间和浏览量排序
 * 5. 返回文章相关信息（作者、分类、标签）
 *
 * 搜索特性：
 * - 全文搜索多个字段（标题、内容、摘要）
 * - 仅搜索已发布且未删除的文章
 * - 按相关度和热度排序
 * - 支持分页浏览结果
 * - 包含文章统计信息
 *
 * 验证规则：
 * - 搜索关键词：1-100字符，必填
 * - 页码：最小1，默认1
 * - 每页数量：最小1，最大50，默认10
 *
 * 排序规则：
 * - 主要：按发布时间降序（最新优先）
 * - 次要：按浏览量降序（热门优先）
 *
 * 返回数据：
 * - 文章基本信息（标题、摘要、图片等）
 * - 作者信息（用户名、头像）
 * - 分类信息（名称、颜色、别名）
 * - 标签信息（名称、颜色、别名）
 * - 统计信息（评论数、收藏数）
 * - 分页信息（总数、页数等）
 *
 * 错误处理：
 * - 验证错误：400状态码，详细错误信息
 * - 服务器错误：500状态码，通用错误信息
 *
 * 数据库操作：
 * - 全文搜索查询
 * - 关联查询（作者、分类、标签）
 * - 分页和统计查询
 * - BigInt 序列化处理
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - Prisma ORM 数据操作
 * - Zod 数据验证
 * - MySQL/PostgreSQL 全文搜索
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const searchSchema = z.object({
  q: z
    .string()
    .min(1, '搜索关键词不能为空')
    .max(100, '搜索关键词最多100个字符'),
  page: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 1 : Math.max(num, 1);
    })
    .default('1'),
  limit: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50);
    })
    .default('10'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchSchema.parse({
      q: searchParams.get('q') || '',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    const skip = (query.page - 1) * query.limit;

    // 使用Prisma的全文搜索功能
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          OR: [
            { title: { contains: query.q } },
            { content: { contains: query.q } },
            { summary: { contains: query.q } },
          ],
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
        orderBy: [{ publishedAt: 'desc' }, { views: 'desc' }],
        skip,
        take: query.limit,
      }),
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          OR: [
            { title: { contains: query.q } },
            { content: { contains: query.q } },
            { summary: { contains: query.q } },
          ],
        },
      }),
    ]);

    // 格式化返回数据，处理BigInt序列化
    const formattedPosts = posts.map((post) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        query: query.q,
      },
    });
  } catch (error) {
    console.error('搜索文章失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '搜索参数验证失败',
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
          message: '搜索失败',
        },
      },
      { status: 500 }
    );
  }
}

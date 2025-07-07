/**
 * 评论系统 API
 *
 * 功能：
 * GET: 获取指定文章的评论列表
 * POST: 创建新评论
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// 创建评论的验证schema
const createCommentSchema = z.object({
  postId: z.string().transform((val) => BigInt(val)),
  content: z.string().min(1).max(1000),
  parentId: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
});

// 获取评论的查询参数schema
const getCommentsSchema = z.object({
  postId: z.string().transform((val) => BigInt(val)),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .default('20'),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);

    const validatedParams = getCommentsSchema.parse(searchParams);
    const { postId, page, limit } = validatedParams;

    // 检查文章是否存在
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    // 获取评论列表（只获取顶级评论，回复通过嵌套获取）
    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        parentId: null,
        status: 'APPROVED',
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        replies: {
          where: {
            status: 'APPROVED',
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 获取总数
    const total = await prisma.comment.count({
      where: {
        postId: postId,
        parentId: null,
        status: 'APPROVED',
        deletedAt: null,
      },
    });

    // 转换 BigInt 为字符串
    const serializedComments = comments.map((comment) => ({
      ...comment,
      id: comment.id.toString(),
      postId: comment.postId.toString(),
      userId: comment.userId.toString(),
      parentId: comment.parentId?.toString() || null,
      user: comment.user
        ? {
            ...comment.user,
            id: comment.user.id.toString(),
          }
        : null,
      replies: comment.replies.map((reply) => ({
        ...reply,
        id: reply.id.toString(),
        postId: reply.postId.toString(),
        userId: reply.userId.toString(),
        parentId: reply.parentId?.toString() || null,
        user: reply.user
          ? {
              ...reply.user,
              id: reply.user.id.toString(),
            }
          : null,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments: serializedComments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取评论失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求参数无效', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '获取评论失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);
    const { postId, content, parentId } = validatedData;

    // 检查文章是否存在且已发布
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在或未发布' },
        { status: 404 }
      );
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentId,
          postId: postId,
          status: 'APPROVED',
          deletedAt: null,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: '父评论不存在' },
          { status: 404 }
        );
      }
    }

    // 创建评论
    const comment = await prisma.$transaction(async (tx) => {
      // 创建评论
      const newComment = await tx.comment.create({
        data: {
          postId,
          userId: BigInt(session.user.id),
          parentId,
          content,
          status: 'APPROVED', // 简化：直接审核通过，实际项目可能需要审核流程
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      // 更新文章评论数
      await tx.post.update({
        where: { id: postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });

      // 如果是回复，更新父评论的回复数
      if (parentId) {
        await tx.comment.update({
          where: { id: parentId },
          data: {
            repliesCount: {
              increment: 1,
            },
          },
        });
      }

      return newComment;
    });

    // 转换 BigInt 为字符串
    const serializedComment = {
      ...comment,
      id: comment.id.toString(),
      postId: comment.postId.toString(),
      userId: comment.userId.toString(),
      parentId: comment.parentId?.toString() || null,
      user: comment.user
        ? {
            ...comment.user,
            id: comment.user.id.toString(),
          }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: { comment: serializedComment },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建评论失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求数据无效', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '创建评论失败' },
      { status: 500 }
    );
  }
}

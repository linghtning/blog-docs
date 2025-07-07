import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const likeSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: z.string().transform((val) => BigInt(val)),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { targetType, targetId } = likeSchema.parse(
      Object.fromEntries(url.searchParams)
    );

    // 获取总的点赞数
    const count = await prisma.like.count({
      where: { targetType, targetId },
    });

    // 检查当前用户是否已点赞
    const session = await auth();
    let isLiked = false;

    if (session?.user?.id) {
      const userLike = await prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId: BigInt(session.user.id),
            targetType,
            targetId,
          },
        },
      });
      isLiked = !!userLike;
    }

    return NextResponse.json({
      success: true,
      data: { count, isLiked },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: '参数错误' },
      { status: 400 }
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
    const { targetType, targetId } = likeSchema.parse(await request.json());
    await prisma.like.create({
      data: {
        userId: BigInt(session.user.id),
        targetType,
        targetId,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: '点赞失败或已点赞' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }
    const { targetType, targetId } = likeSchema.parse(await request.json());
    await prisma.like.delete({
      where: {
        userId_targetType_targetId: {
          userId: BigInt(session.user.id),
          targetType,
          targetId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: '取消点赞失败' },
      { status: 400 }
    );
  }
}

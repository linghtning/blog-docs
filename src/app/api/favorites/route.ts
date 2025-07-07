import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const favoriteSchema = z.object({
  postId: z.string().transform((val) => BigInt(val)),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { postId } = favoriteSchema.parse(
      Object.fromEntries(url.searchParams)
    );

    // 获取总的收藏数
    const count = await prisma.favorite.count({ where: { postId } });

    // 检查当前用户是否已收藏
    const session = await auth();
    let isFavorited = false;

    if (session?.user?.id) {
      const userFavorite = await prisma.favorite.findUnique({
        where: {
          userId_postId: {
            userId: BigInt(session.user.id),
            postId,
          },
        },
      });
      isFavorited = !!userFavorite;
    }

    return NextResponse.json({
      success: true,
      data: { count, isFavorited },
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
    const { postId } = favoriteSchema.parse(await request.json());
    await prisma.favorite.create({
      data: {
        userId: BigInt(session.user.id),
        postId,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: '收藏失败或已收藏' },
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
    const { postId } = favoriteSchema.parse(await request.json());
    await prisma.favorite.delete({
      where: {
        userId_postId: {
          userId: BigInt(session.user.id),
          postId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: '取消收藏失败' },
      { status: 400 }
    );
  }
}

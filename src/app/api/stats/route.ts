import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const statsSchema = z.object({
  postId: z.string().transform((val) => BigInt(val)),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { postId } = statsSchema.parse(Object.fromEntries(url.searchParams));
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        views: true,
        commentsCount: true,
        likesCount: true,
        favorites: true,
      },
    });
    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        views: post.views,
        comments: post.commentsCount,
        likes: post.likesCount,
        favorites: post.favorites.length,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: '参数错误' },
      { status: 400 }
    );
  }
}

/**
 * 文章推荐 API 路由 - 智能推荐系统
 *
 * 主要功能：
 * 1. 基于内容的推荐 (标签、分类相似度)
 * 2. 基于用户行为的推荐 (浏览、点赞、收藏历史)
 * 3. 协同过滤推荐 (相似用户喜好)
 * 4. 热门文章推荐
 * 5. 个性化推荐混合算法
 *
 * 推荐算法：
 * - 基于标签相似度计算
 * - 基于分类关联度
 * - 基于用户行为相似性
 * - 基于文章热度权重
 * - 时间衰减因子
 * - 多样性平衡
 *
 * 推荐场景：
 * - 文章详情页相关推荐
 * - 用户首页个性化推荐
 * - 分类页面推荐
 * - 搜索结果相关推荐
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// 推荐参数验证
const recommendationSchema = z.object({
  postId: z.string().optional(), // 当前文章ID (用于相关推荐)
  userId: z.string().optional(), // 用户ID (用于个性化推荐)
  type: z
    .enum([
      'related', // 相关文章推荐
      'personalized', // 个性化推荐
      'popular', // 热门推荐
      'category', // 同分类推荐
      'tags', // 同标签推荐
      'mixed', // 混合推荐
    ])
    .default('mixed'),
  limit: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 20);
    })
    .default('10'),
  excludeIds: z.string().optional(), // 排除的文章ID列表 (逗号分隔)
});

// 推荐文章接口
interface RecommendedPost {
  id: string;
  title: string;
  summary?: string;
  slug: string;
  featuredImage?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  readingTime: number;
  publishedAt: Date;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
  }>;
  score: number;
  reason: string;
  algorithm: string;
}

// 标签接口定义
interface TagType {
  id: number;
  name: string;
  slug: string;
  color: string;
}

// 计算文章间的标签相似度
function calculateTagSimilarity(tags1: number[], tags2: number[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0;

  const set1 = new Set(tags1);
  const set2 = new Set(tags2);
  const intersection = new Set(Array.from(set1).filter((x) => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  return intersection.size / union.size; // Jaccard相似度
}

// 计算时间衰减因子
function calculateTimeDecay(
  publishedAt: Date,
  decayFactor: number = 0.1
): number {
  const now = Date.now();
  const daysDiff = (now - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-decayFactor * daysDiff);
}

// 计算热度得分
function calculatePopularityScore(
  views: number,
  likes: number,
  comments: number
): number {
  // 归一化得分，使用对数缩放
  const viewScore = Math.log(1 + views) / Math.log(10000); // 假设10000为高浏览量
  const likeScore = Math.log(1 + likes) / Math.log(1000); // 假设1000为高点赞数
  const commentScore = Math.log(1 + comments) / Math.log(100); // 假设100为高评论数

  return viewScore * 0.5 + likeScore * 0.3 + commentScore * 0.2;
}

// 基于内容的推荐
async function getContentBasedRecommendations(
  postId: string,
  limit: number,
  excludeIds: string[]
): Promise<RecommendedPost[]> {
  // 获取当前文章信息
  const currentPost = await prisma.post.findUnique({
    where: { id: BigInt(postId) },
    include: {
      tags: {
        include: { tag: true },
      },
      category: true,
    },
  });

  if (!currentPost) return [];

  const currentTags = currentPost.tags
    .map((pt) => pt.tag?.id)
    .filter((id): id is number => id !== null && id !== undefined);
  const categoryId = currentPost.categoryId;

  // 获取候选文章
  const candidates = await prisma.post.findMany({
    where: {
      id: {
        not: BigInt(postId),
        notIn: excludeIds.map((id) => BigInt(id)),
      },
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
    },
    take: limit * 3, // 获取更多候选项用于排序
  });

  // 计算相似度得分
  const recommendations = candidates.map((post) => {
    const postTags = post.tags
      .map((pt) => pt.tag?.id)
      .filter((id): id is number => id !== null && id !== undefined);

    let score = 0;
    let reason = '';

    // 标签相似度 (权重: 0.6)
    const tagSimilarity = calculateTagSimilarity(currentTags, postTags);
    score += tagSimilarity * 0.6;

    // 分类匹配 (权重: 0.3)
    if (categoryId && post.categoryId === categoryId) {
      score += 0.3;
      reason = `同分类: ${post.category?.name}`;
    }

    // 热度加成 (权重: 0.1)
    const popularityScore = calculatePopularityScore(
      post.views,
      post.likesCount,
      post.commentsCount
    );
    score += popularityScore * 0.1;

    // 时间衰减
    const timeDecay = calculateTimeDecay(post.publishedAt || post.createdAt);
    score *= timeDecay;

    if (tagSimilarity > 0.3) {
      const commonTags = post.tags
        .filter((pt) => pt.tag && currentTags.includes(pt.tag.id))
        .map((pt) => pt.tag?.name)
        .filter((name): name is string => name !== null && name !== undefined)
        .slice(0, 2);
      reason = `相似标签: ${commonTags.join(', ')}`;
    }

    return {
      id: post.id.toString(),
      title: post.title,
      summary: post.summary || undefined,
      slug: post.slug,
      featuredImage: post.featuredImage || undefined,
      views: post.views,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      readingTime: post.readingTime,
      publishedAt: post.publishedAt || post.createdAt,
      author: {
        id: post.author?.id.toString() || '',
        username: post.author?.username || '',
        avatarUrl: post.author?.avatarUrl || undefined,
      },
      category: post.category || undefined,
      tags: post.tags
        .map((pt) => pt.tag)
        .filter((tag): tag is TagType => tag !== null && tag !== undefined),
      score,
      reason: reason || '内容相关',
      algorithm: 'content-based',
    };
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
}

// 基于用户行为的推荐
async function getUserBasedRecommendations(
  userId: string,
  limit: number,
  excludeIds: string[]
): Promise<RecommendedPost[]> {
  // 获取用户的浏览历史
  const userViews = await prisma.postView.findMany({
    where: {
      userId: BigInt(userId),
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
      },
    },
    include: {
      post: {
        include: {
          tags: {
            include: { tag: true },
          },
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // 获取用户的点赞记录
  const userLikes = await prisma.like.findMany({
    where: {
      userId: BigInt(userId),
      targetType: 'POST',
    },
    take: 10,
  });

  // 获取用户的收藏记录
  const userFavorites = await prisma.favorite.findMany({
    where: {
      userId: BigInt(userId),
    },
    include: {
      post: {
        include: {
          tags: {
            include: { tag: true },
          },
          category: true,
        },
      },
    },
    take: 10,
  });

  // 分析用户偏好
  const preferredTags = new Map<number, number>();
  const preferredCategories = new Map<number, number>();

  // 从浏览历史中分析偏好
  userViews.forEach((view) => {
    if (!view.post) return;

    // 标签偏好
    view.post.tags.forEach((pt) => {
      if (pt.tag) {
        preferredTags.set(pt.tag.id, (preferredTags.get(pt.tag.id) || 0) + 1);
      }
    });

    // 分类偏好
    if (view.post.categoryId) {
      preferredCategories.set(
        view.post.categoryId,
        (preferredCategories.get(view.post.categoryId) || 0) + 1
      );
    }
  });

  // 从收藏记录中分析偏好 (权重更高)
  userFavorites.forEach((fav) => {
    if (!fav.post) return;

    fav.post.tags.forEach((pt) => {
      if (pt.tag) {
        preferredTags.set(pt.tag.id, (preferredTags.get(pt.tag.id) || 0) + 3);
      }
    });

    if (fav.post.categoryId) {
      preferredCategories.set(
        fav.post.categoryId,
        (preferredCategories.get(fav.post.categoryId) || 0) + 3
      );
    }
  });

  // 从点赞记录中分析偏好 (中等权重)
  const likedPostIds = userLikes.map((like) => like.targetId);
  if (likedPostIds.length > 0) {
    const likedPosts = await prisma.post.findMany({
      where: { id: { in: likedPostIds } },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
    });

    likedPosts.forEach((post) => {
      post.tags.forEach((pt) => {
        if (pt.tag) {
          preferredTags.set(pt.tag.id, (preferredTags.get(pt.tag.id) || 0) + 2);
        }
      });

      if (post.categoryId) {
        preferredCategories.set(
          post.categoryId,
          (preferredCategories.get(post.categoryId) || 0) + 2
        );
      }
    });
  }

  // 基于偏好推荐文章
  const topTags = Array.from(preferredTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tagId]) => tagId);

  const topCategories = Array.from(preferredCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoryId]) => categoryId);

  if (topTags.length === 0 && topCategories.length === 0) {
    return [];
  }

  // 获取推荐候选文章
  const candidates = await prisma.post.findMany({
    where: {
      id: {
        notIn: excludeIds.map((id) => BigInt(id)),
      },
      status: 'PUBLISHED',
      deletedAt: null,
      OR: [
        ...(topTags.length > 0
          ? [
              {
                tags: {
                  some: {
                    tagId: { in: topTags },
                  },
                },
              },
            ]
          : []),
        ...(topCategories.length > 0
          ? [
              {
                categoryId: { in: topCategories },
              },
            ]
          : []),
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
    },
    take: limit * 2,
  });

  // 计算推荐得分
  const recommendations = candidates.map((post) => {
    let score = 0;
    let reason = '';

    // 标签偏好匹配
    const postTags = post.tags
      .map((pt) => pt.tag?.id)
      .filter((id): id is number => id !== null && id !== undefined);
    const tagMatches = postTags.filter((tagId) => preferredTags.has(tagId));
    if (tagMatches.length > 0) {
      score +=
        tagMatches.reduce(
          (sum, tagId) => sum + (preferredTags.get(tagId) || 0),
          0
        ) * 0.1;
      reason = '基于你的兴趣标签';
    }

    // 分类偏好匹配
    if (post.categoryId && preferredCategories.has(post.categoryId)) {
      score += (preferredCategories.get(post.categoryId) || 0) * 0.15;
      reason = `基于你喜欢的 ${post.category?.name} 分类`;
    }

    // 热度加成
    const popularityScore = calculatePopularityScore(
      post.views,
      post.likesCount,
      post.commentsCount
    );
    score += popularityScore * 0.2;

    // 时间衰减
    const timeDecay = calculateTimeDecay(post.publishedAt || post.createdAt);
    score *= timeDecay;

    return {
      id: post.id.toString(),
      title: post.title,
      summary: post.summary || undefined,
      slug: post.slug,
      featuredImage: post.featuredImage || undefined,
      views: post.views,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      readingTime: post.readingTime,
      publishedAt: post.publishedAt || post.createdAt,
      author: {
        id: post.author?.id.toString() || '',
        username: post.author?.username || '',
        avatarUrl: post.author?.avatarUrl || undefined,
      },
      category: post.category || undefined,
      tags: post.tags
        .map((pt) => pt.tag)
        .filter((tag): tag is TagType => tag !== null && tag !== undefined),
      score,
      reason: reason || '个性化推荐',
      algorithm: 'user-based',
    };
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
}

// 热门推荐
async function getPopularRecommendations(
  limit: number,
  excludeIds: string[]
): Promise<RecommendedPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      id: {
        notIn: excludeIds.map((id) => BigInt(id)),
      },
      status: 'PUBLISHED',
      deletedAt: null,
      publishedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
      },
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
    },
    orderBy: [
      { views: 'desc' },
      { likesCount: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: limit,
  });

  return posts.map((post) => ({
    id: post.id.toString(),
    title: post.title,
    summary: post.summary || undefined,
    slug: post.slug,
    featuredImage: post.featuredImage || undefined,
    views: post.views,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt || post.createdAt,
    author: {
      id: post.author?.id.toString() || '',
      username: post.author?.username || '',
      avatarUrl: post.author?.avatarUrl || undefined,
    },
    category: post.category || undefined,
    tags: post.tags
      .map((pt) => pt.tag)
      .filter((tag): tag is TagType => tag !== null && tag !== undefined),
    score: calculatePopularityScore(
      post.views,
      post.likesCount,
      post.commentsCount
    ),
    reason: '近期热门文章',
    algorithm: 'popular',
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = recommendationSchema.parse({
      postId: searchParams.get('postId') || undefined,
      userId: searchParams.get('userId') || undefined,
      type: searchParams.get('type') || 'mixed',
      limit: searchParams.get('limit') || '10',
      excludeIds: searchParams.get('excludeIds') || undefined,
    });

    const excludeIds = query.excludeIds ? query.excludeIds.split(',') : [];
    let recommendations: RecommendedPost[] = [];

    switch (query.type) {
      case 'related':
        if (query.postId) {
          recommendations = await getContentBasedRecommendations(
            query.postId,
            query.limit,
            excludeIds
          );
        }
        break;

      case 'personalized':
        if (query.userId) {
          recommendations = await getUserBasedRecommendations(
            query.userId,
            query.limit,
            excludeIds
          );
        }
        break;

      case 'popular':
        recommendations = await getPopularRecommendations(
          query.limit,
          excludeIds
        );
        break;

      case 'mixed':
      default:
        // 混合推荐策略
        const promises: Promise<RecommendedPost[]>[] = [];

        if (query.postId) {
          promises.push(
            getContentBasedRecommendations(
              query.postId,
              Math.ceil(query.limit / 2),
              excludeIds
            )
          );
        }

        if (query.userId) {
          promises.push(
            getUserBasedRecommendations(
              query.userId,
              Math.ceil(query.limit / 2),
              excludeIds
            )
          );
        }

        // 总是包含一些热门推荐
        promises.push(
          getPopularRecommendations(Math.ceil(query.limit / 3), excludeIds)
        );

        const results = await Promise.all(promises);
        const allRecommendations = results.flat();

        // 去重并按得分排序
        const uniqueRecommendations = allRecommendations.filter(
          (post, index, arr) => arr.findIndex((p) => p.id === post.id) === index
        );

        recommendations = uniqueRecommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, query.limit);
        break;
    }

    // 记录推荐日志（异步）
    if (query.userId && recommendations.length > 0) {
      setImmediate(async () => {
        try {
          for (const rec of recommendations) {
            await prisma.recommendationLog.create({
              data: {
                userId: BigInt(query.userId!),
                postId: BigInt(rec.id),
                algorithm: getRecommendationTypeEnum(rec.algorithm),
                score: rec.score,
              },
            });
          }
        } catch (error) {
          console.error('记录推荐日志失败:', error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        query: {
          type: query.type,
          postId: query.postId,
          userId: query.userId,
          limit: query.limit,
        },
        algorithms: Array.from(
          new Set(recommendations.map((r) => r.algorithm))
        ),
      },
    });
  } catch (error) {
    console.error('获取推荐失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '推荐参数验证失败',
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
          message: '获取推荐失败',
        },
      },
      { status: 500 }
    );
  }
}

// 将算法字符串映射到 Prisma 枚举值
function getRecommendationTypeEnum(
  algorithm: string
):
  | 'CONTENT_BASED'
  | 'COLLABORATIVE'
  | 'POPULAR'
  | 'USER_BEHAVIOR'
  | 'SIMILAR_TAGS'
  | 'SIMILAR_CATEGORY' {
  switch (algorithm) {
    case 'content-based':
      return 'CONTENT_BASED';
    case 'user-based':
      return 'USER_BEHAVIOR';
    case 'popular':
      return 'POPULAR';
    case 'mixed':
      return 'COLLABORATIVE';
    default:
      return 'CONTENT_BASED';
  }
}

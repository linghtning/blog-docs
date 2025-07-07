/**
 * 热门搜索 API 路由 - 提供热门搜索关键词和统计数据
 *
 * 主要功能：
 * 1. 获取热门搜索关键词
 * 2. 搜索趋势分析
 * 3. 实时热门话题
 * 4. 搜索统计数据
 * 5. 热门标签和分类
 *
 * 数据来源：
 * - 搜索日志统计
 * - 文章浏览量排序
 * - 标签使用频次
 * - 分类文章数量
 * - 用户搜索行为
 *
 * 时间范围：
 * - 实时热门 (最近1小时)
 * - 今日热门 (最近24小时)
 * - 本周热门 (最近7天)
 * - 本月热门 (最近30天)
 * - 历史热门 (全部时间)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// 热门搜索参数验证
const popularSchema = z.object({
  timeRange: z.enum(['hour', 'day', 'week', 'month', 'all']).default('day'),
  type: z
    .enum(['keywords', 'posts', 'tags', 'categories', 'all'])
    .default('all'),
  limit: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50);
    })
    .default('10'),
});

// 热门项目接口
interface PopularItem {
  text: string;
  type: 'keyword' | 'post' | 'tag' | 'category';
  count: number;
  trend?: 'up' | 'down' | 'stable';
  metadata?: Record<string, unknown>;
}

// 获取时间范围的开始时间
function getTimeRangeStart(timeRange: string): Date {
  const now = new Date();

  switch (timeRange) {
    case 'hour':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return new Date(0);
  }
}

// 计算趋势
function calculateTrend(
  current: number,
  previous: number
): 'up' | 'down' | 'stable' {
  if (current > previous * 1.1) return 'up';
  if (current < previous * 0.9) return 'down';
  return 'stable';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = popularSchema.parse({
      timeRange: searchParams.get('timeRange') || 'day',
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') || '10',
    });

    const results: Record<string, PopularItem[]> = {};
    const startTime = getTimeRangeStart(query.timeRange);
    const previousStartTime = getTimeRangeStart(query.timeRange);
    previousStartTime.setTime(
      previousStartTime.getTime() - (Date.now() - startTime.getTime())
    );

    // 1. 热门搜索关键词
    if (query.type === 'all' || query.type === 'keywords') {
      const keywordStats = await prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: startTime,
          },
          resultsCount: {
            gt: 0,
          },
        },
        _count: {
          query: true,
        },
        _sum: {
          resultsCount: true,
        },
        orderBy: {
          _count: {
            query: 'desc',
          },
        },
        take: query.limit,
      });

      // 获取前一个时间段的数据用于趋势分析
      const previousKeywordStats = await prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: previousStartTime,
            lt: startTime,
          },
          resultsCount: {
            gt: 0,
          },
          query: {
            in: keywordStats.map((item) => item.query),
          },
        },
        _count: {
          query: true,
        },
      });

      const previousKeywordMap = new Map(
        previousKeywordStats.map((item) => [item.query, item._count.query])
      );

      results.keywords = keywordStats.map((item) => ({
        text: item.query,
        type: 'keyword' as const,
        count: item._count.query,
        trend: calculateTrend(
          item._count.query,
          previousKeywordMap.get(item.query) || 0
        ),
        metadata: {
          totalResults: item._sum.resultsCount || 0,
          averageResults: Math.round(
            (item._sum.resultsCount || 0) / item._count.query
          ),
        },
      }));
    }

    // 2. 热门文章 (基于浏览量和搜索次数)
    if (query.type === 'all' || query.type === 'posts') {
      const popularPosts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          publishedAt: {
            gte: startTime,
          },
        },
        select: {
          title: true,
          slug: true,
          views: true,
          likesCount: true,
          commentsCount: true,
        },
        orderBy: [{ views: 'desc' }, { likesCount: 'desc' }],
        take: query.limit,
      });

      results.posts = popularPosts.map((post) => ({
        text: post.title,
        type: 'post' as const,
        count: post.views,
        metadata: {
          slug: post.slug,
          likes: post.likesCount,
          comments: post.commentsCount,
        },
      }));
    }

    // 3. 热门标签
    if (query.type === 'all' || query.type === 'tags') {
      const tagUsage = await prisma.postTag.groupBy({
        by: ['tagId'],
        where: {
          post: {
            status: 'PUBLISHED',
            deletedAt: null,
            publishedAt: {
              gte: startTime,
            },
          },
        },
        _count: {
          tagId: true,
        },
        orderBy: {
          _count: {
            tagId: 'desc',
          },
        },
        take: query.limit,
      });

      const tagIds = tagUsage.map((item) => item.tagId);
      const tags = await prisma.tag.findMany({
        where: {
          id: {
            in: tagIds,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          postsCount: true,
        },
      });

      const tagMap = new Map(tags.map((tag) => [tag.id, tag]));

      results.tags = tagUsage
        .map((item) => {
          const tag = tagMap.get(item.tagId);
          if (!tag) return null;

          return {
            text: tag.name,
            type: 'tag' as const,
            count: item._count.tagId,
            metadata: {
              slug: tag.slug,
              color: tag.color,
              totalPosts: tag.postsCount,
            },
          };
        })
        .filter((item) => item !== null) as PopularItem[];
    }

    // 4. 热门分类
    if (query.type === 'all' || query.type === 'categories') {
      const categoryUsage = await prisma.post.groupBy({
        by: ['categoryId'],
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          publishedAt: {
            gte: startTime,
          },
          categoryId: {
            not: null,
          },
        },
        _count: {
          categoryId: true,
        },
        orderBy: {
          _count: {
            categoryId: 'desc',
          },
        },
        take: query.limit,
      });

      const categoryIds = categoryUsage
        .map((item) => item.categoryId)
        .filter((id): id is number => id !== null);

      const categories = await prisma.category.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          postsCount: true,
        },
      });

      const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

      results.categories = categoryUsage
        .map((item) => {
          if (!item.categoryId) return null;
          const category = categoryMap.get(item.categoryId);
          if (!category) return null;

          return {
            text: category.name,
            type: 'category' as const,
            count: item._count.categoryId,
            metadata: {
              slug: category.slug,
              color: category.color,
              totalPosts: category.postsCount,
            },
          };
        })
        .filter((item) => item !== null) as PopularItem[];
    }

    // 5. 统计摘要
    const stats = await Promise.all([
      // 总搜索次数
      prisma.searchLog.count({
        where: {
          createdAt: {
            gte: startTime,
          },
        },
      }),
      // 唯一搜索关键词数
      prisma.searchLog.findMany({
        where: {
          createdAt: {
            gte: startTime,
          },
        },
        select: {
          query: true,
        },
        distinct: ['query'],
      }),
      // 平均搜索结果数
      prisma.searchLog.aggregate({
        where: {
          createdAt: {
            gte: startTime,
          },
        },
        _avg: {
          resultsCount: true,
        },
      }),
    ]);

    const summary = {
      totalSearches: stats[0],
      uniqueKeywords: stats[1].length,
      averageResults: Math.round(stats[2]._avg.resultsCount || 0),
      timeRange: query.timeRange,
      period: {
        start: startTime.toISOString(),
        end: new Date().toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        popular: results,
        summary,
        query: {
          timeRange: query.timeRange,
          type: query.type,
          limit: query.limit,
        },
      },
    });
  } catch (error) {
    console.error('获取热门搜索失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '热门搜索参数验证失败',
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
          message: '获取热门搜索失败',
        },
      },
      { status: 500 }
    );
  }
}

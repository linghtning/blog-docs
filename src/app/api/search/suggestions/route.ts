/**
 * 搜索建议 API 路由 - 提供搜索自动补全和建议功能
 *
 * 主要功能：
 * 1. 根据输入提供搜索建议
 * 2. 基于历史搜索数据生成建议
 * 3. 智能匹配文章标题、标签、分类
 * 4. 热门搜索关键词推荐
 * 5. 防抖优化避免频繁请求
 *
 * 建议来源：
 * - 文章标题匹配
 * - 热门标签
 * - 分类名称
 * - 历史搜索关键词
 * - 作者用户名
 *
 * 排序策略：
 * - 搜索频次权重
 * - 结果数量权重
 * - 最近使用时间权重
 * - 完全匹配优先
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// 搜索建议参数验证
const suggestionSchema = z.object({
  q: z.string().min(1, '搜索关键词不能为空').max(50, '搜索关键词最多50个字符'),
  limit: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 20);
    })
    .default('10'),
  type: z
    .enum(['all', 'posts', 'tags', 'categories', 'authors'])
    .default('all'),
});

// 建议项接口
interface SuggestionItem {
  text: string;
  type: 'keyword' | 'post' | 'tag' | 'category' | 'author';
  count?: number;
  score: number;
  metadata?: Record<string, unknown>;
}

// 计算建议得分
function calculateSuggestionScore(
  item: SuggestionItem,
  query: string,
  searchCount: number = 0,
  recentScore: number = 0
): number {
  const queryLower = query.toLowerCase();
  const textLower = item.text.toLowerCase();

  let score = 0;

  // 完全匹配得分最高
  if (textLower === queryLower) {
    score += 10;
  }
  // 开头匹配次之
  else if (textLower.startsWith(queryLower)) {
    score += 8;
  }
  // 包含匹配
  else if (textLower.includes(queryLower)) {
    score += 5;
  }

  // 搜索频次加成 (最大2分)
  score += Math.min(Math.log(1 + searchCount) * 0.5, 2);

  // 最近使用加成 (最大1分)
  score += recentScore;

  // 类型权重
  switch (item.type) {
    case 'keyword':
      score += 3; // 历史搜索关键词权重最高
      break;
    case 'post':
      score += 2; // 文章标题次之
      break;
    case 'tag':
      score += 1.5;
      break;
    case 'category':
      score += 1;
      break;
    case 'author':
      score += 0.5;
      break;
  }

  return score;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = suggestionSchema.parse({
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '10',
      type: searchParams.get('type') || 'all',
    });

    const suggestions: SuggestionItem[] = [];

    // 1. 从搜索建议表获取历史关键词
    if (query.type === 'all' || query.type === 'posts') {
      const keywordSuggestions = await prisma.searchSuggestion.findMany({
        where: {
          keyword: {
            contains: query.q,
          },
          resultsCount: {
            gt: 0, // 只返回有结果的关键词
          },
        },
        orderBy: [{ searchCount: 'desc' }, { lastUsedAt: 'desc' }],
        take: Math.ceil(query.limit / 2),
      });

      for (const suggestion of keywordSuggestions) {
        const recentScore =
          suggestion.lastUsedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ? 1
            : 0;
        suggestions.push({
          text: suggestion.keyword,
          type: 'keyword',
          count: suggestion.resultsCount,
          score: calculateSuggestionScore(
            { text: suggestion.keyword, type: 'keyword', score: 0 },
            query.q,
            suggestion.searchCount,
            recentScore
          ),
          metadata: {
            searchCount: suggestion.searchCount,
            resultsCount: suggestion.resultsCount,
            lastUsed: suggestion.lastUsedAt,
          },
        });
      }
    }

    // 2. 从文章标题获取建议
    if (query.type === 'all' || query.type === 'posts') {
      const postSuggestions = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          title: {
            contains: query.q,
          },
        },
        select: {
          title: true,
          views: true,
          likesCount: true,
        },
        orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
        take: Math.ceil(query.limit / 4),
      });

      for (const post of postSuggestions) {
        suggestions.push({
          text: post.title,
          type: 'post',
          score: calculateSuggestionScore(
            { text: post.title, type: 'post', score: 0 },
            query.q,
            post.views,
            0
          ),
          metadata: {
            views: post.views,
            likes: post.likesCount,
          },
        });
      }
    }

    // 3. 从标签获取建议
    if (query.type === 'all' || query.type === 'tags') {
      const tagSuggestions = await prisma.tag.findMany({
        where: {
          name: {
            contains: query.q,
          },
        },
        orderBy: [{ postsCount: 'desc' }, { name: 'asc' }],
        take: Math.ceil(query.limit / 6),
      });

      for (const tag of tagSuggestions) {
        suggestions.push({
          text: tag.name,
          type: 'tag',
          count: tag.postsCount,
          score: calculateSuggestionScore(
            { text: tag.name, type: 'tag', score: 0 },
            query.q,
            tag.postsCount,
            0
          ),
          metadata: {
            slug: tag.slug,
            color: tag.color,
            postsCount: tag.postsCount,
          },
        });
      }
    }

    // 4. 从分类获取建议
    if (query.type === 'all' || query.type === 'categories') {
      const categorySuggestions = await prisma.category.findMany({
        where: {
          name: {
            contains: query.q,
          },
        },
        orderBy: [{ postsCount: 'desc' }, { name: 'asc' }],
        take: Math.ceil(query.limit / 8),
      });

      for (const category of categorySuggestions) {
        suggestions.push({
          text: category.name,
          type: 'category',
          count: category.postsCount,
          score: calculateSuggestionScore(
            { text: category.name, type: 'category', score: 0 },
            query.q,
            category.postsCount,
            0
          ),
          metadata: {
            slug: category.slug,
            color: category.color,
            postsCount: category.postsCount,
          },
        });
      }
    }

    // 5. 从作者用户名获取建议
    if (query.type === 'all' || query.type === 'authors') {
      const authorSuggestions = await prisma.user.findMany({
        where: {
          username: {
            contains: query.q,
          },
          status: 'ACTIVE',
          posts: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
        select: {
          username: true,
          avatarUrl: true,
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
        orderBy: {
          username: 'asc',
        },
        take: Math.ceil(query.limit / 10),
      });

      for (const author of authorSuggestions) {
        suggestions.push({
          text: author.username,
          type: 'author',
          count: author._count.posts,
          score: calculateSuggestionScore(
            { text: author.username, type: 'author', score: 0 },
            query.q,
            author._count.posts,
            0
          ),
          metadata: {
            avatar: author.avatarUrl,
            postsCount: author._count.posts,
          },
        });
      }
    }

    // 按得分排序并去重
    const uniqueSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .filter(
        (item, index, arr) =>
          arr.findIndex(
            (other) => other.text.toLowerCase() === item.text.toLowerCase()
          ) === index
      )
      .slice(0, query.limit);

    return NextResponse.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        query: query.q,
        total: uniqueSuggestions.length,
        searchType: query.type,
      },
    });
  } catch (error) {
    console.error('获取搜索建议失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '搜索建议参数验证失败',
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
          message: '获取搜索建议失败',
        },
      },
      { status: 500 }
    );
  }
}

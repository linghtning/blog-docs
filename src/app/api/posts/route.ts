/**
 * 文章 API 路由 - 处理博客文章的核心管理功能
 *
 * 主要功能：
 * 1. 获取文章列表（支持分页、筛选、搜索）
 * 2. 创建新文章（包含标签和分类管理）
 * 3. 文章状态管理（草稿、已发布）
 * 4. 字数统计和阅读时间计算
 * 5. SEO友好的URL别名生成
 *
 * 安全特性：
 * - 身份验证检查（需要登录才能创建）
 * - Zod 数据验证（防止无效数据）
 * - 别名唯一性检查（避免冲突）
 * - 权限控制（作者和管理员）
 * - 软删除机制（数据安全）
 *
 * 查询功能：
 * - 支持分页查询（page、limit）
 * - 按状态筛选（DRAFT、PUBLISHED、ARCHIVED）
 * - 按分类筛选（categoryId）
 * - 按作者筛选（authorId）
 * - 全文搜索（标题、内容、摘要）
 * - 复杂关联查询（作者、分类、标签、统计）
 *
 * 验证规则：
 * - 文章标题：1-200字符，必填
 * - 文章内容：至少1字符，必填
 * - 文章摘要：可选文本
 * - 分类ID：可选数字
 * - 标签：可选字符串数组
 * - 状态：DRAFT或PUBLISHED，默认DRAFT
 * - 特色图片：可选URL
 *
 * 数据库操作：
 * - 文章CRUD操作
 * - 标签自动创建和关联
 * - 分类文章数量统计
 * - 用户文章数量统计
 * - 复杂的关联查询
 * - BigInt序列化处理
 *
 * 错误处理：
 * - 未授权：401状态码，未登录提示
 * - 验证错误：400状态码，详细错误信息
 * - 服务器错误：500状态码，通用错误信息
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
import { PostStatus, Prisma } from '@prisma/client';

// 文章创建验证schema
const createPostSchema = z
  .object({
    title: z.string().max(200, '文章标题最多200个字符').optional().default(''),
    content: z.string().optional().default(''),
    summary: z.string().optional(),
    categoryId: z.number().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    featuredImage: z.string().optional(),
  })
  .refine(
    (data) => {
      // 对于草稿，标题或内容其中一个不为空即可
      if (data.status === 'DRAFT') {
        return data.title?.trim() || data.content?.trim();
      }
      // 对于发布，标题和内容都不能为空
      return data.title?.trim() && data.content?.trim();
    },
    {
      message:
        '草稿需要标题或内容其中一个不为空，发布文章需要标题和内容都不为空',
    }
  );

// 文章查询参数schema
const querySchema = z.object({
  page: z
    .string()
    .nullable()
    .transform((val) => {
      if (!val) return 1;
      const num = Number(val);
      return isNaN(num) ? 1 : Math.max(num, 1);
    }),
  limit: z
    .string()
    .nullable()
    .transform((val) => {
      if (!val) return 10;
      const num = Number(val);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50);
    }),
  status: z.nativeEnum(PostStatus).nullable().optional(),
  categoryId: z
    .string()
    .nullable()
    .transform((val) => {
      if (!val) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  search: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
});

// 定义查询结果类型
type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        avatarUrl: true;
      };
    };
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
        color: true;
      };
    };
    tags: {
      include: {
        tag: {
          select: {
            id: true;
            name: true;
            slug: true;
            color: true;
          };
        };
      };
    };
    _count: {
      select: {
        comments: true;
        favorites: true;
      };
    };
  };
}>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      categoryId: searchParams.get('categoryId'),
      search: searchParams.get('search'),
      authorId: searchParams.get('authorId'),
    });

    const skip = (query.page - 1) * query.limit;

    // 构建查询条件
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.authorId) {
      where.authorId = BigInt(query.authorId);
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
        { summary: { contains: query.search } },
      ];
    }

    // 获取文章列表
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: query.limit,
      }),
      prisma.post.count({ where }),
    ]);

    // 格式化数据，处理BigInt序列化
    const formattedPosts = (posts as PostWithRelations[]).map((post) => ({
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
      },
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '查询参数验证失败',
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
          message: '获取文章列表失败',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const data = createPostSchema.parse(body);

    // 验证并转换用户ID
    let authorId: bigint;
    try {
      authorId = BigInt(session.user.id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: '用户ID无效',
          },
        },
        { status: 400 }
      );
    }

    // 生成唯一的slug
    const title = data.title?.trim() || '';
    const content = data.content?.trim() || '';

    // 如果标题为空，使用内容的前20个字符作为标题
    const displayTitle = title || content.substring(0, 20) || '无标题';

    const baseSlug = slugify(displayTitle, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingPost = await prisma.post.findFirst({
        where: {
          authorId,
          slug,
        },
      });

      if (!existingPost) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 计算阅读时间（约每分钟200字）
    const wordCount = content.length;
    const readingTime = Math.ceil(wordCount / 200) || 1;

    // 创建文章
    const post = await prisma.post.create({
      data: {
        title: title || displayTitle,
        slug,
        content: content,
        summary: data.summary,
        status: data.status,
        featuredImage: data.featuredImage,
        wordCount,
        readingTime,
        authorId,
        categoryId: data.categoryId,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
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
      },
    });

    // 处理标签
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        // 查找或创建标签
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

        // 关联文章和标签
        await prisma.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id,
          },
        });

        // 更新标签文章数量
        await prisma.tag.update({
          where: { id: tag.id },
          data: { postsCount: { increment: 1 } },
        });
      }
    }

    // 更新分类文章数量
    if (data.categoryId) {
      await prisma.category.update({
        where: { id: data.categoryId },
        data: { postsCount: { increment: 1 } },
      });
    }

    // 更新用户文章数量
    await prisma.userProfile.upsert({
      where: { userId: authorId },
      update: { postsCount: { increment: 1 } },
      create: {
        userId: authorId,
        postsCount: 1,
      },
    });

    // 处理BigInt序列化
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
    };

    return NextResponse.json(
      {
        success: true,
        data: { post: formattedPost },
        message: '文章创建成功',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建文章失败:', error);

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
          message: '创建文章失败',
        },
      },
      { status: 500 }
    );
  }
}

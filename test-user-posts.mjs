#!/usr/bin/env node

/**
 * 用户文章数据检查脚本
 * 用于诊断 /dashboard/posts 和 /dashboard/drafts 页面查不到文章的问题
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPosts() {
  try {
    console.log('=== 博客系统数据检查 ===\n');

    // 1. 检查用户总数
    const userCount = await prisma.user.count();
    console.log(`📊 总用户数: ${userCount}`);

    // 2. 检查文章总数
    const postCount = await prisma.post.count();
    console.log(`📝 总文章数: ${postCount}`);

    // 3. 检查草稿数量
    const draftCount = await prisma.post.count({
      where: { status: 'DRAFT', deletedAt: null },
    });
    console.log(`📄 草稿数量: ${draftCount}`);

    // 4. 检查已发布文章数量
    const publishedCount = await prisma.post.count({
      where: { status: 'PUBLISHED', deletedAt: null },
    });
    console.log(`✅ 已发布文章数量: ${publishedCount}\n`);

    // 5. 列出所有用户
    console.log('👥 用户列表:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    users.forEach((user, index) => {
      console.log(
        `  ${index + 1}. ID: ${user.id.toString()}, 用户名: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}`
      );
    });

    // 6. 列出每个用户的文章数量
    console.log('\n📚 每个用户的文章统计:');
    for (const user of users) {
      const userPosts = await prisma.post.count({
        where: { authorId: user.id, deletedAt: null },
      });
      const userDrafts = await prisma.post.count({
        where: { authorId: user.id, status: 'DRAFT', deletedAt: null },
      });
      const userPublished = await prisma.post.count({
        where: { authorId: user.id, status: 'PUBLISHED', deletedAt: null },
      });

      console.log(
        `  ${user.username}: 总文章 ${userPosts}, 草稿 ${userDrafts}, 已发布 ${userPublished}`
      );
    }

    // 7. 列出最近的文章
    console.log('\n📰 最近文章列表:');
    const recentPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        authorId: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    recentPosts.forEach((post, index) => {
      console.log(
        `  ${index + 1}. ID: ${post.id.toString()}, 标题: "${post.title || '无标题'}", 状态: ${post.status}, 作者: ${post.author?.username || '未知'}, 作者ID: ${post.authorId.toString()}`
      );
    });

    // 8. 如果没有文章，创建示例文章
    if (postCount === 0 && userCount > 0) {
      console.log('\n🚀 检测到没有文章，为第一个用户创建示例文章...');
      const firstUser = users[0];

      const samplePost = await prisma.post.create({
        data: {
          title: '欢迎使用博客系统',
          content: '这是一篇示例文章。您可以在仪表板中管理您的文章。',
          summary: '欢迎使用博客系统的示例文章',
          status: 'DRAFT',
          authorId: firstUser.id,
          slug: 'welcome-to-blog-system',
          wordCount: 20,
          readingTime: 1,
        },
      });

      console.log(
        `✅ 成功为用户 ${firstUser.username} 创建示例文章: ${samplePost.id.toString()}`
      );

      // 创建一篇已发布的文章
      const publishedPost = await prisma.post.create({
        data: {
          title: '如何使用博客系统',
          content:
            '这是一篇关于如何使用博客系统的指南文章。\n\n1. 登录到系统\n2. 访问仪表板\n3. 创建新文章\n4. 管理您的内容',
          summary: '博客系统使用指南',
          status: 'PUBLISHED',
          authorId: firstUser.id,
          slug: 'how-to-use-blog-system',
          wordCount: 50,
          readingTime: 1,
          publishedAt: new Date(),
        },
      });

      console.log(
        `✅ 成功为用户 ${firstUser.username} 创建已发布文章: ${publishedPost.id.toString()}`
      );
    }

    console.log('\n=== 检查完成 ===');
    console.log('🔍 如果仍然查不到文章，请检查:');
    console.log('1. 用户是否已登录');
    console.log('2. session中的用户ID是否与数据库中的authorId匹配');
    console.log('3. 浏览器控制台是否有错误信息');
    console.log('4. 访问 /debug 页面查看详细信息');
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPosts().catch(console.error);

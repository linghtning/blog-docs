import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUserAsAdmin() {
  try {
    // 获取第一个用户
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      console.log('❌ 没有找到用户');
      return;
    }

    console.log('\n📋 当前用户列表:');
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.username} (${user.email}) - 角色: ${user.role}`
      );
    });

    // 将第一个用户设置为管理员
    if (users[0].role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: users[0].id },
        data: { role: 'ADMIN' },
      });
      console.log(`\n✅ 已将用户 ${users[0].username} 设置为管理员`);
    } else {
      console.log(`\n✅ 用户 ${users[0].username} 已经是管理员`);
    }

    // 显示更新后的用户信息
    const updatedUser = await prisma.user.findUnique({
      where: { id: users[0].id },
    });
    console.log(`\n👤 管理员信息:`);
    console.log(`   用户名: ${updatedUser.username}`);
    console.log(`   邮箱: ${updatedUser.email}`);
    console.log(`   角色: ${updatedUser.role}`);
    console.log(
      `\n🔐 请使用此账号登录管理分类: http://localhost:3001/admin/categories`
    );
  } catch (error) {
    console.error('❌ 设置管理员失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setUserAsAdmin();

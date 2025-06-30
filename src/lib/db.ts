/**
 * Prisma 数据库客户端 - 数据库连接和查询接口
 *
 * 主要功能：
 * 1. 创建和管理 Prisma 客户端实例
 * 2. 处理数据库连接池
 * 3. 开发环境下的热重载优化
 * 4. 数据库查询日志记录
 *
 * 设计模式：
 * - 单例模式确保唯一实例
 * - 全局变量防止热重载重复创建
 * - 开发环境特殊处理
 *
 * 配置特性：
 * - 查询日志启用
 * - 生产环境优化
 * - 内存泄漏防护
 *
 * 使用技术：
 * - Prisma ORM
 * - PostgreSQL/MySQL 数据库
 * - 连接池管理
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

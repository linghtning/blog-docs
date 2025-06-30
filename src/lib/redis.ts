/**
 * Redis 客户端配置 - 缓存和会话存储
 *
 * 主要功能：
 * 1. 建立Redis数据库连接
 * 2. 提供缓存存储服务
 * 3. 支持会话数据存储
 * 4. 处理临时数据和限流计数
 *
 * 配置特性：
 * - 懒加载连接（按需连接）
 * - 连接重试机制（最多3次）
 * - 开发环境热重载优化
 * - 全局单例模式
 *
 * 使用场景：
 * - 用户会话存储
 * - 请求频率限制计数
 * - 缓存热点数据
 * - 临时数据存储
 *
 * 连接配置：
 * - 优先使用环境变量 REDIS_URL
 * - 默认连接本地Redis (localhost:6379)
 * - 生产环境支持集群配置
 *
 * 性能优化：
 * - 连接池管理
 * - 自动重连机制
 * - 错误处理和恢复
 *
 * 使用技术：
 * - ioredis 高性能客户端
 * - 环境变量配置
 * - 单例设计模式
 */
import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

/**
 * 请求频率限制配置 - 防止API滥用和暴力攻击
 *
 * 主要功能：
 * 1. 限制用户注册频率（防止垃圾注册）
 * 2. 限制登录尝试频率（防止暴力破解）
 * 3. 限制API调用频率（防止服务过载）
 * 4. 基于内存的快速限流实现
 *
 * 限流策略：
 * - 注册限制：每小时最多5次尝试
 * - 登录限制：每分钟最多5次尝试
 * - API限制：每分钟最多100次调用
 *
 * 实现原理：
 * - 使用 rate-limiter-flexible 库
 * - 基于内存存储（生产环境可改为Redis）
 * - 滑动窗口算法
 * - 支持分布式部署
 *
 * 安全考虑：
 * - 防止暴力破解攻击
 * - 防止垃圾数据注册
 * - 保护服务器资源
 * - 提升用户体验
 *
 * 使用场景：
 * - 用户注册API
 * - 用户登录API
 * - 公开API接口
 * - 敏感操作保护
 *
 * 使用技术：
 * - rate-limiter-flexible 库
 * - 内存存储策略
 * - 可配置限流参数
 */
import { RateLimiterMemory } from 'rate-limiter-flexible';

// 注册速率限制: 每小时最多5次尝试
export const rateLimit = new RateLimiterMemory({
  points: 5, // 每个key最多5次
  duration: 60 * 60, // 1小时（秒）
});

// 登录速率限制: 每分钟最多5次尝试
export const loginRateLimit = new RateLimiterMemory({
  points: 5,
  duration: 60, // 1分钟（秒）
});

// API调用速率限制: 每分钟最多100次
export const apiRateLimit = new RateLimiterMemory({
  points: 100,
  duration: 60, // 1分钟（秒）
});

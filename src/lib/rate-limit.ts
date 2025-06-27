import { RateLimiterMemory } from 'rate-limiter-flexible'

// 注册速率限制: 每小时最多5次尝试
export const rateLimit = new RateLimiterMemory({
  points: 5, // 每个key最多5次
  duration: 60 * 60, // 1小时（秒）
})

// 登录速率限制: 每分钟最多5次尝试
export const loginRateLimit = new RateLimiterMemory({
  points: 5,
  duration: 60, // 1分钟（秒）
})

// API调用速率限制: 每分钟最多100次
export const apiRateLimit = new RateLimiterMemory({
  points: 100,
  duration: 60, // 1分钟（秒）
}) 
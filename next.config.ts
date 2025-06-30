/**
 * Next.js 15 配置文件 - 项目构建和运行时配置
 *
 * 主要配置：
 * 1. 服务端包管理（外部包配置）
 * 2. 字体优化设置
 * 3. 图片优化和CDN配置
 * 4. 环境变量管理
 * 5. 路由重定向规则
 * 6. 性能优化配置
 *
 * 图片优化配置：
 * - 支持 WebP、AVIF 格式
 * - 多种设备尺寸适配
 * - 远程图片域名白名单
 * - 响应式图片尺寸
 *
 * 性能优化：
 * - 字体预加载优化
 * - Gzip压缩启用
 * - Standalone输出模式
 * - 外部包优化
 *
 * 安全配置：
 * - 图片来源域名限制
 * - 环境变量安全管理
 * - 重定向规则配置
 *
 * 部署配置：
 * - Standalone模式支持Docker
 * - 生产环境优化
 * - CDN友好配置
 *
 * 使用技术：
 * - Next.js 15 新特性
 * - TypeScript 配置类型
 * - 现代Web标准
 */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 服务端外部包配置 - Next.js 15 新语法
  serverExternalPackages: ['prisma'],

  // 字体优化配置 - 解决字体预加载警告
  optimizeFonts: true,

  // 图片优化配置 - Next.js 15 更新
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.yourdomain.com',
      },
      {
        protocol: 'https',
        hostname: 'img2.baidu.com',
      },
      {
        protocol: 'https',
        hostname: 'img1.baidu.com',
      },
      {
        protocol: 'https',
        hostname: 'img0.baidu.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 环境变量配置
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // 压缩配置
  compress: true,

  // 生成配置
  output: 'standalone',
};

export default nextConfig;

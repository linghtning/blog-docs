import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 服务端外部包配置 - Next.js 15 新语法
  serverExternalPackages: ['prisma'],

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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启实验性功能
  experimental: {
    serverComponentsExternalPackages: ['prisma']
  },
  
  // 图片优化配置
  images: {
    domains: ['localhost', 'yourdomain.com', 'cdn.yourdomain.com'],
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
    ]
  },
  
  // 压缩配置
  compress: true,
  
  // 生成配置
  output: 'standalone',
  
  // Webpack配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig 
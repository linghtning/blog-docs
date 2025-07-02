/**
 * Next.js 根布局组件 - 全局页面布局和配置
 *
 * 主要功能：
 * 1. 定义全局页面结构和样式
 * 2. 配置 Google 字体（Inter）
 * 3. 设置 SEO 元数据和 Open Graph
 * 4. 集成会话管理提供者
 * 5. 配置多语言支持（中文）
 *
 * 特性：
 * - 响应式设计基础样式
 * - 字体预加载优化
 * - SEO 友好的元数据配置
 * - 社交媒体分享优化
 * - 搜索引擎爬虫配置
 *
 * 使用技术：
 * - Next.js 15 App Router
 * - TypeScript 类型安全
 * - Tailwind CSS 样式系统
 * - NextAuth.js 会话管理
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // 使用 font-display: swap 避免布局偏移
  preload: true, // 确保字体被正确预加载
  variable: '--font-inter', // 添加 CSS 变量以便更好的控制
  fallback: ['system-ui', 'arial'], // 添加备用字体
  adjustFontFallback: false, // 禁用字体回退调整以减少警告
});

export const metadata: Metadata = {
  title: {
    default: '博客平台',
    template: '%s | 博客平台',
  },
  description: '现代化的博客发布平台，为内容创作者提供优秀的写作发布体验',
  keywords: ['博客', '写作', '内容创作', 'Next.js', 'TypeScript'],
  authors: [{ name: '博客平台团队' }],
  creator: '博客平台',
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: process.env.SITE_URL || 'http://localhost:3000',
    title: '博客平台',
    description: '现代化的博客发布平台',
    siteName: '博客平台',
  },
  twitter: {
    card: 'summary_large_image',
    title: '博客平台',
    description: '现代化的博客发布平台',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '博客平台',
    template: '%s | 博客平台'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
} 
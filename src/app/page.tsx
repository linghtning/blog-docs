import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Navbar } from '@/components/layout/Navbar';

// 生成页面元数据 - Next.js 15 推荐方式
export const metadata: Metadata = {
  title: '首页',
  description: '现代化的博客发布平台，为内容创作者提供优秀的写作发布体验',
  openGraph: {
    title: '博客平台 - 现代化内容创作',
    description: '为内容创作者提供优秀的写作发布体验',
    type: 'website',
  },
};

// 启用静态生成 - Next.js 15 优化
export const revalidate = 3600; // 1小时重新验证

// Server Component - Next.js 15 默认行为
export default function HomePage() {
  const features = [
    {
      icon: '🚀',
      title: '现代化技术栈',
      description:
        '基于 Next.js 15、React 19、TypeScript、Tailwind CSS 构建，性能卓越，体验流畅',
    },
    {
      icon: '✍️',
      title: '优秀编辑体验',
      description: '支持 Markdown 编辑，实时预览，代码高亮，让写作变得简单高效',
    },
    {
      icon: '🔍',
      title: 'SEO 友好',
      description: '静态生成和服务端渲染，优秀的 SEO 表现，让内容被更多人发现',
    },
    {
      icon: '🎨',
      title: '美观界面',
      description: '精心设计的用户界面，响应式布局，在任何设备上都有绝佳体验',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="container px-4 py-8 mx-auto max-w-6xl">
        <section className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl">
            欢迎来到博客平台
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
            现代化的博客发布平台，为内容创作者提供优秀的写作发布体验
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-6 space-x-4">
            <Link href="/auth/register">
              <Button size="lg">开始写作</Button>
            </Link>
            <Link href="/posts">
              <Button variant="secondary" size="lg">
                浏览文章
              </Button>
            </Link>
          </div>

          <div className="flex justify-center">
            <Link href="/components-test">
              <Button variant="outline" size="sm">
                🧪 查看组件测试页面
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold text-center text-gray-900 lg:text-3xl">
            平台特色
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="transition-transform hover:scale-105"
              >
                <CardHeader>
                  <CardTitle className="flex gap-2 items-center">
                    <span className="text-2xl">{feature.icon}</span>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

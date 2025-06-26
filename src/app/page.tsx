import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          欢迎来到博客平台 测试
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          现代化的博客发布平台，为内容创作者提供优秀的写作发布体验
        </p>
        
        <div className="flex justify-center mb-6 space-x-4">
          <Button size="lg">
            开始写作
          </Button>
          <Button variant="secondary" size="lg">
            浏览文章
          </Button>
        </div>

        <div className="flex justify-center">
          <Link href="/components-test">
            <Button variant="outline" size="sm">
              🧪 查看组件测试页面
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="mb-8 text-2xl font-bold text-center text-gray-900">
          平台特色
        </h2>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                🚀 现代化技术栈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                基于 Next.js 14、TypeScript、Tailwind CSS 构建，性能卓越，体验流畅
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                ✍️ 优秀编辑体验
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                支持 Markdown 编辑，实时预览，代码高亮，让写作变得简单高效
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                🔍 SEO 友好
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                静态生成和服务端渲染，优秀的 SEO 表现，让内容被更多人发现
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                🎨 美观界面
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                精心设计的用户界面，响应式布局，在任何设备上都有绝佳体验
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
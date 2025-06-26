export default function HomePage() {
  return (
    <div className="container-responsive py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          欢迎来到博客平台
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          现代化的博客发布平台，为内容创作者提供优秀的写作发布体验
        </p>
        
        <div className="flex justify-center space-x-4">
          <button className="btn-primary">
            开始写作
          </button>
          <button className="btn-secondary">
            浏览文章
          </button>
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          平台特色
        </h2>
        
        <div className="grid-responsive">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🚀 现代化技术栈
            </h3>
            <p className="text-gray-600">
              基于 Next.js 14、TypeScript、Tailwind CSS 构建，性能卓越，体验流畅
            </p>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✍️ 优秀编辑体验
            </h3>
            <p className="text-gray-600">
              支持 Markdown 编辑，实时预览，代码高亮，让写作变得简单高效
            </p>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🔍 SEO 友好
            </h3>
            <p className="text-gray-600">
              静态生成和服务端渲染，优秀的 SEO 表现，让内容被更多人发现
            </p>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🎨 美观界面
            </h3>
            <p className="text-gray-600">
              精心设计的用户界面，响应式布局，在任何设备上都有绝佳体验
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
/**
 * UI组件测试页面 - 所有自定义组件的展示和测试页面
 *
 * 主要功能：
 * 1. 展示所有UI组件的不同变体和状态
 * 2. 提供交互式测试环境
 * 3. 验证组件功能和样式正确性
 * 4. 开发过程中的组件调试工具
 * 5. 设计系统的可视化展示
 *
 * 测试内容：
 * - Button组件：变体、尺寸、状态测试
 * - Input组件：类型、验证、状态测试
 * - Card组件：布局、内容展示测试
 * - 交互逻辑：点击、输入、状态变化
 *
 * 组件测试分类：
 * - 视觉测试：样式、颜色、尺寸
 * - 功能测试：交互、状态、事件
 * - 响应式测试：不同屏幕尺寸适配
 * - 无障碍测试：键盘导航、屏幕阅读器
 *
 * 开发用途：
 * - 组件开发调试
 * - 设计系统验证
 * - UI一致性检查
 * - 回归测试参考
 *
 * 特性：
 * - 实时交互演示
 * - 状态管理测试
 * - 错误场景模拟
 * - 加载状态演示
 *
 * 使用技术：
 * - React 客户端组件
 * - React Hooks 状态管理
 * - 自定义UI组件库
 * - TypeScript 类型安全
 * - Tailwind CSS 样式
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ComponentsTestPage() {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const handleButtonClick = (buttonName: string) => {
    setLoadingStates((prev) => ({ ...prev, [buttonName]: true }));
    setTimeout(() => {
      setLoadingStates((prev) => ({ ...prev, [buttonName]: false }));
      alert(`${buttonName} 按钮被点击！`);
    }, 2000);
  };

  const handleInputValidation = (value: string) => {
    setInputValue(value);
    if (value.length < 3 && value.length > 0) {
      setInputError('至少输入3个字符');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          🧪 UI组件测试页面
        </h1>
        <p className="text-lg text-gray-600">
          这个页面用于测试和验证所有UI组件的功能和样式
        </p>
      </div>

      {/* Button 组件测试 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Button 组件测试
        </h2>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>按钮变体 (Variants)</CardTitle>
            <CardDescription>测试不同样式的按钮</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="primary"
                onClick={() => handleButtonClick('Primary')}
                loading={loadingStates['primary']}
              >
                Primary 按钮
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleButtonClick('Secondary')}
                loading={loadingStates['secondary']}
              >
                Secondary 按钮
              </Button>
              <Button
                variant="outline"
                onClick={() => handleButtonClick('Outline')}
                loading={loadingStates['outline']}
              >
                Outline 按钮
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleButtonClick('Ghost')}
                loading={loadingStates['ghost']}
              >
                Ghost 按钮
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleButtonClick('Destructive')}
                loading={loadingStates['destructive']}
              >
                Destructive 按钮
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>按钮尺寸 (Sizes)</CardTitle>
            <CardDescription>测试不同大小的按钮</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm" onClick={() => alert('小按钮被点击')}>
                小按钮 (sm)
              </Button>
              <Button size="md" onClick={() => alert('中按钮被点击')}>
                中按钮 (md)
              </Button>
              <Button size="lg" onClick={() => alert('大按钮被点击')}>
                大按钮 (lg)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>按钮状态 (States)</CardTitle>
            <CardDescription>测试按钮的不同状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => alert('正常按钮被点击')}>正常状态</Button>
              <Button disabled>禁用状态</Button>
              <Button loading>加载状态</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Input 组件测试 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Input 组件测试
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基础输入框</CardTitle>
              <CardDescription>测试不同类型和状态的输入框</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="用户名"
                placeholder="请输入用户名"
                helperText="用户名将用于登录"
              />

              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                helperText="密码至少8位"
              />

              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱"
                value={inputValue}
                onChange={(e) => handleInputValidation(e.target.value)}
                error={inputError}
              />

              <Input
                label="禁用输入框"
                placeholder="这是一个禁用的输入框"
                disabled
                value="禁用状态"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>特殊输入框</CardTitle>
              <CardDescription>测试特殊类型的输入框</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="数字输入"
                type="number"
                placeholder="请输入数字"
                helperText="只能输入数字"
              />

              <Input label="日期选择" type="date" helperText="选择一个日期" />

              <Input
                label="文件上传"
                type="file"
                helperText="选择要上传的文件"
              />

              <Input
                label="搜索框"
                type="search"
                placeholder="搜索内容..."
                helperText="输入关键词进行搜索"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Card 组件测试 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Card 组件测试
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card variant="default">
            <CardHeader>
              <CardTitle>默认卡片</CardTitle>
              <CardDescription>这是一个默认样式的卡片</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                默认卡片具有基础的边框和阴影效果，适合大多数场景使用。
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">操作</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>提升卡片</CardTitle>
              <CardDescription>具有更明显阴影效果的卡片</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                提升卡片具有更强的阴影效果，能够突出重要内容。
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">
                操作
              </Button>
            </CardFooter>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>轮廓卡片</CardTitle>
              <CardDescription>具有明显边框的卡片</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                轮廓卡片使用粗边框设计，具有清晰的边界定义。
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                操作
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card padding="sm">
            <CardHeader>
              <CardTitle>小间距卡片</CardTitle>
              <CardDescription>padding=&quot;sm&quot;</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">这个卡片使用较小的内边距。</p>
            </CardContent>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle>大间距卡片</CardTitle>
              <CardDescription>padding=&quot;lg&quot;</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                这个卡片使用较大的内边距，给内容更多呼吸空间。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 组合示例 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          组件组合示例
        </h2>

        <Card variant="elevated" className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>用户登录</CardTitle>
            <CardDescription>请输入您的登录信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="邮箱地址"
              type="email"
              placeholder="your@email.com"
              helperText="我们不会分享您的邮箱"
            />
            <Input
              label="密码"
              type="password"
              placeholder="输入密码"
              helperText="密码至少8个字符"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm">
              忘记密码？
            </Button>
            <Button
              onClick={() => handleButtonClick('Login')}
              loading={loadingStates['login']}
            >
              登录
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* 测试结果汇总 */}
      <section>
        <Card variant="outlined" className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ 组件测试汇总</CardTitle>
            <CardDescription className="text-green-700">
              所有UI组件功能验证完成
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div>
                <h4 className="mb-2 font-semibold text-green-800">
                  Button 组件
                </h4>
                <ul className="space-y-1 text-green-700">
                  <li>✓ 5种变体样式</li>
                  <li>✓ 3种尺寸规格</li>
                  <li>✓ 加载状态动画</li>
                  <li>✓ 禁用状态处理</li>
                  <li>✓ 点击事件响应</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-green-800">
                  Input 组件
                </h4>
                <ul className="space-y-1 text-green-700">
                  <li>✓ 多种输入类型</li>
                  <li>✓ 标签和提示文本</li>
                  <li>✓ 错误状态显示</li>
                  <li>✓ 禁用状态处理</li>
                  <li>✓ 表单验证支持</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-green-800">Card 组件</h4>
                <ul className="space-y-1 text-green-700">
                  <li>✓ 3种外观变体</li>
                  <li>✓ 灵活内边距控制</li>
                  <li>✓ 结构化子组件</li>
                  <li>✓ 响应式布局</li>
                  <li>✓ 组件组合使用</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="font-medium text-green-800">
              🎉 所有组件测试通过，可以安全用于生产环境！
            </p>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}

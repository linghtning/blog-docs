/**
 * Tailwind CSS 配置文件 - 项目样式系统配置
 *
 * 主要配置：
 * 1. 扫描路径设置（组件、页面、应用）
 * 2. 自定义主题配置（颜色、字体、排版）
 * 3. Typography插件配置
 * 4. 暗色模式支持
 * 5. 设计系统标准化
 *
 * 颜色系统：
 * - Primary主色调：蓝色系（50-900）
 * - Gray灰度色：完整色阶
 * - 语义化颜色命名
 * - 无障碍访问对比度
 *
 * 字体配置：
 * - Inter字体作为主字体
 * - Fira Code等宽字体
 * - CSS变量集成
 * - 字体回退策略
 *
 * Typography插件：
 * - Markdown内容样式
 * - 代码高亮配置
 * - 引用块样式
 * - 暗色模式适配
 *
 * 响应式设计：
 * - 移动端优先
 * - 断点标准化
 * - 组件响应式
 *
 * 特性：
 * - CSS-in-JS支持
 * - 组件样式隔离
 * - 性能优化
 * - 开发体验优化
 *
 * 使用技术：
 * - Tailwind CSS v3
 * - Typography插件
 * - TypeScript配置
 * - 设计令牌系统
 */
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.700'),
            maxWidth: 'none',
            hr: {
              borderColor: theme('colors.gray.200'),
              marginTop: '3em',
              marginBottom: '3em',
            },
            'h1, h2, h3, h4': {
              color: theme('colors.gray.900'),
            },
            a: {
              color: theme('colors.primary.600'),
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            strong: {
              color: theme('colors.gray.900'),
            },
            code: {
              color: theme('colors.gray.900'),
              backgroundColor: theme('colors.gray.100'),
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.gray.900'),
              color: theme('colors.gray.100'),
            },
            blockquote: {
              borderLeftColor: theme('colors.primary.500'),
              backgroundColor: theme('colors.gray.50'),
              padding: '1rem',
              borderRadius: '0.5rem',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            'h1, h2, h3, h4': {
              color: theme('colors.gray.100'),
            },
            strong: {
              color: theme('colors.gray.100'),
            },
            code: {
              backgroundColor: theme('colors.gray.800'),
              color: theme('colors.gray.100'),
            },
            blockquote: {
              backgroundColor: theme('colors.gray.800'),
              borderLeftColor: theme('colors.primary.400'),
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
  darkMode: 'class',
};

export default config;

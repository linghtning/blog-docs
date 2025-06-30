/**
 * 通用输入框组件 - 可复用的表单输入控件
 *
 * 主要功能：
 * 1. 标准 HTML input 元素的增强版本
 * 2. 集成标签、错误提示、帮助文本
 * 3. 自动生成唯一 ID 关联
 * 4. 错误状态样式切换
 * 5. 完整的无障碍访问支持
 *
 * 组件特性：
 * - label: 输入框标签文本
 * - error: 错误信息显示
 * - helperText: 帮助提示文本
 * - 自动 ID 生成和关联
 * - 禁用状态样式
 *
 * 样式状态：
 * - 默认状态：灰色边框
 * - 焦点状态：主色调边框和阴影
 * - 错误状态：红色边框和错误文本
 * - 禁用状态：灰色背景不可交互
 *
 * 可访问性：
 * - label 和 input 正确关联
 * - 错误信息语义化
 * - 键盘导航支持
 * - 屏幕阅读器友好
 *
 * 使用技术：
 * - React forwardRef 引用转发
 * - useId Hook 唯一标识符
 * - Tailwind CSS 样式系统
 * - TypeScript 接口扩展
 */
import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', label, error, helperText, id, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            'block w-full rounded-md border-gray-300 shadow-sm transition-colors',
            'focus:border-primary-500 focus:ring-primary-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn('text-sm', error ? 'text-red-600' : 'text-gray-500')}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

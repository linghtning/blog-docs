'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MarkdownEditor = React.forwardRef<
  HTMLTextAreaElement,
  MarkdownEditorProps
>(({ value, onChange, placeholder, className }, ref) => {
  const [isPreview, setIsPreview] = React.useState(false);

  // 简单的 Markdown 渲染函数
  const renderMarkdown = (markdown: string) => {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br />');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">编辑器</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={!isPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            编辑
          </Button>
          <Button
            type="button"
            variant={isPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreview(true)}
          >
            预览
          </Button>
        </div>
      </div>

      {/* 编辑器内容 */}
      <div className="min-h-[400px]">
        {!isPreview ? (
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'border-input placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'min-h-[400px] resize-y font-mono'
            )}
          />
        ) : (
          <div
            className={cn(
              'border-input w-full rounded-md border bg-gray-50 px-3 py-2 text-base shadow-sm md:text-sm',
              'prose prose-sm min-h-[400px] max-w-none'
            )}
            dangerouslySetInnerHTML={{
              __html: value
                ? renderMarkdown(value)
                : '<p class="text-gray-500">暂无内容</p>',
            }}
          />
        )}
      </div>

      {/* 提示信息 */}
      <div className="text-xs text-gray-500">
        支持 Markdown 语法：# 标题，**粗体**，*斜体*，`代码`
      </div>
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export { MarkdownEditor };

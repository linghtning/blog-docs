/**
 * Markdown编辑器组件 - 支持实时预览的编辑器
 *
 * 主要功能：
 * 1. Markdown语法编辑
 * 2. 实时预览
 * 3. 工具栏操作
 * 4. 图片插入
 * 5. 全屏编辑
 *
 * 使用技术：
 * - React Markdown渲染
 * - 语法高亮
 * - 响应式布局
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { FileUpload } from './FileUpload';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '开始写作...',
  className,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const replacement = before + (selected || placeholder) + after;

      const newValue =
        value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      // 设置新的光标位置
      setTimeout(() => {
        textarea.focus();
        if (selected) {
          textarea.setSelectionRange(start, start + replacement.length);
        } else {
          textarea.setSelectionRange(
            start + before.length,
            start + before.length + placeholder.length
          );
        }
      }, 0);
    },
    [value, onChange]
  );

  const handleImageUpload = useCallback(
    (url: string) => {
      const imageMarkdown = `![图片](${url})`;
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const newValue =
        value.substring(0, start) + imageMarkdown + value.substring(start);
      onChange(newValue);
      setShowImageUpload(false);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + imageMarkdown.length,
          start + imageMarkdown.length
        );
      }, 0);
    },
    [value, onChange]
  );

  const toolbarButtons = [
    {
      title: '粗体',
      icon: 'B',
      action: () => insertText('**', '**', '粗体文字'),
    },
    {
      title: '斜体',
      icon: 'I',
      action: () => insertText('*', '*', '斜体文字'),
    },
    {
      title: '标题',
      icon: 'H',
      action: () => insertText('## ', '', '标题'),
    },
    {
      title: '链接',
      icon: '🔗',
      action: () => insertText('[', '](url)', '链接文字'),
    },
    {
      title: '代码',
      icon: '</>',
      action: () => insertText('`', '`', '代码'),
    },
    {
      title: '引用',
      icon: '❝',
      action: () => insertText('> ', '', '引用内容'),
    },
    {
      title: '列表',
      icon: '≡',
      action: () => insertText('- ', '', '列表项'),
    },
  ];

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-gray-300',
        isFullscreen && 'fixed inset-0 z-50 bg-white',
        className
      )}
    >
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              onClick={button.action}
              title={button.title}
              className="rounded px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              {button.icon}
            </button>
          ))}
          <div className="h-4 w-px bg-gray-300" />
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            title="插入图片"
            className="rounded px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            📷
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={cn(
              'rounded px-3 py-1 text-sm font-medium transition-colors',
              isPreview
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            )}
          >
            {isPreview ? '编辑' : '预览'}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? '退出全屏' : '全屏编辑'}
            className="rounded px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>

      {/* 图片上传 */}
      {showImageUpload && (
        <div className="border-b border-gray-200 bg-blue-50 p-4">
          <FileUpload
            onUpload={handleImageUpload}
            onError={(error) => alert(error)}
            className="max-w-md"
          />
        </div>
      )}

      {/* 编辑器内容 */}
      <div className={cn('flex', isFullscreen ? 'h-screen' : 'h-96')}>
        {/* 编辑器 */}
        <div className={cn('flex-1', isPreview && 'hidden md:block md:w-1/2')}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-full w-full resize-none border-none p-4 font-mono text-sm leading-relaxed outline-none"
          />
        </div>

        {/* 预览 */}
        {isPreview && (
          <div className="flex-1 border-l border-gray-200">
            <div className="prose prose-sm h-full max-w-none overflow-auto p-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 text-2xl font-bold">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 text-xl font-semibold">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 text-lg font-medium">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed">{children}</p>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="h-auto max-w-full rounded-lg shadow-sm"
                    />
                  ),
                  code: ({ children, className }) => (
                    <code
                      className={cn(
                        'rounded bg-gray-100 px-1 py-0.5 text-sm',
                        className
                      )}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100">
                      {children}
                    </pre>
                  ),
                }}
              >
                {value || '*预览将在这里显示...*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

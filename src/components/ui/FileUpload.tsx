/**
 * 文件上传组件 - 支持拖拽和点击上传
 *
 * 主要功能：
 * 1. 拖拽上传支持
 * 2. 文件类型和大小验证
 * 3. 上传进度显示
 * 4. 预览功能
 * 5. 错误处理
 *
 * 使用技术：
 * - React Hooks状态管理
 * - 文件拖拽API
 * - FormData API
 * - TypeScript类型安全
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUpload({
  onUpload,
  onError,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.size > maxSize) {
        onError?.('文件太大，最大支持 5MB');
        return;
      }

      setIsUploading(true);
      setPreview(URL.createObjectURL(file));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }

        const data = await response.json();
        onUpload(data.url);
      } catch (error) {
        console.error('Upload error:', error);
        onError?.(error instanceof Error ? error.message : '上传失败');
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [maxSize, onError, onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
              <p className="text-sm text-gray-600">上传中...</p>
            </>
          ) : (
            <>
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  点击上传或拖拽图片到此处
                </p>
                <p className="text-xs text-gray-500">
                  支持 PNG、JPG、GIF 格式，最大 5MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="预览"
            className="h-auto max-w-full rounded-lg shadow-md"
            style={{ maxHeight: '200px' }}
          />
          {!isUploading && (
            <button
              onClick={() => setPreview(null)}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

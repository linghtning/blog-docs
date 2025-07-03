'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (url: string) => void;
  onError: (error: string) => void;
  accept?: string;
  maxSize?: number; // 以 MB 为单位
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onError,
  accept = 'image/*',
  maxSize = 5,
  className,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      onError(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    // 检查文件类型
    if (accept !== '*' && !file.type.match(accept.replace('*', '.*'))) {
      onError('不支持的文件类型');
      return;
    }

    setIsUploading(true);

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

      const result = await response.json();
      if (result.success && result.data?.url) {
        onUpload(result.data.url);
      } else {
        throw new Error('上传成功但无法获取文件URL');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      onError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onClick={openFileDialog}
      >
        {isUploading ? (
          <div className="space-y-2">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
            <p className="text-sm text-gray-600">正在上传...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  点击上传
                </span>{' '}
                或拖拽文件到此处
              </p>
              <p className="mt-1 text-xs text-gray-500">
                支持 {accept}，最大 {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

FileUpload.displayName = 'FileUpload';

export { FileUpload };

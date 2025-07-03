/**
 * 文件上传 API 路由 - 处理博客图片和文件上传功能
 *
 * 主要功能：
 * 1. 图片文件上传到 Vercel Blob 存储
 * 2. 文件类型和大小验证
 * 3. 生成唯一文件名避免冲突
 * 4. 返回文件访问URL和元信息
 * 5. 支持多种图片格式
 *
 * 安全特性：
 * - 身份验证检查（需要登录才能上传）
 * - 文件类型白名单验证
 * - 文件大小限制（最大5MB）
 * - 唯一文件名生成（防止覆盖）
 * - 安全的文件路径处理
 *
 * 支持格式：
 * - JPEG (.jpg, .jpeg)
 * - PNG (.png)
 * - GIF (.gif)
 * - WebP (.webp)
 *
 * 限制规则：
 * - 最大文件大小：5MB
 * - 仅支持图片格式
 * - 需要登录权限
 * - 文件名自动生成
 *
 * 存储配置：
 * - 使用 Vercel Blob 存储服务
 * - 公开访问权限
 * - 自动CDN加速
 * - 文件路径：blog-images/目录
 *
 * 返回信息：
 * - 文件访问URL
 * - 原始文件名
 * - 文件大小
 * - 文件类型
 * - 上传状态
 *
 * 错误处理：
 * - 未授权：401状态码，未登录提示
 * - 文件缺失：400状态码，文件选择提示
 * - 格式错误：400状态码，支持格式提示
 * - 大小超限：400状态码，大小限制提示
 * - 上传失败：500状态码，上传错误提示
 * - 服务器错误：500状态码，通用错误信息
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - NextAuth.js 身份验证
 * - Vercel Blob 文件存储
 * - nanoid 唯一ID生成
 * - FormData 文件处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未登录',
          },
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: '请选择要上传的文件',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: '不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: '文件太大，最大支持 5MB',
          },
        },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${nanoid()}.${fileExtension}`;
    const filePath = `blog-images/${fileName}`;

    try {
      // 上传到Vercel Blob
      const blob = await put(filePath, file, {
        access: 'public',
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            url: blob.url,
            fileName: fileName,
            originalName: file.name,
            size: file.size,
            type: file.type,
          },
          message: '文件上传成功',
        },
        { status: 201 }
      );
    } catch (uploadError) {
      console.error('文件上传失败:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: '文件上传失败，请重试',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('处理上传请求失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '处理上传请求失败',
        },
      },
      { status: 500 }
    );
  }
}

# API 接口统一规范文档

## 📋 概述

本文档定义了博客项目中所有 API 接口的统一标准和规范，确保代码一致性、可维护性和最佳实践。

## 🎯 统一目标

- **响应格式标准化** - 统一的成功和错误响应结构
- **错误处理规范化** - 标准错误代码和详细错误信息
- **文档注释完整化** - 详细的功能和安全特性说明
- **数据验证统一化** - 使用 Zod 进行严格的数据验证
- **BigInt 序列化处理** - 正确处理数据库 ID 的序列化
- **导入语句规范化** - 统一的导入顺序和组织

## 📐 响应格式规范

### 成功响应格式

```typescript
{
  success: true,
  data?: any,           // 响应数据（可选）
  message?: string      // 成功消息（可选）
}
```

### 错误响应格式

```typescript
{
  success: false,
  error: {
    code: string,       // 标准错误代码
    message: string,    // 用户友好的错误消息
    details?: any       // 详细错误信息（可选，如验证错误）
  }
}
```

## 🚨 标准错误代码

| 错误代码              | 状态码 | 说明                   |
| --------------------- | ------ | ---------------------- |
| `UNAUTHORIZED`        | 401    | 未登录或身份验证失败   |
| `FORBIDDEN`           | 403    | 权限不足，无法访问资源 |
| `NOT_FOUND`           | 404    | 请求的资源不存在       |
| `VALIDATION_ERROR`    | 400    | 数据验证失败           |
| `RATE_LIMIT_EXCEEDED` | 429    | 请求频率超限           |
| `FILE_REQUIRED`       | 400    | 缺少必需的文件         |
| `INVALID_FILE_TYPE`   | 400    | 不支持的文件类型       |
| `FILE_TOO_LARGE`      | 400    | 文件大小超出限制       |
| `UPLOAD_FAILED`       | 500    | 文件上传失败           |
| `USERNAME_EXISTS`     | 400    | 用户名已存在           |
| `EMAIL_EXISTS`        | 400    | 邮箱已被使用           |
| `INTERNAL_ERROR`      | 500    | 服务器内部错误         |

## 📝 文档注释规范

每个 API 文件都应包含详细的 JSDoc 注释：

```typescript
/**
 * [模块名称] API 路由 - [简要描述]
 *
 * 主要功能：
 * 1. [功能1描述]
 * 2. [功能2描述]
 * 3. [功能3描述]
 *
 * 安全特性：
 * - [安全特性1]
 * - [安全特性2]
 * - [安全特性3]
 *
 * 验证规则：
 * - [字段1]：[规则描述]
 * - [字段2]：[规则描述]
 *
 * 错误处理：
 * - [错误类型1]：[状态码]，[描述]
 * - [错误类型2]：[状态码]，[描述]
 *
 * 数据库操作：
 * - [操作1描述]
 * - [操作2描述]
 *
 * 使用技术：
 * - Next.js 15 Route Handlers
 * - NextAuth.js 身份验证
 * - Prisma ORM 数据操作
 * - Zod 数据验证
 * - [其他技术]
 */
```

## 🔍 数据验证规范

### Zod Schema 定义

```typescript
const createSchema = z.object({
  // 字符串字段
  name: z.string().min(1, '名称不能为空').max(50, '名称最多50个字符'),

  // 可选字段
  description: z.string().optional(),

  // 正则验证
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '颜色格式不正确，请使用HEX格式')
    .default('#007bff'),

  // 数字转换
  page: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 1 : Math.max(num, 1);
    })
    .default('1'),
});
```

### 错误处理模式

```typescript
try {
  const data = schema.parse(body);
  // 业务逻辑
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }
  // 其他错误处理
}
```

## 🔢 BigInt 序列化处理

### 问题说明

Prisma 中的 ID 字段使用 BigInt 类型，JSON 序列化时会出错。

### 解决方案

```typescript
// 格式化返回数据，处理BigInt序列化
const formattedData = data.map((item) => ({
  ...item,
  id: item.id.toString(),
  authorId: item.authorId.toString(),
  author: item.author
    ? {
        ...item.author,
        id: item.author.id.toString(),
      }
    : null,
}));
```

## 📦 导入语句规范

### 导入顺序

1. Next.js 相关导入
2. 第三方库导入
3. 本地库导入

```typescript
// Next.js 导入
import { NextRequest, NextResponse } from 'next/server';

// 第三方库导入
import { z } from 'zod';
import slugify from 'slugify';
import bcrypt from 'bcryptjs';

// 本地库导入
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
```

## 🔐 安全规范

### 身份验证检查

```typescript
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
```

### 权限验证

```typescript
if (session.user.role !== 'ADMIN') {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '无权限执行此操作',
      },
    },
    { status: 403 }
  );
}
```

### 所有者验证

```typescript
if (
  resource.authorId.toString() !== session.user.id &&
  session.user.role !== 'ADMIN'
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '无权限修改此资源',
      },
    },
    { status: 403 }
  );
}
```

## 📊 分页查询规范

### 查询参数处理

```typescript
const querySchema = z.object({
  page: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 1 : Math.max(num, 1);
    })
    .default('1'),
  limit: z
    .string()
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50);
    })
    .default('10'),
});
```

### 分页响应格式

```typescript
return NextResponse.json({
  success: true,
  data: {
    items: formattedItems,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / query.limit),
    },
  },
});
```

## 🛠 最佳实践

### 1. 错误日志记录

```typescript
catch (error) {
  console.error('操作失败:', error);
  // 错误处理逻辑
}
```

### 2. 数据库查询优化

```typescript
// 使用 select 限制返回字段
// 使用 include 进行关联查询
// 使用 Promise.all 并行查询
const [items, total] = await Promise.all([
  prisma.model.findMany({
    /* 查询配置 */
  }),
  prisma.model.count({
    /* 计数配置 */
  }),
]);
```

### 3. 唯一性检查

```typescript
// 生成唯一标识符
let slug = baseSlug;
let counter = 1;

while (true) {
  const existing = await prisma.model.findUnique({
    where: { slug },
  });

  if (!existing) break;
  slug = `${baseSlug}-${counter}`;
  counter++;
}
```

### 4. 状态码使用

- `200` - 成功操作
- `201` - 创建成功
- `400` - 客户端错误（验证失败等）
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器错误

## ✅ 已统一的接口文件

- ✅ `src/app/api/auth/register/route.ts` - 用户注册接口
- ✅ `src/app/api/auth/[...nextauth]/route.ts` - NextAuth 认证接口
- ✅ `src/app/api/categories/route.ts` - 分类管理接口
- ✅ `src/app/api/tags/route.ts` - 标签管理接口
- ✅ `src/app/api/search/route.ts` - 文章搜索接口
- ✅ `src/app/api/upload/route.ts` - 文件上传接口
- ✅ `src/app/api/posts/route.ts` - 文章列表和创建接口
- ✅ `src/app/api/posts/[id]/route.ts` - 文章详情管理接口
- ✅ `src/app/api/users/profile/route.ts` - 用户资料接口

## 🎯 总结

通过本次统一规范化工作，所有 API 接口现在都遵循统一的标准：

1. **一致的响应格式** - 提高前端开发体验
2. **标准的错误处理** - 便于调试和错误追踪
3. **完整的文档注释** - 提升代码可维护性
4. **严格的数据验证** - 确保数据安全和完整性
5. **正确的 BigInt 处理** - 避免序列化错误
6. **统一的代码风格** - 提高团队协作效率

这些标准将作为项目后续开发的基础规范，确保所有新增的 API 接口都能保持一致性和高质量。

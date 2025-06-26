# Prisma Schema 示例 (无外键设计)

## 1. 基础配置

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## 2. 用户相关模型

### 2.1 用户表
```prisma
model User {
  id             BigInt    @id @default(autoincrement())
  username       String    @unique @db.VarChar(50)
  email          String    @unique @db.VarChar(100)
  passwordHash   String    @map("password_hash") @db.VarChar(255)
  avatarUrl      String?   @map("avatar_url") @db.VarChar(500)
  bio            String?   @db.Text
  role           Role      @default(USER)
  status         UserStatus @default(ACTIVE)
  emailVerified  Boolean   @default(false) @map("email_verified")
  lastLoginAt    DateTime? @map("last_login_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  // 关联关系（无数据库外键约束）
  posts     Post[]
  comments  Comment[]
  likes     Like[]
  favorites Favorite[]
  profile   UserProfile?
  mediaFiles MediaFile[]
  postViews PostView[]
  notifications Notification[]

  @@index([username])
  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@map("users")
}

model UserProfile {
  userId         BigInt  @id @map("user_id")
  website        String? @db.VarChar(200)
  github         String? @db.VarChar(100)
  twitter        String? @db.VarChar(100)
  location       String? @db.VarChar(100)
  company        String? @db.VarChar(100)
  postsCount     Int     @default(0) @map("posts_count")
  followersCount Int     @default(0) @map("followers_count")
  followingCount Int     @default(0) @map("following_count")

  // 应用层关联，无数据库外键
  user User? @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([userId])
  @@map("user_profiles")
}

enum Role {
  USER
  AUTHOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}
```

### 2.2 内容相关模型
```prisma
model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  slug        String   @unique @db.VarChar(50)
  description String?  @db.Text
  color       String   @default("#007bff") @db.VarChar(7)
  postsCount  Int      @default(0) @map("posts_count")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 应用层关联
  posts Post[]

  @@index([slug])
  @@index([sortOrder])
  @@map("categories")
}

model Post {
  id           BigInt     @id @default(autoincrement())
  title        String     @db.VarChar(200)
  slug         String     @db.VarChar(200)
  summary      String?    @db.Text
  content      String     @db.LongText
  contentHtml  String?    @map("content_html") @db.LongText
  status       PostStatus @default(DRAFT)
  authorId     BigInt     @map("author_id")
  categoryId   Int?       @map("category_id")
  featuredImage String?   @map("featured_image") @db.VarChar(500)
  views        Int        @default(0)
  likesCount   Int        @default(0) @map("likes_count")
  commentsCount Int       @default(0) @map("comments_count")
  wordCount    Int        @default(0) @map("word_count")
  readingTime  Int        @default(0) @map("reading_time")
  publishedAt  DateTime?  @map("published_at")
  deletedAt    DateTime?  @map("deleted_at")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  // 应用层关联，无数据库外键
  author    User?     @relation(fields: [authorId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  category  Category? @relation(fields: [categoryId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  comments  Comment[]
  likes     Like[]
  favorites Favorite[]
  tags      PostTag[]
  views     PostView[]

  @@unique([authorId, slug])
  @@index([status])
  @@index([authorId])
  @@index([categoryId])
  @@index([publishedAt])
  @@index([views])
  @@index([createdAt])
  @@index([deletedAt])
  @@fulltext([title, content])
  @@map("posts")
}

model Tag {
  id         Int       @id @default(autoincrement())
  name       String    @unique @db.VarChar(50)
  slug       String    @unique @db.VarChar(50)
  color      String    @default("#6c757d") @db.VarChar(7)
  postsCount Int       @default(0) @map("posts_count")
  createdAt  DateTime  @default(now()) @map("created_at")

  // 应用层关联
  posts PostTag[]

  @@index([slug])
  @@index([postsCount])
  @@map("tags")
}

model PostTag {
  postId    BigInt   @map("post_id")
  tagId     Int      @map("tag_id")
  createdAt DateTime @default(now()) @map("created_at")

  // 应用层关联，无数据库外键
  post Post? @relation(fields: [postId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  tag  Tag?  @relation(fields: [tagId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@id([postId, tagId])
  @@index([tagId])
  @@index([postId])
  @@map("post_tags")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DELETED
}
```

### 2.3 互动相关模型
```prisma
model Comment {
  id           BigInt        @id @default(autoincrement())
  postId       BigInt        @map("post_id")
  userId       BigInt        @map("user_id")
  parentId     BigInt?       @map("parent_id")
  content      String        @db.Text
  contentHtml  String?       @map("content_html") @db.Text
  status       CommentStatus @default(PENDING)
  likesCount   Int           @default(0) @map("likes_count")
  repliesCount Int           @default(0) @map("replies_count")
  deletedAt    DateTime?     @map("deleted_at")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  // 应用层关联，无数据库外键
  post    Post?     @relation(fields: [postId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  user    User?     @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies Comment[] @relation("CommentReplies")
  likes   Like[]

  @@index([postId])
  @@index([userId])
  @@index([parentId])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("comments")
}

model Like {
  id         BigInt     @id @default(autoincrement())
  userId     BigInt     @map("user_id")
  targetType TargetType @map("target_type")
  targetId   BigInt     @map("target_id")
  createdAt  DateTime   @default(now()) @map("created_at")

  // 应用层关联，无数据库外键
  user    User?    @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  post    Post?    @relation(fields: [targetId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  comment Comment? @relation(fields: [targetId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([userId, targetType, targetId])
  @@index([targetType, targetId])
  @@index([userId])
  @@index([createdAt])
  @@map("likes")
}

model Favorite {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt   @map("user_id")
  postId    BigInt   @map("post_id")
  createdAt DateTime @default(now()) @map("created_at")

  // 应用层关联，无数据库外键
  user User? @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  post Post? @relation(fields: [postId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
  @@index([createdAt])
  @@map("favorites")
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  DELETED
}

enum TargetType {
  POST
  COMMENT
}
```

### 2.4 系统相关模型
```prisma
model MediaFile {
  id           BigInt    @id @default(autoincrement())
  userId       BigInt    @map("user_id")
  filename     String    @db.VarChar(255)
  originalName String    @map("original_name") @db.VarChar(255)
  filePath     String    @map("file_path") @db.VarChar(500)
  fileUrl      String    @map("file_url") @db.VarChar(500)
  fileSize     BigInt    @map("file_size")
  mimeType     String    @map("mime_type") @db.VarChar(100)
  fileType     FileType  @map("file_type")
  width        Int?
  height       Int?
  status       FileStatus @default(ACTIVE)
  deletedAt    DateTime? @map("deleted_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  // 应用层关联，无数据库外键
  user User? @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([userId])
  @@index([fileType])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("media_files")
}

model PostView {
  id        BigInt   @id @default(autoincrement())
  postId    BigInt   @map("post_id")
  userId    BigInt?  @map("user_id")
  ipAddress String   @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent") @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  // 应用层关联，无数据库外键
  post Post? @relation(fields: [postId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  user User? @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([postId])
  @@index([userId])
  @@index([ipAddress])
  @@index([createdAt])
  @@map("post_views")
}

model Notification {
  id        BigInt           @id @default(autoincrement())
  userId    BigInt           @map("user_id")
  type      NotificationType
  title     String           @db.VarChar(200)
  content   String?          @db.Text
  data      Json?
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  // 应用层关联，无数据库外键
  user User? @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([userId])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

enum FileType {
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  OTHER
}

enum FileStatus {
  ACTIVE
  DELETED
}

enum NotificationType {
  COMMENT
  LIKE
  FOLLOW
  SYSTEM
}
```

## 3. 关键设置说明

### 3.1 关联设置
所有关联都使用 `onDelete: NoAction, onUpdate: NoAction`，确保数据库层面不会有外键约束。

### 3.2 索引策略
- 为所有关联字段创建索引
- 为常用查询字段创建复合索引
- 为软删除字段创建索引

### 3.3 字段映射
使用 `@map` 将 Prisma 字段名映射到数据库字段名，保持 camelCase 和 snake_case 的一致性。

## 4. 使用示例

### 4.1 创建文章时的数据完整性验证
```typescript
export async function createPost(data: CreatePostInput) {
  // 验证用户存在
  const user = await prisma.user.findUnique({
    where: { id: data.authorId }
  })
  if (!user) {
    throw new Error('Author not found')
  }

  // 验证分类存在（如果指定）
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    })
    if (!category) {
      throw new Error('Category not found')
    }
  }

  // 创建文章
  return await prisma.post.create({
    data: {
      ...data,
      slug: generateSlug(data.title),
      status: 'DRAFT'
    }
  })
}
```

### 4.2 软删除实现
```typescript
export async function softDeletePost(postId: bigint, userId: bigint) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
      deletedAt: null
    }
  })

  if (!post) {
    throw new Error('Post not found or permission denied')
  }

  return await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'DELETED',
      deletedAt: new Date()
    }
  })
}
```

### 4.3 查询时排除软删除数据
```typescript
export async function getPublishedPosts() {
  return await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      deletedAt: null // 排除软删除的记录
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      },
      category: true,
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    },
    orderBy: {
      publishedAt: 'desc'
    }
  })
}
```

---

**说明**: 此 Schema 采用无外键设计，所有数据完整性都通过应用层代码保证。这种设计提供了更好的性能和扩展性，但需要开发者在应用层实现严格的数据验证逻辑。 
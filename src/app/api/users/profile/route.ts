import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const updateProfileSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
    .optional(),
  bio: z.string().max(500, '个人简介最多500个字符').optional(),
  avatarUrl: z.string().url('头像URL格式不正确').optional(),
  website: z.string().url('网站URL格式不正确').optional(),
  github: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
})

// 获取用户资料
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: '未登录' 
          } 
        },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.user.id) },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            website: true,
            github: true,
            twitter: true,
            location: true,
            company: true,
            postsCount: true,
            followersCount: true,
            followingCount: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'USER_NOT_FOUND',
            message: '用户不存在' 
          } 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('获取用户资料失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      },
      { status: 500 }
    )
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: '未登录' 
          } 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // 如果更新用户名，检查是否已存在
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: BigInt(session.user.id) }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'USERNAME_EXISTS',
              message: '用户名已存在' 
            } 
          },
          { status: 400 }
        )
      }
    }

    // 分离用户表和资料表的数据
    const { username, bio, avatarUrl, ...profileData } = validatedData

    // 更新用户基本信息
    const userUpdateData: any = {}
    if (username !== undefined) userUpdateData.username = username
    if (bio !== undefined) userUpdateData.bio = bio
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(session.user.id) },
      data: {
        ...userUpdateData,
        profile: {
          upsert: {
            create: profileData,
            update: profileData
          }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            website: true,
            github: true,
            twitter: true,
            location: true,
            company: true,
            postsCount: true,
            followersCount: true,
            followingCount: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: '资料更新成功'
    })

  } catch (error) {
    console.error('更新用户资料失败:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '数据验证失败',
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      },
      { status: 500 }
    )
  }
} 
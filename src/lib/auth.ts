import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// 扩展 NextAuth 类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    username: string
    role: string
    avatar?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    username?: string
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          

          const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
          })

          console.log('email :>> ', email);

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            avatar: user.avatarUrl || undefined,
            role: user.role,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
  },
} 
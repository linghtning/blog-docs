'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.username) {
      newErrors.username = '用户名不能为空'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线'
    }

    if (!formData.email) {
      newErrors.email = '邮箱不能为空'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符'
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含字母和数字'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        // 注册成功，跳转到登录页面
        router.push('/auth/login?message=注册成功，请登录')
      } else {
        // 处理注册错误
        if (data.error?.code === 'USERNAME_EXISTS') {
          setErrors({ username: '用户名已存在' })
        } else if (data.error?.code === 'EMAIL_EXISTS') {
          setErrors({ email: '邮箱已被使用' })
        } else if (data.error?.code === 'VALIDATION_ERROR') {
          // 处理验证错误
          const fieldErrors: { [key: string]: string } = {}
          data.error.details?.forEach((error: any) => {
            fieldErrors[error.path[0]] = error.message
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ submit: data.error?.message || '注册失败' })
        }
      }
    } catch (error) {
      console.error('注册失败:', error)
      setErrors({ submit: '网络错误，请稍后重试' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container px-4 py-16 mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">注册账户</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="用户名"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="3-20个字符，只能包含字母、数字和下划线"
              required
            />

            <Input
              label="邮箱"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="请输入邮箱地址"
              required
            />

            <Input
              label="密码"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="至少6个字符，必须包含字母和数字"
              required
            />

            <Input
              label="确认密码"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="请再次输入密码"
              required
            />

            {errors.submit && (
              <div className="text-sm text-center text-red-600">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '注册中...' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-center text-gray-600">
            已有账户？
            <Link href="/auth/login" className="ml-1 text-blue-600 hover:text-blue-800">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
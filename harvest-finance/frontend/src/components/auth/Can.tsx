'use client'

import type { ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { UserRole } from '@/lib/validations/auth'

interface CanProps {
  role: UserRole | UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function Can({ role, children, fallback = null }: CanProps) {
  const userRole = useAuthStore((state) => state.user?.role)
  const allowed = Array.isArray(role) ? role.includes(userRole as UserRole) : userRole === role

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}

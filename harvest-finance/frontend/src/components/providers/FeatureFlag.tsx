'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  getFeatureFlags,
  isFeatureEnabled,
  type FeatureFlagName,
} from '@/lib/feature-flags'

interface FeatureFlagProps {
  flag: FeatureFlagName
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag))

  useEffect(() => {
    const sync = () => setEnabled(isFeatureEnabled(flag))
    sync()
    window.addEventListener('harvest-feature-flags-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('harvest-feature-flags-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [flag])

  return enabled ? <>{children}</> : <>{fallback}</>
}

export function useFeatureFlagsState() {
  const [flags, setFlags] = useState(getFeatureFlags)

  useEffect(() => {
    const sync = () => setFlags(getFeatureFlags())
    window.addEventListener('harvest-feature-flags-change', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('harvest-feature-flags-change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return flags
}

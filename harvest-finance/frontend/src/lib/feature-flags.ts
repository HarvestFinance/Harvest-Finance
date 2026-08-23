import { env } from '@/lib/env'

export const FEATURE_FLAG_STORAGE_KEY = 'harvest_feature_flags'

export type FeatureFlagName = 'aiAssistant' | 'newMarketplace'

export type FeatureFlags = Record<FeatureFlagName, boolean>

const envFlags = (): FeatureFlags => ({
  aiAssistant: env.NEXT_PUBLIC_FF_AI_ASSISTANT,
  newMarketplace: env.NEXT_PUBLIC_FF_NEW_MARKETPLACE,
})

const readOverrides = (): Partial<FeatureFlags> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(FEATURE_FLAG_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<FeatureFlags>
  } catch {
    return {}
  }
}

export const getFeatureFlags = (): FeatureFlags => ({
  ...envFlags(),
  ...readOverrides(),
})

export const isFeatureEnabled = (flag: FeatureFlagName): boolean => getFeatureFlags()[flag]

export const setFeatureFlagOverride = (flag: FeatureFlagName, enabled: boolean) => {
  if (typeof window === 'undefined') return
  const next = { ...readOverrides(), [flag]: enabled }
  window.localStorage.setItem(FEATURE_FLAG_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('harvest-feature-flags-change', { detail: next }))
}

export const clearFeatureFlagOverrides = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(FEATURE_FLAG_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('harvest-feature-flags-change', { detail: {} }))
}

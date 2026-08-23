import { routes } from '../routes'
import { formatDate, formatRelativeTime } from '../datetime'
import { getFeatureFlags, setFeatureFlagOverride, FEATURE_FLAG_STORAGE_KEY } from '../feature-flags'

describe('typed routes', () => {
  it('builds static and dynamic hrefs', () => {
    expect(routes.dashboard()).toBe('/dashboard')
    expect(routes.operator('abc')).toBe('/operators/abc')
    expect(routes.strategy('yield-1')).toBe('/strategies/yield-1')
  })
})

describe('datetime helpers', () => {
  it('formats dates consistently with date-fns', () => {
    expect(formatDate(new Date(2024, 2, 24), 'yyyy-MM-dd')).toBe('2024-03-24')
    expect(formatRelativeTime(Date.now() - 60_000)).toMatch(/ago/)
  })
})

describe('feature flags', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FEATURE_FLAG_STORAGE_KEY)
  })

  it('allows runtime overrides without a deploy', () => {
    setFeatureFlagOverride('aiAssistant', false)
    expect(getFeatureFlags().aiAssistant).toBe(false)
    setFeatureFlagOverride('newMarketplace', false)
    expect(getFeatureFlags().newMarketplace).toBe(false)
  })
})

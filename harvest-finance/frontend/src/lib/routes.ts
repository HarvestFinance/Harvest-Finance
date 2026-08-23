export const routes = {
  home: () => '/' as const,
  login: () => '/login' as const,
  signup: () => '/signup' as const,
  forgotPassword: () => '/forgot-password' as const,
  resetPassword: () => '/reset-password' as const,
  dashboard: () => '/dashboard' as const,
  farmVaults: () => '/dashboard/farm-vaults' as const,
  sorobanSigning: () => '/dashboard/soroban-signing' as const,
  mobileDashboard: () => '/dashboard/mobile' as const,
  vaults: () => '/vaults' as const,
  portfolio: () => '/portfolio' as const,
  community: () => '/community' as const,
  marketplace: () => '/marketplace' as const,
  help: () => '/help' as const,
  settings: () => '/settings' as const,
  transactions: () => '/transactions' as const,
  yieldAnalytics: () => '/yield-analytics' as const,
  realtime: () => '/realtime' as const,
  adminDashboard: () => '/admin/dashboard' as const,
  adminRealtime: () => '/admin/realtime' as const,
  componentsDemo: () => '/components-demo' as const,
  operator: (id: string) => `/operators/${id}` as const,
  strategy: (id: string) => `/strategies/${id}` as const,
}

export type RouteBuilder = typeof routes
export type AppHref = ReturnType<RouteBuilder[keyof RouteBuilder]>

type RouterLike = {
  push: (href: string) => void
  replace?: (href: string) => void
}

export const pushRoute = (router: RouterLike, href: string) => {
  router.push(href)
}

export const replaceRoute = (router: RouterLike, href: string) => {
  if (router.replace) {
    router.replace(href)
    return
  }
  router.push(href)
}

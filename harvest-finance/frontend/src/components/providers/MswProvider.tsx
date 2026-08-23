'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { env } from '@/lib/env'

export function MswProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!env.NEXT_PUBLIC_ENABLE_MSW)

  useEffect(() => {
    if (!env.NEXT_PUBLIC_ENABLE_MSW) {
      setReady(true)
      return
    }

    let cancelled = false
    const start = async () => {
      const { worker } = await import('@/mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: '/mockServiceWorker.js' },
      })
      if (!cancelled) setReady(true)
    }

    void start()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return null
  return <>{children}</>
}

'use client'

import { ErrorState } from '../ErrorState'
import { LoadingState } from '../LoadingState'
import { EmptyState } from '../EmptyState'

export function RouteLoading() {
  return <LoadingState variant="page" title="Loading page" />
}

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      variant="page"
      title="Something went wrong"
      description={error.message || 'We encountered an unexpected error.'}
      onAction={reset}
      onSecondaryAction={() => {
        window.location.href = '/'
      }}
    />
  )
}

export function RouteNotFound() {
  return (
    <EmptyState
      variant="custom"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
      ctaLabel="Go home"
      ctaHref="/"
    />
  )
}

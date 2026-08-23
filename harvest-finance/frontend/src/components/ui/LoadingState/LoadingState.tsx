'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../types'

export type LoadingStateVariant = 'inline' | 'page' | 'card'

export interface LoadingStateProps {
  variant?: LoadingStateVariant
  title?: string
  description?: string
  className?: string
}

export function LoadingState({
  variant = 'page',
  title = 'Loading',
  description = 'Please wait while we prepare this view.',
  className = '',
}: LoadingStateProps) {
  const isInline = variant === 'inline'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        isInline
          ? 'flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[rgba(141,187,85,0.15)] bg-white dark:bg-[#162a1a] p-4'
          : 'flex flex-col items-center justify-center py-16 px-6 text-center',
        variant === 'card' && 'min-h-[12rem]',
        className,
      )}
    >
      <Loader2
        className={cn(
          'animate-spin text-harvest-green-600 dark:text-harvest-green-400',
          isInline ? 'h-5 w-5' : 'h-8 w-8 mb-4',
        )}
        aria-hidden="true"
      />
      <div>
        <p className={cn('font-semibold text-gray-900 dark:text-white', isInline ? 'text-sm' : 'text-lg mb-1')}>
          {title}
        </p>
        {description && (
          <p className={cn('text-gray-500 dark:text-gray-400', isInline ? 'text-xs' : 'text-sm max-w-sm')}>
            {description}
          </p>
        )}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}

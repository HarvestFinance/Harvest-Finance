'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import React, { forwardRef } from 'react'
import { ButtonProps, cn } from '../types'

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center font-medium',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-harvest-green-600 text-white',
          'hover:bg-harvest-green-700 active:bg-harvest-green-800',
          'focus-visible:ring-harvest-green-500',
          'shadow-sm hover:shadow-md active:shadow-sm',
        ].join(' '),
        secondary: [
          'bg-harvest-green-100 text-harvest-green-800',
          'hover:bg-harvest-green-200 active:bg-harvest-green-300',
          'focus-visible:ring-harvest-green-500',
          'dark:bg-harvest-green-900 dark:text-harvest-green-300',
          'dark:hover:bg-harvest-green-800 dark:active:bg-harvest-green-700',
        ].join(' '),
        outline: [
          'border-2 border-harvest-green-600 text-harvest-green-600',
          'bg-transparent hover:bg-harvest-green-50 active:bg-harvest-green-100',
          'focus-visible:ring-harvest-green-500',
          'dark:border-harvest-green-500 dark:text-harvest-green-400',
          'dark:hover:bg-harvest-green-900 dark:active:bg-harvest-green-800',
        ].join(' '),
        ghost: [
          'text-harvest-green-700',
          'hover:bg-harvest-green-100 active:bg-harvest-green-200',
          'focus-visible:ring-harvest-green-500',
          'dark:text-harvest-green-400',
          'dark:hover:bg-harvest-green-900 dark:active:bg-harvest-green-800',
        ].join(' '),
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700 active:bg-red-800',
          'focus-visible:ring-red-500',
          'shadow-sm hover:shadow-md active:shadow-sm',
        ].join(' '),
        success: [
          'bg-emerald-600 text-white',
          'hover:bg-emerald-700 active:bg-emerald-800',
          'focus-visible:ring-emerald-500',
          'shadow-sm hover:shadow-md active:shadow-sm',
        ].join(' '),
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
        sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2',
        lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
        xl: 'h-14 px-8 text-lg rounded-xl gap-3',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      type = 'button',
      'data-testid': testId,
      ...props
    },
    ref,
  ) => {
    const isDisabledOrLoading = isDisabled || disabled || isLoading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabledOrLoading}
        data-testid={testId}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        aria-disabled={isDisabledOrLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }

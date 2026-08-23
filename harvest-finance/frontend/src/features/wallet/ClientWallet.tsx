'use client'

import dynamic from 'next/dynamic'

export const ClientWalletButton = dynamic(
  () => import('./components/WalletButton').then((mod) => mod.WalletButton),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-10 w-28 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a3020]"
        aria-hidden="true"
      />
    ),
  },
)

export const ClientBalanceDisplay = dynamic(
  () => import('./components/BalanceDisplay').then((mod) => mod.BalanceDisplay),
  { ssr: false },
)

export const ClientCustodialWalletBadge = dynamic(
  () =>
    import('./components/CustodialWalletBadge').then((mod) => mod.CustodialWalletBadge),
  { ssr: false },
)

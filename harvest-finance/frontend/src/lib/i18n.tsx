'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'

export const SUPPORTED_LOCALES = ['en', 'yo', 'ig', 'ha'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_COOKIE = 'NEXT_LOCALE'
const LOCALE_STORAGE_KEY = 'NEXT_LOCALE'

const localeLoaders: Record<AppLocale, () => Promise<{ default: AbstractIntlMessages }>> = {
  en: () => import('@/messages/en.json'),
  yo: () => import('@/messages/yo.json'),
  ig: () => import('@/messages/ig.json'),
  ha: () => import('@/messages/ha.json'),
}

const isSupportedLocale = (value: string): value is AppLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value)

const persistLocale = (locale: AppLocale) => {
  if (typeof window === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)

  const userStr = localStorage.getItem('harvest_auth_user')
  if (!userStr) return
  try {
    const user = JSON.parse(userStr) as { id?: string }
    if (user?.id) {
      localStorage.setItem(`harvest_locale_user_${user.id}`, locale)
    }
  } catch {
    // ignore malformed user payload
  }
}

type I18nController = {
  locale: string
  changeLanguage: (lng: string) => Promise<void>
}

const I18nControllerContext = createContext<I18nController | null>(null)

interface I18nRuntimeProviderProps {
  initialLocale: string
  initialMessages: AbstractIntlMessages
  children: ReactNode
}

export function I18nRuntimeProvider({
  initialLocale,
  initialMessages,
  children,
}: I18nRuntimeProviderProps) {
  const [locale, setLocale] = useState(initialLocale)
  const [messages, setMessages] = useState(initialMessages)

  const changeLanguage = useCallback(async (lng: string) => {
    const next = isSupportedLocale(lng) ? lng : 'en'
    persistLocale(next)
    const loaded = await localeLoaders[next]()
    setLocale(next)
    setMessages(loaded.default)
  }, [])

  useEffect(() => {
    const onLocaleChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      if (detail && detail !== locale) {
        void changeLanguage(detail)
      }
    }
    window.addEventListener('harvest-locale-change', onLocaleChange)
    return () => window.removeEventListener('harvest-locale-change', onLocaleChange)
  }, [changeLanguage, locale])

  const value = useMemo(
    () => ({ locale, changeLanguage }),
    [locale, changeLanguage],
  )

  return (
    <I18nControllerContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nControllerContext.Provider>
  )
}

export function useTranslation() {
  const t = useTranslations()
  const controller = useContext(I18nControllerContext)

  return {
    t,
    i18n: {
      language: controller?.locale ?? 'en',
      changeLanguage: controller?.changeLanguage ?? (async () => undefined),
    },
  }
}

const defaultI18n = {
  language: 'en',
  changeLanguage: () => Promise.resolve(),
}

export default defaultI18n

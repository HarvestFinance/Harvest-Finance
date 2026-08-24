import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export type DateInput = Date | string | number

const toDate = (value: DateInput): Date => {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date(value)
}

export const formatDate = (value: DateInput, pattern = 'PP'): string => {
  const date = toDate(value)
  if (!isValid(date)) return ''
  return format(date, pattern)
}

export const formatDateTime = (value: DateInput, pattern = 'PPp'): string => {
  return formatDate(value, pattern)
}

export const formatChartTick = (value: DateInput, pattern = 'MMM dd'): string => {
  return formatDate(value, pattern)
}

export const formatRelativeTime = (value: DateInput, addSuffix = true): string => {
  const date = toDate(value)
  if (!isValid(date)) return ''
  return formatDistanceToNow(date, { addSuffix })
}

export const toTimestamp = (value: DateInput): number => toDate(value).getTime()

export const nowIso = (): string => new Date().toISOString()

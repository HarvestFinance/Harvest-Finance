import { z } from 'zod'

const emptyToUndefined = (value: unknown) =>
  value === '' || value === undefined || value === null ? undefined : value

const boolFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return defaultValue
    if (typeof value === 'boolean') return value
    const normalized = String(value).toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
    return defaultValue
  }, z.boolean())

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.preprocess(
    emptyToUndefined,
    z.string().default('http://localhost:5000/api/v1'),
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.string().default('')),
  NEXT_PUBLIC_ENABLE_MSW: boolFromEnv(false),
  NEXT_PUBLIC_FF_AI_ASSISTANT: boolFromEnv(true),
  NEXT_PUBLIC_FF_NEW_MARKETPLACE: boolFromEnv(true),
  NEXT_PUBLIC_BUNDLE_BUDGET_KB: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return 450
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 450
  }, z.number().positive().default(450)),
})

export type AppEnv = z.infer<typeof envSchema>

const readRawEnv = () => ({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ENABLE_MSW: process.env.NEXT_PUBLIC_ENABLE_MSW,
  NEXT_PUBLIC_FF_AI_ASSISTANT: process.env.NEXT_PUBLIC_FF_AI_ASSISTANT,
  NEXT_PUBLIC_FF_NEW_MARKETPLACE: process.env.NEXT_PUBLIC_FF_NEW_MARKETPLACE,
  NEXT_PUBLIC_BUNDLE_BUDGET_KB: process.env.NEXT_PUBLIC_BUNDLE_BUDGET_KB,
})

const parsed = envSchema.safeParse(readRawEnv())

if (!parsed.success) {
  console.warn('[env] Invalid NEXT_PUBLIC_* config, falling back to defaults', parsed.error.flatten())
}

export const env: AppEnv = parsed.success ? parsed.data : envSchema.parse({})

export const isMockApiEnabled = () => env.NEXT_PUBLIC_ENABLE_MSW

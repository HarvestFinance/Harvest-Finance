import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const NEXT_DIR = join(ROOT, '.next')
const BUDGET_PATH = join(ROOT, 'bundle-budget.json')
const BASELINE_PATH = join(ROOT, 'bundle-baseline.json')
const REPORT_PATH = join(NEXT_DIR, 'bundle-report.json')

const defaultBudget = {
  firstLoadJsKb: 450,
  regressionPercent: 10,
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const collectJsFiles = (dir, acc = []) => {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      collectJsFiles(full, acc)
    } else if (entry.name.endsWith('.js')) {
      acc.push(full)
    }
  }
  return acc
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10

if (!existsSync(NEXT_DIR)) {
  console.error('Missing .next build output. Run `npm run build` first.')
  process.exit(1)
}

const budget = existsSync(BUDGET_PATH) ? { ...defaultBudget, ...readJson(BUDGET_PATH) } : defaultBudget
const appManifestPath = join(NEXT_DIR, 'app-build-manifest.json')
const buildManifestPath = join(NEXT_DIR, 'build-manifest.json')
const appManifest = existsSync(appManifestPath) ? readJson(appManifestPath) : { pages: {} }
const buildManifest = existsSync(buildManifestPath) ? readJson(buildManifestPath) : {}

const staticRoot = join(NEXT_DIR, 'static')
const fileSizeCache = new Map()
const sizeOf = (relativePath) => {
  const cleaned = String(relativePath).replace(/^\/+/, '')
  const candidates = [
    join(NEXT_DIR, cleaned),
    join(ROOT, cleaned),
    join(staticRoot, cleaned.replace(/^static\//, '')),
  ]
  for (const candidate of candidates) {
    if (fileSizeCache.has(candidate)) return fileSizeCache.get(candidate)
    if (existsSync(candidate)) {
      const size = statSync(candidate).size
      fileSizeCache.set(candidate, size)
      return size
    }
  }
  return 0
}

const routeReport = {}
const pages = appManifest.pages || {}
for (const [route, files] of Object.entries(pages)) {
  const unique = [...new Set(files.filter((file) => file.endsWith('.js')))]
  const bytes = unique.reduce((sum, file) => sum + sizeOf(file), 0)
  routeReport[route] = { files: unique.length, kb: kb(bytes) }
}

const sharedFiles = [
  ...(buildManifest.rootMainFiles || []),
  ...(buildManifest.polyfillFiles || []),
  ...((buildManifest.pages && buildManifest.pages['/_app']) || []),
].filter((file) => typeof file === 'string' && file.endsWith('.js'))

const sharedBytes = [...new Set(sharedFiles)].reduce((sum, file) => sum + sizeOf(file), 0)
let firstLoadBytes = sharedBytes

if (firstLoadBytes === 0) {
  const chunks = collectJsFiles(join(NEXT_DIR, 'static', 'chunks'))
  firstLoadBytes = chunks
    .filter((file) => /framework|main|webpack|polyfill/.test(file))
    .reduce((sum, file) => sum + statSync(file).size, 0)
}

if (firstLoadBytes === 0) {
  const allJs = collectJsFiles(join(NEXT_DIR, 'static'))
  firstLoadBytes = allJs.reduce((sum, file) => sum + statSync(file).size, 0)
}

const report = {
  generatedAt: new Date().toISOString(),
  firstLoadJsKb: kb(firstLoadBytes),
  budgetKb: budget.firstLoadJsKb,
  regressionPercent: budget.regressionPercent,
  routes: routeReport,
}

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
console.log(`Bundle report written to ${REPORT_PATH}`)
console.log(`First-load JS: ${report.firstLoadJsKb} kB (budget ${budget.firstLoadJsKb} kB)`)

const failures = []
if (report.firstLoadJsKb > budget.firstLoadJsKb) {
  failures.push(
    `First-load JS ${report.firstLoadJsKb} kB exceeds budget of ${budget.firstLoadJsKb} kB`,
  )
}

if (existsSync(BASELINE_PATH)) {
  const baseline = readJson(BASELINE_PATH)
  const baselineRoutes = baseline.routes || {}
  for (const [route, current] of Object.entries(routeReport)) {
    const previous = baselineRoutes[route]
    if (!previous || !previous.kb) continue
    const delta = ((current.kb - previous.kb) / previous.kb) * 100
    if (delta > budget.regressionPercent) {
      failures.push(
        `Route ${route} grew ${delta.toFixed(1)}% (${previous.kb} kB -> ${current.kb} kB)`,
      )
    }
  }
} else {
  writeFileSync(BASELINE_PATH, JSON.stringify(report, null, 2))
  console.log(`Created bundle baseline at ${BASELINE_PATH}`)
}

if (failures.length > 0) {
  console.error('Bundle budget check failed:')
  for (const failure of failures) console.error(` - ${failure}`)
  process.exit(1)
}

console.log('Bundle budget check passed.')

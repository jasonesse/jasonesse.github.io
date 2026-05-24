import { readdirSync, type Dirent } from 'fs'
import { join } from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const CITY_CATALOG_VIRTUAL_ID = 'virtual:city-catalog'
const CITY_CATALOG_RESOLVED_ID = `\0${CITY_CATALOG_VIRTUAL_ID}`

function normalizeCityKey(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createCityCatalogSource(): string {
  const citiesDir = join(process.cwd(), 'public', 'cities')
  type CatalogDraft = { label: string; jsonPath?: string; imagePath?: string }
  const fileNames = readdirSync(citiesDir, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isFile())
    .map((entry: Dirent) => entry.name)

  const byStem = new Map<string, CatalogDraft>()

  for (const fileName of fileNames) {
    const dot = fileName.lastIndexOf('.')
    if (dot <= 0) continue

    const stem = fileName.slice(0, dot)
    const ext = fileName.slice(dot + 1).toLowerCase()
    const current: CatalogDraft = byStem.get(stem) ?? { label: stem }
    const encodedPath = `/cities/${encodeURIComponent(fileName)}`

    if (ext === 'json') current.jsonPath = encodedPath
    if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) current.imagePath = encodedPath
    byStem.set(stem, current)
  }

  const catalog = [...byStem.entries()]
    .filter(([, value]) => value.jsonPath)
    .map(([stem, value]) => ({
      key: normalizeCityKey(stem),
      label: value.label,
      jsonPath: value.jsonPath!,
      imagePath: value.imagePath,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return `export default ${JSON.stringify(catalog)};`
}

function cityCatalogPlugin(): Plugin {
  return {
    name: 'city-catalog-plugin',
    resolveId(id: string) {
      if (id === CITY_CATALOG_VIRTUAL_ID) return CITY_CATALOG_RESOLVED_ID
      return null
    },
    load(id: string) {
      if (id === CITY_CATALOG_RESOLVED_ID) return createCityCatalogSource()
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cityCatalogPlugin()],
})

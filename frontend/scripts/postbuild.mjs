import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = resolve(__dirname, '../dist')
const indexPath = resolve(distDir, 'index.html')
const notFoundPath = resolve(distDir, '404.html')

if (!existsSync(distDir)) {
  console.error('[postbuild] dist folder not found')
  process.exit(1)
}

if (!existsSync(indexPath)) {
  console.error('[postbuild] index.html not found in dist')
  process.exit(1)
}

mkdirSync(distDir, { recursive: true })
copyFileSync(indexPath, notFoundPath)
console.log('[postbuild] Created dist/404.html from dist/index.html')

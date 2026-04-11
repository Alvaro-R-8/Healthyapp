import sharp from 'sharp'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/icon.svg')
const publicDir = join(__dirname, '../public')

if (!existsSync(svgPath)) {
  console.error('icon.svg not found in public/')
  process.exit(1)
}

const svg = readFileSync(svgPath)

await sharp(svg).resize(192).png().toFile(join(publicDir, 'icon-192.png'))
console.log('Generated icon-192.png')

await sharp(svg).resize(512).png().toFile(join(publicDir, 'icon-512.png'))
console.log('Generated icon-512.png')

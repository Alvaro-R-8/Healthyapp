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

// iOS rounds the corners itself, so the touch icon is the full square.
const square = Buffer.from(svg.toString().replace(/ rx="\d+"/, ''))
await sharp(square).resize(180).png().toFile(join(publicDir, 'apple-touch-icon.png'))
console.log('Generated apple-touch-icon.png')

// Maskable: full-bleed background with the mark shrunk into the 80% safe zone.
const background = Buffer.from(square.toString().replace(/<path[^>]*\/>/g, ''))
const markOnly = Buffer.from(square.toString().replace(/<rect[^>]*\/>/, ''))
const mark = await sharp(markOnly).resize(410).png().toBuffer()
await sharp(background).resize(512).composite([{ input: mark, gravity: 'center' }]).png()
  .toFile(join(publicDir, 'icon-maskable-512.png'))
console.log('Generated icon-maskable-512.png')

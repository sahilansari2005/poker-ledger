import sharp from "sharp"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public")
const svg = readFileSync(join(publicDir, "pwa-icon.svg"))

const sizes = [
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, name))
  console.log(`wrote ${name}`)
}

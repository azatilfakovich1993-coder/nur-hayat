import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Фон -->
  <rect width="512" height="512" rx="96" fill="#070710"/>

  <!-- Золотое свечение в центре -->
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#C9A84C" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="#C9A84C" stop-opacity="0"/>
  </radialGradient>
  <rect width="512" height="512" rx="96" fill="url(#glow)"/>

  <!-- Полумесяц -->
  <g transform="translate(256, 220)">
    <!-- Большой круг -->
    <circle cx="0" cy="0" r="105" fill="#C9A84C"/>
    <!-- Вырез для формы полумесяца -->
    <circle cx="38" cy="-18" r="88" fill="#070710"/>
  </g>

  <!-- Звезда рядом с полумесяцем -->
  <g transform="translate(340, 148) scale(0.85)">
    <polygon points="0,-22 5,-8 20,-8 9,1 13,15 0,6 -13,15 -9,1 -20,-8 -5,-8"
      fill="#C9A84C"/>
  </g>

  <!-- Арабское слово نور (Нур = Свет) -->
  <text
    x="256" y="390"
    text-anchor="middle"
    font-family="serif"
    font-size="72"
    font-weight="bold"
    fill="#C9A84C"
    opacity="0.9"
  >نور</text>

  <!-- Подпись -->
  <text
    x="256" y="430"
    text-anchor="middle"
    font-family="sans-serif"
    font-size="22"
    fill="#C9A84C"
    opacity="0.5"
    letter-spacing="4"
  >HAYAT</text>
</svg>`

// Сохраняем SVG
writeFileSync('public/icons/icon.svg', svgIcon)

// Конвертируем в PNG
const svgBuffer = Buffer.from(svgIcon)

await sharp(svgBuffer).resize(512, 512).png().toFile('public/icons/icon-512.png')
console.log('✓ icon-512.png')

await sharp(svgBuffer).resize(192, 192).png().toFile('public/icons/icon-192.png')
console.log('✓ icon-192.png')

await sharp(svgBuffer).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')

await sharp(svgBuffer).resize(32, 32).png().toFile('public/favicon.ico')
console.log('✓ favicon.ico')

// Android mipmap icons
const androidSizes = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

for (const { dir, size } of androidSizes) {
  const base = `android/app/src/main/res/${dir}`
  await sharp(svgBuffer).resize(size, size).png().toFile(`${base}/ic_launcher.png`)
  await sharp(svgBuffer).resize(size, size).png().toFile(`${base}/ic_launcher_round.png`)
  await sharp(svgBuffer).resize(size, size).png().toFile(`${base}/ic_launcher_foreground.png`)
  console.log(`✓ Android ${dir} (${size}x${size})`)
}

console.log('Все иконки созданы!')

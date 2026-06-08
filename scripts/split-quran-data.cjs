// Разбивает огромные quran-*.json (бандлятся целиком, ~2.3 МБ в JS-чанке)
// на 114 файлов по сурам в public/quran-data/ — теперь открытие суры
// скачивает только её данные, а не весь Коран сразу (критично для мобильного интернета)
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const arabic  = require(path.join(ROOT, 'src/data/quran-arabic.json'))
const kuliev  = require(path.join(ROOT, 'src/data/quran-kuliev.json'))
const translit = require(path.join(ROOT, 'src/data/quran-translit.json'))

const outDir = path.join(ROOT, 'public/quran-data')
fs.mkdirSync(outDir, { recursive: true })

const byChapter = {}
for (const key of Object.keys(arabic)) {
  const [chapter] = key.split(':')
  if (!byChapter[chapter]) byChapter[chapter] = {}
  byChapter[chapter][key] = {
    a: arabic[key] || '',
    k: kuliev[key] || '',
    t: translit[key] || '',
  }
}

let count = 0
for (const [chapter, verses] of Object.entries(byChapter)) {
  fs.writeFileSync(path.join(outDir, `${chapter}.json`), JSON.stringify(verses))
  count++
}
console.log(`Записано ${count} файлов сур в ${outDir}`)

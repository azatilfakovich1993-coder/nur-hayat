import { TRANSLITERATIONS } from '../data/verses'

// Конвертация латинской транскрипции tanzil.net → кириллица
function latinToCyrillicFull(text) {
  if (!text) return ''
  const s = text
    .replace(/[''ʿʾ`]/g, '')   // убираем хамза/айн маркеры
    .replace(/[Đđ]/g, 'д')      // Đ = ض (эмфатический д)
    .toLowerCase()
  const r = s
    .replace(/sh/g, 'ш').replace(/kh/g, 'х').replace(/gh/g, 'г')
    .replace(/th/g, 'с').replace(/dh/g, 'з')
    .replace(/[āa]/g, 'а').replace(/b/g, 'б').replace(/d/g, 'д')
    .replace(/e/g, 'е').replace(/f/g, 'ф').replace(/h/g, 'х')
    .replace(/[īi]/g, 'и').replace(/j/g, 'дж').replace(/k/g, 'к')
    .replace(/l/g, 'л').replace(/m/g, 'м').replace(/n/g, 'н')
    .replace(/o/g, 'о').replace(/q/g, 'к').replace(/r/g, 'р')
    .replace(/s/g, 'с').replace(/t/g, 'т').replace(/[ūu]/g, 'у')
    .replace(/w/g, 'в').replace(/y/g, 'й').replace(/z/g, 'з')
  return r ? r[0].toUpperCase() + r.slice(1) : r
}

// Данные Корана лежат в public/quran-data/<сура>.json — по одному файлу на суру
// (вместо одного бандла на 2.3 МБ). Так открытие суры скачивает только её часть —
// критично для пользователей на медленном мобильном интернете.
const chapterCache = new Map() // id -> Promise<{ "1:1": { a, k, t }, ... }>

function loadChapter(chapterId) {
  const id = Number(chapterId)
  if (!chapterCache.has(id)) {
    chapterCache.set(
      id,
      fetch(`${import.meta.env.BASE_URL}quran-data/${id}.json`).then(r => r.json())
    )
  }
  return chapterCache.get(id)
}

// Длина Бисмиллы берётся из аята 1:1 (tanzil.net, точное совпадение диакритики)
let bismillahLenPromise = null
function getBismillahLen() {
  if (!bismillahLenPromise) {
    bismillahLenPromise = loadChapter(1).then(data => (data['1:1']?.a || '').length)
  }
  return bismillahLenPromise
}

export async function fetchVerse(key) {
  const [chapterId] = key.split(':')
  const data = await loadChapter(chapterId)
  const v = data[key]
  return {
    arabic:          v?.a || '',
    // Сначала — наша русская транскрипция (вручную составлена для аятов дня),
    // иначе — латинская транскрипция из общей базы (английский стиль tanzil.net)
    transliteration: TRANSLITERATIONS[key] || latinToCyrillicFull(v?.t) || '',
    translation:     v?.k || '',
    ref:             key,
    fromCache:       false,
  }
}

export async function fetchSura(chapterId) {
  const id = Number(chapterId)
  const [data, bismillahLen] = await Promise.all([loadChapter(chapterId), getBismillahLen()])
  const ayahs = []
  let i = 1
  while (true) {
    const key = `${chapterId}:${i}`
    const v = data[key]
    if (!v) break

    let arabic = v.a || ''
    // Убираем Бисмиллу из первого аята всех сур кроме 1 (Фатиха) и 9 (Тауба)
    if (i === 1 && id !== 1 && id !== 9) {
      arabic = arabic.slice(bismillahLen).trimStart()
    }

    ayahs.push({
      number:          i,
      arabic,
      transliteration: v.t || TRANSLITERATIONS[key] || '',
      translation:     v.k || '',
    })
    i++
  }

  return ayahs.length > 0 ? ayahs : null
}

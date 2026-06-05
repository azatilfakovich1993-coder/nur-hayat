import kulievData from '../data/quran-kuliev.json'
import arabicData from '../data/quran-arabic.json'
import translitData from '../data/quran-translit.json'
import { TRANSLITERATIONS } from '../data/verses'

// Длина Бисмиллы берётся из аята 1:1 (tanzil.net, точное совпадение диакритики)
const BISMILLAH_LEN = arabicData['1:1'].length

export async function fetchVerse(key) {
  return {
    arabic:          arabicData[key] || '',
    transliteration: translitData[key] || TRANSLITERATIONS[key] || '',
    translation:     kulievData[key] || '',
    ref:             key,
    fromCache:       false,
  }
}

export async function fetchSura(chapterId) {
  const id = Number(chapterId)
  const ayahs = []
  let i = 1
  while (true) {
    const key = `${chapterId}:${i}`
    if (!arabicData[key]) break

    let arabic = arabicData[key]
    // Убираем Бисмиллу из первого аята всех сур кроме 1 (Фатиха) и 9 (Тауба)
    if (i === 1 && id !== 1 && id !== 9) {
      arabic = arabic.slice(BISMILLAH_LEN).trimStart()
    }

    ayahs.push({
      number:          i,
      arabic,
      transliteration: translitData[key] || TRANSLITERATIONS[key] || '',
      translation:     kulievData[key] || '',
    })
    i++
  }

  return ayahs.length > 0 ? ayahs : null
}

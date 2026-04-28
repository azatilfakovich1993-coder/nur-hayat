import { FALLBACK_TRANSLATIONS, ARABIC_TEXTS, TRANSLITERATIONS } from '../data/verses'

// alquran.cloud — бесплатный API, не требует авторизации
const BASE = 'https://api.alquran.cloud/v1'

// Идентификаторы переводов
const EDITION = {
  131: 'ru.kuliev',
  107: 'ru.kuliev', // казахского нет на alquran.cloud, используем русский
  en:  'en.sahih',
}

function getEdition(translationId) {
  return EDITION[translationId] || 'ru.kuliev'
}

/**
 * Загружает один аят. Ключ формата "2:255".
 */
export async function fetchVerse(key, translationId = 131) {
  const edition = getEdition(translationId)
  try {
    const res = await fetch(
      `${BASE}/ayah/${key}/editions/quran-uthmani,${edition}`,
      { signal: AbortSignal.timeout(7000) }
    )
    if (!res.ok) throw new Error()
    const json = await res.json()
    const [arData, trData] = json.data

    return {
      arabic:          arData?.text || ARABIC_TEXTS[key] || '',
      transliteration: TRANSLITERATIONS[key] || '',
      translation:     trData?.text || FALLBACK_TRANSLATIONS[key] || '',
      ref:             key,
      fromCache:       false
    }
  } catch {
    return {
      arabic:          ARABIC_TEXTS[key]          || '',
      transliteration: TRANSLITERATIONS[key]      || '',
      translation:     FALLBACK_TRANSLATIONS[key] || '',
      ref:             key,
      fromCache:       true
    }
  }
}

/**
 * Загружает все аяты суры.
 * Возвращает массив { number, arabic, translation } или null при ошибке.
 */
export async function fetchSura(chapterId, translationId = 131) {
  const edition = getEdition(translationId)
  try {
    const res = await fetch(
      `${BASE}/surah/${chapterId}/editions/quran-uthmani,en.transliteration,${edition}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (!res.ok) throw new Error()
    const json = await res.json()
    const [arEdition, tlEdition, trEdition] = json.data

    const BISMILLAH_PREFIX = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
    const BISMILLAH_PREFIX2 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'

    return arEdition.ayahs.map((ayah, i) => {
      let arabic = ayah.text
      // Убираем Бисмиллу из начала первого аята (кроме сур 1 и 9, где она часть текста)
      if (i === 0 && chapterId !== 1 && chapterId !== 9) {
        if (arabic.startsWith(BISMILLAH_PREFIX)) {
          arabic = arabic.slice(BISMILLAH_PREFIX.length).trimStart()
        } else if (arabic.startsWith(BISMILLAH_PREFIX2)) {
          arabic = arabic.slice(BISMILLAH_PREFIX2.length).trimStart()
        }
      }
      return {
        number:          ayah.numberInSurah,
        arabic,
        transliteration: tlEdition?.ayahs?.[i]?.text || '',
        translation:     trEdition?.ayahs?.[i]?.text || ''
      }
    })
  } catch {
    return null
  }
}

import { FALLBACK_TRANSLATIONS, ARABIC_TEXTS } from '../data/verses'

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
      arabic:      arData?.text || ARABIC_TEXTS[key] || '',
      translation: trData?.text || FALLBACK_TRANSLATIONS[key] || '',
      ref:         key,
      fromCache:   false
    }
  } catch {
    // Интернета нет — используем встроенные данные
    return {
      arabic:      ARABIC_TEXTS[key]          || '',
      translation: FALLBACK_TRANSLATIONS[key] || '',
      ref:         key,
      fromCache:   true
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

    return arEdition.ayahs.map((ayah, i) => ({
      number:          ayah.numberInSurah,
      arabic:          ayah.text,
      transliteration: tlEdition?.ayahs?.[i]?.text || '',
      translation:     trEdition?.ayahs?.[i]?.text || ''
    }))
  } catch {
    return null
  }
}

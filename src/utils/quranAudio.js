// Адрес аудио чтения Корана.
//
// Раньше всё аудио шло через edge-функцию Supabase (audio-proxy): напрямую
// cdn.islamic.network у части провайдеров РФ не открывается. Но так каждый
// прослушанный аят тратил квоту Supabase на исходящий трафик — ту самую,
// исчерпание которой дважды укладывало приложение целиком, вместе со входом.
//
// Теперь чтец по умолчанию и записи целых сур лежат в отдельном хранилище
// (Timeweb) — там трафик стоит копейки и ничего общего с базой не имеет.
// Остальные чтецы выбираются редко и по-прежнему идут через прокси: держать
// зеркало всех троих было бы 7 ГБ вместо 2,8 и подняло бы тариф хранилища.
const MIRROR     = import.meta.env.VITE_AUDIO_BASE_URL
const PROXY      = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-proxy?url=`
const CDN_PREFIX = 'https://cdn.islamic.network/'

// Что именно перенесено. Пути в хранилище повторяют исходные один в один,
// поэтому от адреса меняется только начало.
const MIRRORED = [
  'quran/audio/128/ar.alafasy/',
  'quran/audio-surah/128/ar.alafasy/',
]

export function quranAudioUrl(cdnUrl) {
  if (MIRROR && cdnUrl.startsWith(CDN_PREFIX)) {
    const rest = cdnUrl.slice(CDN_PREFIX.length)
    if (MIRRORED.some(p => rest.startsWith(p))) {
      return `${MIRROR.replace(/\/+$/, '')}/${rest}`
    }
  }
  return PROXY + encodeURIComponent(cdnUrl)
}

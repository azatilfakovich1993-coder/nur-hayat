import { EVENTS_BY_YEAR, ISLAMIC_EVENTS } from '../data/islamic-calendar'
import { generateShareCard, shareCardImage } from './shareCard'
import { localDateStr } from './date'

const EVENT_META = Object.fromEntries(ISLAMIC_EVENTS.map(e => [e.id, e]))
const EID_IDS = ['fitr', 'adha']

// По местному времени: через toISOString() (UTC) ночью, с полуночи и до +3/+4
// часов, «сегодня» ещё вчерашнее — и поздравление с Ид не показалось бы тем,
// кто открыл приложение рано утром в сам праздник.
function todayStr() {
  return localDateStr()
}

// Только сам день праздника — Ид аль-Фитр и Ид аль-Адха оба длятся 1 день
// баннера/поздравления (без многодневного продления на дни Ташрик).
export function getEidToday() {
  const today = todayStr()
  const year = new Date().getFullYear()
  const events = [...(EVENTS_BY_YEAR[year] || []), ...(EVENTS_BY_YEAR[year + 1] || [])]
  const ev = events.find(e => EID_IDS.includes(e.id) && e.date === today)
  if (!ev) return null

  const meta = EVENT_META[ev.id]
  const eidDua = meta.duas.find(d => d.source.includes('Поздравлен'))
  const eidName = meta.short.split(' — ')[0]
  // См. HolidayPopup: дословный перевод дуа («да примет Аллах от нас и от
  // вас») звучит странно вне личного диалога — используем прямое поздравление,
  // арабский текст дуа при этом остаётся подлинным и неизменным.
  const eidGreeting = `С ${eidName}! Пусть Аллах примет твой пост и молитвы в этот благословенный день.`

  return { event: ev, meta, eidDua, eidName, eidGreeting }
}

export async function shareEidGreeting(eid) {
  if (!eid?.eidDua) return
  const blob = await generateShareCard({
    kind: 'eid',
    arabic: eid.eidDua.ar,
    translit: eid.eidDua.translit,
    translation: eid.eidGreeting,
    source: eid.meta.title,
  })
  await shareCardImage(blob, 'Поделиться поздравлением')
}

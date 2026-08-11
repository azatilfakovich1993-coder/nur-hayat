import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { supabase } from '../supabase/client'
import { localDateStr } from '../utils/date'

// Раньше азкары жили ТОЛЬКО на сервере: на телефоне для них не ставилось ни
// одного будильника, поэтому любой сбой check-prayers (а он был сломан трое
// суток) означал, что напоминания молча исчезали, и понять это со стороны
// пользователя было невозможно. Теперь телефон планирует их сам, как намаз и
// аят дня, а сервер остаётся запасным каналом для web/iOS.
const CHANNEL_ID = 'azkar_reminders'
const DAYS_AHEAD = 30
const MORNING_ID = 9200 // занято: намаз 0-499, аят дня 9000-9034, праздники 9100-9139
const EVENING_ID = 9300

// Азкары привязаны к намазу: утренние читают после Фаджра, вечерние — после
// Асра. Отступаем полчаса, чтобы напоминание не совпало с самим намазом.
const OFFSET_MIN = 30
// Летом Фаджр очень ранний (в Москве 02:40 → азкар в 03:10), и автоматически
// выставленное напоминание будило бы среди ночи тех, кто Фаджр не читает.
// Ограничение только для значения ПО УМОЛЧАНИЮ — вручную можно поставить любое.
const MORNING_NOT_BEFORE = '05:00'
const FALLBACK = { morning: '06:00', evening: '17:00' }

function addMinutes(hhmm, mins) {
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const t = ((h * 60 + m + mins) % 1440 + 1440) % 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

// Время азкаров по умолчанию — от намаза пользователя. Без сохранённых времён
// намаза (город ещё не задан) падаем на нейтральные значения.
export function azkarDefaults(timings) {
  const fromFajr = timings?.Fajr ? addMinutes(timings.Fajr, OFFSET_MIN) : null
  const fromAsr  = timings?.Asr  ? addMinutes(timings.Asr,  OFFSET_MIN) : null
  return {
    morning: fromFajr ? (fromFajr < MORNING_NOT_BEFORE ? MORNING_NOT_BEFORE : fromFajr) : FALLBACK.morning,
    evening: fromAsr || FALLBACK.evening,
  }
}

// Докуда телефон уже расставил будильники — чтобы check-prayers не слал на
// этот android дублирующий push. null = покрытия нет, сервер снова главный.
async function reportCoverage(userId, untilDate) {
  if (!userId) return
  const { error } = await supabase.from('prayer_schedules').upsert(
    { user_id: userId, azkar_local_until: untilDate },
    { onConflict: 'user_id' },
  )
  if (error) console.warn('[Azkar] coverage sync failed:', error.message)
}

export async function cancelAzkarNotifs(userId) {
  try {
    const { notifications: pending } = await LocalNotifications.getPending()
    const old = pending.filter(n =>
      (n.id >= MORNING_ID && n.id < MORNING_ID + DAYS_AHEAD) ||
      (n.id >= EVENING_ID && n.id < EVENING_ID + DAYS_AHEAD))
    if (old.length > 0) await LocalNotifications.cancel({ notifications: old })
  } catch (err) {
    console.warn('[Azkar] cancel error:', err.message)
  }
  await reportCoverage(userId, null)
}

const KINDS = [
  { key: 'morning', baseId: MORNING_ID, title: '🌅 Утренние азкары',
    body: 'Время для утренних зикров — начни день с поминания Аллаха' },
  { key: 'evening', baseId: EVENING_ID, title: '🌆 Вечерние азкары',
    body: 'Время для вечерних зикров — заверши день словами благодарности' },
]

export async function scheduleAzkarNotifs(userId, times) {
  // Перепланирование всегда начинается с полной отмены — иначе смена времени
  // оставляла старый будильник висеть до срабатывания рядом с новым.
  await cancelAzkarNotifs(userId)
  if (!times?.morning || !times?.evening) return

  try {
    await LocalNotifications.createChannel({
      id:          CHANNEL_ID,
      name:        'Азкары',
      description: 'Утренние и вечерние напоминания о зикре',
      importance:  4,
      sound:       'default',
      vibration:   true,
    }).catch(() => {})

    const { display } = await LocalNotifications.requestPermissions()
    if (display !== 'granted') return

    const today = new Date()
    const notifications = []
    let lastDate = null

    for (const kind of KINDS) {
      const [h, m] = times[kind.key].slice(0, 5).split(':').map(Number)
      if (!Number.isFinite(h) || !Number.isFinite(m)) continue

      for (let i = 0; i < DAYS_AHEAD; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        date.setHours(h, m, 0, 0)
        if (date.getTime() <= Date.now()) continue

        notifications.push({
          id:        kind.baseId + i,
          title:     kind.title,
          body:      kind.body,
          schedule:  { at: date, allowWhileIdle: true },
          channelId: CHANNEL_ID,
          smallIcon: 'ic_launcher',
          iconColor: '#C9A84C',
        })
        if (!lastDate || date > lastDate) lastDate = date
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
      await reportCoverage(userId, localDateStr(lastDate))
    }
  } catch (err) {
    console.warn('[Azkar] schedule error:', err.message)
  }
}

export function useAzkarNotif(user) {
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    let cancelled = false

    supabase.from('prayer_schedules')
      .select('azkar_notif_enabled, morning_adhkar_time, evening_adhkar_time, timings')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (cancelled) return
        if (data?.azkar_notif_enabled === false) {
          await cancelAzkarNotifs(user.id)
          return
        }
        // Тумблер включён (по умолчанию тоже), но время ни разу не задано —
        // раньше это означало ноль уведомлений вообще без объяснения причин.
        // Подставляем время от намаза, сохраняем в БД, чтобы поля в Профиле
        // показывали конкретные значения и их можно было поправить.
        const defaults = azkarDefaults(data?.timings)
        const times = {
          morning: data?.morning_adhkar_time?.slice(0, 5) || defaults.morning,
          evening: data?.evening_adhkar_time?.slice(0, 5) || defaults.evening,
        }
        if (!data?.morning_adhkar_time || !data?.evening_adhkar_time) {
          await supabase.from('prayer_schedules').upsert({
            user_id:             user.id,
            morning_adhkar_time: times.morning,
            evening_adhkar_time: times.evening,
          }, { onConflict: 'user_id' })
        }
        localStorage.setItem('notif_morning', times.morning)
        localStorage.setItem('notif_evening', times.evening)
        await scheduleAzkarNotifs(user.id, times)
      })

    return () => { cancelled = true }
  }, [user?.id])
}

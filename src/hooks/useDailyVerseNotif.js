import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { supabase } from '../supabase/client'
import { APP_VERSES, FALLBACK_TRANSLATIONS } from '../data/verses'
import { localDateStr } from '../utils/date'

const CHANNEL_ID = 'daily_verse'
const NOTIF_HOUR = 8   // 8:00 утра
const DAYS_AHEAD = 30  // планируем на 30 дней вперёд
const BASE_ID    = 9000 // ID чтобы не конфликтовать с намазом

// Сообщаем серверу, по какую локальную дату телефон уже расставил будильники,
// чтобы daily-verse не слал на этот android второй, дублирующий push.
// null — покрытия нет (уведомления выключены/отменены), сервер снова главный.
async function reportLocalCoverage(userId, untilDate) {
  if (!userId) return
  const { error } = await supabase.from('prayer_schedules').upsert(
    { user_id: userId, daily_verse_local_until: untilDate },
    { onConflict: 'user_id' },
  )
  if (error) console.warn('[DailyVerse] coverage sync failed:', error.message)
}

export async function cancelDailyVerseNotifs(userId) {
  try {
    const { notifications: pending } = await LocalNotifications.getPending()
    const old = pending.filter(n => n.id >= BASE_ID && n.id < BASE_ID + DAYS_AHEAD + 5)
    if (old.length > 0) await LocalNotifications.cancel({ notifications: old })
  } catch (err) {
    console.warn('[DailyVerse] cancel error:', err.message)
  }
  await reportLocalCoverage(userId, null)
}

export async function scheduleDailyVerseNotifs(userId) {
  if (localStorage.getItem('daily_verse_enabled') === 'false') {
    await cancelDailyVerseNotifs(userId)
    return
  }
  try {
    await LocalNotifications.createChannel({
      id:          CHANNEL_ID,
      name:        'Аят дня',
      description: 'Ежедневный аят из Корана',
      importance:  4,
      sound:       'default',
      vibration:   true,
    }).catch(() => {})

    const { display } = await LocalNotifications.requestPermissions()
    // Разрешения нет — локальных будильников не будет, значит покрытия тоже:
    // снимаем отметку, чтобы сервер снова взял этого пользователя на себя.
    if (display !== 'granted') { await reportLocalCoverage(userId, null); return }

    // Отменяем старые запланированные уведомления аята дня
    const { notifications: pending } = await LocalNotifications.getPending()
    const old = pending.filter(n => n.id >= BASE_ID && n.id < BASE_ID + DAYS_AHEAD + 5)
    if (old.length > 0) await LocalNotifications.cancel({ notifications: old })

    const today = new Date()
    const todayDayNum = Math.floor(Date.now() / 86400000)
    const notifications = []
    let lastDate = null

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      date.setHours(NOTIF_HOUR, 0, 0, 0)

      // Если сегодняшнее время уже прошло — пропускаем сегодня
      if (date.getTime() <= Date.now()) continue

      const dayNum = todayDayNum + i
      const verse = APP_VERSES.daily[dayNum % APP_VERSES.daily.length]
      const translation = FALLBACK_TRANSLATIONS[verse.key] || ''

      // Обрезаем перевод до ~80 символов для уведомления
      const body = translation.length > 80
        ? translation.slice(0, 77) + '...'
        : translation

      notifications.push({
        id:       BASE_ID + i,
        title:    `🌙 Аят дня — ${verse.theme}`,
        body,
        schedule: { at: date, allowWhileIdle: true },
        channelId: CHANNEL_ID,
        extra:    { verseKey: verse.key },
      })
      lastDate = date
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
      await reportLocalCoverage(userId, localDateStr(lastDate))
    }
  } catch (err) {
    console.warn('[DailyVerse] schedule error:', err.message)
  }
}

export function useDailyVerseNotif(user) {
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    let cancelled = false

    // localStorage на этом устройстве может быть пустым (переустановка) или
    // устаревшим (выключили с другого телефона) — источник правды в БД,
    // иначе будильники продолжали ставиться вопреки выключенному тумблеру.
    supabase.from('prayer_schedules')
      .select('daily_verse_enabled')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const enabled = data?.daily_verse_enabled !== false
        localStorage.setItem('daily_verse_enabled', String(enabled))
        return enabled ? scheduleDailyVerseNotifs(user.id) : cancelDailyVerseNotifs(user.id)
      })

    return () => { cancelled = true }
  }, [user?.id])
}

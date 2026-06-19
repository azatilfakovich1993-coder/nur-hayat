import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { APP_VERSES, FALLBACK_TRANSLATIONS } from '../data/verses'

const CHANNEL_ID = 'daily_verse'
const NOTIF_HOUR = 8   // 8:00 утра
const DAYS_AHEAD = 30  // планируем на 30 дней вперёд
const BASE_ID    = 9000 // ID чтобы не конфликтовать с намазом

async function scheduleDailyVerseNotifs() {
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
    if (display !== 'granted') return

    // Отменяем старые запланированные уведомления аята дня
    const { notifications: pending } = await LocalNotifications.getPending()
    const old = pending.filter(n => n.id >= BASE_ID && n.id < BASE_ID + DAYS_AHEAD + 5)
    if (old.length > 0) await LocalNotifications.cancel({ notifications: old })

    const today = new Date()
    const todayDayNum = Math.floor(Date.now() / 86400000)
    const notifications = []

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
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (err) {
    console.warn('[DailyVerse] schedule error:', err.message)
  }
}

export function useDailyVerseNotif(user) {
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    scheduleDailyVerseNotifs()
  }, [user?.id])
}

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { EVENTS_BY_YEAR, ISLAMIC_EVENTS } from '../data/islamic-calendar'

const CHANNEL_ID = 'islamic_holidays'
const NOTIF_HOUR = 9   // 9:00 утра
const BASE_ID    = 9100 // ID чтобы не конфликтовать с намазом (0-499) и аятом дня (9000-9034)
const MAX_NOTIFS = 40   // с запасом — событий в году ~10, по 2 напоминания каждое

const EVENT_META = Object.fromEntries(ISLAMIC_EVENTS.map(e => [e.id, e]))

function upcomingEvents() {
  const year = new Date().getFullYear()
  const raw = [...(EVENTS_BY_YEAR[year] || []), ...(EVENTS_BY_YEAR[year + 1] || [])]
  return raw.filter(e => EVENT_META[e.id])
}

export async function cancelIslamicHolidayNotifs() {
  try {
    const { notifications: pending } = await LocalNotifications.getPending()
    const old = pending.filter(n => n.id >= BASE_ID && n.id < BASE_ID + MAX_NOTIFS)
    if (old.length > 0) await LocalNotifications.cancel({ notifications: old })
  } catch (err) {
    console.warn('[IslamicHolidays] cancel error:', err.message)
  }
}

export async function scheduleIslamicHolidayNotifs() {
  if (localStorage.getItem('islamic_holidays_enabled') === 'false') {
    await cancelIslamicHolidayNotifs()
    return
  }
  try {
    await LocalNotifications.createChannel({
      id:          CHANNEL_ID,
      name:        'Исламские праздники',
      description: 'Напоминания за 3 дня и в день праздника',
      importance:  4,
      sound:       'default',
      vibration:   true,
    }).catch(() => {})

    const { display } = await LocalNotifications.requestPermissions()
    if (display !== 'granted') return

    await cancelIslamicHolidayNotifs()

    const now = Date.now()
    const notifications = []
    let idOffset = 0

    for (const ev of upcomingEvents()) {
      const meta = EVENT_META[ev.id]
      const eventDate = new Date(`${ev.date}T${String(NOTIF_HOUR).padStart(2, '0')}:00:00`)

      const before = new Date(eventDate)
      before.setDate(before.getDate() - 3)
      if (before.getTime() > now && idOffset < MAX_NOTIFS) {
        notifications.push({
          id:        BASE_ID + idOffset++,
          title:     `${meta.icon} Через 3 дня — ${meta.title}`,
          body:      meta.short,
          schedule:  { at: before, allowWhileIdle: true },
          channelId: CHANNEL_ID,
          extra:     { eventId: ev.id },
        })
      }

      if (eventDate.getTime() > now && idOffset < MAX_NOTIFS) {
        notifications.push({
          id:        BASE_ID + idOffset++,
          title:     `${meta.icon} Сегодня — ${meta.title}`,
          body:      meta.short,
          schedule:  { at: eventDate, allowWhileIdle: true },
          channelId: CHANNEL_ID,
          extra:     { eventId: ev.id },
        })
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (err) {
    console.warn('[IslamicHolidays] schedule error:', err.message)
  }
}

export function useIslamicHolidayNotif(user) {
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return
    scheduleIslamicHolidayNotifs()
  }, [user?.id])
}

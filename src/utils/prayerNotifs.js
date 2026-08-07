import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

// Веб-фолбэк (setTimeout) для намаза — общий массив, чтобы отмена могла
// вызываться и из ProfilePage.jsx (тумблер), и из PrayerPage.jsx (планирование
// и кнопка 🔔/🔕), не завися от того, какая из страниц сейчас смонтирована.
const timerIds = []
export function clearAllTimers() { timerIds.forEach(clearTimeout); timerIds.length = 0 }
export function pushTimer(id) { timerIds.push(id) }

// Отменяет уже поставленные на телефоне будильники намазов (ID 0–499).
// Раньше выключение уведомлений (в Профиле или кнопкой 🔔/🔕 на странице
// Намаз) только останавливало ПЛАНИРОВАНИЕ новых — уже поставленные на день
// будильники продолжали срабатывать, потому что их никто явно не отменял.
export async function cancelPrayerNotifs() {
  if (!Capacitor.isNativePlatform()) { clearAllTimers(); return }
  try {
    const { notifications: pending } = await LocalNotifications.getPending()
    const toCancel = pending.filter(n => n.id < 500).map(n => ({ id: n.id }))
    if (toCancel.length > 0) await LocalNotifications.cancel({ notifications: toCancel })
  } catch {}
}

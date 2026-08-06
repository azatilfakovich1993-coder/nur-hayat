import { useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'
import { fetchTimings } from '../utils/prayerTimes'
import { localDateStr } from '../utils/date'

// Для нового пользователя, который ещё ни разу не заходил во вкладку "Намаз"
// (и потому не задавал город), пытаемся один раз сами определить геолокацию
// и сразу сохранить времена намаза + дефолтные напоминания (30/20/10 мин) на
// сервер — чтобы push о намазе начал приходить сразу после регистрации, а не
// только после того, как человек сам откроет вкладку "Намаз". Дальше он может
// настроить или выключить это как обычно — через вкладку "Намаз" или Профиль.
export function useAutoPrayerSetup(user) {
  const triedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    if (triedRef.current) return
    // Уже был во вкладке "Намаз" (город/режим уже сохранены) — не вмешиваемся
    if (localStorage.getItem('prayer_city') || localStorage.getItem('prayer_mode')) return
    if (!navigator.geolocation) return
    triedRef.current = true

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords
          const method    = parseInt(localStorage.getItem('prayer_method') || '15')
          const school    = parseInt(localStorage.getItem('prayer_school') || '0')
          const fajrAngle = parseInt(localStorage.getItem('prayer_fajr')   || '18')
          const ishaAngle = parseInt(localStorage.getItem('prayer_isha')   || '17')

          const data = await fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle)
          const { Fajr, Dhuhr, Asr, Maghrib, Isha } = data.timings

          localStorage.setItem('prayer_mode', 'auto')

          await supabase.from('prayer_schedules').upsert({
            user_id:              user.id,
            date:                 localDateStr(),
            timings:              { Fajr, Dhuhr, Asr, Maghrib, Isha },
            remind_before:        [30, 20, 10],
            utc_offset:           -new Date().getTimezoneOffset(),
            prayer_notif_enabled: true,
          }, { onConflict: 'user_id' })
        } catch {
          // сеть/API недоступны — пользователь настроит вручную во вкладке "Намаз"
        }
      },
      () => {
        // геолокация отклонена/недоступна — без нее не узнать время намаза,
        // дальше только вручную через вкладку "Намаз" (выбор города)
      },
      { timeout: 15000, maximumAge: 60000 },
    )
  }, [user?.id])
}

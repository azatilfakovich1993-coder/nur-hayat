import { useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'
import { fetchTimings, DEFAULT_METHOD, METHOD_MIGRATED_KEY } from '../utils/prayerTimes'
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
          // Настройки на сервере уже есть — человек их когда-то задавал (с
          // другого устройства или до переустановки, когда localStorage был
          // пуст). Раньше мы всё равно перезаписывали строку с
          // prayer_notif_enabled: true и дефолтными 30/20/10, молча включая
          // уведомления обратно тому, кто их специально выключил.
          const { data: existing } = await supabase
            .from('prayer_schedules')
            .select('prayer_notif_enabled')
            .eq('user_id', user.id)
            .maybeSingle()
          if (existing?.prayer_notif_enabled != null) return

          const { latitude: lat, longitude: lon } = pos.coords
          const method    = parseInt(localStorage.getItem('prayer_method') || String(DEFAULT_METHOD))
          const school    = parseInt(localStorage.getItem('prayer_school') || '0')
          const fajrAngle = parseInt(localStorage.getItem('prayer_fajr')   || '18')
          const ishaAngle = parseInt(localStorage.getItem('prayer_isha')   || '17')

          const data = await fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle)
          const { Fajr, Dhuhr, Asr, Maghrib, Isha } = data.timings

          localStorage.setItem('prayer_mode', 'auto')
          // Сразу закрепляем метод расчёта, которым только что посчитали
          // времена. Без этого во вкладке «Намаз» срабатывал перевод старых
          // пользователей на «Свои углы»: он считает признаком «человек уже
          // пользовался приложением» в том числе запись prayer_mode — а её
          // оставляла эта самая автонастройка. В итоге НОВЫЙ пользователь
          // получал углы 18/17 вместо российского САМР 16/15, и показанные
          // времена расходились с теми, что здесь ушли на сервер.
          localStorage.setItem('prayer_method', String(method))
          localStorage.setItem(METHOD_MIGRATED_KEY, '1')

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
      // Полчаса — как и во вкладке «Намаз»: свежее измерение телефон ищет в
      // помещении до пятнадцати секунд, а на расчёт времён это не влияет.
      { timeout: 15000, maximumAge: 30 * 60 * 1000 },
    )
  }, [user?.id])
}

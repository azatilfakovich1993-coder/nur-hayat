import { useEffect } from 'react'
import { supabase } from '../supabase/client'

// prayer_schedules.utc_offset раньше обновлялся только когда пользователь
// открывал страницу "Намаз" или "Профиль" — при смене часового пояса без
// захода на нужный экран сервер продолжал слать намаз/азкары/аят дня по
// старому времени. Держим offset свежим для любого залогиненного пользователя.
export function useSyncUtcOffset(user) {
  useEffect(() => {
    if (!user) return

    function sync() {
      supabase.from('prayer_schedules').upsert(
        { user_id: user.id, utc_offset: -new Date().getTimezoneOffset() },
        { onConflict: 'user_id' }
      ).then(() => {})
    }

    sync()
    const handler = () => { if (document.visibilityState === 'visible') sync() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [user?.id])
}

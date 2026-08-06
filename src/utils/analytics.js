import { supabase } from '../supabase/client'

const SESSION_KEY = 'nur-hayat-session-id'

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

// Fire-and-forget: воронку не должна тормозить или ломать основной UX.
export function trackEvent(eventName, data = {}, userId = null) {
  try {
    supabase.from('analytics_events').insert({
      session_id: getSessionId(),
      user_id:    userId || null,
      event_name: eventName,
      event_data: data,
    }).then(() => {}, () => {})
  } catch {}
}

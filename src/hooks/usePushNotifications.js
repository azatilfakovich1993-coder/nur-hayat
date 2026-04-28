import { useEffect } from 'react'
import { supabase } from '../supabase/client'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export function usePushNotifications(user) {
  useEffect(() => {
    if (!user) return

    async function init() {
      try {
        if (!('PushManager' in window)) {
          console.warn('[Push] PushManager not supported')
          return
        }
        if (!('Notification' in window)) {
          console.warn('[Push] Notification API not supported')
          return
        }

        const currentPerm = Notification.permission
        console.log('[Push] Permission status:', currentPerm)
        if (currentPerm === 'denied') return

        const permission = await Notification.requestPermission()
        console.log('[Push] Permission after request:', permission)
        if (permission !== 'granted') return

        if (!VAPID_PUBLIC_KEY) {
          console.error('[Push] VAPID_PUBLIC_KEY not set in env!')
          return
        }

        const swReg = await navigator.serviceWorker.ready
        console.log('[Push] SW ready:', swReg.scope)

        const subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        const subJson = subscription.toJSON()
        console.log('[Push] Subscribed, endpoint:', subJson.endpoint?.slice(0, 60) + '...')

        const token = JSON.stringify(subJson)

        // Сохраняем: сначала удаляем старый токен с таким же endpoint, потом вставляем
        const endpoint = subJson.endpoint
        await supabase
          .from('push_tokens')
          .delete()
          .eq('user_id', user.id)
          .like('token', `%${endpoint.slice(-30)}%`)

        const { error } = await supabase
          .from('push_tokens')
          .insert({ user_id: user.id, token })

        if (error) {
          console.error('[Push] Failed to save token:', error.message)
        } else {
          console.log('[Push] Token saved successfully!')
        }
      } catch (err) {
        console.error('[Push] Init error:', err.message)
      }
    }

    init()
  }, [user?.id])
}

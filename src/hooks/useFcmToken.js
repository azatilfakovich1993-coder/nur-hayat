import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { LocalNotifications } from '@capacitor/local-notifications'
import { supabase } from '../supabase/client'

export function useFcmToken(user, navigate) {
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return

    // Создаём канал для уведомлений чата с высоким приоритетом
    LocalNotifications.createChannel({
      id: 'chat_messages',
      name: 'Сообщения чата',
      description: 'Ответы на ваши сообщения',
      importance: 5,
      sound: 'default',
      vibration: true,
    }).catch(() => {})

    async function registerFcm() {
      try {
        const { receive } = await FirebaseMessaging.requestPermissions()
        if (receive !== 'granted') return

        const { token } = await FirebaseMessaging.getToken()
        if (!token) return

        await supabase
          .from('push_tokens')
          .upsert(
            { user_id: user.id, token, platform: 'android' },
            { onConflict: 'user_id,platform' }
          )
      } catch (err) {
        console.warn('[FCM] registerFcm error:', err.message)
      }
    }

    registerFcm()

    // Обновляем токен если Firebase его ротирует
    const tokenListener = FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
      await supabase
        .from('push_tokens')
        .upsert(
          { user_id: user.id, token, platform: 'android' },
          { onConflict: 'user_id,platform' }
        )
    })

    // Тап по уведомлению — открываем чат с подсветкой сообщения
    const tapListener = FirebaseMessaging.addListener('notificationActionPerformed', ({ notification }) => {
      const messageId = notification?.data?.message_id
      if (messageId && navigate) {
        navigate(`/chat?highlight=${messageId}`)
      }
    })

    return () => {
      tokenListener.then(l => l.remove())
      tapListener.then(l => l.remove())
    }
  }, [user?.id])
}

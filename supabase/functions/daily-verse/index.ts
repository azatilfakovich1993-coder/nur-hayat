import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webPush from 'npm:web-push'
import { getFcmAccessToken, sendFcm } from '../_shared/fcm.ts'

// Тот же набор, порядок и ТОЧНО ТЕ ЖЕ переводы (Кулиев), что и
// FALLBACK_TRANSLATIONS/APP_VERSES.daily в src/data/verses.js — один источник
// текста для клиента и сервера, никаких отдельных пересказов.
// Правило: каждый перевод ≤120 символов (короткие, мотивирующие аяты).
const DAILY_VERSES = [
  { key: '2:153',  theme: 'Терпение',              translation: 'О те, которые уверовали! Обращайтесь за помощью к терпению и намазу. Воистину, Аллах — с терпеливыми.' },
  { key: '94:5',   theme: 'Лёгкость',              translation: 'Воистину, с каждой трудностью приходит облегчение.' },
  { key: '3:139',  theme: 'Сила',                  translation: 'Не падайте духом и не печальтесь, ибо вы будете выше всех, если вы являетесь верующими.' },
  { key: '13:28',  theme: 'Покой',                 translation: 'Воистину, в поминании Аллаха успокаиваются сердца.' },
  { key: '40:60',  theme: 'Мольба',                translation: 'Ваш Господь сказал: "Взывайте ко Мне, и Я отвечу вам".' },
  { key: '65:3',   theme: 'Упование',              translation: 'Тому, кто уповает на Аллаха, достаточно Его. Аллах доводит до конца Своё дело.' },
  { key: '39:10',  theme: 'Терпение',              translation: 'Воистину, терпеливым воздаётся без счёта.' },
  { key: '29:69',  theme: 'Старание',              translation: 'Тех, которые стремятся к Нам, Мы непременно поведём Нашими путями. Воистину, Аллах — с творящими добро.' },
  { key: '10:62',  theme: 'Покровительство',       translation: 'Воистину, над союзниками Аллаха нет страха, и не будут они опечалены.' },
  { key: '12:87',  theme: 'Надежда',               translation: 'Не теряйте надежды на милость Аллаха! Воистину, только неверующие люди теряют надежду на милость Аллаха.' },
  { key: '20:14',  theme: 'Единобожие',            translation: 'Воистину, Я — Аллах! Нет божества, кроме Меня. Поклоняйся же Мне и совершай намаз, чтобы помнить обо Мне.' },
  { key: '33:41',  theme: 'Зикр',                  translation: 'О те, которые уверовали! Поминайте Аллаха многократно.' },
  { key: '3:102',  theme: 'Богобоязненность',      translation: 'О те, которые уверовали! Бойтесь Аллаха должным образом и умирайте не иначе, как будучи мусульманами.' },
  { key: '47:7',   theme: 'Помощь',                translation: 'О те, которые уверовали! Если вы поможете Аллаху, то Он поможет вам и укрепит ваши стопы.' },
  { key: '22:46',  theme: 'Сердце',                translation: 'Воистину, слепнут не глаза, а слепнут сердца, которые в груди.' },
  { key: '51:56',  theme: 'Смысл жизни',           translation: 'Я сотворил джиннов и людей только для того, чтобы они поклонялись Мне.' },
  { key: '2:152',  theme: 'Поминание',             translation: 'Поминайте Меня, и Я буду помнить о вас. Благодарите Меня и не будьте неблагодарны.' },
  { key: '49:13',  theme: 'Равенство',             translation: 'О люди! Воистину, Мы создали вас из мужчины и женщины и сделали вас народами и племенами, чтобы вы узнавали друг друга.' },
  { key: '25:74',  theme: 'Семья',                 translation: 'Господи наш! Даруй нам в наших супругах и потомках отраду глаз и сделай нас образцом для богобоязненных.' },
  { key: '17:23',  theme: 'Родители',              translation: 'Твой Господь предписал вам не поклоняться никому, кроме Него, и делать добро родителям.' },
  { key: '57:3',   theme: 'Имена Аллаха',          translation: 'Он — Первый и Последний, Явный и Скрытый, и Он ведает о всякой вещи.' },
  { key: '2:45',   theme: 'Смирение',              translation: 'Обращайтесь за помощью к терпению и намазу. Воистину, это тяжело для всех, кроме смиренных.' },
  { key: '24:35',  theme: 'Свет',                  translation: 'Аллах — свет небес и земли.' },
  { key: '67:2',   theme: 'Испытание',             translation: 'Он сотворил смерть и жизнь, чтобы испытать вас и увидеть, чьи деяния окажутся лучше. Он — Могущественный, Прощающий.' },
  { key: '33:56',  theme: 'Пророк ﷺ',              translation: 'Воистину, Аллах и Его ангелы благословляют Пророка. О те, которые уверовали! Благословляйте его и приветствуйте миром.' },
  { key: '5:8',    theme: 'Справедливость',        translation: 'Будьте справедливы, ибо это ближе к богобоязненности. Бойтесь Аллаха — Аллах ведает о том, что вы делаете.' },
  { key: '3:103',  theme: 'Единство',              translation: 'Крепко держитесь все вместе за вервь Аллаха и не распадайтесь на группы.' },
  { key: '14:34',  theme: 'Милости',               translation: 'Если вы станете считать милости Аллаха, то не сможете их перечислить. Воистину, человек несправедлив и неблагодарен.' },
  { key: '42:30',  theme: 'Испытание',             translation: 'Любое несчастье, которое вас постигает, приходит вследствие того, что приобрели ваши руки, а о многом Он прощает.' },
  { key: '49:12',  theme: 'Нрав',                  translation: 'О те, которые уверовали! Избегайте многих предположений, ибо некоторые предположения являются грехом.' },
  { key: '93:5',   theme: 'Обещание',              translation: 'Господь твой непременно даст тебе столько, что ты останешься доволен.' },
  { key: '99:7',   theme: 'Воздаяние',             translation: 'Тот, кто сделал добро весом с пылинку, увидит его.' },
  { key: '55:13',  theme: 'Благодарность',         translation: 'Какую же из милостей вашего Господа вы оба отвергаете?' },
  { key: '6:162',  theme: 'Посвящение',            translation: 'Скажи: "Воистину, моя молитва и моё жертвоприношение, моя жизнь и моя смерть — ради Аллаха, Господа миров".' },
  { key: '7:55',   theme: 'Мольба',                translation: 'Взывайте к вашему Господу со смирением и в тайне. Воистину, Он не любит нарушителей.' },
  { key: '76:9',   theme: 'Искренность',           translation: 'Мы кормим вас лишь ради Лика Аллаха и не желаем от вас ни награды, ни благодарности.' },
  { key: '73:8',   theme: 'Посвящение',            translation: 'Поминай имя твоего Господа и посвяти себя Ему всецело.' },
  { key: '112:1',  theme: 'Единобожие',            translation: 'Скажи: "Он — Аллах Единый".' },
]

const NOTIF_HOUR = 8 // должно совпадать с NOTIF_HOUR в useDailyVerseNotif.js (локальное время)

serve(async (req) => {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  webPush.setVapidDetails(
    'mailto:admin@nurhayat.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Выбираем аят дня — такой же алгоритм как в приложении
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_VERSES.length
  const verse = DAILY_VERSES[dayIndex]

  const payload = { title: `🌙 Аят дня — ${verse.theme}`, body: verse.translation, url: '/', tag: 'daily-verse' }
  const jsonPayload = JSON.stringify(payload)

  const now = new Date()
  const nowUtcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  const todayStr = now.toISOString().slice(0, 10)

  // Раньше рассылка уходила ВСЕМ сразу, как только этот эндпоинт дёргал cron
  // (настроенный на момент, соответствующий 8:00 МСК) — независимо от часового
  // пояса получателя. Плюс локальное Capacitor-уведомление на устройстве уже
  // шлёт "Аят дня" в 8:00 по своему времени — в сумме два пуша в разное время.
  // Теперь сервер тоже целится в 8:00 по utc_offset пользователя и не шлёт,
  // пока для него не наступит нужный момент.
  const { data: schedules } = await supabase
    .from('prayer_schedules')
    .select('user_id, utc_offset, daily_verse_enabled')

  const scheduleByUser = new Map<string, { utc_offset: number | null; daily_verse_enabled: boolean | null }>()
  for (const s of schedules ?? []) scheduleByUser.set(s.user_id, s)

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('user_id, token, platform')

  if (!tokens?.length) {
    return new Response(JSON.stringify({ sent: 0, verse: verse.key }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const tokensByUser = new Map<string, { token: string; platform: string | null }[]>()
  for (const { user_id, token, platform } of tokens) {
    if (!tokensByUser.has(user_id)) tokensByUser.set(user_id, [])
    tokensByUser.get(user_id)!.push({ token, platform })
  }

  let sent = 0
  const staleTokens: string[] = []
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
  const fcmProjectId = serviceAccount.project_id
  let fcmAccessToken: string | null = null

  for (const [userId, userTokens] of tokensByUser) {
    const schedule = scheduleByUser.get(userId)
    // Ещё не знаем часовой пояс пользователя (utc_offset ни разу не
    // синхронизировался) — лучше пропустить, чем угадать неправильное время.
    if (!schedule || schedule.utc_offset == null) continue
    if (schedule.daily_verse_enabled === false) continue

    const targetUtcMin = ((NOTIF_HOUR * 60 - schedule.utc_offset) % 1440 + 1440) % 1440
    if (!(nowUtcMin >= targetUtcMin && nowUtcMin < targetUtcMin + 10)) continue

    const { data: claimed } = await supabase
      .from('notif_log')
      .upsert({ user_id: userId, tag: 'daily-verse', sent_on: todayStr }, { onConflict: 'user_id,tag,sent_on', ignoreDuplicates: true })
      .select()
    if (!claimed?.length) continue

    for (const { token, platform } of userTokens) {
      if (platform === 'android') {
        try {
          fcmAccessToken ??= await getFcmAccessToken(serviceAccount)
          const { ok, stale } = await sendFcm(fcmAccessToken, fcmProjectId, token, { ...payload, channelId: 'daily_verse' })
          if (ok) sent++
          else if (stale) staleTokens.push(token)
        } catch { /* временная ошибка FCM — пробуем в следующий прогон */ }
        continue
      }
      try {
        await webPush.sendNotification(JSON.parse(token), jsonPayload)
        sent++
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          staleTokens.push(token)
        }
      }
    }
  }

  if (staleTokens.length) {
    await supabase.from('push_tokens').delete().in('token', staleTokens)
  }

  return new Response(JSON.stringify({ sent, verse: verse.key, theme: verse.theme }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webPush from 'npm:web-push'
import { getFcmAccessToken, sendFcm } from '../_shared/fcm.ts'

const DAILY_VERSES = [
  { key: '2:153',  theme: 'Терпение',          translation: 'О те, которые уверовали! Обращайтесь за помощью к терпению и намазу. Воистину, Аллах — с терпеливыми.' },
  { key: '2:286',  theme: 'Надежда',            translation: 'Аллах не возлагает на человека сверх его возможностей.' },
  { key: '39:53',  theme: 'Прощение',           translation: 'О рабы Мои, которые преступили против себя! Не отчаивайтесь в милости Аллаха.' },
  { key: '94:5',   theme: 'Лёгкость',           translation: 'Воистину, с каждой трудностью приходит облегчение.' },
  { key: '3:31',   theme: 'Любовь',             translation: 'Если вы любите Аллаха, то следуйте за мной, и тогда Аллах возлюбит вас и простит ваши грехи.' },
  { key: '14:7',   theme: 'Благодарность',      translation: 'Если вы будете благодарны, Я непременно добавлю вам.' },
  { key: '3:139',  theme: 'Сила',               translation: 'Не падайте духом и не печальтесь, ибо вы будете выше всех, если вы являетесь верующими.' },
  { key: '13:28',  theme: 'Покой',              translation: 'Воистину, в поминании Аллаха успокаиваются сердца.' },
  { key: '40:60',  theme: 'Мольба',             translation: 'Ваш Господь сказал: "Взывайте ко Мне, и Я отвечу вам".' },
  { key: '65:3',   theme: 'Упование',           translation: 'Тому, кто уповает на Аллаха, достаточно Его. Аллах доводит до конца Своё дело.' },
  { key: '2:255',  theme: 'Величие',            translation: 'Аллах — нет божества, кроме Него, Живого, Вседержителя. Им не овладевают ни дремота, ни сон.' },
  { key: '39:10',  theme: 'Терпение',           translation: 'Воистину, терпеливым воздаётся без счёта.' },
  { key: '29:69',  theme: 'Старание',           translation: 'Тех, которые стремятся к Нам, Мы непременно поведём Нашими путями.' },
  { key: '10:62',  theme: 'Покровительство',    translation: 'Воистину, над союзниками Аллаха нет страха, и не будут они опечалены.' },
  { key: '12:87',  theme: 'Надежда',            translation: 'Не теряйте надежды на милость Аллаха! Воистину, только неверующие люди теряют надежду на милость Аллаха.' },
  { key: '20:14',  theme: 'Единобожие',         translation: 'Воистину, Я — Аллах! Нет божества, кроме Меня. Поклоняйся же Мне и совершай намаз, чтобы помнить обо Мне.' },
  { key: '33:41',  theme: 'Зикр',               translation: 'О те, которые уверовали! Поминайте Аллаха многократно.' },
  { key: '16:97',  theme: 'Награда',            translation: 'Тому, кто поступает праведно и является верующим, Мы непременно даруем прекрасную жизнь.' },
  { key: '3:102',  theme: 'Богобоязненность',   translation: 'О те, которые уверовали! Бойтесь Аллаха должным образом и умирайте не иначе, как будучи мусульманами.' },
  { key: '58:7',   theme: 'Близость',           translation: 'Разве ты не знаешь, что Аллаху ведомо то, что на небесах и на земле? Он всегда с ними, где бы они ни были.' },
  { key: '30:21',  theme: 'Семья',              translation: 'Среди Его знамений — то, что Он создал из вас самих супруг для вас, чтобы вы находили в них покой.' },
  { key: '9:51',   theme: 'Предопределение',    translation: 'С нами не случится ничего, кроме того, что предписал нам Аллах. Он — наш Покровитель.' },
  { key: '47:7',   theme: 'Помощь',             translation: 'О те, которые уверовали! Если вы поможете Аллаху, то Он поможет вам и укрепит ваши стопы.' },
  { key: '22:46',  theme: 'Сердце',             translation: 'Воистину, слепнут не глаза, а слепнут сердца, которые в груди.' },
  { key: '51:56',  theme: 'Смысл жизни',        translation: 'Я сотворил джиннов и людей только для того, чтобы они поклонялись Мне.' },
  { key: '2:152',  theme: 'Поминание',          translation: 'Поминайте Меня, и Я буду помнить о вас. Благодарите Меня и не будьте неблагодарны.' },
  { key: '49:13',  theme: 'Равенство',          translation: 'Воистину, Мы создали вас из мужчины и женщины и сделали вас народами и племенами, чтобы вы узнавали друг друга.' },
  { key: '25:74',  theme: 'Семья',              translation: 'Господи наш! Даруй нам в наших супругах и потомках отраду глаз и сделай нас образцом для богобоязненных.' },
  { key: '17:23',  theme: 'Родители',           translation: 'Твой Господь предписал вам не поклоняться никому, кроме Него, и делать добро родителям.' },
  { key: '3:185',  theme: 'Вечность',           translation: 'Каждая душа вкусит смерть. Тот, кто будет удалён от Огня и введён в Рай, обретёт успех.' },
  { key: '57:3',   theme: 'Имена Аллаха',       translation: 'Он — Первый и Последний, Явный и Скрытый, и Он ведает о всякой вещи.' },
  { key: '2:45',   theme: 'Смирение',           translation: 'Обращайтесь за помощью к терпению и намазу. Воистину, это тяжело для всех, кроме смиренных.' },
  { key: '42:30',  theme: 'Испытание',          translation: 'Любое несчастье, которое вас постигает, приходит вследствие того, что приобрели ваши руки, а о многом Он прощает.' },
  { key: '24:35',  theme: 'Свет',               translation: 'Аллах — свет небес и земли.' },
  { key: '67:2',   theme: 'Испытание',          translation: 'Он сотворил смерть и жизнь, чтобы испытать вас и увидеть, чьи деяния окажутся лучше.' },
  { key: '33:56',  theme: 'Пророк ﷺ',          translation: 'Воистину, Аллах и Его ангелы благословляют Пророка. О те, которые уверовали! Благословляйте его.' },
  { key: '5:8',    theme: 'Справедливость',     translation: 'Будьте справедливы, ибо это ближе к богобоязненности. Бойтесь Аллаха — Аллах ведает о том, что вы делаете.' },
  { key: '3:103',  theme: 'Единство',           translation: 'Крепко держитесь все вместе за вервь Аллаха и не распадайтесь на группы.' },
  { key: '14:34',  theme: 'Милости',            translation: 'Если вы станете считать милости Аллаха, то не сможете их перечислить.' },
  { key: '49:12',  theme: 'Нрав',               translation: 'О те, которые уверовали! Избегайте многих предположений, ибо некоторые предположения являются грехом.' },
  { key: '93:5',   theme: 'Обещание',           translation: 'Господь твой непременно даст тебе столько, что ты останешься доволен.' },
  { key: '99:7',   theme: 'Воздаяние',          translation: 'Тот, кто сделал добро весом с пылинку, увидит его.' },
  { key: '55:13',  theme: 'Благодарность',      translation: 'Какую же из милостей вашего Господа вы оба отвергаете?' },
  { key: '4:36',   theme: 'Поклонение',         translation: 'Поклоняйтесь Аллаху и не приобщайте к Нему никаких сотоварищей. Делайте добро родителям, родственникам, сиротам, беднякам, соседям.' },
  { key: '6:162',  theme: 'Посвящение',         translation: 'Воистину, моя молитва и моё жертвоприношение, моя жизнь и моя смерть — ради Аллаха, Господа миров.' },
  { key: '7:55',   theme: 'Мольба',             translation: 'Взывайте к вашему Господу со смирением и в тайне. Воистину, Он не любит нарушителей.' },
  { key: '76:9',   theme: 'Искренность',        translation: 'Мы кормим вас лишь ради Лика Аллаха и не желаем от вас ни награды, ни благодарности.' },
  { key: '73:8',   theme: 'Посвящение',         translation: 'Поминай имя твоего Господа и посвяти себя Ему всецело.' },
  { key: '17:80',  theme: 'Истина',             translation: 'Господи! Введи меня достойным образом и выведи меня достойным образом и дай мне от Тебя власть.' },
  { key: '112:1',  theme: 'Единобожие',         translation: 'Скажи: "Он — Аллах Единый".' },
]

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

  // Раньше брали только веб-пуш токены (platform IS NULL) — Android-приложение
  // регистрирует "сырой" FCM-токен, а не Web Push подписку, и на нём
  // webPush.sendNotification() падает на JSON.parse, поэтому Android-пользователи
  // никогда не получали этот пуш. Теперь шлём по обоим каналам.
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('user_id, token, platform')

  if (!tokens?.length) {
    return new Response(JSON.stringify({ sent: 0, verse: verse.key }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  const staleTokens: string[] = []
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
  const fcmProjectId = serviceAccount.project_id
  let fcmAccessToken: string | null = null

  for (const { token, platform } of tokens) {
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

  if (staleTokens.length) {
    await supabase.from('push_tokens').delete().in('token', staleTokens)
  }

  return new Response(JSON.stringify({ sent, verse: verse.key, theme: verse.theme }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { addNur } from '../utils/nur'
import { supabase } from '../supabase/client'
import PrayerCalendar from '../components/PrayerCalendar'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

// ── Данные намазов ────────────────────────────────────────────
const PRAYERS = [
  { id: 'Fajr',    ru: 'Фаджр',  ar: 'الفجر',  desc: 'Утренний',          icon: '🌙', color: '#7B6BAE' },
  { id: 'Dhuhr',   ru: 'Зухр',   ar: 'الظهر',  desc: 'Полуденный',        icon: '☀️', color: '#C9A84C' },
  { id: 'Asr',     ru: 'Аср',    ar: 'العصر',  desc: 'Послеполуденный',   icon: '🌤',  color: '#E8A030' },
  { id: 'Maghrib', ru: 'Магриб', ar: 'المغرب', desc: 'Вечерний',          icon: '🌅', color: '#E05050' },
  { id: 'Isha',    ru: 'Иша',    ar: 'العشاء', desc: 'Ночной',            icon: '🌙', color: '#5B7BAE' },
]

const HIJRI_MONTHS = [
  'Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани',
  'Джумада аль-Уля','Джумада ас-Сания','Раджаб','Шаабан',
  'Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'
]

// ── Утилиты ───────────────────────────────────────────────────
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function diffSec(from, to) {
  return Math.max(0, Math.floor((to - from) / 1000))
}

function secToHMS(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(sec).padStart(2, '0'),
  }
}

function fmt(timeStr) {
  if (!timeStr) return '--:--'
  return timeStr.slice(0, 5)
}

// ── Уведомления ───────────────────────────────────────────────
async function requestNotifPerm() {
  try {
    if (Capacitor.isNativePlatform()) {
      // Создаём канал уведомлений (обязательно для Android 8+)
      await LocalNotifications.createChannel({
        id: 'prayer_reminders',
        name: 'Напоминания о намазе',
        description: 'Уведомления перед временем намаза',
        importance: 5, // IMPORTANCE_HIGH
        sound: 'default',
        vibration: true,
        lights: true,
      }).catch(() => {})

      const { display } = await LocalNotifications.requestPermissions()
      if (display !== 'granted') return false

      // Android 12+ требует отдельного разрешения на точные будильники
      try {
        const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting()
        if (exact_alarm !== 'granted') {
          await LocalNotifications.openExactNotificationSetting()
        }
      } catch { /* не все версии поддерживают */ }

      return true
    }
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const res = await Notification.requestPermission()
    return res === 'granted'
  } catch { return false }
}

function sendNotif(title, body) {
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [{ title, body, id: 900 + Math.floor(Math.random() * 99),
        schedule: { at: new Date(Date.now() + 300) }, smallIcon: 'ic_launcher' }]
    }).catch(() => {})
    return
  }
  if (Notification.permission !== 'granted') return
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg =>
      reg.showNotification(title, { body, icon: '/icons/icon-192.png', vibrate: [200, 100, 200] })
    ).catch(() => new Notification(title, { body }))
  } else {
    new Notification(title, { body })
  }
}

const timerIds = []
function clearAllTimers() { timerIds.forEach(clearTimeout); timerIds.length = 0 }

// prayerIndex * 100 + reminderMins = notification ID
// Например: Fajr(0)*100+10 = 10, Asr(2)*100+20 = 220
async function scheduleNotifs(prayerTimes, notifBefore) {
  clearAllTimers()
  const now = new Date()
  const reminders = notifBefore.filter(Boolean)

  if (Capacitor.isNativePlatform()) {
    // Отменяем старые уведомления намазов (ID 0–499)
    try {
      const { notifications: pending } = await LocalNotifications.getPending()
      const toCancel = pending.filter(n => n.id < 500).map(n => ({ id: n.id }))
      if (toCancel.length > 0) await LocalNotifications.cancel({ notifications: toCancel })
    } catch {}

    const notifications = []
    prayerTimes.forEach((p, pIdx) => {
      const pt = parseTime(p.time)
      const base = pIdx * 100

      // В момент намаза
      if (pt > now) {
        notifications.push({
          title: `🕌 Время ${p.ru}!`,
          body: `Настало время ${p.desc.toLowerCase()} намаза`,
          id: base,
          channelId: 'prayer_reminders',
          schedule: { at: pt, allowWhileIdle: true },
          smallIcon: 'ic_launcher',
          iconColor: '#C9A84C',
        })
      }
      // За X минут
      reminders.forEach(mins => {
        const notifTime = new Date(pt.getTime() - mins * 60000)
        if (notifTime > now) {
          notifications.push({
            title: `🔔 До ${p.ru} — ${mins} мин`,
            body: `Намаз в ${fmt(p.time)}`,
            id: base + mins,
            channelId: 'prayer_reminders',
            schedule: { at: notifTime, allowWhileIdle: true },
            smallIcon: 'ic_launcher',
            iconColor: '#C9A84C',
          })
        }
      })
    })
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications }).catch(() => {})
    }
    return
  }

  // Web fallback — работает только пока приложение открыто
  if (Notification.permission !== 'granted') return
  prayerTimes.forEach(p => {
    const pt = parseTime(p.time)
    const delay0 = pt - now
    if (delay0 > 0) timerIds.push(setTimeout(() =>
      sendNotif(`🕌 Время ${p.ru}!`, `Настало время ${p.desc.toLowerCase()} намаза`), delay0))
    reminders.forEach(mins => {
      const delay = pt - mins * 60000 - now
      if (delay > 0) timerIds.push(setTimeout(() =>
        sendNotif(`🔔 До ${p.ru} — ${mins} мин`, `Намаз в ${fmt(p.time)}`), delay))
    })
  })
}

// ── Компонент: одна цифра с анимацией ────────────────────────
function Digit({ val }) {
  const [anim, setAnim] = useState(false)
  const prev = useRef(val)
  useEffect(() => {
    if (prev.current !== val) { setAnim(true); setTimeout(() => setAnim(false), 300) }
    prev.current = val
  }, [val])
  return (
    <span style={{ ...cd.digit, animation: anim ? 'digitFlip .3s ease' : 'none' }}>
      {val}
    </span>
  )
}

// ── Компонент: обратный отсчёт ────────────────────────────────
function Countdown({ seconds, nextPrayer, totalSeconds }) {
  const { h, m, s } = secToHMS(seconds)
  const progress = totalSeconds > 0 ? 1 - seconds / totalSeconds : 0
  const r = 54, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - progress)

  return (
    <div style={cd.wrap}>
      {/* SVG дуга прогресса */}
      <svg width={128} height={128} style={{ position:'absolute', top:0, left:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(201,168,76,.1)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#goldGrad)" strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dash}
          style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset .8s ease' }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#F0D080" />
          </linearGradient>
        </defs>
      </svg>

      {/* Цифры */}
      <div style={cd.inner}>
        <div style={cd.label}>До {nextPrayer?.ru || '—'}</div>
        <div style={cd.timer}>
          <Digit val={h[0]} /><Digit val={h[1]} />
          <span style={cd.colon}>:</span>
          <Digit val={m[0]} /><Digit val={m[1]} />
          <span style={cd.colon}>:</span>
          <Digit val={s[0]} /><Digit val={s[1]} />
        </div>
        <div style={cd.sublabel}>{nextPrayer?.time ? `в ${fmt(nextPrayer.time)}` : ''}</div>
      </div>
    </div>
  )
}

const cd = {
  wrap: { position:'relative', width:128, height:128, display:'flex', alignItems:'center', justifyContent:'center' },
  inner: { display:'flex', flexDirection:'column', alignItems:'center', gap:2, zIndex:1 },
  label: { fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' },
  timer: { display:'flex', alignItems:'center', gap:1, fontVariantNumeric:'tabular-nums' },
  digit: { fontSize:19, fontWeight:700, color:'var(--gold)', display:'inline-block',
    minWidth:14, textAlign:'center', fontFamily:'var(--font-ui)' },
  colon: { fontSize:17, fontWeight:700, color:'rgba(201,168,76,.5)', lineHeight:1, marginBottom:2 },
  sublabel: { fontSize:11, color:'var(--gold-dim)', fontWeight:500 },
}

// ── Трекер: фразы и анимации ──────────────────────────────────
const REWARDS = [
  { ar: 'الصَّلَاةُ نُورٌ',                                                ru: 'Намаз — это свет',                                          src: 'Хадис (Муслим)'    },
  { ar: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',    ru: 'Намаз удерживает от мерзости и порицаемого',                src: 'Коран 29:45'        },
  { ar: 'أَقِمِ الصَّلَاةَ لِذِكْرِي',                                   ru: 'Совершай намаз, чтобы помнить Меня',                        src: 'Коран 20:14'        },
  { ar: 'مَنْ حَافَظَ عَلَيْهَا كَانَتْ لَهُ نُورًا',                   ru: 'Кто хранит намаз — для того он будет светом',               src: 'Ахмад'              },
  { ar: 'الصَّلَوَاتُ الخَمْسُ كَفَّارَةٌ لِمَا بَيْنَهُنَّ',          ru: 'Пять намазов стирают грехи между ними',                     src: 'Тирмизи'            },
  { ar: 'إِذَا قَامَ أَحَدُكُمْ إِلَى الصَّلَاةِ فَإِنَّهُ يُنَاجِي رَبَّهُ', ru: 'Когда встаёшь на намаз — беседуешь со своим Господом', src: 'Бухари'             },
  { ar: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',                      ru: 'Обращайтесь за помощью через терпение и намаз',             src: 'Коран 2:45'         },
  { ru: 'МашаАллах! Ты сделал шаг к Аллаху — и Он сделал десять к тебе' },
  { ru: 'Барак Аллаху фик! Ты среди тех, кто хранит намаз 🤍'           },
  { ru: 'Каждый совершённый намаз — разговор с Самим Аллахом. Какое счастье' },
  { ru: 'Субханаллах! Каждый намаз поднимает тебя на ступень выше 🌟'   },
  { ru: 'Ангелы просят прощения для тебя, пока ты совершаешь намаз'     },
  { ru: 'АльхамдулиЛлях! Один выполненный намаз лучше всего, что есть в дунье' },
  { ru: 'Продолжай! Сегодня ты чуть ближе к Аллаху, чем вчера 🌙'       },
  { ru: 'Намаз — это якорь, который удерживает сердце в покое'           },
]

// 5 разных эффектов частиц
const PARTICLE_SETS = [
  { items: ['⭐','✨','🌟','💫','⭐','✨','🌟','💫'], motion: 'burst'  }, // взрыв звёзд
  { items: ['🌙','✨','🌟','💫','🌙','✨','🌙','💫'], motion: 'rise'   }, // всплывают вверх
  { items: ['💛','✨','💛','✨','💛','✨','💛','✨'], motion: 'rain'   }, // дождь сверху
  { items: ['💎','✨','💎','✨','💎','✨','💎','✨'], motion: 'spiral' }, // спираль
  { items: ['🤍','✨','🤍','✨','🤍','✨','🤍','✨'], motion: 'float'  }, // разлетаются по сторонам
]

function Particles({ set }) {
  const { items, motion } = set
  return (
    <>
      {items.map((em, i) => {
        const angle  = (i / items.length) * Math.PI * 2
        const dist   = 70 + (i % 3) * 25
        const delay  = `${i * 0.06}s`
        const tx     = Math.round(Math.cos(angle) * dist)
        const ty     = Math.round(Math.sin(angle) * dist)
        const x0     = -80 + i * 22

        const styleMap = {
          burst:  { animation:`pBurst .9s ease ${delay} forwards`, '--tx':`${tx}px`, '--ty':`${ty}px` },
          rise:   { animation:`pRise 1s ease ${delay} forwards`, transform:`translateX(${tx}px)` },
          rain:   { animation:`pRain 1s ease ${delay} forwards`, position:'absolute', top:-20, left:'50%', marginLeft:x0 },
          spiral: { animation:`pSpiral 1.1s ease ${delay} forwards`, '--tx':`${tx}px`, '--ty':`${ty}px` },
          float:  { animation:`pFloat 1s ease ${delay} forwards`, '--tx':`${tx}px`, '--ty':`${ty}px` },
        }
        return (
          <div key={i} style={{ position:'absolute', fontSize:18, opacity:0, pointerEvents:'none', zIndex:10, ...styleMap[motion] }}>
            {em}
          </div>
        )
      })}
    </>
  )
}

function RewardOverlay({ prayerName, rewardIdx, onClose }) {
  const [closing, setClosing] = useState(false)
  const r    = REWARDS[rewardIdx % REWARDS.length]
  const pset = PARTICLE_SETS[rewardIdx % PARTICLE_SETS.length]

  useEffect(() => {
    const t1 = setTimeout(() => setClosing(true), 3000)
    const t2 = setTimeout(onClose, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ ...rw.backdrop, animation: closing ? 'rwOut .5s ease forwards' : 'rwIn .3s ease' }}
      onClick={() => { setClosing(true); setTimeout(onClose, 400) }}>
      <Particles set={pset} />
      <div style={{ ...rw.card, animation: closing ? 'cardOutY .4s ease forwards' : 'cardInY .45s ease' }}>
        <div style={rw.accepted}>{prayerName} принят, ин шаа Аллах 🤲</div>
        {r.ar && (
          <div className="arabic gold-shimmer" style={rw.ar}>{r.ar}</div>
        )}
        <div style={rw.ru}>{r.ru}</div>
        {r.src && <div style={rw.src}>{r.src}</div>}
        <div style={rw.tap}>нажмите чтобы закрыть</div>
      </div>
    </div>
  )
}

const rw = {
  backdrop: { position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center',
    background:'rgba(7,7,16,.85)', backdropFilter:'blur(6px)' },
  card: { position:'relative', zIndex:11, background:'linear-gradient(145deg,rgba(201,168,76,.15),rgba(201,168,76,.05))',
    border:'1px solid rgba(201,168,76,.4)', borderRadius:24, padding:'28px 24px',
    maxWidth:320, width:'90%', display:'flex', flexDirection:'column', alignItems:'center', gap:12,
    boxShadow:'0 0 60px rgba(201,168,76,.2)' },
  accepted: { fontSize:13, color:'var(--gold)', fontWeight:600, letterSpacing:'.04em', textAlign:'center' },
  ar: { fontSize:22, color:'var(--gold-light)', textAlign:'center', lineHeight:1.9, direction:'rtl', fontFamily:"'Scheherazade New',serif" },
  ru: { fontSize:15, color:'var(--text)', textAlign:'center', lineHeight:1.7, fontWeight:500 },
  src: { fontSize:12, color:'var(--text-muted)', fontStyle:'italic' },
  tap: { fontSize:11, color:'var(--text-dim)', marginTop:4 },
}

// ── Трекер: недельная полоса ───────────────────────────────────
const DAY_LABELS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function WeekStrip({ weekData, streak, todayCount }) {
  return (
    <div style={ws.wrap}>
      {/* Стрик */}
      <div style={ws.streak}>
        <span style={{ fontSize:22, filter: streak > 0 ? 'none' : 'grayscale(1) opacity(.4)' }}>🔥</span>
        <div>
          <div style={ws.streakNum}>{streak}</div>
          <div style={ws.streakLabel}>дней подряд</div>
        </div>
      </div>
      <div style={ws.div} />
      {/* 7 дней */}
      <div style={ws.days}>
        {weekData.map((d, i) => {
          const fill    = d.count / 5
          const isToday = d.date === new Date().toISOString().split('T')[0]
          const dayLabel = DAY_LABELS[(new Date(d.date).getDay() + 6) % 7]
          const allDone  = fill >= 1
          const partial  = fill > 0 && fill < 1

          const bg = allDone
            ? 'var(--gold)'
            : isToday
              ? 'rgba(201,168,76,.18)'
              : partial
                ? `rgba(201,168,76,${.08 + fill * .25})`
                : 'rgba(255,255,255,.05)'

          const border = isToday
            ? '2px solid var(--gold)'
            : allDone
              ? '2px solid var(--gold)'
              : '2px solid transparent'

          const labelColor = allDone
            ? '#070710'
            : isToday
              ? 'var(--gold)'
              : 'var(--text-dim)'

          return (
            <div key={d.date} style={{ ...ws.dot, background: bg, border,
              boxShadow: isToday ? '0 0 10px rgba(201,168,76,.4)' : allDone ? '0 0 6px rgba(201,168,76,.3)' : 'none',
              transform: isToday ? 'scale(1.15)' : 'scale(1)',
            }}>
              <span style={{ fontSize:10, fontWeight: isToday || allDone ? 700 : 500, color: labelColor, lineHeight:1 }}>
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ws = {
  wrap:       { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 16px', marginBottom:16,
                display:'flex', alignItems:'center', gap:12, animation:'cardIn .5s ease 100ms both' },
  streak:     { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  streakNum:  { fontSize:20, fontWeight:800, color:'var(--gold)', lineHeight:1 },
  streakLabel:{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' },
  div:        { width:1, height:36, background:'var(--border)', flexShrink:0 },
  days:       { flex:1, display:'flex', justifyContent:'space-around', alignItems:'center' },
  dot:        { width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .3s', flexShrink:0 },
}

// ── Компонент: карточка намаза ────────────────────────────────
function PrayerCard({ prayer, time, state, delay, checked, onCheck }) {
  const [pop, setPop] = useState(false)

  const colors = {
    done:     { bg:'rgba(255,255,255,.03)', border:'var(--border)',          text:'var(--text-dim)', timec:'var(--text-dim)' },
    active:   { bg:'rgba(201,168,76,.12)', border:'rgba(201,168,76,.5)',    text:'var(--gold)',     timec:'var(--gold)'     },
    next:     { bg:'rgba(201,168,76,.06)', border:'rgba(201,168,76,.25)',   text:'var(--text)',     timec:'var(--gold)'     },
    upcoming: { bg:'rgba(255,255,255,.03)', border:'var(--border)',          text:'var(--text)',     timec:'var(--text)'     },
  }
  const c = colors[state] || colors.upcoming

  function handleCheck(e) {
    e.stopPropagation()
    if (!checked) { setPop(true); setTimeout(() => setPop(false), 600) }
    if (navigator.vibrate) navigator.vibrate(checked ? 30 : [30, 40, 60])
    onCheck()
  }

  return (
    <div style={{
      ...pc.card,
      background: checked ? 'rgba(82,183,136,.08)' : c.bg,
      border: `1px solid ${checked ? 'rgba(82,183,136,.4)' : c.border}`,
      animation: `cardIn .4s ease ${delay}ms both`,
      boxShadow: state === 'active' && !checked ? '0 0 20px rgba(201,168,76,.15)' : 'none'
    }}>
      {/* Иконка */}
      <div style={{ ...pc.iconWrap, background: 'transparent' }}>
        <span style={{ fontSize:22, filter: state === 'done' && !checked ? 'grayscale(1) opacity(.4)' : 'none' }}>
          {prayer.icon}
        </span>
      </div>

      {/* Название */}
      <div style={pc.info}>
        <div style={{ ...pc.nameRu, color: checked ? '#52b788' : c.text }}>{prayer.ru}</div>
        <div style={pc.nameAr} className="arabic gold-shimmer">{prayer.ar}</div>
        <div style={pc.desc}>{prayer.desc}</div>
      </div>

      {/* Время + статус */}
      <div style={pc.right}>
        <div style={{ ...pc.time, color: checked ? '#52b788' : c.timec }}>{fmt(time)}</div>
        <div style={pc.status}>
          {!checked && state === 'done'   && <span style={{ ...pc.badge, background:'rgba(255,255,255,.06)', color:'var(--text-dim)' }}>прошёл</span>}
          {!checked && state === 'active' && <span style={{ ...pc.badge, background:'rgba(201,168,76,.2)', color:'var(--gold)', animation:'activePulse 1.5s ease-in-out infinite' }}>● сейчас</span>}
          {!checked && state === 'next'   && <span style={{ ...pc.badge, background:'rgba(201,168,76,.1)', color:'var(--gold)' }}>следующий</span>}
          {checked && <span style={{ ...pc.badge, background:'rgba(82,183,136,.2)', color:'#52b788' }}>✓ совершён</span>}
        </div>
      </div>

      {/* Кнопка отметки */}
      <button style={{ ...pc.checkBtn, ...(checked ? pc.checkBtnDone : {}) }} onClick={handleCheck}>
        {checked
          ? <span style={{ fontSize:16, animation: pop ? 'popIn .4s ease' : 'none' }}>✓</span>
          : <span style={{ fontSize:12, color:'var(--text-dim)' }}>○</span>
        }
      </button>
    </div>
  )
}

const pc = {
  card: { display:'flex', alignItems:'center', gap:12, borderRadius:16, padding:'14px 16px', transition:'box-shadow .3s' },
  iconWrap: { width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  info: { flex:1, display:'flex', flexDirection:'column', gap:1 },
  nameRu: { fontSize:16, fontWeight:600, transition:'color .3s' },
  nameAr: { fontFamily:"'Scheherazade New',serif", fontSize:16, color:'rgba(201,168,76,.5)', direction:'rtl' },
  desc: { fontSize:11, color:'var(--text-dim)' },
  right: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0, marginRight:6 },
  checkBtn: { width:36, height:36, borderRadius:'50%', border:'1.5px solid var(--border)', background:'var(--bg-card)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
    transition:'all .2s', outline:'none' },
  checkBtnDone: { background:'rgba(82,183,136,.2)', border:'1.5px solid rgba(82,183,136,.6)', color:'#52b788' },
  time: { fontSize:22, fontWeight:700, fontFamily:'var(--font-ui)', fontVariantNumeric:'tabular-nums', transition:'color .3s' },
  status: { height:20 },
  badge: { fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, letterSpacing:'.04em' },
}

// ── Поиск города через Nominatim ─────────────────────────────
async function searchCities(query) {
  if (!query || query.length < 2) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=ru&featuretype=city`
    )
    const data = await res.json()
    return data.map(r => ({
      name:    r.display_name.split(',').slice(0, 2).join(',').trim(),
      lat:     parseFloat(r.lat),
      lon:     parseFloat(r.lon),
    }))
  } catch { return [] }
}

// ── Методы расчёта ────────────────────────────────────────────
const CALC_METHODS = [
  { id: 3,  name: 'Мировая лига (MWL)',  short: 'MWL'  },
  { id: 15, name: 'Россия / СНГ (САМР)', short: 'САМР' },
  { id: 14, name: 'Турция (Diyanet)',     short: 'TR'   },
  { id: 4,  name: 'Умм аль-Кура (КСА)', short: 'UmQ'  },
  { id: 5,  name: 'Египетский',          short: 'EG'   },
  { id: 2,  name: 'ISNA (С. Америка)',   short: 'ISNA' },
  { id: 1,  name: 'Университет Карачи',  short: 'KHI'  },
]

// ── Кибла ─────────────────────────────────────────────────────
const MECCA = { lat: 21.4225, lon: 39.8262 }

function calcQibla(lat, lon) {
  const φ1 = lat * Math.PI / 180
  const φ2 = MECCA.lat * Math.PI / 180
  const dλ = (MECCA.lon - lon) * Math.PI / 180
  const y = Math.sin(dλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function Qibla({ initLat, initLon }) {
  const [heading,  setHeading]  = useState(null)
  const [qibla,    setQibla]    = useState(null)
  const [lat,      setLat]      = useState(initLat || null)
  const [lon,      setLon]      = useState(initLon || null)
  const [locErr,   setLocErr]   = useState(false)
  const [permErr,  setPermErr]  = useState(false)
  const [noGyro,   setNoGyro]   = useState(false)
  const gyroTimer = useRef(null)

  // Получаем координаты если не переданы
  useEffect(() => {
    if (lat && lon) { setQibla(calcQibla(lat, lon)); return }
    if (!navigator.geolocation) { setLocErr(true); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude); setLon(pos.coords.longitude)
        setQibla(calcQibla(pos.coords.latitude, pos.coords.longitude))
      },
      () => setLocErr(true)
    )
  }, [])

  // Запускаем гироскоп
  useEffect(() => {
    if (qibla === null) return

    async function startGyro() {
      // iOS 13+ требует разрешения
      if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        try {
          const res = await DeviceOrientationEvent.requestPermission()
          if (res !== 'granted') { setPermErr(true); setNoGyro(true); return }
        } catch { setPermErr(true); setNoGyro(true); return }
      }

      gyroTimer.current = setTimeout(() => setNoGyro(true), 2000)

      let gotAbsolute = false

      function toCompassHeading(e) {
        // iOS: webkitCompassHeading уже в градусах по часовой от севера
        if (e.webkitCompassHeading != null) return e.webkitCompassHeading
        // Android deviceorientationabsolute: alpha идёт против часовой от севера
        if (e.alpha != null) return (360 - e.alpha) % 360
        return null
      }

      function onAbsolute(e) {
        const h = toCompassHeading(e)
        if (h === null) return
        gotAbsolute = true
        clearTimeout(gyroTimer.current)
        setNoGyro(false)
        setHeading(h)
      }

      function onOrientation(e) {
        if (gotAbsolute) return // предпочитаем абсолютный
        const h = toCompassHeading(e)
        if (h === null) return
        clearTimeout(gyroTimer.current)
        setNoGyro(false)
        setHeading(h)
      }

      window.addEventListener('deviceorientationabsolute', onAbsolute, true)
      window.addEventListener('deviceorientation', onOrientation, true)
      return () => {
        window.removeEventListener('deviceorientationabsolute', onAbsolute, true)
        window.removeEventListener('deviceorientation', onOrientation, true)
      }
    }

    let cleanup
    startGyro().then(fn => { cleanup = fn })
    return () => { cleanup?.(); clearTimeout(gyroTimer.current) }
  }, [qibla])

  const needle = qibla !== null && heading !== null ? (qibla - heading + 360) % 360 : null
  const cardinals = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ']
  const cardinal = qibla !== null ? cardinals[Math.round(qibla / 45) % 8] : null

  if (locErr) return (
    <div style={qb.center}>
      <div style={{ fontSize:48, marginBottom:8 }}>📍</div>
      <div style={qb.errText}>Нет доступа к геолокации</div>
      <div style={qb.errSub}>Разрешите доступ к местоположению в настройках браузера, затем перезагрузите страницу</div>
    </div>
  )

  if (qibla === null) return (
    <div style={qb.center}>
      <div style={qb.spinner} />
      <div style={qb.errSub}>Определяем ваше местоположение…</div>
    </div>
  )

  const aligned = needle !== null && Math.abs(((needle + 180) % 360) - 180) < 10

  return (
    <div style={qb.wrap}>

      {/* Заголовок */}
      <div style={qb.titleBlock}>
        <div style={qb.title}>🧭 Кибла</div>
        <div style={qb.subtitle}>Направление на Мекку</div>
      </div>

      {/* Инфо-плашка */}
      <div style={qb.infoRow}>
        <div style={qb.infoBox}>
          <div style={qb.infoLabel}>Азимут</div>
          <div style={qb.infoVal}>{Math.round(qibla)}°</div>
        </div>
        <div style={qb.infoBox}>
          <div style={qb.infoLabel}>Направление</div>
          <div style={qb.infoVal}>{cardinal}</div>
        </div>
        <div style={qb.infoBox}>
          <div style={qb.infoLabel}>Координаты</div>
          <div style={qb.infoVal}>{lat?.toFixed(1)}°, {lon?.toFixed(1)}°</div>
        </div>
      </div>

      {/* Компас */}
      <div style={qb.compassWrap}>
        {/* Внешнее кольцо с градусами — вращается с устройством */}
        <div style={{
          ...qb.rose,
          transform: heading !== null ? `rotate(${-heading}deg)` : 'none',
          transition: heading !== null ? 'transform .12s ease-out' : 'none',
        }}>
          {/* Стороны света */}
          {[['С','#e05050',0],['В','var(--text-muted)',90],['Ю','var(--text-muted)',180],['З','var(--text-muted)',270]].map(([c, color, deg]) => (
            <div key={c} style={{ ...qb.roseLabel, transform:`rotate(${deg}deg) translateY(-118px)` }}>
              <span style={{ display:'block', transform:`rotate(${-deg}deg)`, color, fontWeight: c==='С' ? 800 : 500, fontSize: c==='С' ? 16 : 13 }}>{c}</span>
            </div>
          ))}
          {/* Деления */}
          {Array.from({length:72}).map((_,i) => (
            <div key={i} style={{
              position:'absolute', top:'50%', left:'50%',
              width: i%18===0 ? 2.5 : i%9===0 ? 1.5 : 1,
              height: i%18===0 ? 16 : i%9===0 ? 11 : 6,
              background: i%18===0 ? 'rgba(255,255,255,.5)' : i%9===0 ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.15)',
              transformOrigin:'0 0',
              transform:`rotate(${i*5}deg) translateX(-50%) translateY(-130px)`,
            }}/>
          ))}
        </div>

        {/* Стрелка — вращается к Мекке */}
        <div style={{
          ...qb.needleWrap,
          transform: needle !== null ? `rotate(${needle}deg)` : 'rotate(0deg)',
          transition: needle !== null ? 'transform .2s ease-out' : 'none',
        }}>
          {/* Верхняя часть стрелки (к Мекке) */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontSize:28, lineHeight:1, filter: aligned ? 'drop-shadow(0 0 8px #C9A84C)' : 'none', transition:'filter .3s' }}>🕋</div>
            <div style={qb.needleUp} />
          </div>
          {/* Нижняя часть */}
          <div style={qb.needleDown} />
        </div>

        {/* Центр */}
        <div style={qb.centerDot} />

        {/* Подсветка когда выровнен */}
        {aligned && <div style={qb.alignGlow} />}
      </div>

      {/* Статус */}
      <div style={{ ...qb.statusBox, borderColor: aligned ? 'rgba(72,199,120,.4)' : noGyro ? 'rgba(201,168,76,.3)' : 'var(--border)' }}>
        {noGyro ? (
          <>
            <div style={qb.statusIcon}>⚠️</div>
            <div style={qb.statusText}>
              Гироскоп недоступен — поверните устройство вручную на <span style={{ color:'var(--gold)', fontWeight:700 }}>{Math.round(qibla)}°</span> от севера
            </div>
          </>
        ) : heading === null ? (
          <>
            <div style={qb.statusIcon}>📱</div>
            <div style={qb.statusText}>Держите телефон горизонтально экраном вверх…</div>
          </>
        ) : aligned ? (
          <>
            <div style={qb.statusIcon}>✅</div>
            <div style={{ ...qb.statusText, color:'#48c778', fontWeight:600 }}>Вы смотрите в сторону Мекки!</div>
          </>
        ) : (
          <>
            <div style={qb.statusIcon}>🔄</div>
            <div style={qb.statusText}>Поворачивайтесь, пока 🕋 не смотрит прямо на вас</div>
          </>
        )}
      </div>

      {/* Инструкция */}
      <div style={qb.hint}>
        <div style={qb.hintTitle}>Как пользоваться</div>
        <div style={qb.hintRow}><span style={qb.hintNum}>1</span> Положите телефон горизонтально экраном вверх</div>
        <div style={qb.hintRow}><span style={qb.hintNum}>2</span> Медленно поворачивайтесь вокруг своей оси</div>
        <div style={qb.hintRow}><span style={qb.hintNum}>3</span> Остановитесь когда 🕋 смотрит прямо на вас</div>
        <div style={qb.hintRow}><span style={qb.hintNum}>4</span> Это и есть направление Киблы — встаньте лицом</div>
      </div>
    </div>
  )
}

const qb = {
  wrap:        { display:'flex', flexDirection:'column', alignItems:'center', gap:18, padding:'8px 16px 24px' },
  center:      { display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'60px 24px', textAlign:'center' },

  titleBlock:  { textAlign:'center' },
  title:       { fontSize:22, fontWeight:800, color:'var(--text)' },
  subtitle:    { fontSize:13, color:'var(--text-muted)', marginTop:3 },

  infoRow:     { display:'flex', gap:10, width:'100%' },
  infoBox:     { flex:1, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14,
                 padding:'10px 8px', textAlign:'center' },
  infoLabel:   { fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 },
  infoVal:     { fontSize:15, fontWeight:700, color:'var(--gold)' },

  compassWrap: { position:'relative', width:290, height:290 },
  rose:        { position:'absolute', inset:0, borderRadius:'50%',
                 border:'2px solid rgba(201,168,76,.35)',
                 background:'var(--bg-card)',
                 boxShadow:'0 0 0 1px rgba(201,168,76,.1), inset 0 0 40px rgba(0,0,0,.3)' },
  roseLabel:   { position:'absolute', top:'50%', left:'50%',
                 transformOrigin:'0 0', marginLeft:-8, marginTop:-10 },
  needleWrap:  { position:'absolute', inset:0, display:'flex', flexDirection:'column',
                 alignItems:'center', justifyContent:'center' },
  needleUp:    { width:4, height:85,
                 background:'linear-gradient(to top, #C9A84C, rgba(201,168,76,.2))',
                 borderRadius:'4px 4px 0 0', boxShadow:'0 0 10px rgba(201,168,76,.5)' },
  needleDown:  { width:4, height:50,
                 background:'linear-gradient(to bottom, rgba(255,255,255,.25), rgba(255,255,255,.05))',
                 borderRadius:'0 0 4px 4px' },
  centerDot:   { position:'absolute', top:'50%', left:'50%', width:16, height:16, borderRadius:'50%',
                 background:'var(--gold)', transform:'translate(-50%,-50%)',
                 boxShadow:'0 0 16px rgba(201,168,76,.8)', zIndex:2 },
  alignGlow:   { position:'absolute', inset:0, borderRadius:'50%',
                 boxShadow:'0 0 30px rgba(72,199,120,.25)', pointerEvents:'none' },

  statusBox:   { width:'100%', display:'flex', alignItems:'center', gap:10,
                 background:'var(--bg-card)', border:'1px solid', borderRadius:16, padding:'14px 16px' },
  statusIcon:  { fontSize:20, flexShrink:0 },
  statusText:  { fontSize:13, color:'var(--text-muted)', lineHeight:1.5, flex:1 },

  hint:        { width:'100%', background:'var(--bg-card)', borderRadius:16,
                 border:'1px solid var(--border)', padding:'14px 16px',
                 display:'flex', flexDirection:'column', gap:10 },
  hintTitle:   { fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase',
                 letterSpacing:'.08em', marginBottom:2 },
  hintRow:     { fontSize:13, color:'var(--text)', lineHeight:1.5, display:'flex', alignItems:'flex-start', gap:10 },
  hintNum:     { width:22, height:22, borderRadius:'50%', background:'rgba(201,168,76,.15)',
                 border:'1px solid rgba(201,168,76,.3)', color:'var(--gold)', fontSize:11,
                 fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  errText:     { fontSize:17, fontWeight:700, color:'var(--text)', textAlign:'center' },
  errSub:      { fontSize:13, color:'var(--text-muted)', textAlign:'center', lineHeight:1.6, maxWidth:280 },
  spinner:     { width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--gold)',
                 borderRadius:'50%', animation:'spin 1s linear infinite' },
}

// aladhan.com — таймзона определяется по координатам на сервере автоматически
async function fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=99&methodSettings=${fajrAngle},null,${ishaAngle}&school=${school}&midnightMode=0`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error('aladhan error')
    const json = await res.json()
    return json.data
  } finally {
    clearTimeout(timer)
  }
}

// ── Тасбих ────────────────────────────────────────────────────
const DHIKR = [
  { ar: 'سُبْحَانَ اللَّهِ',   ru: 'Субханаллах',    target: 33, color: '#7B6BAE' },
  { ar: 'الْحَمْدُ لِلَّهِ',   ru: 'Альхамдулиллах', target: 33, color: '#C9A84C' },
  { ar: 'اللَّهُ أَكْبَرُ',    ru: 'Аллаху Акбар',   target: 33, color: '#52b788' },
]

function Tasbih() {
  const [phase,   setPhase]   = useState(0)
  const [count,   setCount]   = useState(0)
  const [done,    setDone]    = useState(false)
  const [flash,   setFlash]   = useState(false)
  const [bounce,  setBounce]  = useState(false)

  const d = DHIKR[phase]

  function tap() {
    if (done) return
    if (navigator.vibrate) navigator.vibrate(18)
    setBounce(true); setTimeout(() => setBounce(false), 120)

    const next = count + 1
    setCount(next)
    if (next >= d.target) {
      if (phase < DHIKR.length - 1) {
        setFlash(true)
        setTimeout(() => { setFlash(false); setPhase(p => p + 1); setCount(0) }, 450)
      } else {
        setDone(true)
        if (navigator.vibrate) navigator.vibrate([50, 80, 100])
      }
    }
  }

  function reset() {
    setPhase(0); setCount(0); setDone(false); setFlash(false)
  }

  const pct = count / d.target
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - pct)

  return (
    <div style={tb.wrap}>
      <div style={tb.header}>
        <div style={tb.title}>📿 Тасбих после намаза</div>
        <button style={tb.resetBtn} onClick={reset}>сбросить</button>
      </div>

      {/* Фазы */}
      <div style={tb.phases}>
        {DHIKR.map((dh, i) => (
          <div key={i} style={{
            ...tb.phaseItem,
            opacity: i < phase ? .4 : i === phase ? 1 : .25,
          }}>
            <div style={{ ...tb.phaseDot, background: i <= phase ? dh.color : 'var(--border)' }}>
              {i < phase && <span style={{ fontSize:10, color:'#fff' }}>✓</span>}
              {i === phase && <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>{count}</span>}
            </div>
            <div style={{ ...tb.phaseLabel, color: i === phase ? 'var(--text)' : 'var(--text-dim)' }}>
              {dh.ru}
            </div>
            <div style={{ fontSize:10, color:'var(--text-dim)' }}>×{dh.target}</div>
          </div>
        ))}
      </div>

      {done && (
        <div style={tb.doneBox}>
          <div style={{ fontSize:36 }}>🤲</div>
          <div style={tb.doneText}>МашаАллах! Тасбих завершён</div>
          <div style={tb.doneSub}>Прочитайте дуа на 100-й:</div>
          <div className="arabic gold-shimmer" style={tb.doneAr}>
            لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ
          </div>
          <div style={tb.doneTranslit}>
            Ля иляха илла-Ллаху вахдаху ля шарика лях, ляху-ль-мульку ва ляху-ль-хамду ва хува 'аля кулли шайин кадир
          </div>
          <div style={tb.doneTr}>
            Нет божества кроме Аллаха, одного, без сотоварища. Ему принадлежит власть и хвала, и Он над всем властен
          </div>
          <div style={tb.doneSource}>Муслим, 597</div>
          <button style={tb.resetBtn2} onClick={reset}>начать заново</button>
        </div>
      )}
      {!done && (
        <div style={tb.center}>
          {/* Арабский текст */}
          <div className="arabic gold-shimmer" style={tb.dhikrAr}>{d.ar}</div>
          <div style={tb.dhikrRu}>{d.ru} — {count}/{d.target}</div>

          {/* Счётчик с кольцом — главный элемент для тапа */}
          <div style={{ position:'relative', width:200, height:200, cursor:'pointer' }}
            onClick={tap}>
            <svg width="200" height="200" style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8"/>
              <circle cx="100" cy="100" r="88" fill="none"
                stroke={d.color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - pct)}
                style={{ transition:'stroke-dashoffset .15s ease' }}
              />
            </svg>
            <div style={{
              ...tb.countBtn,
              transform: bounce ? 'scale(.93)' : 'scale(1)',
              background: flash ? d.color : `${d.color}18`,
              borderColor: d.color,
              transition: bounce ? 'transform .08s' : 'transform .18s, background .3s',
              flexDirection:'column', gap:4,
            }}>
              <span style={{ fontSize:56, fontWeight:800, color: flash ? '#fff' : d.color,
                fontFamily:'var(--font-ui)', lineHeight:1 }}>
                {count}
              </span>
              <span style={{ fontSize:12, color: flash ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)',
                fontFamily:'var(--font-ui)' }}>нажми</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const tb = {
  wrap:       { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16,
                padding:'16px', marginBottom:16, animation:'cardIn .5s ease 420ms both' },
  header:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  title:      { fontSize:14, fontWeight:600, color:'var(--text)' },
  resetBtn:   { fontSize:11, color:'var(--text-dim)', background:'none', border:'none',
                cursor:'pointer', padding:'2px 6px', fontFamily:'var(--font-ui)' },
  phases:     { display:'flex', justifyContent:'space-around', marginBottom:18 },
  phaseItem:  { display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, transition:'opacity .3s' },
  phaseDot:   { width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', transition:'background .3s' },
  phaseLabel: { fontSize:11, fontWeight:500, textAlign:'center', transition:'color .3s' },
  center:     { display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
  countBtn:   { position:'absolute', inset:8, borderRadius:'50%', border:'2px solid',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  dhikrAr:    { fontSize:24, lineHeight:1.8, direction:'rtl', fontFamily:"'Scheherazade New',serif",
                textAlign:'center', transition:'color .3s' },
  dhikrRu:    { fontSize:12, color:'var(--text-muted)', textAlign:'center' },
  doneBox:    { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'8px 0' },
  doneText:   { fontSize:15, fontWeight:700, color:'var(--gold)', textAlign:'center' },
  doneSub:    { fontSize:12, color:'var(--text-muted)', marginTop:4 },
  doneAr:     { fontSize:20, lineHeight:2, direction:'rtl', fontFamily:"'Scheherazade New',serif",
                textAlign:'center', color:'var(--gold)', marginTop:4 },
  doneTranslit:{ fontSize:12, color:'var(--text-muted)', textAlign:'center', fontStyle:'italic', lineHeight:1.6 },
  doneTr:     { fontSize:13, color:'var(--text)', textAlign:'center', lineHeight:1.6 },
  doneSource: { fontSize:11, color:'var(--text-dim)', fontStyle:'italic' },
  resetBtn2:  { marginTop:10, padding:'9px 24px', borderRadius:20, border:'1px solid var(--border)',
                background:'none', cursor:'pointer', fontFamily:'var(--font-ui)',
                fontSize:13, color:'var(--text-muted)', transition:'all .2s' },
}

// ── Главная страница ──────────────────────────────────────────
export default function PrayerPage() {
  const { profile, user, setProfile } = useAuth()
  const lang = profile?.language || 'ru'

  // Режим: 'auto' (геолокация) или 'manual' (город вручную)
  const [mode,      setMode]      = useState(() => {
    const saved = localStorage.getItem('prayer_mode')
    if (saved) return saved
    // Если нет сохранённого города — сразу ручной режим, не ждём геолокацию
    const hasCity = !!localStorage.getItem('prayer_city')
    return hasCity ? 'auto' : 'manual'
  })
  const [savedCity, setSavedCity] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prayer_city')) } catch { return null }
  })
  const [cityInput, setCityInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching,   setSearching]   = useState(false)
  const searchTimer = useRef(null)

  const [location,  setLocation]  = useState(null)
  const [timings,   setTimings]   = useState(null)
  const [hijri,     setHijri]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [now,       setNow]       = useState(new Date())
  const [notifOk,   setNotifOk]   = useState(false)
  const [remind,    setRemind]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('prayerRemind') || '[30,20,10]') } catch { return [30, 20, 10] }
  })

  // ── Трекер намазов ──
  const [donePrayers, setDonePrayers] = useState(new Set())
  const [weekData,    setWeekData]    = useState([])
  const [streak,      setStreak]      = useState(0)
  const [rewardIdx,   setRewardIdx]   = useState(null) // null = не показывать
  const [rewardName,  setRewardName]  = useState('')
  const rewardCounter = useRef(0) // растёт с каждым отмеченным намазом
  const [method,    setMethod]    = useState(() => parseInt(localStorage.getItem('prayer_method')  || '15'))
  const [school,    setSchool]    = useState(() => parseInt(localStorage.getItem('prayer_school')  || '0'))
  const [fajrAngle, setFajrAngle] = useState(() => parseInt(localStorage.getItem('prayer_fajr')    || '18'))
  const [ishaAngle, setIshaAngle] = useState(() => parseInt(localStorage.getItem('prayer_isha')    || '17'))
  const [showSettings, setShowSettings] = useState(false)
  const [showTasbih,    setShowTasbih]    = useState(false)
  const [showQibla,     setShowQibla]     = useState(false)
  const [showCalendar,  setShowCalendar]  = useState(false)

  // Тик каждую секунду
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Загрузка при смене режима, города или настроек расчёта
  useEffect(() => {
    if (mode === 'manual') {
      if (!savedCity) { setLoading(false); return }
      setLoading(true); setError(null)
      fetchTimings(savedCity.lat, savedCity.lon, method, school, fajrAngle, ishaAngle)
        .then(data => {
          setTimings(data.timings)
          setHijri(data.date.hijri)
          setLocation({ lat: savedCity.lat, lon: savedCity.lon, city: savedCity.name, country: '' })
        })
        .catch(() => setError('api_error'))
        .finally(() => setLoading(false))
    } else {
      loadByGeo()
    }
  }, [mode, savedCity, method, school, fajrAngle, ishaAngle])

  function loadByGeo() {
    setLoading(true); setError(null)
    if (!navigator.geolocation) {
      setError('geo_blocked')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const data = await fetchTimings(lat, lon, method, school, fajrAngle, ishaAngle)
          setTimings(data.timings)
          setHijri(data.date.hijri)
          setLocation({ lat, lon, city: '', country: '' })
          try {
            const geo = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${lang}`
            )
            const gj = await geo.json()
            const city    = gj.address?.city || gj.address?.town || gj.address?.village || ''
            const country = gj.address?.country || ''
            setLocation(prev => prev ? { ...prev, city, country } : { lat, lon, city, country })
          } catch { /* геокодирование не критично */ }
        } catch { setError('api_error') }
        setLoading(false)
      },
      () => { setError('geo_blocked'); setLoading(false) },
      { timeout: 5000, maximumAge: 60000 }
    )
  }

  function saveMethod(v)    { setMethod(v);    localStorage.setItem('prayer_method', v)  }
  function saveSchool(v)    { setSchool(v);    localStorage.setItem('prayer_school', v)  }
  function saveFajr(v)      { setFajrAngle(v); localStorage.setItem('prayer_fajr', v)    }
  function saveIsha(v)      { setIshaAngle(v); localStorage.setItem('prayer_isha', v)    }

  // Поиск с задержкой
  function onCityInput(val) {
    setCityInput(val)
    clearTimeout(searchTimer.current)
    if (val.length < 2) { setSuggestions([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const results = await searchCities(val)
      setSuggestions(results)
      setSearching(false)
    }, 500)
  }

  function selectCity(city) {
    setSavedCity(city)
    setCityInput('')
    setSuggestions([])
    localStorage.setItem('prayer_city', JSON.stringify(city))
  }

  function switchMode(m) {
    setMode(m)
    localStorage.setItem('prayer_mode', m)
    setTimings(null); setLocation(null)
  }

  // ── Трекер: загрузка ──
  useEffect(() => {
    if (!user) return
    loadTracker()
  }, [user])

  async function loadTracker() {
    const today = new Date().toISOString().split('T')[0]
    const ago30 = new Date(); ago30.setDate(ago30.getDate() - 30)

    const { data } = await supabase
      .from('prayer_logs')
      .select('date, prayer')
      .eq('user_id', user.id)
      .gte('date', ago30.toISOString().split('T')[0])
    if (!data) return

    // Сегодня
    setDonePrayers(new Set(data.filter(r => r.date === today).map(r => r.prayer)))

    // Неделя — от понедельника до воскресенья текущей недели
    const now = new Date()
    const dow = now.getDay() // 0=вс, 1=пн ... 6=сб
    const diffToMon = (dow === 0) ? -6 : 1 - dow
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMon)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      days.push({ date: ds, count: data.filter(r => r.date === ds).length })
    }
    setWeekData(days)

    // Стрик: последовательные дни где все 5
    let s = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const cnt = data.filter(r => r.date === ds).length
      if (cnt >= 5) s++
      else if (i > 0) break // сегодня может быть не завершён
    }
    setStreak(s)
  }

  async function togglePrayer(prayerId, prayerName) {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const already = donePrayers.has(prayerId)

    // Оптимистичное обновление
    setDonePrayers(prev => {
      const s = new Set(prev)
      already ? s.delete(prayerId) : s.add(prayerId)
      return s
    })
    setWeekData(prev => prev.map(d =>
      d.date === today ? { ...d, count: d.count + (already ? -1 : 1) } : d
    ))

    if (!already) {
      // Показываем награду
      setRewardName(prayerName)
      setRewardIdx(rewardCounter.current++)
      // Обновляем стрик если все 5
      const newDone = donePrayers.size + 1
      if (newDone >= 5) setStreak(s => s + 1)
      // +10 за намаз, +30 бонус если все 5 — суммируем в одном вызове чтобы не было гонки
      addNur(newDone === 5 ? 40 : 10, user, profile, setProfile)
    }

    // Сохраняем в Supabase
    if (already) {
      await supabase.from('prayer_logs').delete()
        .eq('user_id', user.id).eq('date', today).eq('prayer', prayerId)
    } else {
      await supabase.from('prayer_logs').upsert(
        { user_id: user.id, date: today, prayer: prayerId },
        { onConflict: 'user_id,date,prayer' }
      )
    }
  }

  // Запрашиваем разрешение на уведомления
  useEffect(() => {
    requestNotifPerm().then(setNotifOk)
  }, [])

  // Планируем уведомления при наличии данных
  useEffect(() => {
    if (timings && notifOk) {
      const pts = PRAYERS.map(p => ({ ...p, time: timings[p.id] })).filter(p => p.time)
      scheduleNotifs(pts, remind)
    }
    return () => clearAllTimers()
  }, [timings, notifOk, remind])

  // Сохраняем расписание намазов на сервер (для push-уведомлений когда приложение закрыто)
  useEffect(() => {
    if (!timings || !user || !notifOk) return
    const today = new Date().toISOString().slice(0, 10)
    const utcOffset = -new Date().getTimezoneOffset()
    const prayerTimings = { Fajr: timings.Fajr, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha }
    supabase.from('prayer_schedules').upsert(
      { user_id: user.id, date: today, timings: prayerTimings, remind_before: remind, utc_offset: utcOffset },
      { onConflict: 'user_id' }
    )
  }, [timings, user?.id, notifOk, remind])

  // Вычисляем статус каждого намаза
  const prayerList = PRAYERS.map(p => ({ ...p, time: timings?.[p.id] || null }))

  const nowMs = now.getTime()
  let nextIdx = -1
  let activeIdx = -1

  prayerList.forEach((p, i) => {
    if (!p.time) return
    const pt = parseTime(p.time)
    const next = prayerList[i + 1]
    const nextPt = next?.time ? parseTime(next.time) : null
    if (nowMs >= pt && (!nextPt || nowMs < nextPt)) activeIdx = i
  })

  // Следующий — первый у которого время ещё не наступило
  nextIdx = prayerList.findIndex(p => p.time && parseTime(p.time) > now)

  const nextPrayer = nextIdx >= 0 ? prayerList[nextIdx] : null
  const secToNext  = nextPrayer?.time ? diffSec(now, parseTime(nextPrayer.time)) : 0

  // Общее время между предыдущим и следующим намазом (для прогресс дуги)
  const prevPrayer = nextIdx > 0 ? prayerList[nextIdx - 1] : null
  const totalSec   = (prevPrayer?.time && nextPrayer?.time)
    ? diffSec(parseTime(prevPrayer.time), parseTime(nextPrayer.time))
    : 0

  // Хиджри дата
  let hijriStr = ''
  if (hijri) {
    const monthNum = parseInt(hijri.month?.number) - 1
    hijriStr = `${hijri.day} ${HIJRI_MONTHS[monthNum] || hijri.month?.en || ''} ${hijri.year} г.х.`
  }

  async function toggleRemind(min) {
    // Всегда переключаем — не блокируем на разрешении
    setRemind(prev => {
      const next = prev.includes(min) ? prev.filter(x => x !== min) : [...prev, min]
      localStorage.setItem('prayerRemind', JSON.stringify(next))
      return next
    })
    // Запрашиваем разрешение параллельно (не блокирует UI)
    if (!notifOk) {
      const ok = await requestNotifPerm()
      setNotifOk(ok)
      if (ok) sendNotif('🔔 Nur Hayat', 'Напоминания о намазе включены!')
    }
  }



  return (
    <div style={s.page}>
      {/* Фоновые орбы */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      <div style={s.scroll} className="scroll-y">

        {/* ── Заголовок ── */}
        <div style={s.header}>
          <div style={s.dateRow}>
            <span style={s.hijriDate} className="gold-shimmer">{hijriStr || '...'}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button style={s.tasbihBtn} onClick={() => setShowTasbih(true)}>📿 Тасбих</button>
              <button style={s.tasbihBtn} onClick={() => setShowQibla(true)}>🧭 Кибла</button>
              <button style={s.tasbihBtn} onClick={() => setShowCalendar(true)}>📅 История</button>
            </div>
          </div>

          {/* Переключатель режима */}
          <div style={s.modeSwitcher}>
            <button
              style={{ ...s.modeBtn, ...(mode === 'auto' ? s.modeBtnActive : {}) }}
              onClick={() => switchMode('auto')}
            >
              📍 Авто
            </button>
            <button
              style={{ ...s.modeBtn, ...(mode === 'manual' ? s.modeBtnActive : {}) }}
              onClick={() => switchMode('manual')}
            >
              🏙 Город
            </button>
          </div>

          {/* Ввод города (ручной режим) */}
          {mode === 'manual' && (
            <div style={s.cityBlock}>
              {savedCity && !cityInput && (
                <div style={s.savedCityRow}>
                  <span style={s.locIcon}>🏙</span>
                  <span style={s.locText}>{savedCity.name}</span>
                  <button style={s.changeBtn} onClick={() => setCityInput(' ')}>изменить</button>
                </div>
              )}
              <div style={s.searchWrap}>
                <input
                  style={s.cityInput}
                  placeholder="Введите город..."
                  value={cityInput.trim() === '' && cityInput !== '' ? '' : cityInput}
                  onChange={e => onCityInput(e.target.value)}
                  onFocus={() => { if (cityInput === ' ') setCityInput('') }}
                />
                {searching && <div style={s.searchSpin} />}
              </div>

              {suggestions.length > 0 && (
                <div style={s.suggestions}>
                  {suggestions.map((c, i) => (
                    <button
                      key={i}
                      style={s.suggestion}
                      onClick={() => selectCity(c)}
                    >
                      <span style={{ fontSize:14 }}>📍</span>
                      <span style={s.suggText}>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {!savedCity && !searching && suggestions.length === 0 && cityInput.length < 2 && (
                <div style={s.cityHint}>Введите название города для поиска</div>
              )}
            </div>
          )}

          {mode === 'auto' && location && (
            <div style={s.locationRow}>
              <span style={s.locIcon}>📍</span>
              <span style={s.locText}>{location.city}{location.city && location.country ? ', ' : ''}{location.country}</span>
            </div>
          )}
        </div>

        {loading && (
          <div style={s.loadWrap}>
            <div style={s.loadRing} />
            <div style={s.loadText}>{mode === 'manual' ? 'Загружаем времена намаза...' : 'Определяем местоположение...'}</div>
            {mode === 'auto' && (
              <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', marginTop:8, lineHeight:1.6 }}>
                Появится запрос на доступ к геолокации.{'\n'}Если ничего не происходит — переключитесь на «Город»
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && !savedCity && !loading && (
          <div style={s.errorBox}>
            <div style={{ fontSize:40 }}>🏙</div>
            <div style={{ fontSize:16, color:'var(--text)', fontWeight:600 }}>Выберите город</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>
              Введите название вашего города выше, чтобы увидеть времена намаза
            </div>
          </div>
        )}

        {error && (
          <div style={s.errorBox}>
            <div style={{ fontSize:48 }}>{error === 'geo_blocked' ? '📍' : '🌐'}</div>
            <div style={{ fontSize:16, color:'var(--text)', fontWeight:600 }}>
              {error === 'geo_blocked' ? 'Нет доступа к геолокации' : 'Не удалось загрузить времена намаза'}
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', lineHeight:1.6 }}>
              Проверьте интернет-соединение и попробуйте снова, или выберите город вручную.
            </div>
            <button style={s.enableBtn} onClick={() => switchMode('manual')}>🏙 Выбрать город вручную</button>
            <button style={{ ...s.enableBtn, background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', marginTop:0 }}
              onClick={() => mode === 'auto' ? loadByGeo() : switchMode(mode)}>
              🔄 Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && timings && (
          <>
            {/* ── Главный блок: обратный отсчёт ── */}
            <div style={s.countdownCard}>
              <Countdown seconds={secToNext} nextPrayer={nextPrayer} totalSeconds={totalSec} />

              <div style={s.countdownRight}>
                <div style={s.nextLabel}>Следующий намаз</div>
                <div style={s.nextName}>{nextPrayer?.ru || 'Все прошли'}</div>
                <div style={s.nextAr} className="arabic gold-shimmer">{nextPrayer?.ar || ''}</div>
                <div style={s.nextTime}>{nextPrayer ? fmt(nextPrayer.time) : ''}</div>
              </div>
            </div>

            {/* ── Недельный трекер ── */}
            {weekData.length > 0 && (
              <WeekStrip weekData={weekData} streak={streak} todayCount={donePrayers.size} />
            )}

            {/* ── Карточки намазов ── */}
            <div style={s.prayerList}>
              {prayerList.map((p, i) => {
                let state = 'upcoming'
                if (i < activeIdx)        state = 'done'
                else if (i === activeIdx) state = 'active'
                else if (i === nextIdx)   state = 'next'
                return (
                  <PrayerCard
                    key={p.id}
                    prayer={p}
                    time={p.time}
                    state={state}
                    delay={i * 60}
                    checked={donePrayers.has(p.id)}
                    onCheck={() => togglePrayer(p.id, p.ru)}
                  />
                )
              })}
            </div>

            {/* ── Восход/Закат ── */}
            <div style={s.sunRow}>
              <div style={s.sunItem}>
                <span style={{ fontSize:22 }}>🌅</span>
                <div>
                  <div style={s.sunLabel}>Восход</div>
                  <div style={s.sunTime}>{fmt(timings.Sunrise)}</div>
                </div>
              </div>
              <div style={s.sunDiv} />
              <div style={s.sunItem}>
                <span style={{ fontSize:22 }}>🌇</span>
                <div>
                  <div style={s.sunLabel}>Закат</div>
                  <div style={s.sunTime}>{fmt(timings.Sunset)}</div>
                </div>
              </div>
              <div style={s.sunDiv} />
              <div style={s.sunItem}>
                <span style={{ fontSize:22 }}>🌙</span>
                <div>
                  <div style={s.sunLabel}>Полночь</div>
                  <div style={s.sunTime}>{fmt(timings.Midnight)}</div>
                </div>
              </div>
            </div>

            {/* ── Уведомления ── */}
            <div style={s.notifCard}>
              <div style={s.notifTop}>
                <div style={s.notifTitle}>🔔 Напоминания</div>
              </div>

              <div style={s.notifDesc}>За сколько минут до намаза напоминать:</div>

              <div style={s.reminderBtns}>
                {[10, 20, 30].map(min => (
                  <button key={min} style={{
                    ...s.remBtn,
                    background: remind.includes(min) ? 'rgba(72,199,120,.15)' : 'var(--bg-card)',
                    border: remind.includes(min) ? '1.5px solid #48c778' : '1px solid var(--border)',
                    color: remind.includes(min) ? '#48c778' : 'var(--text-muted)',
                    fontWeight: remind.includes(min) ? 600 : 400,
                  }} onClick={() => toggleRemind(min)}>
                    {remind.includes(min) ? '✓ ' : ''}{min} мин
                  </button>
                ))}
              </div>
            </div>

            {/* ── Настройки расчёта ── */}
            <div style={s.settingsCard}>
              {/* Шапка с подсказкой */}
              <button style={s.settingsHeader} onClick={() => setShowSettings(v => !v)}>
                <div style={s.settingsLeft}>
                  <span style={{ fontSize:18 }}>⚙️</span>
                  <div>
                    <div style={s.settingsTitle}>Настройка метода расчёта</div>
                    <div style={s.settingsTip}>
                      Рекомендуем разово настроить под ваш регион и местную мечеть
                    </div>
                  </div>
                </div>
                <span style={{ fontSize:13, color:'var(--text-dim)', transition:'transform .2s', transform: showSettings ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>

              {showSettings && (
                <div style={{ paddingTop:12, display:'flex', flexDirection:'column', gap:14, animation:'cardIn .2s ease' }}>

                  {/* Подсказка */}
                  <div style={s.tipBox}>
                    💡 Если время намаза не совпадает с вашей мечетью — выберите метод <b>Россия/СНГ (САМР)</b> и подберите углы Фаджр и Иша вручную до совпадения. Настройки сохраняются автоматически.
                  </div>

                  {/* Метод */}
                  <div>
                    <div style={s.settingsLabel}>Метод расчёта</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {CALC_METHODS.map(m => (
                        <button key={m.id} style={{
                          ...s.optBtn,
                          background: method === m.id ? 'rgba(201,168,76,.15)' : 'transparent',
                          border: `1px solid ${method === m.id ? 'rgba(201,168,76,.4)' : 'transparent'}`,
                          color: method === m.id ? 'var(--gold)' : 'var(--text)',
                        }} onClick={() => saveMethod(m.id)}>
                          <span style={{ flex:1, textAlign:'left' }}>{m.name}</span>
                          {method === m.id && <span style={{ fontSize:12 }}>✓</span>}
                          <span style={{ fontSize:11, color:'var(--text-dim)', minWidth:32, textAlign:'right' }}>{m.short}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Мазхаб */}
                  <div>
                    <div style={s.settingsLabel}>Мазхаб (время Аср)</div>
                    <div style={{ display:'flex', gap:8 }}>
                      {[{ v:0, l:'Шафии / Маликии' }, { v:1, l:'Ханафи' }].map(o => (
                        <button key={o.v} style={{
                          ...s.tagBtn,
                          background: school === o.v ? 'rgba(201,168,76,.2)' : 'var(--bg-card)',
                          border: `1px solid ${school === o.v ? 'rgba(201,168,76,.5)' : 'var(--border)'}`,
                          color: school === o.v ? 'var(--gold)' : 'var(--text-muted)',
                        }} onClick={() => saveSchool(o.v)}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Углы Фаджр и Иша */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div>
                      <div style={s.settingsLabel}>Угол Фаджр: <span style={{ color:'var(--gold)' }}>{fajrAngle}°</span></div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {[12, 13, 14, 15, 16, 17, 18, 19].map(v => (
                          <button key={v} style={{
                            ...s.tagBtn,
                            background: fajrAngle === v ? 'rgba(201,168,76,.2)' : 'var(--bg-card)',
                            border: `1px solid ${fajrAngle === v ? 'rgba(201,168,76,.5)' : 'var(--border)'}`,
                            color: fajrAngle === v ? 'var(--gold)' : 'var(--text-muted)',
                          }} onClick={() => saveFajr(v)}>{v}°</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={s.settingsLabel}>Угол Иша: <span style={{ color:'var(--gold)' }}>{ishaAngle}°</span></div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {[12, 13, 14, 15, 16, 17, 18, 19].map(v => (
                          <button key={v} style={{
                            ...s.tagBtn,
                            background: ishaAngle === v ? 'rgba(201,168,76,.2)' : 'var(--bg-card)',
                            border: `1px solid ${ishaAngle === v ? 'rgba(201,168,76,.5)' : 'var(--border)'}`,
                            color: ishaAngle === v ? 'var(--gold)' : 'var(--text-muted)',
                          }} onClick={() => saveIsha(v)}>{v}°</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Дуа перед намазом ── */}
            <div style={s.duaCard}>
              <div style={s.duaTitle}>Дуа перед намазом</div>
              <div style={s.duaAr} className="arabic gold-shimmer">
                اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ
              </div>
              <div style={s.duaTranslit}>
                Аллахумма-джальни мина-т-таввабина вад-жальни мина-л-мутатаhhирин
              </div>
              <div style={s.duaTr}>
                О Аллах, причисли меня к кающимся и к тем, кто очищает себя
              </div>
            </div>
          </>
        )}

        <div style={{ height: 90 }} />
      </div>

      {showTasbih && (
        <div style={s.modalBackdrop} onClick={() => setShowTasbih(false)}>
          <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
            <div style={s.modalHandle} />
            <div style={s.tasbihOverlayHead}>
              <button style={s.tasbihClose} onClick={() => setShowTasbih(false)}>✕</button>
            </div>
            <div style={s.tasbihOverlayBody}>
              <div style={s.tasbihInner}>
                <Tasbih />
              </div>
            </div>
          </div>
        </div>
      )}

      {showQibla && (
        <div style={s.modalBackdrop} onClick={() => setShowQibla(false)}>
          <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
            <div style={s.modalHandle} />
            <div style={s.tasbihOverlayHead}>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>Кибла</div>
              <button style={s.tasbihClose} onClick={() => setShowQibla(false)}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <Qibla initLat={location?.lat} initLon={location?.lon} />
            </div>
          </div>
        </div>
      )}

      {showCalendar && (
        <PrayerCalendar user={user} onClose={() => setShowCalendar(false)} />
      )}

      {rewardIdx !== null && (
        <RewardOverlay
          key={rewardIdx}
          prayerName={rewardName}
          rewardIdx={rewardIdx}
          onClose={() => setRewardIdx(null)}
        />
      )}

      <style>{`
        @keyframes cardIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes digitFlip { 0%{transform:scaleY(0);opacity:0} 50%{transform:scaleY(1.2)} 100%{transform:scaleY(1);opacity:1} }
        @keyframes activePulse { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes orbFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes popIn     { 0%{transform:scale(0)} 60%{transform:scale(1.4)} 100%{transform:scale(1)} }
        @keyframes rwIn      { from{opacity:0} to{opacity:1} }
        @keyframes rwOut     { from{opacity:1} to{opacity:0} }
        @keyframes cardInY   { from{opacity:0;transform:translateY(40px) scale(.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cardOutY  { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.9)} }
        @keyframes pBurst    { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)} }
        @keyframes pRise     { 0%{opacity:0;transform:translateY(20px)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-100px)} }
        @keyframes pRain     { 0%{opacity:0;transform:translateY(-20px)} 40%{opacity:1} 100%{opacity:0;transform:translateY(120px)} }
        @keyframes pSpiral   { 0%{opacity:1;transform:translate(0,0) rotate(0)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(360deg) scale(0)} }
        @keyframes pFloat    { 0%{opacity:1;transform:translate(0,0)} 100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)} }
      `}</style>
    </div>
  )
}

// ── Стили ─────────────────────────────────────────────────────
const s = {
  page: { height:'100%', background:'var(--bg-deep)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' },
  orb1: { position:'absolute', width:300, height:300, top:-80, right:-80, borderRadius:'50%', background:'radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none', animation:'orbFloat 8s ease-in-out infinite' },
  orb2: { position:'absolute', width:200, height:200, bottom:100, left:-60, borderRadius:'50%', background:'radial-gradient(circle,rgba(91,123,174,.06) 0%,transparent 70%)', filter:'blur(50px)', pointerEvents:'none', animation:'orbFloat 10s ease-in-out infinite reverse' },
  scroll: { flex:1, padding:'0 16px', paddingTop:'calc(var(--safe-top) + 16px)' },

  header: { display:'flex', flexDirection:'column', gap:8, marginBottom:20 },
  dateRow: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  hijriDate: { fontSize:15, fontWeight:600, color:'var(--gold)' },
  tasbihBtn: { display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
    background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.3)',
    color:'var(--gold)', fontSize:13, fontWeight:600, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none' },
  modalBackdrop: {
    position:'fixed', inset:0, zIndex:90,
    background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)',
    display:'flex', flexDirection:'column', justifyContent:'flex-end',
  },
  modalSheet: {
    background:'var(--bg-surface)', borderRadius:'20px 20px 0 0',
    maxHeight:'92dvh', display:'flex', flexDirection:'column',
    border:'1px solid var(--border)', borderBottom:'none',
  },
  modalHandle: {
    width:40, height:4, borderRadius:2,
    background:'rgba(255,255,255,.2)', margin:'10px auto 4px', flexShrink:0,
  },
  tasbihOverlayHead: { display:'flex', alignItems:'center', justifyContent:'flex-end',
    padding:'4px 16px 0' },
  tasbihClose: { width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:16, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center', outline:'none',
    fontFamily:'var(--font-ui)' },
  tasbihOverlayBody: { flex:1, padding:'8px 16px 32px', display:'flex', flexDirection:'column',
    justifyContent:'center', alignItems:'center' },
  tasbihInner: { width:'100%', maxWidth:360 },
  locationRow: { display:'flex', alignItems:'center', gap:5 },
  locIcon: { fontSize:13 },
  locText: { fontSize:13, color:'var(--text-muted)', flex:1 },

  modeSwitcher: { display:'flex', gap:8 },
  modeBtn: {
    flex:1, padding:'8px 0', borderRadius:12, border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text-muted)', cursor:'pointer',
    fontFamily:'var(--font-ui)', fontSize:13, fontWeight:500, transition:'all .2s', outline:'none'
  },
  modeBtnActive: {
    background:'rgba(201,168,76,.15)', border:'1px solid rgba(201,168,76,.4)',
    color:'var(--gold)', fontWeight:600
  },

  cityBlock: { display:'flex', flexDirection:'column', gap:6 },
  savedCityRow: { display:'flex', alignItems:'center', gap:5 },
  changeBtn: { marginLeft:'auto', fontSize:12, color:'var(--gold)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-ui)', padding:'2px 0', textDecoration:'underline' },
  searchWrap: { position:'relative', display:'flex', alignItems:'center' },
  cityInput: {
    flex:1, padding:'10px 14px', borderRadius:12,
    border:'1px solid var(--border)', background:'var(--bg-card)',
    color:'var(--text)', fontFamily:'var(--font-ui)', fontSize:14,
    outline:'none', transition:'border-color .2s',
  },
  searchSpin: {
    position:'absolute', right:12, width:16, height:16,
    borderRadius:'50%', border:'2px solid rgba(201,168,76,.2)',
    borderTopColor:'var(--gold)', animation:'spin .7s linear infinite'
  },
  suggestions: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column'
  },
  suggestion: {
    display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
    background:'none', border:'none', cursor:'pointer', textAlign:'left',
    borderBottom:'1px solid var(--border)', transition:'background .15s',
    fontFamily:'var(--font-ui)'
  },
  suggText: { fontSize:13, color:'var(--text)' },
  cityHint: { fontSize:12, color:'var(--text-dim)', textAlign:'center', padding:'4px 0' },

  loadWrap: { display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'60px 0' },
  loadRing: { width:40, height:40, borderRadius:'50%', border:'3px solid rgba(201,168,76,.2)', borderTopColor:'var(--gold)', animation:'spin .8s linear infinite' },
  loadText: { fontSize:14, color:'var(--text-muted)' },

  errorBox: { display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px 20px', textAlign:'center' },

  // Countdown card
  countdownCard: {
    background:'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.03))',
    border:'1px solid rgba(201,168,76,.2)',
    borderRadius:20, padding:'20px', marginBottom:16,
    display:'flex', alignItems:'center', gap:20,
    boxShadow:'0 0 40px rgba(201,168,76,.08)',
    animation:'cardIn .5s ease'
  },
  countdownRight: { flex:1, display:'flex', flexDirection:'column', gap:4 },
  nextLabel: { fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em' },
  nextName:  { fontSize:26, fontWeight:700, color:'var(--text)' },
  nextAr:    { fontFamily:"'Scheherazade New',serif", fontSize:18, color:'rgba(201,168,76,.6)' },
  nextTime:  { fontSize:20, fontWeight:700, color:'var(--gold)', fontVariantNumeric:'tabular-nums' },

  prayerList: { display:'flex', flexDirection:'column', gap:8, marginBottom:16 },

  sunRow: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:16, padding:'14px 16px', marginBottom:16,
    display:'flex', alignItems:'center', animation:'cardIn .5s ease 300ms both'
  },
  sunItem: { flex:1, display:'flex', alignItems:'center', gap:10, justifyContent:'center' },
  sunDiv:  { width:1, height:36, background:'var(--border)' },
  sunLabel:{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' },
  sunTime: { fontSize:16, fontWeight:700, color:'var(--text)', fontVariantNumeric:'tabular-nums' },

  notifCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:16, padding:'16px', marginBottom:16,
    animation:'cardIn .5s ease 360ms both'
  },
  notifTop:   { display:'flex', alignItems:'center', gap:10, marginBottom:10 },
  notifTitle: { flex:1, fontSize:15, fontWeight:600, color:'var(--text)' },
  enableBtn:  { padding:'5px 14px', borderRadius:12, background:'var(--gold)', color:'#070710', border:'none', cursor:'pointer', fontWeight:600, fontSize:12, fontFamily:'var(--font-ui)' },
  notifOn:    { fontSize:12, color:'#52b788', fontWeight:600 },
  notifDesc:  { fontSize:13, color:'var(--text-muted)', marginBottom:10 },
  reminderBtns: { display:'flex', gap:8 },
  remBtn: { flex:1, padding:'9px 0', borderRadius:12, cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:13, fontWeight:500, transition:'all .2s', outline:'none' },
  notifHint:  { marginTop:10, fontSize:12, color:'var(--text-dim)', textAlign:'center' },

  settingsCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:16, padding:'14px 16px', marginBottom:16,
    animation:'cardIn .5s ease 380ms both'
  },
  settingsHeader: {
    display:'flex', alignItems:'center', gap:12, width:'100%',
    background:'none', border:'none', cursor:'pointer', padding:0,
    fontFamily:'var(--font-ui)', textAlign:'left'
  },
  settingsLeft:  { display:'flex', alignItems:'flex-start', gap:10, flex:1 },
  settingsTitle: { fontSize:14, fontWeight:600, color:'var(--text)' },
  settingsTip:   { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  settingsLabel: { fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 },
  tipBox: {
    background:'rgba(201,168,76,.07)', border:'1px solid rgba(201,168,76,.2)',
    borderRadius:10, padding:'10px 12px',
    fontSize:13, color:'var(--text-muted)', lineHeight:1.5
  },
  optBtn: {
    display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:10,
    cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:13, fontWeight:500,
    transition:'all .15s', outline:'none', width:'100%'
  },
  tagBtn: {
    flex:1, padding:'7px 10px', borderRadius:10, cursor:'pointer',
    fontFamily:'var(--font-ui)', fontSize:12, fontWeight:500,
    transition:'all .2s', outline:'none', whiteSpace:'nowrap'
  },


  duaCard: {
    background:'rgba(201,168,76,.04)', border:'1px solid rgba(201,168,76,.15)',
    borderRadius:16, padding:'16px', marginBottom:16,
    display:'flex', flexDirection:'column', gap:8,
    animation:'cardIn .5s ease 420ms both'
  },
  duaTitle:     { fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em' },
  duaAr:        { fontFamily:"'Scheherazade New',serif", fontSize:20, color:'var(--gold-light)', textAlign:'right', direction:'rtl', lineHeight:1.8 },
  duaTranslit:  { fontSize:13, color:'var(--text-muted)', fontStyle:'italic' },
  duaTr:        { fontSize:13, color:'var(--text)', lineHeight:1.6, borderLeft:'2px solid rgba(201,168,76,.3)', paddingLeft:10 },
}

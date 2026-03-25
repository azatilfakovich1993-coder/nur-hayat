import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'
import { fetchVerse } from '../utils/fetchVerse'
import { APP_VERSES } from '../data/verses'
import { HADITHS } from '../data/hadiths'
import { useNavigate, useLocation } from 'react-router-dom'

const PRAYER_NAMES = ['Fajr','Dhuhr','Asr','Maghrib','Isha']
const PRAYER_RU    = { Fajr:'Фаджр', Dhuhr:'Зухр', Asr:'Аср', Maghrib:'Магриб', Isha:'Иша' }

const MILESTONES = [
  { days: 3,   icon: '🌱', title: 'Начало пути',         text: 'Хорошее начало — привычка формируется!' },
  { days: 7,   icon: '⭐', title: 'Первая неделя',        text: 'Только ~18% мусульман совершают все 5 намазов каждый день. Ты в их числе.' },
  { days: 14,  icon: '🌙', title: 'Две недели',           text: 'Намаз становится частью тебя. Продолжай — это уже твоя природа.' },
  { days: 30,  icon: '🏅', title: 'Месяц без пропуска',   text: 'Ты среди ~5% самых постоянных. Аллах видит твои усилия.' },
  { days: 40,  icon: '💎', title: '40 дней',              text: 'Пророк ﷺ сказал: «Кто 40 дней молится в джамаате — тому гарантировано спасение от лицемерия».' },
  { days: 100, icon: '🔱', title: '100 дней',             text: '100 дней подряд — редкая преданность. Таких людей меньше 1%.' },
  { days: 365, icon: '👑', title: 'Год намазов',          text: 'Год без пропуска. Ты достиг того, о чём мечтают тысячи. Пусть Аллах примет.' },
]

function getMilestoneInfo(streak) {
  const passed = MILESTONES.filter(m => streak >= m.days)
  const current = passed[passed.length - 1] || null
  const next = MILESTONES.find(m => streak < m.days) || null
  const prevDays = current ? current.days : 0
  const nextDays = next ? next.days : null
  const progress = nextDays ? (streak - prevDays) / (nextDays - prevDays) : 1
  return { current, next, progress, nextDays }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Доброе утро'
  if (h >= 12 && h < 17) return 'Добрый день'
  if (h >= 17 && h < 21) return 'Добрый вечер'
  return 'Доброй ночи'
}

export default function HomePage() {
  const { user, profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [verse,       setVerse]       = useState(null)
  const [dayTheme,    setDayTheme]    = useState(APP_VERSES.daily[0])
  const [liked,       setLiked]       = useState(false)
  const [sparks,      setSparks]      = useState([])
  const [nurAnim,     setNurAnim]     = useState(false)
  const [donePrayers, setDonePrayers] = useState(new Set())
  const [weekDone,    setWeekDone]    = useState([])  // bool[7] Пн..Вс
  const [fireAnim,    setFireAnim]    = useState(false)
  const prevStreak = useRef(null)
  const hadith = HADITHS[new Date().getDate() % HADITHS.length]

  const name = profile?.name || user?.displayName || 'друг'
  const nur   = profile?.nur   || 10
  const tid   = profile?.translationId || 131

  // Индекс сегодняшнего дня: Пн=0 … Вс=6
  const todayIdx = (new Date().getDay() + 6) % 7

  // Серия: считаем подряд от сегодня назад
  const streak = (() => {
    let count = 0
    for (let i = todayIdx; i >= 0; i--) {
      if (weekDone[i]) count++
      else break
    }
    return count
  })()

  useEffect(() => {
    if (prevStreak.current !== null && streak > prevStreak.current) {
      setFireAnim(true)
      const t = setTimeout(() => setFireAnim(false), 1800 * 3 + 200)
      return () => clearTimeout(t)
    }
    prevStreak.current = streak
  }, [streak])

  useEffect(() => {
    const dayIdx = new Date().getDay()
    const theme  = APP_VERSES.daily[dayIdx % APP_VERSES.daily.length]
    setDayTheme(theme)
    fetchVerse(theme.key, tid).then(v => v && setVerse(v))
  }, [tid])

  function fetchPrayers() {
    if (!user) return
    const now = new Date()
    const dow = now.getDay()
    const diffToMon = dow === 0 ? -6 : 1 - dow
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMon)

    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
    const today = now.toISOString().split('T')[0]

    supabase
      .from('prayer_logs')
      .select('prayer, date')
      .eq('user_id', user.id)
      .in('date', dates)
      .then(({ data }) => {
        if (!data) return
        // Намазы сегодня
        setDonePrayers(new Set(
          data.filter(r => r.date === today).map(r => r.prayer)
        ))
        // Дни недели: день считается выполненным если хотя бы 1 намаз отмечен
        const byDate = {}
        data.forEach(r => { byDate[r.date] = (byDate[r.date] || 0) + 1 })
        setWeekDone(dates.map(d => (byDate[d] || 0) >= 5))
      })
  }

  // Перезагружаем каждый раз когда открывается /home (в т.ч. при переключении вкладок)
  useEffect(() => {
    fetchPrayers()
  }, [user, location.key])

  function handleLike() {
    if (liked) return
    setLiked(true)
    setNurAnim(true)

    // Спарклы
    const s = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      angle: (i / 16) * Math.PI * 2,
      dist:  30 + Math.random() * 28,
      color: i % 2 === 0 ? '#F0D080' : '#C9A84C'
    }))
    setSparks(s)
    setTimeout(() => setSparks([]), 800)
    setTimeout(() => setNurAnim(false), 1500)

    // Обновляем нур
    const newNur = nur + 10
    setProfile(p => ({ ...p, nur: newNur }))
    if (user) supabase.from('profiles').update({ nur: newNur }).eq('id', user.id)
  }

  return (
    <div style={s.page}>
      {/* Фоновые орбы */}
      <div style={{ ...s.orb, width: 300, height: 300, top: -80, right: -80 }} />
      <div style={{ ...s.orb, width: 200, height: 200, bottom: 120, left: -60, animationDelay: '5s', opacity: 0.4 }} />

      {/* ── Контент ── */}
      <div style={s.scroll} className="scroll-y">

        {/* ── Шапка ── */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.greeting}>{getGreeting()},</div>
            <div style={s.name}>{name} <span style={s.moon}>🌙</span></div>
          </div>
          <div style={s.headerRight}>
            {/* Нур */}
            <div style={s.nurBadge}>
              <span style={s.nurIcon}>◉</span>
              <span style={s.nurVal}>{nur}</span>
            </div>
            {/* Стрик */}
            <div style={s.streakBadge}>
              <span>🔥</span>
              <span style={s.streakVal}>{streak}</span>
            </div>
          </div>
        </div>

        {/* ── Аят дня ── */}
        <div style={s.sectionLabel}>Аят дня</div>

        <div style={{ ...s.ayatCard, borderColor: dayTheme.color + '40' }}>
          {/* Глоу */}
          <div style={{ ...s.ayatGlow, background: dayTheme.color + '18' }} />

          {/* Тема */}
          <div style={{ ...s.themeBadge, color: dayTheme.color, borderColor: dayTheme.color + '50' }}>
            <span style={s.themeAr}>{dayTheme.themeAr}</span>
            <span style={s.themeLat}>{dayTheme.theme}</span>
          </div>

          {verse ? (
            <>
              <div style={s.arabic} className="arabic gold-shimmer">{verse.arabic}</div>
              <div style={{ ...s.ayatDivider, background: `linear-gradient(90deg,transparent,${dayTheme.color}50,transparent)` }} />
              <div style={s.translation}>{verse.translation}</div>
              <div style={s.ref}>Коран, {verse.ref}</div>
            </>
          ) : (
            <div style={s.loading}>
              <div style={s.loadDot} /><div style={{ ...s.loadDot, animationDelay: '.2s' }} /><div style={{ ...s.loadDot, animationDelay: '.4s' }} />
            </div>
          )}

          {/* Лайк */}
          <div style={s.likeRow}>
            <div style={s.heartWrap}>
              {sparks.map(sp => (
                <div key={sp.id} style={{
                  position: 'absolute', width: 6, height: 6, borderRadius: '50%',
                  background: sp.color, boxShadow: `0 0 6px ${sp.color}`,
                  left: '50%', top: '50%',
                  '--tx': `${Math.cos(sp.angle) * sp.dist}px`,
                  '--ty': `${Math.sin(sp.angle) * sp.dist}px`,
                  animation: 'sparkle .65s ease-out forwards',
                  pointerEvents: 'none'
                }} />
              ))}

              <button style={{
                ...s.heartBtn,
                color:      liked ? '#e84393' : 'var(--text-dim)',
                borderColor: liked ? '#e8439350' : 'var(--border)',
                animation:  liked ? 'heartBeat .45s ease' : 'none'
              }} onClick={handleLike}>
                {liked ? '♥' : '♡'}
              </button>

              {nurAnim && <div style={s.nurFloat}>+10 нур ✨</div>}
            </div>

            <div style={s.likeHint}>
              {liked ? 'Аят сохранён' : 'Тронул — нажми'}
            </div>
          </div>
        </div>

        {/* ── Хадис дня ── */}
        <div style={s.sectionLabel}>Хадис дня</div>
        <div style={s.hadithCard}>
          <div style={s.hadithQuote}>"</div>
          <div style={s.hadithAr} className="gold-shimmer">{hadith.ar}</div>
          <div style={s.hadithDivider} />
          <div style={s.hadithText}>{hadith.text}</div>
          <div style={s.hadithSource}>— {hadith.source}</div>
        </div>

        {/* ── Намазы сегодня ── */}
        <div style={s.sectionLabel}>Намазы сегодня</div>
        <div style={s.prayersCard}>
          <div style={s.prayersRow}>
            {PRAYER_NAMES.map(p => {
              const done = donePrayers.has(p)
              return (
                <div key={p} style={s.prayerDot}>
                  <div style={{ ...s.prayerCircle, background: done ? 'var(--gold)' : 'transparent', borderColor: done ? 'var(--gold)' : 'rgba(255,255,255,.15)', boxShadow: done ? '0 0 10px rgba(201,168,76,.5)' : 'none' }}>
                    {done && <span style={{ fontSize:13 }}>✓</span>}
                  </div>
                  <div style={{ ...s.prayerLabel, color: done ? 'var(--gold)' : 'var(--text-dim)', fontWeight: done ? 600 : 400 }}>{PRAYER_RU[p]}</div>
                </div>
              )
            })}
          </div>
          <div style={s.prayersCount}>
            <span style={{ color:'var(--gold)', fontWeight:700 }}>{donePrayers.size}</span>
            <span style={{ color:'var(--text-muted)' }}> из 5 совершено</span>
          </div>
        </div>

        {/* ── Серия дней ── */}
        {(() => {
          const { current, next, progress, nextDays } = getMilestoneInfo(streak)
          return (
            <div style={s.streakCard}>
              {/* Верх: огонь + число */}
              <div style={s.streakTop}>
                <div style={s.streakFire}>
                  <span style={fireAnim ? s.streakFireAnim : s.streakFireIcon}>🔥</span>
                  <span style={s.streakNum}>{streak}</span>
                  <span style={s.streakDaysLabel}>дней подряд</span>
                </div>
                {current && (
                  <div style={s.milestoneBadge}>
                    <span style={{ fontSize: 18 }}>{current.icon}</span>
                    <span style={s.milestoneBadgeTitle}>{current.title}</span>
                  </div>
                )}
              </div>

              {/* Мотивационная фраза */}
              {current && (
                <div style={s.streakMotiv}>{current.text}</div>
              )}
              {!current && streak === 0 && (
                <div style={s.streakMotiv}>Соверши первый намаз сегодня — и серия начнётся 🌱</div>
              )}
              {!current && streak > 0 && (
                <div style={s.streakMotiv}>Продолжай — до первой вехи осталось {3 - streak} дн.</div>
              )}

              {/* Прогресс до следующей вехи */}
              {next && (
                <div style={s.streakProgress}>
                  <div style={s.streakProgressBar}>
                    <div style={{ ...s.streakProgressFill, width: `${Math.round(progress * 100)}%` }} />
                  </div>
                  <div style={s.streakProgressLabel}>
                    До «{next.title}» — ещё <span style={{ color:'var(--gold)', fontWeight:700 }}>{nextDays - streak}</span> дн.
                  </div>
                </div>
              )}
              {!next && (
                <div style={{ ...s.streakMotiv, color:'var(--gold)', fontWeight:600, textAlign:'center' }}>
                  👑 Высшая веха достигнута. Да примет Аллах твои намазы!
                </div>
              )}
            </div>
          )
        })()}

        <div style={{ height: 90 }} />
      </div>


      <style>{`
        @keyframes orbFloat {
          0%,100% { transform:translate(0,0); }
          50% { transform:translate(8px,-12px); }
        }
        @keyframes sparkle {
          0%   { transform:translate(-50%,-50%) translate(0,0) scale(1); opacity:1; }
          100% { transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0); opacity:0; }
        }
        @keyframes heartBeat {
          0%  { transform:scale(1); }
          30% { transform:scale(1.45); }
          60% { transform:scale(.88); }
          100%{ transform:scale(1); }
        }
        @keyframes floatUp {
          0%   { opacity:1; transform:translateX(-50%) translateY(0); }
          100% { opacity:0; transform:translateX(-50%) translateY(-56px); }
        }
        @keyframes dotPulse {
          0%,100%{ opacity:.3; transform:scale(.7); }
          50%    { opacity:1;  transform:scale(1); }
        }
        @keyframes fireDance {
          0%   { transform: scale(1)    rotate(-3deg); filter: drop-shadow(0 0 6px rgba(255,140,0,.7)); }
          25%  { transform: scale(1.08) rotate(2deg);  filter: drop-shadow(0 0 12px rgba(255,80,0,.9)); }
          50%  { transform: scale(1.04) rotate(-2deg); filter: drop-shadow(0 0 16px rgba(255,160,0,1)); }
          75%  { transform: scale(1.1)  rotate(3deg);  filter: drop-shadow(0 0 10px rgba(255,60,0,.8)); }
          100% { transform: scale(1)    rotate(-3deg); filter: drop-shadow(0 0 6px rgba(255,140,0,.7)); }
        }
      `}</style>
    </div>
  )
}


const s = {
  page: {
    height:'100%', background:'var(--bg-deep)',
    display:'flex', flexDirection:'column',
    position:'relative', overflow:'hidden'
  },
  orb: {
    position:'absolute', borderRadius:'50%',
    background:'radial-gradient(circle, rgba(201,168,76,.09) 0%, transparent 70%)',
    filter:'blur(50px)', pointerEvents:'none',
    animation:'orbFloat 10s ease-in-out infinite'
  },

  scroll: { flex:1, overflowY:'auto', overflowX:'hidden', padding:'0 16px' },

  // Header
  header: {
    display:'flex', alignItems:'flex-start', justifyContent:'space-between',
    paddingTop: 'calc(var(--safe-top) + 18px)', paddingBottom:4
  },
  headerLeft: { display:'flex', flexDirection:'column', gap:2 },
  greeting: { fontSize:13, color:'var(--text-muted)' },
  name: { fontSize:22, fontWeight:700, color:'var(--text)' },
  moon: { fontSize:18 },
  headerRight: { display:'flex', gap:8, alignItems:'center', paddingTop:4 },
  nurBadge: {
    display:'flex', alignItems:'center', gap:5,
    background:'var(--bg-card)', border:'1px solid rgba(201,168,76,.2)',
    borderRadius:20, padding:'6px 12px'
  },
  nurIcon: { color:'var(--gold)', fontSize:10 },
  nurVal:  { fontSize:14, fontWeight:700, color:'var(--gold)' },
  streakBadge: {
    display:'flex', alignItems:'center', gap:4,
    background:'var(--bg-card)', border:'1px solid rgba(255,160,0,.2)',
    borderRadius:20, padding:'6px 10px'
  },
  streakVal: { fontSize:14, fontWeight:700, color:'#ff9f43' },

  // Section label
  sectionLabel: {
    fontSize:11, fontWeight:600, color:'var(--text-muted)',
    textTransform:'uppercase', letterSpacing:'.1em',
    marginTop:22, marginBottom:10
  },

  // Ayat card
  ayatCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid', padding:22,
    display:'flex', flexDirection:'column', gap:14,
    position:'relative', overflow:'hidden',
    boxShadow:'0 8px 40px rgba(0,0,0,.3)'
  },
  ayatGlow: {
    position:'absolute', top:-40, right:-40,
    width:180, height:180, borderRadius:'50%',
    filter:'blur(40px)', pointerEvents:'none'
  },
  themeBadge: {
    display:'flex', alignItems:'center', gap:7,
    border:'1px solid', borderRadius:20,
    padding:'4px 12px', alignSelf:'flex-start'
  },
  themeAr:  { fontFamily:"'Amiri',serif", fontSize:15 },
  themeLat: { fontSize:12, fontWeight:500, letterSpacing:'.04em' },
  arabic: {
    fontFamily:"'Scheherazade New',serif",
    fontSize:22, lineHeight:1.9,
    color:'var(--gold-light)', textAlign:'center', direction:'rtl'
  },
  ayatDivider: { height:1, borderRadius:1 },
  translation: { fontSize:14, color:'var(--text)', lineHeight:1.75, textAlign:'center' },
  ref:         { fontSize:11, color:'var(--text-muted)', textAlign:'center' },

  loading: { display:'flex', gap:8, justifyContent:'center', padding:'30px 0' },
  loadDot: {
    width:8, height:8, borderRadius:'50%', background:'var(--gold-dim)',
    animation:'dotPulse 1.2s ease-in-out infinite'
  },

  likeRow: { display:'flex', alignItems:'center', gap:14, paddingTop:4 },
  heartWrap: { position:'relative', width:44, height:44, flexShrink:0 },
  heartBtn: {
    width:44, height:44, borderRadius:'50%',
    background:'var(--bg-surface)', border:'1px solid',
    fontSize:22, cursor:'pointer', outline:'none',
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'color .25s, border-color .25s',
    position:'relative', zIndex:1
  },
  nurFloat: {
    position:'absolute', bottom:'100%', left:'50%',
    background:'linear-gradient(135deg,#C9A84C,#F0D080)',
    color:'#070710', fontWeight:700, fontSize:12,
    padding:'3px 10px', borderRadius:12, whiteSpace:'nowrap',
    animation:'floatUp 1.4s ease-out forwards',
    pointerEvents:'none', zIndex:2,
    boxShadow:'0 0 16px rgba(201,168,76,.5)'
  },
  likeHint: { fontSize:13, color:'var(--text-muted)' },

  // Streak
  streakCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)',
    padding:'18px 20px', marginTop:10,
    display:'flex', flexDirection:'column', gap:14
  },
  streakTop: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  streakFire: { display:'flex', alignItems:'center', gap:8 },
  streakFireIcon: { fontSize:36, display:'inline-block', transformOrigin:'bottom center' },
  streakFireAnim: { fontSize:36, display:'inline-block', transformOrigin:'bottom center', animation:'fireDance 1.8s ease-in-out 3' },
  streakNum: { fontSize:42, fontWeight:800, color:'#ff9f43', lineHeight:1, fontFamily:'var(--font-ui)' },
  streakDaysLabel: { fontSize:12, color:'var(--text-muted)', alignSelf:'flex-end', paddingBottom:4 },
  milestoneBadge: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
    background:'rgba(201,168,76,.08)', border:'1px solid rgba(201,168,76,.2)',
    borderRadius:12, padding:'8px 12px'
  },
  milestoneBadgeTitle: { fontSize:11, fontWeight:600, color:'var(--gold)', textAlign:'center' },
  streakMotiv: { fontSize:13, color:'var(--text-muted)', lineHeight:1.6 },
  streakProgress: { display:'flex', flexDirection:'column', gap:6 },
  streakProgressBar: {
    height:6, borderRadius:3,
    background:'rgba(255,255,255,.08)', overflow:'hidden'
  },
  streakProgressFill: {
    height:'100%', borderRadius:3,
    background:'linear-gradient(90deg,#ff9f43,#C9A84C)',
    transition:'width .4s ease'
  },
  streakProgressLabel: { fontSize:12, color:'var(--text-muted)' },

  // Prayers today
  prayersCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)', padding:'16px 20px',
    display:'flex', flexDirection:'column', gap:12
  },
  prayersRow: { display:'flex', justifyContent:'space-between' },
  prayerDot:  { display:'flex', flexDirection:'column', alignItems:'center', gap:6 },
  prayerCircle: {
    width:38, height:38, borderRadius:'50%',
    border:'1.5px solid', display:'flex', alignItems:'center', justifyContent:'center',
    color:'#070710', transition:'all .3s ease'
  },
  prayerLabel: { fontSize:10, transition:'color .3s' },
  prayersCount: { textAlign:'center', fontSize:13 },

  // Hadith
  hadithCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)', padding:'20px',
    display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden'
  },
  hadithQuote: {
    position:'absolute', top:-10, left:14,
    fontSize:80, color:'rgba(201,168,76,.08)',
    fontFamily:'Georgia,serif', lineHeight:1, pointerEvents:'none'
  },
  hadithAr: {
    fontFamily:"'Scheherazade New',serif",
    fontSize:18, lineHeight:1.8, color:'var(--gold-light)',
    textAlign:'center', direction:'rtl'
  },
  hadithDivider: { height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent)' },
  hadithText:   { fontSize:14, color:'var(--text)', lineHeight:1.75, textAlign:'center', fontStyle:'italic' },
  hadithSource: { fontSize:11, color:'var(--text-muted)', textAlign:'center' },

  // Bottom nav
  bottomNav: {
    display:'flex', background:'var(--bg-surface)',
    borderTop:'1px solid var(--border)',
    paddingBottom:'calc(var(--safe-bottom) + 4px)',
    flexShrink:0, zIndex:10
  },
  navBtn: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center',
    gap:3, padding:'10px 4px 6px',
    background:'none', border:'none', cursor:'pointer',
    position:'relative', outline:'none', fontFamily:'var(--font-ui)'
  },
  navDot: {
    position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)',
    width:4, height:4, borderRadius:'50%',
    background:'var(--gold)', boxShadow:'0 0 6px rgba(201,168,76,.7)'
  }
}

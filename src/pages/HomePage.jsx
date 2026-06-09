import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'
import { fetchVerse } from '../utils/fetchVerse'
import { APP_VERSES } from '../data/verses'
import { HADITHS } from '../data/hadiths'
import { useNavigate, useLocation } from 'react-router-dom'
import { addNur, addNurIfLevel, claimDailyLogin } from '../utils/nur'
import Adhkar from '../components/Adhkar'
import BeginnerPath, { BeginnerPathWidget, ProgressWidget, MuslimPath, MuslimPathWidget } from '../components/BeginnerPath'

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
  if (h >= 5  && h < 12) return { text: 'Доброе утро',  icon: '☀️' }
  if (h >= 12 && h < 17) return { text: 'Добрый день',  icon: '🌤️' }
  if (h >= 17 && h < 21) return { text: 'Добрый вечер', icon: '🌆' }
  return { text: 'Доброй ночи', icon: '🌙' }
}

export default function HomePage() {
  const { user, profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [verse,       setVerse]       = useState(null)
  const [dayTheme,    setDayTheme]    = useState(APP_VERSES.daily[0])
  const [liked,       setLiked]       = useState(() => {
    const dayIdx = new Date().getDay()
    const key = APP_VERSES.daily[dayIdx % APP_VERSES.daily.length].key
    try { return JSON.parse(localStorage.getItem('liked_verse_keys') || '[]').includes(key) }
    catch { return false }
  })
  const [sparks,      setSparks]      = useState([])
  const [nurAnim,     setNurAnim]     = useState(false)
  const [donePrayers, setDonePrayers] = useState(new Set())
  const [weekDone,    setWeekDone]    = useState([])  // bool[7] Пн..Вс текущей недели
  const [streak,      setStreak]      = useState(0)
  const [weekTotal,   setWeekTotal]   = useState(0)   // намазов за текущую неделю
  const [fireAnim,    setFireAnim]    = useState(false)
  const [showAdhkar,      setShowAdhkar]      = useState(false)
  const [showPath,        setShowPath]        = useState(false)
  const [showMuslimPath,  setShowMuslimPath]  = useState(false)
  const [hadithNurAnim,   setHadithNurAnim]   = useState(false)
  const [hadithLiked,     setHadithLiked]     = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('liked_hadiths') || '[]')
      return saved.some(h => h.ar === HADITHS[new Date().getDate() % HADITHS.length].ar)
    } catch { return false }
  })
  const [surahProgress, setSurahProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('surah_progress') || '{}') }
    catch { return {} }
  })
  const prevStreak = useRef(null)
  const dayCount = Math.floor(Date.now() / 86400000)
  const hadith = HADITHS[dayCount % HADITHS.length]

  const name = profile?.name || user?.displayName || 'друг'
  const nur   = profile?.nur   || 10
  const tid   = profile?.translationId || 131

  // Индекс сегодняшнего дня: Пн=0 … Вс=6
  const todayIdx = (new Date().getDay() + 6) % 7

  useEffect(() => {
    if (prevStreak.current !== null && streak > prevStreak.current) {
      setFireAnim(true)
      const t = setTimeout(() => setFireAnim(false), 1800 * 3 + 200)
      return () => clearTimeout(t)
    }
    prevStreak.current = streak
  }, [streak])

  useEffect(() => {
    const theme = APP_VERSES.daily[dayCount % APP_VERSES.daily.length]
    setDayTheme(theme)
    fetchVerse(theme.key, tid).then(v => {
      if (!v) return
      setVerse(v)
    })
  }, [tid])

  // Синхронизируем лайк когда загружается аят
  useEffect(() => {
    if (!verse) return
    try {
      const keys = JSON.parse(localStorage.getItem('liked_verse_keys') || '[]')
      setLiked(keys.includes(verse.ref))
    } catch {}
  }, [verse])

  function fetchPrayers() {
    if (!user) return
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Текущая неделя (Пн–Вс) для кружков
    const dow = now.getDay()
    const diffToMon = dow === 0 ? -6 : 1 - dow
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMon)
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })

    // Последние 60 дней для подсчёта стрика
    const since = new Date(now)
    since.setDate(now.getDate() - 60)
    const sinceStr = since.toISOString().split('T')[0]

    supabase
      .from('prayer_logs')
      .select('prayer, date')
      .eq('user_id', user.id)
      .gte('date', sinceStr)
      .then(({ data }) => {
        if (!data) return

        // byDate: дата -> кол-во намазов
        const byDate = {}
        data.forEach(r => { byDate[r.date] = (byDate[r.date] || 0) + 1 })

        // Намазы сегодня
        setDonePrayers(new Set(
          data.filter(r => r.date === today).map(r => r.prayer)
        ))

        // Кружки текущей недели
        setWeekDone(weekDates.map(d => (byDate[d] || 0) >= 5))

        // Всего намазов за текущую неделю
        const wTotal = weekDates.reduce((sum, d) => sum + (byDate[d] || 0), 0)
        setWeekTotal(wTotal)

        // Стрик: считаем назад от вчера (сегодня ещё идёт)
        // Если сегодня уже ≥5 — включаем и сегодня
        let count = 0
        const todayFull = (byDate[today] || 0) >= 5
        if (todayFull) count = 1

        // Идём назад от вчера
        const cursor = new Date(now)
        cursor.setDate(cursor.getDate() - 1)
        for (let i = 0; i < 60; i++) {
          const dateStr = cursor.toISOString().split('T')[0]
          if ((byDate[dateStr] || 0) >= 5) {
            count++
            cursor.setDate(cursor.getDate() - 1)
          } else {
            break
          }
        }

        setStreak(count)

        // Сохраняем актуальный стрик в профиль (чтобы ProfilePage видел то же значение)
        if (count !== (profile?.streak || 0)) {
          supabase.from('profiles').update({ streak: count }).eq('id', user.id)
          setProfile(p => p ? { ...p, streak: count } : p)
        }
      })
  }

  // Перезагружаем каждый раз когда открывается /home (в т.ч. при переключении вкладок)
  useEffect(() => {
    fetchPrayers()
    try { setSurahProgress(JSON.parse(localStorage.getItem('surah_progress') || '{}')) }
    catch {}
  }, [user, location.key])

  // Ежедневный бонус за вход в приложение: +15 НУР раз в сутки
  useEffect(() => {
    if (user && profile) claimDailyLogin(user, profile, setProfile)
  }, [user?.id])

  // +100 НУР за стрик кратный 7 (все уровни)
  useEffect(() => {
    if (!user || !profile || streak < 7) return
    if (streak % 7 !== 0) return
    const key = `streak_nur_${streak}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      addNur(100, user, profile, setProfile)
    }
  }, [streak])

  function handleLike() {
    if (!verse) return
    const newLiked = !liked
    setLiked(newLiked)

    try {
      const keys = JSON.parse(localStorage.getItem('liked_verse_keys') || '[]')
      const data = JSON.parse(localStorage.getItem('liked_verses_data') || '{}')
      if (newLiked) {
        if (!keys.includes(verse.ref)) keys.push(verse.ref)
        data[verse.ref] = { arabic: verse.arabic, transliteration: verse.transliteration, translation: verse.translation }
      } else {
        const idx = keys.indexOf(verse.ref)
        if (idx !== -1) keys.splice(idx, 1)
      }
      localStorage.setItem('liked_verse_keys', JSON.stringify(keys))
      localStorage.setItem('liked_verses_data', JSON.stringify(data))
    } catch {}

    if (newLiked) {
      setNurAnim(true)
      const sp = Array.from({ length: 16 }, (_, i) => ({
        id: i, angle: (i / 16) * Math.PI * 2,
        dist: 30 + Math.random() * 28,
        color: i % 2 === 0 ? '#F0D080' : '#C9A84C'
      }))
      setSparks(sp)
      setTimeout(() => setSparks([]), 800)
      setTimeout(() => setNurAnim(false), 1500)
      addNur(10, user, profile, setProfile)
    } else {
      addNur(-10, user, profile, setProfile)
    }
  }

  function handleHadithLike() {
    const newLiked = !hadithLiked
    setHadithLiked(newLiked)
    try {
      const saved = JSON.parse(localStorage.getItem('liked_hadiths') || '[]')
      if (newLiked) {
        if (!saved.some(h => h.ar === hadith.ar))
          saved.push({ ...hadith, date: new Date().toISOString() })
        setHadithNurAnim(true)
        setTimeout(() => setHadithNurAnim(false), 1500)
        addNur(5, user, profile, setProfile)
      } else {
        const idx = saved.findIndex(h => h.ar === hadith.ar)
        if (idx !== -1) saved.splice(idx, 1)
        addNur(-5, user, profile, setProfile)
      }
      localStorage.setItem('liked_hadiths', JSON.stringify(saved))
    } catch {}
  }

  function getMotivMessage() {
    const h = new Date().getHours()
    const n = donePrayers.size
    const fullDaysThisWeek = weekDone.filter(Boolean).length

    if (n === 5)
      return { icon:'✨', color:'#52b788', text:'Машааллах! Все намазы сегодня выполнены. Аллах видит каждое твоё усилие.' }
    if (n === 4)
      return { icon:'💪', color:'var(--gold)', text:'Остался 1 намаз — не останавливайся. Ты почти у цели!' }
    if (n === 3)
      return { icon:'🤲', color:'var(--gold)', text:'Половина пройдена. Ещё 2 намаза — и день будет полным.' }
    if (n === 2)
      return { icon:'🌙', color:'#7B6BAE', text:'Не забывай — впереди ещё 3 намаза. Каждый шаг к Аллаху важен.' }
    if (n === 1)
      return { icon:'🌱', color:'#7B6BAE', text:'Хорошее начало! 4 намаза ждут тебя — продолжай.' }
    if (n === 0 && h >= 20)
      return { icon:'🌙', color:'#7B6BAE', text:'Ещё не поздно совершить Иша. Аллах принимает обращение в любое время.' }
    if (n === 0 && h >= 12)
      return { icon:'☀️', color:'#E8A030', text:'День идёт — не забывай о намазе. Каждый намаз освещает твой путь.' }
    if (n === 0)
      return { icon:'🌅', color:'#E8A030', text:'Начни день с Фаджра. Утренний намаз — лучшее начало дня.' }

    if (streak >= 7 && fullDaysThisWeek === todayIdx + 1)
      return { icon:'🔥', color:'#E05050', text:`${streak} дней подряд — Аллах любит постоянство. Ты на правильном пути!` }

    return { icon:'🤲', color:'var(--gold)', text:'Эта неделя — новый шанс. Каждый намаз приближает тебя к Аллаху.' }
  }

  const motiv = getMotivMessage()

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
            <div style={s.greeting}>{getGreeting().text},</div>
            <div style={s.name}>{name} <span style={s.moon}>{getGreeting().icon}</span></div>
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
              {verse.transliteration && (
                <div style={s.transliteration}>{verse.transliteration}</div>
              )}
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
          {hadith.translit && <div style={s.transliteration}>{hadith.translit}</div>}
          <div style={s.hadithDivider} />
          <div style={s.hadithText}>{hadith.text}</div>
          <div style={s.hadithSource}>— {hadith.source}</div>
          <div style={s.likeRow}>
            <div style={s.heartWrap}>
              <button style={{
                ...s.heartBtn,
                color:       hadithLiked ? '#e84393' : 'var(--text-dim)',
                borderColor: hadithLiked ? '#e8439350' : 'var(--border)',
                animation:   hadithLiked ? 'heartBeat .45s ease' : 'none'
              }} onClick={handleHadithLike}>
                {hadithLiked ? '♥' : '♡'}
              </button>
              {hadithNurAnim && <div style={s.nurFloat}>+5 нур ✨</div>}
            </div>
            <div style={s.likeHint}>{hadithLiked ? 'Хадис сохранён' : 'Сохранить'}</div>
          </div>
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

        {/* ── Мотивация ── */}
        <div style={{ ...s.motivCard, borderColor: motiv.color + '40', background: motiv.color + '0d' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{motiv.icon}</span>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{motiv.text}</div>
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

        {/* ── Знания (папка) ── */}
        <div style={s.sectionLabel}>Знания</div>
        <button style={s.learnFolder} onClick={() => navigate('/learn')}>
          <div style={s.learnFolderTop}>
            {['❓','🌙','🔤','📚','🕌','📿','🤲','✨','☪️','🌙','🎯','📖'].map((icon, i) => (
              <div key={i} style={s.learnFolderCell}>{icon}</div>
            ))}
          </div>
          <div style={s.learnFolderBottom}>
            <span style={s.learnFolderTitle}>Знания</span>
            <span style={s.learnFolderSub}>12 разделов · Азкары, Дуа, Пророки, Квиз и др.</span>
          </div>
          <span style={s.learnFolderArrow}>›</span>
        </button>

        {/* ── Путь / Прогресс (по уровню) ── */}
        {(() => {
          const level = profile?.level || 'seeker'
          if (level === 'seeker') return (
            <>
              <div style={s.sectionLabel}>Путь новичка</div>
              <BeginnerPathWidget onOpen={() => setShowPath(true)} />
            </>
          )
          return (
            <>
              <div style={s.sectionLabel}>{level === 'practicing' ? 'Твой ибадат' : 'Путь мусульманина'}</div>
              <MuslimPathWidget
                streak={streak}
                donePrayers={donePrayers}
                level={level}
                onOpen={() => setShowMuslimPath(true)}
              />
            </>
          )
        })()}

        <div style={{ height: 24 }} />
      </div>


      {showAdhkar && <Adhkar onClose={() => setShowAdhkar(false)} />}
      {showPath   && <BeginnerPath onClose={() => setShowPath(false)} />}
      {showMuslimPath && (
        <MuslimPath
          streak={streak}
          weekDone={weekDone}
          donePrayers={donePrayers}
          level={profile?.level}
          onClose={() => setShowMuslimPath(false)}
          onOpenPrayer={() => { setShowMuslimPath(false); navigate('/prayer') }}
          onOpenQuran={()  => { setShowMuslimPath(false); navigate('/quran') }}
          onContinueQuran={suraId => { setShowMuslimPath(false); navigate(`/quran/${suraId}`) }}
        />
      )}

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

  // Adhkar button
  adhkarBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    background:'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.05))',
    border:'1px solid rgba(201,168,76,.25)', borderRadius:18,
    padding:'14px 16px', cursor:'pointer', outline:'none',
    marginTop:16, textAlign:'left'
  },
  adhkarBtnIconWrap: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg,#C9A84C,#F0D080,#C9A84C)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 16px rgba(201,168,76,.45), 0 2px 8px rgba(0,0,0,.3)',
  },
  adhkarBtnIconEmoji: { fontSize:26 },
  adhkarBtnText: { flex:1, display:'flex', flexDirection:'column', gap:2 },
  adhkarBtnTitle: { fontSize:15, fontWeight:600, color:'var(--gold)' },
  adhkarBtnSub: { fontSize:12, color:'var(--text-muted)' },
  adhkarBtnArrow: { fontSize:22, color:'rgba(201,168,76,.5)', flexShrink:0 },

  // 99 Names button
  asmaBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    background:'linear-gradient(135deg,rgba(120,80,200,.12),rgba(80,120,220,.08))',
    border:'1px solid rgba(150,100,255,.25)', borderRadius:18,
    padding:'14px 16px', cursor:'pointer', outline:'none',
    marginTop:10, textAlign:'left'
  },
  asmaBtnIconWrap: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg,#7B5EA7,#4A90D9)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 16px rgba(123,94,167,.5), 0 2px 8px rgba(0,0,0,.3)',
  },
  asmaBtnIconEmoji: { fontSize:26 },
  asmaBtnTitle: {
    fontSize:15, fontWeight:700,
    fontFamily:"'Scheherazade New',serif", direction:'rtl'
  },

  // Dua button
  duaBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    background:'linear-gradient(135deg,rgba(46,160,120,.12),rgba(46,160,120,.06))',
    border:'1px solid rgba(46,160,120,.25)', borderRadius:18,
    padding:'14px 16px', cursor:'pointer', outline:'none',
    marginTop:10, textAlign:'left'
  },
  duaBtnIconWrap: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg,#2ea87a,#1a7a56)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 16px rgba(46,160,120,.45), 0 2px 8px rgba(0,0,0,.3)',
  },
  duaBtnIconEmoji: { fontSize:26 },
  duaBtnTitle: { fontSize:15, fontWeight:600, color:'#2ea87a' },

  // Islamic Calendar button
  calBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    background:'linear-gradient(135deg,rgba(74,100,180,.12),rgba(74,100,180,.06))',
    border:'1px solid rgba(74,100,180,.3)', borderRadius:18,
    padding:'14px 16px', cursor:'pointer', outline:'none',
    marginTop:10, textAlign:'left'
  },
  calBtnIconWrap: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg,#3a5bbf,#6a8fd8)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 16px rgba(74,100,180,.45), 0 2px 8px rgba(0,0,0,.3)',
  },
  calBtnIconEmoji: { fontSize:26 },
  calBtnTitle: { fontSize:15, fontWeight:600, color:'#6a8fd8' },

  // Prayer Guide button
  guideBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    background:'linear-gradient(135deg,rgba(180,80,80,.12),rgba(180,80,80,.06))',
    border:'1px solid rgba(180,80,80,.3)', borderRadius:18,
    padding:'14px 16px', cursor:'pointer', outline:'none',
    marginTop:10, textAlign:'left'
  },
  guideBtnIconWrap: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg,#a03030,#d06060)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 16px rgba(180,80,80,.5), 0 2px 8px rgba(0,0,0,.3)',
  },
  guideBtnIconEmoji: { fontSize:26 },
  guideBtnTitle: { fontSize:15, fontWeight:600, color:'#d07070' },

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
  transliteration: { fontSize:12, color:'var(--text-muted)', textAlign:'center', fontStyle:'italic', lineHeight:1.6, marginTop:6 },
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
  motivCard: {
    display:'flex', alignItems:'flex-start', gap:12,
    borderRadius:'var(--radius-lg)', border:'1px solid',
    padding:'12px 14px', marginTop:10,
  },
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

  // Знания — папка
  learnFolder: {
    width:'100%', display:'flex', alignItems:'center', gap:14,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:20, padding:'14px 16px',
    cursor:'pointer', outline:'none', textAlign:'left',
  },
  learnFolderTop: {
    flexShrink:0,
    width:88, height:88, borderRadius:20,
    background:'rgba(255,255,255,.05)',
    border:'1px solid rgba(255,255,255,.08)',
    display:'grid', gridTemplateColumns:'repeat(4,1fr)',
    gap:2, padding:6,
  },
  learnFolderCell: {
    borderRadius:5,
    background:'rgba(255,255,255,.07)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11,
  },
  learnFolderBottom: { flex:1, display:'flex', flexDirection:'column', gap:4 },
  learnFolderTitle: { fontSize:16, fontWeight:700, color:'var(--text)' },
  learnFolderSub: { fontSize:12, color:'var(--text-muted)', lineHeight:1.4 },
  learnFolderArrow: { fontSize:22, color:'rgba(255,255,255,.2)', flexShrink:0 },

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
  },

  // Прогресс сур
  surahProgressCard: {
    width:'100%', display:'flex', alignItems:'center', gap:14,
    background:'linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))',
    border:'1.5px solid rgba(201,168,76,.3)', borderRadius:20,
    padding:'14px 16px', cursor:'pointer', outline:'none', textAlign:'left',
  },
  surahProgressLeft: { flex:1, display:'flex', alignItems:'center', gap:12 },
  surahProgressIcon: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    background:'linear-gradient(135deg,#9a6a10,#c9a84c)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:24, boxShadow:'0 0 16px rgba(201,168,76,.4)',
  },
  surahProgressText: { flex:1, display:'flex', flexDirection:'column', gap:5 },
  surahProgressTitle: { fontSize:14, fontWeight:700, color:'var(--gold)' },
  surahProgressBar: {
    height:5, borderRadius:5,
    background:'rgba(255,255,255,.1)', overflow:'hidden',
  },
  surahProgressFill: {
    height:'100%', borderRadius:5,
    background:'linear-gradient(90deg,#9a6a10,#c9a84c)',
    transition:'width .4s',
  },
  surahProgressSub: { fontSize:11, color:'var(--text-muted)' },
  surahProgressArrow: { fontSize:22, color:'rgba(201,168,76,.4)', flexShrink:0 },
}

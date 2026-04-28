import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../App'
import { supabase } from '../supabase/client'
import { SURAS } from '../data/suras'
import { TRANSLITERATIONS, ARABIC_TEXTS, FALLBACK_TRANSLATIONS } from '../data/verses'
import { getNurLevel } from '../utils/nur'
import { LETTERS } from '../data/arabic-letters'
import { SURAHS } from '../data/surahs-learn'
import { NotesGoals } from '../components/NotesGoals'

const TOTAL_LETTERS = LETTERS.length      // 28
const TOTAL_SURAHS  = SURAHS.length       // 10

// Особый бейдж — для всех уровней, если шахада подтверждена
const BADGE_SHAHADA = {
  id: 'shahada', icon: '⭐', title: 'Свидетель',
  desc: 'Произнесена шахада — свидетельство веры',
  color: '#FFD700', special: true,
  check: () => !!localStorage.getItem('shahada_confirmed'),
}

// Значки только для уровня "seeker"
const BADGES_SEEKER = [
  { id: 'alpha_start', icon: '🔤', title: 'Первый шаг',      desc: 'Открыта первая буква алфавита',        color: '#c9a84c', check: ({ listenedCount }) => listenedCount >= 1 },
  { id: 'alpha_half',  icon: '📖', title: 'Полпути',          desc: 'Изучено половину алфавита',             color: '#c9a84c', check: ({ listenedCount }) => listenedCount >= Math.ceil(TOTAL_LETTERS / 2) },
  { id: 'alpha_done',  icon: '🔡', title: 'Алфавит пройден',  desc: 'Все 28 букв изучены',                  color: '#c9a84c', check: ({ listenedCount }) => listenedCount >= TOTAL_LETTERS },
  { id: 'surah_first', icon: '🌱', title: 'Первая сура',      desc: 'Выучена первая сура',                  color: '#52b788', check: ({ learnedSurahs }) => learnedSurahs >= 1 },
  { id: 'surah_three', icon: '⭐', title: 'Три суры',          desc: 'Выучено 3 суры',                      color: '#52b788', check: ({ learnedSurahs }) => learnedSurahs >= 3 },
  { id: 'surah_prayer',icon: '🤲', title: 'Намаз освоен',     desc: 'Выучены Фатиха, Аттахият и Салавата',  color: '#52b788', check: ({ surahProgress }) => !!(surahProgress['fatiha'] && surahProgress['attahiyyat'] && surahProgress['salawat']) },
  { id: 'surah_all',   icon: '🏆', title: 'Все суры',          desc: `Пройдены все ${TOTAL_SURAHS} текстов`, color: '#52b788', check: ({ learnedSurahs }) => learnedSurahs >= TOTAL_SURAHS },
  { id: 'streak_3',    icon: '🔥', title: '3 дня намаза',     desc: '3 дня подряд',                         color: '#ff9f43', check: ({ streak }) => streak >= 3 },
  { id: 'streak_7',    icon: '🔥', title: '7 дней намаза',    desc: 'Неделя без пропуска',                  color: '#ff9f43', check: ({ streak }) => streak >= 7 },
  { id: 'streak_30',   icon: '💎', title: 'Месяц намаза',     desc: '30 дней подряд',                       color: '#e84393', check: ({ streak }) => streak >= 30 },
]

// Значки для уровней "growing" и "practicing"
const BADGES_DEF = [
  { id: 'surah_first', icon: '🌱', title: 'Первая сура',      desc: 'Выучена первая сура',                  color: '#52b788', check: ({ learnedSurahs }) => learnedSurahs >= 1 },
  { id: 'surah_all',   icon: '🏆', title: 'Все суры',          desc: `Пройдены все ${TOTAL_SURAHS} текстов`, color: '#52b788', check: ({ learnedSurahs }) => learnedSurahs >= TOTAL_SURAHS },
  { id: 'quran_10',    icon: '📖', title: '10 сур прочитано', desc: 'Открыто 10 сур Корана',                color: '#4A90D9', check: ({ readSurahs }) => readSurahs >= 10 },
  { id: 'quran_30',    icon: '📗', title: '30 сур прочитано', desc: 'Открыто 30 сур Корана',                color: '#4A90D9', check: ({ readSurahs }) => readSurahs >= 30 },
  { id: 'quran_114',   icon: '🕌', title: 'Весь Коран',        desc: 'Открыты все 114 сур',                  color: '#4A90D9', check: ({ readSurahs }) => readSurahs >= 114 },
  { id: 'streak_3',    icon: '🔥', title: '3 дня намаза',     desc: '3 дня подряд',                         color: '#ff9f43', check: ({ streak }) => streak >= 3 },
  { id: 'streak_7',    icon: '🔥', title: '7 дней намаза',    desc: 'Неделя без пропуска',                  color: '#ff9f43', check: ({ streak }) => streak >= 7 },
  { id: 'streak_30',   icon: '💎', title: 'Месяц намаза',     desc: '30 дней подряд',                       color: '#e84393', check: ({ streak }) => streak >= 30 },
]

function getBadgeStats(streak) {
  let listenedCount = 0, surahProgress = {}, readSurahs = 0
  try {
    const al = JSON.parse(localStorage.getItem('alphabet_listened') || '[]')
    listenedCount = al.length
  } catch {}
  try {
    surahProgress = JSON.parse(localStorage.getItem('surah_progress') || '{}')
  } catch {}
  try {
    readSurahs = JSON.parse(localStorage.getItem('read_surahs') || '[]').length
  } catch {}
  const learnedSurahs = Object.keys(surahProgress).length
  return { listenedCount, surahProgress, learnedSurahs, readSurahs, streak }
}

const LEVELS = {
  seeker:     { emoji: '🌱', label: 'Только начинаю',     color: '#2D6A4F' },
  growing:    { emoji: '🌿', label: 'Мусульманин, расту', color: '#40916C' },
  practicing: { emoji: '🌳', label: 'Соблюдаю, ищу общину', color: '#52B788' },
}

const LEVEL_DESCS = {
  seeker:     'Интересуюсь исламом или сделал шахаду совсем недавно',
  growing:    'Учусь молиться, читаю Коран, стараюсь соблюдать',
  practicing: 'Регулярно молюсь, соблюдаю пост, ищу единомышленников',
}


export default function ProfilePage() {
  const navigate                = useNavigate()
  const location                = useLocation()
  const { user, profile, setProfile, logout } = useAuth()
  const { theme, setTheme, fontSize, setFontSize } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPrivacy,  setShowPrivacy]  = useState(false)
  const [showTerms,    setShowTerms]    = useState(false)
  const [showContact,  setShowContact]  = useState(false)

  // Настройки уведомлений
  const [notifPrayer,  setNotifPrayer]  = useState(() => localStorage.getItem('notif_prayer') !== 'false')
  const [notifMorning, setNotifMorning] = useState(() => localStorage.getItem('notif_morning') || '')
  const [notifEvening, setNotifEvening] = useState(() => localStorage.getItem('notif_evening') || '')

  async function requestNotifPermission() {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const res = await Notification.requestPermission()
    return res === 'granted'
  }

  async function saveNotifSettings(patch) {
    if (!user) return
    await supabase.from('prayer_schedules').upsert(
      { user_id: user.id, ...patch },
      { onConflict: 'user_id' }
    )
  }

  const [testPushStatus, setTestPushStatus] = useState('')
  async function sendTestPush() {
    if (!user) return
    setTestPushStatus('⏳ Отправляю...')
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
          recipient_id: user.id,
          title: '✅ Тест уведомления',
          body: 'Nur Hayat: push-уведомления работают!',
          url: '/profile',
          tag: 'test-push',
        }
      })
      if (error) {
        setTestPushStatus(`❌ Ошибка: ${error.message}`)
      } else if (data?.sent > 0) {
        setTestPushStatus(`✅ Отправлено (${data.sent} токен)`)
      } else {
        setTestPushStatus('⚠️ Токен не найден — откройте приложение заново')
      }
    } catch (e) {
      setTestPushStatus(`❌ ${e.message}`)
    }
    setTimeout(() => setTestPushStatus(''), 5000)
  }

  async function togglePrayerNotif() {
    const ok = await requestNotifPermission()
    if (!ok) return
    const next = !notifPrayer
    setNotifPrayer(next)
    localStorage.setItem('notif_prayer', String(next))
    saveNotifSettings({ prayer_notif_enabled: next })
  }

  function saveTime(key, val, setter, dbField) {
    setter(val)
    localStorage.setItem(key, val)
    if (val) saveNotifSettings({ [dbField]: val, utc_offset: -new Date().getTimezoneOffset() })
  }

  // ── Фото профиля ──
  const [avatarUrl,     setAvatarUrl]     = useState(profile?.avatar_url || null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarInputRef = useRef()

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
  }, [profile?.avatar_url])

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    if (!file.type.startsWith('image/')) return
    setAvatarLoading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      await supabase.storage.from('avatars').remove([path])
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = publicUrl + '?t=' + Date.now()
      setAvatarUrl(url)
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setProfile(p => ({ ...p, avatar_url: url }))
    } catch (err) {
      console.error('Avatar upload error:', err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  async function deleteAvatar() {
    if (!user || !avatarUrl) return
    setAvatarLoading(true)
    try {
      // Удаляем все возможные расширения
      await supabase.storage.from('avatars').remove([
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.png`,
        `${user.id}/avatar.webp`,
        `${user.id}/avatar.gif`,
      ])
      setAvatarUrl(null)
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      setProfile(p => ({ ...p, avatar_url: null }))
    } catch (err) {
      console.error('Avatar delete error:', err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const [editName,      setEditName]      = useState(false)
  const [nameVal,       setNameVal]       = useState(profile?.name || '')
  const [showLevel,     setShowLevel]     = useState(false)
  const [showGender,    setShowGender]    = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showNotes,     setShowNotes]     = useState(false)
  const [showBadges,    setShowBadges]    = useState(false)

  useEffect(() => {
    if (location.state?.openFavorites) {
      setShowFavorites(true)
      // Чистим state чтобы повторный рендер не открывал снова
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const [likedHadiths, setLikedHadiths] = useState(() => {
    try { return JSON.parse(localStorage.getItem('liked_hadiths') || '[]') }
    catch { return [] }
  })

  const [likedVerseKeys, setLikedVerseKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('liked_verse_keys') || '[]') }
    catch { return [] }
  })

  const [likedVersesData, setLikedVersesData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('liked_verses_data') || '{}') }
    catch { return {} }
  })

  function removeVerse(key) {
    const newKeys = likedVerseKeys.filter(k => k !== key)
    setLikedVerseKeys(newKeys)
    localStorage.setItem('liked_verse_keys', JSON.stringify(newKeys))
  }

  function removeHadith(ar) {
    const newList = likedHadiths.filter(h => h.ar !== ar)
    setLikedHadiths(newList)
    localStorage.setItem('liked_hadiths', JSON.stringify(newList))
  }

  const name     = profile?.name || user?.displayName || 'Друг'
  const nur      = profile?.nur    || 10
  const streak   = profile?.streak || 1
  const level    = LEVELS[profile?.level] || LEVELS.seeker
  const liked    = likedVerseKeys

  const isSeeker = (profile?.level || 'seeker') === 'seeker'

  const badges = useMemo(() => {
    const stats = getBadgeStats(streak)
    // Объединяем все значки (без дублей по id), чтобы заработанные не исчезали при смене уровня
    const allDefs = [...BADGES_SEEKER]
    BADGES_DEF.forEach(b => {
      if (!allDefs.find(a => a.id === b.id)) allDefs.push(b)
    })
    const list = allDefs.map(b => ({ ...b, earned: b.check(stats) }))
    // Особый бейдж шахады — всегда первым если заработан
    const shahadaBadge = { ...BADGE_SHAHADA, earned: BADGE_SHAHADA.check() }
    return [shahadaBadge, ...list]
  }, [streak])

  const readSurahsCount = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('read_surahs') || '[]').length }
    catch { return 0 }
  }, [])

  async function saveName() {
    if (nameVal.trim().length < 2) return
    const name = nameVal.trim()
    setProfile(p => ({ ...p, name }))
    setEditName(false)
    if (user) await supabase.from('profiles').update({ name }).eq('id', user.id)
  }

  async function changeLevel(id) {
    setProfile(p => ({ ...p, level: id }))
    setShowLevel(false)
    if (user) await supabase.from('profiles').update({ level: id }).eq('id', user.id)
  }

  async function saveGender(g) {
    setProfile(p => ({ ...p, gender: g }))
    setShowGender(false)
    if (user) await supabase.from('profiles').update({ gender: g }).eq('id', user.id)
  }


  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  // Получаем название суры по ключу аята "2:153"
  function verseSuraName(key) {
    const id = Number(key.split(':')[0])
    return SURAS.find(s => s.id === id)?.ru || `Сура ${id}`
  }

  const FONT_SIZES = [
    { label: 'Аа', size: 20, name: 'Маленький' },
    { label: 'Аа', size: 24, name: 'Средний' },
    { label: 'Аа', size: 28, name: 'Крупный' },
    { label: 'Аа', size: 32, name: 'Очень\nкрупный' },
  ]

  return (
    <div style={s.page}>
      <div style={s.orb} />

      {/* ── Вкладки ── */}
      <div style={s.tabBar}>
        <button
          style={{ ...s.tabBtn, ...(activeTab === 'profile'  ? s.tabBtnActive : {}) }}
          onClick={() => setActiveTab('profile')}
        >Профиль</button>
        <button
          style={{ ...s.tabBtn, ...(activeTab === 'settings' ? s.tabBtnActive : {}) }}
          onClick={() => setActiveTab('settings')}
        >Настройки</button>
      </div>

      {/* ── Настройки ── */}
      {activeTab === 'settings' && (
        <div style={s.scroll} className="scroll-y">

          {/* Достижения — топ-3 заработанных */}
          {(() => {
            const earned = badges.filter(b => b.earned)
            const top3   = earned.slice(-3).reverse()
            if (!top3.length) return null
            return (
              <>
                <SectionLabel>Последние достижения</SectionLabel>
                <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
                  {top3.map(b => (
                    <div key={b.id} style={{ ...s.badgeItem, flex:1, borderColor: b.color + '60', background: b.special ? `linear-gradient(135deg,${b.color}22,${b.color}08)` : b.color + '12', boxShadow: b.special ? `0 0 16px ${b.color}30` : 'none' }}>
                      <div style={{ ...s.badgeIcon, fontSize: b.special ? 26 : 22 }}>{b.icon}</div>
                      <div style={{ ...s.badgeTitle, color: b.color }}>{b.title}</div>
                      <div style={s.badgeDesc}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}

          {/* Уведомления */}
          <SectionLabel>Уведомления</SectionLabel>
          <div style={s.notifRow}>
            <div style={s.notifLeft}>
              <span style={s.notifIcon}>🔔</span>
              <div>
                <div style={s.notifName}>Уведомления намазов</div>
                <div style={s.notifSub}>Напоминания до азана</div>
              </div>
            </div>
            <button style={{ ...s.toggle, background: notifPrayer ? 'var(--gold)' : 'var(--bg-card-hover)' }} onClick={togglePrayerNotif}>
              <div style={{ ...s.toggleThumb, transform: notifPrayer ? 'translateX(22px)' : 'translateX(0)' }} />
            </button>
          </div>
          <div style={s.notifRow}>
            <div style={s.notifLeft}>
              <span style={s.notifIcon}>🌅</span>
              <div>
                <div style={s.notifName}>Утренние азкары</div>
                <div style={s.notifSub}>Напоминание после Фаджра</div>
              </div>
            </div>
            <input type="time" value={notifMorning} style={s.timeInput} onChange={e => saveTime('notif_morning', e.target.value, setNotifMorning, 'morning_adhkar_time')} />
          </div>
          <div style={s.notifRow}>
            <div style={s.notifLeft}>
              <span style={s.notifIcon}>🌆</span>
              <div>
                <div style={s.notifName}>Вечерние азкары</div>
                <div style={s.notifSub}>Напоминание после Асра</div>
              </div>
            </div>
            <input type="time" value={notifEvening} style={s.timeInput} onChange={e => saveTime('notif_evening', e.target.value, setNotifEvening, 'evening_adhkar_time')} />
          </div>

          {/* Тема */}
          <SectionLabel>Тема оформления</SectionLabel>
          <div style={s.themeRow}>
            <div style={s.themeLabel}>
              <span style={s.themeIcon}>{theme === 'light' ? '☀️' : '🌙'}</span>
              <div>
                <div style={s.themeName}>{theme === 'light' ? 'Светлая тема' : 'Тёмная тема'}</div>
                <div style={s.themeSub}>Нажми чтобы переключить</div>
              </div>
            </div>
            <button style={{ ...s.themeToggle, background: theme === 'light' ? 'var(--gold)' : 'var(--bg-card-hover)' }} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <div style={{ ...s.themeThumb, transform: theme === 'light' ? 'translateX(22px)' : 'translateX(0)' }} />
            </button>
          </div>

          {/* Шрифт */}
          <SectionLabel>Размер шрифта Корана</SectionLabel>
          <div style={s.fontCard}>
            <div style={s.fontPreview}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <div style={s.fontBtns}>
              {FONT_SIZES.map(f => (
                <button key={f.size} style={{ ...s.fontBtn, ...(fontSize === f.size ? s.fontBtnActive : {}) }} onClick={() => setFontSize(f.size)}>
                  <span style={{ fontSize: f.size * 0.6 }}>ع</span>
                  <span style={s.fontBtnLabel}>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 40 }} />
        </div>
      )}

      {activeTab === 'profile' && <div style={s.scroll} className="scroll-y">

        {/* ── 1. ЛИЧНОЕ: Аватар, имя, email, уровень ── */}
        <div style={s.hero}>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <button style={s.avatarWrap} onClick={() => avatarInputRef.current?.click()} title="Изменить фото">
              <div style={s.avatar}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                  : <span style={s.avatarLetter}>{name.charAt(0).toUpperCase()}</span>
                }
                <div style={s.avatarRing} />
              </div>
              <div style={s.avatarCamOverlay}>{avatarLoading ? '⏳' : '📷'}</div>
            </button>
            {avatarUrl && !avatarLoading && (
              <button onClick={deleteAvatar} style={{ background:'none', border:'none', fontSize:11, color:'var(--text-muted)', cursor:'pointer', padding:'2px 8px', textDecoration:'underline' }}>
                Удалить фото
              </button>
            )}
          </div>

          {editName ? (
            <div style={s.nameEdit}>
              <input style={s.nameInput} value={nameVal} onChange={e => setNameVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
              <div style={s.nameEditBtns}>
                <button style={s.saveBtnSm} onClick={saveName}>Сохранить</button>
                <button style={s.cancelBtnSm} onClick={() => { setEditName(false); setNameVal(name) }}>Отмена</button>
              </div>
            </div>
          ) : (
            <div style={s.nameRow}>
              <div style={s.heroName}>{name}</div>
              <button style={s.editIcon} onClick={() => { setEditName(true); setNameVal(name) }}>✎</button>
            </div>
          )}

          <div style={s.heroEmail}>{profile?.email || user?.email || ''}</div>

          <button style={{ ...s.levelBadge, borderColor: level.color + '60', color: level.color, background: level.color + '18' }} onClick={() => setShowLevel(v => !v)}>
            <span>{level.emoji}</span>
            <span style={s.levelLabel}>{level.label}</span>
            <span style={{ fontSize: 10, opacity: .6, marginLeft: 4 }}>{showLevel ? '▲' : '▼'}</span>
          </button>
          {showLevel && (
            <div style={s.levelPicker}>
              <div style={s.levelPickerTitle}>Выбери свой уровень</div>
              {Object.entries(LEVELS).map(([id, lv]) => {
                const active = (profile?.level || 'seeker') === id
                return (
                  <button key={id} style={{ ...s.levelOption, borderColor: active ? lv.color + '80' : 'var(--border)', background: active ? lv.color + '15' : 'var(--bg-card)' }} onClick={() => changeLevel(id)}>
                    <span style={s.levelOptEmoji}>{lv.emoji}</span>
                    <div style={s.levelOptText}>
                      <div style={{ ...s.levelOptLabel, color: active ? lv.color : 'var(--text)' }}>{lv.label}</div>
                      <div style={s.levelOptDesc}>{LEVEL_DESCS[id]}</div>
                    </div>
                    {active && <span style={{ color: lv.color, fontSize: 14, flexShrink: 0 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── 2. НУР И СТАТИСТИКА ── */}
        <SectionLabel>НУР и статистика</SectionLabel>
        <div style={s.statsCard}>
          <NurStat nur={nur} />
          <div style={s.statDiv} />
          <Stat icon="🔥" value={streak} label="Дней подряд" color="#ff9f43" />
          <div style={s.statDiv} />
          <Stat icon="❤️" value={liked.length + likedHadiths.length} label="Сохранено" color="#e84393" />
          <div style={s.statDiv} />
          <Stat icon="📖" value={`${readSurahsCount}/114`} label="Прочитано" color="#4A90D9" />
        </div>

        {/* ── 4. ЛИЧНОЕ ── */}
        <SectionLabel>Личное</SectionLabel>
        <button style={s.favBtn} onClick={() => setShowFavorites(true)}>
          <span style={s.favIcon}>❤️</span>
          <div style={s.favText}>
            <div style={s.favTitle}>Понравившиеся</div>
            <div style={s.favSub}>
              {liked.length + likedHadiths.length === 0
                ? 'Пока ничего не сохранено'
                : `${liked.length} аят${liked.length !== 1 ? 'а' : ''} · ${likedHadiths.length} хадис${likedHadiths.length !== 1 ? 'а' : ''}`}
            </div>
          </div>
          <span style={s.favArrow}>›</span>
        </button>
        <button style={{ ...s.favBtn, marginTop: 6 }} onClick={() => setShowNotes(true)}>
          <span style={s.favIcon}>📓</span>
          <div style={s.favText}>
            <div style={s.favTitle}>Заметки и цели</div>
            <div style={s.favSub}>Личные записи и духовные цели</div>
          </div>
          <span style={s.favArrow}>›</span>
        </button>
        <button style={{ ...s.favBtn, marginTop: 6 }} onClick={() => setShowBadges(true)}>
          <span style={s.favIcon}>🏆</span>
          <div style={s.favText}>
            <div style={s.favTitle}>Достижения</div>
            <div style={s.favSub}>
              {badges.filter(b => b.earned).length === 0
                ? 'Пока нет достижений'
                : `${badges.filter(b => b.earned).length} из ${badges.length} получено`}
            </div>
          </div>
          <span style={s.favArrow}>›</span>
        </button>

        {/* ── 5. НАСТРОЙКИ АККАУНТА ── */}
        <SectionLabel>Настройки аккаунта</SectionLabel>
        <button style={s.langBtn} onClick={() => setShowGender(v => !v)}>
          <span style={s.langFlag}>{profile?.gender === 'male' ? '🧔' : profile?.gender === 'female' ? '👩' : '👤'}</span>
          <span style={s.langName}>{profile?.gender === 'male' ? 'Мужской' : profile?.gender === 'female' ? 'Женский' : 'Не указан'}</span>
          <span style={s.langArrow}>{showGender ? '▲' : '▼'}</span>
        </button>
        {showGender && (
          <div style={s.langDropdown}>
            {[
              { id: 'male',   icon: '🧔', label: 'Мужской',  sub: 'Можешь задавать вопросы мужчинам и отвечать в их разделе' },
              { id: 'female', icon: '👩', label: 'Женский',   sub: 'Можешь задавать вопросы женщинам и отвечать в их разделе' },
            ].map(g => (
              <button key={g.id} style={{ ...s.langOption, flexDirection:'column', alignItems:'flex-start', gap:2, background: profile?.gender === g.id ? 'rgba(201,168,76,.1)' : 'transparent', color: profile?.gender === g.id ? 'var(--gold)' : 'var(--text)' }} onClick={() => saveGender(g.id)}>
                <div style={{ display:'flex', alignItems:'center', gap:8, width:'100%' }}>
                  <span>{g.icon}</span><span>{g.label}</span>
                  {profile?.gender === g.id && <span style={{ marginLeft:'auto', color:'var(--gold)' }}>✓</span>}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', paddingLeft:24 }}>{g.sub}</div>
              </button>
            ))}
          </div>
        )}
        <button style={{ ...s.logoutBtn, marginTop: 8 }} onClick={handleLogout}>Выйти из аккаунта</button>

        {/* ── 6. О ПРИЛОЖЕНИИ ── */}
        <SectionLabel>О приложении</SectionLabel>
        <button style={s.aboutBtn} onClick={() => setShowPrivacy(true)}>
          <span style={s.aboutIcon}>🔒</span>
          <span style={s.aboutLabel}>Политика конфиденциальности</span>
          <span style={s.aboutArrow}>›</span>
        </button>
        <button style={s.aboutBtn} onClick={() => setShowTerms(true)}>
          <span style={s.aboutIcon}>📄</span>
          <span style={s.aboutLabel}>Пользовательское соглашение</span>
          <span style={s.aboutArrow}>›</span>
        </button>
        <button style={s.aboutBtn} onClick={() => setShowContact(true)}>
          <span style={s.aboutIcon}>✉️</span>
          <span style={s.aboutLabel}>Написать нам</span>
          <span style={s.aboutArrow}>›</span>
        </button>
        <div style={s.appInfo}>
          <div style={s.appName}>نور حياة · Нур Хаят</div>
          <div style={s.appVersion}>Светлая жизнь · v0.1.0</div>
        </div>

        <div style={{ height: 90 }} />
      </div>}

      {/* ── Заметки и цели ── */}
      {showNotes && (
        <NotesGoals user={user} onClose={() => setShowNotes(false)} />
      )}

      {showBadges && (
        <div style={s.modalOverlay} onClick={() => setShowBadges(false)}>
          <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>🏆 Достижения</div>
              <button style={s.modalClose} onClick={() => setShowBadges(false)}>✕</button>
            </div>
            <div style={{ overflowY:'auto', flex:1, padding:'0 16px 24px' }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, textAlign:'center' }}>
                {badges.filter(b => b.earned).length} из {badges.length} получено
              </div>
              <div style={s.badgesWrap}>
                {badges.map(b => (
                  <div key={b.id} style={{
                    ...s.badgeItem,
                    borderColor: b.earned ? b.color + '60' : 'var(--border)',
                    background:  b.earned && b.special ? `linear-gradient(135deg,${b.color}22,${b.color}08)` : b.earned ? b.color + '12' : 'var(--bg-card)',
                    opacity:     b.earned ? 1 : 0.35,
                    boxShadow:   b.earned && b.special ? `0 0 16px ${b.color}30` : 'none',
                  }}>
                    <div style={{ ...s.badgeIcon, filter: b.earned ? 'none' : 'grayscale(1)', fontSize: b.special ? 26 : 22 }}>{b.icon}</div>
                    <div style={{ ...s.badgeTitle, color: b.earned ? b.color : 'var(--text-muted)' }}>{b.title}</div>
                    <div style={s.badgeDesc}>{b.desc}</div>
                    {b.earned && b.special && <div style={{ fontSize:9, color:b.color, fontWeight:700, letterSpacing:'.06em', marginTop:2 }}>ОСОБЫЙ</div>}
                    {b.earned && !b.special && <div style={{ ...s.badgeCheck, color:b.color }}>✓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Форма обращения ── */}
      {showContact && <ContactScreen user={user} profile={profile} onClose={() => setShowContact(false)} />}

      {/* ── Политика конфиденциальности ── */}
      {showPrivacy && <LegalScreen title="Политика конфиденциальности" onClose={() => setShowPrivacy(false)}>
        <LegalSection title="1. Общие положения">
          Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и защиты персональных данных пользователей мобильного приложения «Нур Хаят» (далее — «Приложение»), разработанного и предоставляемого в соответствии с законодательством Российской Федерации, в том числе Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
        </LegalSection>
        <LegalSection title="2. Оператор персональных данных">
          Оператором персональных данных является команда разработчиков приложения «Нур Хаят». Контактный адрес: azatilfakovich1993@gmail.com
        </LegalSection>
        <LegalSection title="3. Какие данные мы собираем">
          {'— Адрес электронной почты (при регистрации)\n— Имя пользователя\n— Данные о местоположении (только для определения времени намаза и направления Киблы, не сохраняются на сервере)\n— Push-токен устройства (для отправки уведомлений)\n— Данные об активности в приложении (прочитанные суры, намазы, баллы НУР)'}
        </LegalSection>
        <LegalSection title="4. Цели обработки данных">
          {'— Предоставление функциональности приложения\n— Отправка напоминаний о намазах и азкарах\n— Персонализация контента\n— Улучшение качества сервиса'}
        </LegalSection>
        <LegalSection title="5. Хранение и защита данных">
          Данные хранятся на защищённых серверах Supabase (EU West). Мы применяем шифрование при передаче данных (HTTPS/TLS) и не передаём персональные данные третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством РФ.
        </LegalSection>
        <LegalSection title="6. Права пользователя">
          {'Пользователь вправе:\n— Запросить доступ к своим данным\n— Потребовать исправления или удаления данных\n— Отозвать согласие на обработку данных\n\nДля реализации прав обратитесь на: azatilfakovich1993@gmail.com'}
        </LegalSection>
        <LegalSection title="7. Push-уведомления">
          Приложение может направлять push-уведомления при наличии явного согласия пользователя. Пользователь вправе отозвать согласие в настройках профиля или в системных настройках устройства.
        </LegalSection>
        <LegalSection title="8. Изменения Политики">
          Мы оставляем за собой право изменять настоящую Политику. Актуальная версия доступна в приложении. Продолжение использования приложения после изменений означает согласие с новой редакцией.
        </LegalSection>
        <LegalSection title="9. Контакты">
          По вопросам обработки персональных данных: azatilfakovich1993@gmail.com
        </LegalSection>
      </LegalScreen>}

      {/* ── Пользовательское соглашение ── */}
      {showTerms && <LegalScreen title="Пользовательское соглашение" onClose={() => setShowTerms(false)}>
        <LegalSection title="1. Предмет соглашения">
          Настоящее Пользовательское соглашение регулирует использование приложения «Нур Хаят» — исламского помощника для изучения Корана, совершения намаза и духовного развития.
        </LegalSection>
        <LegalSection title="2. Принятие условий">
          Регистрируясь в приложении, вы подтверждаете, что ознакомились с настоящим Соглашением и Политикой конфиденциальности и согласны соблюдать их условия.
        </LegalSection>
        <LegalSection title="3. Условия использования">
          {'— Приложение предназначено для лиц старше 12 лет\n— Запрещается использование приложения в противоправных целях\n— Запрещается распространение контента приложения без разрешения\n— Пользователь несёт ответственность за сохранность данных своего аккаунта'}
        </LegalSection>
        <LegalSection title="4. Контент приложения">
          Тексты аятов Корана, хадисов и исламских молитв приведены в образовательных целях. Мы стремимся к достоверности источников, однако не несём ответственности за возможные неточности в переводах.
        </LegalSection>
        <LegalSection title="5. Система НУР (баллы)">
          Баллы НУР являются внутренней системой мотивации приложения, не имеют денежной ценности и не могут быть обменяны на реальные товары или услуги.
        </LegalSection>
        <LegalSection title="6. Уведомления">
          Приложение отправляет push-уведомления только с явного согласия пользователя. Уведомления можно отключить в настройках профиля.
        </LegalSection>
        <LegalSection title="7. Ограничение ответственности">
          Приложение предоставляется «как есть». Мы не гарантируем бесперебойную работу сервиса и не несём ответственности за убытки, возникшие вследствие использования или невозможности использования приложения.
        </LegalSection>
        <LegalSection title="8. Прекращение использования">
          Вы вправе удалить аккаунт в любое время, обратившись на azatilfakovich1993@gmail.com. После удаления все персональные данные будут уничтожены в течение 30 дней.
        </LegalSection>
        <LegalSection title="9. Применимое право">
          Настоящее Соглашение регулируется законодательством Российской Федерации.
        </LegalSection>
        <LegalSection title="10. Контакты">
          azatilfakovich1993@gmail.com
        </LegalSection>
      </LegalScreen>}

      {/* ── Экран понравившихся ── */}
      {showFavorites && (
        <FavoritesScreen
          likedVerseKeys={likedVerseKeys}
          likedHadiths={likedHadiths}
          likedVersesData={likedVersesData}
          verseSuraName={verseSuraName}
          onRemoveVerse={removeVerse}
          onRemoveHadith={removeHadith}
          onClose={() => setShowFavorites(false)}
          onOpenSura={id => { setShowFavorites(false); navigate(`/quran/${id}`, { state: { openFavorites: true } }) }}
        />
      )}
    </div>
  )
}

function FavoritesScreen({ likedVerseKeys, likedHadiths, likedVersesData, verseSuraName, onRemoveVerse, onRemoveHadith, onClose, onOpenSura }) {
  const [tab, setTab] = useState('verses')
  const total = likedVerseKeys.length + likedHadiths.length

  return (
    <div style={f.wrap}>
      <div style={f.head}>
        <button style={f.backBtn} onClick={onClose}>‹</button>
        <div style={f.headMid}>
          <div style={f.headTitle}>Понравившиеся</div>
          <div style={f.headSub}>{total} сохранено</div>
        </div>
      </div>

      {/* Табы */}
      <div style={f.tabs}>
        <button style={{ ...f.tab, borderBottomColor: tab === 'verses' ? 'var(--gold)' : 'transparent', color: tab === 'verses' ? 'var(--gold)' : 'var(--text-muted)' }}
          onClick={() => setTab('verses')}>
          Аяты ({likedVerseKeys.length})
        </button>
        <button style={{ ...f.tab, borderBottomColor: tab === 'hadiths' ? '#e84393' : 'transparent', color: tab === 'hadiths' ? '#e84393' : 'var(--text-muted)' }}
          onClick={() => setTab('hadiths')}>
          Хадисы ({likedHadiths.length})
        </button>
      </div>

      <div style={f.scroll} className="scroll-y">
        {tab === 'verses' && (
          likedVerseKeys.length === 0
            ? <div style={f.empty}>Нет сохранённых аятов{'\n'}Лайкай аят дня на главном экране ♡</div>
            : likedVerseKeys.map(key => {
                const data = likedVersesData?.[key]
                const arabic          = data?.arabic          || ARABIC_TEXTS[key]          || ''
                const transliteration = data?.transliteration || TRANSLITERATIONS[key]      || ''
                const translation     = data?.translation     || FALLBACK_TRANSLATIONS[key] || ''
                return (
                  <div key={key} style={f.hadithItem}>
                    <div style={f.hadithHeart}>♥</div>
                    <div style={f.itemBody}>
                      {arabic
                        ? <div style={f.hadithAr} className="arabic">{arabic}</div>
                        : null}
                      {transliteration
                        ? <div style={f.verseTranslit}>{transliteration}</div>
                        : null}
                      {translation
                        ? <div style={f.hadithText}>{translation}</div>
                        : null}
                      <div style={f.hadithSource}>
                        {verseSuraName(key)}, аят {key.split(':')[1]}
                        {' · '}
                        <span
                          style={{ color: 'var(--gold)', cursor: 'pointer' }}
                          onClick={() => onOpenSura(key.split(':')[0])}
                        >Читать суру полностью →</span>
                      </div>
                      <button style={f.removeBtn} onClick={() => onRemoveVerse(key)}>✕ Убрать из сохранённых</button>
                    </div>
                  </div>
                )
              })
        )}
        {tab === 'hadiths' && (
          likedHadiths.length === 0
            ? <div style={f.empty}>Нет сохранённых хадисов{'\n'}Лайкай хадис дня на главном экране ♡</div>
            : likedHadiths.map((h, i) => (
                <div key={i} style={f.hadithItem}>
                  <div style={f.hadithHeart}>♥</div>
                  <div style={f.itemBody}>
                    <div style={f.hadithAr} className="arabic">{h.ar}</div>
                    {h.translit && <div style={f.verseTranslit}>{h.translit}</div>}
                    <div style={f.hadithText}>{h.text}</div>
                    <div style={f.hadithSource}>— {h.source}</div>
                    <button style={f.removeBtn} onClick={() => onRemoveHadith(h.ar)}>✕ Убрать из сохранённых</button>
                  </div>
                </div>
              ))
        )}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

function ContactScreen({ user, profile, onClose }) {
  const [name,    setName]    = useState(profile?.name || '')
  const [email,   setEmail]   = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState(null) // null | 'sending' | 'ok' | 'error'

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch(
        'https://bwnzfyxcgzscghowpqfn.supabase.co/functions/v1/send-contact',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bnpmeXhjZ3pzY2dob3dwcWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzMxMDAsImV4cCI6MjA4OTkwOTEwMH0.0M-eXXyaqHZnfOLT0T04T3hCWUE_GuZ-HXE069VDodw`,
          },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
        }
      )
      if (res.ok) { setStatus('ok') }
      else { setStatus('error') }
    } catch { setStatus('error') }
  }

  return (
    <div style={ls.overlay}>
      <div style={ls.head}>
        <div style={ls.title}>✉️ Написать нам</div>
        <button style={ls.close} onClick={onClose}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
        {status === 'ok' ? (
          <div style={cf.success}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div style={cf.successTitle}>Сообщение отправлено!</div>
            <div style={cf.successSub}>Мы ответим на указанный email в течение 24 часов.</div>
            <button style={cf.btn} onClick={onClose}>Закрыть</button>
          </div>
        ) : (
          <>
            <div style={cf.hint}>Опишите ваш вопрос или проблему — мы свяжемся с вами по email.</div>

            <div style={cf.label}>Ваше имя</div>
            <input
              style={cf.input}
              placeholder="Введите имя"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <div style={cf.label}>Email для ответа</div>
            <input
              style={cf.input}
              placeholder="example@email.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <div style={cf.label}>Сообщение</div>
            <textarea
              style={{ ...cf.input, height:140, resize:'none', lineHeight:1.6 }}
              placeholder="Опишите ваш вопрос или предложение..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />

            {status === 'error' && (
              <div style={cf.error}>Не удалось отправить. Попробуйте ещё раз.</div>
            )}

            <button
              style={{
                ...cf.btn,
                opacity: (!name.trim() || !email.trim() || !message.trim() || status === 'sending') ? .5 : 1
              }}
              disabled={!name.trim() || !email.trim() || !message.trim() || status === 'sending'}
              onClick={handleSubmit}
            >
              {status === 'sending' ? 'Отправляем...' : 'Отправить'}
            </button>

            <div style={cf.note}>Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных согласно Политике конфиденциальности.</div>
          </>
        )}
      </div>
    </div>
  )
}

const cf = {
  hint:         { fontSize:13, color:'var(--text-muted)', marginBottom:20, lineHeight:1.6 },
  label:        { fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6, marginTop:16 },
  input:        { width:'100%', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'12px 14px', color:'var(--text)', fontSize:15, fontFamily:'var(--font-ui)', outline:'none', boxSizing:'border-box' },
  btn:          { width:'100%', marginTop:20, padding:'14px', borderRadius:16, background:'var(--gold)', border:'none', color:'#070710', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-ui)' },
  error:        { fontSize:13, color:'#ff6b6b', marginTop:10, textAlign:'center' },
  note:         { fontSize:11, color:'var(--text-dim)', marginTop:12, textAlign:'center', lineHeight:1.6 },
  success:      { display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', paddingTop:60 },
  successTitle: { fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:8 },
  successSub:   { fontSize:14, color:'var(--text-muted)', lineHeight:1.6, marginBottom:32 },
}

function LegalScreen({ title, children, onClose }) {
  return (
    <div style={ls.overlay}>
      <div style={ls.head}>
        <div style={ls.title}>{title}</div>
        <button style={ls.close} onClick={onClose}>✕</button>
      </div>
      <div style={ls.body} className="scroll-y">
        {children}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function LegalSection({ title, children }) {
  return (
    <div style={ls.section}>
      <div style={ls.sTitle}>{title}</div>
      <div style={ls.sText}>{children}</div>
    </div>
  )
}

const ls = {
  overlay: {
    position:'absolute', inset:0, zIndex:100,
    background:'var(--bg-deep)', display:'flex', flexDirection:'column',
    fontFamily:'var(--font-ui)',
  },
  head: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'18px 20px 14px', borderBottom:'1px solid var(--border)', flexShrink:0,
  },
  title: { fontSize:18, fontWeight:700, color:'var(--text)' },
  close: {
    width:34, height:34, borderRadius:10, border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:16,
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
  },
  body: { flex:1, overflowY:'auto', padding:'20px 20px 0' },
  section: { marginBottom:24 },
  sTitle: { fontSize:14, fontWeight:700, color:'var(--gold)', marginBottom:8 },
  sText: { fontSize:13, color:'var(--text-muted)', lineHeight:1.7, whiteSpace:'pre-line' },
}

function SectionLabel({ children }) {
  return <div style={{
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.1em',
    margin: '20px 0 8px'
  }}>{children}</div>
}

function NurStat({ nur }) {
  const lvl = getNurLevel(nur)
  const next = lvl.max === Infinity ? null : lvl.max + 1
  const progress = next ? ((nur - lvl.min) / (lvl.max - lvl.min)) * 100 : 100
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1 }}>
      <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>Нур</div>
      <div style={{ fontSize:22, fontWeight:700, color: lvl.color }}>{nur}</div>
      <div style={{ fontSize:13 }}>{lvl.emoji} {lvl.label}</div>
      {next && (
        <div style={{ width:'80%', height:3, borderRadius:2, background:'rgba(255,255,255,.1)', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:2, background: lvl.color, width: `${progress}%`, transition:'width .4s' }} />
        </div>
      )}
    </div>
  )
}

function Stat({ icon, value, label, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
      <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:16 }}>{icon}</div>
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
    position:'absolute', width:250, height:250, top:-50, right:-50,
    borderRadius:'50%',
    background:'radial-gradient(circle,rgba(201,168,76,.08) 0%,transparent 70%)',
    filter:'blur(50px)', pointerEvents:'none'
  },
  scroll: { flex:1, overflowY:'auto', padding:'16px 16px 0' },

  // Hero
  hero: { display:'flex', flexDirection:'column', alignItems:'center', gap:10, paddingBottom:4 },
  avatarWrap: {
    position:'relative', background:'none', border:'none', cursor:'pointer', padding:0,
    borderRadius:'50%',
  },
  avatar: {
    width:82, height:82, borderRadius:'50%', position:'relative',
    background:'linear-gradient(135deg,rgba(201,168,76,.25),rgba(201,168,76,.1))',
    border:'2px solid rgba(201,168,76,.4)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 30px rgba(201,168,76,.2)', overflow:'hidden',
  },
  avatarLetter: { fontSize:34, fontWeight:700, color:'var(--gold)' },
  avatarRing: {
    position:'absolute', inset:-4, borderRadius:'50%',
    border:'1px solid rgba(201,168,76,.2)', pointerEvents:'none'
  },
  avatarCamOverlay: {
    position:'absolute', bottom:0, right:0,
    width:26, height:26, borderRadius:'50%',
    background:'var(--bg-surface)', border:'2px solid rgba(201,168,76,.5)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, lineHeight:1,
  },
  nameRow:   { display:'flex', alignItems:'center', gap:8 },
  heroName:  { fontSize:22, fontWeight:700, color:'var(--text)' },
  editIcon:  { background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:16, padding:'2px 4px' },
  nameEdit:  { display:'flex', flexDirection:'column', gap:8, alignItems:'center', width:'100%' },
  nameInput: {
    background:'var(--bg-card)', border:'1px solid var(--border-active)',
    borderRadius:'var(--radius-md)', color:'var(--text)',
    fontFamily:'var(--font-ui)', fontSize:18, padding:'10px 16px',
    outline:'none', textAlign:'center', width:'80%', maxWidth:260
  },
  nameEditBtns: { display:'flex', gap:8 },
  saveBtnSm: {
    padding:'7px 18px', borderRadius:20,
    background:'var(--gold)', color:'#070710',
    border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
    fontFamily:'var(--font-ui)'
  },
  cancelBtnSm: {
    padding:'7px 18px', borderRadius:20,
    background:'transparent', color:'var(--text-muted)',
    border:'1px solid var(--border)', cursor:'pointer', fontSize:13,
    fontFamily:'var(--font-ui)'
  },
  heroEmail: { fontSize:13, color:'var(--text-muted)' },
  levelBadge: {
    display:'flex', alignItems:'center', gap:7,
    border:'1px solid', borderRadius:20, padding:'6px 14px',
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
    background:'none',
  },
  levelLabel: { fontSize:13, fontWeight:500 },
  levelPicker: {
    width:'100%', marginTop:8,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:18, overflow:'hidden', padding:'4px 0',
  },
  levelPickerTitle: {
    fontSize:11, fontWeight:600, color:'var(--text-muted)',
    textTransform:'uppercase', letterSpacing:'.08em',
    padding:'10px 16px 6px',
  },
  levelOption: {
    display:'flex', alignItems:'center', gap:12,
    padding:'11px 16px', width:'100%', border:'none',
    cursor:'pointer', fontFamily:'var(--font-ui)',
    borderTop:'1px solid var(--border)', outline:'none',
    textAlign:'left',
  },
  levelOptEmoji: { fontSize:22, flexShrink:0 },
  levelOptText:  { flex:1, display:'flex', flexDirection:'column', gap:2 },
  levelOptLabel: { fontSize:14, fontWeight:600 },
  levelOptDesc:  { fontSize:11, color:'var(--text-muted)', lineHeight:1.4 },

  // Stats
  statsCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)', padding:'18px 8px',
    display:'flex', alignItems:'center', marginTop:16
  },
  statDiv: { width:1, height:40, background:'var(--border)' },

  // Streak
  quranReadCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid rgba(74,144,217,.3)', padding:'16px',
    display:'flex', flexDirection:'column', gap:10,
  },
  quranReadRow:  { display:'flex', alignItems:'center', gap:12 },
  quranReadIcon: { fontSize:28, flexShrink:0 },
  quranReadInfo: { flex:1 },
  quranReadTitle:{ fontSize:12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 },
  quranReadCount:{ display:'flex', alignItems:'baseline', gap:2 },
  quranReadNum:  { fontSize:28, fontWeight:700, color:'#4A90D9' },
  quranReadTotal:{ fontSize:14, color:'var(--text-muted)' },
  quranProgressBg:{ height:6, borderRadius:3, background:'rgba(74,144,217,.15)' },
  quranProgressFill:{ height:6, borderRadius:3, background:'linear-gradient(90deg,#4A90D9,#7BB8F0)', transition:'width .4s ease' },
  quranReadHint: { fontSize:12, color:'var(--text-muted)', textAlign:'right' },

  streakCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)', padding:'16px 14px',
    display:'flex', justifyContent:'space-between'
  },
  streakDay: { display:'flex', flexDirection:'column', alignItems:'center', gap:4 },

  // Language
  langBtn: {
    display:'flex', alignItems:'center', gap:12,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'14px 16px',
    cursor:'pointer', width:'100%', outline:'none',
    fontFamily:'var(--font-ui)', transition:'border-color .2s'
  },
  langFlag: { fontSize:22 },
  langName: { flex:1, fontSize:15, fontWeight:500, color:'var(--text)', textAlign:'left' },
  langArrow:{ fontSize:11, color:'var(--text-muted)' },
  langDropdown: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', overflow:'hidden', marginTop:4
  },
  langOption: {
    display:'flex', alignItems:'center', gap:12,
    padding:'13px 16px', width:'100%', border:'none',
    cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:14,
    borderBottom:'1px solid var(--border)', outline:'none'
  },

  // Liked
  likedList: { display:'flex', flexDirection:'column', gap:8 },
  likedItem: {
    display:'flex', alignItems:'center', gap:12,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'12px 14px'
  },
  likedHeart: { color:'#e84393', fontSize:18, flexShrink:0 },
  likedInfo: { flex:1, display:'flex', flexDirection:'column', gap:2 },
  likedSura: { fontSize:14, fontWeight:500, color:'var(--text)' },
  likedRef:  { fontSize:11, color:'var(--text-muted)' },
  likedOpen: {
    background:'none', border:'1px solid var(--border)',
    color:'var(--gold)', borderRadius:12, padding:'5px 10px',
    fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)',
    flexShrink:0, outline:'none'
  },
  favBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:14,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'14px 16px',
    cursor:'pointer', outline:'none', textAlign:'left',
    fontFamily:'var(--font-ui)',
  },
  favIcon:  { fontSize:22, color:'#e84393', flexShrink:0 },
  favText:  { flex:1 },
  favTitle: { fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:2 },
  favSub:   { fontSize:12, color:'var(--text-muted)' },
  favArrow: { fontSize:22, color:'rgba(255,255,255,.2)', flexShrink:0 },

  // Tab bar
  tabBar: {
    flexShrink:0, display:'flex',
    borderBottom:'1px solid var(--border)',
    background:'var(--bg-deep)',
    paddingTop:'calc(var(--safe-top) + 4px)',
  },
  tabBtn: {
    flex:1, padding:'13px 0', fontSize:14, fontWeight:600,
    background:'none', border:'none', borderBottom:'2px solid transparent',
    color:'var(--text-muted)', cursor:'pointer', fontFamily:'var(--font-ui)',
    outline:'none', transition:'color .2s',
  },
  tabBtnActive: {
    color:'var(--gold)', borderBottomColor:'var(--gold)',
  },

  // Font size card
  fontCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-xl)', padding:'16px',
    display:'flex', flexDirection:'column', gap:16,
  },
  fontPreview: {
    fontFamily:"'Scheherazade New', serif",
    fontSize:'var(--arabic-size)', color:'var(--arabic-color)',
    textAlign:'center', direction:'rtl', lineHeight:1.8,
  },
  fontBtns: { display:'flex', gap:8 },
  fontBtn: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
    padding:'10px 4px', borderRadius:'var(--radius-md)',
    border:'1px solid var(--border)', background:'var(--bg-card-hover)',
    cursor:'pointer', outline:'none', fontFamily:"'Scheherazade New', serif",
    color:'var(--text-muted)', transition:'all .2s',
  },
  fontBtnActive: {
    border:'1.5px solid var(--gold)', background:'rgba(201,168,76,.12)',
    color:'var(--gold)',
  },
  fontBtnLabel: {
    fontSize:9, fontWeight:700, letterSpacing:'.04em',
    textTransform:'uppercase', fontFamily:'var(--font-ui)',
    whiteSpace:'pre', textAlign:'center', lineHeight:1.3,
  },

  // Notifications
  notifRow: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'14px 16px', marginBottom:8,
  },
  notifLeft:  { display:'flex', alignItems:'center', gap:12, flex:1 },
  notifIcon:  { fontSize:22, flexShrink:0 },
  notifName:  { fontSize:15, fontWeight:600, color:'var(--text)' },
  notifSub:   { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  toggle: {
    width:48, height:26, borderRadius:13, border:'none',
    cursor:'pointer', position:'relative', transition:'background .25s', flexShrink:0,
  },
  toggleThumb: {
    position:'absolute', top:3, left:3,
    width:20, height:20, borderRadius:'50%',
    background:'#fff', transition:'transform .25s',
    boxShadow:'0 1px 4px rgba(0,0,0,.3)',
  },
  timeInput: {
    background:'var(--bg-card-hover)', border:'1px solid var(--border)',
    borderRadius:10, padding:'6px 10px', color:'var(--text)',
    fontSize:14, fontFamily:'var(--font-ui)', outline:'none', cursor:'pointer',
    flexShrink:0,
  },

  // Theme toggle
  themeRow: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'14px 16px',
  },
  themeLabel: { display:'flex', alignItems:'center', gap:12 },
  themeIcon: { fontSize:22 },
  themeName: { fontSize:15, fontWeight:600, color:'var(--text)' },
  themeSub: { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  themeToggle: {
    width:48, height:26, borderRadius:13, border:'none',
    cursor:'pointer', position:'relative', transition:'background .25s', flexShrink:0,
  },
  themeThumb: {
    position:'absolute', top:3, left:3,
    width:20, height:20, borderRadius:'50%',
    background:'#fff', transition:'transform .25s',
    boxShadow:'0 1px 4px rgba(0,0,0,.3)',
  },

  // Logout
  logoutBtn: {
    width:'100%', padding:'14px', borderRadius:'var(--radius-lg)',
    background:'rgba(255,80,80,.07)', border:'1px solid rgba(255,80,80,.18)',
    color:'#ff6b6b', fontSize:15, cursor:'pointer',
    fontFamily:'var(--font-ui)', transition:'background .2s'
  },

  // Badges
  badgesWrap: {
    display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8,
  },
  badgeItem: {
    border:'1px solid', borderRadius:16, padding:'12px 12px 10px',
    display:'flex', flexDirection:'column', gap:4, position:'relative',
    transition:'opacity .2s',
  },
  badgeIcon:  { fontSize:22 },
  badgeTitle: { fontSize:12, fontWeight:700, lineHeight:1.3 },
  badgeDesc:  { fontSize:10, color:'var(--text-muted)', lineHeight:1.4 },
  badgeCheck: {
    position:'absolute', top:8, right:10,
    fontSize:12, fontWeight:800,
  },

  // About buttons
  aboutBtn: {
    width:'100%', display:'flex', alignItems:'center', gap:14,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'14px 16px',
    cursor:'pointer', outline:'none', textAlign:'left', marginBottom:8,
  },
  aboutIcon:  { fontSize:20, flexShrink:0 },
  aboutLabel: { flex:1, fontSize:15, color:'var(--text)', fontFamily:'var(--font-ui)' },
  aboutArrow: { fontSize:20, color:'var(--text-dim)' },

  // App info
  appInfo: { textAlign:'center', marginTop:24, marginBottom:8 },
  appName: {
    fontFamily:"'Scheherazade New',serif",
    fontSize:20, color:'rgba(201,168,76,.4)'
  },
  appVersion: { fontSize:11, color:'var(--text-dim)', marginTop:3 },

  modalOverlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:100,
    display:'flex', alignItems:'flex-end',
  },
  modalSheet: {
    width:'100%', maxHeight:'85vh', background:'var(--bg-surface)',
    borderRadius:'20px 20px 0 0', display:'flex', flexDirection:'column',
    animation:'sheetUp .3s ease',
  },
  modalHeader: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'18px 16px 12px', borderBottom:'1px solid var(--border)', flexShrink:0,
  },
  modalTitle: { fontSize:17, fontWeight:700, color:'var(--text)' },
  modalClose: {
    background:'none', border:'none', fontSize:18, color:'var(--text-muted)',
    cursor:'pointer', padding:'4px 8px',
  },
}

const f = {
  wrap: {
    position:'fixed', inset:0, zIndex:120,
    background:'var(--bg-deep)', display:'flex', flexDirection:'column',
    fontFamily:'var(--font-ui)',
  },
  head: {
    flexShrink:0, display:'flex', alignItems:'center', gap:12,
    padding:'16px 16px 12px', borderBottom:'1px solid var(--border)',
  },
  backBtn: {
    width:36, height:36, borderRadius:12, flexShrink:0,
    border:'1px solid var(--border)', background:'var(--bg-card)',
    color:'var(--text)', fontSize:22, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    outline:'none', fontFamily:'var(--font-ui)', lineHeight:1,
  },
  headMid:   { flex:1 },
  headTitle: { fontSize:20, fontWeight:800, color:'var(--text)' },
  headSub:   { fontSize:12, color:'var(--text-muted)', marginTop:2 },

  tabs: {
    flexShrink:0, display:'flex',
    borderBottom:'1px solid var(--border)',
  },
  tab: {
    flex:1, padding:'12px 0', fontSize:14, fontWeight:600,
    background:'none', border:'none', borderBottom:'2px solid',
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
    transition:'color .2s, border-color .2s',
  },

  scroll: { flex:1, overflowY:'auto', padding:'14px 16px 0' },

  empty: {
    textAlign:'center', color:'var(--text-muted)', fontSize:14,
    lineHeight:1.7, padding:'48px 24px', whiteSpace:'pre-line',
  },

  item: {
    display:'flex', alignItems:'center', gap:12,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:14, padding:'12px 14px', marginBottom:8,
  },
  itemHeart: { color:'#e84393', fontSize:18, flexShrink:0 },
  itemBody:  { flex:1, minWidth:0 },
  itemTitle: { fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 },
  itemSub:   { fontSize:12, color:'var(--text-muted)' },
  itemBtn: {
    flexShrink:0, fontSize:12, fontWeight:600, color:'var(--gold)',
    background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.3)',
    borderRadius:20, padding:'6px 12px', cursor:'pointer',
    outline:'none', fontFamily:'var(--font-ui)',
  },

  hadithItem: {
    display:'flex', alignItems:'flex-start', gap:12,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:14, padding:'12px 14px', marginBottom:8,
  },
  hadithHeart: { color:'#e84393', fontSize:18, flexShrink:0, marginTop:2 },
  hadithAr: {
    fontSize:18, direction:'rtl', textAlign:'right',
    fontFamily:"'Scheherazade New',serif",
    color:'var(--gold)', marginBottom:8, lineHeight:1.7,
  },
  verseTranslit: { fontSize:11, color:'var(--text-muted)', fontStyle:'italic', lineHeight:1.6, marginBottom:6 },
  removeBtn: {
    marginTop:10, padding:'6px 12px', borderRadius:20,
    background:'rgba(255,80,80,.08)', border:'1px solid rgba(255,80,80,.2)',
    color:'#ff6b6b', fontSize:12, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none',
  },
  hadithText:   { fontSize:13, color:'var(--text)', lineHeight:1.65, marginBottom:4 },
  hadithSource: { fontSize:11, color:'var(--text-muted)' },
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'
import { SURAS } from '../data/suras'

const LEVELS = {
  seeker:     { emoji: '🌱', label: 'Только начинаю', color: '#2D6A4F' },
  growing:    { emoji: '🌿', label: 'Мусульманин, расту', color: '#40916C' },
  practicing: { emoji: '🌳', label: 'Соблюдаю, ищу общину', color: '#52B788' },
}

const LANGUAGES = [
  { id: 'ru', flag: '🇷🇺', label: 'Русский',  translationId: 131 },
  { id: 'kk', flag: '🇰🇿', label: 'Қазақша', translationId: 107 },
  { id: 'en', flag: '🇬🇧', label: 'English',  translationId: 131 },
]

export default function ProfilePage() {
  const navigate                = useNavigate()
  const { user, profile, setProfile, logout } = useAuth()
  const [editName, setEditName] = useState(false)
  const [nameVal,  setNameVal]  = useState(profile?.name || '')
  const [showLang, setShowLang] = useState(false)

  const name     = profile?.name || user?.displayName || 'Друг'
  const nur      = profile?.nur    || 10
  const streak   = profile?.streak || 1
  const level    = LEVELS[profile?.level] || LEVELS.seeker
  const lang     = LANGUAGES.find(l => l.id === (profile?.language || 'ru')) || LANGUAGES[0]
  const liked    = profile?.liked_verses_keys || []

  async function saveName() {
    if (nameVal.trim().length < 2) return
    const name = nameVal.trim()
    setProfile(p => ({ ...p, name }))
    setEditName(false)
    if (user) await supabase.from('profiles').update({ name }).eq('id', user.id)
  }

  async function changeLang(l) {
    setProfile(p => ({ ...p, language: l.id, translation_id: l.translationId }))
    setShowLang(false)
    if (user) await supabase.from('profiles').update({
      language: l.id, translation_id: l.translationId
    }).eq('id', user.id)
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

  return (
    <div style={s.page}>
      <div style={s.orb} />

      <div style={s.scroll} className="scroll-y">

        {/* ── Аватар и имя ── */}
        <div style={s.hero}>
          <div style={s.avatar}>
            <span style={s.avatarLetter}>{name.charAt(0).toUpperCase()}</span>
            <div style={s.avatarRing} />
          </div>

          {editName ? (
            <div style={s.nameEdit}>
              <input
                style={s.nameInput}
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                autoFocus
              />
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

          {/* Уровень */}
          <div style={{ ...s.levelBadge, borderColor: level.color + '60', color: level.color, background: level.color + '18' }}>
            <span>{level.emoji}</span>
            <span style={s.levelLabel}>{level.label}</span>
          </div>
        </div>

        {/* ── Статистика ── */}
        <div style={s.statsCard}>
          <Stat icon="◉" value={nur}    label="Нур"          color="var(--gold)"  />
          <div style={s.statDiv} />
          <Stat icon="🔥" value={streak} label="Дней подряд" color="#ff9f43"      />
          <div style={s.statDiv} />
          <Stat icon="♥" value={liked.length} label="Сохранено" color="#e84393" />
        </div>

        {/* ── Серия ── */}
        <SectionLabel>Серия дней</SectionLabel>
        <div style={s.streakCard}>
          {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d, i) => {
            const active = i < streak
            const today  = i === streak - 1
            return (
              <div key={d} style={s.streakDay}>
                <div style={{
                  fontSize: today ? 22 : 16,
                  opacity:  active ? 1 : 0.18,
                  filter:   today ? 'drop-shadow(0 0 6px rgba(255,160,0,.8))' : 'none',
                  transform:today ? 'scale(1.15)' : 'scale(1)',
                  transition:'all .4s ease'
                }}>🔥</div>
                <div style={{ fontSize: 10, color: active ? 'var(--gold)' : 'var(--text-dim)', fontWeight: active ? 600 : 400 }}>{d}</div>
              </div>
            )
          })}
        </div>

        {/* ── Язык ── */}
        <SectionLabel>Язык перевода</SectionLabel>
        <button style={s.langBtn} onClick={() => setShowLang(v => !v)}>
          <span style={s.langFlag}>{lang.flag}</span>
          <span style={s.langName}>{lang.label}</span>
          <span style={s.langArrow}>{showLang ? '▲' : '▼'}</span>
        </button>
        {showLang && (
          <div style={s.langDropdown}>
            {LANGUAGES.map(l => (
              <button key={l.id} style={{
                ...s.langOption,
                background: l.id === lang.id ? 'rgba(201,168,76,.1)' : 'transparent',
                color: l.id === lang.id ? 'var(--gold)' : 'var(--text)'
              }} onClick={() => changeLang(l)}>
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {l.id === lang.id && <span style={{ marginLeft: 'auto', color: 'var(--gold)' }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── Сохранённые аяты ── */}
        {liked.length > 0 && (
          <>
            <SectionLabel>Сохранённые аяты ({liked.length})</SectionLabel>
            <div style={s.likedList}>
              {liked.map(key => (
                <div key={key} style={s.likedItem}>
                  <div style={s.likedHeart}>♥</div>
                  <div style={s.likedInfo}>
                    <div style={s.likedSura}>{verseSuraName(key)}</div>
                    <div style={s.likedRef}>Аят {key.split(':')[1]}</div>
                  </div>
                  <button style={s.likedOpen} onClick={() => navigate(`/quran/${key.split(':')[0]}`)}>
                    Читать →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Выход ── */}
        <SectionLabel>Аккаунт</SectionLabel>
        <button style={s.logoutBtn} onClick={handleLogout}>
          Выйти из аккаунта
        </button>

        <div style={s.appInfo}>
          <div style={s.appName}>نور حياة · Нур Хаят</div>
          <div style={s.appVersion}>Светлая жизнь · v0.1.0</div>
        </div>

        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.1em',
    margin: '20px 0 8px'
  }}>{children}</div>
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
  scroll: { flex:1, overflowY:'auto', padding:'0 16px', paddingTop:'calc(var(--safe-top) + 16px)' },

  // Hero
  hero: { display:'flex', flexDirection:'column', alignItems:'center', gap:10, paddingBottom:4 },
  avatar: {
    width:82, height:82, borderRadius:'50%', position:'relative',
    background:'linear-gradient(135deg,rgba(201,168,76,.25),rgba(201,168,76,.1))',
    border:'2px solid rgba(201,168,76,.4)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 30px rgba(201,168,76,.2)'
  },
  avatarLetter: { fontSize:34, fontWeight:700, color:'var(--gold)' },
  avatarRing: {
    position:'absolute', inset:-4, borderRadius:'50%',
    border:'1px solid rgba(201,168,76,.2)', pointerEvents:'none'
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
    border:'1px solid', borderRadius:20, padding:'6px 14px'
  },
  levelLabel: { fontSize:13, fontWeight:500 },

  // Stats
  statsCard: {
    background:'var(--bg-card)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)', padding:'18px 8px',
    display:'flex', alignItems:'center', marginTop:16
  },
  statDiv: { width:1, height:40, background:'var(--border)' },

  // Streak
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

  // Logout
  logoutBtn: {
    width:'100%', padding:'14px', borderRadius:'var(--radius-lg)',
    background:'rgba(255,80,80,.07)', border:'1px solid rgba(255,80,80,.18)',
    color:'#ff6b6b', fontSize:15, cursor:'pointer',
    fontFamily:'var(--font-ui)', transition:'background .2s'
  },

  // App info
  appInfo: { textAlign:'center', marginTop:24, marginBottom:8 },
  appName: {
    fontFamily:"'Scheherazade New',serif",
    fontSize:20, color:'rgba(201,168,76,.4)'
  },
  appVersion: { fontSize:11, color:'var(--text-dim)', marginTop:3 }
}

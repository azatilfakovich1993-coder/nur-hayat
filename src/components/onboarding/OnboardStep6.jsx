import { useState, useEffect } from 'react'

const LEVEL_META = {
  seeker:     { emoji: '🌱', label: 'Путь новичка',    color: '#2D6A4F' },
  growing:    { emoji: '🌿', label: 'Путь мусульманина', color: '#40916C' },
  practicing: { emoji: '🌳', label: 'Практикующий',    color: '#52B788' },
}

export default function OnboardStep6({ onFinish, userName, level }) {
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLit(true), 300)
    return () => clearTimeout(t)
  }, [])

  const meta = LEVEL_META[level] || LEVEL_META.seeker

  const anim = (delay = '0s') => ({
    opacity: lit ? 1 : 0,
    transform: lit ? 'translateY(0)' : 'translateY(14px)',
    transition: `all 0.5s ease ${delay}`,
  })

  return (
    <div style={s.wrap}>

      {/* Аватар */}
      <div style={{ ...s.avatarWrap, ...anim('0.1s') }}>
        <div style={s.avatarGlow} />
        <div style={s.avatar}>
          {userName?.charAt(0)?.toUpperCase() || '✨'}
        </div>
        <div style={s.nurBadge}>
          <span style={s.nurIcon}>◉</span>
          <span>10 нур</span>
        </div>
      </div>

      {/* Имя */}
      <div style={{ ...s.name, ...anim('0.25s') }}>
        {userName || 'Дорогой друг'}
      </div>
      <div style={{ ...s.levelBadge, ...anim('0.35s'), '--c': meta.color }}>
        <span>{meta.emoji}</span>
        <span style={{ color: meta.color }}>{meta.label}</span>
      </div>

      {/* Заголовок */}
      <div style={{ ...s.title, ...anim('0.45s') }}>
        Всё готово!
      </div>
      <div style={{ ...s.sub, ...anim('0.5s') }}>
        Твой путь начинается прямо сейчас.{'\n'}Возвращайся каждый день — и видишь, как растёт твой свет.
      </div>

      {/* Итоги */}
      <div style={{ ...s.summary, ...anim('0.6s') }}>
        <div style={s.summaryRow}>
          <span style={s.summaryIcon}>📖</span>
          <span style={s.summaryText}>Коран — 114 сур ждут тебя</span>
        </div>
        <div style={s.summaryRow}>
          <span style={s.summaryIcon}>🕌</span>
          <span style={s.summaryText}>5 намазов в день — твой ориентир</span>
        </div>
        <div style={s.summaryRow}>
          <span style={s.summaryIcon}>💬</span>
          <span style={s.summaryText}>Сообщество уже ждёт тебя</span>
        </div>
        <div style={s.summaryRow}>
          <span style={s.summaryIcon}>{meta.emoji}</span>
          <span style={s.summaryText}>{meta.label} — твой персональный путь открыт</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Аят */}
      <div style={{ ...s.ayah, ...anim('0.7s') }}>
        <div style={s.ayahAr} className="arabic">
          وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ
        </div>
        <div style={s.ayahTr}>
          «Когда Мои рабы спрашивают тебя обо Мне — Я близко»
        </div>
        <div style={s.ayahRef}>2:186</div>
      </div>

      <button
        className="btn btn-primary"
        style={{ ...anim('0.8s'), marginTop: 16 }}
        onClick={onFinish}
      >
        Войти в приложение →
      </button>
    </div>
  )
}

const s = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', paddingBottom: 8,
  },

  avatarWrap: {
    position: 'relative', marginTop: 8, marginBottom: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.25) 0%, transparent 70%)',
    filter: 'blur(16px)',
  },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #9a6a10, #c9a84c)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 800, color: '#070710',
    boxShadow: '0 0 24px rgba(201,168,76,.4)', zIndex: 1,
  },
  nurBadge: {
    position: 'absolute', bottom: -8, right: -12,
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.08))',
    border: '1px solid rgba(201,168,76,.4)',
    borderRadius: 20, padding: '3px 8px',
    fontSize: 11, fontWeight: 700, color: 'var(--gold)', zIndex: 2,
  },
  nurIcon: { fontSize: 12 },

  name: {
    fontSize: 22, fontWeight: 800, color: 'var(--text)',
    textAlign: 'center', marginBottom: 6,
  },
  levelBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600,
    marginBottom: 16,
  },

  title: { fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6, textAlign: 'center' },
  sub: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6,
    textAlign: 'center', maxWidth: 290, whiteSpace: 'pre-line', marginBottom: 16,
  },

  summary: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8 },
  summaryRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '10px 14px',
  },
  summaryIcon: { fontSize: 18, flexShrink: 0 },
  summaryText: { fontSize: 13, color: 'var(--text-muted)' },

  ayah: {
    width: '100%', textAlign: 'center',
    background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)',
    borderRadius: 16, padding: '14px 16px', marginTop: 8,
  },
  ayahAr: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 18, color: 'var(--gold)', direction: 'rtl',
    marginBottom: 6, lineHeight: 1.8,
  },
  ayahTr: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 4 },
  ayahRef: { fontSize: 11, color: 'rgba(201,168,76,.5)', fontWeight: 600 },
}

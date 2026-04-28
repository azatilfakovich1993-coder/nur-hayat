import { useState, useEffect } from 'react'

const STARS = [
  { top: '10%', left: '8%',  delay: '0s',   size: 8 },
  { top: '5%',  left: '68%', delay: '0.4s', size: 6 },
  { top: '22%', left: '90%', delay: '0.2s', size: 9 },
  { top: '32%', left: '12%', delay: '0.7s', size: 5 },
  { top: '7%',  left: '44%', delay: '0.9s', size: 7 },
  { top: '38%', left: '80%', delay: '0.3s', size: 6 },
]

export default function OnboardStep1({ onNext, userName }) {
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLit(true), 150)
    return () => clearTimeout(t)
  }, [])

  const anim = (delay = '0s', extra = {}) => ({
    opacity: lit ? 1 : 0,
    transition: `all 0.6s ease ${delay}`,
    ...extra,
  })

  return (
    <div style={s.wrap}>
      {/* Звёзды */}
      {STARS.map((st, i) => (
        <div key={i} style={{
          ...s.star, top: st.top, left: st.left,
          width: st.size, height: st.size,
          animation: `starPulse 2.5s ease-in-out ${st.delay} infinite`,
          ...anim(st.delay),
        }} />
      ))}

      {/* Луна */}
      <div style={{
        ...s.moonWrap,
        ...anim('0.1s', { transform: lit ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(20px)' }),
      }}>
        <div style={s.moonGlow} />
        <div style={s.moonEmoji}>🌙</div>
      </div>

      {/* Приветствие */}
      <div style={{ ...s.textBlock, ...anim('0.35s', { transform: lit ? 'translateY(0)' : 'translateY(14px)' }) }}>
        <div style={s.arabic} className="arabic">السَّلَامُ عَلَيْكُمْ</div>
        <div style={s.name}>{userName ? `${userName}!` : 'Добро пожаловать!'}</div>
        <div style={s.sub}>Рады видеть тебя в Нур Хаят — твоём духовном пространстве</div>
      </div>

      {/* Блоки фич */}
      <div style={{ ...s.grid, ...anim('0.55s') }}>
        {[
          { icon: '📖', text: 'Коран каждый день' },
          { icon: '🕌', text: 'Трекер намазов'    },
          { icon: '💬', text: 'Сообщество'         },
          { icon: '◉',  text: 'Твой рост'          },
        ].map(f => (
          <div key={f.icon} style={s.chip}>
            <span style={s.chipIcon}>{f.icon}</span>
            <span style={s.chipText}>{f.text}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ ...anim('0.7s'), marginTop: 16 }} onClick={onNext}>
        Начать экскурсию →
      </button>
    </div>
  )
}

const s = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', paddingBottom: 8, position: 'relative',
  },
  star: {
    position: 'absolute', borderRadius: '50%',
    background: '#C9A84C', boxShadow: '0 0 6px rgba(201,168,76,.8)',
    pointerEvents: 'none',
  },
  moonWrap: {
    position: 'relative', marginTop: 8, marginBottom: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  moonGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.22) 0%, transparent 70%)',
    filter: 'blur(18px)',
  },
  moonEmoji: { fontSize: 76, lineHeight: 1, filter: 'drop-shadow(0 0 18px rgba(201,168,76,.55))' },
  textBlock: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, textAlign: 'center', zIndex: 1,
  },
  arabic: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 21, color: 'var(--gold)',
    textShadow: '0 0 12px rgba(201,168,76,.5)', direction: 'rtl',
  },
  name: { fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 },
  sub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280 },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 10, width: '100%', marginTop: 20, zIndex: 1,
  },
  chip: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '12px 14px',
  },
  chipIcon: { fontSize: 20, flexShrink: 0 },
  chipText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
}

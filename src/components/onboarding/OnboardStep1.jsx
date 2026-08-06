import { useState, useEffect } from 'react'

const LEVELS = [
  {
    id: 'seeker',
    emoji: '🌱',
    title: 'Только начинаю',
    sub: 'Знакомлюсь с исламом',
    color: '#2D6A4F',
    accent: 'rgba(45,106,79,.2)',
    border: 'rgba(45,106,79,.5)',
  },
  {
    id: 'growing',
    emoji: '🌿',
    title: 'Мусульманин',
    sub: 'Хочу расти дальше',
    color: '#40916C',
    accent: 'rgba(64,145,108,.2)',
    border: 'rgba(64,145,108,.5)',
  },
  {
    id: 'practicing',
    emoji: '🌳',
    title: 'Практикующий',
    sub: 'Ищу общину',
    color: '#52B788',
    accent: 'rgba(82,183,136,.2)',
    border: 'rgba(82,183,136,.5)',
  },
]

export default function OnboardStep1({ onNext, userName, level, onLevelChange }) {
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
      <div style={{ ...s.textBlock, ...anim('0.1s', { transform: lit ? 'translateY(0)' : 'translateY(14px)' }) }}>
        <div style={s.arabic} className="arabic">السَّلَامُ عَلَيْكُمْ</div>
        <div style={s.name}>{userName ? `${userName}!` : 'Добро пожаловать!'}</div>
        <div style={s.sub}>Кто ты? Приложение подстроится под тебя</div>
      </div>

      <div style={{ ...s.cards, ...anim('0.3s') }}>
        {LEVELS.map(lv => {
          const isActive = level === lv.id
          return (
            <button
              key={lv.id}
              style={{
                ...s.card,
                background: isActive ? lv.accent : 'var(--bg-card)',
                border: `1.5px solid ${isActive ? lv.border : 'var(--border)'}`,
                boxShadow: isActive ? `0 0 20px ${lv.accent}` : 'none',
              }}
              onClick={() => onLevelChange(lv.id)}
            >
              <div style={{ ...s.emojiWrap, background: isActive ? lv.accent : 'rgba(255,255,255,.05)' }}>
                <span style={s.emoji}>{lv.emoji}</span>
              </div>
              <div style={s.cardBody}>
                <div style={{ ...s.cardTitle, color: isActive ? lv.color : 'var(--text)' }}>{lv.title}</div>
                <div style={s.cardSub}>{lv.sub}</div>
              </div>
              {isActive && <div style={{ ...s.check, background: lv.color }}>✓</div>}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ ...anim('0.45s'), marginTop: 16 }} onClick={onNext}>
        Дальше →
      </button>
    </div>
  )
}

const s = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 8 },
  textBlock: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 },
  arabic: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 22, color: 'var(--gold)',
    textShadow: '0 0 12px rgba(201,168,76,.5)', direction: 'rtl',
  },
  name: { fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 },
  sub: { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 },

  cards: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 18px', borderRadius: 20,
    cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-ui)', textAlign: 'left',
    transition: 'all .2s',
  },
  emojiWrap: {
    width: 56, height: 56, borderRadius: 16, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background .2s',
  },
  emoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 700, marginBottom: 3, transition: 'color .2s' },
  cardSub: { fontSize: 13, color: 'var(--text-muted)' },
  check: {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
}

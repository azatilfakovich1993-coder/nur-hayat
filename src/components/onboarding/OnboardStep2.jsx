import { useState } from 'react'

const LEVELS = [
  {
    id: 'seeker',
    emoji: '🌱',
    title: 'Только начинаю',
    sub: 'Знакомлюсь с исламом',
    desc: 'Получишь пошаговый путь новичка — от основ до первого намаза',
    color: '#2D6A4F',
    accent: 'rgba(45,106,79,.2)',
    border: 'rgba(45,106,79,.5)',
  },
  {
    id: 'growing',
    emoji: '🌿',
    title: 'Мусульманин',
    sub: 'Хочу углубить знания',
    desc: 'Откроется раздел Знания: Дуа, Азкар, Пророки, Глоссарий, 99 имён',
    color: '#40916C',
    accent: 'rgba(64,145,108,.2)',
    border: 'rgba(64,145,108,.5)',
  },
  {
    id: 'practicing',
    emoji: '🌳',
    title: 'Практикующий',
    sub: 'Ищу единомышленников',
    desc: 'Акцент на трекере намазов и живом сообществе',
    color: '#52B788',
    accent: 'rgba(82,183,136,.2)',
    border: 'rgba(82,183,136,.5)',
  },
]

export default function OnboardStep2({ onNext, level, onLevelChange }) {
  const [selected, setSelected] = useState(level)

  function handleSelect(id) {
    setSelected(id)
    onLevelChange(id)
  }

  const current = LEVELS.find(l => l.id === selected) || LEVELS[0]

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Кто ты?</div>
        <div style={s.sub}>Выбери — приложение подстроится под тебя</div>
      </div>

      <div style={s.cards}>
        {LEVELS.map(lv => {
          const isActive = selected === lv.id
          return (
            <button
              key={lv.id}
              style={{
                ...s.card,
                background: isActive ? lv.accent : 'var(--bg-card)',
                border: `1.5px solid ${isActive ? lv.border : 'var(--border)'}`,
                boxShadow: isActive ? `0 0 16px ${lv.accent}` : 'none',
              }}
              onClick={() => handleSelect(lv.id)}
            >
              <div style={{ ...s.emojiWrap, background: isActive ? lv.accent : 'rgba(255,255,255,.05)' }}>
                <span style={s.emoji}>{lv.emoji}</span>
              </div>
              <div style={s.cardBody}>
                <div style={{ ...s.cardTitle, color: isActive ? lv.color : 'var(--text)' }}>{lv.title}</div>
                <div style={s.cardSub}>{lv.sub}</div>
              </div>
              {isActive && (
                <div style={{ ...s.check, background: lv.color }}>✓</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Описание выбранного */}
      <div style={s.descCard}>
        <span style={{ fontSize: 18 }}>{current.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={s.descTitle}>Что тебя ждёт:</div>
          <div style={s.descText}>{current.desc}</div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNext}>
        Это я →
      </button>
    </div>
  )
}

const s = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 0,
  },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--text-muted)' },

  cards: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderRadius: 18,
    cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-ui)', textAlign: 'left',
    transition: 'all .2s',
  },
  emojiWrap: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background .2s',
  },
  emoji: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 2, transition: 'color .2s' },
  cardSub: { fontSize: 12, color: 'var(--text-muted)' },
  check: {
    width: 24, height: 24, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
  },

  descCard: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)',
    borderRadius: 14, padding: '14px 16px', marginTop: 16,
  },
  descTitle: { fontSize: 11, color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 },
  descText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
}

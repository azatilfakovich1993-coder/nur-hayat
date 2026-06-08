import { useState } from 'react'

const LEVELS = [
  {
    id: 'seeker',
    emoji: '🌱',
    title: 'Только начинаю интересоваться',
    sub: 'Ищу понимание, знакомлюсь с исламом',
    color: '#2D6A4F'
  },
  {
    id: 'growing',
    emoji: '🌿',
    title: 'Мусульманин, хочу стать ближе',
    sub: 'Углубляю знания, укрепляю практику',
    color: '#40916C'
  },
  {
    id: 'practicing',
    emoji: '🌳',
    title: 'Стараюсь соблюдать, ищу единомышленников',
    sub: 'Ищу общину, братьев и сестёр по вере',
    color: '#52B788'
  }
]

export default function RegisterStep3({ onNext, onBack, loading }) {
  const [selected, setSelected] = useState('seeker') // выбрано по умолчанию

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.step}>Шаг 4 из 4</div>
        <h2 style={s.title}>Где ты сейчас?</h2>
        <p style={s.sub}>Без осуждения — просто чтобы путь был твоим</p>
      </div>

      <div style={s.cards}>
        {LEVELS.map(level => (
          <button
            key={level.id}
            style={{
              ...s.card,
              ...(selected === level.id ? { ...s.cardActive, '--accent': level.color } : {})
            }}
            onClick={() => setSelected(level.id)}
          >
            <div style={{
              ...s.emojiWrap,
              background: selected === level.id
                ? `${level.color}33`
                : 'rgba(255,255,255,0.04)'
            }}>
              <span style={s.emoji}>{level.emoji}</span>
            </div>
            <div style={s.info}>
              <span style={s.levelTitle}>{level.title}</span>
              <span style={s.levelSub}>{level.sub}</span>
            </div>
            {selected === level.id && (
              <div style={{ ...s.dot, background: level.color }} />
            )}
          </button>
        ))}
      </div>

      <div style={s.btns}>
        <button className="btn btn-ghost" onClick={onBack} style={{ flex: 1 }}>← Назад</button>
        <button
          className="btn btn-primary"
          onClick={() => selected && onNext({ level: selected })}
          disabled={!selected || loading}
          style={{
            flex: 2,
            opacity: selected ? 1 : 0.4,
            cursor: selected ? 'pointer' : 'default'
          }}
        >
          {loading ? '⏳ Подождите, идёт регистрация...' : 'Создать аккаунт ✨'}
        </button>
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0', flex: 1 },
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  step: { fontSize: 12, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: 600, color: 'var(--text)' },
  sub: { fontSize: 14, color: 'var(--text-muted)' },
  cards: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 18px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    outline: 'none',
    width: '100%',
    textAlign: 'left'
  },
  cardActive: {
    background: 'var(--bg-card-hover)',
    borderColor: 'rgba(201,168,76,0.4)',
    boxShadow: '0 0 20px rgba(201,168,76,0.08)'
  },
  emojiWrap: {
    width: 52, height: 52, flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.25s ease'
  },
  emoji: { fontSize: 26 },
  info: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 },
  levelSub: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 },
  dot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    boxShadow: '0 0 8px currentColor'
  },
  btns: { display: 'flex', gap: 10, marginTop: 'auto' }
}

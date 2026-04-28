import { useState } from 'react'

const GENDERS = [
  {
    id: 'male',
    emoji: '🧔',
    title: 'Мужской',
    sub: 'Сможешь задавать вопросы мужчинам и отвечать в их разделе',
    color: '#4A90D9'
  },
  {
    id: 'female',
    emoji: '👩',
    title: 'Женский',
    sub: 'Сможешь задавать вопросы женщинам и отвечать в их разделе',
    color: '#e84393'
  }
]

export default function RegisterStep3Gender({ data, onNext, onBack }) {
  const [selected, setSelected] = useState(data.gender || null)

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.step}>Шаг 3 из 4</div>
        <h2 style={s.title}>Твой пол</h2>
        <p style={s.sub}>В приложении есть разделы, где можно задать вопрос только мужчинам или только женщинам</p>
      </div>

      <div style={s.cards}>
        {GENDERS.map(g => (
          <button
            key={g.id}
            style={{
              ...s.card,
              ...(selected === g.id ? { ...s.cardActive, borderColor: g.color + '80' } : {})
            }}
            onClick={() => setSelected(g.id)}
          >
            <div style={{
              ...s.emojiWrap,
              background: selected === g.id ? g.color + '22' : 'rgba(255,255,255,0.04)'
            }}>
              <span style={s.emoji}>{g.emoji}</span>
            </div>
            <div style={s.info}>
              <span style={s.genderTitle}>{g.title}</span>
              <span style={s.genderSub}>{g.sub}</span>
            </div>
            {selected === g.id && (
              <div style={{ ...s.dot, background: g.color }} />
            )}
          </button>
        ))}
      </div>

      <p style={s.hint}>Можно изменить в профиле позже</p>

      <div style={s.btns}>
        <button className="btn btn-ghost" onClick={onBack} style={{ flex: 1 }}>← Назад</button>
        <button
          className="btn btn-primary"
          onClick={() => selected && onNext({ gender: selected })}
          disabled={!selected}
          style={{
            flex: 2,
            opacity: selected ? 1 : 0.4,
            cursor: selected ? 'pointer' : 'default'
          }}
        >
          Далее →
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
    boxShadow: '0 0 20px rgba(201,168,76,0.08)'
  },
  emojiWrap: {
    width: 52, height: 52, flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.25s ease'
  },
  emoji: { fontSize: 28 },
  info: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  genderTitle: { fontSize: 17, fontWeight: 500, color: 'var(--text)' },
  genderSub: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 },
  dot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    boxShadow: '0 0 8px currentColor'
  },
  hint: { fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' },
  btns: { display: 'flex', gap: 10, marginTop: 'auto' }
}

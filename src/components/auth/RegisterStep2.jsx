import { useState } from 'react'

const LANGUAGES = [
  { id: 'ru', label: 'Русский',   native: 'Русский',   flag: '🇷🇺', translationId: 131 },
  { id: 'kk', label: 'Казахский', native: 'Қазақша',   flag: '🇰🇿', translationId: 107 },
  { id: 'en', label: 'English',   native: 'English',   flag: '🇬🇧', translationId: 131 },
]

export default function RegisterStep2({ data, onNext, onBack }) {
  const [selected, setSelected] = useState(data.language || 'ru')

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.step}>Шаг 2 из 3</div>
        <h2 style={s.title}>Язык перевода</h2>
        <p style={s.sub}>Аяты будут приходить на выбранном языке</p>
      </div>

      <div style={s.cards}>
        {LANGUAGES.map(lang => (
          <button
            key={lang.id}
            style={{
              ...s.card,
              ...(selected === lang.id ? s.cardActive : {})
            }}
            onClick={() => setSelected(lang.id)}
          >
            <span style={s.flag}>{lang.flag}</span>
            <div style={s.langInfo}>
              <span style={s.langLabel}>{lang.native}</span>
              {lang.native !== lang.label && (
                <span style={s.langSub}>{lang.label}</span>
              )}
            </div>
            <div style={{
              ...s.check,
              opacity: selected === lang.id ? 1 : 0,
              transform: selected === lang.id ? 'scale(1)' : 'scale(0.5)'
            }}>✓</div>
          </button>
        ))}
      </div>

      <p style={s.hint}>Можно изменить в настройках в любое время</p>

      <div style={s.btns}>
        <button className="btn btn-ghost" onClick={onBack} style={{ flex: 1 }}>← Назад</button>
        <button
          className="btn btn-primary"
          onClick={() => onNext({ language: selected, translationId: LANGUAGES.find(l => l.id === selected).translationId })}
          style={{ flex: 2 }}
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
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    outline: 'none',
    width: '100%',
    textAlign: 'left'
  },
  cardActive: {
    background: 'var(--bg-card-hover)',
    borderColor: 'var(--gold)',
    boxShadow: '0 0 0 1px rgba(201,168,76,0.3), 0 0 20px rgba(201,168,76,0.1)'
  },
  flag: { fontSize: 32 },
  langInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  langLabel: { fontSize: 17, fontWeight: 500, color: 'var(--text)' },
  langSub: { fontSize: 13, color: 'var(--text-muted)' },
  check: {
    width: 26, height: 26,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #C9A84C, #F0D080)',
    color: '#070710',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14,
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  hint: { fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' },
  btns: { display: 'flex', gap: 10, marginTop: 'auto' }
}

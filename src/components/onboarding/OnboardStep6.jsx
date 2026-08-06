import { useState, useEffect } from 'react'

export default function OnboardStep6({ onFinish, isAuthed }) {
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLit(true), 200)
    return () => clearTimeout(t)
  }, [])

  const anim = (delay = '0s') => ({
    opacity: lit ? 1 : 0,
    transform: lit ? 'translateY(0)' : 'translateY(14px)',
    transition: `all 0.5s ease ${delay}`,
  })

  return (
    <div style={s.wrap}>
      <div style={{ flex: 1 }} />

      <div style={{ ...s.moonWrap, ...anim('0.1s') }}>
        <div style={s.moonGlow} />
        <div style={s.moonEmoji}>🌙</div>
      </div>

      <div style={{ ...s.title, ...anim('0.25s') }}>
        Твой путь начинается сегодня
      </div>

      <div style={{ ...s.ayah, ...anim('0.55s') }}>
        <div style={s.ayahAr} className="arabic">
          وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ
        </div>
        <div style={s.ayahTr}>
          «Когда Мои рабы спрашивают тебя обо Мне — Я близко»
        </div>
        <div style={s.ayahRef}>Коран, 2:186</div>
      </div>

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-primary"
        style={{ ...anim('0.7s'), marginTop: 16 }}
        onClick={onFinish}
      >
        {isAuthed ? 'Войти в приложение →' : 'Создать аккаунт →'}
      </button>
    </div>
  )
}

const s = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', paddingBottom: 8,
  },

  moonWrap: {
    position: 'relative', marginBottom: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  moonGlow: {
    position: 'absolute', width: 130, height: 130, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.25) 0%, transparent 70%)',
    filter: 'blur(20px)',
  },
  moonEmoji: { fontSize: 68, lineHeight: 1, zIndex: 1, filter: 'drop-shadow(0 0 18px rgba(201,168,76,.5))' },

  title: {
    fontSize: 30, fontWeight: 800, color: 'var(--text)',
    textAlign: 'center', marginBottom: 28, lineHeight: 1.25, maxWidth: 300,
  },

  ayah: {
    width: '100%', textAlign: 'center',
    background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)',
    borderRadius: 18, padding: '18px 18px',
  },
  ayahAr: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 20, color: 'var(--gold)', direction: 'rtl',
    marginBottom: 8, lineHeight: 1.9,
  },
  ayahTr: { fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 },
  ayahRef: { fontSize: 12, color: 'rgba(201,168,76,.6)', fontWeight: 600 },
}

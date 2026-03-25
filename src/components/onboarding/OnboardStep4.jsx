import { useState, useEffect } from 'react'

export default function OnboardStep4({ onFinish, userName }) {
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLit(true), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h3 style={s.title}>Твой путь начинается</h3>
        <p style={s.sub}>Возвращайся каждый день — и видишь, как растёт твой свет.</p>
      </div>

      {/* Profile preview */}
      <div style={s.profile}>
        <div style={s.profileGlow} />

        {/* Avatar */}
        <div style={s.avatarWrap}>
          <div style={s.avatar}>
            {userName?.charAt(0).toUpperCase() || '✨'}
          </div>
          <div style={s.nurBadge}>
            <span style={s.nurIcon}>◉</span>
            <span>10 нур</span>
          </div>
        </div>

        <div style={s.name}>{userName || 'Дорогой друг'}</div>
        <div style={s.subtitle}>Nur Hayat · Светлая жизнь</div>

        {/* Streak */}
        <div style={s.streakRow}>
          <div style={s.streakLabel}>Серия</div>
          <div style={s.streakDays}>
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d, i) => (
              <div key={d} style={s.dayWrap}>
                <div style={{
                  ...s.flame,
                  fontSize: i === 0 ? 24 : 14,
                  opacity: i === 0 ? 1 : 0.2,
                  filter: i === 0 && lit ? 'drop-shadow(0 0 8px rgba(255,160,0,0.8))' : 'none',
                  transform: i === 0 && lit ? 'scale(1.2)' : 'scale(1)',
                  transition: `all 0.5s ease ${i * 0.05}s`
                }}>
                  🔥
                </div>
                <div style={{ ...s.dayLabel, color: i === 0 ? 'var(--gold)' : 'var(--text-dim)' }}>
                  {d}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={s.stats}>
          <Stat value="1" label="День" />
          <div style={s.statDivider} />
          <Stat value="10" label="Нур" />
          <div style={s.statDivider} />
          <Stat value="1" label="Аят" />
        </div>
      </div>

      <div style={s.hint}>
        🔥 Первый огонёк стрика горит! Вернись завтра — и он продолжит гореть.
      </div>

      <button
        className="btn btn-primary"
        onClick={onFinish}
        style={s.startBtn}
      >
        Начать ✨
      </button>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20, flex: 1 },
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text)' },
  sub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 },

  profile: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(201,168,76,0.15)',
    padding: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
  },
  profileGlow: {
    position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
    width: 200, height: 200, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
    filter: 'blur(30px)', pointerEvents: 'none'
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #C9A84C30, #C9A84C15)',
    border: '2px solid rgba(201,168,76,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 700, color: 'var(--gold)',
    boxShadow: '0 0 24px rgba(201,168,76,0.2)'
  },
  nurBadge: {
    position: 'absolute', bottom: -8, right: -12,
    background: 'linear-gradient(135deg, #C9A84C, #F0D080)',
    color: '#070710', fontSize: 11, fontWeight: 700,
    padding: '3px 8px', borderRadius: 10,
    display: 'flex', alignItems: 'center', gap: 4,
    boxShadow: '0 2px 8px rgba(201,168,76,0.4)'
  },
  nurIcon: { fontSize: 9 },

  name: { fontSize: 18, fontWeight: 600, color: 'var(--text)' },
  subtitle: { fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.05em' },

  streakRow: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10 },
  streakLabel: { fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' },
  streakDays: { display: 'flex', justifyContent: 'space-between' },
  dayWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  flame: { lineHeight: 1, transition: 'all 0.5s ease' },
  dayLabel: { fontSize: 10, fontWeight: 500 },

  stats: {
    display: 'flex', width: '100%',
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 0',
    border: '1px solid var(--border)'
  },
  statDivider: { width: 1, background: 'var(--border)' },

  hint: {
    fontSize: 13, color: 'var(--text-muted)',
    background: 'rgba(255,160,0,0.06)',
    border: '1px solid rgba(255,160,0,0.12)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px', lineHeight: 1.5, textAlign: 'center'
  },
  startBtn: {
    marginTop: 'auto',
    fontSize: 17,
    background: 'linear-gradient(135deg, #C9A84C 0%, #F0D080 50%, #C9A84C 100%)',
    boxShadow: '0 0 32px rgba(201,168,76,0.5), 0 4px 20px rgba(0,0,0,0.4)'
  }
}

import { useState, useEffect } from 'react'

const NUR_ACTIONS = [
  { icon: '📖', text: 'Прочитал суру',          pts: '+10' },
  { icon: '🕌', text: 'Совершил намаз',          pts: '+5'  },
  { icon: '🤲', text: 'Прочитал азкар',          pts: '+5'  },
  { icon: '💬', text: 'Написал в чат',           pts: '+2'  },
  { icon: '📅', text: 'Зашёл в приложение',      pts: '+3'  },
]

export default function OnboardStep5({ onNext }) {
  const [animIdx, setAnimIdx] = useState(-1)
  const [nurVal,  setNurVal]  = useState(10)

  useEffect(() => {
    let i = 0
    let mounted = true
    const interval = setInterval(() => {
      if (!mounted || i >= NUR_ACTIONS.length) { clearInterval(interval); return }
      setAnimIdx(i)
      setNurVal(v => v + parseInt(NUR_ACTIONS[i].pts))
      i++
    }, 700)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>НУР — твой духовный рост</div>
        <div style={s.sub}>Каждое действие в приложении приносит НУР-очки</div>
      </div>

      {/* NUR счётчик */}
      <div style={s.nurCard}>
        <div style={s.nurCircle}>
          <div style={s.nurIcon}>◉</div>
          <div style={s.nurCount}>{nurVal}</div>
          <div style={s.nurLabel}>НУР</div>
        </div>
        <div style={s.nurGlow} />
      </div>

      {/* Список действий */}
      <div style={s.actionList}>
        {NUR_ACTIONS.map((a, i) => (
          <div key={i} style={{
            ...s.actionRow,
            opacity: animIdx >= i ? 1 : 0.25,
            transform: animIdx >= i ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'all .4s ease',
          }}>
            <span style={s.actionIcon}>{a.icon}</span>
            <span style={s.actionText}>{a.text}</span>
            <span style={{
              ...s.actionPts,
              color: animIdx >= i ? '#52b788' : 'var(--text-muted)',
            }}>{a.pts}</span>
          </div>
        ))}
      </div>

      {/* Серия */}
      <div style={s.streakCard}>
        <div style={s.streakLeft}>
          <div style={s.streakFire}>🔥</div>
          <div>
            <div style={s.streakTitle}>Серия дней</div>
            <div style={s.streakSub}>Заходи каждый день — серия растёт</div>
          </div>
        </div>
        <div style={s.streakBadge}>1 день</div>
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNext}>
        Дальше →
      </button>
    </div>
  )
}

const s = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--text-muted)' },

  nurCard: {
    position: 'relative', display: 'flex', justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
  },
  nurCircle: {
    width: 100, height: 100, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(201,168,76,.2), rgba(201,168,76,.05))',
    border: '2px solid rgba(201,168,76,.4)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(201,168,76,.2)',
    zIndex: 1,
  },
  nurGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.15) 0%, transparent 70%)',
    filter: 'blur(16px)',
  },
  nurIcon: { fontSize: 18, color: 'var(--gold)', marginBottom: 2 },
  nurCount: {
    fontSize: 28, fontWeight: 800, color: 'var(--gold)',
    lineHeight: 1, fontVariantNumeric: 'tabular-nums',
    transition: 'all .3s',
  },
  nurLabel: { fontSize: 10, color: 'rgba(201,168,76,.6)', letterSpacing: '.1em', textTransform: 'uppercase' },

  actionList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  actionRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '10px 14px',
  },
  actionIcon: { fontSize: 18, flexShrink: 0 },
  actionText: { flex: 1, fontSize: 13, color: 'var(--text)' },
  actionPts: { fontSize: 14, fontWeight: 700, transition: 'color .4s' },

  streakCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(255,140,0,.08)', border: '1px solid rgba(255,140,0,.2)',
    borderRadius: 14, padding: '12px 16px',
  },
  streakLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  streakFire: { fontSize: 28 },
  streakTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  streakSub: { fontSize: 12, color: 'var(--text-muted)' },
  streakBadge: {
    background: 'rgba(255,140,0,.15)', border: '1px solid rgba(255,140,0,.3)',
    borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700,
    color: '#ff8c00',
  },
}

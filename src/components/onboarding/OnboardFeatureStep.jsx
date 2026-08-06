import { getOnboardTrack } from '../../data/onboarding-content'
import NurLadder from './NurLadder'

export default function OnboardFeatureStep({ onNext, level, screenIndex }) {
  const screen = getOnboardTrack(level)[screenIndex]

  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        <div style={s.heroGlow} />
        <div style={s.heroEmoji}>{screen.emoji}</div>
      </div>

      <div style={s.title}>{screen.title}</div>

      <div style={s.featureList}>
        {screen.features.map((f, i) => (
          <div key={i} style={s.featureRow}>
            <span style={s.featureIcon}>{f.icon}</span>
            <span style={s.featureText}>{f.text}</span>
          </div>
        ))}
      </div>

      {screen.showNurLadder && <NurLadder />}

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNext}>
        Дальше →
      </button>
    </div>
  )
}

const s = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 8 },
  hero: {
    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 16, marginBottom: 20,
  },
  heroGlow: {
    position: 'absolute', width: 130, height: 130, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.22) 0%, transparent 70%)',
    filter: 'blur(20px)',
  },
  heroEmoji: { fontSize: 64, lineHeight: 1, zIndex: 1, filter: 'drop-shadow(0 0 20px rgba(201,168,76,.35))' },
  title: {
    fontSize: 30, fontWeight: 800, color: 'var(--text)',
    textAlign: 'center', marginBottom: 28,
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: 14 },
  featureRow: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 18, padding: '18px 18px',
  },
  featureIcon: { fontSize: 28, flexShrink: 0, width: 34, textAlign: 'center' },
  featureText: { fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 },
}

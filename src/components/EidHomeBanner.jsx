import { useState } from 'react'
import { getEidToday, shareEidGreeting } from '../utils/eidGreeting'

export default function EidHomeBanner() {
  const eid = getEidToday()
  const [sharing, setSharing] = useState(false)

  if (!eid) return null

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      await shareEidGreeting(eid)
    } catch (err) {
      console.warn('[EidHomeBanner] share failed:', err?.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.glow} />
      <div style={s.ornament}>
        <div style={s.diamond} />
        <div style={{ ...s.diamond, transform: 'rotate(45deg)', opacity: .82 }} />
      </div>
      <div style={s.body}>
        <div style={s.eyebrow}>Сегодня праздник</div>
        <div style={s.title}>С {eid.eidName}!</div>
        <div style={s.sub}>Пусть Аллах примет твой пост</div>
      </div>
      <button style={s.shareBtn} onClick={handleShare} disabled={sharing} aria-label="Поделиться поздравлением">
        {sharing ? '…' : '↗'}
      </button>
    </div>
  )
}

const s = {
  wrap: {
    position: 'relative', overflow: 'hidden',
    borderRadius: 20, border: '1px solid rgba(201,168,76,.32)',
    background: 'linear-gradient(135deg, rgba(201,168,76,.16), rgba(201,168,76,.04) 60%, transparent)',
    padding: '16px 15px', display: 'flex', alignItems: 'center', gap: 13,
    marginBottom: 14, fontFamily: 'var(--font-ui)',
  },
  glow: {
    position: 'absolute', top: '-30%', right: '-15%', width: '70%', height: '160%',
    background: 'radial-gradient(circle, rgba(201,168,76,.22) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  ornament: { position: 'relative', width: 40, height: 40, flexShrink: 0, zIndex: 1 },
  diamond: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg,#f0d080,#9a6a10)',
    clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
    boxShadow: '0 0 14px rgba(201,168,76,.4)',
  },
  body: { position: 'relative', zIndex: 1, flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(201,168,76,.75)', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: 800, color: 'var(--text)' },
  sub: { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 },
  shareBtn: {
    position: 'relative', zIndex: 1, flexShrink: 0, width: 34, height: 34, borderRadius: 17,
    background: 'rgba(201,168,76,.14)', border: '1px solid rgba(201,168,76,.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--gold)',
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },
}

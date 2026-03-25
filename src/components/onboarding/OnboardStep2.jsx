import { useState, useRef } from 'react'

const VERSE = {
  arabic:      'وَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ',
  translation: 'Кто сделает добро весом с пылинку — увидит его.',
  ref:         '99:7'
}

function Spark({ x, y, color, angle, dist }) {
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: 6, height: 6,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      '--tx': `${Math.cos(angle) * dist}px`,
      '--ty': `${Math.sin(angle) * dist}px`,
      animation: 'sparkle 0.7s ease-out forwards',
      pointerEvents: 'none'
    }} />
  )
}

export default function OnboardStep2({ onNext }) {
  const [liked,   setLiked]   = useState(false)
  const [sparks,  setSparks]  = useState([])
  const [nurAnim, setNurAnim] = useState(false)
  const btnRef = useRef()

  function handleHeart() {
    if (liked) return

    setLiked(true)
    setNurAnim(true)

    // Generate sparks around the button
    const newSparks = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: '50%', y: '50%',
      color: i % 3 === 0 ? '#F0D080' : i % 3 === 1 ? '#C9A84C' : '#fff8dc',
      angle: (i / 18) * Math.PI * 2,
      dist: 28 + Math.random() * 32
    }))
    setSparks(newSparks)
    setTimeout(() => setSparks([]), 800)
    setTimeout(() => setNurAnim(false), 1200)
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <p style={s.hint}>Если аят тронул — нажми на сердце</p>
      </div>

      {/* Verse card */}
      <div style={s.card}>
        <div style={s.glow} />
        <div style={s.arabic} className="arabic">{VERSE.arabic}</div>
        <div style={s.divider} />
        <div style={s.translation}>{VERSE.translation}</div>
        <div style={s.ref}>Коран, {VERSE.ref}</div>
      </div>

      {/* Heart button */}
      <div style={s.heartWrap}>
        {sparks.map(sp => <Spark key={sp.id} {...sp} />)}

        <button
          ref={btnRef}
          style={{
            ...s.heartBtn,
            animation: liked ? 'heartBeat 0.5s ease' : 'none',
            color: liked ? '#e84393' : 'var(--text-muted)'
          }}
          onClick={handleHeart}
        >
          {liked ? '♥' : '♡'}
        </button>

        {/* +10 нур float */}
        {nurAnim && (
          <div style={s.nurBadge}>+10 нур ✨</div>
        )}
      </div>

      {/* Nur counter */}
      {liked && (
        <div style={s.nurCounter}>
          <div style={s.nurDot} />
          <span style={s.nurLabel}>10 нур</span>
          <span style={s.nurSub}>твой свет растёт</span>
        </div>
      )}

      {liked && (
        <button
          className="btn btn-primary"
          onClick={onNext}
          style={{ marginTop: 'auto', animation: 'fadeIn 0.5s ease' }}
        >
          Дальше →
        </button>
      )}

      <style>{`
        @keyframes sparkle {
          0%   { transform: translate(0,0) scale(1); opacity:1; }
          100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity:0; }
        }
        @keyframes heartBeat {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.5); }
          60%  { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        @keyframes floatUp {
          0%   { opacity:1; transform:translateY(0) scale(1); }
          100% { opacity:0; transform:translateY(-60px) scale(1.2); }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, flex: 1 },
  header: { textAlign: 'center' },
  hint: { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 },
  card: {
    width: '100%',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(201,168,76,0.2)',
    padding: 24,
    display: 'flex', flexDirection: 'column', gap: 14,
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
  },
  glow: {
    position: 'absolute', top: -30, right: -30,
    width: 150, height: 150, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
    filter: 'blur(30px)', pointerEvents: 'none'
  },
  arabic: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 24, lineHeight: 1.8, color: 'var(--gold-light)',
    textAlign: 'center', direction: 'rtl'
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)'
  },
  translation: { fontSize: 15, color: 'var(--text)', lineHeight: 1.7, textAlign: 'center' },
  ref: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' },

  heartWrap: {
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 80, height: 80
  },
  heartBtn: {
    width: 70, height: 70, borderRadius: '50%',
    background: 'var(--bg-card)',
    border: '2px solid var(--border)',
    fontSize: 34, cursor: 'pointer', outline: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color 0.3s, border-color 0.3s, box-shadow 0.3s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  nurBadge: {
    position: 'absolute',
    top: -10, left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #C9A84C, #F0D080)',
    color: '#070710',
    fontWeight: 700, fontSize: 14,
    padding: '4px 12px', borderRadius: 20,
    whiteSpace: 'nowrap',
    animation: 'floatUp 1.2s ease-out forwards',
    pointerEvents: 'none',
    boxShadow: '0 0 20px rgba(201,168,76,0.5)'
  },
  nurCounter: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-card)',
    border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: 'var(--radius-lg)',
    padding: '12px 20px',
    animation: 'fadeIn 0.5s ease'
  },
  nurDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'var(--gold)',
    boxShadow: '0 0 10px rgba(201,168,76,0.6)'
  },
  nurLabel: { fontSize: 16, fontWeight: 600, color: 'var(--gold)' },
  nurSub: { fontSize: 13, color: 'var(--text-muted)' }
}

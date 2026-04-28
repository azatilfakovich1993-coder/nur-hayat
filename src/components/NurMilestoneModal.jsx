import { useEffect, useState } from 'react'

export default function NurMilestoneModal({ milestone, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (milestone) {
      // небольшая задержка для плавного появления
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [milestone])

  if (!milestone) return null

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div style={{ ...s.overlay, opacity: visible ? 1 : 0 }} onClick={handleClose}>
      <div
        style={{ ...s.card, transform: visible ? 'scale(1) translateY(0)' : 'scale(.85) translateY(40px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Частицы */}
        <div style={s.particles}>
          {SPARKS.map((sp, i) => (
            <div key={i} style={{ ...s.spark, ...sp, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>

        {/* Новый уровень лейбл */}
        <div style={s.topLabel}>НОВЫЙ УРОВЕНЬ</div>

        {/* Эмодзи */}
        <div style={{ ...s.emoji, filter: `drop-shadow(0 0 24px ${milestone.color})` }}>
          {milestone.emoji}
        </div>

        {/* Название */}
        <div style={{ ...s.levelName, color: milestone.color }}>
          {milestone.label}
        </div>

        {/* НУР */}
        <div style={s.nurAmount}>
          <span style={{ color: milestone.color, fontWeight: 800 }}>{milestone.threshold}</span>
          <span style={s.nurLabel}> НУР</span>
        </div>

        {/* Текст поздравления */}
        <div style={s.text}>{milestone.text}</div>

        {/* Арабская фраза */}
        <div style={s.arabic}>ما شاء الله</div>

        {/* Кнопка */}
        <button style={{ ...s.btn, background: milestone.color }} onClick={handleClose}>
          АльхамдулиЛлях!
        </button>
      </div>

      <style>{`
        @keyframes sparkFloat {
          0% { transform: translate(0,0) scale(1); opacity: 1 }
          100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0 }
        }
        @keyframes nurPulse {
          0%,100% { transform: scale(1) }
          50% { transform: scale(1.06) }
        }
      `}</style>
    </div>
  )
}

const SPARKS = [
  { top: '10%', left: '20%',  '--tx': '-40px', '--ty': '-60px', background: '#FFD700', width: 8,  height: 8,  borderRadius: '50%', animation: 'sparkFloat 1.2s ease-out infinite' },
  { top: '15%', right: '18%', '--tx':  '35px', '--ty': '-55px', background: '#C9A84C', width: 6,  height: 6,  borderRadius: '50%', animation: 'sparkFloat 1.4s ease-out infinite' },
  { top: '30%', left: '8%',   '--tx': '-30px', '--ty':  '20px', background: '#7B6BAE', width: 5,  height: 5,  borderRadius: '50%', animation: 'sparkFloat 1.1s ease-out infinite' },
  { top: '25%', right: '10%', '--tx':  '30px', '--ty':  '15px', background: '#E8A030', width: 7,  height: 7,  borderRadius: '50%', animation: 'sparkFloat 1.3s ease-out infinite' },
  { top: '5%',  left: '50%',  '--tx':   '0px', '--ty': '-50px', background: '#FFD700', width: 5,  height: 5,  borderRadius: '50%', animation: 'sparkFloat 1.0s ease-out infinite' },
  { top: '20%', left: '40%',  '--tx': '-15px', '--ty': '-40px', background: '#52b788', width: 4,  height: 4,  borderRadius: '50%', animation: 'sparkFloat 1.5s ease-out infinite' },
]

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
    transition: 'opacity .3s ease',
    backdropFilter: 'blur(8px)',
  },
  card: {
    position: 'relative',
    background: 'linear-gradient(160deg, #12121e 0%, #1a1a2e 60%, #0d0d18 100%)',
    border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 28,
    padding: '36px 28px 32px',
    maxWidth: 340,
    width: '100%',
    textAlign: 'center',
    overflow: 'hidden',
    transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
    boxShadow: '0 24px 80px rgba(0,0,0,.6)',
  },
  particles: {
    position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
  },
  spark: {
    position: 'absolute',
  },
  topLabel: {
    fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
    color: 'rgba(201,168,76,.6)', marginBottom: 20,
    fontFamily: 'var(--font-ui)',
  },
  emoji: {
    fontSize: 72, lineHeight: 1,
    animation: 'nurPulse 2s ease-in-out infinite',
    display: 'block', marginBottom: 16,
  },
  levelName: {
    fontSize: 32, fontWeight: 900,
    fontFamily: 'var(--font-ui)',
    marginBottom: 4,
    letterSpacing: '.02em',
  },
  nurAmount: {
    fontSize: 18, marginBottom: 20,
    fontFamily: 'var(--font-ui)',
  },
  nurLabel: {
    color: 'rgba(255,255,255,.4)', fontWeight: 500,
  },
  text: {
    fontSize: 14, color: 'rgba(255,255,255,.75)',
    lineHeight: 1.65, marginBottom: 20,
    fontFamily: 'var(--font-ui)',
  },
  arabic: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 26, color: 'rgba(201,168,76,.5)',
    marginBottom: 24, letterSpacing: '.04em',
  },
  btn: {
    width: '100%', padding: '14px 0',
    borderRadius: 16, border: 'none',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
    letterSpacing: '.02em',
    boxShadow: '0 4px 20px rgba(0,0,0,.3)',
  },
}

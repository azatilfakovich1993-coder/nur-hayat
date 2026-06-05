import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SplashPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [phase, setPhase] = useState(0)
  const [splashDone, setSplashDone] = useState(false)
  // phase 0 → black
  // phase 1 → arabic fades in + glows
  // phase 2 → latin + subtitle appear
  // phase 3 → all fade out → navigate

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 2800)
    const t4 = setTimeout(() => setSplashDone(true), 3600)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!splashDone || loading) return
    navigate(user ? '/home' : '/auth', { replace: true })
  }, [splashDone, loading, user, navigate])

  // Запасной таймаут — если loading не снялся за 5с, уходим на /auth
  useEffect(() => {
    const t = setTimeout(() => navigate('/auth', { replace: true }), 5000)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div style={styles.page}>
      {/* Background orbs */}
      <div style={{ ...styles.orb, width: 320, height: 320, top: -60, left: -80, animationDelay: '0s' }} />
      <div style={{ ...styles.orb, width: 200, height: 200, bottom: 80, right: -40, animationDelay: '3s' }} />

      <div style={{
        ...styles.center,
        opacity: phase === 3 ? 0 : 1,
        transition: 'opacity 0.8s ease'
      }}>
        {/* Arabic */}
        <div style={{
          ...styles.arabic,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
          animation: phase >= 1 ? 'goldenPulse 3s ease-in-out infinite' : 'none'
        }}>
          نور حياة
        </div>

        {/* Latin */}
        <div style={{
          ...styles.latin,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s'
        }}>
          Нур Хаят
        </div>

        {/* Subtitle */}
        <div style={{
          ...styles.subtitle,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s'
        }}>
          Светлая жизнь
        </div>

        {/* Decorative line */}
        <div style={{
          ...styles.line,
          opacity: phase >= 2 ? 0.4 : 0,
          transition: 'opacity 0.7s ease 0.5s'
        }} />
      </div>

      <style>{`
        @keyframes goldenPulse {
          0%, 100% {
            text-shadow:
              0 0 20px rgba(201,168,76,0.7),
              0 0 60px rgba(201,168,76,0.4),
              0 0 100px rgba(201,168,76,0.2);
          }
          50% {
            text-shadow:
              0 0 40px rgba(201,168,76,1),
              0 0 90px rgba(201,168,76,0.6),
              0 0 150px rgba(201,168,76,0.3);
          }
        }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(10px,-15px); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  page: {
    height: '100%',
    background: '#070710',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
    animation: 'orbFloat 8s ease-in-out infinite'
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    zIndex: 1
  },
  arabic: {
    fontFamily: "'Scheherazade New', 'Amiri', serif",
    fontSize: 64,
    fontWeight: 700,
    color: '#C9A84C',
    direction: 'rtl',
    lineHeight: 1.2
  },
  latin: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 22,
    fontWeight: 300,
    color: '#F0D080',
    letterSpacing: '0.18em',
    textTransform: 'uppercase'
  },
  subtitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 300,
    color: 'rgba(245,240,232,0.45)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase'
  },
  line: {
    marginTop: 20,
    width: 60,
    height: 1,
    background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)'
  }
}

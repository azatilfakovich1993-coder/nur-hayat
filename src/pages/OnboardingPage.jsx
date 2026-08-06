import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'
import { trackEvent } from '../utils/analytics'
import OnboardStep1 from '../components/onboarding/OnboardStep1'
import OnboardFeatureStep from '../components/onboarding/OnboardFeatureStep'
import OnboardStep6 from '../components/onboarding/OnboardStep6'

const STEPS = 6

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const [step,  setStep]  = useState(1)
  const [level, setLevel] = useState(profile?.level || 'seeker')

  const isAuthed = !!user

  useEffect(() => { trackEvent('onboarding_step_view', { step, authed: isAuthed }, user?.id) }, [step, user?.id])

  const next = () => setStep(s => Math.min(s + 1, STEPS))

  function handleLevelChange(newLevel) {
    setLevel(newLevel)
    if (user) {
      supabase.from('profiles').update({ level: newLevel }).eq('id', user.id)
      setProfile(p => ({ ...p, level: newLevel }))
    }
  }

  // Авторизованный юзер — старый флоу (аккаунт уже есть, просто отмечаем онбординг пройденным).
  // Анонимный юзер — новый флоу (онбординг до регистрации): выбор уровня кладём в
  // localStorage и передаём эстафету AuthPage, она создаст профиль уже onboarded:true.
  async function completeOnboarding(skipped) {
    if (user) {
      await Promise.race([
        supabase.from('profiles').update({ onboarded: true }).eq('id', user.id),
        new Promise(r => setTimeout(r, 5000))
      ])
      setProfile(p => ({ ...p, onboarded: true }))
    } else {
      try {
        localStorage.setItem('pending_level', level)
        localStorage.setItem('onboarding_seen', '1')
      } catch {}
    }
    trackEvent(skipped ? 'onboarding_skipped' : 'onboarding_completed', { level, at_step: step }, user?.id)
    navigate(user ? '/home' : '/auth')
  }

  const finish = () => completeOnboarding(false)
  const skip   = () => completeOnboarding(true)

  const userName = profile?.name || ''

  return (
    <div style={s.page}>
      <div style={{ ...s.orb, width: 280, height: 280, top: -60, right: -60 }} />
      <div style={{ ...s.orb, width: 200, height: 200, bottom: 60, left: -60, animationDelay: '5s', opacity: 0.4 }} />

      {/* Progress bar */}
      <div style={s.header}>
        <div style={s.logoRow}>
          <span style={s.logoAr}>نور حياة</span>
          {step < STEPS && (
            <button style={s.skipBtn} onClick={skip}>Пропустить</button>
          )}
        </div>
        <div style={s.progressWrap}>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${(step / STEPS) * 100}%` }} />
          </div>
          <span style={s.stepCount}>{step} / {STEPS}</span>
        </div>
      </div>

      {/* Step content */}
      <div style={s.content} key={step}>
        {step === 1 && <OnboardStep1 onNext={next} userName={userName} level={level} onLevelChange={handleLevelChange} />}
        {step >= 2 && step <= 5 && <OnboardFeatureStep onNext={next} level={level} screenIndex={step - 2} />}
        {step === 6 && <OnboardStep6 onFinish={finish} isAuthed={isAuthed} />}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(30px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes orbFloat {
          0%,100% { transform:translate(0,0); }
          50% { transform:translate(8px,-12px); }
        }
      `}</style>
    </div>
  )
}

const s = {
  page: {
    height: '100%', background: 'var(--bg-deep)',
    display: 'flex', flexDirection: 'column',
    paddingTop: 'calc(var(--safe-top) + 12px)',
    paddingBottom: 'calc(var(--safe-bottom) + 16px)',
    position: 'relative', overflow: 'hidden',
    fontFamily: 'var(--font-ui)',
  },
  orb: {
    position: 'absolute', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
    filter: 'blur(50px)', pointerEvents: 'none',
    animation: 'orbFloat 10s ease-in-out infinite',
  },
  header: {
    padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12,
    flexShrink: 0, zIndex: 1,
  },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  skipBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12,
    padding: '4px 6px', cursor: 'pointer', opacity: 0.55,
  },
  logoAr: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 24, color: 'var(--gold)',
    textShadow: '0 0 16px rgba(201,168,76,0.4)',
  },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  progressBar: {
    flex: 1, height: 3, borderRadius: 2,
    background: 'var(--bg-card)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, #C9A84C, #F0D080)',
    boxShadow: '0 0 8px rgba(201,168,76,0.5)',
    transition: 'width 0.4s ease',
  },
  stepCount: { fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 },
  content: {
    flex: 1, padding: '12px 20px 0',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto', overflowX: 'hidden',
    scrollbarWidth: 'none', zIndex: 1,
    animation: 'slideIn 0.35s ease',
  },
}

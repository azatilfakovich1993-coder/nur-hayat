import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'
import OnboardStep1 from '../components/onboarding/OnboardStep1'
import OnboardStep2 from '../components/onboarding/OnboardStep2'
import OnboardStep3 from '../components/onboarding/OnboardStep3'
import OnboardStep4 from '../components/onboarding/OnboardStep4'

const STEPS = 4

export default function OnboardingPage() {
  const navigate       = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const [step, setStep]   = useState(1)
  const [dir,  setDir]    = useState(1)  // 1=forward, -1=back

  const next = () => { setDir(1);  setStep(s => Math.min(s + 1, STEPS)) }

  async function finish() {
    if (user) {
      await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
      setProfile(p => ({ ...p, onboarded: true }))
    }
    navigate('/home')
  }

  const translationId = profile?.translationId || 131
  const userName      = profile?.name || user?.displayName || ''

  return (
    <div style={s.page}>
      {/* Background orbs */}
      <div style={{ ...s.orb, width: 280, height: 280, top: -60, right: -60 }} />
      <div style={{ ...s.orb, width: 200, height: 200, bottom: 60, left: -60, animationDelay: '5s', opacity: 0.4 }} />

      {/* Header */}
      <div style={s.header}>
        <div style={s.logoRow}>
          <span style={s.logoAr}>نور حياة</span>
        </div>

        {/* Progress */}
        <div style={s.progressWrap}>
          <div style={s.progressBar}>
            <div style={{
              ...s.progressFill,
              width: `${(step / STEPS) * 100}%`
            }} />
          </div>
          <span style={s.stepCount}>{step} / {STEPS}</span>
        </div>
      </div>

      {/* Step content */}
      <div style={{
        ...s.content,
        animation: `${dir > 0 ? 'slideIn' : 'slideInLeft'} 0.35s ease`
      }} key={step}>
        {step === 1 && <OnboardStep1 onNext={next} translationId={translationId} />}
        {step === 2 && <OnboardStep2 onNext={next} />}
        {step === 3 && <OnboardStep3 onNext={next} />}
        {step === 4 && <OnboardStep4 onFinish={finish} userName={userName} />}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(30px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity:0; transform:translateX(-30px); }
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
    height: '100%',
    background: 'var(--bg-deep)',
    display: 'flex', flexDirection: 'column',
    paddingTop: 'calc(var(--safe-top) + 16px)',
    paddingBottom: 'calc(var(--safe-bottom) + 16px)',
    position: 'relative', overflow: 'hidden'
  },
  orb: {
    position: 'absolute', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
    filter: 'blur(50px)', pointerEvents: 'none',
    animation: 'orbFloat 10s ease-in-out infinite'
  },
  header: {
    padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14,
    flexShrink: 0, zIndex: 1
  },
  logoRow: { display: 'flex', alignItems: 'center' },
  logoAr: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 26, color: 'var(--gold)',
    textShadow: '0 0 16px rgba(201,168,76,0.4)'
  },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  progressBar: {
    flex: 1, height: 3, borderRadius: 2,
    background: 'var(--bg-card)', overflow: 'hidden'
  },
  progressFill: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, #C9A84C, #F0D080)',
    boxShadow: '0 0 8px rgba(201,168,76,0.5)',
    transition: 'width 0.4s ease'
  },
  stepCount: { fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 },
  content: {
    flex: 1, padding: '16px 20px 0',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto', overflowX: 'hidden',
    scrollbarWidth: 'none', zIndex: 1
  }
}

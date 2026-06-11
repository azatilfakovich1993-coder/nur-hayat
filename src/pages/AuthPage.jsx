import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { useAuth } from '../hooks/useAuth'
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
import RegisterStep1 from '../components/auth/RegisterStep1'
import RegisterStep3Gender from '../components/auth/RegisterStep3Gender'
import RegisterStep3 from '../components/auth/RegisterStep3'

export default function AuthPage() {
  const navigate = useNavigate()
  const { setProfile } = useAuth()
  const [tab,     setTab]     = useState('login')
  const [regStep, setRegStep] = useState(1)
  const [regData, setRegData] = useState({})
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState('')

  /* ── Вход ── */
  async function handleLogin() {
    setError('')
    setStatus('')
    if (!email || !pass) { setError('Заполните все поля'); return }
    setLoading(true)
    const creds = { email: email.trim().toLowerCase(), password: pass }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) setStatus(`Повтор ${attempt} из 3…`)
        const { error: e } = await withTimeout(
          supabase.auth.signInWithPassword(creds),
          20000,
        )
        if (!e) { navigate('/home'); return }
        const msg = e.message || ''
        if (/invalid|credentials|email/i.test(msg)) {
          setError(friendlyError(msg))
          setLoading(false)
          setStatus('')
          return
        }
        if (attempt === 3) setError(friendlyError(msg))
      } catch {
        if (attempt === 3) {
          setError('Сервер отвечает медленно. Проверьте интернет и попробуйте ещё раз.')
        } else {
          await sleep(1500 * attempt)
        }
      }
    }
    setLoading(false)
    setStatus('')
  }

  /* ── Регистрация — шаги ── */
  function step1Next(data) {
    setRegData(p => ({ ...p, ...data, language: 'ru', translationId: 131 }))
    setRegStep(3)
  }
  function step3Next(data) { setRegData(p => ({ ...p, ...data })); setRegStep(4) }

  async function step4Next(data) {
    const full = { ...regData, ...data }
    setError(''); setLoading(true); setStatus('Создаём аккаунт...')

    try {
      // 1. Создаём аккаунт
      const { data: authData, error: signUpErr } = await withTimeout(
        supabase.auth.signUp({
          email:    full.email,
          password: full.password,
          options:  { data: { name: full.name } }
        }),
        20000,
      )
      if (signUpErr) {
        // Если email уже занят — аккаунт был создан раньше (таймаут), переключаем на вход
        if (signUpErr.message?.includes('already registered') || signUpErr.message?.includes('already been registered')) {
          setEmail(full.email)
          setPass(full.password)
          setTab('login')
          setError('Аккаунт уже создан — войдите с этим email и паролем.')
          return
        }
        setError(friendlyError(signUpErr.message)); return
      }
      if (!authData?.user) { setError('Проверьте почту — мы отправили письмо для подтверждения'); return }

      // 2. Сохраняем профиль и сразу помещаем в контекст, не дожидаясь loadProfile
      setStatus('Сохраняем профиль...')
      const { data: newProfile, error: profileErr } = await withTimeout(
        supabase.from('profiles').insert({
          id:             authData.user.id,
          name:           full.name,
          email:          full.email,
          language:       full.language       || 'ru',
          translation_id: full.translationId  || 131,
          level:          full.level          || 'seeker',
          gender:         full.gender         || null,
          nur:            10,
          streak:         1,
          onboarded:      false
        }).select().single(),
        20000,
      )
      if (profileErr) { setError('Ошибка сохранения профиля'); return }
      setProfile(newProfile)

      navigate('/onboarding')
    } catch {
      setError('Сервер отвечает медленно. Нажмите "Создать аккаунт" ещё раз — если email уже занят, значит аккаунт создан, и можно войти.')
    } finally {
      setLoading(false); setStatus('')
    }
  }

  const switchTab = t => { setTab(t); setError(''); setRegStep(1); setRegData({}) }

  return (
    <div style={s.page}>
      <div style={{ ...s.orb, width: 260, height: 260, top: -80, right: -60 }} />
      <div style={{ ...s.orb, width: 180, height: 180, bottom: 100, left: -40, animationDelay: '4s', opacity: 0.5 }} />

      {/* Логотип */}
      <div style={s.logo}>
        <div style={s.logoAr}>نور حياة</div>
        <div style={s.logoLat}>Нур Хаят</div>
      </div>

      {/* Карточка */}
      <div style={s.card}>
        {/* Вкладки */}
        <div style={s.tabs}>
          <TabBtn active={tab === 'login'}    onClick={() => switchTab('login')}>Войти</TabBtn>
          <TabBtn active={tab === 'register'} onClick={() => switchTab('register')}>Создать аккаунт</TabBtn>
          <div style={{ ...s.tabIndicator, left: tab === 'login' ? 4 : '50%' }} />
        </div>

        {/* Ошибка — заметный баннер вверху карточки */}
        {error && (
          <div style={s.errorBanner} onClick={() => setError('')}>
            ⚠️ {error}
          </div>
        )}

        <div style={s.body} className="scroll-y">
          {tab === 'login' ? (
            <div style={s.form}>
              <div style={s.formInner}>
                <div className="input-wrap">
                  <label className="input-label">Email</label>
                  <input className="input-field" type="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div className="input-wrap">
                  <label className="input-label">Пароль</label>
                  <input className="input-field" type="password" value={pass}
                    onChange={e => setPass(e.target.value)} placeholder="••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? '⏳ Входим...' : 'Войти'}
              </button>
            </div>
          ) : (
            <div style={s.form}>
              <div className="progress-dots">
                {[1,3,4].map(n => (
                  <div key={n} className={`dot ${regStep === n ? 'active' : ''}`} />
                ))}
              </div>
              {regStep === 1 && <RegisterStep1 data={regData} onNext={step1Next} />}
              {regStep === 3 && <RegisterStep3Gender data={regData} onNext={step3Next} onBack={() => setRegStep(1)} />}
              {regStep === 4 && <RegisterStep3 onNext={step4Next} onBack={() => setRegStep(3)} loading={loading} status={status} />}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,-12px)} }
      `}</style>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex:1, background:'none', border:'none', cursor:'pointer',
      padding:'12px 8px', fontSize:14, fontWeight:500,
      color: active ? 'var(--gold)' : 'var(--text-muted)',
      transition:'color 0.2s', zIndex:1, position:'relative',
      fontFamily:'var(--font-ui)'
    }}>{children}</button>
  )
}

function friendlyError(msg = '') {
  if (msg.includes('Invalid login'))      return 'Неверный email или пароль'
  if (msg.includes('already registered')) return 'Этот email уже зарегистрирован'
  if (msg.includes('Password'))           return 'Пароль минимум 6 символов'
  if (msg.includes('valid email'))        return 'Введите корректный email'
  if (msg.includes('Network'))            return 'Нет соединения с сетью'
  return 'Что-то пошло не так. Попробуй снова'
}

const s = {
  page: {
    height:'100%', background:'var(--bg-deep)',
    display:'flex', flexDirection:'column', alignItems:'center',
    paddingTop:'calc(var(--safe-top) + 40px)',
    paddingBottom:'calc(var(--safe-bottom) + 20px)',
    gap:24, position:'relative', overflow:'hidden'
  },
  orb: {
    position:'absolute', borderRadius:'50%',
    background:'radial-gradient(circle,rgba(201,168,76,.1) 0%,transparent 70%)',
    filter:'blur(50px)', pointerEvents:'none', animation:'orbFloat 9s ease-in-out infinite'
  },
  logo: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, zIndex:1 },
  logoAr: {
    fontFamily:"'Scheherazade New',serif", fontSize:36, fontWeight:700,
    color:'var(--gold)', textShadow:'0 0 20px rgba(201,168,76,.5)'
  },
  logoLat: { fontSize:12, letterSpacing:'.2em', color:'var(--text-muted)', textTransform:'uppercase' },
  card: {
    background:'var(--bg-surface)', borderRadius:'var(--radius-xl)',
    border:'1px solid var(--border)', width:'calc(100% - 32px)', maxWidth:390,
    flex:1, display:'flex', flexDirection:'column', overflow:'hidden', zIndex:1,
    boxShadow:'0 20px 60px rgba(0,0,0,.4)'
  },
  tabs: { display:'flex', position:'relative', borderBottom:'1px solid var(--border)', flexShrink:0 },
  tabIndicator: {
    position:'absolute', bottom:-1, height:2, width:'50%',
    background:'linear-gradient(90deg,transparent,var(--gold),transparent)',
    transition:'left .3s ease', borderRadius:1
  },
  body:      { flex:1, padding:20, overflowY:'auto' },
  form:      { display:'flex', flexDirection:'column', gap:16, minHeight:'100%' },
  formInner: { display:'flex', flexDirection:'column', gap:14, flex:1 },
  errorBanner: {
    background:'rgba(220,53,69,.15)', borderBottom:'1px solid rgba(220,53,69,.3)',
    color:'#ff6b6b', fontSize:13, padding:'12px 16px',
    cursor:'pointer', flexShrink:0, lineHeight:1.4,
  }
}

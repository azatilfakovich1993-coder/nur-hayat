import { useState, useEffect, useRef, lazy, Suspense, createContext, useContext, Component } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { usePushNotifications } from './hooks/usePushNotifications'
import { useFcmToken } from './hooks/useFcmToken'
import { supabase } from './supabase/client'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import BottomNav           from './components/ui/BottomNav'
import NurMilestoneModal   from './components/NurMilestoneModal'
import './styles/index.css'

export const ThemeContext    = createContext(null)
export const ChatUnreadCtx   = createContext({ unread: 0, resetUnread: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

const SplashPage      = lazy(() => import('./pages/SplashPage'))
const AuthPage        = lazy(() => import('./pages/AuthPage'))
const OnboardingPage  = lazy(() => import('./pages/OnboardingPage'))
const HomePage        = lazy(() => import('./pages/HomePage'))
const QuranPage       = lazy(() => import('./pages/QuranPage'))
const SuraPage        = lazy(() => import('./pages/SuraPage'))
const ProfilePage     = lazy(() => import('./pages/ProfilePage'))
const ChatPage        = lazy(() => import('./pages/ChatPage'))
const PrayerPage      = lazy(() => import('./pages/PrayerPage'))
const LearnPage       = lazy(() => import('./pages/LearnPage'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/auth" replace />
  return children
}

function OnboardGuard({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/auth" replace />
  if (profile && !profile.onboarded) return <Navigate to="/onboarding" replace />
  return children
}

// Трекер непрочитанных сообщений чата
function ChatUnreadProvider({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const onChat = location.pathname === '/chat'

  // Сбрасываем счётчик и сохраняем время когда заходим в чат
  useEffect(() => {
    if (onChat) {
      setUnread(0)
      if (user) localStorage.setItem('chat-last-read-' + user.id, new Date().toISOString())
    }
  }, [onChat, user?.id])

  // При запуске считаем непрочитанные из БД
  useEffect(() => {
    if (!user) return
    const lastRead = localStorage.getItem('chat-last-read-' + user.id) || '1970-01-01T00:00:00Z'
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('user_id', user.id)
      .gt('created_at', lastRead)
      .then(({ count }) => {
        if (count > 0) setUnread(count)
      })
  }, [user?.id])

  // Realtime: считаем новые сообщения пока не в чате
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('unread-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: msg }) => {
          if (msg.user_id !== user.id && location.pathname !== '/chat') {
            setUnread(n => n + 1)
          }
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  return (
    <ChatUnreadCtx.Provider value={{ unread, resetUnread: () => setUnread(0) }}>
      {children}
    </ChatUnreadCtx.Provider>
  )
}

// Обёртка для экранов с нижней навигацией
function AppShell({ children }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      <BottomNav />
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false, msg: '' } }
  static getDerivedStateFromError(e) { return { error: true, msg: e?.message || String(e) } }
  render() {
    if (this.state.error) return (
      <div style={{ height:'100%', background:'#070710', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
        <div style={{ fontSize:40 }}>🔄</div>
        <div style={{ color:'#C9A84C', fontSize:18, fontWeight:600 }}>Что-то пошло не так</div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, textAlign:'center', wordBreak:'break-all', maxWidth:320 }}>{this.state.msg}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop:8, padding:'12px 32px', background:'#C9A84C', color:'#070710', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer' }}>
          Перезагрузить
        </button>
      </div>
    )
    return this.props.children
  }
}

function LoadingScreen() {
  return (
    <div style={{ height:'100%', background:'#070710', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:36, color:'rgba(201,168,76,0.6)', animation:'pulse 1.5s ease-in-out infinite' }}>
        نور
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.95)} 50%{opacity:1;transform:scale(1.05)} }`}</style>
    </div>
  )
}

function BismillahSplash({ onDone }) {
  const [visible, setVisible] = useState(false)
  const [gone,    setGone]    = useState(false)

  useEffect(() => {
    // fade-in: дать браузеру один кадр чтобы DOM появился, потом включить opacity
    const t0 = setTimeout(() => setVisible(true), 50)
    // fade-out
    const t1 = setTimeout(() => setVisible(false), 2200)
    // убрать из DOM после завершения анимации
    const t2 = setTimeout(() => { setGone(true); onDone?.() }, 2950)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#070710',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.7s ease',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: "'Scheherazade New', serif",
        fontSize: 34,
        color: '#C9A84C',
        textAlign: 'center',
        lineHeight: 1.6,
        direction: 'rtl',
      }}>
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </div>
      <div style={{ fontSize: 13, color: 'rgba(201,168,76,0.65)', letterSpacing: 0.5, textAlign: 'center' }}>
        Bismi Allāhi ar-Raḥmāni ar-Raḥīm
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        Во имя Аллаха, Милостивого, Милосердного
      </div>
    </div>
  )
}

function PushSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  usePushNotifications(user)
  useFcmToken(user, navigate)
  return null
}

function MilestoneListener() {
  const [milestone, setMilestone] = useState(null)
  useEffect(() => {
    const handler = (e) => setMilestone(e.detail)
    window.addEventListener('nur-milestone', handler)
    return () => window.removeEventListener('nur-milestone', handler)
  }, [])
  return <NurMilestoneModal milestone={milestone} onClose={() => setMilestone(null)} />
}

function BackButtonHandler() {
  const navigate = useNavigate()
  const lastBackRef = useRef(0)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1)
        return
      }
      const now = Date.now()
      if (now - lastBackRef.current < 2000) {
        CapApp.exitApp()
      } else {
        lastBackRef.current = now
        CapApp.minimizeApp()
      }
    })

    return () => { handler.then(h => h.remove()) }
  }, [navigate])

  return null
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('arabic_font_size')) || 24)
  const [showBismillah] = useState(() => !sessionStorage.getItem('bismillah_shown'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--arabic-size', fontSize + 'px')
    localStorage.setItem('arabic_font_size', fontSize)
  }, [fontSize])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
    <AuthProvider>
      <HashRouter>
        <ChatUnreadProvider>
        <BackButtonHandler />
        <PushSetup />
        <MilestoneListener />
        {showBismillah && <BismillahSplash onDone={() => sessionStorage.setItem('bismillah_shown', '1')} />}
        <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/"           element={<SplashPage />} />
          <Route path="/auth"       element={<AuthPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

          {/* Экраны с нижней навигацией */}
          <Route path="/home"    element={<OnboardGuard><AppShell><HomePage /></AppShell></OnboardGuard>} />
          <Route path="/quran"   element={<OnboardGuard><AppShell><QuranPage /></AppShell></OnboardGuard>} />
          <Route path="/profile" element={<OnboardGuard><AppShell><ProfilePage /></AppShell></OnboardGuard>} />
          <Route path="/prayer"  element={<OnboardGuard><AppShell><PrayerPage /></AppShell></OnboardGuard>} />
          <Route path="/chat"    element={<OnboardGuard><AppShell><ChatPage /></AppShell></OnboardGuard>} />
          <Route path="/learn"   element={<OnboardGuard><AppShell><LearnPage /></AppShell></OnboardGuard>} />

          {/* Читалка суры — без нижней навигации */}
          <Route path="/quran/:id" element={<OnboardGuard><SuraPage /></OnboardGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        </ChatUnreadProvider>
      </HashRouter>
    </AuthProvider>
    </ThemeContext.Provider>
  )
}

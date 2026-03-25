import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import SplashPage     from './pages/SplashPage'
import AuthPage       from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage       from './pages/HomePage'
import QuranPage      from './pages/QuranPage'
import SuraPage       from './pages/SuraPage'
import ProfilePage    from './pages/ProfilePage'
import ChatPage       from './pages/ChatPage'
import PrayerPage     from './pages/PrayerPage'
import BottomNav      from './components/ui/BottomNav'
import './styles/index.css'

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

// Обёртка для экранов с нижней навигацией
function AppShell({ children }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      <BottomNav />
    </div>
  )
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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

          {/* Читалка суры — без нижней навигации */}
          <Route path="/quran/:id" element={<OnboardGuard><SuraPage /></OnboardGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

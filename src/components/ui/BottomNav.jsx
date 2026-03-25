import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/home',    icon: '⌂',  label: 'Главная' },
  { path: '/quran',   icon: '📖', label: 'Коран'   },
  { path: '/prayer',  icon: '🕌', label: 'Намаз'   },
  { path: '/chat',    icon: '💬', label: 'Чат'     },
  { path: '/profile', icon: '◎',  label: 'Профиль' },
]

export default function BottomNav() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  const active = TABS.find(t => pathname === t.path || pathname.startsWith(t.path + '/'))?.path || '/home'

  return (
    <div style={s.nav}>
      {TABS.map(tab => {
        const isActive = active === tab.path
        return (
          <button
            key={tab.path}
            style={{
              ...s.btn,
              color: isActive ? 'var(--gold)' : 'var(--text-dim)'
            }}
            onClick={() => navigate(tab.path)}
          >
            <span style={{ fontSize: 21, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--gold)' : 'var(--text-dim)'
            }}>
              {tab.label}
            </span>
            {isActive && <div style={s.dot} />}
          </button>
        )
      })}
    </div>
  )
}

const s = {
  nav: {
    display: 'flex',
    background: 'var(--bg-surface)',
    borderTop: '1px solid var(--border)',
    paddingBottom: 'calc(var(--safe-bottom) + 4px)',
    flexShrink: 0, zIndex: 20
  },
  btn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, padding: '10px 4px 6px',
    background: 'none', border: 'none', cursor: 'pointer',
    position: 'relative', outline: 'none', fontFamily: 'var(--font-ui)',
    transition: 'color .2s'
  },
  dot: {
    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
    width: 4, height: 4, borderRadius: '50%',
    background: 'var(--gold)', boxShadow: '0 0 6px rgba(201,168,76,.7)'
  }
}

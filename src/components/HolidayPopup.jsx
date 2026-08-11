import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { EVENTS_BY_YEAR, ISLAMIC_EVENTS } from '../data/islamic-calendar'
import { getEidToday, shareEidGreeting } from '../utils/eidGreeting'
import { localDateStr } from '../utils/date'

const EVENT_META = Object.fromEntries(ISLAMIC_EVENTS.map(e => [e.id, e]))
const EID_IDS = ['fitr', 'adha']

// Дата берётся по МЕСТНОМУ времени. toISOString() возвращает UTC, а в поясах
// впереди UTC (вся аудитория приложения) местная дата наступает раньше: ночью,
// с полуночи и до +3/+4 часов, UTC-дата ещё вчерашняя. В эти часы праздник
// считался ненаступившим, а напоминание «за 3 дня» срабатывало на сутки раньше.
function todayStr() {
  return localDateStr()
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

// День праздника важнее «за 3 дня» — если оба совпадают (не должно, но на
// всякий случай), показываем день праздника.
function findTodayMatch() {
  const today = todayStr()
  const year = new Date().getFullYear()
  const events = [...(EVENTS_BY_YEAR[year] || []), ...(EVENTS_BY_YEAR[year + 1] || [])]
    .filter(e => EVENT_META[e.id])

  const dayOf = events.find(e => e.date === today)
  if (dayOf) return { event: dayOf, phase: 'today' }

  const soon = events.find(e => addDays(e.date, -3) === today)
  if (soon) return { event: soon, phase: 'soon' }

  return null
}

// Не мешаем экрану входа/онбординга праздничным попапом — только реальные
// экраны приложения после того как пользователь уже внутри.
const EXCLUDED_PATHS = ['/', '/auth', '/onboarding']

export default function HolidayPopup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [match, setMatch] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!user || EXCLUDED_PATHS.includes(location.pathname)) return
    const found = findTodayMatch()
    if (!found) return
    const key = `holiday_popup_${todayStr()}_${found.event.id}_${found.phase}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    setMatch(found)
  }, [user?.id, location.pathname])

  if (!match) return null

  const meta = EVENT_META[match.event.id]
  const isEidToday = match.phase === 'today' && EID_IDS.includes(match.event.id)
  const eid = isEidToday ? getEidToday() : null
  const eidDua = eid?.eidDua
  const eidName = eid?.eidName || meta.short.split(' — ')[0]
  const quoteTip = (meta.tips || []).find(t => t.includes('«')) || meta.tips?.[0]

  function close() { setMatch(null) }

  function openDetails() {
    close()
    navigate('/learn', { state: { openSection: 'calendar', eventId: match.event.id } })
  }

  async function handleShare() {
    if (sharing || !eid) return
    setSharing(true)
    try {
      await shareEidGreeting(eid)
    } catch (err) {
      console.warn('[HolidayPopup] share failed:', err?.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div style={s.overlay} onClick={close}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={close}>✕</button>

        {isEidToday ? (
          <>
            <div style={s.eidTop}>Сегодня праздник</div>
            <div style={s.eidOrnamentWrap}>
              <div style={s.eidGlow} />
              <div style={s.eidStar}>
                <div style={s.eidDiamond} />
                <div style={{ ...s.eidDiamond, transform: 'rotate(45deg)', opacity: .82 }} />
              </div>
            </div>
            {eidDua && (
              <>
                <div style={s.eidGreetingAr} className="arabic">{eidDua.ar}</div>
                <div style={s.eidGreetingRu}>«{eidDua.translit}»</div>
              </>
            )}
            <div style={s.eidTitle}>С {eidName}!</div>
            <div style={s.eidSub}>Пусть Аллах примет твой пост и молитвы в этот благословенный день. Поздравь родных — и раздели радость с друзьями.</div>
            <button style={s.eidShareBtn} onClick={handleShare} disabled={sharing || !eidDua}>
              {sharing ? 'Готовим картинку...' : '↗ Поделиться поздравлением'}
            </button>
            <button style={s.btnGhost} onClick={close}>Закрыть</button>
          </>
        ) : (
          <>
            <div style={{
              ...s.badgeSoon,
              color: meta.color, background: meta.color + '22', borderColor: meta.color + '4d',
            }}>
              {match.phase === 'soon' ? 'Через 3 дня' : 'Сегодня'}
            </div>
            <div style={{ ...s.iconRing, background: meta.color + '24' }}>{meta.icon}</div>
            <div style={s.titleAr} className="arabic">{meta.titleAr}</div>
            <div style={s.title}>{meta.title}</div>
            <div style={s.sub}>{meta.short}</div>
            {quoteTip && (
              <div style={{ ...s.quote, background: meta.color + '12', borderColor: meta.color + '30' }}>
                <div style={s.quoteText}>{quoteTip}</div>
              </div>
            )}
            <button style={{ ...s.btnPrimary, background: `linear-gradient(135deg, ${meta.color}aa, ${meta.color})` }} onClick={openDetails}>
              Подробнее →
            </button>
            <button style={s.btnGhost} onClick={close}>Понятно</button>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9998,
    background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    position: 'relative', width: '100%', maxWidth: 340,
    background: 'linear-gradient(160deg, #12121e 0%, #1a1a2e 60%, #0d0d18 100%)',
    border: '1px solid rgba(201,168,76,.3)', borderRadius: 26,
    padding: '30px 24px 26px', textAlign: 'center',
    boxShadow: '0 24px 70px rgba(0,0,0,.55)', fontFamily: 'var(--font-ui)',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: '50%',
    background: 'rgba(255,255,255,.06)', border: 'none', color: 'rgba(245,240,232,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer',
  },

  // ── обычная карточка (за 3 дня / сегодня, не Ид) ──
  badgeSoon: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
    letterSpacing: '.05em', textTransform: 'uppercase',
    border: '1px solid', borderRadius: 20, padding: '4px 11px', marginBottom: 16,
  },
  iconRing: {
    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
  },
  titleAr: { fontFamily: "'Scheherazade New', serif", fontSize: 19, color: 'var(--gold-soft)', direction: 'rtl', marginBottom: 4 },
  title:   { fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  sub:     { fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 },
  quote: {
    textAlign: 'left', border: '1px solid', borderRadius: 14, padding: '12px 14px', marginBottom: 20,
  },
  quoteText: { fontSize: 12.5, lineHeight: 1.55, color: 'var(--text)', fontStyle: 'italic' },
  btnPrimary: {
    width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
    color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-ui)', cursor: 'pointer',
  },
  btnGhost: {
    width: '100%', padding: '12px 0', borderRadius: 14, marginTop: 8,
    border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)',
    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer',
  },

  // ── поздравление Ид ──
  eidTop: { fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(201,168,76,.65)', marginBottom: 16 },
  eidOrnamentWrap: { position: 'relative', width: 78, height: 78, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  eidGlow: {
    position: 'absolute', width: 120, height: 120, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.35) 0%, transparent 70%)',
    filter: 'blur(12px)', animation: 'holidayEidPulse 2.6s ease-in-out infinite',
  },
  eidStar: { position: 'relative', width: 52, height: 52, zIndex: 1 },
  eidDiamond: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg,#f0d080,#9a6a10)',
    clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
    boxShadow: '0 0 20px rgba(201,168,76,.45)',
  },
  eidGreetingAr: { fontFamily: "'Scheherazade New', serif", fontSize: 22, color: 'var(--gold)', direction: 'rtl', marginBottom: 8, lineHeight: 1.5 },
  eidGreetingRu: { fontSize: 13.5, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 4 },
  eidTitle: { fontSize: 23, fontWeight: 900, color: 'var(--text)', margin: '14px 0 6px' },
  eidSub:   { fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.5 },
  eidShareBtn: {
    width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)', color: '#fff',
    fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-ui)', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(201,168,76,.25)',
  },
}

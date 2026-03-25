import { useState, useEffect, useRef } from 'react'
import { fetchVerse } from '../../utils/fetchVerse'

const THEMES = [
  { id: 'love',        label: 'Любовь',       labelAr: 'الحب',    key: '3:31',  color: '#C9A84C' },
  { id: 'forgiveness', label: 'Прощение',     labelAr: 'المغفرة', key: '39:53', color: '#7B6BAE' },
  { id: 'hope',        label: 'Надежда',      labelAr: 'الأمل',   key: '94:5',  color: '#4A90D9' },
  { id: 'patience',    label: 'Терпение',     labelAr: 'الصبر',   key: '2:153', color: '#2D9E6B' },
  { id: 'strength',    label: 'Сила',         labelAr: 'القوة',   key: '3:139', color: '#D45A3A' },
  { id: 'gratitude',   label: 'Благодарность',labelAr: 'الشكر',   key: '14:7',  color: '#40916C' },
]

export default function OnboardStep1({ onNext, translationId }) {
  const [idx,      setIdx]      = useState(0)
  const [verses,   setVerses]   = useState({})
  const [loading,  setLoading]  = useState(true)
  const [dragging, setDragging] = useState(false)
  const [startX,   setStartX]   = useState(0)
  const [offsetX,  setOffsetX]  = useState(0)
  const cardRef = useRef()

  const theme = THEMES[idx]
  const isLast = idx === THEMES.length - 1

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchVerse(THEMES[idx].key, translationId)
      setVerses(prev => ({ ...prev, [THEMES[idx].key]: data }))
      setLoading(false)
      if (idx + 1 < THEMES.length) {
        fetchVerse(THEMES[idx + 1].key, translationId).then(d =>
          setVerses(prev => ({ ...prev, [THEMES[idx + 1].key]: d }))
        )
      }
    }
    if (!verses[THEMES[idx].key]) load()
    else setLoading(false)
  }, [idx, translationId])

  function goNext() {
    if (!isLast) {
      setIdx(v => v + 1)
      setOffsetX(0)
    } else {
      onNext()
    }
  }

  function goPrev() {
    if (idx > 0) { setIdx(v => v - 1); setOffsetX(0) }
  }

  // ── Touch ──
  function onTouchStart(e) { setStartX(e.touches[0].clientX); setDragging(true) }
  function onTouchMove(e)  { if (dragging) setOffsetX(e.touches[0].clientX - startX) }
  function onTouchEnd()    { if (offsetX < -50) goNext(); else if (offsetX > 50) goPrev(); setOffsetX(0); setDragging(false) }

  // ── Mouse (desktop) ──
  function onMouseDown(e) { setStartX(e.clientX); setDragging(true) }
  function onMouseMove(e) { if (dragging) setOffsetX(e.clientX - startX) }
  function onMouseUp()    { if (offsetX < -50) goNext(); else if (offsetX > 50) goPrev(); setOffsetX(0); setDragging(false) }
  function onMouseLeave() { if (dragging) { setOffsetX(0); setDragging(false) } }

  const verse = verses[theme.key]

  return (
    <div style={s.wrap}>

      {/* Theme pills */}
      <div style={s.pills}>
        {THEMES.map((t, i) => (
          <button key={t.id} style={{
            ...s.pill,
            ...(i === idx ? { background: t.color + '33', borderColor: t.color, color: t.color } : {})
          }} onClick={() => setIdx(i)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Card + nav arrows row */}
      <div style={s.cardRow}>

        {/* Prev arrow */}
        <button style={{ ...s.arrow, opacity: idx > 0 ? 1 : 0.15 }} onClick={goPrev} disabled={idx === 0}>
          ←
        </button>

        {/* Card */}
        <div
          ref={cardRef}
          style={{
            ...s.card,
            borderColor: theme.color + '40',
            transform:  `translateX(${offsetX}px) rotate(${offsetX * 0.015}deg)`,
            transition: dragging ? 'none' : 'transform 0.3s ease',
            opacity:    loading ? 0.5 : 1,
            cursor:     dragging ? 'grabbing' : 'grab',
          }}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}   onMouseMove={onMouseMove}  onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <div style={{ ...s.glow, background: theme.color + '1a' }} />

          <div style={{ ...s.badge, color: theme.color, borderColor: theme.color + '40' }}>
            <span style={s.badgeAr}>{theme.labelAr}</span>
            <span style={s.badgeLat}>{theme.label}</span>
          </div>

          {loading ? (
            <div style={s.loader}>
              <div style={{ ...s.loaderDot, animationDelay: '0s' }} />
              <div style={{ ...s.loaderDot, animationDelay: '0.2s' }} />
              <div style={{ ...s.loaderDot, animationDelay: '0.4s' }} />
            </div>
          ) : (
            <>
              {verse?.arabic && (
                <div style={s.arabic} className="arabic">{verse.arabic}</div>
              )}
              <div style={{ ...s.divider, background: `linear-gradient(90deg,transparent,${theme.color}60,transparent)` }} />
              <div style={s.translation}>{verse?.translation}</div>
              <div style={s.ref}>Коран, {verse?.ref}</div>
            </>
          )}
        </div>

        {/* Next arrow */}
        <button style={{ ...s.arrow, color: theme.color, borderColor: theme.color + '60' }} onClick={goNext}>
          {isLast ? '✓' : '→'}
        </button>
      </div>

      {/* Hint */}
      <div style={s.hint}>
        <span>← перетащи карточку или нажми стрелку →</span>
      </div>

      {/* Dots */}
      <div style={s.dots}>
        {THEMES.map((t, i) => (
          <div key={i} style={{
            ...s.dot,
            width:      i === idx ? 20 : 6,
            background: i === idx ? t.color : 'var(--text-dim)',
            boxShadow:  i === idx ? `0 0 6px ${t.color}` : 'none'
          }} />
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%,100% { transform:scale(0.6); opacity:0.4; }
          50%      { transform:scale(1);   opacity:1; }
        }
      `}</style>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1 },

  pills: {
    display: 'flex', gap: 8, overflowX: 'auto', width: '100%',
    paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
  },
  pill: {
    flexShrink: 0, padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', transition: 'all 0.2s ease', outline: 'none'
  },

  cardRow: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%'
  },

  arrow: {
    flexShrink: 0,
    width: 38, height: 38, borderRadius: '50%',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontSize: 16, cursor: 'pointer', outline: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-ui)',
    userSelect: 'none'
  },

  card: {
    flex: 1,
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid',
    padding: '22px 20px',
    display: 'flex', flexDirection: 'column', gap: 14,
    position: 'relative', overflow: 'hidden',
    minHeight: 260,
    userSelect: 'none',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
  },
  glow: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: '50%',
    filter: 'blur(40px)', pointerEvents: 'none'
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: 8,
    border: '1px solid', borderRadius: 20,
    padding: '4px 12px', alignSelf: 'flex-start'
  },
  badgeAr:  { fontFamily: "'Amiri', serif", fontSize: 15 },
  badgeLat: { fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' },

  arabic: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 22, lineHeight: 1.9,
    color: 'var(--gold-light)',
    textAlign: 'center', direction: 'rtl'
  },
  divider:     { height: 1, borderRadius: 1 },
  translation: { fontSize: 14, color: 'var(--text)', lineHeight: 1.7, textAlign: 'center' },
  ref:         { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' },

  hint: { fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' },

  dots: { display: 'flex', gap: 6, alignItems: 'center' },
  dot:  { height: 6, borderRadius: 3, transition: 'all 0.3s ease' },

  loader: { display: 'flex', gap: 8, justifyContent: 'center', padding: '40px 0' },
  loaderDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'var(--gold-dim)',
    animation: 'dotPulse 1.2s ease-in-out infinite'
  }
}

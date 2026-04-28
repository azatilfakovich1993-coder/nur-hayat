import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { ADHKAR, DAILY_DHIKR } from '../data/adhkar'

// Зикр дня меняется каждый день
const todayDhikr = DAILY_DHIKR[new Date().getDate() % DAILY_DHIKR.length]

export default function Adhkar({ onClose }) {
  const swipe    = useSwipeDown(onClose)
  const now = new Date().getHours()
  const defaultTab = (now >= 4 && now < 15) ? 'morning' : 'evening'

  const [tab,      setTab]      = useState(defaultTab)
  const [counts,   setCounts]   = useState({})   // id → сколько раз нажато
  const [current,  setCurrent]  = useState(0)    // индекс активной карточки
  const [done,     setDone]     = useState(false)

  const list = ADHKAR[tab]
  const total = list.length
  const completedCount = list.filter(d => (counts[d.id] || 0) >= d.count).length

  function switchTab(t) {
    setTab(t)
    setCounts({})
    setCurrent(0)
    setDone(false)
  }

  function handleTap() {
    const dhikr = list[current]
    const prev = counts[dhikr.id] || 0
    const next = prev + 1
    setCounts(c => ({ ...c, [dhikr.id]: next }))

    if (next >= dhikr.count) {
      if (current < total - 1) {
        setTimeout(() => setCurrent(i => i + 1), 400)
      } else {
        setTimeout(() => setDone(true), 400)
      }
    }
  }

  function reset() {
    setCounts({})
    setCurrent(0)
    setDone(false)
  }

  const dhikr   = list[current]
  const pressed = counts[dhikr?.id] || 0
  const remaining = dhikr ? dhikr.count - pressed : 0
  const progress  = dhikr ? pressed / dhikr.count : 0

  if (done) return (
    <div style={s.wrap} {...swipe}>
      <div style={s.head}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ ...s.doneWrap, overflowY:'auto' }}>
        <div style={s.doneIcon}>🤲</div>
        <div style={s.doneTitle}>Азкар завершены</div>
        <div style={s.doneAr} className="arabic gold-shimmer">
          {tab === 'morning' ? 'أَذْكَارُ الصَّبَاحِ' : 'أَذْكَارُ الْمَسَاءِ'}
        </div>
        <div style={s.doneText}>
          Да примет Аллах твои {tab === 'morning' ? 'утренние' : 'вечерние'} поминания.
          Ты защищён до {tab === 'morning' ? 'вечера' : 'утра'} بإذن الله
        </div>

        {/* Зикр дня */}
        <div style={s.dailyCard}>
          <div style={s.dailyLabel}>✨ Зикр дня</div>
          <div style={s.dailyAr} className="arabic gold-shimmer">{todayDhikr.ar}</div>
          <div style={s.dailyTranslit}>{todayDhikr.transliteration}</div>
          <div style={s.dailyTranslation}>{todayDhikr.translation}</div>
          <div style={s.dailySource}>{todayDhikr.source}</div>
        </div>

        <button style={s.resetBtn} onClick={reset}>Читать снова</button>
        <button style={s.closeFullBtn} onClick={onClose}>Закрыть</button>
      </div>
    </div>
  )

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={s.head}>
        <div style={s.headTop}>
          <div style={s.headTitle}>🤲 Азкар</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'morning' ? s.tabActive : {}) }}
            onClick={() => switchTab('morning')}
          >🌅 Утренние</button>
          <button
            style={{ ...s.tab, ...(tab === 'evening' ? s.tabActive : {}) }}
            onClick={() => switchTab('evening')}
          >🌙 Вечерние</button>
        </div>
      </div>

      {/* Прогресс */}
      <div style={s.progressWrap}>
        <div style={s.progressRow}>
          <span style={s.progressText}>{completedCount} из {total}</span>
          <span style={s.progressText}>{current + 1} / {total}</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ ...s.progressFill, width: `${(completedCount / total) * 100}%` }} />
        </div>
      </div>

      {/* Карточка — скроллируемый текст */}
      <div style={s.cardWrap}>
        <div style={s.card} key={dhikr.id}>
          <div style={s.countBadge}>
            {pressed >= dhikr.count
              ? <span style={s.countDone}>✓ Прочитано</span>
              : <><span style={s.countNum}>{remaining}</span><span style={s.countLabel}> раз осталось</span></>
            }
          </div>
          <div style={s.arabic} className="arabic gold-shimmer">{dhikr.ar}</div>
          <div style={s.divider} />
          <div style={s.translit}>{dhikr.transliteration}</div>
          <div style={s.translation}>{dhikr.translation}</div>
          <div style={s.source}>{dhikr.source}</div>
        </div>
      </div>

      {/* Кнопка нажатия + навигация — фиксированы снизу */}
      <div style={s.bottomPanel}>
        <button
          style={{ ...s.navBtn, opacity: current > 0 ? 1 : 0.3 }}
          onClick={() => current > 0 && setCurrent(i => i - 1)}
          disabled={current === 0}
        >← Назад</button>

        <div style={s.tapArea} onClick={pressed < dhikr.count ? handleTap : undefined}>
          <svg width={80} height={80} style={{ position:'absolute' }}>
            <circle cx={40} cy={40} r={35} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={4} />
            <circle
              cx={40} cy={40} r={35} fill="none"
              stroke={pressed >= dhikr.count ? '#52b788' : 'var(--gold)'}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress)}`}
              transform="rotate(-90 40 40)"
              style={{ transition:'stroke-dashoffset .3s ease, stroke .3s' }}
            />
          </svg>
          <div style={s.tapInner}>
            {pressed >= dhikr.count
              ? <span style={{ fontSize:22 }}>✓</span>
              : <>
                  <span style={s.tapCount}>{dhikr.count > 1 ? `×${dhikr.count}` : '×1'}</span>
                  <span style={s.tapHint}>нажми</span>
                </>
            }
          </div>
        </div>

        <button
          style={{ ...s.navBtn, opacity: current < total - 1 ? 1 : 0.3 }}
          onClick={() => current < total - 1 && setCurrent(i => i + 1)}
          disabled={current === total - 1}
        >Далее →</button>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position:'fixed', inset:0, zIndex:95,
    background:'var(--bg-deep)', display:'flex', flexDirection:'column',
    fontFamily:'var(--font-ui)'
  },
  head: {
    display:'flex', flexDirection:'column', gap:8,
    padding:'12px 16px 0', flexShrink:0
  },
  headTop: {
    display:'flex', alignItems:'center', justifyContent:'space-between'
  },
  headTitle: { fontSize:17, fontWeight:700, color:'var(--text)' },
  tabs: { display:'flex', gap:8 },
  tab: {
    padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)',
    background:'transparent', color:'var(--text-muted)', fontSize:13,
    fontWeight:500, cursor:'pointer', fontFamily:'var(--font-ui)', outline:'none',
    transition:'all .2s'
  },
  tabActive: {
    background:'rgba(201,168,76,.12)', borderColor:'rgba(201,168,76,.4)',
    color:'var(--gold)', fontWeight:600
  },
  closeBtn: {
    width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:16,
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    outline:'none', fontFamily:'var(--font-ui)', flexShrink:0
  },

  progressWrap: { padding:'8px 16px 0', flexShrink:0 },
  progressRow: { display:'flex', justifyContent:'space-between', marginBottom:4 },
  progressText: { fontSize:11, color:'var(--text-muted)' },
  progressBar: { height:4, borderRadius:2, background:'rgba(255,255,255,.07)', overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2, background:'linear-gradient(90deg,#C9A84C,#F0D080)', transition:'width .4s ease' },

  cardWrap: { flex:1, overflowY:'auto', padding:'8px 16px 0', WebkitOverflowScrolling:'touch' },
  card: {
    background:'var(--bg-card)', borderRadius:20,
    border:'1px solid var(--border)', padding:'14px 16px',
    display:'flex', flexDirection:'column', gap:10,
  },
  bottomPanel: {
    flexShrink:0, display:'flex', flexDirection:'row', alignItems:'center',
    justifyContent:'space-between',
    padding:'8px 16px 12px',
    borderTop:'1px solid var(--border)', background:'var(--bg-deep)'
  },

  countBadge: { display:'flex', justifyContent:'flex-end' },
  countDone: { fontSize:12, fontWeight:600, color:'#52b788', background:'rgba(82,183,136,.1)', padding:'3px 10px', borderRadius:12 },
  countNum: { fontSize:18, fontWeight:700, color:'var(--gold)' },
  countLabel: { fontSize:12, color:'var(--text-muted)' },

  arabic: {
    fontFamily:"'Scheherazade New',serif",
    fontSize:'var(--arabic-size)', lineHeight:1.85, direction:'rtl',
    textAlign:'center', whiteSpace:'pre-line'
  },
  divider: { height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25),transparent)', flexShrink:0 },
  translit: { fontSize:12, color:'var(--text-translit)', lineHeight:1.55, fontStyle:'italic', textAlign:'center' },
  translation: { fontSize:13, color:'var(--text)', lineHeight:1.65, textAlign:'center' },
  source: { fontSize:11, color:'var(--text-muted)', textAlign:'center', lineHeight:1.4, borderTop:'1px solid var(--border)', paddingTop:8 },

  tapArea: {
    width:80, height:80, position:'relative', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0
  },
  tapInner: { display:'flex', flexDirection:'column', alignItems:'center', gap:1, color:'var(--gold)' },
  tapCount: { fontSize:18, fontWeight:700 },
  tapHint: { fontSize:10, color:'var(--text-muted)' },

  navBtn: {
    padding:'8px 14px', borderRadius:12, border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text-muted)', fontSize:13,
    cursor:'pointer', fontFamily:'var(--font-ui)', outline:'none', transition:'opacity .2s'
  },

  // Done screen
  doneWrap: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', gap:16, padding:'0 32px'
  },
  doneIcon: { fontSize:56 },
  doneTitle: { fontSize:22, fontWeight:700, color:'var(--text)' },
  doneAr: { fontFamily:"'Scheherazade New',serif", fontSize:'var(--arabic-size)', direction:'rtl', textAlign:'center' },
  doneText: { fontSize:14, color:'var(--text-muted)', textAlign:'center', lineHeight:1.7 },
  dailyCard: {
    width:'100%', background:'rgba(201,168,76,.06)', borderRadius:18,
    border:'1px solid rgba(201,168,76,.2)', padding:'16px',
    display:'flex', flexDirection:'column', gap:10, textAlign:'center'
  },
  dailyLabel: { fontSize:12, fontWeight:700, color:'var(--gold)', letterSpacing:'.08em', textTransform:'uppercase' },
  dailyAr: { fontFamily:"'Scheherazade New',serif", fontSize:'var(--arabic-size)', lineHeight:1.9, direction:'rtl' },
  dailyTranslit: { fontSize:12, color:'var(--text-translit)', fontStyle:'italic', lineHeight:1.5 },
  dailyTranslation: { fontSize:13, color:'var(--text)', lineHeight:1.6 },
  dailySource: { fontSize:11, color:'var(--text-muted)', lineHeight:1.4 },

  resetBtn: {
    marginTop:8, padding:'12px 32px', borderRadius:20,
    border:'1px solid rgba(201,168,76,.3)', background:'rgba(201,168,76,.08)',
    color:'var(--gold)', fontSize:14, fontWeight:600, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none'
  },
  closeFullBtn: {
    padding:'12px 32px', borderRadius:20,
    border:'1px solid var(--border)', background:'var(--bg-card)',
    color:'var(--text-muted)', fontSize:14, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none'
  },
}

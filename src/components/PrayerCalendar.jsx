import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const PRAYER_RU    = { Fajr:'Фаджр', Dhuhr:'Зухр', Asr:'Аср', Maghrib:'Магриб', Isha:'Иша' }
const MONTHS_RU    = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_RU      = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

// Цвет ячейки по количеству намазов
function cellColor(count, isFull) {
  if (count === 0) return { bg: 'rgba(255,60,60,.07)',  border: 'rgba(255,80,80,.15)',   text: 'rgba(255,255,255,.2)' }
  if (isFull)      return { bg: 'linear-gradient(135deg,#C9A84C,#F0D080)', border: '#C9A84C', text: '#070710', glow: '0 0 14px rgba(201,168,76,.55)' }
  if (count >= 3)  return { bg: 'rgba(52,168,120,.22)', border: 'rgba(52,168,120,.5)',  text: '#52b788' }
  if (count >= 1)  return { bg: 'rgba(201,130,30,.15)', border: 'rgba(201,130,30,.35)', text: '#e8a040' }
  return {}
}

export default function PrayerCalendar({ user, onClose }) {
  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [byDate,   setByDate]   = useState({})
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchMonth() }, [year, month])

  async function fetchMonth() {
    if (!user) return
    setLoading(true); setSelected(null)
    const pad   = n => String(n).padStart(2, '0')
    const start = `${year}-${pad(month + 1)}-01`
    const end   = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`
    const { data } = await supabase
      .from('prayer_logs').select('prayer, date')
      .eq('user_id', user.id).gte('date', start).lte('date', end)
    if (data) {
      const map = {}
      data.forEach(r => { if (!map[r.date]) map[r.date] = new Set(); map[r.date].add(r.prayer) })
      setByDate(map)
    }
    setLoading(false)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (year === now.getFullYear() && month === now.getMonth()) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  const pad       = n => String(n).padStart(2, '0')
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7
  const daysCount = new Date(year, month + 1, 0).getDate()
  const todayStr  = now.toISOString().split('T')[0]
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
    cells.push({ d, dateStr, prayers: byDate[dateStr] || new Set() })
  }

  // Статистика
  const fullDays   = Object.values(byDate).filter(s => s.size >= 5).length
  const totalPray  = Object.values(byDate).reduce((a, s) => a + s.size, 0)
  // Только дни с хотя бы 1 намазом (не будущие)
  const activeDays = Object.keys(byDate).filter(d => d <= todayStr).length
  const pct        = activeDays > 0 ? Math.round((totalPray / (activeDays * 5)) * 100) : 0

  return (
    <div style={s.wrap}>

      {/* ── Шапка ── */}
      <div style={s.head}>
        <div style={s.headRow}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <div style={s.monthTitle}>{MONTHS_RU[month]} {year}</div>
          <button style={{ ...s.navBtn, opacity: isCurrentMonth ? 0.3 : 1 }}
            onClick={nextMonth} disabled={isCurrentMonth}>›</button>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Статистика */}
        {!loading && (
          <div style={s.stats}>
            <div style={s.statBox}>
              <div style={s.statNum}>{fullDays}</div>
              <div style={s.statLabel}>полных дней</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statNum}>{totalPray}</div>
              <div style={s.statLabel}>намазов</div>
            </div>
            <div style={{ ...s.statBox, background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.25)' }}>
              <div style={{ ...s.statNum, color:'var(--gold)' }}>{pct}%</div>
              <div style={s.statLabel}>выполнения</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Дни недели ── */}
      <div style={s.weekRow}>
        {DAYS_RU.map(d => <div key={d} style={s.weekDay}>{d}</div>)}
      </div>

      {/* ── Сетка ── */}
      <div style={s.scroll} className="scroll-y">
        {loading
          ? <div style={s.loadWrap}><span style={s.loadText}>Загрузка...</span></div>
          : (
            <div style={s.grid}>
              {cells.map((cell, i) => {
                if (!cell) return <div key={`e${i}`} />
                const { d, dateStr, prayers } = cell
                const count    = prayers.size
                const isFull   = count >= 5
                const isToday  = dateStr === todayStr
                const isFuture = dateStr > todayStr
                const isPast   = !isFuture && !isToday
                const col      = !isFuture ? cellColor(count, isFull) : null

                return (
                  <div
                    key={dateStr}
                    style={{
                      ...s.cell,
                      background: isFuture ? 'rgba(255,255,255,.03)' : col.bg,
                      border: `1.5px solid ${isFuture ? 'rgba(255,255,255,.06)' : (isToday && !isFull ? 'rgba(201,168,76,.7)' : col.border)}`,
                      boxShadow: isFull ? col.glow : isToday ? '0 0 8px rgba(201,168,76,.2)' : 'none',
                      opacity: isFuture ? 0.3 : 1,
                      cursor: isFuture ? 'default' : 'pointer',
                    }}
                    onClick={() => !isFuture && setSelected({ d, dateStr, prayers })}
                  >
                    {/* Дата */}
                    <div style={{
                      ...s.cellDate,
                      color: isFuture ? 'rgba(255,255,255,.2)'
                           : isFull   ? '#070710'
                           : isToday  ? 'var(--gold)'
                           : col.text
                    }}>{d}</div>

                    {/* Индикатор */}
                    {!isFuture && (
                      isFull
                        ? <div style={s.cellCheck}>✓</div>
                        : count > 0
                          ? <div style={{ ...s.cellCount, color: col.text }}>{count}</div>
                          : isPast
                            ? <div style={s.cellMiss}>—</div>
                            : null
                    )}
                  </div>
                )
              })}
            </div>
          )
        }
        <div style={{ height: 8 }} />
      </div>

      {/* ── Легенда ── */}
      <div style={s.legend}>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background:'rgba(255,60,60,.2)', border:'1px solid rgba(255,80,80,.3)' }} />
          <span>Нет</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background:'rgba(201,130,30,.3)', border:'1px solid rgba(201,130,30,.5)' }} />
          <span>1–2</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background:'rgba(52,168,120,.3)', border:'1px solid rgba(52,168,120,.6)' }} />
          <span>3–4</span>
        </div>
        <div style={s.legendItem}>
          <div style={{ ...s.legendDot, background:'linear-gradient(135deg,#C9A84C,#F0D080)', border:'none' }} />
          <span>Все 5 ✓</span>
        </div>
      </div>

      {/* ── Детали дня ── */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.detail} onClick={e => e.stopPropagation()}>
            <div style={s.detailHead}>
              <span style={s.detailDate}>{selected.d} {MONTHS_RU[month]} {year}</span>
              {selected.prayers.size >= 5 && (
                <span style={s.detailBadge}>✓ Все 5</span>
              )}
            </div>
            <div style={s.detailGrid}>
              {PRAYER_NAMES.map(p => {
                const done = selected.prayers.has(p)
                return (
                  <div key={p} style={{ ...s.detailRow, opacity: done ? 1 : 0.4 }}>
                    <div style={{ ...s.detailDot,
                      background: done ? 'var(--gold)' : 'rgba(255,255,255,.15)',
                      boxShadow: done ? '0 0 8px rgba(201,168,76,.5)' : 'none'
                    }} />
                    <span style={{ color: done ? 'var(--text)' : 'var(--text-muted)', fontWeight: done ? 600 : 400 }}>
                      {PRAYER_RU[p]}
                    </span>
                    {done && <span style={s.detailCheck}>✓</span>}
                  </div>
                )
              })}
            </div>
            <div style={s.detailProgress}>
              <div style={s.detailProgressBar}>
                <div style={{
                  ...s.detailProgressFill,
                  width: `${(selected.prayers.size / 5) * 100}%`,
                  background: selected.prayers.size >= 5 ? 'linear-gradient(90deg,#C9A84C,#F0D080)' : 'rgba(52,168,120,.8)'
                }} />
              </div>
              <span style={s.detailProgressLabel}>{selected.prayers.size} из 5 намазов</span>
            </div>
            <button style={s.detailClose} onClick={() => setSelected(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: {
    position:'fixed', inset:0, zIndex:95,
    background:'var(--bg-deep)', display:'flex', flexDirection:'column',
    fontFamily:'var(--font-ui)'
  },

  // Head
  head: {
    flexShrink:0, padding:'12px 16px 10px',
    display:'flex', flexDirection:'column', gap:10,
    borderBottom:'1px solid var(--border)'
  },
  headRow: { display:'flex', alignItems:'center', gap:8 },
  monthTitle: { flex:1, textAlign:'center', fontSize:16, fontWeight:700, color:'var(--text)' },
  navBtn: {
    width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:22, lineHeight:1,
    cursor:'pointer', outline:'none', display:'flex', alignItems:'center', justifyContent:'center'
  },
  closeBtn: {
    width:34, height:34, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:15,
    cursor:'pointer', outline:'none', display:'flex', alignItems:'center', justifyContent:'center'
  },

  // Stats
  stats: { display:'flex', gap:8 },
  statBox: {
    flex:1, background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:12, padding:'8px 10px', textAlign:'center'
  },
  statNum: { fontSize:20, fontWeight:800, color:'var(--text)', lineHeight:1 },
  statLabel: { fontSize:10, color:'var(--text-muted)', marginTop:3 },

  // Week header
  weekRow: {
    flexShrink:0, display:'grid', gridTemplateColumns:'repeat(7,1fr)',
    padding:'8px 12px 4px'
  },
  weekDay: {
    textAlign:'center', fontSize:11, fontWeight:600,
    color:'var(--text-muted)', letterSpacing:'.04em'
  },

  // Grid
  scroll: { flex:1, overflowY:'auto', padding:'4px 12px 0' },
  grid: { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 },

  loadWrap: { display:'flex', justifyContent:'center', padding:'40px 0' },
  loadText: { fontSize:14, color:'var(--text-muted)' },

  cell: {
    aspectRatio:'1', borderRadius:10,
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', gap:2,
    transition:'box-shadow .2s',
  },
  cellDate: { fontSize:13, fontWeight:700, lineHeight:1 },
  cellCheck: { fontSize:13, fontWeight:800, color:'#070710', lineHeight:1 },
  cellCount: { fontSize:12, fontWeight:700, lineHeight:1 },
  cellMiss:  { fontSize:11, color:'rgba(255,80,80,.4)', lineHeight:1 },

  // Legend
  legend: {
    flexShrink:0, display:'flex', gap:12, justifyContent:'center', alignItems:'center',
    padding:'8px 16px 10px', borderTop:'1px solid var(--border)'
  },
  legendItem: { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-muted)' },
  legendDot: { width:14, height:14, borderRadius:4 },

  // Detail popup
  overlay: {
    position:'fixed', inset:0, zIndex:100,
    background:'rgba(0,0,0,.75)', backdropFilter:'blur(5px)',
    display:'flex', alignItems:'flex-end', justifyContent:'center'
  },
  detail: {
    width:'100%', maxWidth:480,
    background:'var(--bg-card)', borderRadius:'22px 22px 0 0',
    border:'1px solid var(--border)', borderBottom:'none',
    padding:'20px 24px 24px',
    display:'flex', flexDirection:'column', gap:14
  },
  detailHead: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  detailDate: { fontSize:16, fontWeight:700, color:'var(--text)' },
  detailBadge: {
    fontSize:11, fontWeight:600, color:'var(--gold)',
    background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.25)',
    borderRadius:10, padding:'3px 10px'
  },
  detailGrid: { display:'flex', flexDirection:'column', gap:10 },
  detailRow: { display:'flex', alignItems:'center', gap:10 },
  detailDot: { width:10, height:10, borderRadius:'50%', flexShrink:0, transition:'all .2s' },
  detailCheck: { marginLeft:'auto', color:'var(--gold)', fontWeight:700 },

  detailProgress: { display:'flex', flexDirection:'column', gap:5 },
  detailProgressBar: {
    height:6, borderRadius:3, background:'rgba(255,255,255,.08)', overflow:'hidden'
  },
  detailProgressFill: { height:'100%', borderRadius:3, transition:'width .4s ease' },
  detailProgressLabel: { fontSize:12, color:'var(--text-muted)', textAlign:'center' },

  detailClose: {
    width:'100%', padding:'12px 0', borderRadius:14,
    border:'1px solid var(--border)', background:'var(--bg-surface)',
    color:'var(--text-muted)', fontSize:14, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none'
  }
}

import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { ISLAMIC_EVENTS, EVENTS_BY_YEAR } from '../data/islamic-calendar'

const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function formatDate(dateStr, dateEndStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (dateEndStr) {
    const e = new Date(dateEndStr)
    if (d.getMonth() === e.getMonth())
      return `${d.getDate()}–${e.getDate()} ${MONTHS_FULL[d.getMonth()]}`
    return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} – ${e.getDate()} ${MONTHS_FULL[e.getMonth()]}`
  }
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.round((target - today) / 86400000)
}

export default function IslamicCalendar({ onClose }) {
  const swipe = useSwipeDown(onClose)
  const currentYear = new Date().getFullYear()
  const minYear = Math.min(...Object.keys(EVENTS_BY_YEAR).map(Number))
  const maxYear = Math.max(...Object.keys(EVENTS_BY_YEAR).map(Number))

  const [year,     setYear]     = useState(currentYear)
  const [selected, setSelected] = useState(null)
  const [detailTab, setDetailTab] = useState('whatToDo')

  const yearEvents = EVENTS_BY_YEAR[year] || []

  // Обогащаем датами и сортируем
  const events = yearEvents
    .map(ye => {
      const def = ISLAMIC_EVENTS.find(e => e.id === ye.id)
      if (!def) return null
      return { ...def, ...ye }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const todayStr = new Date().toISOString().split('T')[0]

  function openDetail(ev) {
    setSelected(ev)
    setDetailTab('whatToDo')
  }

  return (
    <div style={s.wrap} {...swipe}>

      {/* ── Шапка ── */}
      <div style={s.head}>
        <div style={s.headRow}>
          <div>
            <div style={s.headTitle}>☪️ Исламский календарь</div>
            <div style={s.headSub}>Праздники и священные дни</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Год */}
        <div style={s.yearRow}>
          <button
            style={{ ...s.yearBtn, opacity: year > minYear ? 1 : 0.3 }}
            onClick={() => year > minYear && setYear(y => y - 1)}
            disabled={year <= minYear}
          >‹</button>
          <div style={s.yearTitle}>{year}</div>
          <button
            style={{ ...s.yearBtn, opacity: year < maxYear ? 1 : 0.3 }}
            onClick={() => year < maxYear && setYear(y => y + 1)}
            disabled={year >= maxYear}
          >›</button>
        </div>

        <div style={s.notice}>
          ⚠️ Даты приблизительные — могут отличаться на 1–2 дня в зависимости от наблюдения луны
        </div>
      </div>

      {/* ── Список событий ── */}
      <div style={s.list} className="scroll-y">
        {events.map(ev => {
          const diff   = daysUntil(ev.date)
          const isPast = (ev.dateEnd ? ev.dateEnd : ev.date) < todayStr
          const isNow  = ev.isRange && ev.date <= todayStr && ev.dateEnd >= todayStr
          const isSoon = !isPast && diff >= 0 && diff <= 14

          return (
            <div
              key={ev.id}
              style={{ ...s.card, opacity: isPast ? 0.55 : 1, borderColor: isNow ? ev.color : isSoon ? ev.color + '80' : 'var(--border)' }}
              onClick={() => openDetail(ev)}
            >
              {/* Иконка */}
              <div style={{ ...s.cardIcon, background: ev.color + '22', border: `1px solid ${ev.color}55` }}>
                <span style={{ fontSize: 24 }}>{ev.icon}</span>
              </div>

              {/* Основное */}
              <div style={s.cardBody}>
                <div style={s.cardTitleRow}>
                  <span style={s.cardTitle}>{ev.title}</span>
                  {isNow  && <span style={{ ...s.badge, background: ev.color + '30', color: ev.color, border: `1px solid ${ev.color}60` }}>Сейчас</span>}
                  {isSoon && !isNow && <span style={{ ...s.badge, background: 'rgba(201,168,76,.15)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,.3)' }}>
                    {diff === 0 ? 'Сегодня!' : `через ${diff} дн.`}
                  </span>}
                  {isPast && <span style={{ ...s.badge, background: 'rgba(255,255,255,.06)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,.1)' }}>Прошло</span>}
                </div>
                <div style={s.cardAr} className="arabic gold-shimmer">{ev.titleAr}</div>
                <div style={{ ...s.cardDate, color: ev.color }}>
                  {formatDate(ev.date, ev.isRange ? ev.dateEnd : null)}
                </div>
                <div style={s.cardShort}>{ev.short}</div>
              </div>

              <div style={s.cardArrow}>›</div>
            </div>
          )
        })}
        <div style={{ height: 20 }} />
      </div>

      {/* ── Детали события ── */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.detail} onClick={e => e.stopPropagation()}>

            {/* Заголовок */}
            <div style={s.detailHead}>
              <div style={{ ...s.detailIconBig, background: selected.color + '20', border: `1px solid ${selected.color}50` }}>
                <span style={{ fontSize: 32 }}>{selected.icon}</span>
              </div>
              <div>
                <div style={s.detailTitleAr} className="arabic gold-shimmer">{selected.titleAr}</div>
                <div style={s.detailTitle}>{selected.title}</div>
                <div style={{ ...s.detailDate, color: selected.color }}>
                  {formatDate(selected.date, selected.isRange ? selected.dateEnd : null)} {year}
                </div>
              </div>
            </div>

            {/* Хиджри дата */}
            <div style={s.hijriRow}>
              <span style={s.hijriLabel}>📅 Хиджрийская дата:</span>
              <span style={s.hijriVal}>{selected.hijri}</span>
            </div>

            {/* Вкладки */}
            <div style={s.detailTabs}>
              {[
                { id: 'whatToDo',  label: '📋 Что делать' },
                { id: 'history',   label: '📖 История' },
                { id: 'duas',      label: '🤲 Дуа' },
                { id: 'tips',      label: '💡 Советы' },
              ].map(t => (
                <button
                  key={t.id}
                  style={{ ...s.detailTab, ...(detailTab === t.id ? s.detailTabActive : {}) }}
                  onClick={() => setDetailTab(t.id)}
                >{t.label}</button>
              ))}
            </div>

            {/* Контент вкладки */}
            <div style={s.detailContent}>
              {detailTab === 'history' && (
                <div style={s.historyText}>{selected.history}</div>
              )}

              {detailTab === 'whatToDo' && (
                <div style={s.todoList}>
                  {selected.whatToDo.map((item, i) => (
                    <div key={i} style={s.todoItem}>
                      <div style={{ ...s.todoDot, background: selected.color }} />
                      <span style={s.todoText}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'duas' && (
                <div style={s.duasList}>
                  {selected.duas.map((dua, i) => (
                    <div key={i} style={s.duaCard}>
                      <div style={s.duaAr} className="arabic gold-shimmer">{dua.ar}</div>
                      <div style={s.duaTranslit}>{dua.translit}</div>
                      <div style={s.duaDivider} />
                      <div style={s.duaTranslation}>{dua.translation}</div>
                      <div style={s.duaSource}>{dua.source}</div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'tips' && (
                <div style={s.tipsList}>
                  {selected.tips.map((tip, i) => (
                    <div key={i} style={s.tipItem}>
                      <span style={s.tipIcon}>✦</span>
                      <span style={s.tipText}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
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

  head: {
    flexShrink:0, padding:'12px 16px 10px',
    display:'flex', flexDirection:'column', gap:10,
    borderBottom:'1px solid var(--border)'
  },
  headRow: { display:'flex', alignItems:'flex-start', justifyContent:'space-between' },
  headTitle: { fontSize:17, fontWeight:700, color:'var(--text)' },
  headSub: { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  closeBtn: {
    width:34, height:34, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:15,
    cursor:'pointer', outline:'none', display:'flex', alignItems:'center', justifyContent:'center'
  },

  yearRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:16 },
  yearBtn: {
    width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:22,
    cursor:'pointer', outline:'none', display:'flex', alignItems:'center', justifyContent:'center'
  },
  yearTitle: { fontSize:22, fontWeight:800, color:'var(--gold)', minWidth:60, textAlign:'center' },

  notice: {
    fontSize:11, color:'rgba(255,200,50,.6)', background:'rgba(255,200,50,.06)',
    border:'1px solid rgba(255,200,50,.15)', borderRadius:8,
    padding:'6px 10px', lineHeight:1.5, textAlign:'center'
  },

  list: { flex:1, overflowY:'auto', padding:'12px 16px 0', display:'flex', flexDirection:'column', gap:10 },

  card: {
    background:'var(--bg-card)', borderRadius:16, border:'1.5px solid',
    padding:'12px 14px', cursor:'pointer',
    display:'flex', alignItems:'center', gap:12,
    transition:'border-color .2s'
  },
  cardIcon: {
    width:48, height:48, borderRadius:14, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center'
  },
  cardBody: { flex:1, display:'flex', flexDirection:'column', gap:3 },
  cardTitleRow: { display:'flex', alignItems:'center', gap:8 },
  cardTitle: { fontSize:15, fontWeight:700, color:'var(--text)' },
  badge: { fontSize:10, fontWeight:600, borderRadius:8, padding:'2px 7px' },
  cardAr: { fontFamily:"'Scheherazade New',serif", fontSize:14, direction:'rtl' },
  cardDate: { fontSize:12, fontWeight:600 },
  cardShort: { fontSize:12, color:'var(--text-muted)', lineHeight:1.4 },
  cardArrow: { fontSize:20, color:'var(--text-muted)', flexShrink:0 },

  // Overlay
  overlay: {
    position:'fixed', inset:0, zIndex:100,
    background:'rgba(0,0,0,.8)', backdropFilter:'blur(6px)',
    display:'flex', alignItems:'flex-end', justifyContent:'center'
  },
  detail: {
    width:'100%', maxWidth:500,
    background:'var(--bg-card)', borderRadius:'24px 24px 0 0',
    border:'1px solid var(--border)', borderBottom:'none',
    padding:'20px 20px 24px', maxHeight:'90vh', overflowY:'auto',
    display:'flex', flexDirection:'column', gap:14
  },
  detailHead: { display:'flex', alignItems:'center', gap:14 },
  detailIconBig: {
    width:60, height:60, borderRadius:16, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center'
  },
  detailTitleAr: { fontFamily:"'Scheherazade New',serif", fontSize:18, direction:'rtl' },
  detailTitle: { fontSize:17, fontWeight:700, color:'var(--text)' },
  detailDate: { fontSize:13, fontWeight:600, marginTop:2 },

  hijriRow: {
    display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
    background:'rgba(255,255,255,.04)', borderRadius:10, padding:'8px 12px'
  },
  hijriLabel: { fontSize:12, color:'var(--text-muted)' },
  hijriVal: { fontSize:12, fontWeight:600, color:'var(--text)' },

  detailTabs: { display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' },
  detailTab: {
    flexShrink:0, padding:'6px 12px', borderRadius:16,
    border:'1px solid var(--border)', background:'transparent',
    color:'var(--text-muted)', fontSize:12, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none', whiteSpace:'nowrap', transition:'all .2s'
  },
  detailTabActive: {
    background:'rgba(201,168,76,.12)', borderColor:'rgba(201,168,76,.4)',
    color:'var(--gold)', fontWeight:600
  },

  detailContent: { minHeight:80 },

  historyText: { fontSize:13, color:'var(--text-muted)', lineHeight:1.75 },

  todoList: { display:'flex', flexDirection:'column', gap:10 },
  todoItem: { display:'flex', alignItems:'flex-start', gap:10 },
  todoDot: { width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:4 },
  todoText: { fontSize:13, color:'var(--text)', lineHeight:1.6 },

  duasList: { display:'flex', flexDirection:'column', gap:12 },
  duaCard: {
    background:'rgba(201,168,76,.06)', borderRadius:14,
    border:'1px solid rgba(201,168,76,.15)', padding:'12px 14px',
    display:'flex', flexDirection:'column', gap:6
  },
  duaAr: { fontFamily:"'Scheherazade New',serif", fontSize:17, lineHeight:1.9, direction:'rtl', textAlign:'center' },
  duaTranslit: { fontSize:11, color:'rgba(255,255,255,.4)', fontStyle:'italic', lineHeight:1.5, textAlign:'center' },
  duaDivider: { height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.25),transparent)' },
  duaTranslation: { fontSize:13, color:'var(--text)', lineHeight:1.6, textAlign:'center' },
  duaSource: { fontSize:11, color:'var(--text-muted)', textAlign:'center' },

  tipsList: { display:'flex', flexDirection:'column', gap:10 },
  tipItem: { display:'flex', alignItems:'flex-start', gap:8 },
  tipIcon: { color:'var(--gold)', fontSize:12, flexShrink:0, marginTop:2 },
  tipText: { fontSize:13, color:'var(--text-muted)', lineHeight:1.65 },

  detailClose: {
    width:'100%', padding:'12px 0', borderRadius:14,
    border:'1px solid var(--border)', background:'var(--bg-surface)',
    color:'var(--text-muted)', fontSize:14, cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none', marginTop:4
  }
}

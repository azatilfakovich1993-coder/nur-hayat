import { useState, useMemo, useRef } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { GLOSSARY, GLOSSARY_CATEGORIES } from '../data/glossary'
import { useAuth } from '../hooks/useAuth'
import { addNurIfLevel } from '../utils/nur'

function NurToast({ onDone }) {
  return (
    <div style={t.wrap}>
      <span style={t.icon}>◉</span>
      <span style={t.text}>+5 НУР за изученный термин</span>
    </div>
  )
}

const t = {
  wrap: {
    position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.25),rgba(201,168,76,.1))',
    border: '1px solid rgba(201,168,76,.5)', borderRadius: 30,
    padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8,
    zIndex: 400, pointerEvents: 'none',
    animation: 'toastIn .3s ease',
    fontFamily: 'var(--font-ui)',
  },
  icon: { color: 'var(--gold)', fontSize: 18 },
  text: { color: 'var(--gold)', fontSize: 14, fontWeight: 700 },
}

export default function Glossary({ onClose }) {
  const swipe    = useSwipeDown(onClose)
  const { user, profile, setProfile } = useAuth()
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('Все')
  const [expanded, setExpanded] = useState(null)
  const [toast,    setToast]    = useState(false)
  const toastTimer = useRef(null)

  const readRef = useRef(() => {
    try { return new Set(JSON.parse(localStorage.getItem('glossary_read') || '[]')) }
    catch { return new Set() }
  })
  const [readSet, setReadSet] = useState(readRef.current)

  function handleToggle(id) {
    if (expanded === id) {
      // Закрываем — засчитываем прочтение
      if (!readSet.has(id)) {
        const next = new Set(readSet)
        next.add(id)
        setReadSet(next)
        localStorage.setItem('glossary_read', JSON.stringify([...next]))
        addNurIfLevel(5, 'seeker', user, profile, setProfile)
        clearTimeout(toastTimer.current)
        setToast(true)
        toastTimer.current = setTimeout(() => setToast(false), 2000)
      }
      setExpanded(null)
    } else {
      setExpanded(id)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return GLOSSARY.filter(item => {
      const matchCat = category === 'Все' || item.category === category
      const matchQ   = !q ||
        item.term.toLowerCase().includes(q) ||
        item.short.toLowerCase().includes(q) ||
        item.full.toLowerCase().includes(q) ||
        item.translit.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [search, category])

  return (
    <div style={s.wrap} {...swipe}>
      {toast && <NurToast />}
      <style>{`@keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>

      {/* ── Шапка ── */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.headInfo}>
          <div style={s.headTitle}>Глоссарий</div>
          <div style={s.headSub}>
            {readSet.size > 0
              ? `Изучено ${readSet.size} из ${GLOSSARY.length} терминов`
              : 'Исламские термины для начинающих'}
          </div>
        </div>
        {readSet.size > 0 && (
          <div style={s.nurBadge}>◉ {readSet.size * 5} НУР</div>
        )}
      </div>

      {/* ── Поиск ── */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Поиск термина..."
          value={search}
          onChange={e => { setSearch(e.target.value); setExpanded(null) }}
        />
        {search && (
          <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── Категории ── */}
      <div style={s.cats} className="scroll-x">
        {GLOSSARY_CATEGORIES.map(cat => (
          <button
            key={cat}
            style={{ ...s.catBtn, ...(category === cat ? s.catActive : {}) }}
            onClick={() => { setCategory(cat); setExpanded(null) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Список ── */}
      <div style={s.list} className="scroll-y">
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 40 }}>🔍</div>
            <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, marginTop: 12 }}>Ничего не найдено</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Попробуй другой запрос</div>
          </div>
        ) : (
          filtered.map(item => {
            const isOpen = expanded === item.id
            return (
              <button
                key={item.id}
                style={{ ...s.card, ...(isOpen ? s.cardOpen : {}), ...(readSet.has(item.id) ? s.cardRead : {}) }}
                onClick={() => handleToggle(item.id)}
              >
                <div style={s.cardTop}>
                  <div style={s.cardLeft}>
                    <div style={s.cardTerm}>{item.term}</div>
                    <div style={s.cardTranslit}>{item.translit}</div>
                    {!isOpen && <div style={s.cardShort}>{item.short}</div>}
                  </div>
                  <div style={s.cardRight}>
                    <div style={s.cardArabic}>{item.arabic}</div>
                    <div style={{ ...s.catTag, ...(CAT_COLORS[item.category] || {}) }}>
                      {item.category}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div style={s.cardFull}>
                    <div style={s.divider} />
                    <div style={s.arabicBig}>{item.arabic}</div>
                    <div style={s.fullText}>{item.full}</div>
                  </div>
                )}

                <div style={s.chevron}>{isOpen ? '▲' : '▼'}</div>
              </button>
            )
          })
        )}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

const CAT_COLORS = {
  'Основы':  { background: 'rgba(201,168,76,.15)',  color: '#c9a84c' },
  'Коран':   { background: 'rgba(82,183,136,.15)',  color: '#52b788' },
  'Намаз':   { background: 'rgba(74,144,217,.15)',  color: '#4a90d9' },
  'Вера':    { background: 'rgba(160,125,232,.15)', color: '#a07de8' },
  'Столпы':  { background: 'rgba(232,67,147,.15)',  color: '#e84393' },
  'Зикр':    { background: 'rgba(46,168,122,.15)',  color: '#2ea87a' },
  'Знания':  { background: 'rgba(180,130,60,.15)',  color: '#b4823c' },
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },

  // Шапка
  head: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 20px 14px',
    borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', lineHeight: 1,
  },
  headInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  headTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text)' },
  headSub:   { fontSize: 12, color: 'var(--text-muted)' },

  // Поиск
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    margin: '12px 16px 0', flexShrink: 0,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '10px 14px',
  },
  searchIcon:  { fontSize: 16, flexShrink: 0 },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font-ui)',
  },
  clearBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: 14, padding: '0 2px',
  },

  // Категории
  cats: {
    display: 'flex', gap: 8, padding: '12px 16px',
    overflowX: 'auto', flexShrink: 0,
  },
  catBtn: {
    flexShrink: 0, padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', outline: 'none', whiteSpace: 'nowrap',
  },
  catActive: {
    background: 'rgba(201,168,76,.15)', borderColor: 'rgba(201,168,76,.5)',
    color: 'var(--gold)',
  },

  // Список
  list: {
    flex: 1, overflowY: 'auto', padding: '0 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 40,
  },

  // Карточки
  card: {
    width: '100%', background: 'var(--bg-card)',
    border: '1px solid var(--border)', borderRadius: 16,
    padding: '14px 16px', cursor: 'pointer',
    textAlign: 'left', outline: 'none', position: 'relative',
    transition: 'border-color .2s',
  },
  cardOpen: {
    borderColor: 'rgba(201,168,76,.4)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.06),var(--bg-card))',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', gap: 12 },
  cardLeft: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  cardTerm:    { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  cardTranslit:{ fontSize: 12, color: 'var(--gold)', opacity: .8 },
  cardShort:   { fontSize: 13, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  cardArabic: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 20, color: 'var(--gold)', direction: 'rtl',
  },
  catTag: {
    fontSize: 10, fontWeight: 700, borderRadius: 8,
    padding: '3px 8px', letterSpacing: '.04em',
  },

  // Развёрнутый
  cardFull: { marginTop: 12 },
  divider:  { height: 1, background: 'var(--border)', marginBottom: 12 },
  arabicBig: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 28, color: 'var(--gold)', textAlign: 'center',
    direction: 'rtl', marginBottom: 12, lineHeight: 1.6,
  },
  fullText: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
    textAlign: 'left',
  },

  chevron: {
    position: 'absolute', bottom: 10, right: 14,
    fontSize: 9, color: 'rgba(255,255,255,.2)',
  },
  cardRead: {
    borderColor: 'rgba(82,183,136,.3)',
  },
  nurBadge: {
    marginLeft: 'auto', flexShrink: 0,
    fontSize: 13, fontWeight: 700, color: 'var(--gold)',
    background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 20, padding: '4px 12px',
  },
}

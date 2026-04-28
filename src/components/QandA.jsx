import { useState, useMemo } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { QA_CATEGORIES, QA_DATA } from '../data/qa-data'

export default function QandA({ onClose }) {
  const swipe    = useSwipeDown(onClose)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('basics')
  const [openId,   setOpenId]   = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return QA_DATA.filter(item => {
      const matchCat = category === 'all' || item.category === category
      const matchQ   = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [search, category])

  function toggle(id) {
    setOpenId(prev => prev === id ? null : id)
  }

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.headMid}>
          <div style={s.headTitle}>Вопросы и ответы</div>
          <div style={s.headSub}>Достоверные ответы для начинающих</div>
        </div>
      </div>

      {/* Поиск */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Поиск вопроса..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={s.searchClear} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Категории */}
      <div style={s.cats}>
        {QA_CATEGORIES.map(c => (
          <button
            key={c.id}
            style={{ ...s.cat, ...(category === c.id ? s.catActive : {}) }}
            onClick={() => { setCategory(c.id); setOpenId(null) }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Список */}
      <div style={s.list} className="scroll-y">
        {filtered.length === 0 && (
          <div style={s.empty}>Ничего не найдено</div>
        )}
        {filtered.map(item => {
          const isOpen = openId === item.id
          return (
            <div key={item.id} style={{ ...s.card, ...(isOpen ? s.cardOpen : {}) }}>
              <button style={s.question} onClick={() => toggle(item.id)}>
                <span style={s.qText}>{item.q}</span>
                <span style={{ ...s.chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {isOpen && (
                <div style={s.answer}>
                  <div style={s.answerText}>{item.a}</div>
                  {item.ref && (
                    <div style={s.ref}>📖 {item.ref}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div style={s.disclaimer}>
          Все ответы основаны на Коране и достоверной Сунне. При сомнениях — обращайся к местному имаму или квалифицированному учёному.
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },

  // Шапка
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1,
  },
  headMid:   { flex: 1 },
  headTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text)' },
  headSub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },

  // Поиск
  searchWrap: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
    margin: '12px 16px 0',
    background: 'var(--bg-card)', borderRadius: 14,
    border: '1px solid var(--border)', padding: '0 12px',
  },
  searchIcon:  { fontSize: 14, opacity: .5 },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: 14, padding: '11px 0',
    fontFamily: 'var(--font-ui)',
  },
  searchClear: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: 12, cursor: 'pointer', padding: 4,
  },

  // Категории
  cats: {
    flexShrink: 0, display: 'flex', gap: 8, padding: '12px 16px',
    overflowX: 'auto',
  },
  cat: {
    flexShrink: 0, padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
  },
  catActive: {
    background: 'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.1))',
    borderColor: 'rgba(201,168,76,.5)', color: 'var(--gold)',
  },

  // Список
  list: {
    flex: 1, overflowY: 'auto', padding: '4px 16px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  empty: {
    textAlign: 'center', color: 'var(--text-muted)',
    fontSize: 14, padding: '40px 0',
  },

  // Карточка Q&A
  card: {
    borderRadius: 16, border: '1px solid var(--border)',
    background: 'var(--bg-card)',
  },
  cardOpen: {
    border: '1px solid rgba(201,168,76,.35)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.07),rgba(201,168,76,.03))',
  },
  question: {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 12, padding: '14px 16px',
    background: 'none', border: 'none', cursor: 'pointer',
    outline: 'none', textAlign: 'left', fontFamily: 'var(--font-ui)',
  },
  qText: {
    flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)',
    lineHeight: 1.4,
  },
  chevron: {
    fontSize: 18, color: 'var(--gold)', flexShrink: 0,
    transition: 'transform .2s ease',
  },

  // Ответ
  answer: {
    padding: '0 16px 16px',
    borderTop: '1px solid rgba(201,168,76,.15)',
  },
  answerText: {
    fontSize: 13, color: 'var(--text)', lineHeight: 1.7,
    whiteSpace: 'pre-line', paddingTop: 12,
  },
  ref: {
    marginTop: 10, fontSize: 11, color: 'var(--gold)',
    background: 'rgba(201,168,76,.08)', borderRadius: 8,
    padding: '6px 10px', lineHeight: 1.4,
  },

  // Дисклеймер
  disclaimer: {
    margin: '8px 0 4px', padding: '12px 14px',
    borderRadius: 12, border: '1px solid var(--border)',
    background: 'rgba(255,255,255,.02)',
    fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
  },
}

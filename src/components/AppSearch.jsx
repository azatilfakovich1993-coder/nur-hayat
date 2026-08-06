import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { SEARCH_INDEX } from '../data/search-index'

const fuse = new Fuse(SEARCH_INDEX, {
  keys: [
    { name: 'title',    weight: 2 },
    { name: 'keywords', weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
})

const SUGGESTIONS = ['Намаз', 'Азкары', 'Настройки', 'Кибла', 'Вопросы и ответы']

export default function AppSearch({ onClose }) {
  const swipe = useSwipeDown(onClose)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    // Разделы/настройки (priority 0) всегда выше конкретного контента
    // (priority 1: азкары, дуа, суры...) — иначе, например, десяток
    // отдельных азкаров с одинаково хорошим fuzzy-совпадением хоронит внизу
    // сам тумблер "Уведомления азкаров".
    return fuse.search(q, { limit: 60 })
      .sort((a, b) => (a.item.priority ?? 1) - (b.item.priority ?? 1) || a.score - b.score)
      .slice(0, 25)
      .map(r => r.item)
  }, [query])

  function handlePick(item) {
    navigate(item.route, item.navState ? { state: item.navState } : undefined)
    onClose()
  }

  return (
    <div style={s.wrap} {...swipe}>
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            style={s.searchInput}
            placeholder="Намаз, азкары, настройки..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button style={s.searchClear} onClick={() => setQuery('')}>✕</button>
          )}
        </div>
      </div>

      <div style={s.list} className="scroll-y">
        {!query.trim() && (
          <>
            <div style={s.introTitle}>Навигация по приложению</div>
            <div style={s.introText}>Введите раздел, действие или вопрос — сразу перейдём куда нужно.</div>
            <div style={s.hint}>Например:</div>
            <div style={s.suggestions}>
              {SUGGESTIONS.map(t => (
                <button key={t} style={s.suggestion} onClick={() => setQuery(t)}>{t}</button>
              ))}
            </div>
          </>
        )}

        {query.trim() && results.length === 0 && (
          <div style={s.empty}>Ничего не найдено</div>
        )}

        {results.map((item, i) => (
          <button key={item.route + item.title + i} style={s.item} onClick={() => handlePick(item)}>
            <span style={s.itemIcon}>{item.icon}</span>
            <div style={s.itemBody}>
              <div style={s.itemTitle}>{item.title}</div>
              <div style={s.itemCat}>{item.category}</div>
            </div>
            <span style={s.itemArrow}>›</span>
          </button>
        ))}
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
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
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
  searchWrap: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
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

  list: {
    flex: 1, overflowY: 'auto', padding: '16px 16px 24px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  introTitle: { fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginTop: 4 },
  introText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 },
  hint: { fontSize: 12, color: 'var(--text-dim)', marginBottom: 2 },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  suggestion: {
    padding: '8px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
  },
  empty: {
    textAlign: 'center', color: 'var(--text-muted)',
    fontSize: 14, padding: '40px 0',
  },

  item: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 14,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    cursor: 'pointer', outline: 'none', textAlign: 'left',
    fontFamily: 'var(--font-ui)',
  },
  itemIcon:  { fontSize: 20, flexShrink: 0, width: 26, textAlign: 'center' },
  itemBody:  { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemCat:   { fontSize: 11, color: 'var(--gold)', marginTop: 2 },
  itemArrow: { fontSize: 18, color: 'var(--text-dim)', flexShrink: 0 },
}

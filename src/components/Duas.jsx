import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { DUAS_CATEGORIES } from '../data/duas'

export default function Duas({ onClose }) {
  const swipe    = useSwipeDown(onClose)
  const [catId,    setCatId]    = useState(DUAS_CATEGORIES[0].id)
  const [expanded, setExpanded] = useState(null)

  const cat  = DUAS_CATEGORIES.find(c => c.id === catId)

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={s.head}>
        <div style={s.headRow}>
          <div>
            <div style={s.headTitle}>🤲 Дуа</div>
            <div style={s.headSub}>Молитвы из Корана и Сунны</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Категории — горизонтальный скролл */}
        <div style={s.tabs} className="scroll-x">
          {DUAS_CATEGORIES.map(c => (
            <button
              key={c.id}
              style={{ ...s.tab, ...(catId === c.id ? s.tabActive : {}) }}
              onClick={() => { setCatId(c.id); setExpanded(null) }}
            >
              {c.icon} {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Список дуа */}
      <div style={s.list} className="scroll-y">
        {cat.duas.map((dua, idx) => {
          const isOpen = expanded === dua.id
          return (
            <div
              key={dua.id}
              style={{ ...s.card, ...(isOpen ? s.cardOpen : {}) }}
              onClick={() => toggleExpand(dua.id)}
            >
              {/* Номер + арабский */}
              <div style={s.cardTop}>
                <div style={s.cardNum}>{idx + 1}</div>
                <div style={s.cardAr} className="arabic gold-shimmer">{dua.ar}</div>
              </div>

              {/* Транскрипция всегда видна */}
              <div style={s.cardTranslit}>{dua.transliteration}</div>

              {/* Перевод и источник — раскрываются */}
              {isOpen && (
                <div style={s.cardBody}>
                  <div style={s.divider} />
                  <div style={s.cardTranslation}>{dua.translation}</div>
                  <div style={s.cardSource}>{dua.source}</div>
                </div>
              )}

              {/* Индикатор раскрытия */}
              <div style={{ ...s.chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ⌄
              </div>
            </div>
          )
        })}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 95,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)'
  },

  head: {
    flexShrink: 0, padding: '12px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 10,
    borderBottom: '1px solid var(--border)'
  },
  headRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
  },
  headTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text)' },
  headSub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: 'var(--text)', fontSize: 15,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', flexShrink: 0
  },

  tabs: {
    display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10,
    scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
  },
  tab: {
    flexShrink: 0, padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-ui)', outline: 'none',
    whiteSpace: 'nowrap', transition: 'all .2s'
  },
  tabActive: {
    background: 'rgba(201,168,76,.12)', borderColor: 'rgba(201,168,76,.4)',
    color: 'var(--gold)', fontWeight: 600
  },

  list: {
    flex: 1, overflowY: 'auto', padding: '12px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 10
  },

  card: {
    background: 'var(--bg-card)', borderRadius: 18,
    border: '1px solid var(--border)', padding: '14px 16px',
    cursor: 'pointer', position: 'relative',
    transition: 'border-color .2s'
  },
  cardOpen: {
    borderColor: 'rgba(201,168,76,.35)'
  },
  cardTop: {
    display: 'flex', alignItems: 'flex-start', gap: 10
  },
  cardNum: {
    flexShrink: 0, width: 22, height: 22, borderRadius: 8,
    background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginTop: 2
  },
  cardAr: {
    flex: 1, fontFamily: "'Scheherazade New',serif",
    fontSize: 'var(--arabic-size)', lineHeight: 1.8, direction: 'rtl',
    textAlign: 'right', whiteSpace: 'pre-line'
  },
  cardTranslit: {
    fontSize: 12, color: 'var(--text-translit)',
    fontStyle: 'italic', lineHeight: 1.55, marginTop: 8,
    paddingRight: 32
  },
  cardBody: {
    display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(201,168,76,.25),transparent)'
  },
  cardTranslation: {
    fontSize: 13, color: 'var(--text)', lineHeight: 1.65
  },
  cardSource: {
    fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4,
    borderTop: '1px solid var(--border)', paddingTop: 8
  },
  chevron: {
    position: 'absolute', bottom: 10, right: 14,
    fontSize: 16, color: 'var(--text-muted)',
    transition: 'transform .25s ease', lineHeight: 1
  }
}

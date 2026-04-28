import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { ASMA_HUSNA } from '../data/asmaul-husna'

export default function AsmaHusna({ onClose }) {
  const swipe    = useSwipeDown(onClose)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = search.trim()
    ? ASMA_HUSNA.filter(n =>
        n.transliteration.toLowerCase().includes(search.toLowerCase()) ||
        n.translation.toLowerCase().includes(search.toLowerCase()) ||
        n.ar.includes(search)
      )
    : ASMA_HUSNA

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={s.head}>
        <div style={s.headRow}>
          <div>
            <div style={s.headAr} className="arabic gold-shimmer">أسماء الله الحسنى</div>
            <div style={s.headRu}>99 прекрасных имён Аллаха</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <input
          style={s.search}
          placeholder="Поиск имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Сетка */}
      <div style={s.grid} className="scroll-y">
        {filtered.map(name => (
          <div key={name.n} style={s.card} onClick={() => setSelected(name)}>
            <div style={s.cardNum}>{name.n}</div>
            <div style={s.cardAr} className="arabic gold-shimmer">{name.ar}</div>
            <div style={s.cardTranslit}>{name.transliteration}</div>
            <div style={s.cardTranslation}>{name.translation}</div>
          </div>
        ))}
        <div style={{ height: 16 }} />
      </div>

      {/* Детальная карточка */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalNumRow}>
              <span style={s.modalNumBadge}>{selected.n}</span>
              <span style={s.modalNumLabel}>из 99</span>
            </div>
            <div style={s.modalAr} className="arabic gold-shimmer">{selected.ar}</div>
            <div style={s.modalTranslit}>{selected.transliteration}</div>
            <div style={s.modalDivider} />
            <div style={s.modalTranslation}>{selected.translation}</div>
            <div style={s.modalDesc}>{selected.desc}</div>
            <div style={s.modalNav}>
              <button
                style={{ ...s.modalNavBtn, opacity: selected.n > 1 ? 1 : 0.3 }}
                onClick={() => selected.n > 1 && setSelected(ASMA_HUSNA[selected.n - 2])}
                disabled={selected.n === 1}
              >← Предыдущее</button>
              <button
                style={{ ...s.modalNavBtn, opacity: selected.n < 99 ? 1 : 0.3 }}
                onClick={() => selected.n < 99 && setSelected(ASMA_HUSNA[selected.n])}
                disabled={selected.n === 99}
              >Следующее →</button>
            </div>
            <button style={s.modalClose} onClick={() => setSelected(null)}>Закрыть</button>
          </div>
        </div>
      )}
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
    flexShrink: 0, padding: '14px 16px 10px',
    display: 'flex', flexDirection: 'column', gap: 10,
    borderBottom: '1px solid var(--border)'
  },
  headRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  headAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 20, direction: 'rtl'
  },
  headRu: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: 'var(--text)', fontSize: 15,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', flexShrink: 0
  },
  search: {
    width: '100%', padding: '9px 14px', borderRadius: 12,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-ui)', boxSizing: 'border-box'
  },

  grid: {
    flex: 1, overflowY: 'auto', padding: '12px 16px 0',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    alignContent: 'start'
  },
  card: {
    background: 'var(--bg-card)', borderRadius: 16,
    border: '1px solid var(--border)',
    padding: '12px 10px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    transition: 'border-color .2s',
    position: 'relative'
  },
  cardNum: {
    position: 'absolute', top: 8, left: 10,
    fontSize: 10, fontWeight: 700, color: 'rgba(201,168,76,.5)'
  },
  cardAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 22, lineHeight: 1.5, textAlign: 'center', direction: 'rtl',
    marginTop: 6
  },
  cardTranslit: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center'
  },
  cardTranslation: {
    fontSize: 11, color: 'var(--text-dim)', textAlign: 'center'
  },

  // Detail overlay
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    padding: '0 0 env(safe-area-inset-bottom,0)'
  },
  modal: {
    width: '100%', maxWidth: 480,
    background: 'var(--bg-card)', borderRadius: '24px 24px 0 0',
    border: '1px solid var(--border)', borderBottom: 'none',
    padding: '24px 24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
  },
  modalNumRow: { display: 'flex', alignItems: 'center', gap: 6 },
  modalNumBadge: {
    fontSize: 18, fontWeight: 800, color: 'var(--gold)',
    background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)',
    borderRadius: 10, padding: '2px 10px'
  },
  modalNumLabel: { fontSize: 12, color: 'var(--text-muted)' },
  modalAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 36, lineHeight: 1.6, direction: 'rtl', textAlign: 'center'
  },
  modalTranslit: {
    fontSize: 15, fontWeight: 600, color: 'var(--text-muted)'
  },
  modalDivider: {
    width: '100%', height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent)'
  },
  modalTranslation: {
    fontSize: 18, fontWeight: 700, color: 'var(--text)', textAlign: 'center'
  },
  modalDesc: {
    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
    textAlign: 'center'
  },
  modalNav: {
    display: 'flex', gap: 10, width: '100%', marginTop: 4
  },
  modalNavBtn: {
    flex: 1, padding: '9px 0', borderRadius: 12,
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-muted)', fontSize: 13,
    cursor: 'pointer', fontFamily: 'var(--font-ui)', outline: 'none'
  },
  modalClose: {
    width: '100%', padding: '12px 0', borderRadius: 16,
    border: '1px solid rgba(201,168,76,.3)',
    background: 'rgba(201,168,76,.08)',
    color: 'var(--gold)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-ui)', outline: 'none'
  }
}

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SURAS } from '../data/suras'

export default function QuranPage({ onTabChange }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | mecca | medina

  const filtered = useMemo(() => {
    let list = SURAS
    if (filter === 'mecca')  list = list.filter(s => s.place === 'M')
    if (filter === 'medina') list = list.filter(s => s.place === 'MD')
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        s.ru.toLowerCase().includes(q) ||
        s.ar.includes(q) ||
        String(s.id).includes(q)
      )
    }
    return list
  }, [search, filter])

  return (
    <div style={s.page}>
      <div style={s.orb} />

      {/* ── Шапка ── */}
      <div style={s.header}>
        <div style={s.title}>
          <span style={s.titleAr}>القرآن الكريم</span>
          <span style={s.titleRu}>Священный Коран</span>
        </div>
        <div style={s.meta}>{SURAS.length} сур · 6 236 аятов</div>
      </div>

      {/* ── Поиск ── */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Поиск суры по имени или номеру..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── Фильтры ── */}
      <div style={s.filters}>
        {[
          { id: 'all',    label: 'Все' },
          { id: 'mecca',  label: '🕋 Мекка' },
          { id: 'medina', label: '🕌 Медина' },
        ].map(f => (
          <button key={f.id} style={{
            ...s.filterBtn,
            ...(filter === f.id ? s.filterActive : {})
          }} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Список сур ── */}
      <div style={s.list} className="scroll-y">
        {filtered.length === 0 ? (
          <div style={s.empty}>Ничего не найдено</div>
        ) : (
          filtered.map(sura => (
            <SuraRow key={sura.id} sura={sura} onClick={() => navigate(`/quran/${sura.id}`)} />
          ))
        )}
        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}

function SuraRow({ sura, onClick }) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      style={{
        ...s.row,
        background: pressed ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        transform:  pressed ? 'scale(0.985)' : 'scale(1)'
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
    >
      {/* Номер */}
      <div style={s.numWrap}>
        <div style={s.numHex}>
          <span style={s.numText}>{sura.id}</span>
        </div>
      </div>

      {/* Информация */}
      <div style={s.info}>
        <div style={s.ruName}>{sura.ru}</div>
        <div style={s.rowMeta}>
          <span style={s.ayatCount}>{sura.ayats} аятов</span>
          <span style={{ ...s.placeTag, color: sura.place === 'M' ? '#C9A84C' : '#7B6BAE' }}>
            {sura.place === 'M' ? '🕋 Мекка' : '🕌 Медина'}
          </span>
        </div>
      </div>

      {/* Арабское название + транслитерация */}
      <div style={s.arBlock}>
        <div style={s.arName} className="arabic">{sura.ar}</div>
        <div style={s.arTranslit}>{sura.translit}</div>
      </div>

      <span style={s.arrow}>›</span>
    </button>
  )
}

const s = {
  page: {
    height: '100%', background: 'var(--bg-deep)',
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden'
  },
  orb: {
    position: 'absolute', width: 260, height: 260, top: -60, right: -60,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,168,76,.08) 0%, transparent 70%)',
    filter: 'blur(50px)', pointerEvents: 'none'
  },

  header: {
    padding: 'calc(var(--safe-top) + 18px) 16px 0',
    display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0
  },
  title: { display: 'flex', alignItems: 'baseline', gap: 12 },
  titleAr: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 28, color: 'var(--gold)',
    textShadow: '0 0 20px rgba(201,168,76,.4)'
  },
  titleRu: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  meta: { fontSize: 12, color: 'var(--text-muted)' },

  searchWrap: {
    margin: '14px 16px 0',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 14px', flexShrink: 0,
    transition: 'border-color .2s'
  },
  searchIcon: { fontSize: 15, flexShrink: 0 },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: 'var(--text)', fontFamily: 'var(--font-ui)',
    fontSize: 14, padding: '13px 0'
  },
  clearBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: 13, padding: '4px', flexShrink: 0
  },

  filters: {
    display: 'flex', gap: 8, padding: '12px 16px 0', flexShrink: 0
  },
  filterBtn: {
    padding: '6px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', transition: 'all .2s ease', outline: 'none'
  },
  filterActive: {
    background: 'rgba(201,168,76,.12)',
    borderColor: 'rgba(201,168,76,.4)',
    color: 'var(--gold)'
  },

  list: {
    flex: 1, padding: '10px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 6
  },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 },

  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '12px 14px',
    cursor: 'pointer', outline: 'none', width: '100%',
    transition: 'all .18s ease', textAlign: 'left'
  },
  numWrap: { flexShrink: 0 },
  numHex: {
    width: 38, height: 38,
    background: 'linear-gradient(135deg, rgba(201,168,76,.15), rgba(201,168,76,.05))',
    border: '1px solid rgba(201,168,76,.2)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  numText: { fontSize: 13, fontWeight: 700, color: 'var(--gold)' },

  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  ruName: { fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  rowMeta: { display: 'flex', alignItems: 'center', gap: 10 },
  ayatCount: { fontSize: 11, color: 'var(--text-muted)' },
  placeTag:  { fontSize: 11 },

  arBlock: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    flexShrink: 0, gap: 2,
  },
  arName: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 20, color: 'var(--gold-dim)',
    direction: 'rtl',
  },
  arTranslit: {
    fontSize: 11, color: 'var(--text-muted)',
    fontStyle: 'italic', textAlign: 'right',
  },
  arrow: { color: 'var(--text-dim)', fontSize: 20, flexShrink: 0 }
}

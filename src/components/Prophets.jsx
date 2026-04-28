import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { PROPHETS } from '../data/prophets'

export default function Prophets({ onClose }) {
  const swipe    = useSwipeDown(onClose)
  const [selected, setSelected] = useState(null)

  if (selected) {
    return <ProphetDetail prophet={selected} onBack={() => setSelected(null)} onClose={onClose} />
  }

  return (
    <div style={s.wrap} {...swipe}>
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.headInfo}>
          <div style={s.headTitle}>Истории пророков</div>
          <div style={s.headSub}>На основе Корана и достоверных хадисов</div>
        </div>
      </div>

      <div style={s.list} className="scroll-y">
        <div style={s.note}>
          عليهم السلام — мир им всем
        </div>

        {PROPHETS.map((p, i) => (
          <button key={p.id} style={{ ...s.card, background: p.colorDim, borderColor: p.border }}
            onClick={() => setSelected(p)}>
            <div style={{ ...s.cardIcon, background: p.color + '22', border: `1.5px solid ${p.color}44` }}>
              <span style={s.cardEmoji}>{p.emoji}</span>
            </div>
            <div style={s.cardBody}>
              <div style={s.cardTop}>
                <span style={{ ...s.cardName, color: p.color }}>{p.name}</span>
                <span style={s.cardArabic}>{p.arabic}</span>
              </div>
              <div style={s.cardTitle}>{p.title}</div>
              <div style={s.cardShort}>{p.short}</div>
            </div>
            <span style={s.arrow}>›</span>
          </button>
        ))}

        <div style={s.source}>
          <div style={s.sourceText}>
            Все сведения взяты из Корана и достоверных хадисов. Спорные и слабые предания исключены.
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

function ProphetDetail({ prophet: p, onBack, onClose }) {
  const [openSection, setOpenSection] = useState(0)

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={{ ...s.head, borderColor: p.border }}>
        <button style={s.backBtn} onClick={onBack}>‹</button>
        <div style={s.headInfo}>
          <div style={{ ...s.headTitle, color: p.color }}>{p.name}</div>
          <div style={s.headSub}>{p.title}</div>
        </div>
        <div style={{ fontFamily:"'Scheherazade New',serif", fontSize: 28, color: p.color, marginLeft: 'auto', flexShrink: 0 }}>
          {p.arabic}
        </div>
      </div>

      <div style={s.detail} className="scroll-y">
        {/* Карточка-вступление */}
        <div style={{ ...s.introCard, background: p.colorDim, borderColor: p.border }}>
          <div style={s.introEmoji}>{p.emoji}</div>
          <div style={s.introText}>{p.short}</div>
          <div style={{ ...s.quranBadge, color: p.color, borderColor: p.border, background: p.color + '15' }}>
            📖 {p.quranMention}
          </div>
        </div>

        {/* Разделы */}
        {p.sections.map((sec, i) => {
          const isOpen = openSection === i
          return (
            <button key={i}
              style={{ ...s.secCard, ...(isOpen ? { ...s.secCardOpen, borderColor: p.border } : {}) }}
              onClick={() => setOpenSection(isOpen ? -1 : i)}
            >
              <div style={s.secTop}>
                <span style={s.secIcon}>{sec.icon}</span>
                <span style={{ ...s.secTitle, color: isOpen ? p.color : 'var(--text)' }}>{sec.title}</span>
                <span style={s.secChevron}>{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div style={s.secBody}>
                  {sec.text.split('\n\n').map((para, j) => (
                    <p key={j} style={para.startsWith('«') ? s.ayat : s.para}>{para}</p>
                  ))}
                </div>
              )}
            </button>
          )
        })}

        <div style={s.source}>
          <div style={s.sourceText}>
            Все сведения взяты из Корана и достоверных хадисов.
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
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
  headInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  headTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text)' },
  headSub:   { fontSize: 12, color: 'var(--text-muted)' },

  list: {
    flex: 1, overflowY: 'auto', padding: '12px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  note: {
    textAlign: 'center', fontSize: 16, color: 'var(--gold)',
    fontFamily: "'Scheherazade New', serif", padding: '4px 0 8px',
    letterSpacing: '.05em',
  },

  card: {
    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14,
    borderRadius: 18, border: '1px solid', padding: '16px',
    cursor: 'pointer', outline: 'none', textAlign: 'left',
    transition: 'opacity .15s',
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardBody:  { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  cardTop:   { display: 'flex', alignItems: 'center', gap: 8 },
  cardName:  { fontSize: 18, fontWeight: 800 },
  cardArabic:{ fontFamily:"'Scheherazade New',serif", fontSize: 18, color: 'rgba(255,255,255,.5)' },
  cardTitle: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3 },
  cardShort: { fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginTop: 2 },
  arrow:     { fontSize: 22, color: 'rgba(255,255,255,.2)', flexShrink: 0, alignSelf: 'center' },

  // Детальный экран
  detail: { flex: 1, overflowY: 'auto', padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 },

  introCard: {
    borderRadius: 18, border: '1px solid', padding: '20px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
  },
  introEmoji: { fontSize: 48 },
  introText:  { fontSize: 15, color: 'var(--text)', lineHeight: 1.6 },
  quranBadge: {
    fontSize: 12, borderRadius: 20, border: '1px solid',
    padding: '6px 14px', lineHeight: 1.4, textAlign: 'center',
  },

  secCard: {
    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '14px 16px', cursor: 'pointer', outline: 'none', textAlign: 'left',
    transition: 'border-color .2s',
  },
  secCardOpen: {
    background: 'linear-gradient(135deg,rgba(201,168,76,.06),var(--bg-card))',
  },
  secTop:    { display: 'flex', alignItems: 'center', gap: 10 },
  secIcon:   { fontSize: 20, flexShrink: 0 },
  secTitle:  { flex: 1, fontSize: 15, fontWeight: 700, transition: 'color .2s' },
  secChevron:{ fontSize: 9, color: 'rgba(255,255,255,.25)' },
  secBody:   { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 },

  para: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 },
  ayat: {
    fontSize: 13, color: 'var(--gold)', lineHeight: 1.7, margin: 0,
    borderLeft: '2px solid rgba(201,168,76,.4)', paddingLeft: 12,
    fontStyle: 'italic',
  },

  source: {
    borderRadius: 12, border: '1px solid var(--border)',
    padding: '10px 14px', marginTop: 4,
  },
  sourceText: { fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 },
}

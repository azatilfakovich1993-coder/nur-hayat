import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { RAMADAN_GUIDE } from '../data/ramadan'

const TABS = [
  { id: 'basics',   label: '📖 Основы' },
  { id: 'schedule', label: '🗓 День' },
  { id: 'fast',     label: '🍽 Пост' },
  { id: 'ibadat',   label: '🤲 Ибадат' },
  { id: 'important',label: '❓ Важное' },
]

const GOLD    = 'rgba(201,168,76,1)'
const GOLD_BG = 'rgba(201,168,76,0.08)'
const GOLD_BR = 'rgba(201,168,76,0.25)'
const GREEN   = '#2ea87a'
const RED     = '#e05050'

/* ── Sub-components ─────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: GOLD,
      marginBottom: 10, marginTop: 4,
    }}>
      {children}
    </div>
  )
}

function AyahCard({ ayah }) {
  return (
    <div style={{
      background: GOLD_BG,
      border: `1px solid ${GOLD_BR}`,
      borderRadius: 16,
      padding: '16px 14px',
      marginBottom: 14,
    }}>
      <div
        className="arabic gold-shimmer"
        style={{
          fontFamily: "'Scheherazade New',serif",
          fontSize: 'var(--arabic-size)',
          lineHeight: 2,
          direction: 'rtl',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {ayah.ar}
      </div>
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent)', marginBottom: 8 }} />
      <div style={{ fontSize: 11, color: 'var(--text-translit)', fontStyle: 'italic', textAlign: 'center', marginBottom: 6, lineHeight: 1.6 }}>
        {ayah.translit}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, textAlign: 'center', marginBottom: 6 }}>
        {ayah.translation}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        {ayah.ref}
      </div>
    </div>
  )
}

function HadithCard({ hadith }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 6 }}>Хадис</div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 6 }}>
        «{hadith.text}»
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {hadith.source}</div>
    </div>
  )
}

function DuaCard({ dua, gold = false }) {
  return (
    <div style={{
      background: gold ? GOLD_BG : 'rgba(255,255,255,0.03)',
      border: `1px solid ${gold ? GOLD_BR : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14,
      padding: '14px',
    }}>
      {dua.title && (
        <div style={{ fontSize: 12, fontWeight: 700, color: gold ? GOLD : 'var(--text-muted)', marginBottom: 8 }}>
          {dua.title}
        </div>
      )}
      <div
        className="arabic gold-shimmer"
        style={{
          fontFamily: "'Scheherazade New',serif",
          fontSize: 'var(--arabic-size)',
          lineHeight: 2,
          direction: 'rtl',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {dua.ar}
      </div>
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,.2),transparent)', marginBottom: 8 }} />
      <div style={{ fontSize: 11, color: 'var(--text-translit)', fontStyle: 'italic', textAlign: 'center', marginBottom: 6, lineHeight: 1.5 }}>
        {dua.translit}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, textAlign: 'center', marginBottom: dua.source ? 6 : 0 }}>
        {dua.translation}
      </div>
      {dua.source && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          {dua.source}
        </div>
      )}
    </div>
  )
}

/* ── Tab Panels ─────────────────────────────────────── */

function MotivCard({ motiv }) {
  return (
    <div style={{
      background: 'rgba(201,168,76,0.07)',
      border: '1px solid rgba(201,168,76,0.22)',
      borderRadius: 16, padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{motiv.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(201,168,76,1)' }}>{motiv.title}</span>
      </div>
      {motiv.text.split('\n\n').map((p, i) => (
        <div key={i} style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{p}</div>
      ))}
    </div>
  )
}

function BasicsTab() {
  const { basics } = RAMADAN_GUIDE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {basics.motiv && <MotivCard motiv={basics.motiv} />}
      <AyahCard ayah={basics.ayah} />
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>
        {basics.description}
      </div>
      <HadithCard hadith={basics.hadith} />
    </div>
  )
}

function ScheduleTab() {
  const { schedule } = RAMADAN_GUIDE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {schedule.map((item, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          {/* Colored dot + icon column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: item.color + '20',
              border: `1px solid ${item.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {item.icon}
            </div>
            {i < schedule.length - 1 && (
              <div style={{ width: 2, height: 16, background: item.color + '30', borderRadius: 2 }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: item.color, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
              {item.time}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {item.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FastTab() {
  const { breaks, suhoor, iftar } = RAMADAN_GUIDE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Нарушает пост */}
      <div>
        <SectionTitle>🚫 Нарушает пост</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {breaks.forbidden.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(224,80,80,0.07)',
              border: '1px solid rgba(224,80,80,0.2)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: RED, flexShrink: 0, marginTop: 5 }} />
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Не нарушает пост */}
      <div>
        <SectionTitle>✅ НЕ нарушает пост</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {breaks.allowed.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(46,168,122,0.07)',
              border: '1px solid rgba(46,168,122,0.2)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, flexShrink: 0, marginTop: 5 }} />
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Сухур */}
      <div>
        <SectionTitle>🌙 Сухур — советы</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {suhoor.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ color: GOLD, fontSize: 12, flexShrink: 0, marginTop: 3 }}>◆</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>{tip}</div>
            </div>
          ))}
        </div>
        <DuaCard dua={{ ...suhoor.dua, title: 'Нийят на пост' }} gold />
      </div>

      {/* Ифтар */}
      <div>
        <SectionTitle>🌅 Ифтар — советы</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {iftar.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ color: GOLD, fontSize: 12, flexShrink: 0, marginTop: 3 }}>◆</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>{tip}</div>
            </div>
          ))}
        </div>
        <DuaCard dua={{ ...iftar.dua, title: 'Дуа разговения' }} gold />
      </div>

    </div>
  )
}

function IbadatTab() {
  const { ibadat } = RAMADAN_GUIDE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {ibadat.map((item, i) => (
        <div key={i} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: GOLD_BG,
            border: `1px solid ${GOLD_BR}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {item.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {item.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ImportantTab() {
  const { missed, duas } = RAMADAN_GUIDE
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Пропущенные посты */}
      <div>
        <SectionTitle>📋 Пропущенные посты</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div style={{
            background: 'rgba(74,144,217,0.07)',
            border: '1px solid rgba(74,144,217,0.2)',
            borderRadius: 14, padding: '14px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4A90D9', marginBottom: 6 }}>
              {missed.kada.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {missed.kada.text}
            </div>
          </div>

          <div style={{
            background: 'rgba(224,80,80,0.07)',
            border: '1px solid rgba(224,80,80,0.2)',
            borderRadius: 14, padding: '14px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 6 }}>
              {missed.kaffarah.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {missed.kaffarah.text}
            </div>
          </div>

          <div style={{
            background: 'rgba(46,168,122,0.07)',
            border: '1px solid rgba(46,168,122,0.2)',
            borderRadius: 14, padding: '14px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 6 }}>
              {missed.fidya.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {missed.fidya.text}
            </div>
          </div>

        </div>
      </div>

      {/* Дуа */}
      <div>
        <SectionTitle>🤲 Дуа Рамадана</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {duas.map((dua, i) => (
            <DuaCard key={i} dua={dua} gold={i % 2 === 0} />
          ))}
        </div>
      </div>

    </div>
  )
}

/* ── Main Component ─────────────────────────────────── */

export default function RamadanGuide({ onClose }) {
  const swipe      = useSwipeDown(onClose)
  const [activeTab, setActiveTab] = useState('basics')

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 95,
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-ui)',
    }} {...swipe}>

      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px 0',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              🌙 Рамадан-гид
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Полный путеводитель по священному месяцу
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-ui)', flexShrink: 0,
              outline: 'none',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 12,
        }}
          className="scroll-y"
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: activeTab === tab.id
                  ? '1px solid rgba(201,168,76,0.45)'
                  : '1px solid var(--border)',
                background: activeTab === tab.id
                  ? 'rgba(201,168,76,0.12)'
                  : 'transparent',
                color: activeTab === tab.id ? GOLD : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                outline: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="scroll-y"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {activeTab === 'basics'    && <BasicsTab />}
        {activeTab === 'schedule'  && <ScheduleTab />}
        {activeTab === 'fast'      && <FastTab />}
        {activeTab === 'ibadat'    && <IbadatTab />}
        {activeTab === 'important' && <ImportantTab />}
      </div>

    </div>
  )
}

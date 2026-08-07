import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { useBackHandler } from '../hooks/useBackHandler'
import DawnLandscape from './DawnLandscape'

const PILLARS = [
  {
    num: 1,
    icon: '⭐',
    ar: 'الشَّهَادَة',
    name: 'Шахада',
    translit: 'аш-Шахада',
    sub: 'Свидетельство веры',
    color: '#C9A84C',
    text: 'Произнести с убеждением: «Нет божества кроме Аллаха, и Мухаммад — Его Посланник». Это вход в ислам и основа всей веры. Без Таухида — единобожия — всё остальное теряет смысл.',
    note: 'Это уже твой шаг 2 в пути новичка',
  },
  {
    num: 2,
    icon: '🕌',
    ar: 'الصَّلَاة',
    name: 'Намаз',
    translit: 'ас-Салят',
    sub: '5 молитв каждый день',
    color: '#7B6BAE',
    text: 'Фаджр, Зухр, Аср, Магриб, Иша — пять намазов в определённое время. Намаз — это прямой разговор с Аллахом. Это защита от плохого и напоминание о смысле жизни.',
    note: 'Фаджр на рассвете · Зухр в полдень · Аср после полудня · Магриб на закате · Иша ночью',
    hadith: '«Намаз — это свет» (Муслим)',
  },
  {
    num: 3,
    icon: '🌿',
    ar: 'الزَّكَاة',
    name: 'Закят',
    translit: 'аз-Закят',
    sub: 'Очистительный налог',
    color: '#52b788',
    text: '2.5% от сбережений, которые хранятся более года — отдаётся нуждающимся. Закят очищает душу от жадности и имущество от скверны. Это не благотворительность — это обязанность.',
    note: 'Обязателен если имущество превышает нисаб (~85г золота) и хранится год',
  },
  {
    num: 4,
    icon: '🌙',
    ar: 'الصَّوْم',
    name: 'Пост',
    translit: 'ас-Саум',
    sub: 'Месяц Рамадан',
    color: '#4a7cc7',
    text: 'Весь месяц Рамадан — воздержание от еды, питья и интимной близости от рассвета до заката. Пост учит терпению, благодарности и сочувствию к голодающим. Это месяц Корана и ибадата.',
    note: 'Рамадан — 9-й месяц исламского календаря, каждый год смещается на ~11 дней',
    hadith: '«Пост — щит» (Бухари)',
  },
  {
    num: 5,
    icon: '🕋',
    ar: 'الحَجّ',
    name: 'Хадж',
    translit: 'аль-Хадж',
    sub: 'Паломничество в Мекку',
    color: '#d06060',
    text: 'Один раз в жизни — для тех кто способен физически и материально — отправиться в Мекку в месяц Зуль-Хиджа. Хадж — это единство всех мусульман мира, обнуление грехов и возвращение к Аллаху.',
    note: 'Обязателен один раз в жизни при наличии здоровья и средств',
  },
]

export default function PillarsOfIslam({ onClose }) {
  const [selected, setSelected] = useState(null)
  const swipe = useSwipeDown(selected ? () => setSelected(null) : onClose)

  useBackHandler(!!selected, () => setSelected(null))

  if (selected) {
    return <PillarDetail pillar={selected} onBack={() => setSelected(null)} swipe={swipe} />
  }

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={s.head}>
        <DawnLandscape />
        <button style={{ ...s.backBtn, position: 'relative', zIndex: 1 }} onClick={onClose}>‹</button>
        <div style={{ ...s.headMid, position: 'relative', zIndex: 1 }}>
          <div style={s.headTitle}>5 столпов ислама</div>
          <div style={s.headSub}>Основы практики каждого мусульманина</div>
        </div>
      </div>

      <div style={s.scroll} className="scroll-y">

        <div style={s.intro}>
          Ислам держится на пяти столпах — это то, что обязан делать каждый мусульманин. Понять их — значит понять всю картину пути.
        </div>

        {/* Арабское название */}
        <div style={s.titleAr} className="arabic gold-shimmer">أَرْكَانُ الإِسْلَام</div>

        {/* Столпы — сетка карточек */}
        <div style={s.grid}>
          {PILLARS.map((p, i) => (
            <button key={i} style={{ ...s.gridCard, borderColor: p.color + '40' }} onClick={() => setSelected(p)}>
              <div style={{ ...s.numBadge, background: p.color + '22', color: p.color, borderColor: p.color + '50' }}>
                {p.num}
              </div>
              <div style={s.gridIcon}>{p.icon}</div>
              <div style={{ ...s.gridName, color: p.color }}>{p.name}</div>
              <div style={s.gridSub}>{p.sub}</div>
            </button>
          ))}
        </div>

        {/* Итог */}
        <div style={s.summaryCard}>
          <div style={s.summaryTitle}>В чём смысл столпов?</div>
          <div style={s.summaryText}>
            Шахада — верь. Намаз — помни Аллаха 5 раз в день. Закят — делись. Пост — воздерживайся. Хадж — возвращайся к истокам.
            {'\n\n'}
            Столпы — не список правил, а структура духовной жизни. Каждый из них воспитывает определённое качество.
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

// ── Детальный экран одного столпа ───────────────────────────────────────────
function PillarDetail({ pillar: p, onBack, swipe }) {
  return (
    <div style={s.wrap} {...swipe}>
      <div style={s.head}>
        <button style={{ ...s.backBtn, position: 'relative', zIndex: 1 }} onClick={onBack}>‹</button>
        <div style={{ ...s.headMid, position: 'relative', zIndex: 1 }}>
          <div style={s.headTitle}>{p.name}</div>
          <div style={s.headSub}>{p.sub}</div>
        </div>
      </div>

      <div style={s.scroll} className="scroll-y">
        <div style={{ ...s.detailHero, borderColor: p.color + '45' }}>
          <div style={{ ...s.numBadge, background: p.color + '22', color: p.color, borderColor: p.color + '50' }}>{p.num}</div>
          <div style={s.detailIcon}>{p.icon}</div>
          <div style={s.detailAr} className="arabic">{p.ar}</div>
          <div style={{ ...s.translit, marginTop: 6 }}>{p.translit}</div>
        </div>

        <div style={s.text}>{p.text}</div>
        {p.note && (
          <div style={s.note}>
            <span style={{ color: p.color, marginRight: 6 }}>ℹ</span>
            {p.note}
          </div>
        )}
        {p.hadith && <div style={s.hadith}>{p.hadith}</div>}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-deep)',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 20px 14px',
    borderBottom: '1px solid var(--border)',
    position: 'relative', overflow: 'hidden',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1,
  },
  headMid: { flex: 1 },
  headTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text)' },
  headSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },

  scroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 0' },

  intro: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16,
  },
  titleAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 22, textAlign: 'center', marginBottom: 20,
    direction: 'rtl',
  },

  numBadge: {
    width: 26, height: 26, borderRadius: 8,
    border: '1px solid', fontSize: 12, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20,
  },
  gridCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'var(--bg-card)', borderRadius: 16, border: '1px solid',
    padding: '16px 10px', cursor: 'pointer', outline: 'none', position: 'relative',
  },
  gridIcon: { fontSize: 26, marginTop: 4 },
  gridName: { fontSize: 15, fontWeight: 700 },
  gridSub:  { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' },

  detailHero: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    background: 'var(--bg-card)', border: '1px solid', borderRadius: 20,
    padding: '20px 16px', marginBottom: 16,
  },
  detailIcon: { fontSize: 40, margin: '8px 0' },
  detailAr: { fontFamily: "'Scheherazade New',serif", fontSize: 24, direction: 'rtl', color: 'var(--gold)' },

  translit: {
    fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8,
  },
  text: {
    fontSize: 13, color: 'var(--text)', lineHeight: 1.65, marginBottom: 8,
  },
  note: {
    fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
    background: 'rgba(255,255,255,.03)',
    borderRadius: 8, padding: '8px 10px', marginBottom: 6,
  },
  hadith: {
    fontSize: 12, color: 'var(--gold-dim)', fontStyle: 'italic', marginTop: 4,
  },

  summaryCard: {
    background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',
    border: '1px solid rgba(201,168,76,.25)', borderRadius: 16,
    padding: '16px', marginTop: 4,
  },
  summaryTitle: { fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 10 },
  summaryText: {
    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
    whiteSpace: 'pre-line',
  },
}

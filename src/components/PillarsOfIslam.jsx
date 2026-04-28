import { useState } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'

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
  const swipe    = useSwipeDown(onClose)
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={s.wrap} {...swipe}>
      {/* Шапка */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.headMid}>
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

        {/* Столпы */}
        {PILLARS.map((p, i) => {
          const open = expanded === i
          return (
            <button
              key={i}
              style={{ ...s.card, borderColor: open ? p.color + '70' : 'var(--border)', background: open ? `rgba(0,0,0,.0)` : 'var(--bg-card)' }}
              onClick={() => setExpanded(open ? null : i)}
            >
              {/* Строка заголовка */}
              <div style={s.cardRow}>
                <div style={{ ...s.numBadge, background: p.color + '22', color: p.color, borderColor: p.color + '50' }}>
                  {p.num}
                </div>
                <div style={s.cardIcon}>{p.icon}</div>
                <div style={s.cardMain}>
                  <div style={s.cardTop2}>
                    <span style={{ ...s.cardName, color: open ? p.color : 'var(--text)' }}>{p.name}</span>
                    <span style={s.cardAr} className="arabic">{p.ar}</span>
                  </div>
                  <div style={s.cardSub}>{p.sub}</div>
                </div>
                <span style={{ ...s.arrow, transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
              </div>

              {/* Раскрытый контент */}
              {open && (
                <div style={s.content}>
                  <div style={s.translit}>{p.translit}</div>
                  <div style={s.text}>{p.text}</div>
                  {p.note && (
                    <div style={s.note}>
                      <span style={{ color: p.color, marginRight: 6 }}>ℹ</span>
                      {p.note}
                    </div>
                  )}
                  {p.hadith && (
                    <div style={s.hadith}>{p.hadith}</div>
                  )}
                </div>
              )}
            </button>
          )
        })}

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

  card: {
    width: '100%', textAlign: 'left', cursor: 'pointer',
    borderRadius: 16, border: '1px solid',
    padding: '14px 14px', marginBottom: 10,
    outline: 'none', transition: 'border-color .2s',
  },
  cardRow: { display: 'flex', alignItems: 'center', gap: 10 },
  numBadge: {
    width: 26, height: 26, borderRadius: 8,
    border: '1px solid', fontSize: 12, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardIcon: { fontSize: 22, flexShrink: 0 },
  cardMain: { flex: 1, minWidth: 0 },
  cardTop2: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: 700, transition: 'color .2s' },
  cardAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 14, color: 'var(--text-muted)', direction: 'rtl',
  },
  cardSub: { fontSize: 12, color: 'var(--text-muted)' },
  arrow: {
    fontSize: 20, color: 'var(--text-muted)',
    flexShrink: 0, transition: 'transform .2s', display: 'inline-block',
  },

  content: {
    marginTop: 12, paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
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

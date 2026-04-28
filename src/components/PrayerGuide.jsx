import { useState, useEffect } from 'react'
import { useSwipeDown } from '../hooks/useSwipeDown'
import { PRAYER_STEPS, PRAYER_TIMES_INFO, WHY_5_PRAYERS } from '../data/prayer-guide'

// ── Карта изображений по позиции ───────────────────────────────
const STEP_IMAGES = {
  wudu:       '/prayer/standing.png',
  niyyah:     '/prayer/standing.png',
  takbir:     '/prayer/takbir.png',
  qiyam:      '/prayer/qiyam.png',
  ruku:       '/prayer/ruku.png',
  itidal:     '/prayer/standing.png',
  sujud:      '/prayer/sujud.png',
  jalsa:      '/prayer/jalsa.png',
  tashahhud:  '/prayer/tashahhud.png',
  salam:      '/prayer/salam.png',
}

// (unused — kept for reference only)
function PrayerFigure({ posture, color }) {
  const c = color || '#C9A84C'
  // Уникальный ID градиента для каждой позиции — исключает конфликты
  const gid = `pg_${posture}`

  return (
    <svg
      viewBox="0 0 120 190"
      width="130"
      height="195"
      style={{ overflow: 'visible', filter: `drop-shadow(0 0 16px ${c}55)` }}
    >
      <defs>
        {/* Градиент по всей высоте фигуры (userSpaceOnUse — одинаковый для всех частей) */}
        <linearGradient id={gid} x1="60" y1="5" x2="60" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F8E88A" />
          <stop offset="45%"  stopColor={c} />
          <stop offset="100%" stopColor={c} stopOpacity="0.65" />
        </linearGradient>
      </defs>

      {posture === 'standing'  && <StandNormal  f={`url(#${gid})`} />}
      {posture === 'takbir'    && <StandTakbir  f={`url(#${gid})`} />}
      {posture === 'qiyam'     && <StandQiyam   f={`url(#${gid})`} />}
      {posture === 'itidal'    && <StandNormal  f={`url(#${gid})`} />}
      {posture === 'ruku'      && <BowRuku      f={`url(#${gid})`} c={c} />}
      {posture === 'sujud'     && <FullSujud    f={`url(#${gid})`} c={c} />}
      {posture === 'sitting'   && <SitJalsa     f={`url(#${gid})`} />}
      {posture === 'tashahhud' && <SitTashahhud f={`url(#${gid})`} />}
      {posture === 'salam'     && <StandSalam   f={`url(#${gid})`} />}

      {/* Молитвенный коврик */}
      <rect x="6" y="180" width="108" height="8" rx="4" fill={c} fillOpacity="0.12" />
      <line x1="6" y1="183" x2="114" y2="183" stroke={c} strokeWidth="1" strokeOpacity="0.3" />
      <line x1="16" y1="185" x2="104" y2="185" stroke={c} strokeWidth="0.5" strokeOpacity="0.15" />
    </svg>
  )
}

/* ── Стоя обычно (нийят, итидаль) — вид спереди ── */
function StandNormal({ f }) {
  return (
    <g fill={f}>
      <circle cx="60" cy="18" r="14" />
      <path d="M55 32 L54 40 L66 40 L65 32 Z" />
      <path d="M44 40 C41 54 40 72 41 95 L79 95 C80 72 79 54 76 40 Z" />
      {/* Руки опущены */}
      <path d="M44 50 C37 63 32 82 30 100 C29 105 33 107 38 106 C42 105 44 101 45 97 L51 64 Z" />
      <ellipse cx="32" cy="107" rx="9" ry="6" />
      <path d="M76 50 C83 63 88 82 90 100 C91 105 87 107 82 106 C78 105 76 101 75 97 L69 64 Z" />
      <ellipse cx="88" cy="107" rx="9" ry="6" />
      {/* Ноги */}
      <path d="M41 95 C39 115 37 140 36 162 C35 167 39 170 45 169 C50 169 53 165 54 161 L58 95 Z" />
      <path d="M79 95 C81 115 83 140 84 162 C85 167 81 170 75 169 C70 169 67 165 66 161 L62 95 Z" />
      <ellipse cx="42" cy="170" rx="14" ry="5" />
      <ellipse cx="78" cy="170" rx="14" ry="5" />
    </g>
  )
}

/* ── Такбир — руки подняты до уровня ушей ── */
function StandTakbir({ f }) {
  return (
    <g fill={f}>
      <circle cx="60" cy="18" r="14" />
      <path d="M55 32 L54 40 L66 40 L65 32 Z" />
      <path d="M44 40 C41 54 40 72 41 95 L79 95 C80 72 79 54 76 40 Z" />
      {/* Левая рука поднята — локоть вверх, ладонь у левого уха */}
      <path d="M44 50 C38 44 26 30 14 17 C11 14 12 11 16 11 C19 11 23 14 28 22 L50 58 Z" />
      <ellipse cx="14" cy="13" rx="8" ry="10" />
      {/* Правая рука */}
      <path d="M76 50 C82 44 94 30 106 17 C109 14 108 11 104 11 C101 11 97 14 92 22 L70 58 Z" />
      <ellipse cx="106" cy="13" rx="8" ry="10" />
      {/* Ноги */}
      <path d="M41 95 C39 115 37 140 36 162 C35 167 39 170 45 169 C50 169 53 165 54 161 L58 95 Z" />
      <path d="M79 95 C81 115 83 140 84 162 C85 167 81 170 75 169 C70 169 67 165 66 161 L62 95 Z" />
      <ellipse cx="42" cy="170" rx="14" ry="5" />
      <ellipse cx="78" cy="170" rx="14" ry="5" />
    </g>
  )
}

/* ── Кыям — правая рука поверх левой на груди ── */
function StandQiyam({ f }) {
  return (
    <g fill={f}>
      <circle cx="60" cy="18" r="14" />
      <path d="M55 32 L54 40 L66 40 L65 32 Z" />
      <path d="M44 40 C41 54 40 72 41 95 L79 95 C80 72 79 54 76 40 Z" />
      {/* Правое предплечье (сверху) — идёт слева направо */}
      <path d="M76 52 C70 56 62 60 50 62 C46 63 44 61 45 58 C46 56 50 55 54 55 L76 46 Z" />
      <ellipse cx="48" cy="60" rx="9" ry="5" />
      {/* Левое предплечье (снизу) — идёт справа налево */}
      <path d="M44 56 C50 60 60 64 72 65 C76 66 78 64 77 61 C76 59 72 58 68 58 L44 50 Z" />
      <ellipse cx="74" cy="64" rx="9" ry="5" />
      {/* Ноги */}
      <path d="M41 95 C39 115 37 140 36 162 C35 167 39 170 45 169 C50 169 53 165 54 161 L58 95 Z" />
      <path d="M79 95 C81 115 83 140 84 162 C85 167 81 170 75 169 C70 169 67 165 66 161 L62 95 Z" />
      <ellipse cx="42" cy="170" rx="14" ry="5" />
      <ellipse cx="78" cy="170" rx="14" ry="5" />
    </g>
  )
}

/* ── Руку — поясной поклон (вид сбоку, лицом вправо) ── */
function BowRuku({ f, c }) {
  return (
    <g fill={f}>
      {/* Голова (справа, смотрит вниз) */}
      <circle cx="100" cy="65" r="13" />
      {/* Шея */}
      <path d="M90 70 L87 82 L96 86 L100 74 Z" />
      {/* Торс — горизонтальный (90°) */}
      <path d="M20 76 C28 72 55 66 88 67 L90 81 C57 82 30 88 20 92 Z" />
      {/* Ноги — вертикально */}
      <path d="M20 80 L16 172 L32 172 L36 80 Z" />
      <path d="M32 82 L28 174 L44 174 L48 82 Z" />
      <ellipse cx="23" cy="173" rx="14" ry="5" />
      <ellipse cx="36" cy="175" rx="14" ry="5" />
      {/* Руки — свисают с торса вниз, ладони на коленях */}
      <path d="M52 80 L46 122 C45 127 49 129 54 128 C58 127 60 123 60 119 L64 84 Z" />
      <ellipse cx="50" cy="128" rx="9" ry="5" />
      <path d="M66 78 L60 120 C59 125 63 127 68 126 C72 125 74 121 74 117 L78 82 Z" />
      <ellipse cx="64" cy="126" rx="9" ry="5" />
    </g>
  )
}

/* ── Суджуд — земной поклон (вид сбоку) ── */
function FullSujud({ f, c }) {
  return (
    <g fill={f}>
      {/* Голова касается коврика — справа */}
      <ellipse cx="98" cy="168" rx="13" ry="11" transform="rotate(-10,98,168)" />
      {/* Шея/плечо */}
      <path d="M86 160 L78 152 L84 146 L93 156 Z" />
      {/* Торс — диагональный снизу-справа к бёдрам вверху-слева */}
      <path d="M30 90 C44 108 62 132 80 154 L90 150 C72 128 54 104 36 86 Z" />
      {/* Бёдра — наивысшая точка */}
      <ellipse cx="28" cy="90" rx="20" ry="15" />
      {/* Голени */}
      <path d="M18 92 C14 110 12 134 12 158 L28 158 C28 136 30 112 36 92 Z" />
      <path d="M30 94 C26 112 24 136 24 160 L40 160 C40 138 42 114 46 94 Z" />
      {/* Ступни (пальцы упираются в пол) */}
      <ellipse cx="18" cy="159" rx="7" ry="12" transform="rotate(-8,18,159)" />
      <ellipse cx="31" cy="161" rx="7" ry="12" transform="rotate(-8,31,161)" />
      {/* Левая рука — плоско на полу слева от головы */}
      <path d="M78 158 L55 165 C52 166 52 170 56 170 L80 163 Z" />
      <ellipse cx="53" cy="169" rx="8" ry="4" />
      {/* Правая рука — плоско на полу справа от головы */}
      <path d="M94 162 L114 167 C117 168 117 171 114 171 L92 166 Z" />
      <ellipse cx="116" cy="170" rx="7" ry="4" />
    </g>
  )
}

/* ── Джалса — сидение между суджудами ── */
function SitJalsa({ f }) {
  return (
    <g fill={f}>
      <circle cx="55" cy="36" r="13" />
      <path d="M51 49 L50 57 L61 57 L60 49 Z" />
      {/* Торс */}
      <path d="M41 57 C39 70 38 84 39 98 L71 98 C72 84 71 70 69 57 Z" />
      {/* Бёдра */}
      <ellipse cx="55" cy="102" rx="22" ry="10" />
      {/* Левая нога — подогнута назад (горизонтально влево) */}
      <path d="M38 100 C30 106 18 112 10 124 C8 128 10 132 14 132 L40 124 C40 116 39 108 38 100 Z" />
      <ellipse cx="11" cy="132" rx="5" ry="11" transform="rotate(20,11,132)" />
      {/* Правая нога — вертикально (ступня плоская) */}
      <path d="M70 100 C74 112 76 128 74 146 C73 150 69 152 65 151 C61 150 59 146 60 142 L64 102 Z" />
      <ellipse cx="68" cy="151" rx="14" ry="5" />
      {/* Левая рука на колено */}
      <path d="M41 72 C35 82 29 96 27 110 C26 114 29 116 33 115 C37 114 39 110 40 106 L48 84 Z" />
      <ellipse cx="28" cy="115" rx="8" ry="5" />
      {/* Правая рука на колено */}
      <path d="M69 72 C75 82 81 96 83 110 C84 114 81 116 77 115 C73 114 71 110 70 106 L62 84 Z" />
      <ellipse cx="82" cy="115" rx="8" ry="5" />
    </g>
  )
}

/* ── Ташаххуд — как джалса, но с поднятым указательным пальцем ── */
function SitTashahhud({ f }) {
  return (
    <g fill={f}>
      <circle cx="55" cy="36" r="13" />
      <path d="M51 49 L50 57 L61 57 L60 49 Z" />
      <path d="M41 57 C39 70 38 84 39 98 L71 98 C72 84 71 70 69 57 Z" />
      <ellipse cx="55" cy="102" rx="22" ry="10" />
      {/* Левая нога */}
      <path d="M38 100 C30 106 18 112 10 124 C8 128 10 132 14 132 L40 124 C40 116 39 108 38 100 Z" />
      <ellipse cx="11" cy="132" rx="5" ry="11" transform="rotate(20,11,132)" />
      {/* Правая нога */}
      <path d="M70 100 C74 112 76 128 74 146 C73 150 69 152 65 151 C61 150 59 146 60 142 L64 102 Z" />
      <ellipse cx="68" cy="151" rx="14" ry="5" />
      {/* Левая рука на колено */}
      <path d="M41 72 C35 82 29 96 27 110 C26 114 29 116 33 115 C37 114 39 110 40 106 L48 84 Z" />
      <ellipse cx="28" cy="115" rx="8" ry="5" />
      {/* Правая рука — кулак на колене */}
      <path d="M69 72 C73 80 76 94 76 108 C76 112 73 114 69 113 C65 112 63 108 64 104 L64 82 Z" />
      <ellipse cx="73" cy="113" rx="7" ry="5" />
      {/* Указательный палец поднят вверх */}
      <rect x="70" y="94" width="7" height="22" rx="3.5" fill={f} />
    </g>
  )
}

/* ── Салям — голова повёрнута вправо ── */
function StandSalam({ f }) {
  return (
    <g fill={f}>
      {/* Голова повёрнута вправо */}
      <ellipse cx="65" cy="18" rx="13" ry="14" transform="rotate(20,65,18)" />
      <path d="M56 32 L54 40 L66 40 L64 32 Z" />
      <path d="M44 40 C41 54 40 72 41 95 L79 95 C80 72 79 54 76 40 Z" />
      {/* Руки сложены (ташаххуд завершился, руки на коленях — покой) */}
      <path d="M76 52 C70 56 62 60 50 62 C46 63 44 61 45 58 C46 56 50 55 54 55 L76 46 Z" />
      <ellipse cx="48" cy="60" rx="9" ry="5" />
      <path d="M44 56 C50 60 60 64 72 65 C76 66 78 64 77 61 C76 59 72 58 68 58 L44 50 Z" />
      <ellipse cx="74" cy="64" rx="9" ry="5" />
      {/* Ноги */}
      <path d="M41 95 C39 115 37 140 36 162 C35 167 39 170 45 169 C50 169 53 165 54 161 L58 95 Z" />
      <path d="M79 95 C81 115 83 140 84 162 C85 167 81 170 75 169 C70 169 67 165 66 161 L62 95 Z" />
      <ellipse cx="42" cy="170" rx="14" ry="5" />
      <ellipse cx="78" cy="170" rx="14" ry="5" />
    </g>
  )
}

// ── Основной компонент ─────────────────────────────────────────
export default function PrayerGuide({ onClose }) {
  const swipe        = useSwipeDown(onClose)
  const [tab,          setTab]       = useState('intro')   // 'intro' | 'wudu' | 'steps' | 'prayers'
  const [stepIdx,      setStepIdx]   = useState(0)
  const [animating,    setAnimating] = useState(false)
  const [autoPlay,     setAutoPlay]  = useState(false)
  const [openRakaat,   setOpenRakaat] = useState(null)   // null | 2 | 3 | 4
  const [showRakaats,  setShowRakaats] = useState(false)

  const NAMAZ_STEPS = PRAYER_STEPS.filter(s => s.id !== 'wudu')
  const step = NAMAZ_STEPS[stepIdx]
  const total = NAMAZ_STEPS.length

  // Автопереключение
  useEffect(() => {
    if (!autoPlay || tab !== 'steps') return
    const t = setInterval(() => {
      setStepIdx(i => {
        if (i >= total - 1) { setAutoPlay(false); return i }
        return i + 1
      })
    }, 4000)
    return () => clearInterval(t)
  }, [autoPlay, tab])

  function goTo(idx) {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setStepIdx(idx)
      setAnimating(false)
    }, 200)
  }

  // Получить позицию фигуры для шага
  function getPosture(step) {
    const map = {
      wudu:      'standing',
      niyyah:    'standing',
      takbir:    'takbir',
      qiyam:     'qiyam',
      ruku:      'ruku',
      itidal:    'standing',
      sujud:     'sujud',
      jalsa:     'sitting',
      tashahhud: 'tashahhud',
      salam:     'salam',
    }
    return map[step.id] || 'standing'
  }

  return (
    <div style={s.wrap} {...swipe}>

      {/* ── Шапка ── */}
      <div style={s.head}>
        <div style={s.headRow}>
          <div>
            <div style={s.headTitle}>🕌 Намаз для начинающих</div>
            <div style={s.headSub}>Пошаговый анимированный гид</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.tabs}>
          {[
            { id:'intro',   label:'📖 О намазе' },
            { id:'wudu',    label:'💧 Вуду' },
            { id:'steps',   label:'🎬 Пошагово' },
            { id:'prayers', label:'🕐 5 намазов' },
          ].map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ══ ВКЛАДКА: О намазе ══ */}
      {tab === 'intro' && (
        <div style={s.scroll} className="scroll-y">
          {/* Аят */}
          <div style={s.introAyah}>
            <div style={s.introAyahAr} className="arabic gold-shimmer">{WHY_5_PRAYERS.ayah.ar}</div>
            <div style={s.introAyahTranslit}>{WHY_5_PRAYERS.ayah.translit}</div>
            <div style={s.introAyahTranslation}>«{WHY_5_PRAYERS.ayah.translation}»</div>
            <div style={s.introAyahRef}>{WHY_5_PRAYERS.ayah.ref}</div>
          </div>

          {/* Мотивационный блок */}
          <div style={s.motivCard}>
            <div style={s.motivTop}>
              <span style={s.motivIcon}>{WHY_5_PRAYERS.motiv.icon}</span>
              <span style={s.motivTitle}>{WHY_5_PRAYERS.motiv.title}</span>
            </div>
            {WHY_5_PRAYERS.motiv.text.split('\n\n').map((p, i) => (
              <div key={i} style={s.motivText}>{p}</div>
            ))}
          </div>

          {/* История */}
          <div style={s.sectionLabel}>Почему именно 5 намазов?</div>
          <div style={s.introStory}>{WHY_5_PRAYERS.story}</div>

          {/* Хадис */}
          <div style={s.hadithBox}>
            <div style={s.hadithQuoteMark}>"</div>
            <div style={s.hadithText}>{WHY_5_PRAYERS.hadith.text}</div>
            <div style={s.hadithSource}>— {WHY_5_PRAYERS.hadith.source}</div>
          </div>

          {/* Условия намаза */}
          <div style={s.sectionLabel}>Условия действительности намаза</div>
          {[
            { icon:'💧', text:'Ритуальная чистота (вуду или гусль)' },
            { icon:'👔', text:'Чистота одежды, тела и места молитвы' },
            { icon:'🧭', text:'Направление к Кибле (Мекка)' },
            { icon:'🕐', text:'Наступление времени намаза' },
            { icon:'🧠', text:'Намерение (ният) в сердце' },
            { icon:'👗', text:'Покрытие аурата (для мужчины — от пупка до колен, минимум)' },
          ].map((item, i) => (
            <div key={i} style={s.condItem}>
              <span style={s.condIcon}>{item.icon}</span>
              <span style={s.condText}>{item.text}</span>
            </div>
          ))}

          {/* Кнопка флоу */}
          <button
            style={s.flowBtn}
            onClick={() => setTab('wudu')}
          >
            💧 Начать с омовения →
          </button>

          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ══ ВКЛАДКА: Пошагово ══ */}
      {tab === 'steps' && !showRakaats && (
        <>
          {/* Прогресс */}
          <div style={s.progressWrap}>
            <div style={s.progressRow}>
              <span style={s.progressLabel}>Шаг {stepIdx + 1} из {total}</span>
              <button
                style={{ ...s.autoBtn, ...(autoPlay ? s.autoBtnActive : {}) }}
                onClick={() => setAutoPlay(p => !p)}
              >{autoPlay ? '⏸ Пауза' : '▶ Авто'}</button>
            </div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width:`${((stepIdx + 1) / total) * 100}%`, background: step.color }} />
            </div>
            {/* Точки шагов */}
            <div style={s.stepDots}>
              {NAMAZ_STEPS.map((st, i) => (
                <div
                  key={st.id}
                  style={{
                    ...s.stepDot,
                    background: i === stepIdx ? step.color : i < stepIdx ? step.color+'60' : 'rgba(255,255,255,.12)',
                    transform: i === stepIdx ? 'scale(1.4)' : 'scale(1)',
                  }}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </div>

          {/* Основная область */}
          <div style={s.stepMain} className="scroll-y">

            {/* Напоминание про вуду — только на первом шаге */}
            {stepIdx === 0 && (
              <div style={s.wuduReminder}>
                <span style={{ fontSize: 18 }}>💧</span>
                <div style={{ flex: 1 }}>
                  <div style={s.wuduReminderTitle}>Сначала совершите омовение</div>
                  <div style={s.wuduReminderSub}>
                    Намаз без вуду недействителен. Направление Киблы можно найти в приложении — вкладка Намаз → «🧭 Кибла».
                  </div>
                </div>
                <button style={s.wuduReminderBtn} onClick={() => setTab('wudu')}>
                  Вуду →
                </button>
              </div>
            )}
            {/* Фото позиции */}
            <div style={{
              ...s.imgWrap,
              opacity: animating ? 0 : 1,
              transform: animating ? 'scale(0.97)' : 'scale(1)',
              borderColor: step.color + '40',
            }}>
              <img
                src={STEP_IMAGES[step.id]}
                alt={step.title}
                style={s.stepImg}
              />
              <div style={{ ...s.imgOverlay, background: `linear-gradient(to top, ${step.color}22, transparent 60%)` }} />
            </div>

            {/* Карточка шага */}
            <div style={{
              ...s.stepCard,
              borderColor: step.color + '50',
              opacity: animating ? 0 : 1,
            }}>
              <div style={s.stepBadge}>
                <span style={{ ...s.stepNum, background: step.color }}>Шаг {step.step + 1}</span>
              </div>

              <div style={s.stepTitleAr} className="arabic gold-shimmer">{step.titleAr}</div>
              <div style={{ ...s.stepTitle, color: step.color }}>{step.title}</div>
              <div style={s.stepDesc}>{step.description}</div>

              {/* Мотивационный тип */}
              {step.tip && (
                <div style={s.stepTip}>
                  <span style={s.stepTipIcon}>💬</span>
                  <span style={s.stepTipText}>{step.tip}</span>
                </div>
              )}

              {/* Детали */}
              <div style={s.stepDetails}>
                {step.details.map((d, i) => (
                  <div key={i} style={s.stepDetail}>
                    <div style={{ ...s.stepDetailDot, background: step.color }} />
                    <span style={s.stepDetailText}>{d}</span>
                  </div>
                ))}
              </div>

              {/* Чтение — всегда открыто */}
              {step.recitation && (
                <div style={{ ...s.recitBox, borderColor: step.color + '40' }}>
                  <div style={{ ...s.recitLabel, color: step.color }}>
                    🗣 Что читать{step.recitation.note ? ` — ${step.recitation.note}` : ''}
                  </div>
                  {step.recitation.translit.split('\n').map((line, i) => i === 0
                    ? <div key={i} style={s.recitTranslit}>{line}</div>
                    : null
                  )}
                  <div style={s.recitAr} className="arabic gold-shimmer">{step.recitation.ar}</div>
                  <div style={s.recitTranslit}>{step.recitation.translit.split('\n').slice(1).join(' ')}</div>
                  <div style={s.recitDivider} />
                  {step.recitation.translation.split('\n\n').map((p, i) => (
                    <div key={i} style={s.recitTranslation}>{p}</div>
                  ))}
                </div>
              )}

              {/* Дополнительное чтение (доп. сура / салават) */}
              {step.recitationAfter && (
                <div style={{ ...s.recitBox, borderColor: 'rgba(201,168,76,.3)', marginTop: 8 }}>
                  <div style={{ ...s.recitLabel, color: 'var(--gold)' }}>
                    ➕ {step.recitationAfter.label}
                  </div>
                  <div style={s.recitAr} className="arabic gold-shimmer">{step.recitationAfter.ar}</div>
                  <div style={s.recitTranslit}>{step.recitationAfter.translit}</div>
                  <div style={s.recitDivider} />
                  <div style={s.recitTranslation}>{step.recitationAfter.translation}</div>
                </div>
              )}
            </div>

            <div style={{ height: 20 }} />
          </div>

          {/* Навигация */}
          <div style={s.nav}>
            <button
              style={{ ...s.navBtn, opacity: stepIdx > 0 ? 1 : 0.3 }}
              onClick={() => stepIdx > 0 && goTo(stepIdx - 1)}
              disabled={stepIdx === 0}
            >← Назад</button>

            <div style={s.navCenter}>
              {stepIdx < total - 1
                ? <button style={{ ...s.navNextBtn, background: step.color }} onClick={() => goTo(stepIdx + 1)}>
                    Далее →
                  </button>
                : <button style={{ ...s.navNextBtn, background: '#52b788' }} onClick={() => setShowRakaats(true)}>
                    Далее →
                  </button>
              }
            </div>
          </div>
        </>
      )}

      {/* ══ Экран ракаатов (внутри вкладки steps) ══ */}
      {tab === 'steps' && showRakaats && (
        <>
          <div style={s.scroll} className="scroll-y">
            {/* Заголовок с кнопкой назад */}
            <div style={s.rakaatPageHead}>
              <button style={s.rakaatBackBtn} onClick={() => setShowRakaats(false)}>‹</button>
              <div>
                <div style={s.rakaatPageTitle}>Сколько ракаатов?</div>
                <div style={s.rakaatPageSub}>Один ракаат — основа. Выберите нужное количество.</div>
              </div>
            </div>

            <div style={s.rakaatIntro}>
              <div style={s.rakaatIntroIcon}>🕌</div>
              <div>
                <div style={s.rakaatIntroTitle}>Вы прошли 1 ракаат — отлично!</div>
                <div style={s.rakaatIntroText}>
                  Ракаат — это один полный «круг» намаза. В зависимости от времени суток намазы читаются по 2, 3 или 4 раза. Ниже — как это выглядит на практике, простыми шагами.
                </div>
              </div>
            </div>

            {[
              {
                n: 2,
                label: '2 ракаата',
                who: 'Фаджр · большинство сунн',
                color: '#7eb8d4',
                sections: [
                  {
                    num: '1-й ракаат',
                    items: [
                      'Произносите намерение и делаете такбир — «Аллаху Акбар»',
                      'Стоите: читаете Фатиху, затем любую короткую суру (например, аль-Ихлас)',
                      'Наклоняетесь в поясной поклон (руку), затем выпрямляетесь',
                      'Делаете земной поклон — садитесь — снова земной поклон',
                    ],
                  },
                  {
                    num: '2-й ракаат',
                    items: [
                      'Встаёте и повторяете всё то же: Фатиха + сура → поклон → два земных поклона',
                      'После второго земного поклона остаётесь сидеть',
                      'Читаете Ташаххуд, затем Салават (молитву на Пророка ﷺ)',
                      'Произносите салям вправо и влево — намаз завершён 🤍',
                    ],
                  },
                ],
                tip: '☝️ Всего 2 круга. Ташаххуд читается только в конце — после последнего ракаата.',
              },
              {
                n: 3,
                label: '3 ракаата',
                who: 'Магриб (вечерний)',
                color: '#e88a5a',
                sections: [
                  {
                    num: '1-й ракаат',
                    items: [
                      'Намерение + такбир',
                      'Стоите: Фатиха + короткая сура',
                      'Поясной поклон → выпрямляетесь → два земных поклона',
                    ],
                  },
                  {
                    num: '2-й ракаат',
                    items: [
                      'Встаёте: Фатиха + короткая сура',
                      'Поясной поклон → выпрямляетесь → два земных поклона',
                      'Садитесь и читаете только Ташаххуд — без Салавата',
                      'Встаёте на 3-й ракаат',
                    ],
                  },
                  {
                    num: '3-й ракаат',
                    items: [
                      'Стоите: читаете только Фатиху — короткая сура здесь не нужна',
                      'Поясной поклон → выпрямляетесь → два земных поклона',
                      'Садитесь: читаете Ташаххуд + Салават',
                      'Салям вправо и влево — готово 🤍',
                    ],
                  },
                ],
                tip: '☝️ После 2-го ракаата — садитесь, читаете только Ташаххуд и встаёте. Салават — только в самом конце.',
              },
              {
                n: 4,
                label: '4 ракаата',
                who: 'Зухр · Аср · Иша',
                color: '#a87de8',
                sections: [
                  {
                    num: '1-й ракаат',
                    items: [
                      'Намерение + такбир',
                      'Стоите: Фатиха + короткая сура',
                      'Поясной поклон → выпрямляетесь → два земных поклона',
                    ],
                  },
                  {
                    num: '2-й ракаат',
                    items: [
                      'Встаёте: Фатиха + короткая сура',
                      'Поясной поклон → выпрямляетесь → два земных поклона',
                      'Садитесь: читаете только Ташаххуд (без Салавата) — это промежуточное сидение',
                      'Встаёте на 3-й ракаат',
                    ],
                  },
                  {
                    num: '3-й и 4-й ракааты',
                    items: [
                      'В каждом: стоите → читаете только Фатиху (без суры)',
                      'Поясной поклон → выпрямляетесь → два земных поклона',
                      'После 4-го земного поклона садитесь',
                      'Читаете Ташаххуд + Салават',
                      'Салям вправо и влево — намаз завершён 🤍',
                    ],
                  },
                ],
                tip: '☝️ После 2-го ракаата — короткое сидение с Ташаххудом. В 3-м и 4-м ракаатах суру не читаем — только Фатиха.',
              },
            ].map(({ n, label, who, color, sections, tip }) => {
              const open = openRakaat === n
              return (
                <div key={n} style={{ ...s.rakaatCard, borderColor: color + '40' }}>
                  <button
                    style={s.rakaatHeader}
                    onClick={() => setOpenRakaat(open ? null : n)}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ ...s.rakaatBadge, background: color + '22', color }}>
                        {n}×
                      </div>
                      <div>
                        <div style={{ ...s.rakaatLabel, color }}>{label}</div>
                        <div style={s.rakaatWho}>{who}</div>
                      </div>
                    </div>
                    <span style={{ ...s.rakaatChevron, color, transform: open ? 'rotate(180deg)' : 'none' }}>
                      ▾
                    </span>
                  </button>

                  {open && (
                    <div style={s.rakaatBody}>
                      {sections.map((sec, i) => (
                        <div key={i} style={{ marginBottom: i < sections.length - 1 ? 12 : 0 }}>
                          <div style={{ ...s.rakaatSecTitle, color }}>{sec.num}</div>
                          {sec.items.map((item, j) => (
                            <div key={j} style={s.rakaatItem}>
                              <div style={{ ...s.rakaatDot, background: color }} />
                              <span style={s.rakaatItemText}>{item}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div style={s.rakaatTip}>{tip}</div>
                    </div>
                  )}
                </div>
              )
            })}

            <button style={s.rakaatRestartBtn} onClick={() => { setShowRakaats(false); setStepIdx(0) }}>
              ↩ Начать намаз заново
            </button>
            <div style={{ height: 20 }} />
          </div>
        </>
      )}

      {/* ══ ВКЛАДКА: Вуду ══ */}
      {tab === 'wudu' && (
        <div style={s.scroll} className="scroll-y">

          <div style={s.wuduIntro}>
            Вуду (малое омовение) — обязательное условие намаза. Без него намаз недействителен.
          </div>

          {/* ── Подготовка ── */}
          <div style={s.wuduSectionLabel}>Подготовка перед омовением</div>
          {[
            { icon:'🚽', title:'Сходи в туалет при необходимости', desc:'Нельзя совершать намаз с нужды — это рассеивает внимание и может нарушить вуду. Сначала облегчись.' },
            { icon:'🚿', title:'Истинджа — подмывание', desc:'После туалета необходимо очистить интимные места водой. Подмывайся левой рукой. Убедись, что не осталось следов наджасы (нечистоты). Это обязательно перед вуду.' },
            { icon:'💍', title:'Сними украшения и часы', desc:'Кольца, браслеты, часы — всё необходимо снять, чтобы вода гарантированно омыла кожу под ними.' },
          ].map((item, i) => (
            <div key={i} style={s.wuduNiyya}>
              <span style={s.wuduNiyyaIcon}>{item.icon}</span>
              <div>
                <div style={s.wuduNiyyaTitle}>{item.title}</div>
                <div style={s.wuduNiyyaText}>{item.desc}</div>
              </div>
            </div>
          ))}

          {/* ── Порядок вуду ── */}
          <div style={s.wuduSectionLabel}>Порядок омовения (8 шагов)</div>
          {[
            {
              n:1, icon:'🤍', title:'Намерение (ният) + Бисмилля',
              desc:'Сделай намерение в сердце — без слов вслух: «Совершаю вуду для снятия малого осквернения». Затем произнеси вслух: «Бисмилляхир-рахманир-рахим».',
            },
            {
              n:2, icon:'🤲', title:'Мытьё кистей рук — 3 раза',
              desc:'Вымой обе кисти до запястий, начиная с правой. Пропускай воду между пальцами, разводя их. Убедись что вода достигла каждого уголка — под ногтями в том числе. Повтори 3 раза каждую руку.',
            },
            {
              n:3, icon:'💬', title:'Полоскание рта — 3 раза',
              desc:'Набери воду правой рукой, набери в рот, прополощи так чтобы вода достигла все уголки — дёсны, зубы, внутренние щёки. Выплюни. Повтори 3 раза. Желательно чистить зубы мисваком или зубной щёткой до вуду.',
            },
            {
              n:4, icon:'👃', title:'Промывание носа — 3 раза',
              desc:'Правой рукой втяни воду в ноздри так, чтобы она дошла до мягкой части перегородки. Левой рукой высморкайся. Повтори 3 раза. Во время поста (уразы) — не втягивай слишком глубоко, чтобы вода не попала в горло.',
            },
            {
              n:5, icon:'😊', title:'Мытьё лица — 3 раза',
              desc:'Омой лицо обеими руками: от линии роста волос (лоб) до нижнего края подбородка по вертикали; от мочки уха до мочки уха по горизонтали. Включая брови, ресницы, переносицу. Если есть борода — пропускай воду сквозь неё пальцами. Повтори 3 раза.',
            },
            {
              n:6, icon:'💪', title:'Мытьё рук до локтей — 3 раза',
              desc:'Начни с правой руки: поливай от пальцев вверх к локтю, включая сам локоть. Три раза. Затем левая рука — так же. Не оставляй сухих участков — особенно у сгиба локтя и между пальцами.',
            },
            {
              n:7, icon:'🧢', title:'Масх — протирание головы и ушей (1 раз)',
              desc:'Смочи обе руки. Проведи внутренней стороной обеих ладоней по голове: от лба к затылку, затем от затылка обратно ко лбу — это один масх, повторять не нужно.\n\nСразу после, теми же влажными руками, протри уши: указательные пальцы — внутри ушной раковины (по складкам), большие пальцы — снаружи за ушами. Всё это один раз — и голова, и уши одним движением.',
            },
            {
              n:8, icon:'🦶', title:'Мытьё ног до щиколоток — 3 раза',
              desc:'Начни с правой ноги: поливай от пальцев вверх, включая щиколотки. Мизинцем левой руки пропускай воду между пальцами ног — начиная с мизинца правой ноги, заканчивая мизинцем левой. Три раза правую, три раза левую.',
            },
          ].map(item => (
            <div key={item.n} style={s.wuduStep}>
              <div style={s.wuduStepNum}>{item.n}</div>
              <div style={s.wuduStepBody}>
                <div style={s.wuduStepTitle}>
                  <span style={{ marginRight:6 }}>{item.icon}</span>
                  {item.title}
                </div>
                {item.desc.split('\n\n').map((para, i) => (
                  <div key={i} style={{ ...s.wuduStepDesc, marginTop: i > 0 ? 6 : 0 }}>{para}</div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Дуа после вуду ── */}
          <div style={s.wuduSectionLabel}>Дуа после омовения</div>
          <div style={s.wuduDua}>
            <div style={s.wuduDuaAr} className="arabic gold-shimmer">
              أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ
            </div>
            <div style={s.wuduDuaTranslit}>Ашхаду алля иляха иллаллаху вахдаху ля шарика ляху ва ашхаду анна Мухаммадан абдуху ва расулюх</div>
            <div style={s.wuduDuaDivider} />
            <div style={s.wuduDuaTransl}>Свидетельствую, что нет бога кроме Аллаха, Единственного, без сотоварища, и что Мухаммад — Его раб и посланник</div>
            <div style={s.wuduDuaSource}>Муслим № 234: тому, кто прочтёт это — откроются все 8 врат Рая</div>
          </div>

          {/* ── Что нарушает вуду ── */}
          <div style={s.wuduSectionLabel}>Что нарушает вуду</div>
          <div style={s.wuduBreakers}>
            {[
              { icon:'💨', text:'Выход газов, мочи или кала — даже небольшое количество' },
              { icon:'😴', text:'Глубокий сон в положении лёжа или сидя с расслабленным телом' },
              { icon:'😵', text:'Потеря сознания, обморок, опьянение' },
              { icon:'🩸', text:'Выделение крови или гноя в значительном количестве (по ханафитскому мазхабу)' },
              { icon:'🤢', text:'Рвота полным ртом (по ханафитскому мазхабу)' },
              { icon:'👆', text:'Прикосновение к половым органам без барьера (по шафиитскому мазхабу)' },
            ].map((b, i) => (
              <div key={i} style={s.wuduBreaker}>
                <span style={{ fontSize:16 }}>{b.icon}</span>
                <span style={s.wuduBreakerText}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* ── Полное омовение (Гусль) ── */}
          <div style={s.wuduSectionLabel}>Полное омовение — Гусль</div>
          <div style={s.wuduNiyya}>
            <span style={s.wuduNiyyaIcon}>📋</span>
            <div>
              <div style={s.wuduNiyyaTitle}>Когда обязателен гусль</div>
              <div style={s.wuduNiyyaText}>После супружеской близости · После поллюции (ихтилям) · После менструации · После послеродового кровотечения (нифас)</div>
            </div>
          </div>

          <div style={s.wuduNiyya}>
            <span style={s.wuduNiyyaIcon}>⚠️</span>
            <div>
              <div style={s.wuduNiyyaTitle}>Три обязательных действия (фард)</div>
              <div style={s.wuduNiyyaText}>1. Прополоскать рот так, чтобы вода достигла горла · 2. Промыть нос до мягкой перегородки · 3. Облить всё тело так, чтобы не осталось ни одного сухого места — включая складки кожи, волосы, пупок, подмышки</div>
            </div>
          </div>

          <div style={s.wuduSectionLabel}>Порядок гусля (сунна)</div>
          {[
            { n:1, icon:'🤍', title:'Намерение + Бисмилля', desc:'Намерение в сердце на совершение полного омовения. Произнеси «Бисмилля».' },
            { n:2, icon:'🤲', title:'Мыть руки 3 раза', desc:'Вымой кисти рук до запястий как в вуду.' },
            { n:3, icon:'🚿', title:'Очистить интимные места', desc:'Вымой половые органы и удали любую наджасу с тела, даже если её не видно.' },
            { n:4, icon:'💧', title:'Совершить полное вуду', desc:'Выполни все 8 шагов малого омовения полностью. По некоторым мнениям — ноги можно помыть в самом конце гусля.' },
            { n:5, icon:'🌊', title:'Облить голову 3 раза', desc:'Вылей воду на голову 3 раза, тщательно втирая её в корни волос. Вода должна дойти до кожи головы — не просто намочить волосы сверху.' },
            { n:6, icon:'➡️', title:'Правое плечо — 3 раза', desc:'Лей воду на правое плечо и сторону тела, растирая рукой. Убедись что вода дошла до подмышки.' },
            { n:7, icon:'⬅️', title:'Левое плечо — 3 раза', desc:'То же самое для левой стороны.' },
            { n:8, icon:'✅', title:'Омыть всё тело', desc:'Убедись что вода достигла: пупка · складок живота · между ягодицами · между пальцами ног · под коленями. Проведи руками по всему телу. Ни одного сухого места быть не должно.' },
          ].map(item => (
            <div key={item.n} style={{ ...s.wuduStep, borderColor:'rgba(74,144,217,.25)' }}>
              <div style={{ ...s.wuduStepNum, background:'linear-gradient(135deg,#2C7A6E,#3aada0)' }}>{item.n}</div>
              <div style={s.wuduStepBody}>
                <div style={s.wuduStepTitle}>
                  <span style={{ marginRight:6 }}>{item.icon}</span>
                  {item.title}
                </div>
                <div style={s.wuduStepDesc}>{item.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ ...s.wuduTip, marginTop:12 }}>
            <span style={s.wuduTipIcon}>💡</span>
            <span style={s.wuduTipText}>После гусля вуду повторять не нужно — гусль включает его в себя. Можно сразу идти на намаз.</span>
          </div>

          <button
            style={s.toStepsBtn}
            onClick={() => { setStepIdx(0); setShowRakaats(false); setTab('steps') }}
          >
            🕌 Переходим к намазу →
          </button>

          <div style={{ height:24 }} />
        </div>
      )}

      {/* ══ ВКЛАДКА: 5 намазов ══ */}
      {tab === 'prayers' && (
        <div style={s.scroll} className="scroll-y">

          {/* Вводная подсказка */}
          <div style={s.prayersTip}>
            <span style={{ fontSize:16 }}>🎯</span>
            <span>Для начала сосредоточься только на <b style={{ color:'var(--gold)' }}>обязательных (фард)</b> ракатах. Остальное добавишь позже — по желанию.</span>
          </div>

          {PRAYER_TIMES_INFO.map(p => {
            const { before = [], after = [], witr } = p.sunnah || {}
            // Только муаккада (важные) и витр
            const mainBefore = before.filter(sn => sn.type === 'муаккада')
            const mainAfter  = after.filter(sn => sn.type === 'муаккада')
            // Необязательные (гайру муаккада и нафиль) — скрытые
            const extraBefore = before.filter(sn => sn.type !== 'муаккада')
            const extraAfter  = after.filter(sn => sn.type !== 'муаккада')
            const hasExtra = extraBefore.length + extraAfter.length > 0

            return (
              <div key={p.id} style={{ ...s.prayerCard, borderColor: p.color + '50' }}>

                {/* Шапка */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ ...s.prayerIconBig, background: p.color + '20', border:`1px solid ${p.color}50` }}>
                    <span style={{ fontSize:28 }}>{p.icon}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ ...s.prayerCardName, color: p.color }}>{p.name}</span>
                      <span style={s.prayerCardAr} className="arabic gold-shimmer">{p.nameAr}</span>
                    </div>
                    <div style={s.prayerCardTime}>🕐 {p.time}</div>
                  </div>
                </div>

                {/* Структура ракатов — только важные */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                  {mainBefore.map((sn, i) => (
                    <span key={'b'+i} style={s.chipSunnah}>{sn.rakats} р. сунна</span>
                  ))}
                  <span style={{ ...s.chipFard, background: p.color + '25', borderColor: p.color + '70', color: p.color }}>
                    {p.rakats} р. ФАРД
                  </span>
                  {mainAfter.map((sn, i) => (
                    <span key={'a'+i} style={s.chipSunnah}>{sn.rakats} р. сунна</span>
                  ))}
                  {witr && (
                    <span style={s.chipWitr}>{witr.rakats} р. витр ⚠️</span>
                  )}
                </div>

                {/* Описание */}
                <div style={s.prayerCardDesc}>{p.desc}</div>

                {/* Сунны (муаккада) — показываем */}
                {[...mainBefore.map(s=>({...s,when:'до фарда'})), ...mainAfter.map(s=>({...s,when:'после фарда'}))]
                  .map((sn, i) => (
                  <div key={i} style={s.sunnahRow}>
                    <span style={s.sunnahBadge}>сунна муаккада</span>
                    <span style={s.sunnahText}>{sn.rakats} р. {sn.when} — {sn.note}</span>
                  </div>
                ))}

                {/* Витр */}
                {witr && (
                  <div style={s.witrRow}>
                    <span style={s.witrBadge}>витр (ваджиб)</span>
                    <span style={s.witrText}>{witr.note}</span>
                  </div>
                )}

                {/* Дополнительные (гайру муаккада / нафиль) — скрытые */}
                {hasExtra && (
                  <div style={s.extraNote}>
                    + есть необязательные ракаты (гайру муаккада и нафиль) — когда освоишься, можно добавить
                  </div>
                )}
              </div>
            )
          })}

          <div style={s.prayerNote}>
            <div style={s.prayerNoteIcon}>💡</div>
            <div style={s.prayerNoteText}>
              <b>Фард</b> — обязателен. <b>Сунна муаккада</b> — Пророк ﷺ совершал регулярно, лучше не пропускать. <b>Витр</b> — обязателен для Иша (по ханафитскому мазхабу).
            </div>
          </div>
          <div style={{ height: 24 }} />
        </div>
      )}

      <style>{`
        @keyframes figPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

// ── Стили ──────────────────────────────────────────────────────
const s = {
  wrap: {
    position:'fixed', inset:0, zIndex:95,
    background:'var(--bg-deep)', display:'flex', flexDirection:'column',
    fontFamily:'var(--font-ui)'
  },

  head: {
    flexShrink:0, padding:'12px 16px 0',
    display:'flex', flexDirection:'column', gap:10,
    borderBottom:'1px solid var(--border)'
  },
  headRow: { display:'flex', alignItems:'flex-start', justifyContent:'space-between' },
  headTitle: { fontSize:17, fontWeight:700, color:'var(--text)' },
  headSub: { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  closeBtn: {
    width:34, height:34, borderRadius:'50%', border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text)', fontSize:15,
    cursor:'pointer', outline:'none', display:'flex', alignItems:'center', justifyContent:'center'
  },
  tabs: { display:'flex', gap:6, paddingBottom:10, overflowX:'auto', scrollbarWidth:'none' },
  tab: {
    flexShrink:0, padding:'6px 14px', borderRadius:20,
    border:'1px solid var(--border)', background:'transparent',
    color:'var(--text-muted)', fontSize:13, fontWeight:500,
    cursor:'pointer', fontFamily:'var(--font-ui)', outline:'none', whiteSpace:'nowrap', transition:'all .2s'
  },
  tabActive: {
    background:'rgba(201,168,76,.12)', borderColor:'rgba(201,168,76,.4)',
    color:'var(--gold)', fontWeight:600
  },

  scroll: { flex:1, overflowY:'auto', padding:'14px 16px 0' },

  wuduReminder: {
    display:'flex', alignItems:'center', gap:10,
    background:'rgba(74,144,217,.08)', border:'1px solid rgba(74,144,217,.25)',
    borderRadius:14, padding:'12px 14px', marginBottom:4,
  },
  wuduReminderTitle: { fontSize:13, fontWeight:700, color:'#6aacf0', marginBottom:3 },
  wuduReminderSub:   { fontSize:11, color:'var(--text-muted)', lineHeight:1.5 },
  wuduReminderBtn: {
    flexShrink:0, padding:'6px 12px', borderRadius:10,
    background:'rgba(74,144,217,.15)', border:'1px solid rgba(74,144,217,.35)',
    color:'#6aacf0', fontSize:12, fontWeight:600,
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
  },

  flowBtn: {
    width:'100%', padding:'14px', borderRadius:16, marginTop:6,
    background:'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.08))',
    border:'1.5px solid rgba(201,168,76,.4)',
    color:'var(--gold)', fontSize:15, fontWeight:700,
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
    letterSpacing:'.02em',
  },
  toStepsBtn: {
    width:'100%', padding:'15px', borderRadius:16, marginTop:8,
    background:'linear-gradient(135deg,rgba(82,183,136,.18),rgba(82,183,136,.08))',
    border:'1.5px solid rgba(82,183,136,.45)',
    color:'#52b788', fontSize:15, fontWeight:700,
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
    letterSpacing:'.01em',
  },

  // Motivational cards
  motivCard: {
    background:'rgba(201,168,76,.07)', border:'1px solid rgba(201,168,76,.22)',
    borderRadius:16, padding:'14px', marginBottom:14,
    display:'flex', flexDirection:'column', gap:8,
  },
  motivTop: { display:'flex', alignItems:'center', gap:8 },
  motivIcon: { fontSize:18 },
  motivTitle: { fontSize:13, fontWeight:700, color:'var(--gold)' },
  motivText: { fontSize:13, color:'var(--text-muted)', lineHeight:1.7 },

  stepTip: {
    display:'flex', alignItems:'flex-start', gap:8,
    background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
    borderRadius:12, padding:'10px 12px',
  },
  stepTipIcon: { fontSize:14, flexShrink:0, marginTop:1 },
  stepTipText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.65, fontStyle:'italic' },

  // Intro tab
  introAyah: {
    background:'rgba(201,168,76,.06)', border:'1px solid rgba(201,168,76,.2)',
    borderRadius:18, padding:'16px', display:'flex', flexDirection:'column',
    gap:8, textAlign:'center', marginBottom:16
  },
  introAyahAr: { fontFamily:"'Scheherazade New',serif", fontSize:20, lineHeight:1.9, direction:'rtl' },
  introAyahTranslit: { fontSize:12, color:'rgba(255,255,255,.4)', fontStyle:'italic' },
  introAyahTranslation: { fontSize:13, color:'var(--text)', lineHeight:1.65 },
  introAyahRef: { fontSize:11, color:'var(--text-muted)' },
  sectionLabel: {
    fontSize:11, fontWeight:700, color:'var(--text-muted)',
    textTransform:'uppercase', letterSpacing:'.1em', marginTop:16, marginBottom:10
  },
  introStory: { fontSize:13, color:'var(--text-muted)', lineHeight:1.75, marginBottom:12 },
  hadithBox: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:14, padding:'14px 16px', position:'relative', overflow:'hidden', marginBottom:12
  },
  hadithQuoteMark: {
    position:'absolute', top:-12, left:10, fontSize:60,
    color:'rgba(201,168,76,.08)', fontFamily:'Georgia,serif', lineHeight:1
  },
  hadithText: { fontSize:13, color:'var(--text)', lineHeight:1.7, fontStyle:'italic' },
  hadithSource: { fontSize:11, color:'var(--text-muted)', marginTop:6 },
  condItem: {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 12px', background:'var(--bg-card)',
    border:'1px solid var(--border)', borderRadius:12, marginBottom:8
  },
  condIcon: { fontSize:20, flexShrink:0 },
  condText: { fontSize:13, color:'var(--text)' },

  // Steps tab
  progressWrap: { flexShrink:0, padding:'10px 16px 8px', borderBottom:'1px solid var(--border)' },
  progressRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  progressLabel: { fontSize:12, color:'var(--text-muted)' },
  autoBtn: {
    fontSize:12, padding:'4px 12px', borderRadius:12,
    border:'1px solid var(--border)', background:'transparent',
    color:'var(--text-muted)', cursor:'pointer', fontFamily:'var(--font-ui)', outline:'none'
  },
  autoBtnActive: {
    background:'rgba(201,168,76,.12)', borderColor:'rgba(201,168,76,.4)', color:'var(--gold)'
  },
  progressBar: {
    height:3, borderRadius:2, background:'rgba(255,255,255,.07)', overflow:'hidden', marginBottom:8
  },
  progressFill: { height:'100%', borderRadius:2, transition:'width .4s ease, background .3s' },
  stepDots: { display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' },
  stepDot: {
    width:8, height:8, borderRadius:'50%', cursor:'pointer',
    transition:'transform .2s, background .3s'
  },

  stepMain: { flex:1, overflowY:'auto', padding:'12px 16px 0', display:'flex', flexDirection:'column', gap:12 },

  imgWrap: {
    width:110, height:150, borderRadius:14, overflow:'hidden',
    border:'1.5px solid', position:'relative', flexShrink:0,
    alignSelf:'center',
    transition:'opacity .2s ease, transform .2s ease',
    boxShadow:'0 4px 16px rgba(0,0,0,.35)',
  },
  stepImg: {
    width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center',
    display:'block',
  },
  imgOverlay: {
    position:'absolute', inset:0, pointerEvents:'none',
  },

  stepCard: {
    width:'100%', background:'var(--bg-card)', borderRadius:18,
    border:'1.5px solid', padding:'14px 16px',
    display:'flex', flexDirection:'column', gap:10,
    transition:'opacity .2s ease'
  },
  stepBadge: { display:'flex', alignItems:'center', gap:8 },
  stepNum: {
    fontSize:11, fontWeight:700, color:'#070710',
    padding:'2px 10px', borderRadius:10
  },
  stepTitleAr: { fontFamily:"'Scheherazade New',serif", fontSize:18, direction:'rtl', textAlign:'center' },
  stepTitle: { fontSize:16, fontWeight:700, textAlign:'center' },
  stepDesc: { fontSize:13, color:'var(--text-muted)', lineHeight:1.65, textAlign:'center' },
  stepDetails: { display:'flex', flexDirection:'column', gap:7 },
  stepDetail: { display:'flex', alignItems:'flex-start', gap:8 },
  stepDetailDot: { width:7, height:7, borderRadius:'50%', flexShrink:0, marginTop:4 },
  stepDetailText: { fontSize:12, color:'var(--text)', lineHeight:1.55 },

  recitBox: {
    background:'rgba(201,168,76,.06)', border:'1px solid',
    borderRadius:14, padding:'12px 14px',
    display:'flex', flexDirection:'column', gap:8,
  },
  recitLabel: { fontSize:11, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase' },
  recitAr: { fontFamily:"'Scheherazade New',serif", fontSize:16, lineHeight:1.9, direction:'rtl', textAlign:'center' },
  recitTranslit: { fontSize:11, color:'rgba(255,255,255,.4)', fontStyle:'italic', lineHeight:1.5, textAlign:'center' },
  recitDivider: { height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent)' },
  recitTranslation: { fontSize:12, color:'var(--text)', lineHeight:1.6, textAlign:'center' },

  // Navigation
  nav: {
    flexShrink:0, display:'flex', alignItems:'center', gap:10,
    padding:'8px 16px 12px', borderTop:'1px solid var(--border)'
  },
  navBtn: {
    padding:'9px 16px', borderRadius:12, border:'1px solid var(--border)',
    background:'var(--bg-card)', color:'var(--text-muted)', fontSize:13,
    cursor:'pointer', fontFamily:'var(--font-ui)', outline:'none', transition:'opacity .2s'
  },
  navCenter: { flex:1, display:'flex', justifyContent:'center' },
  navNextBtn: {
    padding:'10px 28px', borderRadius:14, border:'none',
    color:'#070710', fontSize:14, fontWeight:700,
    cursor:'pointer', fontFamily:'var(--font-ui)', outline:'none'
  },

  // Prayers tab
  prayersTip: {
    display:'flex', alignItems:'flex-start', gap:10,
    background:'rgba(201,168,76,.07)', border:'1px solid rgba(201,168,76,.2)',
    borderRadius:14, padding:'12px 14px', marginBottom:14,
    fontSize:13, color:'var(--text-muted)', lineHeight:1.65,
  },
  chipFard: {
    fontSize:11, fontWeight:800, padding:'4px 10px', borderRadius:20,
    border:'1.5px solid', letterSpacing:'.04em',
  },
  chipSunnah: {
    fontSize:11, fontWeight:500, padding:'4px 10px', borderRadius:20,
    background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.25)',
    color:'rgba(201,168,76,.8)',
  },
  chipWitr: {
    fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20,
    background:'rgba(224,80,80,.1)', border:'1px solid rgba(224,80,80,.3)',
    color:'#e08080',
  },
  sunnahRow: {
    display:'flex', alignItems:'flex-start', gap:8, marginTop:8,
    flexWrap:'wrap',
  },
  sunnahBadge: {
    fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em',
    padding:'2px 7px', borderRadius:6, flexShrink:0,
    background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.25)',
    color:'#C9A84C',
  },
  sunnahText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.55 },
  witrRow: {
    display:'flex', alignItems:'flex-start', gap:8, marginTop:8, flexWrap:'wrap',
  },
  witrBadge: {
    fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em',
    padding:'2px 7px', borderRadius:6, flexShrink:0,
    background:'rgba(224,80,80,.12)', border:'1px solid rgba(224,80,80,.25)',
    color:'#e05050',
  },
  witrText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.55 },
  extraNote: {
    marginTop:10, fontSize:11, color:'rgba(255,255,255,.25)',
    fontStyle:'italic', lineHeight:1.5,
    borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:8,
  },

  // Экран ракаатов
  rakaatPageHead: {
    display:'flex', alignItems:'center', gap:12, marginBottom:16,
  },
  rakaatBackBtn: {
    width:36, height:36, borderRadius:10, flexShrink:0,
    background:'rgba(255,255,255,.07)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:22, lineHeight:'1', cursor:'pointer',
    outline:'none', fontFamily:'var(--font-ui)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  rakaatPageTitle: { fontSize:17, fontWeight:700, color:'var(--text)' },
  rakaatPageSub: { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  rakaatRestartBtn: {
    width:'100%', marginTop:16, padding:'13px',
    borderRadius:14, background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.12)',
    color:'var(--text-muted)', fontSize:14, fontWeight:600,
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
  },

  // Блок ракаатов
  rakaatIntro: {
    display:'flex', alignItems:'flex-start', gap:12,
    background:'rgba(201,168,76,.07)', border:'1px solid rgba(201,168,76,.22)',
    borderRadius:14, padding:'14px', marginBottom:12,
  },
  rakaatIntroIcon: { fontSize:24, flexShrink:0 },
  rakaatIntroTitle: { fontSize:14, fontWeight:700, color:'var(--gold)', marginBottom:4 },
  rakaatIntroText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.65 },

  rakaatCard: {
    background:'var(--bg-card)', border:'1.5px solid',
    borderRadius:16, marginBottom:10, overflow:'hidden',
  },
  rakaatHeader: {
    width:'100%', display:'flex', alignItems:'center',
    justifyContent:'space-between', padding:'12px 14px',
    background:'transparent', border:'none', cursor:'pointer',
    fontFamily:'var(--font-ui)', outline:'none',
  },
  rakaatBadge: {
    width:38, height:38, borderRadius:12,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:15, fontWeight:800, flexShrink:0,
  },
  rakaatLabel: { fontSize:14, fontWeight:700, textAlign:'left' },
  rakaatWho: { fontSize:11, color:'var(--text-muted)', textAlign:'left', marginTop:1 },
  rakaatChevron: { fontSize:18, transition:'transform .2s', flexShrink:0 },

  rakaatBody: {
    padding:'0 14px 14px',
    borderTop:'1px solid rgba(255,255,255,.08)',
    paddingTop:12,
  },
  rakaatSecTitle: { fontSize:12, fontWeight:700, marginBottom:6, letterSpacing:'.02em' },
  rakaatItem: { display:'flex', alignItems:'flex-start', gap:8, marginBottom:5 },
  rakaatDot: { width:6, height:6, borderRadius:'50%', flexShrink:0, marginTop:5 },
  rakaatItemText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.6 },
  rakaatTip: {
    marginTop:10, fontSize:11, color:'var(--text-muted)',
    fontStyle:'italic', lineHeight:1.6,
    background:'rgba(255,255,255,.04)', borderRadius:8,
    padding:'8px 10px',
  },
  prayersIntro: { fontSize:13, color:'var(--text-muted)', lineHeight:1.7, marginBottom:14 },
  prayerCard: {
    display:'flex', flexDirection:'column',
    background:'var(--bg-card)', border:'1.5px solid',
    borderRadius:16, padding:'12px 14px', marginBottom:10
  },
  prayerIconBig: {
    width:52, height:52, borderRadius:14, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center'
  },
  prayerCardBody: { flex:1, display:'flex', flexDirection:'column', gap:4 },
  prayerCardTop: { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  prayerCardName: { fontSize:16, fontWeight:700 },
  prayerCardAr: { fontFamily:"'Scheherazade New',serif", fontSize:14, direction:'rtl' },
  prayerRakatBadge: { fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:8 },
  prayerCardTime: { fontSize:12, color:'var(--text-muted)' },
  prayerCardDesc: { fontSize:12, color:'var(--text-muted)', lineHeight:1.55 },
  prayerNote: {
    display:'flex', gap:10, background:'rgba(201,168,76,.06)',
    border:'1px solid rgba(201,168,76,.2)', borderRadius:14, padding:'12px 14px', marginTop:4
  },
  prayerNoteIcon: { fontSize:18, flexShrink:0 },
  prayerNoteText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.65 },

  // ── Вуду ──
  wuduIntro: { fontSize:13, color:'var(--text-muted)', lineHeight:1.65, marginBottom:4, padding:'4px 0 8px' },
  wuduSectionLabel: {
    fontSize:11, fontWeight:700, color:'var(--text-muted)',
    textTransform:'uppercase', letterSpacing:'.1em', marginTop:16, marginBottom:8
  },
  wuduNiyya: {
    display:'flex', alignItems:'flex-start', gap:12,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:14, padding:'12px 14px', marginBottom:8
  },
  wuduNiyyaIcon: { fontSize:22, flexShrink:0, marginTop:1 },
  wuduNiyyaTitle: { fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3 },
  wuduNiyyaText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.6 },

  wuduStep: {
    display:'flex', alignItems:'flex-start', gap:12,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:14, padding:'12px 14px', marginBottom:8
  },
  wuduStepNum: {
    width:28, height:28, borderRadius:'50%', flexShrink:0,
    background:'linear-gradient(135deg,#4A90D9,#6aadff)',
    color:'#fff', fontSize:13, fontWeight:800,
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 0 10px rgba(74,144,217,.4)'
  },
  wuduStepBody: { flex:1 },
  wuduStepTitle: { fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4, display:'flex', alignItems:'center' },
  wuduStepDesc: { fontSize:12, color:'var(--text-muted)', lineHeight:1.65 },

  wuduDua: {
    background:'rgba(201,168,76,.06)', border:'1px solid rgba(201,168,76,.2)',
    borderRadius:16, padding:'14px', display:'flex', flexDirection:'column', gap:6
  },
  wuduDuaAr: { fontFamily:"'Scheherazade New',serif", fontSize:16, lineHeight:1.9, direction:'rtl', textAlign:'center' },
  wuduDuaTranslit: { fontSize:11, color:'rgba(255,255,255,.4)', fontStyle:'italic', textAlign:'center', lineHeight:1.5 },
  wuduDuaDivider: { height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.3),transparent)' },
  wuduDuaTransl: { fontSize:12, color:'var(--text)', lineHeight:1.6, textAlign:'center' },
  wuduDuaSource: { fontSize:11, color:'var(--gold)', textAlign:'center', lineHeight:1.5 },

  wuduBreakers: { display:'flex', flexDirection:'column', gap:7, marginBottom:12 },
  wuduBreaker: {
    display:'flex', alignItems:'center', gap:10,
    background:'rgba(255,80,80,.05)', border:'1px solid rgba(255,80,80,.15)',
    borderRadius:12, padding:'9px 12px'
  },
  wuduBreakerText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.5 },

  wuduTip: {
    display:'flex', gap:10, background:'rgba(201,168,76,.06)',
    border:'1px solid rgba(201,168,76,.2)', borderRadius:14, padding:'12px 14px'
  },
  wuduTipIcon: { fontSize:18, flexShrink:0 },
  wuduTipText: { fontSize:12, color:'var(--text-muted)', lineHeight:1.65 },
}

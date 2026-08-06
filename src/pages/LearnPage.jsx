import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBackHandler } from '../hooks/useBackHandler'
import Adhkar         from '../components/Adhkar'
import AsmaHusna      from '../components/AsmaHusna'
import Duas           from '../components/Duas'
import IslamicCalendar from '../components/IslamicCalendar'
import PrayerGuide    from '../components/PrayerGuide'
import RamadanGuide   from '../components/RamadanGuide'
import SurahLearn     from '../components/SurahLearn'
import QuranAlphabet  from '../components/QuranAlphabet'
import QandA          from '../components/QandA'
import BeginnerPath, { BeginnerPathWidget, BeginnerPathHintCard, shouldShowBeginnerHint } from '../components/BeginnerPath'
import Glossary      from '../components/Glossary'
import Prophets     from '../components/Prophets'
import QandAQuiz    from '../components/QandAQuiz'

const BEGINNER_ITEMS = [
  { id: 'qa',       icon: '❓', title: 'Вопросы и ответы',  sub: 'Достоверные ответы на частые вопросы начинающих' },
  { id: 'prophets', icon: '🌙', title: 'Истории пророков',  sub: 'Адам, Нух, Ибрахим, Муса, Иса, Мухаммад ﷺ' },
  { id: 'alphabet', icon: '🔤', title: 'Арабский алфавит',  sub: 'Буквы, махрадж, харакаты — по методу Муаллим Сани' },
  { id: 'surahs',   icon: '📚', title: 'Разучивание сур',   sub: 'Фатиха, Ихлас, Фалак, Нас — аят за аятом' },
  { id: 'guide',    icon: '🕌', title: 'Как читать намаз',  sub: 'Пошаговый гид с фото и вуду' },
]

const KNOWLEDGE_ITEMS = [
  { id: 'adhkar',   icon: '📿', title: 'Азкары',             sub: 'Утренние и вечерние зикры' },
  { id: 'duas',     icon: '🤲', title: 'Дуа',                 sub: 'Молитвы из Корана и Сунны' },
  { id: 'asma',     icon: '✨', title: '99 имён Аллаха',     sub: 'Асмауль-Хусна с описанием' },
  { id: 'calendar', icon: '☪️', title: 'Исламский календарь', sub: 'Праздники, священные дни, история' },
  { id: 'ramadan',  icon: '🌙', title: 'Рамадан-гид',        sub: 'Пост, сухур, ифтар, ибадат' },
]

const TEST_ITEMS = [
  { id: 'quiz',     icon: '🎯', title: 'Исламский квиз', sub: 'Проверь знания — 10 вопросов, НУР за ответы' },
  { id: 'glossary', icon: '📖', title: 'Глоссарий',       sub: '50 исламских терминов с объяснением' },
]

// Раньше у каждого из 12 пунктов был свой цвет рамки/свечения/заголовка (8 разных
// цветов подряд в одном списке — визуально "прыгает"). Теперь один приглушённый
// акцент на секцию, заголовок всегда белый — цвет несёт только иконка.
const ACCENTS = {
  gold: {
    border: 'rgba(201,168,76,.22)',
    gradient: 'linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.02))',
    glow: '0 0 9px rgba(201,168,76,.16)',
    iconBg: 'rgba(201,168,76,.15)',
    iconColor: 'var(--gold)',
  },
  teal: {
    border: 'rgba(79,174,143,.24)',
    gradient: 'linear-gradient(135deg,rgba(79,174,143,.09),rgba(79,174,143,.02))',
    glow: '0 0 9px rgba(79,174,143,.16)',
    iconBg: 'rgba(79,174,143,.16)',
    iconColor: '#5fcaa8',
  },
  violet: {
    border: 'rgba(155,125,212,.26)',
    gradient: 'linear-gradient(135deg,rgba(155,125,212,.1),rgba(155,125,212,.02))',
    glow: '0 0 9px rgba(155,125,212,.18)',
    iconBg: 'rgba(155,125,212,.16)',
    iconColor: '#b39ce8',
  },
}

function ItemCard({ item, accent, onOpen }) {
  const a = ACCENTS[accent]
  return (
    <button
      style={{ ...s.card, background: a.gradient, borderColor: a.border }}
      onClick={() => onOpen(item.id)}
    >
      <div style={{ ...s.iconWrap, background: a.iconBg, boxShadow: a.glow, color: a.iconColor }}>
        <span style={s.iconEmoji}>{item.icon}</span>
      </div>
      <div style={s.cardText}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={s.cardTitle}>{item.title}</span>
          {item.badge && <span style={s.newBadge}>{item.badge}</span>}
        </div>
        <span style={s.cardSub}>{item.sub}</span>
      </div>
      <span style={s.arrow}>›</span>
    </button>
  )
}

export default function LearnPage() {
  const [open, setOpen] = useState(null)
  const [qaId, setQaId] = useState(null)
  const [calendarEventId, setCalendarEventId] = useState(null)
  const [showBeginnerHint, setShowBeginnerHint] = useState(shouldShowBeginnerHint)
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const isSeeker = !profile?.level || profile.level === 'seeker'

  // Переход из общего поиска приложения — сразу открыть нужный раздел
  // (и конкретный вопрос в Q&A, если пришли из поиска по вопросам)
  useEffect(() => {
    if (!location.state?.openSection) return
    setOpen(location.state.openSection)
    if (location.state.qaId != null) setQaId(location.state.qaId)
    if (location.state.eventId != null) setCalendarEventId(location.state.eventId)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state])

  // Экраны знаний (алфавит, вуду и т.п.) открываются через состояние, а не
  // роут — без этого аппаратная кнопка "назад" не знает про них и улетает
  // сразу на Главную вместо возврата в список "Знаний"
  useBackHandler(open !== null, () => { setOpen(null); setQaId(null) })

  return (
    <div style={s.wrap}>
      {/* Шапка */}
      <div style={s.head}>
        <div style={s.headRow}>
          <button style={s.backBtn} onClick={() => navigate('/home')}>‹</button>
          <div>
            <div style={s.headTitle}>Знания</div>
            <div style={s.headSub}>Всё необходимое для практики ислама</div>
          </div>
        </div>
      </div>

      {/* Список */}
      <div style={s.list} className="scroll-y">

        {/* 1. Путь новичка */}
        {isSeeker && (
          <>
            <div style={s.sectionLabel}>Путь новичка</div>
            <BeginnerPathWidget onOpen={() => setOpen('path')} />
          </>
        )}
        {!isSeeker && showBeginnerHint && (
          <>
            <div style={s.sectionLabel}>Путь новичка</div>
            <BeginnerPathHintCard
              onOpen={() => setOpen('path')}
              onHide={() => setShowBeginnerHint(false)}
            />
          </>
        )}

        {/* 2. Для начинающих */}
        <div style={{ ...s.sectionLabel, marginTop: isSeeker || (!isSeeker && showBeginnerHint) ? 10 : 6 }}>Для начинающих</div>
        {BEGINNER_ITEMS.map(item => (
          <ItemCard key={item.id} item={item} accent="gold" onOpen={setOpen} />
        ))}

        {/* 3. Знания и ибадат */}
        <div style={{ ...s.sectionLabel, marginTop: 10 }}>Знания и ибадат</div>
        {KNOWLEDGE_ITEMS.map(item => (
          <ItemCard key={item.id} item={item} accent="teal" onOpen={setOpen} />
        ))}

        {/* 4. Проверь себя */}
        <div style={{ ...s.sectionLabel, marginTop: 10 }}>Проверь себя</div>
        {TEST_ITEMS.map(item => (
          <ItemCard key={item.id} item={item} accent="violet" onOpen={setOpen} />
        ))}

        <div style={{ height: 24 }} />
      </div>

      {/* Оверлеи */}
      {open === 'path'     && <BeginnerPath    onClose={() => setOpen(null)} />}
      {open === 'glossary'  && <Glossary       onClose={() => setOpen(null)} />}
      {open === 'prophets'  && <Prophets      onClose={() => setOpen(null)} />}
      {open === 'quiz'      && <QandAQuiz     onClose={() => setOpen(null)} />}
      {open === 'ramadan'  && <RamadanGuide    onClose={() => setOpen(null)} />}
      {open === 'alphabet' && <QuranAlphabet   onClose={() => setOpen(null)} />}
      {open === 'qa'       && <QandA           initialOpenId={qaId} onClose={() => { setOpen(null); setQaId(null) }} />}
      {open === 'surahs'   && <SurahLearn      onClose={() => setOpen(null)} />}
      {open === 'adhkar'   && <Adhkar          onClose={() => setOpen(null)} />}
      {open === 'asma'     && <AsmaHusna       onClose={() => setOpen(null)} />}
      {open === 'duas'     && <Duas            onClose={() => setOpen(null)} />}
      {open === 'guide'    && <PrayerGuide     onClose={() => setOpen(null)} />}
      {open === 'calendar' && <IslamicCalendar onClose={() => { setOpen(null); setCalendarEventId(null) }} initialEventId={calendarEventId} />}
    </div>
  )
}

const s = {
  wrap: {
    height: '100%', display: 'flex', flexDirection: 'column',
    background: 'var(--bg-deep)', fontFamily: 'var(--font-ui)',
  },
  head: {
    flexShrink: 0, padding: '18px 20px 14px',
    borderBottom: '1px solid var(--border)',
  },
  headRow: { display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1,
  },
  headTitle: { fontSize: 22, fontWeight: 800, color: 'var(--text)' },
  headSub: { fontSize: 13, color: 'var(--text-muted)', marginTop: 3 },

  list: {
    flex: 1, overflowY: 'auto', padding: '14px 16px 0',
    display: 'flex', flexDirection: 'column', gap: 10,
  },

  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.1em',
    marginTop: 6, marginBottom: 2,
  },

  newBadge: {
    fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
    background: 'linear-gradient(135deg,#8a5fd8,#b080ff)',
    color: '#fff', borderRadius: 6, padding: '3px 7px',
    flexShrink: 0,
  },

  card: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    borderRadius: 18, border: '1px solid', padding: '14px 16px',
    cursor: 'pointer', outline: 'none', textAlign: 'left',
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji: { fontSize: 24 },
  cardText: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  cardSub: { fontSize: 12, color: 'var(--text-muted)' },
  arrow: { fontSize: 22, color: 'rgba(255,255,255,.2)', flexShrink: 0 },
}

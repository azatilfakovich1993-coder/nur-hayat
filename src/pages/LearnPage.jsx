import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Adhkar         from '../components/Adhkar'
import AsmaHusna      from '../components/AsmaHusna'
import Duas           from '../components/Duas'
import IslamicCalendar from '../components/IslamicCalendar'
import PrayerGuide    from '../components/PrayerGuide'
import RamadanGuide   from '../components/RamadanGuide'
import SurahLearn     from '../components/SurahLearn'
import QuranAlphabet  from '../components/QuranAlphabet'
import QandA          from '../components/QandA'
import BeginnerPath, { BeginnerPathWidget } from '../components/BeginnerPath'
import Glossary      from '../components/Glossary'
import Prophets     from '../components/Prophets'
import QandAQuiz    from '../components/QandAQuiz'

const BEGINNER_ITEMS = [
  {
    id: 'qa',
    icon: '❓',
    title: 'Вопросы и ответы',
    sub: 'Достоверные ответы на частые вопросы начинающих',
    gradient: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))',
    border: 'rgba(201,168,76,.35)',
    iconBg: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    glow: '0 0 16px rgba(201,168,76,.4)',
    titleColor: 'var(--gold)',
    badge: 'NEW',
  },
  {
    id: 'prophets',
    icon: '🌙',
    title: 'Истории пророков',
    sub: 'Адам, Нух, Ибрахим, Муса, Иса, Мухаммад ﷺ',
    gradient: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))',
    border: 'rgba(201,168,76,.4)',
    iconBg: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    glow: '0 0 16px rgba(201,168,76,.4)',
    titleColor: 'var(--gold)',
    badge: 'NEW',
  },
  {
    id: 'alphabet',
    icon: '🔤',
    title: 'Арабский алфавит',
    sub: 'Буквы, махрадж, харакаты — по методу Муаллим Сани',
    gradient: 'linear-gradient(135deg,rgba(82,183,136,.15),rgba(82,183,136,.05))',
    border: 'rgba(82,183,136,.35)',
    iconBg: 'linear-gradient(135deg,#1a7a56,#52b788)',
    glow: '0 0 16px rgba(82,183,136,.4)',
    titleColor: '#52b788',
    badge: 'NEW',
  },
  {
    id: 'surahs',
    icon: '📚',
    title: 'Разучивание сур',
    sub: 'Фатиха, Ихлас, Фалак, Нас — аят за аятом',
    gradient: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))',
    border: 'rgba(201,168,76,.35)',
    iconBg: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    glow: '0 0 16px rgba(201,168,76,.4)',
    titleColor: 'var(--gold)',
    badge: 'NEW',
  },
  {
    id: 'guide',
    icon: '🕌',
    title: 'Как читать намаз',
    sub: 'Пошаговый гид с фото и вуду',
    gradient: 'linear-gradient(135deg,rgba(180,80,80,.12),rgba(180,80,80,.04))',
    border: 'rgba(180,80,80,.3)',
    iconBg: 'linear-gradient(135deg,#a03030,#d06060)',
    glow: '0 0 16px rgba(180,80,80,.4)',
    titleColor: '#d07070',
  },
]

const KNOWLEDGE_ITEMS = [
  {
    id: 'adhkar',
    icon: '📿',
    title: 'Азкары',
    sub: 'Утренние и вечерние зикры',
    gradient: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))',
    border: 'rgba(201,168,76,.3)',
    iconBg: 'linear-gradient(135deg,#C9A84C,#F0D080)',
    glow: '0 0 16px rgba(201,168,76,.45)',
    titleColor: 'var(--gold)',
  },
  {
    id: 'duas',
    icon: '🤲',
    title: 'Дуа',
    sub: 'Молитвы из Корана и Сунны',
    gradient: 'linear-gradient(135deg,rgba(46,168,122,.12),rgba(46,168,122,.04))',
    border: 'rgba(46,168,122,.3)',
    iconBg: 'linear-gradient(135deg,#1a7a56,#2ea87a)',
    glow: '0 0 16px rgba(46,168,122,.4)',
    titleColor: '#2ea87a',
  },
  {
    id: 'asma',
    icon: '✨',
    title: '99 имён Аллаха',
    sub: 'Асмауль-Хусна с описанием',
    gradient: 'linear-gradient(135deg,rgba(100,60,180,.12),rgba(100,60,180,.04))',
    border: 'rgba(100,60,180,.3)',
    iconBg: 'linear-gradient(135deg,#5c3caa,#8a6fd0)',
    glow: '0 0 16px rgba(100,60,180,.4)',
    titleColor: '#a07de8',
  },
  {
    id: 'calendar',
    icon: '☪️',
    title: 'Исламский календарь',
    sub: 'Праздники, священные дни, история',
    gradient: 'linear-gradient(135deg,rgba(74,100,180,.12),rgba(74,100,180,.04))',
    border: 'rgba(74,100,180,.3)',
    iconBg: 'linear-gradient(135deg,#3a5bbf,#6a8fd8)',
    glow: '0 0 16px rgba(74,100,180,.4)',
    titleColor: '#6a8fd8',
  },
  {
    id: 'ramadan',
    icon: '🌙',
    title: 'Рамадан-гид',
    sub: 'Пост, сухур, ифтар, ибадат',
    gradient: 'linear-gradient(135deg,rgba(74,60,140,.25),rgba(120,80,200,.1))',
    border: 'rgba(120,80,200,.35)',
    iconBg: 'linear-gradient(135deg,#4a3c8c,#8a5fd8)',
    glow: '0 0 18px rgba(120,80,200,.4)',
    titleColor: '#a07de8',
  },
]

const TEST_ITEMS = [
  {
    id: 'quiz',
    icon: '🎯',
    title: 'Исламский квиз',
    sub: 'Проверь знания — 10 вопросов, НУР за ответы',
    gradient: 'linear-gradient(135deg,rgba(160,125,232,.15),rgba(160,125,232,.05))',
    border: 'rgba(160,125,232,.4)',
    iconBg: 'linear-gradient(135deg,#5c3caa,#a07de8)',
    glow: '0 0 16px rgba(160,125,232,.4)',
    titleColor: '#a07de8',
    badge: 'NEW',
  },
  {
    id: 'glossary',
    icon: '📖',
    title: 'Глоссарий',
    sub: '50 исламских терминов с объяснением',
    gradient: 'linear-gradient(135deg,rgba(74,144,217,.15),rgba(74,144,217,.05))',
    border: 'rgba(74,144,217,.35)',
    iconBg: 'linear-gradient(135deg,#1a4a8a,#4a90d9)',
    glow: '0 0 16px rgba(74,144,217,.4)',
    titleColor: '#4a90d9',
    badge: 'NEW',
  },
]

function ItemCard({ item, onOpen }) {
  return (
    <button
      style={{ ...s.card, background: item.gradient, borderColor: item.border }}
      onClick={() => onOpen(item.id)}
    >
      <div style={{ ...s.iconWrap, background: item.iconBg, boxShadow: item.glow }}>
        <span style={s.iconEmoji}>{item.icon}</span>
      </div>
      <div style={s.cardText}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...s.cardTitle, color: item.titleColor }}>{item.title}</span>
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
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isSeeker = !profile?.level || profile.level === 'seeker'

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

        {/* 2. Для начинающих */}
        <div style={{ ...s.sectionLabel, marginTop: isSeeker ? 10 : 6 }}>Для начинающих</div>
        {BEGINNER_ITEMS.map(item => (
          <ItemCard key={item.id} item={item} onOpen={setOpen} />
        ))}

        {/* 3. Знания и ибадат */}
        <div style={{ ...s.sectionLabel, marginTop: 10 }}>Знания и ибадат</div>
        {KNOWLEDGE_ITEMS.map(item => (
          <ItemCard key={item.id} item={item} onOpen={setOpen} />
        ))}

        {/* 4. Проверь себя */}
        <div style={{ ...s.sectionLabel, marginTop: 10 }}>Проверь себя</div>
        {TEST_ITEMS.map(item => (
          <ItemCard key={item.id} item={item} onOpen={setOpen} />
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
      {open === 'qa'       && <QandA           onClose={() => setOpen(null)} />}
      {open === 'surahs'   && <SurahLearn      onClose={() => setOpen(null)} />}
      {open === 'adhkar'   && <Adhkar          onClose={() => setOpen(null)} />}
      {open === 'asma'     && <AsmaHusna       onClose={() => setOpen(null)} />}
      {open === 'duas'     && <Duas            onClose={() => setOpen(null)} />}
      {open === 'guide'    && <PrayerGuide     onClose={() => setOpen(null)} />}
      {open === 'calendar' && <IslamicCalendar onClose={() => setOpen(null)} />}
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
  cardTitle: { fontSize: 15, fontWeight: 600 },
  cardSub: { fontSize: 12, color: 'var(--text-muted)' },
  arrow: { fontSize: 22, color: 'rgba(255,255,255,.2)', flexShrink: 0 },
}

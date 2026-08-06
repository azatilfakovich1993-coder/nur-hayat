import { SURAS } from './suras'
import { QA_DATA } from './qa-data'
import { PRAYER_STEPS } from './prayer-guide'
import { GLOSSARY } from './glossary'
import { PROPHETS } from './prophets'
import { DUAS_CATEGORIES } from './duas'
import { ADHKAR } from './adhkar'
import { ASMA_HUSNA } from './asmaul-husna'

// Единый индекс для общего поиска по приложению (компонент AppSearch).
// Каждая запись: title/keywords для fuzzy-поиска, route — куда перейти,
// navState — что положить в navigate(route, { state: navState }), чтобы
// страница назначения сама открыла нужный раздел/попап/вопрос.

// priority: 0 — разделы/настройки/действия, всегда выше в выдаче, даже если
// у контента (азкары, дуа, суры и т.п.) fuzzy-совпадение формально точнее.
// Иначе, например, 11 отдельных азкаров одинаково подходящих под "азкары"
// хоронят внизу собственно тумблер "Уведомления азкаров".
const SECTIONS = [
  // ── Верхний уровень ──
  { title: 'Коран',           keywords: 'коран сура чтение аяты', category: 'Разделы', icon: '📖', route: '/quran' },
  { title: 'Намаз',           keywords: 'намаз молитва времена азан салят', category: 'Разделы', icon: '🕌', route: '/prayer' },
  { title: 'Чат',             keywords: 'чат сообщения общение', category: 'Разделы', icon: '💬', route: '/chat' },
  { title: 'Знания',          keywords: 'знания учёба обучение', category: 'Разделы', icon: '📚', route: '/learn' },
  { title: 'Профиль',         keywords: 'профиль аккаунт достижения', category: 'Разделы', icon: '👤', route: '/profile' },

  // ── Намаз: попапы/действия ──
  { title: 'Времена намазов',        keywords: 'времена намаза расписание намаз азан', category: 'Намаз', icon: '🕌', route: '/prayer' },
  { title: 'Напоминания о намазе',   keywords: 'напоминание уведомление намаз включить выключить 10 20 30 минут', category: 'Намаз', icon: '🔔', route: '/prayer' },
  { title: 'Кибла',                  keywords: 'кибла компас направление мекка', category: 'Намаз', icon: '🧭', route: '/prayer', navState: { openQibla: true } },
  { title: 'Тасбих',                 keywords: 'тасбих счётчик зикр чётки', category: 'Намаз', icon: '📿', route: '/prayer', navState: { openTasbih: true } },
  { title: 'История намазов',        keywords: 'история календарь намаз статистика', category: 'Намаз', icon: '📅', route: '/prayer', navState: { openCalendar: true } },
  { title: 'Настройка метода расчёта', keywords: 'метод расчёта намаза мазхаб школа город', category: 'Намаз', icon: '⚙️', route: '/prayer', navState: { openSettings: true } },

  // ── Знания: разделы ──
  { title: 'Путь новичка',      keywords: 'путь новичка обучение шахада начало', category: 'Знания', icon: '🌱', route: '/learn', navState: { openSection: 'path' } },
  { title: 'Вопросы и ответы',  keywords: 'вопросы ответы q&a база знаний', category: 'Знания', icon: '❓', route: '/learn', navState: { openSection: 'qa' } },
  { title: 'Истории пророков',  keywords: 'пророки истории коран', category: 'Знания', icon: '🕋', route: '/learn', navState: { openSection: 'prophets' } },
  { title: 'Арабский алфавит',  keywords: 'арабский алфавит буквы произношение махрадж', category: 'Знания', icon: '🔤', route: '/learn', navState: { openSection: 'alphabet' } },
  { title: 'Гид по намазу',     keywords: 'гид как читать намаз пошагово молитва', category: 'Знания', icon: '🕌', route: '/learn', navState: { openSection: 'guide' } },
  { title: 'Азкары',            keywords: 'азкары зикры утренние вечерние поминание', category: 'Знания', icon: '🌅', route: '/learn', navState: { openSection: 'adhkar' } },
  { title: 'Дуа',               keywords: 'дуа мольба молитвы на все случаи', category: 'Знания', icon: '🤲', route: '/learn', navState: { openSection: 'duas' } },
  { title: '99 имён Аллаха',    keywords: 'имена аллаха асма уль хусна 99', category: 'Знания', icon: '✨', route: '/learn', navState: { openSection: 'asma' } },
  { title: 'Исламский календарь', keywords: 'календарь хиджра праздники события даты', category: 'Знания', icon: '🗓️', route: '/learn', navState: { openSection: 'calendar' } },
  { title: 'Гид по Рамадану',   keywords: 'рамадан пост ураза гид', category: 'Знания', icon: '🌙', route: '/learn', navState: { openSection: 'ramadan' } },
  { title: 'Разучивание сур',   keywords: 'разучивание сур выучить наизусть фатиха', category: 'Знания', icon: '📖', route: '/learn', navState: { openSection: 'surahs' } },
  { title: 'Тест / квиз',       keywords: 'тест квиз проверь себя викторина', category: 'Знания', icon: '🧠', route: '/learn', navState: { openSection: 'quiz' } },
  { title: 'Словарь терминов',  keywords: 'словарь глоссарий термины ислам', category: 'Знания', icon: '📔', route: '/learn', navState: { openSection: 'glossary' } },

  // ── Профиль / настройки ──
  { title: 'Настройки уведомлений', keywords: 'настройки уведомления намаз азкары аят дня push', category: 'Настройки', icon: '🔔', route: '/profile', navState: { activeTab: 'settings' } },
  { title: 'Тема оформления',       keywords: 'тема оформление тёмная светлая', category: 'Настройки', icon: '🌙', route: '/profile', navState: { activeTab: 'settings' } },
  { title: 'Размер шрифта Корана',  keywords: 'шрифт размер текст коран арабский', category: 'Настройки', icon: '🔠', route: '/profile', navState: { activeTab: 'settings' } },
  { title: 'Смена пароля',          keywords: 'пароль смена безопасность аккаунт', category: 'Настройки', icon: '🔒', route: '/profile', navState: { activeTab: 'settings' } },
  { title: 'Понравившееся',         keywords: 'понравившееся избранное аяты хадисы', category: 'Профиль', icon: '⭐', route: '/profile', navState: { openFavorites: true } },
  { title: 'Заметки и цели',        keywords: 'заметки цели личное', category: 'Профиль', icon: '📝', route: '/profile', navState: { openNotes: true } },
  { title: 'Достижения',            keywords: 'достижения бейджи награды', category: 'Профиль', icon: '🏆', route: '/profile', navState: { openBadges: true } },
].map(s => ({ ...s, priority: 0 }))

// Суры Корана — переход сразу на /quran/:id
const SURA_ITEMS = SURAS.map(s => ({
  title: `${s.id}. ${s.translit} (${s.ru})`,
  keywords: `сура ${s.translit} ${s.ru} ${s.ar} ${s.id}`,
  category: 'Коран',
  icon: '📖',
  route: `/quran/${s.id}`,
}))

// Вопросы из базы Q&A — переход в Знания → Вопросы и ответы с открытым вопросом
const QA_ITEMS = QA_DATA.map(item => ({
  title: item.q,
  keywords: `${item.q} ${item.a}`,
  category: 'Вопросы и ответы',
  icon: '❓',
  route: '/learn',
  navState: { openSection: 'qa', qaId: item.id },
}))

// Шаги "Как совершить намаз" — реальное содержимое гида, а не просто ссылка на раздел
const GUIDE_ITEMS = PRAYER_STEPS.map(step => ({
  title: `Как совершить намаз — ${step.title}`,
  keywords: `${step.title} ${step.titleAr} ${step.description} ${(step.details || []).join(' ')}`,
  category: 'Гид по намазу',
  icon: '🕌',
  route: '/learn',
  navState: { openSection: 'guide' },
}))

// Словарь терминов
const GLOSSARY_ITEMS = GLOSSARY.map(g => ({
  title: g.term,
  keywords: `${g.term} ${g.arabic || ''} ${g.short} ${g.full}`,
  category: 'Словарь терминов',
  icon: '📔',
  route: '/learn',
  navState: { openSection: 'glossary' },
}))

// Истории пророков
const PROPHET_ITEMS = PROPHETS.map(p => ({
  title: p.name,
  keywords: `${p.name} ${p.title} ${p.short}`,
  category: 'Истории пророков',
  icon: '🕋',
  route: '/learn',
  navState: { openSection: 'prophets' },
}))

function truncate(text, len = 60) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len).trim() + '…' : text
}

// Дуа — по содержимому каждой мольбы. Заголовок — начало самой мольбы, а не
// повторяющееся название категории, иначе все дуа одной категории выглядят
// одинаково в списке результатов.
const DUA_ITEMS = DUAS_CATEGORIES.flatMap(cat =>
  (cat.duas || []).map(d => ({
    title: `${cat.title}: ${truncate(d.translation)}`,
    keywords: `${cat.title} ${d.translation} ${d.source || ''}`,
    category: 'Дуа',
    icon: '🤲',
    route: '/learn',
    navState: { openSection: 'duas' },
  }))
)

// Азкары (утренние и вечерние) — заголовок из реального текста зикра,
// иначе все 11+ записей выглядят как один и тот же дубль "Азкар".
const ADHKAR_ITEMS = [...(ADHKAR.morning || []), ...(ADHKAR.evening || [])].map(a => ({
  title: truncate(a.translation),
  keywords: `${a.translation} ${a.source || ''}`,
  category: 'Азкары',
  icon: '🌅',
  route: '/learn',
  navState: { openSection: 'adhkar' },
}))

// 99 имён Аллаха
const ASMA_ITEMS = ASMA_HUSNA.map(n => ({
  title: n.transliteration,
  keywords: `${n.transliteration} ${n.translation} ${n.desc}`,
  category: '99 имён Аллаха',
  icon: '✨',
  route: '/learn',
  navState: { openSection: 'asma' },
}))

export const SEARCH_INDEX = [
  ...SECTIONS, ...SURA_ITEMS, ...QA_ITEMS, ...GUIDE_ITEMS,
  ...GLOSSARY_ITEMS, ...PROPHET_ITEMS, ...DUA_ITEMS, ...ADHKAR_ITEMS, ...ASMA_ITEMS,
]

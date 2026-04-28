import { useState, useRef, useEffect } from 'react'
import { LETTERS, HARAKAT, MAKHRAJ_GROUPS, LETTER_SOUND } from '../data/arabic-letters'
import { useAuth } from '../hooks/useAuth'
import { addNur } from '../utils/nur'

// ─── Audio ─────────────────────────────────────────────────────────────────
function getTTSUrl(text) {
  // Repeat short text so TTS has enough context
  const q = text.length < 4 ? `${text} ${text} ${text}` : text
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=ar&client=tw-ob`
}

// ─── Данные глав ──────────────────────────────────────────────────────────
const CHAPTERS = [
  { id:'alphabet', num:1, icon:'ا',  title:'Алфавит',  titleAr:'الحُرُوف',    sub:'28 арабских букв', color:'#c9a84c', bg:'rgba(201,168,76,.1)',  border:'rgba(201,168,76,.3)' },
  { id:'makhraj',  num:2, icon:'◉',  title:'Махрадж',  titleAr:'المَخْرَج',   sub:'Откуда берётся звук каждой буквы', color:'#52b788', bg:'rgba(82,183,136,.1)', border:'rgba(82,183,136,.3)' },
  { id:'fatha',    num:3, icon:'بَ', title:'Фатха',    titleAr:'الفَتْحَة',   sub:'Краткое «а» — بَ تَ ثَ...', color:'#c9a84c', bg:'rgba(201,168,76,.1)',  border:'rgba(201,168,76,.3)' },
  { id:'kasra',    num:4, icon:'بِ', title:'Кясра',    titleAr:'الكَسْرَة',   sub:'Краткое «и» — بِ تِ ثِ...', color:'#52b788', bg:'rgba(82,183,136,.1)',  border:'rgba(82,183,136,.3)' },
  { id:'damma',    num:5, icon:'بُ', title:'Дамма',    titleAr:'الضَّمَّة',   sub:'Краткое «у» — بُ تُ ثُ...', color:'#6a8fd8', bg:'rgba(106,143,216,.1)', border:'rgba(106,143,216,.3)' },
  { id:'sukun',    num:6, icon:'بْ', title:'Сукун',    titleAr:'السُّكُون',   sub:'Нет гласной — закрытый слог', color:'#e88a5a', bg:'rgba(232,138,90,.1)',  border:'rgba(232,138,90,.3)' },
  { id:'tanwin',   num:7, icon:'ـٌ', title:'Танвин',   titleAr:'التَّنْوِين', sub:'«ан / ин / ун» — конечный нун', color:'#a07de8', bg:'rgba(160,125,232,.1)', border:'rgba(160,125,232,.3)' },
  { id:'shadda',   num:8, icon:'بّ', title:'Шадда',    titleAr:'الشَّدَّة',   sub:'Удвоение согласной', color:'#e8c05a', bg:'rgba(232,192,90,.1)',  border:'rgba(232,192,90,.3)' },
  { id:'madd',     num:9, icon:'ـا', title:'Мадд',     titleAr:'المَدّ',      sub:'Долгие гласные — ا و ي', color:'#e88a5a', bg:'rgba(232,138,90,.1)',  border:'rgba(232,138,90,.3)' },
]

const MAKHRAJ_COLOR = {
  jawf:'#6a8fd8', halq:'#e88a5a', lisan:'#52b788', shafatan:'#a07de8', khayshum:'#c9a84c',
}

// Вспомогательные данные для специальных глав
const SUKUN_EXAMPLES = [
  { ar:'قُلْ',   tts:'قُلْ',   ru:'куль',  meaning:'Скажи!',         rule:'Лям с суkуном: «ль»' },
  { ar:'لَمْ',   tts:'لَمْ',   ru:'лям',   meaning:'Не (отрицание)', rule:'Мим с суkуном: «м»' },
  { ar:'مِنْ',   tts:'مِنْ',   ru:'мин',   meaning:'Из / от',        rule:'Нун с суkуном: «н»' },
  { ar:'هَلْ',   tts:'هَلْ',   ru:'халь',  meaning:'Разве? / Ли?',   rule:'Лям с суkуном: «ль»' },
  { ar:'بَلْ',   tts:'بَلْ',   ru:'баль',  meaning:'Но / Напротив',  rule:'Лям с суkуном: «ль»' },
  { ar:'عَنْ',   tts:'عَنْ',   ru:'ан',    meaning:'О / про',        rule:'Нун с суkуном: «н»' },
]

const TANWIN_EXAMPLES = [
  { ar:'أَحَدٌ', tts:'أَحَدٌ', ru:'ахадун', meaning:'Один (имен.)', type:'ضمة', typeRu:'дамм — «ун»', color:'#6a8fd8' },
  { ar:'رَبٌّ',  tts:'رَبٌّ',  ru:'раббун', meaning:'Господь (имен.)', type:'ضمة', typeRu:'дамм — «ун»', color:'#6a8fd8' },
  { ar:'نُورٍ',  tts:'نُورٍ',  ru:'нурин',  meaning:'Света (род.)', type:'كسرة', typeRu:'кясра — «ин»', color:'#52b788' },
  { ar:'صِرَاطٍ',tts:'صِرَاطٍ',ru:'сыратын',meaning:'Пути (род.)', type:'كسرة', typeRu:'кясра — «ин»', color:'#52b788' },
  { ar:'أَحَدًا',tts:'أَحَدًا',ru:'ахадан', meaning:'Одного (вин.)', type:'فتحة', typeRu:'фатх — «ан»', color:'#c9a84c' },
  { ar:'شَيْئًا',tts:'شَيْئًا',ru:'шайан',  meaning:'Что-либо (вин.)', type:'فتحة', typeRu:'фатх — «ан»', color:'#c9a84c' },
]

const SHADDA_EXAMPLES = [
  { ar:'رَبَّنَا',     tts:'رَبَّنَا',     ru:'раббана', meaning:'Господь наш', note:'Буква ب удвоена: «б-ба»' },
  { ar:'اللَّهِ',      tts:'اللَّهِ',      ru:'аллахи',  meaning:'Аллаха', note:'Буква ل удвоена в артикле اَل + لـ' },
  { ar:'الرَّحْمَٰنِ', tts:'الرَّحْمَٰنِ', ru:'ар-рахмани', meaning:'Милостивого', note:'Буква ر удвоена: «р-ра»' },
  { ar:'الرَّحِيمِ',   tts:'الرَّحِيمِ',   ru:'ар-рахими',  meaning:'Милосердного', note:'Буква ر удвоена' },
  { ar:'إِيَّاكَ',     tts:'إِيَّاكَ',     ru:'иййака', meaning:'Тебе (только)', note:'Буква ي удвоена' },
]

const MADD_EXAMPLES = [
  { ar:'الرَّحْمَٰنِ', tts:'الرَّحْمَٰنِ', ru:'ар-рахмааани', meaning:'Милостивого', type:'Алиф-мадд ا',   typeRu:'долгое «а»', note:'فتحة + ا → тяни «а» 2 счёта', color:'#c9a84c' },
  { ar:'الرَّحِيمِ',   tts:'الرَّحِيمِ',   ru:'ар-рахиими',   meaning:'Милосердного', type:'Йа-мадд ي', typeRu:'долгое «и»', note:'كسرة + ي → тяни «и» 2 счёта', color:'#52b788' },
  { ar:'نُوحٍ',        tts:'نُوحٍ',        ru:'нуухин',        meaning:'Нух (Ной)',    type:'Вав-мадд و',  typeRu:'долгое «у»', note:'ضمة + و → тяни «у» 2 счёта', color:'#6a8fd8' },
  { ar:'قُولُوا',      tts:'قُولُوا',      ru:'куулуу',        meaning:'Говорите!',    type:'Вав-мадд و',  typeRu:'долгое «у»', note:'ضمة + و → тяни «у»', color:'#6a8fd8' },
]

// ─── Вычислить слог по главе ──────────────────────────────────────────────
function getSyllable(letter, chapterId) {
  if (chapterId === 'fatha') return letter.syll?.[0] || (letter.ar + 'َ')
  if (chapterId === 'kasra') return letter.syll?.[1] || (letter.ar + 'ِ')
  if (chapterId === 'damma') return letter.syll?.[2] || (letter.ar + 'ُ')
  return letter.ar
}

function getSyllableRu(letter, chapterId) {
  const s = LETTER_SOUND[letter.id] ?? ''
  if (chapterId === 'fatha') return s ? s + 'а' : 'а'
  if (chapterId === 'kasra') return s ? s + 'и' : 'и'
  if (chapterId === 'damma') return s ? s + 'у' : 'у'
  return ''
}

// ─── Главный компонент ────────────────────────────────────────────────────
export default function QuranAlphabet({ onClose }) {
  const { user, profile, setProfile } = useAuth()
  const [chapter, setChapter] = useState(null)   // { id, ... }
  const [item,    setItem]    = useState(null)   // letter or syllable object
  const [ttsActive, setTtsActive] = useState(false)
  const audioRef = useRef(null)

  const [listenedLetters, setListenedLetters] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alphabet_listened') || '[]')) }
    catch { return new Set() }
  })

  const [openedChapters, setOpenedChapters] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alphabet_opened_chapters') || '[]')) }
    catch { return new Set() }
  })

  const [viewedLetters, setViewedLetters] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alphabet_viewed') || '[]')) }
    catch { return new Set() }
  })

  const [nurToast, setNurToast] = useState(null) // { amount, key }

  function markLetterListened(letterId) {
    setListenedLetters(prev => {
      if (prev.has(letterId)) return prev
      const next = new Set(prev)
      next.add(letterId)
      localStorage.setItem('alphabet_listened', JSON.stringify([...next]))
      if (next.size === LETTERS.length) {
        addNur(10, user, profile, setProfile)
      }
      return next
    })
  }

  function handleChapterOpen(ch) {
    if (!openedChapters.has(ch.id)) {
      const next = new Set(openedChapters)
      next.add(ch.id)
      setOpenedChapters(next)
      localStorage.setItem('alphabet_opened_chapters', JSON.stringify([...next]))
    }
    setChapter(ch)
  }

  function showNurToast(amount) {
    const key = Date.now()
    setNurToast({ amount, key })
    setTimeout(() => setNurToast(t => t?.key === key ? null : t), 2200)
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setTtsActive(false)
  }

  useEffect(() => { stopAudio() }, [chapter, item])
  useEffect(() => () => stopAudio(), [])

  function playAudio(url) {
    stopAudio()
    const a = new Audio(url)
    audioRef.current = a
    setTtsActive(true)
    a.onended = () => setTtsActive(false)
    a.onerror = () => setTtsActive(false)
    a.play().catch(() => setTtsActive(false))
  }

  function handleSpeak(text) {
    if (ttsActive) { stopAudio(); return }
    playAudio(getTTSUrl(text))
  }

  function handlePlayUrl(url) {
    if (ttsActive) { stopAudio(); return }
    if (url) playAudio(url)
  }

  function back() {
    if (item) {
      // Начисляем +5 НУР за букву алфавита — только первый раз при закрытии
      if (chapter?.id === 'alphabet' && item.id && !viewedLetters.has(item.id)) {
        setViewedLetters(prev => {
          const next = new Set(prev)
          next.add(item.id)
          localStorage.setItem('alphabet_viewed', JSON.stringify([...next]))
          return next
        })
        addNur(5, user, profile, setProfile)
        showNurToast(5)
      }
      setItem(null)
      return
    }
    if (chapter) { setChapter(null); return }
    onClose()
  }

  // ── Заголовок ──
  let headTitle = 'Арабский алфавит'
  let headSub   = 'По методу Муаллим Сани'
  if (chapter && !item) { headTitle = chapter.title; headSub = chapter.titleAr }
  if (item) {
    headTitle = item.name || item.type || item.nameAr || ''
    headSub   = item.nameAr || ''
  }

  return (
    <div style={s.wrap}>
      <style>{`
        @keyframes nurToastAnim {
          0%   { opacity:0; transform:translateX(-50%) translateY(12px) }
          15%  { opacity:1; transform:translateX(-50%) translateY(0) }
          70%  { opacity:1; transform:translateX(-50%) translateY(0) }
          100% { opacity:0; transform:translateX(-50%) translateY(-10px) }
        }
      `}</style>
      {/* ── Шапка ── */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={back}>‹</button>
        <div style={s.headMid}>
          <div style={s.headTitle}>{headTitle}</div>
          {headSub && <div style={s.headSub}>{headSub}</div>}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ГЛАВНАЯ — список глав
      ══════════════════════════════════════════ */}
      {!chapter && !item && (
        <div style={s.scroll} className="scroll-y">
          <div style={s.intro}>
            <div><b style={{ color:'var(--gold)' }}>Как пользоваться этим разделом?</b></div>
            <div style={{ marginTop: 8 }}>Арабский алфавит учится по шагам. Сначала знакомишься с буквами — каждая из них согласная. Потом учишь харакаты — маленькие значки над и под буквами, которые добавляют гласные «а», «и», «у». Буква + харакат = слог. Слоги складываются в слова.</div>
            <div style={{ marginTop: 8 }}>Иди по главам по порядку: начни с <b style={{ color:'var(--gold)' }}>Алфавита</b>, затем <b style={{ color:'var(--gold)' }}>Фатха → Кясра → Дамма</b>, и далее.</div>
          </div>
          {CHAPTERS.map(ch => {
            const isAlpha = ch.id === 'alphabet'
            const alphaDone = isAlpha ? LETTERS.filter(l => listenedLetters.has(l.id)).length : 0
            const alphaPct  = isAlpha ? Math.round((alphaDone / LETTERS.length) * 100) : 0
            return (
            <button
              key={ch.id}
              style={{ ...s.chapterCard, borderColor: ch.border, background: ch.bg }}
              onClick={() => handleChapterOpen(ch)}
            >
              <div style={{ ...s.chapterNum, borderColor: ch.border, color: ch.color }}>{ch.num}</div>
              <div style={{ ...s.chapterIcon, color: ch.color }} className="arabic">{ch.icon}</div>
              <div style={s.chapterText}>
                <div style={{ ...s.chapterTitle, color: ch.color }}>{ch.title}</div>
                <div style={{ ...s.chapterTitleAr }} className="arabic">{ch.titleAr}</div>
                <div style={s.chapterSub}>{ch.sub}</div>
                {isAlpha && alphaDone > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ ...s.miniTrack }}>
                      <div style={{ ...s.miniFill, width: alphaPct + '%', background: ch.color }} />
                    </div>
                    <div style={{ fontSize: 10, color: ch.color, marginTop: 3, fontWeight: 600 }}>
                      {alphaDone}/{LETTERS.length} букв
                    </div>
                  </div>
                )}
              </div>
              <span style={s.chapterArrow}>›</span>
            </button>
            )
          })}
          <a
            href="https://www.youtube.com/watch?v=mjySnzjBeBY&list=PLK_aw3CMJI1Kbyua963S9xpFEQc8rQDSY"
            target="_blank"
            rel="noopener noreferrer"
            style={s.videoCard}
          >
            <div style={s.videoIcon}>▶</div>
            <div style={s.videoBody}>
              <div style={s.videoTitle}>Видеоуроки по арабскому алфавиту</div>
              <div style={s.videoSub}>Правильное произношение букв — основа чтения Корана. Одна неверно произнесённая буква может изменить смысл слова. Настоятельно рекомендуем пройти плейлист — 39 видеоуроков с разбором каждой буквы и примерами</div>
            </div>
            <span style={s.videoArrow}>›</span>
          </a>
          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ══════════════════════════════════════════
          ГЛАВА: АЛФАВИТ — сетка букв
      ══════════════════════════════════════════ */}
      {chapter?.id === 'alphabet' && !item && (() => {
        const total = LETTERS.length
        const done  = LETTERS.filter(l => listenedLetters.has(l.id)).length
        const pct   = Math.round((done / total) * 100)
        return (
        <div style={s.scroll} className="scroll-y">
          {/* Прогресс */}
          <div style={s.progressWrap}>
            <div style={s.progressTop}>
              <span style={s.progressLabel}>Изучено букв</span>
              <span style={s.progressCount}>{done} / {total}</span>
            </div>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: pct + '%' }} />
            </div>
            {done === total && (
              <div style={s.progressDone}>✓ Алфавит пройден! Отличная работа!</div>
            )}
          </div>
          <div style={s.chapIntro}>
            <div>В арабском языке <b style={{ color:'var(--gold)' }}>28 букв</b> — и все они согласные. Отдельных букв для гласных звуков нет — вместо них используются маленькие значки (харакаты), которые ставятся над или под буквой.</div>
            <div style={{ marginTop: 8 }}>Арабский читается <b style={{ color:'var(--gold)' }}>справа налево</b>.</div>
            <div style={{ marginTop: 8 }}><b style={{ color:'var(--gold)' }}>Что делать:</b> нажми на любую букву — прослушай произношение, посмотри как она выглядит в начале, середине и конце слова, и узнай откуда берётся звук (махрадж).</div>
          </div>
          <div style={s.alphaGrid}>
            {LETTERS.map(l => {
              const mc = MAKHRAJ_COLOR[l.makhraj]
              const heard = listenedLetters.has(l.id)
              return (
                <button key={l.id} style={{ ...s.alphaCell, borderColor: mc + '55', background: mc + '0f', position: 'relative' }}
                  onClick={() => { setItem(l); markLetterListened(l.id) }}>
                  {heard && <div style={s.alphaCellCheck}>✓</div>}
                  <div style={{ ...s.alphaCellDot, background: mc }} />
                  <div style={{ ...s.alphaCellAr, color: mc }} className="arabic">{l.ar}</div>
                  <div style={s.alphaCellName}>{l.name}</div>
                </button>
              )
            })}
          </div>
          {/* Легенда */}
          <div style={s.legend}>
            {MAKHRAJ_GROUPS.map(g => (
              <div key={g.id} style={{ ...s.legendItem, borderColor: g.border, background: g.bg }}>
                <div style={{ ...s.legendDot, background: g.color }} />
                <span style={{ color: g.color, fontSize: 10, fontWeight: 700 }}>{g.name}</span>
              </div>
            ))}
          </div>
          <a
            href="https://www.youtube.com/watch?v=mjySnzjBeBY&list=PLK_aw3CMJI1Kbyua963S9xpFEQc8rQDSY"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.videoCard, margin: '12px 0 0' }}
          >
            <div style={s.videoIcon}>▶</div>
            <div style={s.videoBody}>
              <div style={s.videoTitle}>Видеоуроки по арабскому алфавиту</div>
              <div style={s.videoSub}>Правильное произношение букв — основа чтения Корана. Одна неверно произнесённая буква может изменить смысл слова. Настоятельно рекомендуем пройти плейлист — 39 видеоуроков с разбором каждой буквы и примерами</div>
            </div>
            <span style={s.videoArrow}>›</span>
          </a>
          <div style={{ height: 24 }} />
        </div>
        )
      })()}

      {/* ── Детальный вид: буква ── */}
      {item && item.makhraj && (() => {
        const l = item
        const mc = MAKHRAJ_COLOR[l.makhraj]
        const g  = MAKHRAJ_GROUPS.find(x => x.id === l.makhraj)
        return (
          <>
            <button style={{ ...s.audioBar, borderColor: mc + '55', color: mc, background: ttsActive ? mc + '18' : 'rgba(255,255,255,.04)' }}
              onClick={() => handlePlayUrl(l.audio)}>
              <span style={s.abIcon}>{ttsActive ? '⏹' : '▶'}</span>
              <span style={s.abLabel}>{ttsActive ? 'Остановить' : 'Произношение: ' + l.name}</span>
              <span style={s.abSub}>Мишари Рашид · Нажми чтобы услышать</span>
            </button>
            <div style={s.scroll} className="scroll-y">
              {/* Большая буква */}
              <div style={{ ...s.bigCard, borderColor: mc + '45' }}>
                <div style={{ ...s.bigAr, color: mc }} className="arabic">{l.ar}</div>
                <div style={{ ...s.bigArName, color: mc }} className="arabic">{l.nameAr}</div>
                <div style={s.bigRuName}>{l.name}</div>
                {g && <div style={{ ...s.badge, borderColor: g.border, background: g.bg, color: g.color }}>{g.nameAr} · {g.name}</div>}
              </div>

              {/* Слоги */}
              <div style={s.sec}>
                <div style={s.secTitle}>Слоги с харакатами</div>
                <div style={{ ...s.infoBox, borderColor: mc + '25', background: mc + '07', marginBottom: 10 }}>
                  <div style={s.infoText}>
                    <div>Каждая буква читается по-разному в зависимости от харакат — значка над или под ней:</div>
                    <div style={{ marginTop: 6 }}><b style={{ color: mc }}>Фатха</b> — чёрточка над буквой → добавляет «а»</div>
                    <div><b style={{ color: mc }}>Кясра</b> — чёрточка под буквой → добавляет «и»</div>
                    <div><b style={{ color: mc }}>Дамма</b> — завиток над буквой → добавляет «у»</div>
                    <div style={{ marginTop: 6 }}>Прослушай букву вверху, затем повторяй каждый слог вслух по несколько раз.</div>
                  </div>
                </div>
                <div style={s.syllRow}>
                  {(l.syll || []).map((sy, i) => {
                    const vowel = ['фатха «а»','кясра «и»','дамма «у»'][i]
                    const ru = (LETTER_SOUND[l.id] ?? '') + ['а','и','у'][i]
                    return (
                      <div key={i} style={{ ...s.syllCell, borderColor: mc + '45', background: mc + '0f' }}>
                        <div style={{ ...s.syllAr, color: mc }} className="arabic">{sy}</div>
                        <div style={s.syllVowel}>{vowel}</div>
                        <div style={{ ...s.syllPlay, color: mc }}>{ru}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Формы */}
              <div style={s.sec}>
                <div style={s.secTitle}>Формы в слове</div>
                <div style={s.formsRow}>
                  {['Отдельная','В начале','В середине','В конце'].map((lbl, i) => (
                    <div key={i} style={{ ...s.formCell, borderColor: mc + '35' }}>
                      <div style={{ ...s.formAr, color: mc }} className="arabic">{l.forms?.[i] || l.ar}</div>
                      <div style={s.formLbl}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Махрадж */}
              <div style={s.sec}>
                <div style={s.secTitle}>Махрадж — откуда берётся звук</div>
                <div style={{ ...s.infoBox, borderColor: mc + '35', background: mc + '0a' }}>
                  <div style={s.infoText}>{l.pos}</div>
                </div>
              </div>

              {/* Пример из Корана */}
              <div style={s.sec}>
                <div style={s.secTitle}>Пример из Корана</div>
                <button style={{ ...s.exCard, borderColor: mc + '35' }}
                  onClick={() => handlePlayUrl(l.audio)}>
                  <div style={{ ...s.exAr, color: mc }} className="arabic">{l.ex?.ar}</div>
                  <div style={s.exTr}>{l.ex?.tr}</div>
                  <div style={s.exRu}>{l.ex?.ru}</div>
                  <div style={{ ...s.exPlay, color: mc }}>▶ прослушать</div>
                </button>
              </div>

              <div style={{ height: 24 }} />
            </div>
          </>
        )
      })()}

      {/* ══════════════════════════════════════════
          ГЛАВЫ: ФАТХА / КЯСРА / ДАММА — сетка слогов
      ══════════════════════════════════════════ */}
      {chapter && ['fatha','kasra','damma'].includes(chapter.id) && !item && (
        <div style={s.scroll} className="scroll-y">
          {/* Объяснение харакат */}
          {(() => {
            const h = HARAKAT.find(x => x.id === chapter.id)
            if (!h) return null
            return (
              <div style={{ ...s.harakatHero, borderColor: chapter.border, background: chapter.bg }}>
                <div style={{ ...s.harakatHeroSymbol, color: chapter.color }} className="arabic">{h.demo}</div>
                <div style={s.harakatHeroBody}>
                  <div style={{ ...s.harakatHeroName, color: chapter.color }}>{h.name} — {h.sound}</div>
                  <div style={s.harakatHeroDesc}>{h.desc}</div>
                </div>
              </div>
            )
          })()}

          <div style={{ ...s.infoBox, borderColor: chapter.border, background: chapter.bg, margin: '0 0 12px' }}>
            <div style={s.infoText}>
              <div><b style={{ color: chapter.color }}>Как читать:</b></div>
              <div style={{ marginTop: 4 }}>1. Выбери любую букву в сетке ниже</div>
              <div>2. Видишь слог = буква + {chapter.id === 'fatha' ? 'фатха (добавляет «а»)' : chapter.id === 'kasra' ? 'кясра (добавляет «и»)' : 'дамма (добавляет «у»)'}</div>
              <div>3. Нажми на слог — получи объяснение и пример из Корана</div>
              <div>4. Повторяй слог вслух несколько раз</div>
            </div>
          </div>
          <div style={s.secTitle}>Все буквы с {chapter.id === 'fatha' ? 'фатхой' : chapter.id === 'kasra' ? 'кясрой' : 'даммой'}</div>
          <div style={s.syllGrid}>
            {LETTERS.map(l => {
              const sy   = getSyllable(l, chapter.id)
              const syRu = getSyllableRu(l, chapter.id)
              return (
                <button key={l.id}
                  style={{ ...s.syllGridCell, borderColor: chapter.color + '45', background: chapter.color + '0d' }}
                  onClick={() => setItem({ ...l, _chapterId: chapter.id, _syllable: sy, _syllableRu: syRu })}>
                  <div style={{ ...s.syllGridAr, color: chapter.color }} className="arabic">{sy}</div>
                  <div style={s.syllGridRu}>{syRu}</div>
                </button>
              )
            })}
          </div>
          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ── Детальный вид: слог (фатха/кясра/дамма) ── */}
      {item && item._chapterId && (() => {
        const ch = CHAPTERS.find(x => x.id === item._chapterId)
        const h  = HARAKAT.find(x => x.id === item._chapterId)
        const sy = item._syllable
        const ru = item._syllableRu
        return (
          <>
            <button style={{ ...s.audioBar, borderColor: ch.color + '55', color: ch.color, background: ttsActive ? ch.color + '18' : 'rgba(255,255,255,.04)' }}
              onClick={() => handleSpeak(sy)}>
              <span style={s.abIcon}>{ttsActive ? '⏹' : '▶'}</span>
              <span style={s.abLabel}>{ttsActive ? 'Остановить' : `Произнести «${ru}»`}</span>
              <span style={s.abSub}>Нажми и повторяй вслух</span>
            </button>
            <div style={s.scroll} className="scroll-y">
              <div style={{ ...s.bigCard, borderColor: ch.color + '45' }}>
                <div style={{ ...s.bigAr, color: ch.color, fontSize: 100 }} className="arabic">{sy}</div>
                <div style={{ ...s.syllRuBig, color: ch.color }}>«{ru}»</div>
                <div style={s.bigRuName}>{item.name} + {h?.name}</div>
              </div>

              <div style={s.sec}>
                <div style={s.secTitle}>Правило произношения</div>
                <div style={{ ...s.infoBox, borderColor: ch.color + '35', background: ch.color + '0a' }}>
                  <div style={s.infoText}>
                    {(() => {
                      const vowel = ['а','и','у'][['fatha','kasra','damma'].indexOf(item._chapterId)]
                      const pos   = item._chapterId === 'kasra' ? 'под' : 'над'
                      return (
                        <>
                          <div><b style={{ color: ch.color }}>Шаг 1.</b> Смотришь на букву — это «{item.name}».</div>
                          <div style={{ marginTop: 4 }}><b style={{ color: ch.color }}>Шаг 2.</b> Видишь {h?.name} — значок {pos} буквой. Он добавляет звук <b style={{ color: ch.color }}>«{vowel}»</b>.</div>
                          <div style={{ marginTop: 4 }}><b style={{ color: ch.color }}>Шаг 3.</b> Соединяешь: «{item.name}» + «{vowel}» = <b style={{ color: ch.color }}>«{ru}»</b>.</div>
                          <div style={{ marginTop: 8 }}>{h?.desc}</div>
                          <div style={{ marginTop: 8 }}>Нажми ▶ выше и повторяй вслух: «{ru}» — «{ru}» — «{ru}»</div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div style={s.sec}>
                <div style={s.secTitle}>Пример из Корана</div>
                <button style={{ ...s.exCard, borderColor: ch.color + '35' }}
                  onClick={() => handlePlayUrl(item.audio)}>
                  <div style={{ ...s.exAr, color: ch.color }} className="arabic">{item.ex?.ar}</div>
                  <div style={s.exTr}>{item.ex?.tr}</div>
                  <div style={s.exRu}>{item.ex?.ru}</div>
                  <div style={{ ...s.exPlay, color: ch.color }}>▶ прослушать</div>
                </button>
              </div>

              <div style={s.sec}>
                <div style={s.secTitle}>Махрадж этой буквы</div>
                <div style={{ ...s.infoBox, borderColor: MAKHRAJ_COLOR[item.makhraj] + '35', background: MAKHRAJ_COLOR[item.makhraj] + '0a' }}>
                  <div style={s.infoText}>{item.pos}</div>
                </div>
              </div>

              <div style={{ height: 24 }} />
            </div>
          </>
        )
      })()}

      {/* ══════════════════════════════════════════
          ГЛАВЫ: СУКУН / ТАНВИН / ШАДДА / МАДД
      ══════════════════════════════════════════ */}
      {chapter && ['sukun','tanwin','shadda','madd'].includes(chapter.id) && !item && (
        <div style={s.scroll} className="scroll-y">
          {chapter.id === 'sukun' && <SpeicalChapter
            ch={chapter}
            intro={`Сукун (ْ) — маленький кружок над буквой. Он говорит: «здесь нет гласной».\n\nЕсли ты уже знаешь как читать «ба», «та», «са» — теперь представь ту же букву, но без гласной на конце: просто «б», «т», «с». Именно это и делает сукун.\n\nКак читать: произноси букву коротко и закрыто, не тяни — сразу переходи к следующей букве.\n\nПример: قُلْ = «кул» + «ь» → «куль». Лям в конце с суkуном закрывает слог.`}
            items={SUKUN_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
          />}
          {chapter.id === 'tanwin' && <SpeicalChapter
            ch={chapter}
            intro={`Танвин — это когда харакат стоит дважды в конце слова. Это добавляет звук «н» к гласной.\n\nТри вида танвина:\n• Две фатхи (ً) → произноси «ан»\n• Две кясры (ٍ) → произноси «ин»\n• Две даммы (ٌ) → произноси «ун»\n\nТанвин встречается у слов без артикля اَلـ. Это знак неопределённости — как «какой-то», «один».\n\nПример: أَحَدٌ = «ахадун» (одна дамма → «у», вторая → «н»).`}
            items={TANWIN_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
            showType
          />}
          {chapter.id === 'shadda' && <SpeicalChapter
            ch={chapter}
            intro={`Шадда (ّ) — значок в форме маленькой «ш» над буквой. Он означает: произнеси эту букву дважды.\n\nКак читать: задержись на звуке чуть дольше обычного — как будто перед буквой стоит та же самая буква с суkуном.\n\nПример:\nرَبَّنَا = «раб» (ба с суkуном) + «ба» (с фатхой) + «на» → читай: «раббана»\n\nГлавное правило: видишь шадду — удвой согласную, не пропускай.`}
            items={SHADDA_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
            showNote
          />}
          {chapter.id === 'madd' && <SpeicalChapter
            ch={chapter}
            intro={`Мадд (مَدّ) — это удлинение гласного звука. Когда видишь мадд — тяни гласную примерно 1 секунду (2 счёта).\n\nТри вида мадда:\n• Фатха + ا → тяни «а-а» (الرَّحْمَٰنِ — «рахмааани»)\n• Дамма + و → тяни «у-у» (نُوحٍ — «нуухин»)\n• Кясра + ي → тяни «и-и» (الرَّحِيمِ — «рахиими»)\n\nКак узнать мадд: после харакат сразу стоит буква ا، و или ي — это сигнал, тяни!\n\nГлавное: не тяни слишком долго и не обрывай — ровно 2 счёта.`}
            items={MADD_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
            showType
            showNote
          />}
          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ══════════════════════════════════════════
          ГЛАВА: МАХРАДЖ
      ══════════════════════════════════════════ */}
      {chapter?.id === 'makhraj' && !item && (
        <div style={s.scroll} className="scroll-y">
          <div style={s.chapIntro}>
            <b style={{ color:'var(--gold)' }}>Махрадж</b> (مَخْرَج) — место, откуда берётся звук. Всего 5 основных групп. Знание махраджа помогает правильно произносить буквы при чтении Корана.
          </div>
          {MAKHRAJ_GROUPS.map(g => (
            <div key={g.id} style={{ ...s.mGroup, borderColor: g.border, background: g.bg }}>
              <div style={s.mGroupHead}>
                <div style={{ ...s.mGroupDot, background: g.color }} />
                <div>
                  <div style={{ ...s.mGroupName, color: g.color }}>{g.nameAr} — {g.name}</div>
                  <div style={s.mGroupDesc}>{g.desc}</div>
                </div>
              </div>
              <div style={s.mGroupDetail}>{g.detail}</div>
              <div style={s.mGroupLetters}>
                {LETTERS.filter(l => l.makhraj === g.id).map(l => (
                  <button key={l.id} style={{ ...s.mGroupLetter, borderColor: g.color + '50', color: g.color }}
                    onClick={() => { setItem(l) }} className="arabic">{l.ar}</button>
                ))}
              </div>
            </div>
          ))}
          <div style={s.mNote}>
            <div style={s.mNoteTitle}>📖 Тяжёлые буквы (مُفَخَّم)</div>
            <div style={s.mNoteText}>Буквы ص ض ط ظ غ خ ق произносятся с поднятой задней частью языка — звук становится «тёмным» и глубоким. Остальные буквы «лёгкие» (مُرَقَّق).</div>
          </div>
          <div style={{ height: 24 }} />
        </div>
      )}

      {/* НУР тост */}
      {nurToast && (
        <div key={nurToast.key} style={nurToastStyle}>
          ◉ +{nurToast.amount} НУР
        </div>
      )}
    </div>
  )
}

const nurToastStyle = {
  position: 'fixed', bottom: 90, left: '50%',
  transform: 'translateX(-50%)',
  background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
  color: '#fff', fontWeight: 800, fontSize: 15,
  padding: '10px 24px', borderRadius: 40,
  zIndex: 500, pointerEvents: 'none',
  fontFamily: 'var(--font-ui)',
  boxShadow: '0 4px 24px rgba(201,168,76,.5)',
  animation: 'nurToastAnim 2.2s ease-out forwards',
}

// ── Вспомогательный компонент для специальных глав ──────────────────────
function SpeicalChapter({ ch, intro, items, onSpeak, ttsActive, showType, showNote }) {
  return (
    <>
      <div style={{ ...s.chapIntro, borderColor: ch.border, background: ch.bg }}>
        <div style={{ ...s.chapIntroAr, color: ch.color }} className="arabic">{ch.icon}</div>
        <div style={s.introText}>{intro}</div>
      </div>
      <div style={s.secTitle}>Примеры</div>
      {items.map((item, i) => (
        <button key={i}
          style={{ ...s.exampleRow, borderColor: (item.color || ch.color) + '45', background: (item.color || ch.color) + '0a' }}
          onClick={() => onSpeak(item.tts, 0.7)}>
          <div style={{ ...s.exRowAr, color: item.color || ch.color }} className="arabic">{item.ar}</div>
          <div style={s.exRowBody}>
            <div style={s.exRowRu}>«{item.ru}» — {item.meaning}</div>
            {showType && <div style={{ ...s.exRowType, color: item.color || ch.color }}>{item.typeRu}</div>}
            {showNote && item.note && <div style={s.exRowNote}>{item.note}</div>}
            {item.rule && <div style={s.exRowNote}>{item.rule}</div>}
          </div>
          <span style={{ ...s.exRowPlay, color: item.color || ch.color }}>▶</span>
        </button>
      ))}
    </>
  )
}

// ─── Стили ────────────────────────────────────────────────────────────────
const s = {
  wrap: {
    position:'fixed', inset:0, zIndex:95,
    background:'var(--bg-deep)', display:'flex',
    flexDirection:'column', fontFamily:'var(--font-ui)',
  },

  head: {
    flexShrink:0, display:'flex', alignItems:'center', gap:10,
    padding:'16px 16px 14px', borderBottom:'1px solid var(--border)',
  },
  backBtn: {
    width:36, height:36, borderRadius:10, flexShrink:0,
    background:'rgba(255,255,255,.07)', border:'1px solid var(--border)',
    color:'var(--text)', fontSize:22, cursor:'pointer', outline:'none',
    fontFamily:'var(--font-ui)', display:'flex', alignItems:'center', justifyContent:'center',
  },
  headMid:  { flex:1 },
  headTitle:{ fontSize:17, fontWeight:700, color:'var(--text)' },
  headSub:  { fontSize:12, color:'var(--text-muted)', marginTop:2 },

  scroll: { flex:1, overflowY:'auto', padding:'14px 16px 0' },

  intro: {
    fontSize:13, color:'var(--text-muted)', lineHeight:1.7,
    background:'rgba(201,168,76,.06)', border:'1px solid rgba(201,168,76,.18)',
    borderRadius:14, padding:'12px 14px', marginBottom:14,
  },
  chapIntro: {
    fontSize:13, color:'var(--text-muted)', lineHeight:1.7,
    border:'1px solid', borderRadius:14, padding:'12px 14px', marginBottom:14,
    display:'flex', gap:10, alignItems:'flex-start',
  },
  chapIntroAr: {
    fontSize:30, fontFamily:"'Scheherazade New',serif",
    flexShrink:0, lineHeight:1.3, direction:'rtl',
  },
  introText: { flex:1, whiteSpace: 'pre-line', lineHeight: 1.6 },

  // Главная — карточки глав
  chapterCard: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    border:'1.5px solid', borderRadius:18, padding:'13px 14px',
    cursor:'pointer', outline:'none', textAlign:'left', marginBottom:8,
  },
  chapterNum: {
    width:26, height:26, borderRadius:8, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:12, fontWeight:800, border:'1.5px solid',
  },
  chapterIcon: {
    width:44, height:44, flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:26, fontFamily:"'Scheherazade New',serif", direction:'rtl',
  },
  chapterText:   { flex:1, display:'flex', flexDirection:'column', gap:2 },
  chapterTitle:  { fontSize:15, fontWeight:700 },
  chapterTitleAr:{ fontSize:13, fontFamily:"'Scheherazade New',serif", direction:'rtl', color:'var(--text-muted)' },
  chapterSub:    { fontSize:11, color:'var(--text-muted)', lineHeight:1.4 },
  chapterArrow:  { fontSize:22, color:'rgba(255,255,255,.2)', flexShrink:0 },
  miniTrack: { height:3, borderRadius:2, background:'rgba(255,255,255,.08)' },
  miniFill:  { height:3, borderRadius:2, transition:'width .3s ease' },

  videoCard: {
    display:'flex', alignItems:'center', gap:14,
    borderRadius:16, border:'1.5px solid rgba(255,80,80,.35)',
    background:'rgba(255,60,60,.08)', padding:'14px 16px',
    textDecoration:'none', cursor:'pointer',
  },
  videoIcon: {
    width:44, height:44, borderRadius:12, flexShrink:0,
    background:'linear-gradient(135deg,#c0392b,#e74c3c)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:18, color:'#fff',
    boxShadow:'0 0 16px rgba(231,76,60,.5)',
  },
  videoBody:  { flex:1 },
  videoTitle: { fontSize:14, fontWeight:700, color:'#ff6b6b', marginBottom:3 },
  videoSub:   { fontSize:11, color:'var(--text-muted)', lineHeight:1.4 },
  videoArrow: { fontSize:22, color:'rgba(255,255,255,.2)', flexShrink:0 },

  // Прогресс алфавита
  progressWrap: {
    borderRadius:14, border:'1px solid rgba(201,168,76,.3)',
    background:'rgba(201,168,76,.06)', padding:'12px 14px', marginBottom:12,
  },
  progressTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  progressLabel: { fontSize:12, fontWeight:600, color:'var(--text-muted)' },
  progressCount: { fontSize:13, fontWeight:700, color:'var(--gold)' },
  progressTrack: {
    height:6, borderRadius:4, background:'rgba(255,255,255,.08)',
  },
  progressFill: {
    height:6, borderRadius:4,
    background:'linear-gradient(90deg,#9a6a10,#c9a84c)',
    transition:'width .4s ease',
  },
  progressDone: {
    marginTop:8, fontSize:12, fontWeight:600, color:'var(--gold)', textAlign:'center',
  },

  // Алфавит — сетка
  alphaGrid: {
    display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14,
  },
  alphaCell: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
    border:'1.5px solid', borderRadius:14, padding:'10px 6px',
    cursor:'pointer', outline:'none', position:'relative',
  },
  alphaCellDot: {
    position:'absolute', top:5, right:5,
    width:6, height:6, borderRadius:'50%',
  },
  alphaCellCheck: {
    position:'absolute', top:4, left:5,
    fontSize:9, fontWeight:800, color:'var(--gold)',
  },
  alphaCellAr: {
    fontSize:28, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.3, direction:'rtl',
  },
  alphaCellName: { fontSize:9, color:'var(--text-muted)', fontWeight:600, textAlign:'center' },

  legend: { display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 },
  legendItem: {
    display:'flex', alignItems:'center', gap:4,
    border:'1px solid', borderRadius:20, padding:'3px 8px',
  },
  legendDot: { width:6, height:6, borderRadius:'50%', flexShrink:0 },

  // Аудио-бар
  audioBar: {
    flexShrink:0, display:'flex', alignItems:'center', gap:10,
    padding:'10px 16px', border:'0 solid', borderBottomWidth:1,
    cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)',
    transition:'background .2s',
  },
  abIcon:  { fontSize:18, flexShrink:0 },
  abLabel: { fontSize:14, fontWeight:700, flex:1, textAlign:'left' },
  abSub:   { fontSize:11, color:'var(--text-muted)', flexShrink:0 },

  // Большая буква / слог
  bigCard: {
    border:'1.5px solid', borderRadius:20, padding:'24px 16px',
    background:'var(--bg-card)', display:'flex', flexDirection:'column',
    alignItems:'center', gap:6, marginBottom:16,
  },
  bigAr: {
    fontSize:90, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.1, direction:'rtl',
  },
  bigArName: {
    fontSize:24, fontFamily:"'Scheherazade New',serif", direction:'rtl',
  },
  bigRuName: { fontSize:15, fontWeight:700, color:'var(--text)' },
  badge: {
    marginTop:4, padding:'5px 14px', borderRadius:20,
    border:'1px solid', fontSize:12, fontWeight:700,
  },
  syllRuBig: { fontSize:32, fontWeight:800 },

  // Слоги
  syllRow: { display:'flex', gap:8 },
  syllCell: {
    flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
    border:'1.5px solid', borderRadius:14, padding:'12px 6px',
    cursor:'pointer', outline:'none',
  },
  syllAr: {
    fontSize:36, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.3, direction:'rtl',
  },
  syllVowel: { fontSize:10, color:'var(--text-muted)', textAlign:'center' },
  syllPlay:  { fontSize:12, fontWeight:700, marginTop:2 },

  // Сетка слогов (фатха/кясра/дамма глава)
  syllGrid: {
    display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14,
  },
  syllGridCell: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:4,
    border:'1.5px solid', borderRadius:14, padding:'12px 6px',
    cursor:'pointer', outline:'none',
  },
  syllGridAr: {
    fontSize:30, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.3, direction:'rtl',
  },
  syllGridRu: { fontSize:12, color:'var(--text-muted)', fontWeight:600 },

  // Харакат описание
  harakatHero: {
    display:'flex', alignItems:'center', gap:12,
    border:'1.5px solid', borderRadius:16, padding:'14px',
    marginBottom:14,
  },
  harakatHeroSymbol: {
    fontSize:48, fontFamily:"'Scheherazade New',serif",
    direction:'rtl', flexShrink:0,
  },
  harakatHeroBody: { flex:1 },
  harakatHeroName: { fontSize:15, fontWeight:700, marginBottom:4 },
  harakatHeroDesc: { fontSize:12, color:'var(--text-muted)', lineHeight:1.6 },

  // Секции
  sec:      { marginBottom:16 },
  secTitle: {
    fontSize:11, fontWeight:700, color:'var(--text-muted)',
    textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8,
  },

  // Формы буквы
  formsRow: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 },
  formCell: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:3,
    border:'1px solid', borderRadius:12, padding:'8px 4px',
    background:'rgba(255,255,255,.03)',
  },
  formAr: {
    fontSize:26, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.3, direction:'rtl',
  },
  formLbl: { fontSize:8, color:'var(--text-muted)', textAlign:'center' },

  // Инфо-бокс
  infoBox: {
    border:'1px solid', borderRadius:14, padding:'13px',
  },
  infoText: {
    fontSize:13, color:'var(--text-muted)', lineHeight:1.7,
    whiteSpace:'pre-line',
  },

  // Пример из Корана
  exCard: {
    width:'100%', border:'1px solid', borderRadius:14,
    padding:'14px 16px', background:'var(--bg-card)',
    display:'flex', flexDirection:'column', gap:4, alignItems:'center',
    textAlign:'center', cursor:'pointer', outline:'none',
    fontFamily:'var(--font-ui)',
  },
  exAr: {
    fontSize:26, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.5, direction:'rtl',
  },
  exTr:  { fontSize:14, fontWeight:600, color:'var(--text)' },
  exRu:  { fontSize:12, color:'var(--text-muted)' },
  exPlay:{ fontSize:12, fontWeight:700, marginTop:4 },

  // Специальные главы — строка примера
  exampleRow: {
    width:'100%', display:'flex', alignItems:'center', gap:12,
    border:'1.5px solid', borderRadius:16, padding:'12px 14px',
    cursor:'pointer', outline:'none', textAlign:'left', marginBottom:8,
    fontFamily:'var(--font-ui)',
  },
  exRowAr: {
    fontSize:30, fontFamily:"'Scheherazade New',serif",
    direction:'rtl', flexShrink:0, width:80, textAlign:'center',
  },
  exRowBody: { flex:1, display:'flex', flexDirection:'column', gap:3 },
  exRowRu:   { fontSize:14, fontWeight:600, color:'var(--text)' },
  exRowType: { fontSize:11, fontWeight:700 },
  exRowNote: { fontSize:11, color:'var(--text-muted)' },
  exRowPlay: { fontSize:20, flexShrink:0 },

  // Махрадж вкладка
  mGroup: {
    border:'1.5px solid', borderRadius:18, padding:'16px', marginBottom:12,
  },
  mGroupHead: { display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 },
  mGroupDot:  { width:10, height:10, borderRadius:'50%', flexShrink:0, marginTop:4 },
  mGroupName: { fontSize:15, fontWeight:700 },
  mGroupDesc: { fontSize:11, color:'var(--text-muted)', marginTop:2 },
  mGroupDetail: {
    fontSize:13, color:'var(--text-muted)', lineHeight:1.65, marginBottom:12,
  },
  mGroupLetters: { display:'flex', flexWrap:'wrap', gap:8 },
  mGroupLetter: {
    width:44, height:44, borderRadius:12,
    border:'1.5px solid', background:'rgba(255,255,255,.04)',
    fontSize:22, fontFamily:"'Scheherazade New',serif",
    display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', outline:'none', direction:'rtl',
  },
  mNote: {
    border:'1px solid rgba(201,168,76,.25)', borderRadius:16,
    background:'rgba(201,168,76,.05)', padding:'14px 16px', marginBottom:8,
  },
  mNoteTitle: { fontSize:13, fontWeight:700, color:'var(--gold)', marginBottom:6 },
  mNoteText:  { fontSize:13, color:'var(--text-muted)', lineHeight:1.65 },
}

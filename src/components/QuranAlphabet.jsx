import { useState, useRef, useEffect } from 'react'
import { LETTERS, HARAKAT, MAKHRAJ_GROUPS, LETTER_SOUND } from '../data/arabic-letters'
import { useAuth } from '../hooks/useAuth'
import { useBackHandler } from '../hooks/useBackHandler'
import { addNur } from '../utils/nur'
import { supabase } from '../supabase/client'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import DawnLandscape from './DawnLandscape'
import QandAQuiz from './QandAQuiz'

// ─── Audio ─────────────────────────────────────────────────────────────────
function getTTSUrl(text) {
  // Repeat short text so TTS has enough context
  const q = text.length < 4 ? `${text} ${text} ${text}` : text
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=ar&client=tw-ob`
}

// ─── Видео произношения буквы ───────────────────────────────────────────────
const LETTER_VIDEOS_BUCKET = 'letter-videos'

// ─── Локальный кэш видео на устройстве ──────────────────────────────────────
// Подписанная ссылка каждый раз новая (с токеном), поэтому обычный HTTP-кэш
// её не узнаёт и качает видео заново при каждом открытии. Тут сохраняем сам
// файл на диск телефона один раз — дальше видео играет без интернета.
const VIDEO_CACHE_DIR = 'letter-videos-cache'

async function getCachedVideoPath(fileName) {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { uri } = await Filesystem.getUri({ path: `${VIDEO_CACHE_DIR}/${fileName}`, directory: Directory.Cache })
    // stat бросает исключение если файла нет — getUri его не бросает, поэтому проверяем отдельно
    await Filesystem.stat({ path: `${VIDEO_CACHE_DIR}/${fileName}`, directory: Directory.Cache })
    return Capacitor.convertFileSrc(uri)
  } catch {
    return null
  }
}

async function cacheVideoInBackground(fileName, remoteUrl) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const res = await fetch(remoteUrl)
    const blob = await res.blob()
    await Filesystem.writeFile({
      path: `${VIDEO_CACHE_DIR}/${fileName}`,
      data: blob,
      directory: Directory.Cache,
      recursive: true,
    })
  } catch {
    // Не удалось закэшировать — не критично, просто скачается заново в следующий раз
  }
}

async function resolveVideoUrl(storagePath, fileName) {
  const cached = await getCachedVideoPath(fileName)
  if (cached) return cached

  const { data } = await supabase.storage.from(LETTER_VIDEOS_BUCKET).createSignedUrl(storagePath, 3600)
  const remoteUrl = data?.signedUrl ?? null
  if (remoteUrl) cacheVideoInBackground(fileName, remoteUrl) // не ждём — играем сразу по сети, кэшируем параллельно
  return remoteUrl
}

async function getLetterVideoUrl(letterId) {
  return resolveVideoUrl(`vid/${letterId}.mp4`, `${letterId}.mp4`)
}
async function getExtraVideoUrl(name) {
  return resolveVideoUrl(`vid/extra/${name}.mp4`, `extra_${name}.mp4`)
}

// ─── Видео сравнения похожих букв — на каких буквах показывать ─────────────
const SIMILAR_LETTER_GROUPS = [
  { video: 'extra_sin-tha-sad-compare',  title: 'Разница: Син, Са, Сод',        letters: ['sin', 'tha', 'sad'] },
  { video: 'extra_ha-kha-ha2-compare',   title: 'Разница: ha, ха, хо',          letters: ['ha1', 'kha', 'ha2'] },
  { video: 'extra_fa-qaf-kaf-compare',   title: 'Разница: Фа, Каф, Кяф',        letters: ['fa', 'qaf', 'kaf'] },
  { video: 'extra_dhal-zay-dha-compare', title: 'Разница: Заль, Зей, Зо',       letters: ['dhal', 'zay', 'dha'] },
  { video: 'extra_multi-letter-compare', title: 'Разница и сходство нескольких букв', letters: ['ba', 'zay', 'ya', 'mim', 'nun', 'ra', 'ta'] },
]
function getSimilarGroupsForLetter(letterId) {
  return SIMILAR_LETTER_GROUPS.filter(g => g.letters.includes(letterId))
}

// ─── Практика и дополнительно — общие видео не привязанные к одной букве ───
const PRACTICE_EXTRAS = [
  { video: 'extra_motivation',        icon: '🔥', title: 'Мотивация к изучению букв' },
  { video: 'extra_practice-alif-tha', icon: '📝', title: 'Практика: буквы от Алиф до Са' },
]

// Видео про харакаты — показываются отдельной карточкой сразу под группой "Харакаты"
const HARAKAT_VIDEOS = [
  { video: 'extra_harakat-intro',    icon: 'ـَ', title: 'Харакаты и огласовки' },
  { video: 'extra_harakat-practice', icon: '✅', title: 'Закрепление темы харакатов' },
]

// ─── Данные глав ──────────────────────────────────────────────────────────
const CHAPTERS = [
  { id:'alphabet', num:1, icon:'ا',  title:'Алфавит',  titleAr:'الحُرُوف',    sub:'28 арабских букв', color:'#c9a84c', bg:'rgba(201,168,76,.1)',  border:'rgba(201,168,76,.3)' },
  { id:'makhraj',  num:2, icon:'◉',  title:'Махрадж',  titleAr:'المَخْرَج',   sub:'Откуда берётся звук каждой буквы', color:'#52b788', bg:'rgba(82,183,136,.1)', border:'rgba(82,183,136,.3)' },
  { id:'fatha',    num:3, icon:'بَ', title:'Фатха',    titleAr:'الفَتْحَة',   sub:'Краткое «а» — بَ تَ ثَ...', color:'#c9a84c', bg:'rgba(201,168,76,.1)',  border:'rgba(201,168,76,.3)' },
  { id:'kasra',    num:4, icon:'بِ', title:'Кясра',    titleAr:'الكَسْرَة',   sub:'Краткое «и» — بِ تِ ثِ...', color:'#52b788', bg:'rgba(82,183,136,.1)',  border:'rgba(82,183,136,.3)' },
  { id:'damma',    num:5, icon:'بُ', title:'Дамма',    titleAr:'الضَّمَّة',   sub:'Краткое «у» — بُ تُ ثُ...', color:'#6a8fd8', bg:'rgba(106,143,216,.1)', border:'rgba(106,143,216,.3)' },
  { id:'sukun',    num:6, icon:'بْ', title:'Сукун',    titleAr:'السُّكُون',   sub:'Нет гласной — закрытый слог', color:'#e88a5a', bg:'rgba(232,138,90,.1)',  border:'rgba(232,138,90,.3)' },
  { id:'other-rules', num:7, icon:'ـٌ', title:'Другие правила', titleAr:'قَواعِد أُخرى', sub:'Танвин · Шадда · Мадд', color:'#a07de8', bg:'rgba(160,125,232,.1)', border:'rgba(160,125,232,.3)' },
]

const MAKHRAJ_COLOR = {
  jawf:'#6a8fd8', halq:'#e88a5a', lisan:'#52b788', shafatan:'#a07de8', khayshum:'#c9a84c',
}

// Вспомогательные данные для специальных глав
const SUKUN_EXAMPLES = [
  { ar:'قُلْ',   tts:'قُلْ',   ru:'куль',  meaning:'Скажи!',         rule:'Лям с сукуном: «ль»' },
  { ar:'لَمْ',   tts:'لَمْ',   ru:'лям',   meaning:'Не (отрицание)', rule:'Мим с сукуном: «м»' },
  { ar:'مِنْ',   tts:'مِنْ',   ru:'мин',   meaning:'Из / от',        rule:'Нун с сукуном: «н»' },
  { ar:'هَلْ',   tts:'هَلْ',   ru:'халь',  meaning:'Разве? / Ли?',   rule:'Лям с сукуном: «ль»' },
  { ar:'بَلْ',   tts:'بَلْ',   ru:'баль',  meaning:'Но / Напротив',  rule:'Лям с сукуном: «ль»' },
  { ar:'عَنْ',   tts:'عَنْ',   ru:'ан',    meaning:'О / про',        rule:'Нун с сукуном: «н»' },
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
  const [videoError, setVideoError] = useState(null) // id буквы, для которой видео не загрузилось
  const [videoWatched, setVideoWatched] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alphabet_video_watched') || '[]')) }
    catch { return new Set() }
  })
  const [videoExpanded, setVideoExpanded] = useState(false)
  const [videoSrc, setVideoSrc] = useState(null) // подписанный URL для текущей буквы
  const [modalVideo, setModalVideo] = useState(null) // { url, title } | null — для видео сравнения похожих букв и раздела "Практика"
  const [showQuiz, setShowQuiz] = useState(false)
  const audioRef = useRef(null)

  function markVideoWatched(letterId) {
    setVideoWatched(prev => {
      if (prev.has(letterId)) return prev
      const next = new Set(prev)
      next.add(letterId)
      localStorage.setItem('alphabet_video_watched', JSON.stringify([...next]))
      return next
    })
  }

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
        setShowQuiz(true)
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
  // При переходе на новую букву всегда сворачиваем видео в компактное превью —
  // открывается только по явному тапу, не грузится само
  useEffect(() => {
    setVideoExpanded(false)
    setVideoError(null)
  }, [item])
  // Подписанная ссылка на видео буквы
  useEffect(() => {
    if (!item?.id) { setVideoSrc(null); return }
    let cancelled = false
    setVideoSrc(null)
    getLetterVideoUrl(item.id).then(url => { if (!cancelled) setVideoSrc(url) })
    return () => { cancelled = true }
  }, [item])
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
    if (showQuiz) { setShowQuiz(false); return }
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

  useBackHandler(true, back)

  if (showQuiz) {
    return <QandAQuiz category="Алфавит" onClose={() => setShowQuiz(false)} />
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
        {!chapter && !item && <DawnLandscape />}
        <button style={{ ...s.backBtn, position: 'relative', zIndex: 1 }} onClick={back}>‹</button>
        <div style={{ ...s.headMid, position: 'relative', zIndex: 1 }}>
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
          {[
            { label: 'Буквы',    hint: 'Начни отсюда — 28 согласных и откуда берётся звук каждой',              ids: ['alphabet', 'makhraj'] },
            { label: 'Харакаты', hint: 'Значки над/под буквами — превращают буквы в слоги. Проходи после букв', ids: ['fatha', 'kasra', 'damma', 'sukun', 'other-rules'] },
          ].map(group => (
            <div key={group.label}>
              <div style={s.practiceLabel}>{group.label}</div>
              <div style={s.groupHint}>{group.hint}</div>
              <div style={s.chapterGrid}>
                {group.ids.map(id => {
                  const ch = CHAPTERS.find(c => c.id === id)
                  if (!ch) return null
                  const isAlpha = ch.id === 'alphabet'
                  const alphaDone = isAlpha ? LETTERS.filter(l => listenedLetters.has(l.id)).length : 0
                  const alphaPct  = isAlpha ? Math.round((alphaDone / LETTERS.length) * 100) : 0
                  return (
                    <button key={ch.id} style={s.chapterCardGrid} onClick={() => handleChapterOpen(ch)}>
                      <div style={{ ...s.chapterIconBadge, background: ch.color + '1c', borderColor: ch.color + '40', color: ch.color }} className="arabic">{ch.icon}</div>
                      <div style={s.chapterTitle}>{ch.title}</div>
                      <div style={s.chapterSub}>{ch.sub}</div>
                      {isAlpha && (
                        <div style={{ marginTop: 8, width: '100%' }}>
                          <div style={s.miniTrack}>
                            <div style={{ ...s.miniFill, width: alphaPct + '%', background: ch.color }} />
                          </div>
                          <div style={{ fontSize: 10, color: ch.color, marginTop: 3, fontWeight: 600 }}>
                            {alphaDone}/{LETTERS.length} букв
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {group.label === 'Харакаты' && (
                <div style={s.harakatVideos}>
                  <div style={s.harakatVideosLabel}>▶ Видео по теме</div>
                  {HARAKAT_VIDEOS.map(v => (
                    <button key={v.video} style={s.harakatVideoRow}
                      onClick={async () => { const url = await getExtraVideoUrl(v.video); setModalVideo({ url, title: v.title }) }}>
                      <span style={s.harakatVideoIcon}>▶</span>
                      <span style={s.practiceTitle}>{v.title}</span>
                      <span style={s.practiceArrow}>›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={s.practiceLabel}>Практика и дополнительно</div>
          {PRACTICE_EXTRAS.map(p => (
            <button key={p.video} style={s.practiceRow}
              onClick={async () => { const url = await getExtraVideoUrl(p.video); setModalVideo({ url, title: p.title }) }}>
              <span style={s.practiceIcon}>{p.icon}</span>
              <span style={s.practiceTitle}>{p.title}</span>
              <span style={s.practiceArrow}>▶</span>
            </button>
          ))}

          <button style={s.quizCard} onClick={() => setShowQuiz(true)}>
            <span style={s.quizIcon}>🎯</span>
            <div style={s.videoBody}>
              <div style={s.quizTitle}>Проверь себя</div>
              <div style={s.videoSub}>Квиз по алфавиту, махраджам и харакатам</div>
            </div>
            <span style={s.videoArrow}>›</span>
          </button>

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
          <div style={{ ...s.chapIntro, flexDirection: 'column' }}>
            <div>В арабском языке <b style={{ color:'var(--gold)' }}>28 букв</b> — и все они согласные. Отдельных букв для гласных звуков нет — вместо них используются маленькие значки (харакаты), которые ставятся над или под буквой.</div>
            <div style={{ marginTop: 8 }}>Арабский читается <b style={{ color:'var(--gold)' }}>справа налево</b>.</div>
            <div style={{ marginTop: 8 }}><b style={{ color:'var(--gold)' }}>Что делать:</b> нажми на любую букву — прослушай произношение, посмотри как она выглядит в начале, середине и конце слова, и узнай откуда берётся звук (махрадж).</div>
          </div>
          <div style={s.alphaGrid}>
            {LETTERS.map(l => {
              const heard = listenedLetters.has(l.id)
              return (
                <button key={l.id} style={s.alphaCell}
                  onClick={() => { setItem(l); markLetterListened(l.id) }}>
                  {heard && <div style={s.alphaCellCheck}>✓</div>}
                  <div style={s.alphaCellAr} className="arabic">{l.ar}</div>
                  <div style={s.alphaCellName}>{l.name}</div>
                </button>
              )
            })}
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
      {item && item.makhraj && !item._chapterId && (() => {
        const l = item
        const mc = MAKHRAJ_COLOR[l.makhraj]
        const g  = MAKHRAJ_GROUPS.find(x => x.id === l.makhraj)
        return (
          <>
            {videoError !== l.id && videoExpanded && videoSrc && (
              <video
                key={l.id}
                src={videoSrc}
                controls
                playsInline
                style={s.letterVideo}
                onError={() => setVideoError(l.id)}
                onPlay={() => markVideoWatched(l.id)}
              />
            )}
            <div style={s.mediaGrid}>
              {videoSrc && videoError !== l.id && (
                <button style={{ ...s.mediaSquare, borderColor: mc + '55' }} onClick={() => setVideoExpanded(true)}>
                  <video
                    src={videoSrc}
                    muted
                    playsInline
                    preload="metadata"
                    style={s.mediaSquareVideo}
                    onError={() => setVideoError(l.id)}
                    onLoadedMetadata={e => { e.currentTarget.currentTime = 1 }}
                  />
                  <div style={s.mediaSquareShade} />
                  <div style={{ ...s.mediaSquarePlay, borderColor: mc }}>▶</div>
                  <span style={s.mediaSquareCaption}>Видео</span>
                </button>
              )}
              {videoError === l.id && (
                <button style={{ ...s.mediaSquare, borderColor: 'rgba(255,90,90,.4)' }} onClick={() => setVideoError(null)}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <span style={s.mediaSquareCaption}>Повторить</span>
                </button>
              )}
              <button style={{ ...s.mediaSquare, borderColor: mc + '55' }} onClick={() => handlePlayUrl(l.audio)}>
                <span style={{ ...s.mediaSquareIcon, color: mc }}>{ttsActive ? '⏹' : '▶'}</span>
                <span style={s.mediaSquareCaption}>{ttsActive ? 'Стоп' : 'Аудио'}</span>
              </button>
            </div>
            {getSimilarGroupsForLetter(l.id).length > 0 && (
              <div style={s.mediaCol}>
                {getSimilarGroupsForLetter(l.id).map(g => (
                  <button key={g.video} style={s.mediaRow}
                    onClick={async () => { const url = await getExtraVideoUrl(g.video); setModalVideo({ url, title: g.title }) }}>
                    <span style={{ ...s.mediaIconCircle, background: mc + '15', borderColor: mc + '40', color: mc, fontSize: 15 }}>⇄</span>
                    <span style={s.mediaLabel}>{g.title}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={s.scroll} className="scroll-y">
              {/* Большая буква */}
              <div style={{ ...s.bigCard, borderColor: mc + '45' }}>
                <div style={{ ...s.bigAr, color: mc }} className="arabic">{l.ar}</div>
                <div style={s.bigCardInfo}>
                  <div style={{ ...s.bigArName, color: mc }} className="arabic">{l.nameAr}</div>
                  <div style={s.bigRuName}>{l.name}</div>
                  {g && <div style={{ ...s.badge, borderColor: g.border, background: g.bg, color: g.color }}>{g.nameAr} · {g.name}</div>}
                </div>
              </div>

              {/* Слоги */}
              <div style={s.sec}>
                <div style={s.secTitle}>Слоги с харакатами</div>
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
          ГЛАВА: СУКУН
      ══════════════════════════════════════════ */}
      {chapter?.id === 'sukun' && !item && (
        <div style={s.scroll} className="scroll-y">
          <SpeicalChapter
            ch={chapter}
            intro={`Сукун (ْ) — маленький кружок над буквой. Он говорит: «здесь нет гласной».\n\nЕсли ты уже знаешь как читать «ба», «та», «са» — теперь представь ту же букву, но без гласной на конце: просто «б», «т», «с». Именно это и делает сукун.\n\nКак читать: произноси букву коротко и закрыто, не тяни — сразу переходи к следующей букве.\n\nПример: قُلْ = «кул» + «ь» → «куль». Лям в конце с сукуном закрывает слог.`}
            items={SUKUN_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
          />
          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ══════════════════════════════════════════
          ГЛАВА: ДРУГИЕ ПРАВИЛА (ТАНВИН / ШАДДА / МАДД)
      ══════════════════════════════════════════ */}
      {chapter?.id === 'other-rules' && !item && (
        <div style={s.scroll} className="scroll-y">
          <div style={s.secTitle}>Танвин</div>
          <SpeicalChapter
            ch={{ icon:'ـٌ', color:'#a07de8', border:'rgba(160,125,232,.3)', bg:'rgba(160,125,232,.1)' }}
            intro={`Танвин — это когда в конце слова стоит ДВОЙНОЙ харакат вместо одинарного. Он добавляет к гласной звук «н».\n\nКак выглядит и звучит:\n• ً (две фатхи) → «ан»\n• ٍ (две кясры) → «ин»\n• ٌ (две даммы) → «ун»\n\nЗачем он нужен: танвин ставится вместо артикля اَلـ («аль») и показывает, что слово неопределённое — как в русском «книга» (какая-то) вместо «эта книга».\n\nСравни: أَحَدٌ («ахадун») — «Единственный», без артикля, с танвином (первый аят суры «Аль-Ихляс», 112:1). А со словом с артиклем харакат был бы одинарный, без танвина.`}
            items={TANWIN_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
            showType
          />

          <div style={{ ...s.secTitle, marginTop: 20 }}>Шадда</div>
          <SpeicalChapter
            ch={{ icon:'بّ', color:'#e8c05a', border:'rgba(232,192,90,.3)', bg:'rgba(232,192,90,.1)' }}
            intro={`Шадда (ّ) — значок в форме маленького зубчика над буквой. Он означает: эта буква удваивается — звучит так, будто написана два раза подряд.\n\nКак читать: сначала короткая остановка на согласной (без гласной), затем та же буква ещё раз — уже с харакатом.\n\nПример 1: имя Пророка ﷺ — مُحَمَّد (Мухаммад). Буква م с шаддой в середине звучит удвоенно: «мухам-мад», а не «мухамад».\n\nПример 2: رَبَّنَا («раббана» — «Господь наш», часто встречается в коранических дуа). Буква ب с шаддой: «раб-бана», не «рабана».\n\nГлавное правило: видишь шадду — задержись на согласной чуть дольше, произнеси её как бы дважды.`}
            items={SHADDA_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
            showNote
          />

          <div style={{ ...s.secTitle, marginTop: 20 }}>Мадд</div>
          <SpeicalChapter
            ch={{ icon:'ـا', color:'#e88a5a', border:'rgba(232,138,90,.3)', bg:'rgba(232,138,90,.1)' }}
            intro={`Мадд (مَدّ) — это удлинение гласного звука. Обычная гласная звучит мгновенно, а с маддом она тянется примерно 2 счёта (около 1 секунды).\n\nКак распознать: сразу после харакята стоит одна из трёх «долгих» букв — ا, و или ي. Это и есть сигнал «тяни».\n\nТри вида:\n• Фатха + ا → тяни «а-а», пример: الرَّحْمَٰنِ («ар-рахмааани» — Милостивый, начало почти каждой суры)\n• Дамма + و → тяни «у-у», пример: نُوحٍ («нуухин» — имя пророка Нуха)\n• Кясра + ي → тяни «и-и», пример: الرَّحِيمِ («ар-рахиими» — Милосердный)\n\nГлавное: тянуть ровно 2 счёта — не короче и не дольше.`}
            items={MADD_EXAMPLES}
            onSpeak={handleSpeak}
            ttsActive={ttsActive}
            showType
            showNote
          />
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

      {/* Модалка видео (сравнения похожих букв, практика) */}
      {modalVideo && (
        <div style={s.videoModalOverlay} onClick={() => setModalVideo(null)}>
          <div style={s.videoModalCard} onClick={e => e.stopPropagation()}>
            <div style={s.videoModalHead}>
              <span style={s.videoModalTitle}>{modalVideo.title}</span>
              <button style={s.videoModalClose} onClick={() => setModalVideo(null)}>✕</button>
            </div>
            <video src={modalVideo.url} controls autoPlay playsInline style={s.videoModalVideo} />
          </div>
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
        <div key={i}
          style={{ ...s.exampleRow, borderColor: (item.color || ch.color) + '45', background: (item.color || ch.color) + '0a' }}>
          <div style={{ ...s.exRowAr, color: item.color || ch.color }} className="arabic">{item.ar}</div>
          <div style={s.exRowBody}>
            <div style={s.exRowRu}>«{item.ru}» — {item.meaning}</div>
            {showType && <div style={{ ...s.exRowType, color: item.color || ch.color }}>{item.typeRu}</div>}
            {showNote && item.note && <div style={s.exRowNote}>{item.note}</div>}
            {item.rule && <div style={s.exRowNote}>{item.rule}</div>}
          </div>
        </div>
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
    position: 'relative', overflow: 'hidden',
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
    border:'1px solid var(--border)', borderRadius:18, padding:'13px 14px',
    background: 'var(--bg-card)', color: 'var(--text)',
    cursor:'pointer', outline:'none', textAlign:'left', marginBottom:8,
    fontFamily: 'var(--font-ui)',
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
  chapterTitle:  { fontSize:14, fontWeight:700, color: 'var(--text)' },
  chapterTitleAr:{ fontSize:13, fontFamily:"'Scheherazade New',serif", direction:'rtl', color:'var(--text-muted)' },
  chapterSub:    { fontSize:11, color:'var(--text-muted)', lineHeight:1.4 },
  chapterArrow:  { fontSize:22, color:'rgba(255,255,255,.2)', flexShrink:0 },
  miniTrack: { height:3, borderRadius:2, background:'rgba(255,255,255,.08)', width: '100%' },
  miniFill:  { height:3, borderRadius:2, transition:'width .3s ease' },

  // Сетка 2 колонки для главного экрана алфавита
  chapterGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16,
  },
  chapterCardGrid: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 3,
    border: '1px solid var(--border)', borderRadius: 16, padding: '12px 10px',
    background: 'var(--bg-card)', color: 'var(--text)',
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)', position: 'relative',
  },
  chapterIconBadge: {
    width: 44, height: 44, flexShrink: 0, marginBottom: 4,
    borderRadius: '50%', border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontFamily: "'Scheherazade New',serif", direction: 'rtl',
  },

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
  quizCard: {
    display:'flex', alignItems:'center', gap:14, width:'100%', marginBottom:10,
    borderRadius:16, border:'1.5px solid rgba(160,125,232,.4)',
    background:'linear-gradient(135deg,rgba(160,125,232,.15),rgba(160,125,232,.05))',
    padding:'14px 16px', cursor:'pointer', outline:'none', textAlign:'left', fontFamily:'var(--font-ui)',
  },
  quizIcon:  { fontSize:24, flexShrink:0 },
  quizTitle: { fontSize:14, fontWeight:700, color:'#a07de8', marginBottom:3 },

  // Практика и дополнительно
  practiceLabel: {
    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    margin: '4px 2px 2px',
  },
  groupHint: {
    fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4,
    margin: '0 2px 8px',
  },
  harakatVideos: {
    display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10,
  },
  harakatVideosLabel: {
    fontSize: 11, fontWeight: 700, color: '#e74c3c',
    textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 2px 2px',
  },
  harakatVideoRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 14, border: '1.5px solid rgba(231,76,60,.35)',
    background: 'rgba(231,76,60,.08)',
    padding: '12px 14px', cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
  },
  harakatVideoIcon: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#c0392b,#e74c3c)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: '#fff', boxShadow: '0 0 12px rgba(231,76,60,.5)',
  },
  practiceRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-card)',
    padding: '12px 14px', cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-ui)', textAlign: 'left', width: '100%',
  },
  practiceIcon: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
  },
  practiceTitle: { flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  practiceArrow: { fontSize: 11, color: 'var(--gold)', flexShrink: 0 },

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
    border:'1px solid var(--border)', borderRadius:14, padding:'10px 6px',
    background: 'var(--bg-card)', cursor:'pointer', outline:'none',
    position:'relative', fontFamily: 'var(--font-ui)',
  },
  alphaCellCheck: {
    position:'absolute', top:4, left:5,
    fontSize:9, fontWeight:800, color:'var(--gold)',
  },
  alphaCellAr: {
    fontSize:28, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.3, direction:'rtl', color: 'var(--gold)',
  },
  alphaCellName: { fontSize:9, color:'var(--text-muted)', fontWeight:600, textAlign:'center' },

  legend: { display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 },
  legendItem: {
    display:'flex', alignItems:'center', gap:4,
    border:'1px solid', borderRadius:20, padding:'3px 8px',
  },
  legendDot: { width:6, height:6, borderRadius:'50%', flexShrink:0 },

  // Аудио-бар
  letterVideo: {
    flexShrink: 0, width: '100%', maxHeight: '38vh',
    background: '#000', display: 'block',
  },
  mediaCol: {
    flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8,
    padding: '0 16px 10px', borderBottom: '1px solid var(--border)',
  },
  mediaGrid: {
    flexShrink: 0, display: 'flex', gap: 8,
    padding: '10px 16px', borderBottom: '1px solid var(--border)',
  },
  mediaSquare: {
    width: 68, height: 68, flexShrink: 0, position: 'relative', overflow: 'hidden',
    borderRadius: 12, border: '1.5px solid', background: 'rgba(255,255,255,.04)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', outline: 'none', padding: 0,
  },
  mediaSquareVideo: {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
  },
  mediaSquareShade: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.55))',
  },
  mediaSquarePlay: {
    position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
    width: 20, height: 20, borderRadius: '50%', border: '1.5px solid',
    background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  mediaSquareIcon: { fontSize: 20, lineHeight: 1 },
  mediaSquareCaption: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1,
    fontSize: 9, fontWeight: 700, color: '#fff', textAlign: 'center',
    padding: '2px 0 4px', background: 'rgba(0,0,0,.35)',
  },
  mediaRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '7px 10px', cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-ui)', textAlign: 'left',
  },
  mediaThumbSq: {
    position: 'relative', flexShrink: 0, width: 34, height: 34,
    borderRadius: 9, border: '1.5px solid', background: '#000', overflow: 'hidden',
  },
  videoThumbEl: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover',
  },
  videoThumbShade: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.4))',
  },
  mediaPlayDot: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    width: 16, height: 16, borderRadius: '50%', border: '1.5px solid',
    background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  mediaIconCircle: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0, border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
  },
  mediaLabel: { fontSize: 14, fontWeight: 700, color: 'var(--text)' },

  // Модалка видео (сравнения похожих букв / практика)
  videoModalOverlay: {
    position: 'fixed', inset: 0, zIndex: 700,
    background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  videoModalCard: {
    width: '100%', maxWidth: 480, background: '#000',
    borderRadius: 16, overflow: 'hidden',
  },
  videoModalHead: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', background: 'var(--bg-card)',
  },
  videoModalTitle: { flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' },
  videoModalClose: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', outline: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  videoModalVideo: { width: '100%', maxHeight: '60vh', display: 'block', background: '#000' },

  // Используется кнопкой "Произнести «слог»" в разделах фатха/кясра/дамма
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
    border:'1.5px solid', borderRadius:18, padding:'14px 16px',
    background:'var(--bg-card)', display:'flex', flexDirection:'row',
    alignItems:'center', justifyContent: 'center', gap:14, marginBottom:14,
  },
  bigAr: {
    fontSize:64, fontFamily:"'Scheherazade New',serif",
    lineHeight:1.1, direction:'rtl', flexShrink: 0,
  },
  bigCardInfo: { display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2 },
  bigArName: {
    fontSize:20, fontFamily:"'Scheherazade New',serif", direction:'rtl',
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

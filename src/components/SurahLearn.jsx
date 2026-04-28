import { useState, useRef, useEffect } from 'react'
import { SURAHS } from '../data/surahs-learn'
import { useAuth } from '../hooks/useAuth'
import { addNur } from '../utils/nur'

const PROXY    = 'https://bwnzfyxcgzscghowpqfn.supabase.co/functions/v1/audio-proxy?url='
const EVERYAYAH = 'https://everyayah.com/data/Alafasy_128kbps'
const CDN_SURAH = 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy'

function pad(n, len) { return String(n).padStart(len, '0') }
function proxy(url) { return `${PROXY}${encodeURIComponent(url)}` }

function getVerseAudio(surah, verseN) {
  if (surah.id === 'ayat-kursi') return proxy(`${EVERYAYAH}/002255.mp3`)
  if (surah.surahNum) return proxy(`${EVERYAYAH}/${pad(surah.surahNum, 3)}${pad(verseN, 3)}.mp3`)
  if (surah.audioUrl) return surah.audioUrl   // локальный файл для не-Коранических текстов
  return null
}

function getSurahAudio(surah) {
  if (surah.id === 'ayat-kursi') return proxy(`${EVERYAYAH}/002255.mp3`)
  if (surah.surahNum) return proxy(`${CDN_SURAH}/${surah.surahNum}.mp3`)
  if (surah.audioUrl) return surah.audioUrl   // локальный файл
  return null
}

const MILESTONES = [
  { id: 'first',    emoji: '🌱', title: 'Первый шаг',       desc: 'Выучена первая сура',              check: (p) => Object.keys(p).length >= 1 },
  { id: 'fatiha',   emoji: '🕌', title: 'Намаз начат',      desc: 'Аль-Фатиха выучена',               check: (p) => !!p['fatiha'] },
  { id: 'three',    emoji: '⭐', title: 'Хорошее начало',    desc: 'Выучено 3 текста',                 check: (p) => Object.keys(p).length >= 3 },
  { id: 'prayer',   emoji: '🤲', title: 'Намаз полностью',  desc: 'Фатиха + Аттахият + Салавата',     check: (p) => !!p['fatiha'] && !!p['attahiyyat'] && !!p['salawat'] },
  { id: 'all',      emoji: '🏆', title: 'Всё выучено',      desc: 'Пройдены все тексты',              check: (p, total) => Object.keys(p).length >= total },
]

function getNewMilestones(prev, next, total) {
  return MILESTONES.filter(m => !m.check(prev, total) && m.check(next, total))
}

function SurahCard({ surah, onOpen, learned }) {
  return (
    <button
      style={{
        ...s.surahCard,
        background: surah.gradient,
        borderColor: learned ? surah.color + '80' : surah.border,
        position: 'relative',
      }}
      onClick={() => onOpen(surah)}
    >
      <div style={{ ...s.surahNum, background: surah.iconBg }}>
        {surah.number}
      </div>
      <div style={s.surahInfo}>
        <div style={{ ...s.surahName, color: surah.color }}>{surah.name}</div>
        <div style={s.surahNameAr} className="arabic">{surah.nameAr}</div>
        <div style={s.surahDesc}>{surah.desc}</div>
      </div>
      {learned
        ? <div style={s.learnedBadge}>✓</div>
        : <div style={{ ...s.surahCount, color: surah.color }}>{surah.verses.length} аятов</div>
      }
    </button>
  )
}

export default function SurahLearn({ onClose }) {
  const { user, profile, setProfile, saveProgress } = useAuth()
  const [selected, setSelected] = useState(null)
  const [verseIdx, setVerseIdx] = useState(0)
  const [mode, setMode]         = useState('card')
  const [done, setDone]         = useState(false)
  const [playing, setPlaying]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [newMilestones, setNewMilestones] = useState([])
  const audioRef = useRef(null)

  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('surah_progress') || '{}') }
    catch { return {} }
  })

  function markLearned(id) {
    const next = { ...progress, [id]: { learned: true, date: new Date().toISOString() } }
    const gained = getNewMilestones(progress, next, SURAHS.length)
    setProgress(next)
    setNewMilestones(gained)
    localStorage.setItem('surah_progress', JSON.stringify(next))
    // +50 НУР за выученную суру (только первый раз)
    if (!progress[id]) addNur(50, user, profile, setProfile)
    saveProgress?.()
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setPlaying(false)
    setLoading(false)
  }

  function playAudio(url) {
    if (!url) return
    if (playing) { stopAudio(); return }
    stopAudio()
    const a = new Audio(url)
    audioRef.current = a
    setLoading(true)
    setPlaying(false)
    a.oncanplaythrough = () => { setLoading(false) }
    a.onplay   = () => { setPlaying(true); setLoading(false) }
    a.onended  = () => { setPlaying(false); setLoading(false); audioRef.current = null }
    a.onerror  = () => { setPlaying(false); setLoading(false); audioRef.current = null }
    a.load()
    a.play().catch(() => { setPlaying(false); setLoading(false) })
  }

  // При смене аята — останавливаем только если у суры аудио разделено по аятам
  useEffect(() => {
    if (selected?.singleAudio) return   // единый MP3 — не трогаем
    stopAudio()
  }, [verseIdx])

  // При смене суры или режима — всегда останавливаем
  useEffect(() => { stopAudio() }, [selected, mode])

  // Остановить при закрытии компонента
  useEffect(() => () => stopAudio(), [])

  function openSurah(surah) {
    stopAudio()
    setSelected(surah)
    setVerseIdx(0)
    setMode('card')
    setDone(false)
  }

  function back() {
    stopAudio()
    if (done)     { setDone(false); setVerseIdx(0); return }
    if (selected) { setSelected(null); return }
    onClose()
  }

  const surah = selected
  const verse = surah ? surah.verses[verseIdx] : null
  const total = surah ? surah.verses.length : 0
  const isLast = surah && verseIdx === total - 1

  return (
    <div style={s.wrap}>
      {/* Шапка */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={back}>‹</button>
        <div style={s.headMid}>
          <div style={s.headTitle}>
            {selected ? selected.name : 'Разучивание сур'}
          </div>
          {selected && (
            <div style={s.headSub}>{selected.meaning} · {total} {selected.unit === 'часть' ? 'частей' : 'аятов'}</div>
          )}
        </div>
        {selected && !done && (
          <button
            style={s.modeBtn}
            onClick={() => setMode(m => m === 'card' ? 'all' : 'card')}
          >
            {mode === 'card' ? 'Все сразу' : 'По одному'}
          </button>
        )}
      </div>

      {/* ── Аудио-бар ── */}
      {selected && !done && (() => {
        const isCard = mode === 'card'
        const isSingle = !!selected.singleAudio
        // Для единого MP3 всегда берём общий URL; для посуречных — per-verse в card-режиме
        const url = (isSingle || !isCard || !verse)
          ? getSurahAudio(selected)
          : getVerseAudio(selected, verse.n)
        if (!url) return null
        const label = isSingle
          ? 'Прослушать'
          : isCard
            ? `Аят ${verse.n} из ${total}`
            : 'Вся сура целиком'
        return (
          <button
            style={{
              ...s.audioBar,
              borderColor: selected.color + '50',
              color: selected.color,
              background: playing ? selected.color + '18' : 'rgba(255,255,255,.04)',
            }}
            onClick={() => playAudio(url)}
          >
            <span style={s.audioBarIcon}>{loading ? '⏳' : playing ? '⏹' : '▶'}</span>
            <span style={s.audioBarLabel}>
              {loading ? 'Загрузка...' : playing ? 'Остановить' : label}
            </span>
            <span style={s.audioBarSub}>
              {isSingle ? 'весь текст · аудио' : 'Мишари Рашид'}
            </span>
          </button>
        )
      })()}

      {/* ── Список сур ── */}
      {!selected && (
        <div style={s.scroll} className="scroll-y">

          {/* Прогресс */}
          {(() => {
            const learnedCount = Object.keys(progress).length
            const totalCount = SURAHS.length
            if (learnedCount === 0) return null
            const pct = Math.round((learnedCount / totalCount) * 100)
            return (
              <div style={s.progressSummary}>
                <div style={s.progressSummaryRow}>
                  <span style={s.progressSummaryLabel}>Выучено {learnedCount} из {totalCount}</span>
                  <span style={s.progressSummaryPct}>{pct}%</span>
                </div>
                <div style={s.progressSummaryBar}>
                  <div style={{ ...s.progressSummaryFill, width: `${pct}%` }} />
                </div>
                {learnedCount === totalCount && (
                  <div style={s.progressSummaryDone}>🏆 Все тексты выучены!</div>
                )}
              </div>
            )
          })()}

          {/* Объяснение */}
          <div style={s.whyBox}>
            <div style={s.whyTitle}>Почему именно эти суры?</div>
            <div style={s.whyText}>
              В намазе в каждом ракаате читается <b style={{ color: 'var(--gold)' }}>Аль-Фатиха</b> — это обязательно.
              После неё в 1-м и 2-м ракаатах добавляется любая другая сура.
            </div>
            <div style={s.whyText}>
              Все суры ниже короткие и часто используются именно для этого. Начните с Фатихи — без неё намаз не засчитается. Остальные учите постепенно, по одной.
            </div>
          </div>

          {/* Группа: Обязательная */}
          <div style={s.groupLabel}>⭐ Обязательная в каждом ракаате</div>
          {SURAHS.filter(x => x.group === 'required').map(surah => (
            <SurahCard key={surah.id} surah={surah} onOpen={openSurah} learned={!!progress[surah.id]} />
          ))}

          {/* Группа: Тексты намаза */}
          <div style={{ ...s.groupLabel, marginTop: 16 }}>🤲 Читаются внутри намаза</div>
          {SURAHS.filter(x => x.group === 'prayer_dua').map(surah => (
            <SurahCard key={surah.id} surah={surah} onOpen={openSurah} learned={!!progress[surah.id]} />
          ))}

          {/* Группа: После намаза */}
          <div style={{ ...s.groupLabel, marginTop: 16 }}>✨ После намаза</div>
          {SURAHS.filter(x => x.group === 'after_prayer').map(surah => (
            <SurahCard key={surah.id} surah={surah} onOpen={openSurah} learned={!!progress[surah.id]} />
          ))}

          {/* Группа: Суры после Фатихи */}
          <div style={{ ...s.groupLabel, marginTop: 16 }}>📖 Суры — можно читать после Фатихи</div>
          {SURAHS.filter(x => x.group === 'after_fatiha').map(surah => (
            <SurahCard key={surah.id} surah={surah} onOpen={openSurah} learned={!!progress[surah.id]} />
          ))}

          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ── Режим: все аяты сразу ── */}
      {selected && mode === 'all' && (
        <div style={s.scroll} className="scroll-y">
          <div style={{ ...s.allHeader, borderColor: surah.border }}>
            <div style={s.allHeaderAr} className="arabic gold-shimmer">{surah.nameAr}</div>
            <div style={{ ...s.allHeaderName, color: surah.color }}>{surah.name}</div>
          </div>

          {surah.verses.map((v, i) => (
            <div key={i} style={{ ...s.allVerseCard, borderColor: surah.color + '30' }}>
              <div style={{ ...s.allVerseNum, background: surah.color + '22', color: surah.color }}>
                {v.n}
              </div>
              <div style={s.allVerseBody}>
                <div style={s.allVerseAr} className="arabic">{v.ar}</div>
                <div style={s.allTranslit}>{v.translit}</div>
                <div style={s.allTranslation}>{v.translation}</div>
              </div>
            </div>
          ))}

          <button style={{ ...s.restartBtn, borderColor: surah.color + '50', color: surah.color }}
            onClick={() => { setMode('card'); setVerseIdx(0); setDone(false) }}>
            ↩ Учить по одному
          </button>
          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ── Режим: карточки по одному ── */}
      {selected && mode === 'card' && !done && (
        <>
          {/* Прогресс */}
          <div style={s.progressWrap}>
            <div style={s.progressRow}>
              <span style={s.progressLabel}>{surah.unit === 'часть' ? 'Часть' : 'Аят'} {verseIdx + 1} из {total}</span>
            </div>
            <div style={s.progressBar}>
              <div style={{
                ...s.progressFill,
                width: `${((verseIdx + 1) / total) * 100}%`,
                background: surah.color,
              }} />
            </div>
            <div style={s.dots}>
              {surah.verses.map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...s.dot,
                    background: i <= verseIdx ? surah.color : 'rgba(255,255,255,.15)',
                    transform: i === verseIdx ? 'scale(1.4)' : 'scale(1)',
                  }}
                  onClick={() => setVerseIdx(i)}
                />
              ))}
            </div>
          </div>

          {/* Карточка аята */}
          <div style={s.cardScroll} className="scroll-y">
            <div style={{ ...s.verseCard, borderColor: surah.color + '40' }}>
              {/* Номер аята */}
              <div style={s.verseNumWrap}>
                <div style={{ ...s.verseNumBadge, background: surah.color + '22', color: surah.color }}>
                  {surah.unit === 'часть' ? 'Часть' : 'Аят'} {verse.n}
                </div>
              </div>

              {/* Арабский текст */}
              <div style={s.verseAr} className="arabic">{verse.ar}</div>

              {/* Разделитель */}
              <div style={{ ...s.divider, background: `linear-gradient(90deg,transparent,${surah.color}40,transparent)` }} />

              {/* Транслитерация */}
              <div style={s.translitLabel}>Как читается:</div>
              <div style={{ ...s.translit, color: surah.color }}>{verse.translit}</div>

              {/* Перевод */}
              <div style={s.translationLabel}>Перевод:</div>
              <div style={s.translation}>{verse.translation}</div>
            </div>

            {/* Подсказка на первом аяте */}
            {verseIdx === 0 && (
              <div style={s.hint}>
                💡 Прочитайте аят вслух несколько раз, следуя транслитерации — и переходите дальше
              </div>
            )}

            <div style={{ height: 16 }} />
          </div>

          {/* Навигация */}
          <div style={s.nav}>
            <button
              style={{ ...s.navBtn, opacity: verseIdx > 0 ? 1 : 0.3 }}
              onClick={() => verseIdx > 0 && setVerseIdx(v => v - 1)}
              disabled={verseIdx === 0}
            >← Назад</button>

            <button
              style={{ ...s.navNext, background: surah.color }}
              onClick={() => {
                if (isLast) { markLearned(surah.id); setDone(true) }
                else setVerseIdx(v => v + 1)
              }}
            >
              {isLast ? 'Готово ✓' : 'Далее →'}
            </button>
          </div>
        </>
      )}

      {/* ── Экран завершения ── */}
      {selected && done && (
        <div style={s.scroll} className="scroll-y">
          <div style={s.doneWrap}>
            <div style={s.doneEmoji}>🎉</div>
            <div style={s.doneTitle}>Отлично!</div>
            <div style={s.doneSub}>
              Вы прошли все {total} {surah.unit === 'часть' ? 'частей' : 'аятов'} — «{surah.name}».{'\n'}
              Повторяйте почаще — и она сама ляжет на язык!
            </div>

            {/* Новые достижения */}
            {newMilestones.length > 0 && (
              <div style={s.milestonesWrap}>
                <div style={s.milestonesLabel}>Новое достижение!</div>
                {newMilestones.map(m => (
                  <div key={m.id} style={s.milestoneCard}>
                    <span style={s.milestoneEmoji}>{m.emoji}</span>
                    <div style={s.milestoneText}>
                      <div style={s.milestoneTitle}>{m.title}</div>
                      <div style={s.milestoneSub}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              style={{ ...s.doneBtn, background: surah.color }}
              onClick={() => { setVerseIdx(0); setDone(false) }}
            >
              ↩ Повторить ещё раз
            </button>

            <button
              style={s.doneBtnGhost}
              onClick={() => setMode('all')}
            >
              📖 Посмотреть всю суру
            </button>

            <button
              style={s.doneBtnGhost}
              onClick={() => setSelected(null)}
            >
              ← К списку сур
            </button>
          </div>
          <div style={{ height: 32 }} />
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 95,
    background: 'var(--bg-deep)', display: 'flex',
    flexDirection: 'column', fontFamily: 'var(--font-ui)',
  },

  // Шапка
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 16px 14px',
    borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headMid: { flex: 1 },
  headTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text)' },
  headSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  modeBtn: {
    flexShrink: 0, padding: '6px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
  },

  scroll: { flex: 1, overflowY: 'auto', padding: '14px 16px 0' },

  // Список сур
  whyBox: {
    background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.22)',
    borderRadius: 16, padding: '14px 16px', marginBottom: 16,
  },
  whyTitle: { fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 },
  whyText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 6 },
  groupLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8,
  },
  surahCard: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 18, border: '1.5px solid', padding: '14px 14px',
    cursor: 'pointer', outline: 'none', textAlign: 'left', marginBottom: 10,
  },
  surahNum: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 800, color: '#fff',
  },
  surahInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  surahName: { fontSize: 15, fontWeight: 700 },
  surahNameAr: {
    fontSize: 18, direction: 'rtl',
    fontFamily: "'Scheherazade New',serif",
    color: 'var(--text-muted)',
  },
  surahDesc: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 2 },
  surahCount: { fontSize: 11, fontWeight: 700, flexShrink: 0 },

  // Режим "все сразу"
  allHeader: {
    border: '1px solid', borderRadius: 16,
    padding: '16px', textAlign: 'center', marginBottom: 14,
    background: 'rgba(201,168,76,.06)',
  },
  allHeaderAr: {
    fontSize: 36, direction: 'rtl',
    fontFamily: "'Scheherazade New',serif",
    marginBottom: 6,
  },
  allHeaderName: { fontSize: 15, fontWeight: 700 },

  allVerseCard: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    border: '1px solid', borderRadius: 14, padding: '12px 14px',
    marginBottom: 10,
  },
  allVerseNum: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  allVerseBody: { flex: 1 },
  allVerseAr: {
    fontSize: 24, direction: 'rtl', textAlign: 'right',
    fontFamily: "'Scheherazade New',serif",
    color: 'var(--text)', lineHeight: 1.8, marginBottom: 8,
  },
  allTranslit: { fontSize: 13, color: 'var(--gold)', marginBottom: 4, lineHeight: 1.5 },
  allTranslation: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 },

  restartBtn: {
    width: '100%', marginTop: 8, padding: '13px',
    borderRadius: 14, background: 'transparent', border: '1.5px solid',
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
  },

  // Прогресс
  progressWrap: {
    flexShrink: 0, padding: '12px 16px 10px',
    borderBottom: '1px solid var(--border)',
  },
  progressRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  progressBar: {
    height: 4, borderRadius: 4,
    background: 'rgba(255,255,255,.1)', marginBottom: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, transition: 'width .3s' },
  dots: { display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    cursor: 'pointer', transition: 'all .2s',
  },

  // Карточка аята
  cardScroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 0' },
  verseCard: {
    border: '1.5px solid', borderRadius: 20,
    padding: '20px 18px', background: 'var(--bg-card)',
  },
  verseNumWrap: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  verseNumBadge: {
    padding: '4px 14px', borderRadius: 20,
    fontSize: 12, fontWeight: 700,
  },
  verseAr: {
    fontSize: 34, direction: 'rtl', textAlign: 'center',
    fontFamily: "'Scheherazade New',serif",
    color: 'var(--text)', lineHeight: 1.9,
    marginBottom: 18,
  },
  divider: { height: 1, marginBottom: 16 },
  translitLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6,
  },
  translit: {
    fontSize: 16, fontWeight: 600, lineHeight: 1.6,
    marginBottom: 14,
  },
  translationLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6,
  },
  translation: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
    fontStyle: 'italic',
  },

  audioBar: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', border: '0 solid', borderBottomWidth: 1,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
    transition: 'background .2s',
  },
  audioBarIcon: { fontSize: 18, flexShrink: 0 },
  audioBarLabel: { fontSize: 14, fontWeight: 700, flex: 1, textAlign: 'left' },
  audioBarSub: { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },

  hint: {
    marginTop: 12, fontSize: 12, color: 'var(--text-muted)',
    lineHeight: 1.6, background: 'rgba(255,255,255,.04)',
    borderRadius: 10, padding: '10px 12px',
  },

  // Навигация
  nav: {
    flexShrink: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '12px 16px',
    borderTop: '1px solid var(--border)', gap: 10,
  },
  navBtn: {
    padding: '10px 18px', borderRadius: 12,
    background: 'rgba(255,255,255,.07)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
    transition: 'opacity .2s',
  },
  navNext: {
    flex: 1, padding: '12px', borderRadius: 14,
    border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
  },

  // Экран завершения
  doneWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '32px 8px 0', textAlign: 'center', gap: 12,
  },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 26, fontWeight: 800, color: 'var(--text)' },
  doneSub: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
    whiteSpace: 'pre-line', maxWidth: 300,
  },
  doneBtn: {
    width: '100%', marginTop: 8, padding: '14px',
    borderRadius: 16, border: 'none', color: '#fff',
    fontSize: 15, fontWeight: 700,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
  },
  doneBtnGhost: {
    width: '100%', padding: '13px', borderRadius: 16,
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-ui)',
  },

  // Прогресс в списке
  progressSummary: {
    background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)',
    borderRadius: 14, padding: '12px 14px', marginBottom: 14,
  },
  progressSummaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  progressSummaryLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  progressSummaryPct: { fontSize: 13, fontWeight: 700, color: 'var(--gold)' },
  progressSummaryBar: {
    height: 6, borderRadius: 6,
    background: 'rgba(255,255,255,.1)', overflow: 'hidden',
  },
  progressSummaryFill: {
    height: '100%', borderRadius: 6,
    background: 'linear-gradient(90deg,#9a6a10,#c9a84c)',
    transition: 'width .4s',
  },
  progressSummaryDone: {
    marginTop: 8, fontSize: 13, fontWeight: 700,
    color: 'var(--gold)', textAlign: 'center',
  },

  // Галочка на карточке
  learnedBadge: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(82,183,136,.2)', border: '1.5px solid rgba(82,183,136,.6)',
    color: '#52b788', fontSize: 15, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Достижения на экране завершения
  milestonesWrap: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4,
  },
  milestonesLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'center',
  },
  milestoneCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(201,168,76,.1)', border: '1.5px solid rgba(201,168,76,.35)',
    borderRadius: 14, padding: '12px 14px',
  },
  milestoneEmoji: { fontSize: 30, flexShrink: 0 },
  milestoneText: { flex: 1, textAlign: 'left' },
  milestoneTitle: { fontSize: 15, fontWeight: 700, color: 'var(--gold)' },
  milestoneSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
}

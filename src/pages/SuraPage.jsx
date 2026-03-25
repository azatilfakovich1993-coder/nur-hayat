import { useState, useEffect, useRef, useCallback, forwardRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SURAS } from '../data/suras'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'
import { fetchSura } from '../utils/fetchVerse'

const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'

// Конвертация латинской транскрипции в кириллицу
function latinToCyrillic(text) {
  if (!text) return ''
  return text
    // Диакритика (долгие гласные)
    .replace(/[Āā]/g, 'а').replace(/[Īī]/g, 'и').replace(/[Ūū]/g, 'у')
    // Диграфы (важно — до одиночных букв)
    .replace(/Sh|SH/g, 'Ш').replace(/sh/g, 'ш')
    .replace(/Kh|KH/g, 'Х').replace(/kh/g, 'х')
    .replace(/Gh|GH/g, 'Г').replace(/gh/g, 'г')
    .replace(/Th|TH/g, 'С').replace(/th/g, 'с')
    .replace(/Dh|DH/g, 'З').replace(/dh/g, 'з')
    // Одиночные
    .replace(/A/g,'А').replace(/a/g,'а')
    .replace(/B/g,'Б').replace(/b/g,'б')
    .replace(/D/g,'Д').replace(/d/g,'д')
    .replace(/E/g,'Е').replace(/e/g,'е')
    .replace(/F/g,'Ф').replace(/f/g,'ф')
    .replace(/H/g,'Х').replace(/h/g,'х')
    .replace(/I/g,'И').replace(/i/g,'и')
    .replace(/J/g,'Дж').replace(/j/g,'дж')
    .replace(/K/g,'К').replace(/k/g,'к')
    .replace(/L/g,'Л').replace(/l/g,'л')
    .replace(/M/g,'М').replace(/m/g,'м')
    .replace(/N/g,'Н').replace(/n/g,'н')
    .replace(/O/g,'О').replace(/o/g,'о')
    .replace(/Q/g,'К').replace(/q/g,'к')
    .replace(/R/g,'Р').replace(/r/g,'р')
    .replace(/S/g,'С').replace(/s/g,'с')
    .replace(/T/g,'Т').replace(/t/g,'т')
    .replace(/U/g,'У').replace(/u/g,'у')
    .replace(/W/g,'В').replace(/w/g,'в')
    .replace(/Y/g,'Й').replace(/y/g,'й')
    .replace(/Z/g,'З').replace(/z/g,'з')
    .replace(/[''ʿʾ`]/g, '')
}

function getTranslit(text, language) {
  if (!text) return ''
  if (language === 'en') return text
  return latinToCyrillic(text)  // ru и kk — кириллица
}

const RECITERS = [
  { id: 'ar.alafasy',        cdnId: 7,  name: 'Мишари Алафаси' },
  { id: 'ar.abdullahbasfar', cdnId: 9,  name: 'Абдулла Басфар' },
  { id: 'ar.husary',         cdnId: 5,  name: 'Махмуд Хусари'  },
]

// Один аудиофайл на всю суру
function suraAudioUrl(reciterId, suraId) {
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${suraId}.mp3`
}

// Временны́е метки аятов из qurancdn (в секундах, нарастающим итогом)
async function fetchVerseTimings(suraId, cdnId) {
  try {
    const res = await fetch(
      `https://api.qurancdn.com/api/qdc/audio/reciters/${cdnId}/audio_files` +
      `?chapter_number=${suraId}&segments=true`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const { audio_files } = await res.json()
    if (!audio_files?.length) return null

    // Собираем длительность каждого аята (мс → с)
    const durations = {}
    for (const f of audio_files) {
      const vn = parseInt(f.verse_key.split(':')[1])
      if (Array.isArray(f.segments) && f.segments.length) {
        durations[vn] = Math.max(...f.segments.map(([,, e]) => e)) / 1000
      }
    }

    // Строим нарастающие временны́е метки начала каждого аята
    // Для сур кроме 1 и 9 добавляем ~3с на Басмалу
    let offset = (suraId !== 1 && suraId !== 9) ? 3.0 : 0
    const starts = {}
    for (const f of audio_files) {
      const vn = parseInt(f.verse_key.split(':')[1])
      starts[vn] = offset
      offset += durations[vn] ?? 4.0
    }
    return starts  // { 1: 0.0, 2: 4.2, 3: 8.7, ... }
  } catch { return null }
}

function fmtTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Плеер ─────────────────────────────────────────────────────
function AudioPlayer({ suraId, verses, onVerseChange }) {
  const [reciter,  setReciter]  = useState(RECITERS[0])
  const [playing,  setPlaying]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [showList, setShowList] = useState(false)
  const [timings,  setTimings]  = useState(null)  // { verseNum: startSec }

  const audioRef   = useRef()
  const timingsRef = useRef(null)  // актуальные тайминги без ре-рендера

  // Загружаем тайминги в фоне при смене суры / чтеца
  useEffect(() => {
    setTimings(null); timingsRef.current = null
    fetchVerseTimings(suraId, reciter.cdnId).then(t => {
      setTimings(t); timingsRef.current = t
    })
  }, [suraId, reciter.cdnId])

  // Сброс плеера при смене суры / чтеца
  useEffect(() => {
    const a = audioRef.current
    if (a) { a.pause(); a.src = '' }
    setPlaying(false); setCurrent(0); setDuration(0)
    onVerseChange(null)
  }, [suraId, reciter.id])

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause(); setPlaying(false)
    } else {
      if (!a.src || a.src === window.location.href) {
        a.src = suraAudioUrl(reciter.id, suraId)
        a.load()
      }
      setLoading(true)
      a.play()
        .then(() => { setPlaying(true); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }

  function onTimeUpdate() {
    const a = audioRef.current
    if (!a) return
    const t = a.currentTime
    setCurrent(t)

    // Находим текущий аят по таймингам
    const tm = timingsRef.current
    if (!tm || !verses.length) return
    let activeVerse = verses[0].number
    for (const v of verses) {
      if (tm[v.number] !== undefined && t >= tm[v.number]) {
        activeVerse = v.number
      }
    }
    onVerseChange(activeVerse)
  }

  function onLoadedMetadata() { setDuration(audioRef.current?.duration || 0); setLoading(false) }
  function onCanPlay()        { setLoading(false) }
  function onEnded()          { setPlaying(false); setCurrent(0); onVerseChange(null) }

  function seek(e) {
    const a = audioRef.current
    if (!a || !duration) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    a.currentTime = ratio * duration
    setCurrent(a.currentTime)
  }

  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div style={p.wrap}>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onEnded={onEnded}
      />

      <div style={p.top}>
        <button style={p.reciterBtn} onClick={() => setShowList(v => !v)}>
          <span>🎙</span>
          <span style={p.reciterName}>{reciter.name}</span>
          <span style={p.arrow}>{showList ? '▲' : '▼'}</span>
        </button>

        {!timings && playing && (
          <span style={p.hint}>синхр...</span>
        )}

        <button style={{ ...p.playBtn, opacity: loading ? 0.6 : 1 }} onClick={togglePlay}>
          {loading ? <span style={p.spinner} /> : playing ? '⏸' : '▶'}
        </button>
      </div>

      {showList && (
        <div style={p.reciterList}>
          {RECITERS.map(r => (
            <button key={r.id} style={{
              ...p.reciterOption,
              color:      r.id === reciter.id ? 'var(--gold)' : 'var(--text)',
              background: r.id === reciter.id ? 'rgba(201,168,76,.1)' : 'transparent'
            }} onClick={() => { setReciter(r); setShowList(false) }}>
              <span style={{ width: 14 }}>{r.id === reciter.id ? '✓' : ''}</span>
              <span>{r.name}</span>
            </button>
          ))}
        </div>
      )}

      <div style={p.progressWrap} onClick={seek}>
        <div style={p.progressTrack}>
          <div style={{ ...p.progressFill, width: `${progress}%` }} />
          <div style={{ ...p.progressThumb, left: `${progress}%` }} />
        </div>
      </div>

      <div style={p.times}>
        <span>{fmtTime(current)}</span>
        <span>{fmtTime(duration)}</span>
      </div>
    </div>
  )
}

// ── Основная страница ──────────────────────────────────────────
export default function SuraPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const sura     = SURAS.find(s => s.id === Number(id))

  const [verses,       setVerses]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [liked,        setLiked]        = useState(new Set(profile?.liked_verses_keys || []))
  const [nurAnim,      setNurAnim]      = useState(null)
  const [playingVerse, setPlayingVerse] = useState(null)

  const tid      = profile?.translation_id || 131
  const language = profile?.language || 'ru'
  const verseRefs = useRef({})

  useEffect(() => {
    setLoading(true); setError(false)
    fetchSura(id, tid).then(data => {
      if (data) { setVerses(data); setLoading(false) }
      else       { setError(true); setLoading(false) }
    })
  }, [id, tid])

  // Авто-прокрутка к читаемому аяту
  useEffect(() => {
    if (!playingVerse) return
    verseRefs.current[playingVerse]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [playingVerse])

  async function toggleLike(key) {
    if (liked.has(key)) return
    const next = new Set(liked); next.add(key)
    setLiked(next); setNurAnim(key)
    setTimeout(() => setNurAnim(null), 1400)
    const newNur = (profile?.nur || 10) + 10
    setProfile(p => ({ ...p, nur: newNur }))
    if (user) {
      await supabase.from('liked_verses').insert({ user_id: user.id, verse_key: key })
      await supabase.from('profiles').update({ nur: newNur }).eq('id', user.id)
    }
  }

  const handleVerseChange = useCallback(v => setPlayingVerse(v), [])

  if (!sura) return <div style={s.notFound}>Сура не найдена</div>

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate(-1)}>← Назад</button>
        <div style={s.headerCenter}>
          <div style={s.suraAr} className="arabic">{sura.ar}</div>
          <div style={s.suraRu}>{sura.ru}</div>
          <div style={s.suraMeta}>
            {sura.id}-я сура · {sura.ayats} аятов ·{' '}
            <span style={{ color: sura.place === 'M' ? 'var(--gold)' : '#7B6BAE' }}>
              {sura.place === 'M' ? '🕋 Мекка' : '🕌 Медина'}
            </span>
          </div>
        </div>
        <AudioPlayer suraId={sura.id} verses={verses} onVerseChange={handleVerseChange} />
      </div>

      <div style={s.scroll} className="scroll-y">
        {sura.id !== 9 && (
          <div style={s.bismillah} className="arabic">{BISMILLAH}</div>
        )}
        {loading && (
          <div style={s.loadWrap}>
            {[0,.2,.4].map((d,i) => <div key={i} style={{ ...s.loadDot, animationDelay:`${d}s` }} />)}
          </div>
        )}
        {error && (
          <div style={s.errorBox}>
            <div style={s.errorIcon}>📡</div>
            <div style={s.errorText}>Нет соединения с интернетом.</div>
            <div style={s.errorSub}>Переводы требуют подключения к сети.</div>
            <button style={s.retryBtn} onClick={() => {
              setError(false); setLoading(true)
              fetchSura(id, tid).then(data => {
                if (data) setVerses(data); else setError(true)
                setLoading(false)
              })
            }}>Повторить</button>
          </div>
        )}
        {!loading && !error && verses.map(verse => (
          <VerseCard
            key={verse.number}
            ref={el => verseRefs.current[verse.number] = el}
            verse={verse}
            suraId={sura.id}
            language={language}
            liked={liked.has(`${sura.id}:${verse.number}`)}
            nurAnim={nurAnim === `${sura.id}:${verse.number}`}
            isPlaying={playingVerse === verse.number}
            onLike={() => toggleLike(`${sura.id}:${verse.number}`)}
          />
        ))}
        <div style={{ height: 40 }} />
      </div>

      <style>{`
        @keyframes dotPulse  { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes heartBeat { 0%{transform:scale(1)} 30%{transform:scale(1.45)} 60%{transform:scale(.88)} 100%{transform:scale(1)} }
        @keyframes floatUp   { 0%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-50px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes versePulse {
          0%,100% { box-shadow: inset 0 0 0 1px rgba(201,168,76,.15); }
          50%     { box-shadow: inset 0 0 0 1px rgba(201,168,76,.4), 0 0 20px 2px rgba(201,168,76,.1); }
        }
      `}</style>
    </div>
  )
}

// ── VerseCard ─────────────────────────────────────────────────
const VerseCard = forwardRef(function VerseCard(
  { verse, suraId, language, liked, nurAnim, isPlaying, onLike }, ref
) {
  const translit = getTranslit(verse.transliteration, language)

  return (
    <div ref={ref} style={{ ...v.card, ...(isPlaying ? v.cardActive : {}) }}>
      <div style={v.numRow}>
        <div style={{ ...v.numBadge, ...(isPlaying ? v.numBadgeActive : {}) }}>
          {isPlaying ? '🔊' : verse.number}
        </div>
        <div style={{ ...v.line, ...(isPlaying ? { background: 'rgba(201,168,76,.4)' } : {}) }} />
      </div>

      <div style={{ ...v.arabic, ...(isPlaying ? v.arabicActive : {}) }} className="arabic">
        {verse.arabic}
      </div>

      {translit && (
        <div style={v.transliteration}>
          {translit}
        </div>
      )}

      {verse.translation && (
        <div style={{ ...v.translation, ...(isPlaying ? v.translationActive : {}) }}>
          {verse.translation}
        </div>
      )}

      <div style={v.likeRow}>
        <div style={v.heartWrap}>
          {nurAnim && <div style={v.nurFloat}>+10 нур ✨</div>}
          <button style={{
            ...v.heartBtn,
            color:       liked ? '#e84393' : 'var(--text-dim)',
            borderColor: liked ? '#e8439340' : 'var(--border)',
            animation:   nurAnim ? 'heartBeat .45s ease' : 'none'
          }} onClick={onLike}>
            {liked ? '♥' : '♡'}
          </button>
        </div>
        <span style={v.ref}>{suraId}:{verse.number}</span>
      </div>
    </div>
  )
})

// ── Стили ─────────────────────────────────────────────────────
const p = {
  wrap: { background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.18)', borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 },
  top:  { display: 'flex', alignItems: 'center', gap: 10 },
  reciterBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0, outline: 'none' },
  reciterName: { fontSize: 13, color: 'var(--gold)', fontWeight: 500, flex: 1, textAlign: 'left' },
  arrow:       { fontSize: 10, color: 'var(--text-muted)' },
  hint:        { fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 },
  playBtn: { width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#C9A84C,#F0D080)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#070710', fontWeight: 700, boxShadow: '0 0 14px rgba(201,168,76,.35)', transition: 'opacity .2s' },
  spinner: { width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(7,7,16,.3)', borderTopColor: '#070710', display: 'inline-block', animation: 'spin .7s linear infinite' },
  reciterList:   { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  reciterOption: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, borderBottom: '1px solid var(--border)', outline: 'none', textAlign: 'left', transition: 'background .15s' },
  progressWrap:  { cursor: 'pointer', padding: '4px 0' },
  progressTrack: { height: 3, background: 'rgba(201,168,76,.15)', borderRadius: 2, position: 'relative' },
  progressFill:  { position: 'absolute', left: 0, top: 0, height: '100%', background: 'linear-gradient(90deg,#C9A84C,#F0D080)', borderRadius: 2, transition: 'width .1s linear' },
  progressThumb: { position: 'absolute', top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', transition: 'left .1s linear' },
  times: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }
}

const s = {
  page:     { height: '100%', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:   { background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: 'calc(var(--safe-top) + 12px) 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 },
  back:     { background: 'none', border: 'none', color: 'var(--gold)', fontSize: 14, cursor: 'pointer', padding: 0, alignSelf: 'flex-start', fontFamily: 'var(--font-ui)' },
  headerCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  suraAr:   { fontFamily: "'Scheherazade New', serif", fontSize: 32, color: 'var(--gold)', textShadow: '0 0 20px rgba(201,168,76,.4)' },
  suraRu:   { fontSize: 18, fontWeight: 600, color: 'var(--text)' },
  suraMeta: { fontSize: 12, color: 'var(--text-muted)' },
  scroll:   { flex: 1, padding: '0 16px' },
  bismillah: { fontFamily: "'Scheherazade New', serif", fontSize: 26, color: 'var(--gold-light)', textAlign: 'center', direction: 'rtl', padding: '24px 0 8px', textShadow: '0 0 16px rgba(201,168,76,.25)' },
  loadWrap:  { display: 'flex', gap: 10, justifyContent: 'center', padding: '60px 0' },
  loadDot:   { width: 10, height: 10, borderRadius: '50%', background: 'var(--gold-dim)', animation: 'dotPulse 1.2s ease-in-out infinite' },
  errorBox:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 20px', textAlign: 'center' },
  errorIcon: { fontSize: 40 }, errorText: { fontSize: 16, color: 'var(--text)' }, errorSub: { fontSize: 13, color: 'var(--text-muted)' },
  retryBtn:  { marginTop: 8, padding: '10px 24px', borderRadius: 20, background: 'var(--gold)', color: '#070710', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-ui)', fontSize: 14 },
  notFound:  { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16, background: 'var(--bg-deep)' }
}

const v = {
  card: { borderBottom: '1px solid var(--border)', margin: '0 -8px', padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 12, borderRadius: 12, transition: 'background .3s, box-shadow .3s' },
  cardActive: { background: 'rgba(201,168,76,.07)', animation: 'versePulse 2.5s ease-in-out infinite' },
  numRow:  { display: 'flex', alignItems: 'center', gap: 12 },
  numBadge: { flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--gold)', transition: 'all .3s' },
  numBadgeActive: { background: 'rgba(201,168,76,.3)', border: '1px solid rgba(201,168,76,.6)', fontSize: 15 },
  line: { flex: 1, height: 1, background: 'var(--border)', transition: 'background .3s' },
  arabic: { fontFamily: "'Scheherazade New', serif", fontSize: 24, lineHeight: 2, color: 'var(--gold-light)', textAlign: 'right', direction: 'rtl', transition: 'color .3s, text-shadow .3s' },
  arabicActive: { color: 'var(--gold)', textShadow: '0 0 24px rgba(201,168,76,.4)' },
  transliteration: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic', paddingLeft: 2 },
  translation: { fontSize: 14, color: 'var(--text)', lineHeight: 1.75, borderLeft: '2px solid rgba(201,168,76,.25)', paddingLeft: 12, transition: 'border .3s' },
  translationActive: { borderLeftColor: 'rgba(201,168,76,.7)', borderLeftWidth: 3 },
  likeRow:   { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 },
  heartWrap: { position: 'relative' },
  nurFloat:  { position: 'absolute', bottom: '110%', left: '50%', background: 'linear-gradient(135deg,#C9A84C,#F0D080)', color: '#070710', fontWeight: 700, fontSize: 11, padding: '3px 9px', borderRadius: 10, whiteSpace: 'nowrap', animation: 'floatUp 1.3s ease-out forwards', pointerEvents: 'none', zIndex: 2, boxShadow: '0 0 12px rgba(201,168,76,.5)' },
  heartBtn:  { width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid', fontSize: 18, cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .2s, border-color .2s' },
  ref:       { fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }
}

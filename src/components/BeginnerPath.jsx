import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { addNur, addNurIfLevel } from '../utils/nur'
import { supabase } from '../supabase/client'
import QuranAlphabet  from './QuranAlphabet'
import PrayerGuide    from './PrayerGuide'
import SurahLearn     from './SurahLearn'
import Adhkar         from './Adhkar'
import Duas           from './Duas'
import QandA          from './QandA'
import Shahada        from './Shahada'
import PillarsOfIslam from './PillarsOfIslam'
import QandAQuiz      from './QandAQuiz'
import { SURAHS }     from '../data/surahs-learn'
import { useSwipeDown } from '../hooks/useSwipeDown'

// ── Определение шагов ────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'qa',
    num: 1,
    icon: '❓',
    title: 'Вопросы и ответы',
    desc: 'Понять основы веры — всё об исламе с достоверными ответами',
    hint: 'Прежде чем начать — узнай основы. Что такое ислам, кто такой Пророк ﷺ, зачем молиться и как жить по-мусульмански.',
    action: 'Читать',
    section: 'qa',
    manual: true,
  },
  {
    id: 'pillars',
    num: 2,
    icon: '🕌',
    title: '5 столпов ислама',
    desc: 'Понять всю картину — что предстоит делать мусульманину',
    hint: 'Без понимания 5 столпов нет ясности зачем учить намаз и суры. Это фундамент.',
    action: 'Читать',
    section: 'pillars',
    manual: true,
  },
  {
    id: 'shahada',
    num: 3,
    icon: '⭐',
    title: 'Шахада',
    desc: 'Главный шаг — именно она делает человека мусульманином',
    hint: 'Теперь ты знаешь что такое ислам и его столпы. Шахада — это твой сознательный выбор и вход в веру.',
    action: 'Читать',
    section: 'shahada',
    manual: true,
  },
  {
    id: 'alphabet',
    num: 4,
    icon: '📖',
    title: 'Арабский алфавит',
    desc: 'Научиться читать — основа всего',
    hint: 'Арабский — язык Корана и намаза. Даже базовое чтение меняет всё — ты начнёшь понимать что говоришь в намазе.',
    action: 'Учить',
    section: 'alphabet',
    manual: false,
  },
  {
    id: 'fatiha',
    num: 5,
    icon: '📖',
    title: 'Сура Фатиха',
    desc: 'Теперь читается в оригинале — без транслитерации',
    hint: 'Она читается в каждом ракаате. Всего 7 аятов — это основа каждого намаза. Без неё намаз недействителен.',
    action: 'Учить',
    section: 'surahs',
    manual: false,
  },
  {
    id: 'namaz',
    num: 6,
    icon: '🕌',
    title: 'Как читать намаз',
    desc: 'Движения, вуду, слова — пошаговый гид',
    hint: 'Намаз — второй столп ислама. Лучше выучить правильно с первого раза, чем переучиваться.',
    action: 'Открыть',
    section: 'guide',
    manual: true,
  },
  {
    id: 'first_prayer',
    num: 7,
    icon: '✅',
    title: 'Первый намаз',
    desc: 'Соверши намаз и отметь его — это твой первый шаг к Аллаху',
    hint: 'Аллах принимает даже несовершенный намаз искреннего сердца. Не жди идеального момента — просто сделай.',
    action: 'Открыть намаз',
    section: 'first_prayer',
    manual: true,
  },
  {
    id: 'quiz',
    num: 8,
    icon: '🎯',
    title: 'Финальный квиз',
    desc: 'Проверь знания — 10 вопросов об основах ислама',
    hint: 'Это итоговая проверка пути новичка. Ответь на вопросы и докажи себе что ты усвоил основы.',
    action: 'Начать квиз',
    section: 'quiz',
    manual: false,
    finalStep: true,
  },
]

// ── Поздравления и НУР за каждый шаг ─────────────────────────────────────────
const STEP_CONGRATS = {
  qa:           { nur: 20,  msg: 'Отличное начало! Теперь ты знаешь основы веры.' },
  pillars:      { nur: 20,  msg: 'МашАллах! Ты понял фундамент ислама — 5 столпов.' },
  shahada:      { nur: 150, msg: 'АльхамдулиЛлях! Ты засвидетельствовал свою веру.' },
  namaz:        { nur: 20,  msg: 'МашАллах! Теперь ты знаешь как правильно читать намаз.' },
  first_prayer: { nur: 20,  msg: 'СубханАллах! Ты совершил первый намаз — это незабываемый момент!' },
  quiz:         { nur: 50,  msg: 'МашАллах! Ты прошёл все шаги пути новичка — это настоящее начало!' },
}

function ConfirmDialog({ step, onYes, onNo }) {
  return (
    <div style={cd.overlay}>
      <div style={cd.card}>
        <div style={cd.icon}>{step.icon}</div>
        <div style={cd.title}>Подтверди выполнение</div>
        <div style={cd.text}>Ты прочитал и выполнил шаг{'\n'}«{step.title}»?</div>
        <div style={cd.btns}>
          <button style={cd.btnYes} onClick={onYes}>Да, выполнил ✓</button>
          <button style={cd.btnNo} onClick={onNo}>Нет</button>
        </div>
      </div>
    </div>
  )
}

const cd = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 600,
    background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 340,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 24, padding: '28px 24px', textAlign: 'center',
    fontFamily: 'var(--font-ui)',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 },
  text: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6,
    whiteSpace: 'pre-line', marginBottom: 24,
  },
  btns: { display: 'flex', flexDirection: 'column', gap: 10 },
  btnYes: {
    padding: '14px 0', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg,#1a7a56,#52b788)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },
  btnNo: {
    padding: '13px 0', borderRadius: 14,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },
}

function StepCelebration({ step, onClose }) {
  const congrats = STEP_CONGRATS[step.id] || { nur: 20, msg: 'МашАллах!' }
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t) }, [])
  return (
    <div style={sc.overlay}>
      <div style={{
        ...sc.card,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(.95)',
        opacity: visible ? 1 : 0,
        transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={sc.confetti}>🎉</div>
        <div style={sc.icon}>{step.icon}</div>
        <div style={sc.title}>Шаг выполнен!</div>
        <div style={sc.stepName}>{step.title}</div>
        <div style={sc.nurBadge}>
          <span style={sc.nurCircle}>◉</span>
          <span style={sc.nurAmount}>+{congrats.nur} НУР</span>
        </div>
        <div style={sc.msg}>{congrats.msg}</div>
        <button style={sc.btn} onClick={onClose}>АльхамдулиЛлях! ✓</button>
      </div>
    </div>
  )
}

const sc = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 600,
    background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 340,
    background: 'linear-gradient(160deg,#0d0d18,#14142a)',
    border: '1px solid rgba(201,168,76,.4)',
    borderRadius: 28, padding: '32px 24px', textAlign: 'center',
    fontFamily: 'var(--font-ui)',
    boxShadow: '0 0 60px rgba(201,168,76,.2)',
  },
  confetti: { fontSize: 36, marginBottom: 4 },
  icon: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: 700, color: 'rgba(201,168,76,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 },
  stepName: { fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 16 },
  nurBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(201,168,76,.12)', border: '1.5px solid rgba(201,168,76,.4)',
    borderRadius: 40, padding: '8px 20px', marginBottom: 16,
  },
  nurCircle: { fontSize: 18, color: 'var(--gold)' },
  nurAmount: { fontSize: 24, fontWeight: 900, color: 'var(--gold)' },
  msg: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 },
  btn: {
    width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },
}

// ── Загрузка автопрогресса ────────────────────────────────────────────────────
function getAutoComplete() {
  let alphabetDone = false, fatihaDone = false, surahProgress = {}
  try {
    const al = JSON.parse(localStorage.getItem('alphabet_listened') || '[]')
    alphabetDone = al.length >= 28
  } catch {}
  try {
    const sp = JSON.parse(localStorage.getItem('surah_progress') || '{}')
    fatihaDone = !!sp['fatiha']
    surahProgress = sp
  } catch {}
  return { alphabet: alphabetDone, fatiha: fatihaDone, surahProgress }
}

function loadProgress() {
  try { return JSON.parse(localStorage.getItem('beginner_path') || '{}') }
  catch { return {} }
}

function saveProgress(p) {
  localStorage.setItem('beginner_path', JSON.stringify(p))
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function BeginnerPath({ onClose }) {
  const swipe        = useSwipeDown(onClose)
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const [openSection,     setOpenSection]     = useState(null)
  const [manualDone,      setManualDone]      = useState(loadProgress)
  const alreadyCompleted = useMemo(() => {
    const auto = getAutoComplete()
    const manual = loadProgress()
    return STEPS.every(st => {
      if (st.id === 'quiz')     return !!manual['quiz']
      if (!st.manual) return st.id === 'alphabet' ? auto.alphabet : auto.fatiha
      return !!manual[st.id]
    })
  }, [])
  const [celebrated, setCelebrated] = useState(alreadyCompleted)
  const [confirmingStep,  setConfirmingStep]  = useState(null)
  const [celebrationStep, setCelebrationStep] = useState(null)

  const auto = useMemo(getAutoComplete, [openSection]) // пересчёт после закрытия подраздела

  function isDone(step) {
    if (step.id === 'quiz')     return !!manualDone['quiz']
    if (!step.manual) {
      if (step.id === 'alphabet') return auto.alphabet
      if (step.id === 'fatiha')   return auto.fatiha
    }
    return !!manualDone[step.id]
  }

function handleMarkDoneRequest(step) {
    setConfirmingStep(step)
  }

  function handleMarkDoneConfirm() {
    if (!confirmingStep) return
    const step = confirmingStep
    setConfirmingStep(null)
    markDone(step.id)
    setCelebrationStep(step)
  }

  function markDone(id) {
    const next = { ...manualDone, [id]: true }
    setManualDone(next)
    saveProgress(next)
    // Шахада имеет особую награду +150 через onConfirm — не начисляем обычные +20
    if (!manualDone[id] && id !== 'shahada') addNurIfLevel(20, 'seeker', user, profile, setProfile)
    const allDone = STEPS.every(st => {
      if (!st.manual) return st.id === 'alphabet' ? auto.alphabet : auto.fatiha
      return !!next[st.id]
    })
    if (allDone && !celebrated) {
      setCelebrated(true)
      addNur(200, user, profile, setProfile) // бонус за завершение пути
    }
  }

  const doneCount   = STEPS.filter(st => isDone(st)).length
  const pct         = Math.round((doneCount / STEPS.length) * 100)
  const currentStep = STEPS.find(st => !isDone(st))

  // ── Открытые подразделы ──
  if (openSection === 'qa')           return <QandA          onClose={() => setOpenSection(null)} />
  if (openSection === 'shahada')      return <Shahada
    onClose={() => setOpenSection(null)}
    onConfirm={() => {
      addNur(150, user, profile, setProfile)
      markDone('shahada')
    }}
  />
  if (openSection === 'pillars')      return <PillarsOfIslam  onClose={() => setOpenSection(null)} />
  if (openSection === 'alphabet')     return <QuranAlphabet   onClose={() => setOpenSection(null)} />
  if (openSection === 'guide')        return <PrayerGuide     onClose={() => setOpenSection(null)} />
  if (openSection === 'surahs')       return <SurahLearn      onClose={() => setOpenSection(null)} />
  if (openSection === 'adhkar')       return <Adhkar          onClose={() => setOpenSection(null)} />
  if (openSection === 'duas')         return <Duas            onClose={() => setOpenSection(null)} />
  if (openSection === 'quiz') return (
    <QandAQuiz
      onClose={() => setOpenSection(null)}
      onFinish={() => { markDone('quiz'); setOpenSection(null) }}
    />
  )
  if (openSection === 'first_prayer') return (
    <FirstPrayerScreen
      onClose={() => setOpenSection(null)}
      onGo={() => { onClose(); navigate('/prayer') }}
      onDone={() => { markDone('first_prayer'); setOpenSection(null) }}
      alreadyDone={!!manualDone['first_prayer']}
    />
  )

  // Полноэкранное поздравление после завершения всего пути
  if (celebrated) return (
    <PathCompletedScreen
      user={user}
      profile={profile}
      setProfile={setProfile}
      isReturn={alreadyCompleted}
      onClose={onClose}
    />
  )

  return (
    <div style={s.wrap} {...swipe}>
      {/* ── Шапка ── */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.headMid}>
          <div style={s.headTitle}>Путь новичка</div>
          <div style={s.headSub}>Пошаговый курс для начинающих</div>
        </div>
      </div>

      <div style={s.scroll} className="scroll-y">

        {/* ── Прогресс ── */}
        <div style={s.progressCard}>
          <div style={s.progressTop}>
            <div style={s.progressLeft}>
              <div style={s.progressTitle}>
                {doneCount === STEPS.length ? '🏆 Путь пройден!' : `Шаг ${doneCount + 1} из ${STEPS.length}`}
              </div>
              <div style={s.progressSub}>
                {doneCount === STEPS.length
                  ? 'Ты прошёл все шаги — машАллах!'
                  : currentStep ? `Следующий: ${currentStep.title}` : ''}
              </div>
            </div>
            <div style={s.progressCircle}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
                <circle cx="28" cy="28" r="23" fill="none" stroke="#c9a84c" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={`${2 * Math.PI * 23 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px', transition: 'stroke-dashoffset .5s ease' }}
                />
                <text x="28" y="33" textAnchor="middle" fill="#c9a84c" fontSize="13" fontWeight="700" fontFamily="sans-serif">{pct}%</text>
              </svg>
            </div>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: pct + '%' }} />
          </div>
        </div>

        {/* ── Шаги ── */}
        {STEPS.map((step, i) => {
          const done    = isDone(step)
          const isCurr  = !done && currentStep?.id === step.id
          return (
            <div key={step.id} style={{
              ...s.stepCard,
              borderColor: done  ? 'rgba(201,168,76,.45)'
                         : isCurr ? 'rgba(201,168,76,.25)'
                         : 'var(--border)',
              background:  done  ? 'rgba(201,168,76,.07)'
                         : isCurr ? 'rgba(201,168,76,.04)'
                         : 'var(--bg-card)',
            }}>
              {/* Левая часть — номер */}
              <div style={{
                ...s.stepNum,
                background:  done  ? 'linear-gradient(135deg,#9a6a10,#c9a84c)'
                           : isCurr ? 'rgba(201,168,76,.18)'
                           : 'rgba(255,255,255,.06)',
                color: done ? '#070710' : isCurr ? 'var(--gold)' : 'var(--text-muted)',
                border: done ? 'none' : `1.5px solid ${isCurr ? 'rgba(201,168,76,.4)' : 'var(--border)'}`,
              }}>
                {done ? '✓' : step.num}
              </div>

              {/* Контент */}
              <div style={s.stepBody}>
                <div style={s.stepHeader}>
                  <span style={s.stepIcon}>{step.icon}</span>
                  <span style={{ ...s.stepTitle, color: done ? 'var(--gold)' : isCurr ? 'var(--text)' : 'var(--text-muted)' }}>
                    {step.title}
                  </span>
                  {isCurr && <span style={s.currBadge}>СЕЙЧАС</span>}
                </div>
                <div style={s.stepDesc}>{step.desc}</div>
                {isCurr && <div style={s.stepHint}>💡 {step.hint}</div>}

                <div style={s.stepBtns}>
                  <button
                    style={{ ...s.openBtn, opacity: done ? 0.6 : 1 }}
                    onClick={() => setOpenSection(step.section)}
                  >
                    {done ? '↩ Пройти снова' : `${step.action} →`}
                  </button>
                  {step.manual && !done && (
                    <button style={s.doneBtn} onClick={() => handleMarkDoneRequest(step)}>
                      ✓ Выполнено
                    </button>
                  )}
                  {done && <span style={s.doneMark}>✓ Пройдено</span>}
                </div>
              </div>
            </div>
          )
        })}

        {/* ── Прогресс сур ── */}
        {(() => {
          const sp = auto.surahProgress
          const learnedCount = Object.keys(sp).length
          const total = SURAHS.length
          const pct = Math.round((learnedCount / total) * 100)
          const nextSurah = SURAHS.find(su => !sp[su.id])
          return (
            <button style={s.surahSection} onClick={() => setOpenSection('surahs')}>
              <div style={s.surahSectionIcon}>📖</div>
              <div style={s.surahSectionBody}>
                <div style={s.surahSectionHead}>
                  <span style={s.surahSectionTitle}>Изучение сур</span>
                  <span style={s.surahSectionPct}>{learnedCount}/{total} · {pct}%</span>
                </div>
                <div style={s.surahSectionSub}>
                  {learnedCount === total
                    ? '🏆 Все суры изучены!'
                    : nextSurah ? `Следующая: ${nextSurah.name}` : 'Суры для намаза и зикра'}
                </div>
                <div style={s.surahSectionTrack}>
                  <div style={{ ...s.surahSectionFill, width: pct + '%' }} />
                </div>
              </div>
              <span style={s.surahSectionArrow}>›</span>
            </button>
          )
        })()}

        {/* ── Дисклеймер ── */}
        <div style={s.disclaimer}>
          Этот путь — стартовый минимум. Ислам — это жизнь, и учёба не заканчивается. Продолжай читать Коран, изучать Сунну и расти каждый день.
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Диалог подтверждения */}
      {confirmingStep && (
        <ConfirmDialog
          step={confirmingStep}
          onYes={handleMarkDoneConfirm}
          onNo={() => setConfirmingStep(null)}
        />
      )}

      {/* Поздравление с выполненным шагом */}
      {celebrationStep && !celebrated && (
        <StepCelebration
          step={celebrationStep}
          onClose={() => setCelebrationStep(null)}
        />
      )}
    </div>
  )
}

// ── Экран завершения пути ────────────────────────────────────────────────────
function PathCompletedScreen({ user, profile, setProfile, onClose, isReturn }) {
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  // Плавное появление
  useState(() => { setTimeout(() => setVisible(true), 50) })

  async function handleUpgrade() {
    setLoading(true)
    await supabase.from('profiles').update({ level: 'growing' }).eq('id', user.id)
    setProfile(p => p ? { ...p, level: 'growing' } : p)
    setLoading(false)
    onClose()
    navigate('/home')
  }

  function handleStay() {
    onClose()
    navigate('/home')
  }

  return (
    <div style={pc.wrap}>
      {/* Частицы */}
      {SPARKS_PATH.map((sp, i) => (
        <div key={i} style={{ ...pc.spark, ...sp, animationDelay: `${i * 0.15}s` }} />
      ))}

      <div style={pc.scroll} className="scroll-y">
        {/* Трофей */}
        <div style={pc.trophy}>🏆</div>

        {/* Заголовок */}
        <div style={pc.title}>МашАллах!</div>
        <div style={pc.subtitle}>Путь новичка пройден</div>

        {/* НУР — только при первом завершении */}
        {!isReturn && (
          <div style={pc.nurCard}>
            <div style={pc.nurTop}>
              <span style={pc.nurIcon}>◉</span>
              <span style={pc.nurAmount}>+200 НУР</span>
            </div>
            <div style={pc.nurLabel}>Награда за завершение пути</div>
          </div>
        )}

        {/* Что ты прошёл */}
        <div style={pc.achievedCard}>
          <div style={pc.achievedTitle}>Ты прошёл:</div>
          {[
            '❓ Узнал основы ислама',
            '⭐ Понял смысл шахады',
            '🕌 Изучил 5 столпов',
            '📖 Освоил арабский алфавит',
            '📖 Выучил суру Фатиха',
            '🕌 Узнал как читать намаз',
            '✅ Совершил первый намаз',
          ].map((item, i) => (
            <div key={i} style={pc.achievedItem}>
              <span style={pc.checkMark}>✓</span>
              <span style={pc.achievedText}>{item}</span>
            </div>
          ))}
        </div>

        {/* Предложение перехода */}
        <div style={pc.upgradeCard}>
          <div style={pc.upgradeTitle}>Что дальше?</div>
          <div style={pc.upgradeText}>
            Ты готов к следующему уровню — <strong style={{ color: '#52b788' }}>«Мусульманин, расту»</strong>.
            {'\n\n'}
            На этом уровне главное — ежедневный намаз. Приложение покажет расписание, будет отслеживать твои намазы и помогать читать Коран каждый день.
          </div>

          <div style={pc.changesList}>
            {[
              { icon: '🕌', text: 'Расписание намазов — главный экран' },
              { icon: '📖', text: 'Трекер чтения Корана' },
              { icon: '🔥', text: 'Серия дней намазов' },
              { icon: '📚', text: 'Весь раздел «Знания» остаётся доступным' },
            ].map((item, i) => (
              <div key={i} style={pc.changesItem}>
                <span style={pc.changesIcon}>{item.icon}</span>
                <span style={pc.changesText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки */}
        <button
          style={{ ...pc.btnPrimary, opacity: loading ? 0.7 : 1 }}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Переходим...' : 'Перейти на «Мусульманин, расту» →'}
        </button>

        <button style={pc.btnSecondary} onClick={handleStay}>
          Остаться пока на этом уровне
        </button>

        <div style={pc.stayNote}>
          Ты всегда можешь сменить уровень в Профиле
        </div>

        <div style={{ height: 32 }} />
      </div>

      <style>{`
        @keyframes pathSpark {
          0%   { transform: translate(0,0) scale(1); opacity: 1 }
          100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0 }
        }
        @keyframes trophyBounce {
          0%,100% { transform: scale(1) rotate(0deg) }
          25%     { transform: scale(1.1) rotate(-5deg) }
          75%     { transform: scale(1.1) rotate(5deg) }
        }
      `}</style>
    </div>
  )
}

const SPARKS_PATH = [
  { top: '5%',  left: '10%',  '--tx': '-50px', '--ty': '-60px', background: '#FFD700', width: 10, height: 10, borderRadius: '50%', position: 'absolute', animation: 'pathSpark 2s ease-out infinite' },
  { top: '8%',  right: '12%', '--tx':  '45px', '--ty': '-55px', background: '#C9A84C', width: 7,  height: 7,  borderRadius: '50%', position: 'absolute', animation: 'pathSpark 1.8s ease-out infinite' },
  { top: '3%',  left: '40%',  '--tx': '-10px', '--ty': '-70px', background: '#52b788', width: 8,  height: 8,  borderRadius: '50%', position: 'absolute', animation: 'pathSpark 2.2s ease-out infinite' },
  { top: '6%',  right: '35%', '--tx':  '20px', '--ty': '-65px', background: '#FFD700', width: 6,  height: 6,  borderRadius: '50%', position: 'absolute', animation: 'pathSpark 1.6s ease-out infinite' },
  { top: '10%', left: '60%',  '--tx':  '40px', '--ty': '-40px', background: '#7B6BAE', width: 9,  height: 9,  borderRadius: '50%', position: 'absolute', animation: 'pathSpark 2.4s ease-out infinite' },
  { top: '4%',  left: '25%',  '--tx': '-30px', '--ty': '-50px', background: '#E8A030', width: 6,  height: 6,  borderRadius: '50%', position: 'absolute', animation: 'pathSpark 1.9s ease-out infinite' },
]

const pc = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'linear-gradient(160deg,#0d0d18 0%,#12121e 50%,#0a0a14 100%)',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)', overflow: 'hidden',
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '48px 20px 0', textAlign: 'center' },
  spark: {},
  trophy: {
    fontSize: 80, display: 'block', marginBottom: 20,
    animation: 'trophyBounce 2s ease-in-out infinite',
    filter: 'drop-shadow(0 0 30px rgba(201,168,76,.6))',
  },
  title: {
    fontSize: 36, fontWeight: 900, color: 'var(--gold)',
    marginBottom: 6, letterSpacing: '.02em',
  },
  subtitle: {
    fontSize: 16, color: 'var(--text-muted)', marginBottom: 24,
  },

  nurCard: {
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    background: 'rgba(201,168,76,.12)', border: '1.5px solid rgba(201,168,76,.4)',
    borderRadius: 16, padding: '12px 24px', marginBottom: 24,
  },
  nurTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  nurIcon: { fontSize: 20, color: 'var(--gold)' },
  nurAmount: { fontSize: 28, fontWeight: 900, color: 'var(--gold)' },
  nurLabel: { fontSize: 11, color: 'rgba(201,168,76,.6)' },

  achievedCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '16px', marginBottom: 16, textAlign: 'left',
  },
  achievedTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 },
  achievedItem: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 },
  checkMark: { color: '#52b788', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  achievedText: { fontSize: 13, color: 'var(--text)' },

  upgradeCard: {
    background: 'rgba(82,183,136,.07)', border: '1px solid rgba(82,183,136,.25)',
    borderRadius: 16, padding: '16px', marginBottom: 20, textAlign: 'left',
  },
  upgradeTitle: { fontSize: 16, fontWeight: 800, color: '#52b788', marginBottom: 10 },
  upgradeText: {
    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
    marginBottom: 14, whiteSpace: 'pre-line',
  },
  changesList: {},
  changesItem: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 },
  changesIcon: { fontSize: 18, flexShrink: 0 },
  changesText: { fontSize: 13, color: 'var(--text)' },

  btnPrimary: {
    width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg,#1a7a56,#52b788)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
    marginBottom: 10, letterSpacing: '.01em',
  },
  btnSecondary: {
    width: '100%', padding: '14px 0', borderRadius: 16,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'var(--font-ui)', marginBottom: 8,
  },
  stayNote: {
    fontSize: 11, color: 'rgba(255,255,255,.2)', marginTop: 4,
  },
}

// ── Экран первого намаза ──────────────────────────────────────────────────────
function FirstPrayerScreen({ onClose, onGo, onDone, alreadyDone }) {
  const [confirming, setConfirming] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const fpStep = { id: 'first_prayer', icon: '✅', title: 'Первый намаз' }

  function handleDoneConfirm() {
    setConfirming(false)
    onDone()
    setCelebrating(true)
  }

  return (
    <div style={fps.wrap}>
      <div style={fps.head}>
        <button style={fps.backBtn} onClick={onClose}>‹</button>
        <div style={fps.headMid}>
          <div style={fps.headTitle}>Первый намаз</div>
          <div style={fps.headSub}>Шаг 7 из 7</div>
        </div>
      </div>
      <div style={fps.scroll} className="scroll-y">
        <div style={fps.emoji}>✅</div>
        <div style={fps.title}>Ты готов к первому намазу</div>
        <div style={fps.text}>
          Ты прошёл путь: узнал основы, понял шахаду, изучил столпы, арабский алфавит, суру Фатиха и гид намаза.
          {'\n\n'}
          Теперь — самый важный шаг. Соверши намаз. Он не должен быть идеальным. Аллах принимает намаз искреннего сердца.
        </div>

        <div style={fps.hadithCard}>
          <div style={fps.hadithAr} className="arabic">إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ</div>
          <div style={fps.hadithText}>«Поистине, дела — по намерениям»</div>
          <div style={fps.hadithSrc}>— Пророк Мухаммад ﷺ (Бухари, Муслим)</div>
        </div>

        <div style={fps.steps}>
          {['Сделай вуду (омовение)', 'Встань лицом к Кибле', 'Соверши намаз по гиду', 'Отметь его в разделе Намаз'].map((t, i) => (
            <div key={i} style={fps.step}>
              <div style={fps.stepNum}>{i + 1}</div>
              <div style={fps.stepText}>{t}</div>
            </div>
          ))}
        </div>

        <button style={fps.btnPrimary} onClick={onGo}>
          Открыть расписание намазов →
        </button>

        {!alreadyDone && (
          <button style={fps.btnDone} onClick={() => setConfirming(true)}>
            ✓ Я совершил первый намаз
          </button>
        )}
        {alreadyDone && (
          <div style={fps.doneMark}>✓ Отмечено — МашАллах!</div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {confirming && (
        <ConfirmDialog
          step={fpStep}
          onYes={handleDoneConfirm}
          onNo={() => setConfirming(false)}
        />
      )}
      {celebrating && (
        <StepCelebration
          step={fpStep}
          onClose={() => { setCelebrating(false); onClose() }}
        />
      )}
    </div>
  )
}

const fps = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 20px 14px', borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: 'var(--text)', fontSize: 22,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1, flexShrink: 0,
  },
  headMid: { flex: 1 },
  headTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text)' },
  headSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  scroll: { flex: 1, overflowY: 'auto', padding: '24px 20px 0', textAlign: 'center' },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 16 },
  text: {
    fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
    textAlign: 'left', marginBottom: 20, whiteSpace: 'pre-line',
  },
  hadithCard: {
    background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.25)',
    borderRadius: 16, padding: '16px', marginBottom: 20,
  },
  hadithAr: {
    fontFamily: "'Scheherazade New',serif", fontSize: 20,
    color: 'var(--gold)', direction: 'rtl', lineHeight: 1.8, marginBottom: 8,
  },
  hadithText: { fontSize: 14, color: 'var(--text)', fontStyle: 'italic', marginBottom: 6 },
  hadithSrc: { fontSize: 11, color: 'var(--text-muted)' },
  steps: { textAlign: 'left', marginBottom: 24 },
  step: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  stepNum: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)',
    color: 'var(--gold)', fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepText: { fontSize: 14, color: 'var(--text)' },
  btnPrimary: {
    width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)', color: '#fff',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', marginBottom: 12,
  },
  btnDone: {
    width: '100%', padding: '14px 0', borderRadius: 16,
    border: '1px solid rgba(82,183,136,.4)', background: 'rgba(82,183,136,.1)',
    color: '#52b788', fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-ui)', marginBottom: 12,
  },
  doneMark: { fontSize: 15, color: '#52b788', fontWeight: 600, padding: '12px 0' },
}

// ── Виджет новичка (seeker) — главный экран ───────────────────────────────────
export function BeginnerPathWidget({ onOpen }) {
  const auto   = getAutoComplete()
  const manual = loadProgress()

  function isDoneStep(st) {
    if (st.id === 'quiz')     return !!manual['quiz']
    if (!st.manual) return st.id === 'alphabet' ? auto.alphabet : auto.fatiha
    return !!manual[st.id]
  }

  const doneCount   = STEPS.filter(isDoneStep).length
  const pct         = Math.round((doneCount / STEPS.length) * 100)
  const currentStep = STEPS.find(st => !isDoneStep(st))
  const allDone     = doneCount === STEPS.length

  return (
    <div style={sw.wrap}>
      {/* Заголовок с прогрессом */}
      <div style={sw.topRow}>
        <div style={sw.topLeft}>
          <div style={sw.pathLabel}>Твой путь</div>
          <div style={sw.stepCounter}>
            {allDone ? '🏆 Все шаги пройдены' : `Шаг ${doneCount + 1} из ${STEPS.length}`}
          </div>
        </div>
        <div style={sw.pctBadge}>{pct}%</div>
      </div>

      {/* Прогресс-бар с точками */}
      <div style={sw.dotsRow}>
        {STEPS.map((st, i) => {
          const done = isDoneStep(st)
          const curr = !done && i === doneCount
          return (
            <div key={st.id} style={{
              ...sw.dot,
              background: done ? 'var(--gold)' : curr ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.1)',
              border: curr ? '1.5px solid var(--gold)' : '1.5px solid transparent',
              transform: curr ? 'scale(1.3)' : 'scale(1)',
            }} />
          )
        })}
      </div>

      {allDone ? (
        /* Завершение */
        <div style={sw.doneCard}>
          <div style={sw.doneEmoji}>🏆</div>
          <div style={sw.doneTitle}>МашАллах! Путь пройден!</div>
          <div style={sw.doneSub}>Ты прошёл все 7 шагов — это серьёзное начало</div>
          <button style={sw.openBtn} onClick={onOpen}>Что дальше? →</button>
        </div>
      ) : (
        /* Текущий шаг */
        <div style={sw.currentCard}>
          <div style={sw.currentTop}>
            <span style={sw.currentIcon}>{currentStep?.icon}</span>
            <div style={sw.currentMeta}>
              <div style={sw.currentNum}>Шаг {currentStep?.num}</div>
              <div style={sw.currentTitle}>{currentStep?.title}</div>
            </div>
          </div>
          <div style={sw.currentHint}>{currentStep?.hint}</div>
          <button style={sw.startBtn} onClick={onOpen}>
            Начать шаг →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Виджет растущего / соблюдающего (growing / practicing) ────────────────────
export function ProgressWidget({ profile, level, onOpenSurahs, onOpenQuran, onOpenPrayer }) {
  const streak = profile?.streak || 0

  let surahCount = 0
  try { surahCount = Object.keys(JSON.parse(localStorage.getItem('surah_progress') || '{}')).length } catch {}
  const surahPct = Math.round((surahCount / 10) * 100)

  const isPracticing = level === 'practicing'
  const title   = isPracticing ? '📿 Твой ибадат'         : '📈 Мой прогресс'
  const surahLbl= isPracticing ? 'Суры Корана'             : 'Разучивание сур'
  const surahBtn= isPracticing ? 'Повторить'               : 'Продолжить'
  const motivTxt= isPracticing
    ? 'Читай Коран каждый день — даже одна сура приносит награду'
    : 'Выучи больше сур — это укрепит твой намаз'

  return (
    <div style={sw.progressWrap}>
      <div style={sw.progressTitle}>{title}</div>
      <div style={sw.progressSub}>{motivTxt}</div>

      {/* Суры */}
      <div style={sw.progressRow}>
        <div style={sw.progressRowLeft}>
          <span style={sw.rowIcon}>📖</span>
          <div style={sw.rowText}>
            <div style={sw.rowLabel}>{surahLbl}</div>
            <div style={sw.rowBar}><div style={{ ...sw.rowFill, width: surahPct + '%' }} /></div>
            <div style={sw.rowCount}>{surahCount} из 10 текстов · {surahPct}%</div>
          </div>
        </div>
        <button style={sw.rowBtn} onClick={onOpenSurahs}>{surahBtn} →</button>
      </div>

      {/* Намаз */}
      <div style={{ ...sw.progressRow, marginBottom: 0 }}>
        <div style={sw.progressRowLeft}>
          <span style={sw.rowIcon}>🕌</span>
          <div style={sw.rowText}>
            <div style={sw.rowLabel}>Намаз</div>
            <div style={sw.rowBar}>
              <div style={{ ...sw.rowFill, width: Math.min(streak / 30 * 100, 100) + '%', background: '#ff9f43' }} />
            </div>
            <div style={sw.rowCount}>
              {streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд` : 'Начни сегодня'}
            </div>
          </div>
        </div>
        <button style={{ ...sw.rowBtn, color: '#ff9f43', borderColor: 'rgba(255,159,67,.3)', background: 'rgba(255,159,67,.1)' }}
          onClick={onOpenPrayer}>Расписание →</button>
      </div>
    </div>
  )
}

// ── Виджет пути мусульманина (для главного экрана) ───────────────────────────
export function MuslimPathWidget({ streak, donePrayers, level, onOpen }) {
  const todayDone    = donePrayers?.size || 0
  const isPracticing = level === 'practicing'
  const lastRead = (() => {
    try { return JSON.parse(localStorage.getItem('quran_last_read') || 'null') }
    catch { return null }
  })()

  return (
    <button style={mw.wrap} onClick={onOpen}>
      <div style={mw.icon}>{isPracticing ? '🌳' : '🌿'}</div>
      <div style={mw.body}>
        <div style={mw.title}>{isPracticing ? 'Твой ибадат' : 'Путь мусульманина'}</div>
        <div style={mw.statsRow}>
          <span style={mw.stat}>🔥 {streak} дн. подряд</span>
          <span style={mw.sep}>·</span>
          <span style={mw.stat}>🕌 {todayDone}/5 сегодня</span>
        </div>
        <div style={mw.lastRead}>
          {lastRead ? `📚 Последнее: ${lastRead.ru}` : '📚 Открой Коран'}
        </div>
      </div>
      <span style={mw.arrow}>›</span>
    </button>
  )
}

// ── Полноэкранный путь мусульманина ───────────────────────────────────────────
export function MuslimPath({ streak, weekDone, donePrayers, level, onClose, onOpenPrayer, onOpenQuran, onContinueQuran }) {
  const todayDone    = donePrayers?.size || 0
  const isPracticing = level === 'practicing'
  const lastRead     = (() => {
    try { return JSON.parse(localStorage.getItem('quran_last_read') || 'null') }
    catch { return null }
  })()

  return (
    <div style={ms.wrap}>
      {/* Шапка */}
      <div style={ms.head}>
        <button style={ms.backBtn} onClick={onClose}>‹</button>
        <div style={ms.headMid}>
          <div style={ms.headTitle}>Путь мусульманина</div>
          <div style={ms.headSub}>{isPracticing ? 'Соблюдаю · Ищу общину' : 'Мусульманин · Расту'}</div>
        </div>
      </div>

      <div style={ms.scroll} className="scroll-y">

        {/* Обзор */}
        <div style={ms.overviewCard}>
          <div style={ms.overviewRow}>
            <div style={ms.overviewItem}>
              <div style={ms.overviewVal}>{streak}</div>
              <div style={ms.overviewLabel}>Дней подряд</div>
            </div>
            <div style={ms.overviewDivider} />
            <div style={ms.overviewItem}>
              <div style={ms.overviewVal}>{todayDone}<span style={ms.overviewOf}>/5</span></div>
              <div style={ms.overviewLabel}>Сегодня</div>
            </div>
            <div style={ms.overviewDivider} />
            <div style={ms.overviewItem}>
              <div style={ms.overviewVal}>{weekDone?.filter(Boolean).length || 0}<span style={ms.overviewOf}>/7</span></div>
              <div style={ms.overviewLabel}>Дней недели</div>
            </div>
          </div>
        </div>

        {/* Намаз */}
        <div style={ms.sLabel}>🕌 Намаз</div>
        <div style={ms.card}>
          <div style={ms.cardTop}>
            <div>
              <div style={ms.cardTitle}>
                {streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд` : 'Читай намаз каждый день'}
              </div>
              <div style={ms.cardSub}>
                {streak === 0 ? 'Намаз — это твой разговор с Аллахом'
                  : streak < 7 ? 'Хороший старт — продолжай!'
                  : 'МашАллах — ты постоянен!'}
              </div>
            </div>
            <button style={ms.cardBtn} onClick={onOpenPrayer}>Расписание →</button>
          </div>
          <div style={ms.weekRow}>
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d, i) => (
              <div key={i} style={ms.weekDay}>
                <div style={{ ...ms.weekCircle, background: weekDone?.[i] ? '#c9a84c' : 'rgba(255,255,255,.07)', borderColor: weekDone?.[i] ? '#c9a84c' : 'rgba(255,255,255,.13)' }}>
                  {weekDone?.[i] && <span style={{ fontSize: 9, color: '#070710', fontWeight: 800 }}>✓</span>}
                </div>
                <div style={{ ...ms.weekLabel, color: weekDone?.[i] ? 'var(--gold)' : 'var(--text-muted)' }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={ms.bar}><div style={{ ...ms.barFill, width: Math.min(streak / 30 * 100, 100) + '%', background: '#ff9f43' }} /></div>
          <div style={ms.barLabel}>До 30 дней — осталось {Math.max(30 - streak, 0)} дн.</div>
        </div>

        {/* Коран */}
        <div style={ms.sLabel}>📚 Чтение Корана</div>
        {lastRead ? (
          <div style={ms.quranCard}>
            <div style={ms.quranCardLeft}>
              <div style={ms.quranAr} className="arabic gold-shimmer">{lastRead.ar}</div>
            </div>
            <div style={ms.quranText}>
              <div style={ms.quranLabel}>Продолжить чтение</div>
              <div style={ms.quranTitle}>{lastRead.ru}</div>
              <div style={ms.quranSub}>{lastRead.suraId}-я сура · {lastRead.ayats} аятов</div>
              <div style={ms.quranDate}>
                {(() => {
                  const d = new Date(lastRead.date)
                  return `Читал ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
                })()}
              </div>
            </div>
            <button style={ms.quranContinueBtn} onClick={() => onContinueQuran(lastRead.suraId)}>
              Читать →
            </button>
          </div>
        ) : (
          <button style={ms.quranCardEmpty} onClick={onOpenQuran}>
            <div style={ms.quranAr} className="arabic gold-shimmer">اقرأ</div>
            <div style={ms.quranText}>
              <div style={ms.quranTitle}>Открыть Коран</div>
              <div style={ms.quranSub}>Читай по одной суре каждый день</div>
            </div>
            <span style={ms.quranArrow}>›</span>
          </button>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 16px 12px', borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1,
  },
  headMid:   { flex: 1 },
  headTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text)' },
  headSub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },

  scroll: { flex: 1, overflowY: 'auto', padding: '12px 16px 0' },

  // Прогресс-карточка
  progressCard: {
    borderRadius: 18, border: '1px solid rgba(201,168,76,.3)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',
    padding: '16px', marginBottom: 14,
  },
  progressTop:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progressLeft:  { flex: 1 },
  progressTitle: { fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 },
  progressSub:   { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 },
  progressCircle:{ flexShrink: 0 },
  progressTrack: { height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)' },
  progressFill:  { height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#9a6a10,#c9a84c)', transition: 'width .5s ease' },

  // Поздравление
  celebCard: {
    borderRadius: 18, border: '1px solid rgba(201,168,76,.4)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))',
    padding: '20px 16px', textAlign: 'center', marginBottom: 14,
  },
  celebEmoji: { fontSize: 44, marginBottom: 8 },
  celebTitle: { fontSize: 18, fontWeight: 800, color: 'var(--gold)', marginBottom: 8 },
  celebText:  { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },

  // Карточка шага
  stepCard: {
    borderRadius: 16, border: '1px solid',
    padding: '14px', marginBottom: 10,
    display: 'flex', gap: 12, alignItems: 'flex-start',
    transition: 'border-color .2s',
  },
  stepNum: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 800, transition: 'all .2s',
  },
  stepBody:   { flex: 1, minWidth: 0 },
  stepHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  stepIcon:   { fontSize: 16, flexShrink: 0 },
  stepTitle:  { fontSize: 14, fontWeight: 700, lineHeight: 1.3, transition: 'color .2s' },
  currBadge:  {
    fontSize: 8, fontWeight: 800, letterSpacing: '.06em',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#070710', borderRadius: 6, padding: '2px 6px', flexShrink: 0,
  },
  stepDesc:  { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 },
  stepHint:  {
    fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4,
    background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.15)',
    borderRadius: 8, padding: '6px 10px', marginBottom: 8,
  },
  stepBtns:  { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  openBtn: {
    fontSize: 12, fontWeight: 600, color: 'var(--gold)',
    background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
  },
  doneBtn: {
    fontSize: 12, fontWeight: 600, color: '#52b788',
    background: 'rgba(82,183,136,.1)', border: '1px solid rgba(82,183,136,.3)',
    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
  },
  doneMark: { fontSize: 11, color: 'var(--gold)', fontWeight: 600 },

  disclaimer: {
    marginTop: 4, marginBottom: 4, padding: '12px 14px',
    borderRadius: 12, border: '1px solid var(--border)',
    background: 'rgba(255,255,255,.02)',
    fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
  },

  // Карточка изучения сур
  surahSection: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 16, border: '1px solid rgba(201,168,76,.3)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',
    padding: '14px', marginBottom: 10,
    cursor: 'pointer', outline: 'none', textAlign: 'left',
    fontFamily: 'var(--font-ui)',
  },
  surahSectionIcon: { fontSize: 28, flexShrink: 0 },
  surahSectionBody: { flex: 1, minWidth: 0 },
  surahSectionHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 3,
  },
  surahSectionTitle: { fontSize: 14, fontWeight: 700, color: 'var(--gold)' },
  surahSectionPct:   { fontSize: 11, fontWeight: 700, color: 'var(--gold)' },
  surahSectionSub:   { fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, lineHeight: 1.4 },
  surahSectionTrack: {
    height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)',
  },
  surahSectionFill: {
    height: 4, borderRadius: 2,
    background: 'linear-gradient(90deg,#9a6a10,#c9a84c)', transition: 'width .4s ease',
  },
  surahSectionArrow: { fontSize: 22, color: 'rgba(255,255,255,.2)', flexShrink: 0 },
}

const sw = {
  // ── Новый виджет seeker (карточка текущего шага) ──
  wrap: {
    borderRadius: 20, border: '1.5px solid rgba(201,168,76,.35)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',
    padding: '16px', fontFamily: 'var(--font-ui)',
  },
  topRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  topLeft: {},
  pathLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'rgba(201,168,76,.6)', textTransform: 'uppercase', marginBottom: 3 },
  stepCounter: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  pctBadge: {
    fontSize: 13, fontWeight: 800, color: 'var(--gold)',
    background: 'rgba(201,168,76,.15)', borderRadius: 10,
    padding: '3px 10px',
  },
  dotsRow: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14 },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    transition: 'all .3s ease', flexShrink: 0,
  },
  // Текущий шаг
  currentCard: {},
  currentTop: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 },
  currentIcon: { fontSize: 36, flexShrink: 0 },
  currentMeta: {},
  currentNum: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 },
  currentTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text)' },
  currentHint: {
    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
    marginBottom: 14,
    padding: '10px 12px',
    background: 'rgba(255,255,255,.04)',
    borderRadius: 10,
    borderLeft: '2px solid rgba(201,168,76,.4)',
  },
  startBtn: {
    width: '100%', padding: '13px 0',
    borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },
  // Завершение
  doneCard: { textAlign: 'center', padding: '8px 0' },
  doneEmoji: { fontSize: 40, marginBottom: 8 },
  doneTitle: { fontSize: 17, fontWeight: 800, color: 'var(--gold)', marginBottom: 6 },
  doneSub:   { fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 },
  openBtn: {
    padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(201,168,76,.4)',
    background: 'rgba(201,168,76,.1)', color: 'var(--gold)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },

  // ── Виджет growing/practicing ──
  progressWrap: {
    borderRadius: 18, border: '1px solid var(--border)',
    background: 'var(--bg-card)', padding: '14px 16px',
    fontFamily: 'var(--font-ui)',
  },
  progressTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  progressSub:   { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 12 },
  progressRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    paddingTop: 10, marginBottom: 10,
    borderTop: '1px solid var(--border)',
  },
  progressRowLeft: { display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 },
  rowIcon:  { fontSize: 22, flexShrink: 0, marginTop: 2 },
  rowText:  { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 5 },
  rowBar:   { height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', marginBottom: 4 },
  rowFill:  { height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#9a6a10,#c9a84c)', transition: 'width .4s ease' },
  rowCount: { fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 },
  rowBtn: {
    fontSize: 11, fontWeight: 600, color: 'var(--gold)',
    background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)', flexShrink: 0,
  },
}

// ── Стили: MuslimPathWidget ───────────────────────────────────────────────────
const mw = {
  wrap: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 18, border: '1.5px solid rgba(82,183,136,.35)',
    background: 'linear-gradient(135deg,rgba(82,183,136,.1),rgba(82,183,136,.03))',
    padding: '14px 16px', cursor: 'pointer', outline: 'none', textAlign: 'left',
    fontFamily: 'var(--font-ui)',
  },
  icon:     { fontSize: 28, flexShrink: 0 },
  body:     { flex: 1, minWidth: 0 },
  title:    { fontSize: 15, fontWeight: 700, color: '#52b788', marginBottom: 4 },
  statsRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, flexWrap: 'wrap' },
  stat:     { fontSize: 11, color: 'var(--text-muted)' },
  sep:      { fontSize: 10, color: 'var(--text-muted)' },
  bar:      { height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)' },
  fill:     { height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#1a7a56,#52b788)', transition: 'width .4s ease' },
  arrow:    { fontSize: 22, color: 'rgba(255,255,255,.2)', flexShrink: 0 },
  lastRead: { fontSize: 11, color: 'var(--text-muted)', marginTop: 6 },
}

// ── Стили: MuslimPath (полноэкранный) ─────────────────────────────────────────
const ms = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 16px 12px', borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1,
  },
  headMid:   { flex: 1 },
  headTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text)' },
  headSub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  scroll:    { flex: 1, overflowY: 'auto', padding: '12px 16px 0' },

  overviewCard: {
    borderRadius: 16, border: '1px solid rgba(82,183,136,.25)',
    background: 'linear-gradient(135deg,rgba(82,183,136,.1),rgba(82,183,136,.03))',
    padding: '16px', marginBottom: 14,
  },
  overviewRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around' },
  overviewItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  overviewVal: { fontSize: 22, fontWeight: 800, color: '#52b788' },
  overviewOf: { fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 },
  overviewLabel: {
    fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '.05em',
  },
  overviewDivider: { width: 1, height: 36, background: 'rgba(255,255,255,.08)' },

  sLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.1em',
    marginBottom: 8, marginTop: 4,
  },
  card: {
    borderRadius: 16, border: '1px solid var(--border)',
    background: 'var(--bg-card)', padding: '14px', marginBottom: 10,
  },
  cardTop: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: 10, marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  cardSub:   { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 },
  cardBtn: {
    flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#52b788',
    background: 'rgba(82,183,136,.1)', border: '1px solid rgba(82,183,136,.3)',
    borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
  },

  weekRow:    { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  weekDay:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  weekCircle: {
    width: 28, height: 28, borderRadius: '50%',
    border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .2s',
  },
  weekLabel: { fontSize: 9, fontWeight: 600, transition: 'color .2s' },

  bar:      { height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' },
  barFill:  { height: 4, borderRadius: 2, transition: 'width .4s ease' },
  barLabel: { fontSize: 10, color: 'var(--text-muted)', marginTop: 6 },

  surahRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    borderRadius: 10, border: '1px solid', padding: '8px 10px', marginBottom: 6,
    transition: 'border-color .2s, background .2s',
  },
  surahNum: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 800, color: '#fff',
  },
  surahInfo:     { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  surahName:     { fontSize: 13, fontWeight: 600, flexShrink: 0, transition: 'color .2s' },
  surahAr: {
    flex: 1, textAlign: 'right', direction: 'rtl',
    fontFamily: "'Scheherazade New',serif",
    fontSize: 14, color: 'var(--text-muted)',
  },
  surahCheck: {
    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(82,183,136,.2)', border: '1.5px solid rgba(82,183,136,.6)',
    color: '#52b788', fontSize: 12, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  surahLearnBtn: {
    flexShrink: 0, fontSize: 11, fontWeight: 600,
    borderRadius: 20, padding: '4px 10px',
    border: '1px solid', cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
  },

  quranCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 16, border: '1px solid rgba(201,168,76,.3)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',
    padding: '14px', marginBottom: 10,
  },
  quranCardLeft: { flexShrink: 0 },
  quranCardEmpty: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    borderRadius: 16, border: '1px solid rgba(201,168,76,.3)',
    background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.04))',
    padding: '14px 16px', cursor: 'pointer', outline: 'none', textAlign: 'left',
    fontFamily: 'var(--font-ui)', marginBottom: 10,
  },
  quranAr: {
    fontSize: 28, direction: 'rtl', flexShrink: 0,
    fontFamily: "'Scheherazade New',serif",
  },
  quranText:         { flex: 1, minWidth: 0 },
  quranLabel:        { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 },
  quranTitle:        { fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: 2 },
  quranSub:          { fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 },
  quranDate:         { fontSize: 11, color: 'var(--text-muted)' },
  quranArrow:        { fontSize: 22, color: 'rgba(255,255,255,.2)', flexShrink: 0 },
  quranContinueBtn: {
    flexShrink: 0, fontSize: 12, fontWeight: 600, color: 'var(--gold)',
    background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.35)',
    borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
    outline: 'none', fontFamily: 'var(--font-ui)',
  },
}

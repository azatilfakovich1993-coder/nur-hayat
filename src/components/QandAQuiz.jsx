import { useState, useMemo } from 'react'
import { QUIZ_QUESTIONS } from '../data/quiz'
import { useAuth } from '../hooks/useAuth'
import { addNur } from '../utils/nur'

const TOTAL = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QandAQuiz({ onClose, onFinish }) {
  const { user, profile, setProfile } = useAuth()
  const [phase, setPhase] = useState('start') // start | quiz | result
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState([]) // {correct: bool}[]
  const [nurAwarded, setNurAwarded] = useState(0)

  function startQuiz() {
    const q = shuffle(QUIZ_QUESTIONS).slice(0, TOTAL)
    setQuestions(q)
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setResults([])
    setPhase('quiz')
  }

  function handleSelect(idx) {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
  }

  function handleNext() {
    const correct = selected === questions[current].correct
    const newResults = [...results, { correct }]
    setResults(newResults)

    if (current + 1 < TOTAL) {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      // Финиш
      const score = newResults.filter(r => r.correct).length
      let nur = 5
      if (score >= 7) nur = 50
      else if (score >= 4) nur = 20
      setNurAwarded(nur)
      addNur(nur, user, profile, setProfile)
      setPhase('result')
      onFinish?.() // сообщаем BeginnerPath что квиз завершён
    }
  }

  if (phase === 'start') return <StartScreen onStart={startQuiz} onClose={onClose} />
  if (phase === 'result') {
    const score = results.filter(r => r.correct).length
    return <ResultScreen score={score} nur={nurAwarded} onRetry={startQuiz} onClose={onClose} />
  }

  const q = questions[current]
  const progress = ((current) / TOTAL) * 100

  return (
    <div style={s.wrap}>
      {/* Шапка */}
      <div style={s.head}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={s.progressWrap}>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>
          <span style={s.progressLabel}>{current + 1} / {TOTAL}</span>
        </div>
        <div style={s.catTag}>{q.category}</div>
      </div>

      <div style={s.body} className="scroll-y">
        {/* Вопрос */}
        <div style={s.questionCard}>
          <div style={s.questionNum}>Вопрос {current + 1}</div>
          <div style={s.questionText}>{q.question}</div>
        </div>

        {/* Варианты */}
        <div style={s.options}>
          {q.options.map((opt, i) => {
            let style = s.option
            if (answered) {
              if (i === q.correct)        style = { ...s.option, ...s.optCorrect }
              else if (i === selected)    style = { ...s.option, ...s.optWrong }
              else                        style = { ...s.option, ...s.optDim }
            } else if (i === selected) {
              style = { ...s.option, ...s.optSelected }
            }
            return (
              <button key={i} style={style} onClick={() => handleSelect(i)} disabled={answered}>
                <span style={s.optLetter}>{['А','Б','В','Г'][i]}</span>
                <span style={s.optText}>{opt}</span>
                {answered && i === q.correct && <span style={s.optIcon}>✓</span>}
                {answered && i === selected && i !== q.correct && <span style={s.optIcon}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* Объяснение */}
        {answered && (
          <div style={{
            ...s.explanation,
            borderColor: selected === q.correct ? 'rgba(82,183,136,.4)' : 'rgba(232,67,147,.3)',
            background: selected === q.correct ? 'rgba(82,183,136,.08)' : 'rgba(232,67,147,.06)',
          }}>
            <div style={s.explIcon}>{selected === q.correct ? '✅' : 'ℹ️'}</div>
            <div style={s.explText}>{q.explanation}</div>
          </div>
        )}

        {answered && (
          <button style={s.nextBtn} onClick={handleNext}>
            {current + 1 < TOTAL ? 'Следующий вопрос →' : 'Завершить квиз →'}
          </button>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}

function StartScreen({ onStart, onClose }) {
  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={s.centerBody}>
        <div style={s.startEmoji}>🎯</div>
        <div style={s.startTitle}>Исламский квиз</div>
        <div style={s.startSub}>Проверь свои знания об исламе</div>

        <div style={s.startInfo}>
          {[
            ['📝', `${TOTAL} вопросов`],
            ['🔀', 'Каждый раз новые вопросы'],
            ['💡', 'Объяснение после каждого ответа'],
            ['◉', 'НУР за правильные ответы'],
          ].map(([icon, text], i) => (
            <div key={i} style={s.startInfoRow}>
              <span style={s.startInfoIcon}>{icon}</span>
              <span style={s.startInfoText}>{text}</span>
            </div>
          ))}
        </div>

        <div style={s.nurTable}>
          <div style={s.nurTableTitle}>Награды НУР</div>
          {[
            ['7–10 правильных', '+50 НУР', '#52b788'],
            ['4–6 правильных',  '+20 НУР', '#c9a84c'],
            ['0–3 правильных',  '+5 НУР',  '#888'],
          ].map(([label, nur, color], i) => (
            <div key={i} style={s.nurRow}>
              <span style={s.nurLabel}>{label}</span>
              <span style={{ ...s.nurValue, color }}>{nur}</span>
            </div>
          ))}
        </div>

        <button style={s.startBtn} onClick={onStart}>Начать →</button>
      </div>
    </div>
  )
}

function ResultScreen({ score, nur, onRetry, onClose }) {
  const pct = Math.round((score / TOTAL) * 100)
  const isGood = score >= 7
  const isMid  = score >= 4

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={s.centerBody}>
        <div style={s.startEmoji}>{isGood ? '🏆' : isMid ? '👍' : '📚'}</div>
        <div style={s.startTitle}>
          {isGood ? 'МашАллах!' : isMid ? 'Хорошо!' : 'Продолжай учиться!'}
        </div>

        <div style={s.scoreCircle}>
          <div style={s.scoreNum}>{score}</div>
          <div style={s.scoreOf}>из {TOTAL}</div>
        </div>

        <div style={s.nurAwarded}>
          <span style={s.nurAwardedIcon}>◉</span>
          <span style={s.nurAwardedText}>+{nur} НУР начислено</span>
        </div>

        <div style={s.resultMsg}>
          {isGood
            ? 'Отличный результат! Твои знания об исламе на высоте.'
            : isMid
            ? 'Неплохо! Продолжай изучать — каждый шаг приближает к знанию.'
            : 'Не расстраивайся — изучи разделы «Знания» и попробуй снова.'}
        </div>

        <button style={s.startBtn} onClick={onRetry}>Пройти ещё раз →</button>
        <button style={s.retrySecondary} onClick={onClose}>Закрыть</button>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
  head: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none',
  },
  progressWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  progressBar:  { flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#9a6a10,#c9a84c)', transition: 'width .4s ease' },
  progressLabel:{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 },
  catTag: {
    fontSize: 11, fontWeight: 700, color: 'var(--gold)',
    background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 20, padding: '3px 10px', flexShrink: 0,
  },

  body: { flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 },

  questionCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '20px',
  },
  questionNum:  { fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 },
  questionText: { fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 },

  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
    outline: 'none', textAlign: 'left', transition: 'all .2s',
  },
  optSelected: {
    borderColor: 'rgba(201,168,76,.6)',
    background: 'rgba(201,168,76,.1)',
  },
  optCorrect: {
    borderColor: 'rgba(82,183,136,.6)',
    background: 'rgba(82,183,136,.12)',
    cursor: 'default',
  },
  optWrong: {
    borderColor: 'rgba(232,67,147,.5)',
    background: 'rgba(232,67,147,.08)',
    cursor: 'default',
  },
  optDim: {
    opacity: .4, cursor: 'default',
  },
  optLetter: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
  },
  optText: { flex: 1, fontSize: 15, color: 'var(--text)', lineHeight: 1.3 },
  optIcon: { fontSize: 16, flexShrink: 0 },

  explanation: {
    borderRadius: 16, border: '1px solid',
    padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
  },
  explIcon: { fontSize: 18, flexShrink: 0 },
  explText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },

  nextBtn: {
    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },

  // Start & Result
  centerBody: {
    flex: 1, overflowY: 'auto', padding: '24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  startEmoji: { fontSize: 64 },
  startTitle: { fontSize: 26, fontWeight: 800, color: 'var(--text)', textAlign: 'center' },
  startSub:   { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginTop: -8 },

  startInfo: {
    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  startInfoRow:  { display: 'flex', alignItems: 'center', gap: 12 },
  startInfoIcon: { fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 },
  startInfoText: { fontSize: 14, color: 'var(--text)' },

  nurTable: {
    width: '100%', background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,.25)',
    borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  nurTableTitle: { fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 },
  nurRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  nurLabel: { fontSize: 14, color: 'var(--text-muted)' },
  nurValue: { fontSize: 15, fontWeight: 700 },

  startBtn: {
    width: '100%', padding: '16px', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },

  // Result
  scoreCircle: {
    width: 120, height: 120, borderRadius: '50%',
    background: 'rgba(201,168,76,.1)', border: '3px solid rgba(201,168,76,.4)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 30px rgba(201,168,76,.2)',
  },
  scoreNum: { fontSize: 40, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 },
  scoreOf:  { fontSize: 13, color: 'var(--text-muted)' },

  nurAwarded: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 30, padding: '10px 20px',
  },
  nurAwardedIcon: { fontSize: 20, color: 'var(--gold)' },
  nurAwardedText: { fontSize: 18, fontWeight: 700, color: 'var(--gold)' },

  resultMsg: {
    fontSize: 14, color: 'var(--text-muted)', textAlign: 'center',
    lineHeight: 1.6, maxWidth: 280,
  },
  retrySecondary: {
    width: '100%', padding: '14px', borderRadius: 16,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 15,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
  },
}

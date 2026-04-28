import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

const PARTS = [
  {
    ar: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    translit: 'Ля иляха илляллах',
    title: 'Нет божества, кроме Аллаха',
    text: 'Это признание единственности Аллаха — Таухид. Не существует ничего достойного поклонения, кроме Него. Ни человек, ни природа, ни деньги, ни страх — ничто не заслуживает того, что заслуживает только Аллах.',
    color: '#C9A84C',
  },
  {
    ar: 'مُحَمَّدٌ رَسُولُ ٱللَّٰهِ',
    translit: 'Мухаммадун расулюллах',
    title: 'Мухаммад — Посланник Аллаха',
    text: 'Это признание пророчества. Мухаммад ﷺ — последний пророк, посланный ко всему человечеству. Принять его — значит принять его путь (Сунну) как руководство для жизни.',
    color: '#7B6BAE',
  },
]

// Проверить было ли уже подтверждение
export function isShahadaConfirmed() {
  return !!localStorage.getItem('shahada_confirmed')
}

export default function Shahada({ onClose, onConfirm }) {
  const { saveProgress } = useAuth()
  const [expanded,  setExpanded]  = useState(null)
  const [confirmed, setConfirmed] = useState(isShahadaConfirmed)
  const [showMoment, setShowMoment] = useState(false)

  function handleConfirm() {
    localStorage.setItem('shahada_confirmed', '1')
    setConfirmed(true)
    setShowMoment(true)
    onConfirm?.()
    saveProgress?.()
  }

  if (showMoment) {
    return <ShahadaMoment onClose={() => { setShowMoment(false); onClose() }} />
  }

  return (
    <div style={s.wrap}>
      {/* Шапка */}
      <div style={s.head}>
        <button style={s.backBtn} onClick={onClose}>‹</button>
        <div style={s.headMid}>
          <div style={s.headTitle}>Шахада</div>
          <div style={s.headSub}>Свидетельство веры</div>
        </div>
        {confirmed && <div style={s.confirmedBadge}>✓ Подтверждена</div>}
      </div>

      <div style={s.scroll} className="scroll-y">

        <div style={s.intro}>
          Шахада — это первый столп ислама. Именно она делает человека мусульманином. Произнести её с искренним убеждением в сердце — это всё, что требуется.
        </div>

        {/* Полный текст шахады */}
        <div style={s.shahadaCard}>
          <div style={s.shahadaGlow} />
          <div style={s.shahadaAr} className="arabic gold-shimmer">
            أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ
          </div>
          <div style={s.shahadaTranslit}>
            Ашхаду алля иляха илляллах, ва ашхаду анна Мухаммадан расулюллах
          </div>
          <div style={s.shahadaDivider} />
          <div style={s.shahadaTranslation}>
            «Я свидетельствую, что нет божества, кроме Аллаха, и свидетельствую, что Мухаммад — Его Посланник»
          </div>
        </div>

        {/* Две части */}
        <div style={s.sLabel}>Две части шахады</div>
        {PARTS.map((p, i) => (
          <button
            key={i}
            style={{ ...s.partCard, borderColor: expanded === i ? p.color + '60' : 'var(--border)' }}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div style={s.partTop}>
              <div style={s.partAr} className="arabic">{p.ar}</div>
              <div style={{ ...s.partTranslit, color: p.color }}>{p.translit}</div>
              <div style={s.partTitle}>{p.title}</div>
              <span style={{ ...s.partArrow, transform: expanded === i ? 'rotate(90deg)' : 'none' }}>›</span>
            </div>
            {expanded === i && (
              <div style={s.partText}>{p.text}</div>
            )}
          </button>
        ))}

        {/* Важно */}
        <div style={s.noteCard}>
          <div style={s.noteIcon}>💡</div>
          <div style={s.noteText}>
            <strong>Важно:</strong> Шахада действительна только с искренним убеждением в сердце. Если сердце принимает — этого достаточно.
          </div>
        </div>

        {/* Хадис */}
        <div style={s.hadithCard}>
          <div style={s.hadithAr} className="arabic">مَنْ قَالَ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ دَخَلَ ٱلْجَنَّةَ</div>
          <div style={s.hadithText}>
            «Тот, кто скажет "Нет божества, кроме Аллаха" — войдёт в Рай»
          </div>
          <div style={s.hadithSource}>— Пророк Мухаммад ﷺ (Бухари, Муслим)</div>
        </div>

        {/* После принятия */}
        <div style={s.afterCard}>
          <div style={s.afterTitle}>После произнесения шахады</div>
          {[
            'Все прошлые грехи прощаются — начинаешь с чистого листа',
            'Желательно совершить полное омовение (гусль)',
            'Начни изучать основы — намаз, Коран, 5 столпов',
            'Обратись в местную мечеть — братья и сёстры помогут',
          ].map((item, i) => (
            <div key={i} style={s.afterItem}>
              <span style={s.afterDot}>✦</span>
              <span style={s.afterText}>{item}</span>
            </div>
          ))}
        </div>

        {/* Кнопка подтверждения */}
        {!confirmed ? (
          <button style={s.confirmBtn} onClick={handleConfirm}>
            <span style={s.confirmBtnAr} className="arabic">أَشْهَدُ</span>
            Я произнёс шахаду с убеждением
          </button>
        ) : (
          <div style={s.alreadyConfirmed}>
            <span style={s.alreadyIcon}>⭐</span>
            <div>
              <div style={s.alreadyTitle}>Шахада подтверждена</div>
              <div style={s.alreadySub}>Бейдж «Свидетель» сохранён в профиле</div>
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}

// ── Экран-момент после произнесения шахады ────────────────────────────────────
function ShahadaMoment({ onClose }) {
  const [phase, setPhase] = useState(0) // 0=появление, 1=полный текст, 2=поздравление

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={sm.wrap}>
      {/* Свечение фона */}
      <div style={{ ...sm.glow, opacity: phase >= 1 ? 1 : 0 }} />

      {/* Частицы */}
      {phase >= 1 && SPARKS_SH.map((sp, i) => (
        <div key={i} style={{ ...sm.spark, ...sp, animationDelay: `${i * 0.12}s` }} />
      ))}

      <div style={sm.content}>
        {/* Фаза 1: Арабский текст шахады */}
        <div style={{ ...sm.shahadaWrap, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'scale(1)' : 'scale(0.8)' }}>
          <div style={sm.shahadaAr} className="arabic">
            أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ
          </div>
          <div style={sm.shahadaLine} />
          <div style={sm.shahadaAr} className="arabic">
            وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ
          </div>
        </div>

        {/* Фаза 2: Поздравление */}
        {phase >= 2 && (
          <div style={sm.congrats}>
            <div style={sm.welcomeAr} className="arabic">أَهْلًا وَسَهْلًا</div>
            <div style={sm.welcomeRu}>Добро пожаловать</div>

            {/* Бейдж */}
            <div style={sm.badge}>
              <span style={sm.badgeStar}>⭐</span>
              <div style={sm.badgeText}>
                <div style={sm.badgeTitle}>Свидетель</div>
                <div style={sm.badgeSub}>Особый бейдж получен</div>
              </div>
            </div>

            {/* НУР */}
            <div style={sm.nur}>
              <span style={sm.nurIcon}>◉</span>
              <span style={sm.nurAmt}>+150 НУР</span>
            </div>

            {/* Хадис */}
            <div style={sm.hadith}>
              «Ислам стирает всё, что было до него»
              <div style={sm.hadithSrc}>— Пророк Мухаммад ﷺ (Муслим)</div>
            </div>

            <button style={sm.closeBtn} onClick={onClose}>
              АльхамдулиЛлях!
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shahadaSpark {
          0%   { opacity:1; transform:translate(0,0) scale(1) }
          100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0) }
        }
        @keyframes shahadaGlow {
          0%,100% { opacity:.4 }
          50%     { opacity:.8 }
        }
      `}</style>
    </div>
  )
}

const SPARKS_SH = [
  { top:'15%', left:'8%',   '--tx':'-60px','--ty':'-40px', background:'#FFD700', width:10, height:10, borderRadius:'50%', position:'absolute', animation:'shahadaSpark 1.5s ease-out infinite' },
  { top:'10%', right:'10%', '--tx': '55px','--ty':'-50px', background:'#C9A84C', width:8,  height:8,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 1.8s ease-out infinite' },
  { top:'5%',  left:'45%',  '--tx':  '0px','--ty':'-70px', background:'#FFD700', width:7,  height:7,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 1.3s ease-out infinite' },
  { top:'20%', left:'20%',  '--tx':'-40px','--ty':'-30px', background:'#F0D080', width:6,  height:6,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 2.0s ease-out infinite' },
  { top:'8%',  right:'30%', '--tx': '35px','--ty':'-45px', background:'#C9A84C', width:9,  height:9,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 1.6s ease-out infinite' },
  { top:'18%', left:'55%',  '--tx': '50px','--ty':'-35px', background:'#FFD700', width:7,  height:7,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 1.9s ease-out infinite' },
  { top:'12%', left:'75%',  '--tx': '45px','--ty':'-55px', background:'#F0D080', width:5,  height:5,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 1.4s ease-out infinite' },
  { top:'3%',  left:'30%',  '--tx':'-20px','--ty':'-60px', background:'#C9A84C', width:6,  height:6,  borderRadius:'50%', position:'absolute', animation:'shahadaSpark 2.2s ease-out infinite' },
]

const sm = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 500,
    background: '#07070f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-ui)', overflow: 'hidden',
  },
  glow: {
    position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
    width: 400, height: 300,
    background: 'radial-gradient(ellipse, rgba(201,168,76,.25) 0%, transparent 70%)',
    filter: 'blur(40px)', pointerEvents: 'none',
    transition: 'opacity 1s ease',
    animation: 'shahadaGlow 3s ease-in-out infinite',
  },
  spark: {},
  content: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '0 24px', width: '100%', maxWidth: 420,
    zIndex: 1,
  },
  shahadaWrap: {
    textAlign: 'center', marginBottom: 32,
    transition: 'opacity .8s ease, transform .8s ease',
  },
  shahadaAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 28, color: '#C9A84C',
    textShadow: '0 0 30px rgba(201,168,76,.8), 0 0 60px rgba(201,168,76,.4)',
    direction: 'rtl', lineHeight: 2, display: 'block',
  },
  shahadaLine: {
    height: 1, background: 'rgba(201,168,76,.3)',
    margin: '8px 40px',
  },
  congrats: {
    width: '100%', textAlign: 'center',
    animation: 'fadeIn .5s ease',
  },
  welcomeAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 34, color: 'rgba(201,168,76,.9)',
    direction: 'rtl', marginBottom: 6,
    textShadow: '0 0 20px rgba(201,168,76,.4)',
  },
  welcomeRu: {
    fontSize: 18, color: 'rgba(255,255,255,.7)',
    marginBottom: 24, letterSpacing: '.04em',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    background: 'linear-gradient(135deg,rgba(201,168,76,.2),rgba(201,168,76,.08))',
    border: '1.5px solid rgba(201,168,76,.5)',
    borderRadius: 16, padding: '12px 20px',
    marginBottom: 16,
  },
  badgeStar: { fontSize: 32 },
  badgeText: { textAlign: 'left' },
  badgeTitle: { fontSize: 16, fontWeight: 800, color: 'var(--gold)' },
  badgeSub:   { fontSize: 11, color: 'rgba(201,168,76,.6)', marginTop: 2 },
  nur: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    marginBottom: 20,
  },
  nurIcon: { fontSize: 18, color: 'var(--gold)' },
  nurAmt:  { fontSize: 24, fontWeight: 900, color: 'var(--gold)' },
  hadith: {
    fontSize: 13, color: 'rgba(255,255,255,.55)',
    fontStyle: 'italic', lineHeight: 1.6,
    marginBottom: 28, padding: '0 16px',
  },
  hadithSrc: { fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 6, fontStyle: 'normal' },
  closeBtn: {
    padding: '15px 48px', borderRadius: 16, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
    boxShadow: '0 4px 20px rgba(201,168,76,.3)',
  },
}

const s = {
  wrap: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--bg-deep)',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-ui)',
  },
  head: {
    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
    padding: '18px 20px 14px',
    borderBottom: '1px solid var(--border)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1,
  },
  headMid: { flex: 1 },
  headTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text)' },
  headSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  confirmedBadge: {
    fontSize: 11, fontWeight: 700, color: '#52b788',
    background: 'rgba(82,183,136,.12)', border: '1px solid rgba(82,183,136,.3)',
    borderRadius: 20, padding: '4px 10px', flexShrink: 0,
  },

  scroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 0' },
  intro: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 },

  shahadaCard: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(201,168,76,.04))',
    border: '1px solid rgba(201,168,76,.35)', borderRadius: 20,
    padding: '24px 20px 20px', marginBottom: 20, textAlign: 'center',
  },
  shahadaGlow: {
    position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
    width: 200, height: 100,
    background: 'radial-gradient(ellipse,rgba(201,168,76,.15),transparent 70%)',
    pointerEvents: 'none',
  },
  shahadaAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 22, lineHeight: 2, marginBottom: 12, direction: 'rtl',
  },
  shahadaTranslit: { fontSize: 13, color: 'rgba(201,168,76,.8)', fontStyle: 'italic', marginBottom: 14 },
  shahadaDivider: { height: 1, background: 'rgba(201,168,76,.2)', margin: '0 0 14px' },
  shahadaTranslation: { fontSize: 15, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' },

  sLabel: {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10,
  },
  partCard: {
    width: '100%', textAlign: 'left', cursor: 'pointer',
    background: 'var(--bg-card)', borderRadius: 16,
    border: '1px solid', padding: '16px', marginBottom: 10, outline: 'none',
    transition: 'border-color .2s',
  },
  partTop: { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 4 },
  partAr: { fontFamily: "'Scheherazade New',serif", fontSize: 20, direction: 'rtl', gridColumn: '1/2', color: 'var(--gold)', lineHeight: 1.6 },
  partTranslit: { fontSize: 12, fontStyle: 'italic', gridColumn: '1/2' },
  partTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text)', gridColumn: '1/2', marginTop: 4 },
  partArrow: { fontSize: 20, color: 'var(--text-muted)', gridColumn: '2/3', gridRow: '1/4', alignSelf: 'center', transition: 'transform .2s', display: 'inline-block' },
  partText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' },

  noteCard: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  noteIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  noteText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },

  hadithCard: {
    background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)',
    padding: '18px 16px', marginBottom: 14, textAlign: 'center',
  },
  hadithAr: { fontFamily: "'Scheherazade New',serif", fontSize: 18, color: 'var(--gold)', direction: 'rtl', lineHeight: 1.8, marginBottom: 12 },
  hadithText: { fontSize: 14, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 8 },
  hadithSource: { fontSize: 11, color: 'var(--text-muted)' },

  afterCard: {
    background: 'rgba(82,183,136,.07)', border: '1px solid rgba(82,183,136,.2)',
    borderRadius: 16, padding: '16px', marginBottom: 20,
  },
  afterTitle: { fontSize: 14, fontWeight: 700, color: '#52b788', marginBottom: 12 },
  afterItem: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  afterDot: { color: '#52b788', fontSize: 10, marginTop: 4, flexShrink: 0 },
  afterText: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },

  confirmBtn: {
    width: '100%', padding: '18px 0', borderRadius: 18, border: 'none',
    background: 'linear-gradient(135deg,#9a6a10,#c9a84c)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'var(--font-ui)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    boxShadow: '0 4px 24px rgba(201,168,76,.3)',
    marginBottom: 8,
  },
  confirmBtnAr: {
    fontFamily: "'Scheherazade New',serif",
    fontSize: 22, color: 'rgba(255,255,255,.8)',
  },
  alreadyConfirmed: {
    display: 'flex', gap: 12, alignItems: 'center',
    background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.3)',
    borderRadius: 16, padding: '14px 16px', marginBottom: 8,
  },
  alreadyIcon: { fontSize: 28, flexShrink: 0 },
  alreadyTitle: { fontSize: 14, fontWeight: 700, color: 'var(--gold)' },
  alreadySub:   { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
}

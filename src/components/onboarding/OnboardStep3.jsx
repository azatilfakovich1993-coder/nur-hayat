// Персонализированный шаг — разный для каждого уровня

const PATH_STEPS = [
  { num: 1, icon: '❓', title: 'Вопросы и ответы',  desc: 'Основы веры'          },
  { num: 2, icon: '🕌', title: '5 столпов ислама',  desc: 'Фундамент'             },
  { num: 3, icon: '⭐', title: 'Шахада',             desc: 'Свидетельство веры'   },
  { num: 4, icon: '📖', title: 'Арабский алфавит',  desc: 'Язык Корана'          },
  { num: 5, icon: '📖', title: 'Сура Фатиха',       desc: 'Основа каждого намаза'},
  { num: 6, icon: '🕌', title: 'Как читать намаз',  desc: 'Пошаговый гид'        },
  { num: 7, icon: '✅', title: 'Первый намаз',       desc: 'Твой первый шаг'      },
]

const KNOWLEDGE_ITEMS = [
  { icon: '🤲', title: 'Дуа',              sub: 'Обращения к Аллаху' },
  { icon: '🌿', title: 'Азкар',            sub: 'Утренние и вечерние'  },
  { icon: '📚', title: 'Пророки',          sub: '25 пророков ислама'   },
  { icon: '📖', title: 'Глоссарий',        sub: 'Термины и понятия'    },
  { icon: '✨', title: '99 имён Аллаха',   sub: 'Асмауль Хусна'        },
  { icon: '📅', title: 'Исл. календарь',  sub: 'События и праздники'  },
]

const PRAYERS = ['Фаджр','Зухр','Аср','Магриб','Иша']

// ── Вариант для начинающего ───────────────────────────────────────────────────
function SeekerContent() {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.badge}>🌱 Для начинающих</div>
        <div style={s.title}>Твой путь новичка</div>
        <div style={s.sub}>
          Мы подготовили 7 шагов — от первого знакомства с исламом до первого намаза
        </div>
      </div>

      <div style={s.pathList}>
        {PATH_STEPS.map(step => (
          <div key={step.num} style={s.pathItem}>
            <div style={s.pathNum}>{step.num}</div>
            <div style={s.pathIcon}>{step.icon}</div>
            <div style={s.pathBody}>
              <div style={s.pathTitle}>{step.title}</div>
              <div style={s.pathDesc}>{step.desc}</div>
            </div>
          </div>
        ))}
        <div style={s.pathItem}>
          <div style={{ ...s.pathNum, background: 'rgba(201,168,76,.2)', color: 'var(--gold)' }}>🎯</div>
          <div style={s.pathIcon}> </div>
          <div style={s.pathBody}>
            <div style={{ ...s.pathTitle, color: 'var(--gold)' }}>Финальный квиз</div>
            <div style={s.pathDesc}>Проверь знания — 10 вопросов</div>
          </div>
        </div>
      </div>

      <div style={s.tip}>
        💡 Каждый шаг открывается по очереди. Проходи в своём темпе.
      </div>
    </div>
  )
}

// ── Вариант для мусульманина ──────────────────────────────────────────────────
function GrowingContent() {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={{ ...s.badge, background: 'rgba(64,145,108,.15)', color: '#40916C', border: '1px solid rgba(64,145,108,.3)' }}>
          🌿 Для тех кто растёт
        </div>
        <div style={s.title}>Раздел Знания</div>
        <div style={s.sub}>
          Всё необходимое для углубления веры — в одном месте
        </div>
      </div>

      <div style={s.knowledgeGrid}>
        {KNOWLEDGE_ITEMS.map(item => (
          <div key={item.icon} style={s.knowledgeCard}>
            <div style={s.knowledgeIcon}>{item.icon}</div>
            <div style={s.knowledgeTitle}>{item.title}</div>
            <div style={s.knowledgeSub}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.tip}>
        💡 Раздел Знания находится на экране «Обучение» в главном меню.
      </div>
    </div>
  )
}

// ── Вариант для практикующего ─────────────────────────────────────────────────
function PracticingContent() {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={{ ...s.badge, background: 'rgba(82,183,136,.15)', color: '#52B788', border: '1px solid rgba(82,183,136,.3)' }}>
          🌳 Для практикующих
        </div>
        <div style={s.title}>Намаз и Сообщество</div>
        <div style={s.sub}>
          Отслеживай намазы и общайся с братьями и сёстрами по вере
        </div>
      </div>

      {/* Мокап трекера намазов */}
      <div style={s.prayerCard}>
        <div style={s.prayerCardTitle}>🕌 Трекер намазов</div>
        <div style={s.prayerList}>
          {PRAYERS.map((name, i) => (
            <div key={name} style={s.prayerRow}>
              <span style={s.prayerName}>{name}</span>
              <div style={{
                ...s.prayerCheck,
                background: i < 3 ? 'rgba(82,183,136,.2)' : 'rgba(255,255,255,.05)',
                border: `1.5px solid ${i < 3 ? 'rgba(82,183,136,.6)' : 'var(--border)'}`,
                color: i < 3 ? '#52b788' : 'transparent',
              }}>✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Мокап чата */}
      <div style={s.chatCard}>
        <div style={s.chatHeader}>
          <span style={s.chatDot} />
          <span style={s.chatTitle}>Сообщество Нур Хаят</span>
          <span style={s.chatOnline}>47 онлайн</span>
        </div>
        <div style={s.chatMsg}>
          <span style={s.chatAvatar}>🌸</span>
          <div style={s.chatBubble}>МашАллах, сегодня прочитал все 5 💛</div>
        </div>
      </div>
    </div>
  )
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function OnboardStep3({ onNext, level }) {
  return (
    <div style={s.outerWrap}>
      <div style={s.scroll} className="scroll-y">
        {level === 'seeker'     && <SeekerContent />}
        {level === 'growing'    && <GrowingContent />}
        {level === 'practicing' && <PracticingContent />}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 12, flexShrink: 0 }} onClick={onNext}>
        Понятно →
      </button>
    </div>
  )
}

const s = {
  outerWrap: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
  scroll: { flex: 1, overflowY: 'auto', minHeight: 0 },

  wrap: { display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 4 },
  header: { marginBottom: 16 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(45,106,79,.15)', color: '#2D6A4F',
    border: '1px solid rgba(45,106,79,.3)',
    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 },

  // Seeker: path list
  pathList: { display: 'flex', flexDirection: 'column', gap: 8 },
  pathItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '10px 14px',
  },
  pathNum: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(201,168,76,.12)', border: '1.5px solid rgba(201,168,76,.3)',
    color: 'var(--gold)', fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pathIcon: { fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' },
  pathBody: { flex: 1 },
  pathTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 1 },
  pathDesc: { fontSize: 11, color: 'var(--text-muted)' },

  // Growing: knowledge grid
  knowledgeGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  knowledgeCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '14px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, textAlign: 'center',
  },
  knowledgeIcon: { fontSize: 26 },
  knowledgeTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  knowledgeSub: { fontSize: 11, color: 'var(--text-muted)' },

  // Practicing: prayer tracker
  prayerCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '14px 16px', marginBottom: 10,
  },
  prayerCardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 10 },
  prayerList: { display: 'flex', flexDirection: 'column', gap: 8 },
  prayerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  prayerName: { fontSize: 14, color: 'var(--text)' },
  prayerCheck: {
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, transition: 'all .2s',
  },

  // Practicing: chat
  chatCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '12px 16px',
  },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  chatDot: { width: 8, height: 8, borderRadius: '50%', background: '#52b788', flexShrink: 0 },
  chatTitle: { flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  chatOnline: { fontSize: 11, color: '#52b788' },
  chatMsg: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  chatAvatar: { fontSize: 22 },
  chatBubble: {
    background: 'rgba(255,255,255,.06)', borderRadius: '4px 14px 14px 14px',
    padding: '8px 12px', fontSize: 13, color: 'var(--text)', lineHeight: 1.4,
  },

  tip: {
    marginTop: 14, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
    background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)',
    borderRadius: 12, padding: '10px 14px',
  },
}

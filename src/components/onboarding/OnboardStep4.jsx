// Коран и Намаз
export default function OnboardStep4({ onNext }) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Коран и Намаз</div>
        <div style={s.sub}>Два главных раздела — они всегда под рукой</div>
      </div>

      {/* Коран */}
      <div style={s.card}>
        <div style={s.cardTop}>
          <div style={s.iconWrap}>
            <span style={s.icon}>📖</span>
          </div>
          <div>
            <div style={s.cardTitle}>Коран</div>
            <div style={s.cardSub}>Читай · Слушай · Изучай</div>
          </div>
        </div>
        <div style={s.mockQuran}>
          <div style={s.surahRow}>
            <div style={s.surahNum}>1</div>
            <div style={s.surahInfo}>
              <span style={s.surahName}>Аль-Фатиха</span>
              <span style={s.surahMeta}>7 аятов · Мекканская</span>
            </div>
            <div style={s.surahAr} className="arabic">الفاتحة</div>
          </div>
          <div style={{ ...s.surahRow, opacity: 0.6 }}>
            <div style={s.surahNum}>2</div>
            <div style={s.surahInfo}>
              <span style={s.surahName}>Аль-Бакара</span>
              <span style={s.surahMeta}>286 аятов · Мединская</span>
            </div>
            <div style={s.surahAr} className="arabic">البقرة</div>
          </div>
          <div style={{ ...s.surahRow, opacity: 0.35 }}>
            <div style={s.surahNum}>3</div>
            <div style={s.surahInfo}>
              <span style={s.surahName}>Аль-Имран</span>
              <span style={s.surahMeta}>200 аятов · Мединская</span>
            </div>
            <div style={s.surahAr} className="arabic">آل عمران</div>
          </div>
        </div>
        <div style={s.cardHint}>Все 114 сур · Аудио · Перевод · Транслитерация</div>
      </div>

      {/* Намаз */}
      <div style={{ ...s.card, marginTop: 12 }}>
        <div style={s.cardTop}>
          <div style={{ ...s.iconWrap, background: 'rgba(201,168,76,.15)' }}>
            <span style={s.icon}>🕌</span>
          </div>
          <div>
            <div style={s.cardTitle}>Намаз</div>
            <div style={s.cardSub}>Расписание · Трекер · Кибла</div>
          </div>
        </div>
        <div style={s.prayerMock}>
          {[
            { name: 'Фаджр',  time: '05:12', done: true  },
            { name: 'Зухр',   time: '13:28', done: true  },
            { name: 'Аср',    time: '17:05', done: false, next: true },
            { name: 'Магриб', time: '20:41', done: false },
            { name: 'Иша',    time: '22:15', done: false },
          ].map(p => (
            <div key={p.name} style={s.pRow}>
              <span style={{ ...s.pName, color: p.next ? 'var(--gold)' : 'var(--text)' }}>{p.name}</span>
              <span style={{ ...s.pTime, color: p.next ? 'var(--gold)' : 'var(--text-muted)' }}>{p.time}</span>
              <div style={{
                ...s.pCheck,
                background: p.done ? 'rgba(82,183,136,.2)' : 'rgba(255,255,255,.05)',
                border: `1.5px solid ${p.done ? 'rgba(82,183,136,.6)' : p.next ? 'rgba(201,168,76,.5)' : 'var(--border)'}`,
                color: p.done ? '#52b788' : 'transparent',
              }}>✓</div>
            </div>
          ))}
        </div>
        <div style={s.cardHint}>Уведомления за 15 мин · Компас Киблы · История намазов</div>
      </div>

      <div style={{ flex: 1 }} />

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onNext}>
        Дальше →
      </button>
    </div>
  )
}

const s = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column' },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--text-muted)' },

  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 18, padding: '14px 16px',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    background: 'rgba(64,145,108,.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  cardSub: { fontSize: 12, color: 'var(--text-muted)' },
  cardHint: {
    marginTop: 10, fontSize: 11, color: 'var(--text-muted)',
    borderTop: '1px solid var(--border)', paddingTop: 8,
  },

  mockQuran: { display: 'flex', flexDirection: 'column', gap: 6 },
  surahRow: { display: 'flex', alignItems: 'center', gap: 10 },
  surahNum: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)',
    color: 'var(--gold)', fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  surahInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1 },
  surahName: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  surahMeta: { fontSize: 10, color: 'var(--text-muted)' },
  surahAr: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 15, color: 'rgba(201,168,76,.7)', direction: 'rtl',
  },

  prayerMock: { display: 'flex', flexDirection: 'column', gap: 7 },
  pRow: { display: 'flex', alignItems: 'center', gap: 8 },
  pName: { flex: 1, fontSize: 13, fontWeight: 500 },
  pTime: { fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: 42, textAlign: 'right' },
  pCheck: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
}

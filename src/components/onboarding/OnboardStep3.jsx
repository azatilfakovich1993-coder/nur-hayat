const MESSAGES = [
  { id: 1, name: 'Алия', text: 'Аят сегодня попал прямо в сердце 💛', time: '09:12', avatar: '🌸' },
  { id: 2, name: 'Дамир', text: 'Маша Аллах, я тоже подумал об этом...', time: '09:15', avatar: '🌿' },
  { id: 3, name: 'Лейла', text: 'Первый раз здесь. Рада, что нашла это место 🌱', time: '09:18', avatar: '✨' },
  { id: 4, name: 'Ты',    text: '...', time: 'сейчас', avatar: '👤', isMe: true }
]

export default function OnboardStep3({ onNext }) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h3 style={s.title}>Здесь люди как ты</h3>
        <p style={s.sub}>Без осуждения. Без давления. Только живое общение.</p>
      </div>

      {/* Chat mockup */}
      <div style={s.chat}>
        <div style={s.chatHeader}>
          <div style={s.chatIcon}>🌙</div>
          <div>
            <div style={s.chatName}>Сообщество Нур Хаят</div>
            <div style={s.chatOnline}>● 47 онлайн сейчас</div>
          </div>
        </div>

        <div style={s.messages}>
          {MESSAGES.map((msg, i) => (
            <div key={msg.id} style={{
              ...s.msgRow,
              justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
              animation: `fadeSlide 0.4s ease ${i * 0.12}s both`
            }}>
              {!msg.isMe && (
                <div style={s.avatar}>{msg.avatar}</div>
              )}
              <div style={msg.isMe ? s.bubbleMe : s.bubbleThem}>
                {!msg.isMe && <div style={s.msgName}>{msg.name}</div>}
                <div style={{
                  ...s.msgText,
                  color: msg.isMe ? '#070710' : 'var(--text)',
                  fontStyle: msg.isMe ? 'italic' : 'normal',
                  opacity: msg.isMe ? 0.7 : 1
                }}>
                  {msg.text}
                </div>
                <div style={s.msgTime}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Fake input */}
        <div style={s.inputRow}>
          <div style={s.fakeInput}>Напиши что-нибудь...</div>
          <button style={s.sendBtn}>→</button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onNext}>
        Дальше →
      </button>

      <style>{`
        @keyframes fadeSlide {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20, flex: 1 },
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text)' },
  sub: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 },

  chat: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    flex: 1,
    display: 'flex', flexDirection: 'column'
  },
  chatHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)'
  },
  chatIcon: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, #C9A84C30, #C9A84C10)',
    border: '1px solid rgba(201,168,76,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
  },
  chatName: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  chatOnline: { fontSize: 11, color: 'var(--green-light)', marginTop: 1 },

  messages: {
    padding: 12, display: 'flex', flexDirection: 'column', gap: 10, flex: 1,
    overflowY: 'hidden'
  },
  msgRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--bg-surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0
  },
  bubbleThem: {
    background: 'var(--bg-surface)',
    borderRadius: '16px 16px 16px 4px',
    padding: '8px 12px', maxWidth: '75%'
  },
  bubbleMe: {
    background: 'linear-gradient(135deg, #C9A84C, #F0D080)',
    borderRadius: '16px 16px 4px 16px',
    padding: '8px 12px', maxWidth: '75%'
  },
  msgName: { fontSize: 11, color: 'var(--gold-dim)', marginBottom: 2, fontWeight: 500 },
  msgText: { fontSize: 14, lineHeight: 1.4 },
  msgTime: { fontSize: 10, color: 'rgba(128,120,100,0.7)', marginTop: 3, textAlign: 'right' },

  inputRow: {
    display: 'flex', gap: 8, padding: 12,
    borderTop: '1px solid var(--border)'
  },
  fakeInput: {
    flex: 1,
    background: 'var(--bg-surface)',
    borderRadius: 20, padding: '10px 14px',
    fontSize: 13, color: 'var(--text-dim)',
    border: '1px solid var(--border)'
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--gold)', color: '#070710',
    border: 'none', cursor: 'pointer',
    fontSize: 16, fontWeight: 700
  }
}

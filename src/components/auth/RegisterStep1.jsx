import { useState } from 'react'

export default function RegisterStep1({ data, onNext }) {
  const [name,     setName]     = useState(data.name     || '')
  const [email,    setEmail]    = useState(data.email    || '')
  const [password, setPassword] = useState(data.password || '')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState('')

  function validate() {
    if (name.trim().length < 2)    return 'Введите имя (минимум 2 символа)'
    if (!email.includes('@'))      return 'Введите корректный email'
    if (password.length < 6)       return 'Пароль — минимум 6 символов'
    return ''
  }

  function handleNext() {
    const err = validate()
    if (err) { setError(err); return }
    onNext({ name: name.trim(), email: email.trim().toLowerCase(), password })
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.step}>Шаг 1 из 3</div>
        <h2 style={s.title}>Создай аккаунт</h2>
        <p style={s.sub}>Твой путь начинается здесь</p>
      </div>

      <div style={s.form}>
        <Field label="Имя" type="text" value={name} onChange={setName}
               placeholder="Как тебя зовут?" autoFocus />
        <Field label="Email" type="email" value={email} onChange={setEmail}
               placeholder="your@email.com" />
        <div style={s.passWrap}>
          <Field label="Пароль" type={show ? 'text' : 'password'}
                 value={password} onChange={setPassword} placeholder="Минимум 6 символов" />
          <button style={s.eyeBtn} onClick={() => setShow(v => !v)} type="button">
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
      </div>

      <button className="btn btn-primary" onClick={handleNext} style={s.btn}>
        Далее →
      </button>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, autoFocus }) {
  return (
    <div className="input-wrap">
      <label className="input-label">{label}</label>
      <input
        className="input-field"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0', flex: 1
  },
  header: { display: 'flex', flexDirection: 'column', gap: 6 },
  step: { fontSize: 12, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: 600, color: 'var(--text)' },
  sub: { fontSize: 14, color: 'var(--text-muted)' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-2px)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4
  },
  btn: { marginTop: 'auto' }
}

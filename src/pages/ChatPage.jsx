import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase/client'

// ── Анимированные эмодзи (Google Noto Animated) ───────────────
// Конвертация символа в hex-код для URL
function emojiHex(emoji) {
  const pts = []
  for (const ch of emoji) {
    const cp = ch.codePointAt(0)
    if (cp && cp !== 0xFE0F) pts.push(cp.toString(16))
  }
  return pts.join('_')
}
function notoUrl(emoji) {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${emojiHex(emoji)}/512.gif`
}

const EMOJI_CATS = [
  {
    icon: '🕋', label: 'Ислам',
    list: ['🕋','🕌','🌙','⭐','🤲','📖','🕊️','✨','🌟','💫','🙏','🌹','💚','🤍','🌿','🌺','🌸','📿','🪔','🧿']
  },
  {
    icon: '😊', label: 'Смайлики',
    list: ['😀','😂','🥰','😍','🤩','😭','😢','😅','🤣','😇','🥹','🤗','😌','🙂','😏','🤔','😮','🤯','🥺','😎',
           '😴','🤧','🤒','😤','😡','🤬','😈','👿','💀','👻','🙈','🙉','🙊','💩','🤡','👾']
  },
  {
    icon: '👍', label: 'Жесты',
    list: ['👍','👎','👏','🙌','🤝','💪','✋','🤚','👌','🤌','🫶','🤙','☝️','✌️','🤞','🖖','🫵','🫂',
           '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💯','🔥','⚡','💥']
  },
  {
    icon: '🌿', label: 'Природа',
    list: ['🌿','🍃','🌊','⛅','🌈','🍀','🌻','🌷','🌴','🦋','🌙','⭐','🌟','🌺','🌸','🐦','🦚','🌾','🍂','🌅',
           '🌍','🏔️','🌋','🏝️','🌵','🐬','🦁','🐯','🦊','🐺','🦅','🌙']
  },
  {
    icon: '🎉', label: 'Праздник',
    list: ['🎉','🎊','🎁','🎂','🎈','🏆','🥇','🎯','🎪','🎭','🎨','🎬','🎵','🎶','🎸','🥁','🎹','🎺','🎻','🎲',
           '🎮','🕹️','🎳','🏋️','🤸','⚽','🏀','🎾','🏊','🚀']
  },
]

// Один анимированный эмодзи
function AnimEmoji({ emoji, size = 36, onClick, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <button style={ep.emojiBtn} onClick={() => onClick(emoji)} className={className}>
      {failed
        ? <span style={{ fontSize: size * 0.7 }}>{emoji}</span>
        : <img
            src={notoUrl(emoji)}
            alt={emoji}
            width={size} height={size}
            style={{ display: 'block', imageRendering: 'auto' }}
            onError={() => setFailed(true)}
          />
      }
    </button>
  )
}

function EmojiPicker({ onSelect, onClose }) {
  const [cat, setCat] = useState(0)

  return (
    <div style={ep.wrap}>
      {/* Категории */}
      <div style={ep.cats}>
        {EMOJI_CATS.map((c, i) => (
          <button key={i} style={{ ...ep.catBtn, ...(cat === i ? ep.catActive : {}) }}
            onClick={() => setCat(i)} title={c.label}>
            <span style={{ fontSize: 20 }}>{c.icon}</span>
          </button>
        ))}
        <button style={ep.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Сетка анимированных эмодзи */}
      <div style={ep.grid} className="scroll-y">
        {EMOJI_CATS[cat].list.map((emoji, i) => (
          <AnimEmoji
            key={emoji + i}
            emoji={emoji}
            size={38}
            onClick={onSelect}
            className="emoji-btn"
          />
        ))}
      </div>
    </div>
  )
}

const ep = {
  wrap: {
    background: 'var(--bg-surface)',
    borderTop: '1px solid var(--border)',
    padding: '10px 12px 6px',
    animation: 'slideUp .22s ease',
    flexShrink: 0,
  },
  cats: { display: 'flex', gap: 2, marginBottom: 8, alignItems: 'center' },
  catBtn: {
    padding: '5px 8px', borderRadius: 8,
    background: 'none', border: 'none', cursor: 'pointer',
    opacity: 0.45, transition: 'opacity .15s',
  },
  catActive: { opacity: 1, background: 'rgba(201,168,76,.12)' },
  closeBtn: {
    marginLeft: 'auto', background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
    padding: '4px 8px', borderRadius: 8,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2,
    maxHeight: 180, overflowY: 'auto',
  },
  emojiBtn: {
    padding: '5px', borderRadius: 10,
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform .12s, background .12s',
  },
}

const ROOMS = [
  { id: 'general',   label: 'Общий',    icon: '🌙', desc: 'Разговоры обо всём' },
  { id: 'quran',     label: 'Коран',    icon: '📖', desc: 'Аяты, тафсир, вопросы' },
  { id: 'beginners', label: 'Новичкам', icon: '🌱', desc: 'Только начинаю' },
  { id: 'dua',       label: 'Дуа',      icon: '🤲', desc: 'Просим и благодарим' },
]

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [room,       setRoom]       = useState('general')
  const [messages,   setMessages]   = useState([])
  const [text,       setText]       = useState('')
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [sendError,  setSendError]  = useState('')
  const [online,     setOnline]     = useState(1)
  const [recording,  setRecording]  = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [uploading,  setUploading]  = useState(false)
  const [showEmoji,  setShowEmoji]  = useState(false)

  const bottomRef   = useRef()
  const inputRef    = useRef()
  const fileRef     = useRef()
  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)

  const userName = profile?.name || user?.email?.split('@')[0] || 'Аноним'

  // Загрузка сообщений + Realtime
  useEffect(() => {
    setLoading(true)
    setMessages([])

    supabase.from('messages').select('*')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(80)
      .then(({ data }) => { setMessages(data || []); setLoading(false) })

    const channel = supabase.channel('messages-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: msg }) => {
          if (msg.room === room)
            setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
        })
      .subscribe()

    setOnline(Math.floor(Math.random() * 30) + 5)
    return () => supabase.removeChannel(channel)
  }, [room])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Отправка текста ──
  async function sendMessage() {
    const content = text.trim()
    if (!content || sending || !user) return
    setSending(true); setText('')

    const { data, error } = await supabase.from('messages').insert({
      user_id: user.id, user_name: userName, content, room
    }).select().single()

    setSending(false)
    inputRef.current?.focus()

    if (error) { setSendError(`Ошибка: ${error.message}`); setTimeout(() => setSendError(''), 5000); return }
    if (data) setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
  }

  // ── Загрузка файла ──
  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''

    const ext      = file.name.split('.').pop()
    const path     = `${user.id}/${Date.now()}.${ext}`
    const fileType = file.type.startsWith('image/') ? 'image'
                   : file.type.startsWith('video/') ? 'video'
                   : file.type.startsWith('audio/') ? 'audio' : 'file'

    setUploading(true)
    const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file)
    if (upErr) { setSendError('Ошибка загрузки файла'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path)

    const { data, error } = await supabase.from('messages').insert({
      user_id: user.id, user_name: userName,
      content: fileType === 'image' ? '📷 Фото' : fileType === 'video' ? '🎥 Видео' : `📎 ${file.name}`,
      file_url: publicUrl, file_type: fileType, file_name: file.name, room
    }).select().single()

    setUploading(false)
    if (!error && data) setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
  }

  // ── Голосовое сообщение ──
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await uploadVoice(blob)
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch {
      setSendError('Нет доступа к микрофону')
      setTimeout(() => setSendError(''), 3000)
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setRecording(false)
    setRecSeconds(0)
  }

  function cancelRecording() {
    clearInterval(timerRef.current)
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.onstop = () => {}
      mediaRef.current.stop()
    }
    setRecording(false)
    setRecSeconds(0)
  }

  async function uploadVoice(blob) {
    if (!user) return
    setUploading(true)
    const path = `${user.id}/voice_${Date.now()}.webm`
    const { error: upErr } = await supabase.storage.from('chat-media').upload(path, blob)
    if (upErr) { setSendError('Ошибка загрузки голосового'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path)
    const { data, error } = await supabase.from('messages').insert({
      user_id: user.id, user_name: userName,
      content: '🎤 Голосовое', file_url: publicUrl, file_type: 'voice', room
    }).select().single()

    setUploading(false)
    if (!error && data) setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function insertEmoji(emoji) {
    const el = inputRef.current
    if (!el) { setText(t => t + emoji); return }
    const start = el.selectionStart
    const end   = el.selectionEnd
    const next  = text.slice(0, start) + emoji + text.slice(end)
    setText(next)
    // Восстанавливаем позицию курсора
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const currentRoom = ROOMS.find(r => r.id === room)

  return (
    <div style={s.page}>
      <div style={s.orb} />

      {/* ── Шапка ── */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div style={s.roomIcon}>{currentRoom.icon}</div>
          <div style={s.headerInfo}>
            <div style={s.roomName}>Нур Хаят · {currentRoom.label}</div>
            <div style={s.onlineRow}>
              <div style={s.onlineDot} />
              <span style={s.onlineText}>{online} онлайн</span>
            </div>
          </div>
          {uploading && <div style={s.uploadBadge}>⏳ загружаю...</div>}
        </div>

        <div style={s.rooms}>
          {ROOMS.map(r => (
            <button key={r.id} style={{ ...s.roomBtn, ...(room === r.id ? s.roomBtnActive : {}) }}
              onClick={() => setRoom(r.id)}>
              <span>{r.icon}</span><span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Сообщения ── */}
      <div style={s.messages} className="scroll-y">
        {loading ? (
          <div style={s.loadWrap}>
            {[0,.2,.4].map((d,i) => <div key={i} style={{ ...s.loadDot, animationDelay:`${d}s` }} />)}
          </div>
        ) : messages.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>{currentRoom.icon}</div>
            <div style={s.emptyTitle}>{currentRoom.desc}</div>
            <div style={s.emptySub}>Начни разговор первым</div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe     = msg.user_id === user?.id
              const prev     = messages[i - 1]
              const showName = msg.user_name !== prev?.user_name
              return <MessageBubble key={msg.id} msg={msg} isMe={isMe} showName={showName} />
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Ошибка ── */}
      {sendError && (
        <div style={s.errorBar}>{sendError}</div>
      )}

      {/* ── Запись голосового ── */}
      {recording && (
        <div style={s.recBar}>
          <div style={s.recDot} />
          <span style={s.recTime}>🎤 {formatDuration(recSeconds)}</span>
          <button style={s.recCancel} onClick={cancelRecording}>✕ отмена</button>
          <button style={s.recStop} onClick={stopRecording}>⏹ отправить</button>
        </div>
      )}

      {/* ── Эмодзи-панель ── */}
      {showEmoji && !recording && (
        <EmojiPicker
          onSelect={emoji => { insertEmoji(emoji) }}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* ── Ввод ── */}
      {!recording && (
        <div style={s.inputArea}>
          {!user ? (
            <div style={s.loginHint}>Войди в аккаунт чтобы писать</div>
          ) : (
            <>
              {/* Прикрепить файл */}
              <input ref={fileRef} type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                style={{ display:'none' }} onChange={handleFile} />
              <button style={s.attachBtn} onClick={() => fileRef.current?.click()} title="Прикрепить файл">
                📎
              </button>

              {/* Эмодзи */}
              <button
                style={{ ...s.attachBtn, background: showEmoji ? 'rgba(201,168,76,.15)' : 'var(--bg-card)', borderColor: showEmoji ? 'rgba(201,168,76,.4)' : 'var(--border)' }}
                onClick={() => setShowEmoji(v => !v)}
                title="Эмодзи"
              >
                😊
              </button>

              {/* Текст */}
              <div style={s.inputWrap}>
                <textarea ref={inputRef} style={s.input} value={text}
                  onChange={e => setText(e.target.value)} onKeyDown={onKeyDown}
                  placeholder={`Написать в ${currentRoom.label}...`}
                  rows={1} maxLength={500} />
              </div>

              {/* Отправить / Микрофон */}
              {text.trim() ? (
                <button style={s.sendBtn} onClick={sendMessage} disabled={sending}>
                  {sending ? '…' : '→'}
                </button>
              ) : (
                <button style={{ ...s.sendBtn, background:'var(--bg-card)',
                  border:'1px solid var(--border)', color:'var(--text-muted)',
                  boxShadow:'none' }}
                  onMouseDown={startRecording} title="Голосовое сообщение">
                  🎤
                </button>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes dotPulse { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes msgIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes emojiBounce { 0%{transform:scale(1)} 30%{transform:scale(1.35)} 60%{transform:scale(.9)} 100%{transform:scale(1)} }
        .emoji-btn:hover { transform: scale(1.3) !important; background: rgba(201,168,76,.12) !important; }
        .emoji-btn:active { animation: emojiBounce .3s ease !important; }
      `}</style>
    </div>
  )
}

// Проверяем — сообщение только из эмодзи (1-3 штуки)
const EMOJI_RE = /^\p{Emoji_Presentation}+$/u
function isEmojiOnly(text) {
  if (!text) return false
  const segs = [...(text.match(/\p{Emoji_Presentation}/gu) || [])]
  return segs.length > 0 && segs.length <= 3 && text.replace(/\s/g,'') === segs.join('')
}

function BigAnimEmoji({ emoji }) {
  const [failed, setFailed] = useState(false)
  return failed
    ? <span style={{ fontSize: 56 }}>{emoji}</span>
    : <img src={notoUrl(emoji)} alt={emoji} width={64} height={64}
        style={{ display:'inline-block', animation:'emojiBounce .5s ease' }}
        onError={() => setFailed(true)} />
}

function MessageBubble({ msg, isMe, showName }) {
  const letter  = msg.user_name?.charAt(0).toUpperCase() || '?'
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef()

  const emojiOnly = !msg.file_type && isEmojiOnly(msg.content)

  function toggleAudio() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  // Эмодзи-только сообщение — без пузыря, просто большой анимированный
  if (emojiOnly) {
    const emojis = [...(msg.content.match(/\p{Emoji_Presentation}/gu) || [])]
    return (
      <div style={{ ...b.row, justifyContent: isMe ? 'flex-end' : 'flex-start', animation:'msgIn .25s ease' }}>
        {!isMe && <div style={b.avatarOther}>{letter}</div>}
        <div style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          {showName && <div style={{ ...b.name, color: isMe ? 'var(--text-dim)' : 'var(--gold-dim)' }}>{msg.user_name}</div>}
          <div style={{ display:'flex', gap:4, padding:'4px 8px' }}>
            {emojis.map((e, i) => <BigAnimEmoji key={i} emoji={e} />)}
          </div>
          <div style={{ ...b.time, textAlign: isMe ? 'right' : 'left', paddingRight: 8 }}>{formatTime(msg.created_at)}</div>
        </div>
        {isMe && <div style={b.avatarMe}>{letter}</div>}
      </div>
    )
  }

  return (
    <div style={{ ...b.row, justifyContent: isMe ? 'flex-end' : 'flex-start', animation:'msgIn .25s ease' }}>

      {/* Аватар чужого — золотой */}
      {!isMe && (
        <div style={b.avatarOther}>{letter}</div>
      )}

      <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column',
        alignItems: isMe ? 'flex-end' : 'flex-start' }}>

        {showName && (
          <div style={{ ...b.name, textAlign: isMe ? 'right' : 'left',
            color: isMe ? 'var(--text-dim)' : 'var(--gold-dim)' }}>
            {msg.user_name}
          </div>
        )}

        <div style={isMe ? b.bubbleMe : b.bubbleThem}>
          {/* Изображение */}
          {msg.file_type === 'image' && (
            <img src={msg.file_url} alt="фото"
              style={{ width:'100%', borderRadius:10, marginBottom:6, display:'block',
                maxHeight:240, objectFit:'cover', cursor:'pointer' }}
              onClick={() => window.open(msg.file_url, '_blank')} />
          )}

          {/* Видео */}
          {msg.file_type === 'video' && (
            <video src={msg.file_url} controls
              style={{ width:'100%', borderRadius:10, marginBottom:6, maxHeight:200 }} />
          )}

          {/* Голосовое */}
          {(msg.file_type === 'voice' || msg.file_type === 'audio') && (
            <div style={b.voiceWrap}>
              <audio ref={audioRef} src={msg.file_url}
                onEnded={() => setPlaying(false)} style={{ display:'none' }} />
              <button style={{ ...b.playBtn, color: isMe ? '#070710' : 'var(--gold)' }}
                onClick={toggleAudio}>
                {playing ? '⏸' : '▶'}
              </button>
              <div style={b.voiceWave}>
                {Array.from({length:16}).map((_,i) => (
                  <div key={i} style={{
                    ...b.bar,
                    height: `${8 + Math.random() * 16}px`,
                    background: isMe ? 'rgba(7,7,16,.5)' : 'var(--gold-dim)',
                    opacity: playing ? 1 : 0.5
                  }} />
                ))}
              </div>
              <span style={{ fontSize:11, opacity:.6, color: isMe ? '#070710' : 'var(--text-muted)' }}>
                🎤
              </span>
            </div>
          )}

          {/* Файл */}
          {msg.file_type === 'file' && (
            <a href={msg.file_url} target="_blank" rel="noreferrer"
              style={{ ...b.fileLink, color: isMe ? '#070710' : 'var(--gold)' }}>
              📎 {msg.file_name || 'Файл'}
            </a>
          )}

          {/* Текст */}
          {msg.content && !(msg.file_type === 'image' || msg.file_type === 'video'
            || msg.file_type === 'voice' || msg.file_type === 'audio') && (
            <div style={{ ...b.text, color: isMe ? '#070710' : 'var(--text)' }}>
              {msg.content}
            </div>
          )}

          <div style={{ ...b.time, color: isMe ? 'rgba(7,7,16,.45)' : 'var(--text-dim)', textAlign:'right' }}>
            {formatTime(msg.created_at)}
          </div>
        </div>
      </div>

      {/* Аватар своего — серый */}
      {isMe && (
        <div style={b.avatarMe}>{letter}</div>
      )}
    </div>
  )
}

const s = {
  page: { height:'100%', background:'var(--bg-deep)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' },
  orb: { position:'absolute', width:250, height:250, top:-40, right:-60, borderRadius:'50%',
    background:'radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 70%)',
    filter:'blur(50px)', pointerEvents:'none' },
  header: { background:'var(--bg-surface)', borderBottom:'1px solid var(--border)',
    paddingTop:'calc(var(--safe-top) + 12px)', flexShrink:0 },
  headerTop: { display:'flex', alignItems:'center', gap:12, padding:'0 16px 12px' },
  roomIcon: { width:44, height:44, borderRadius:'50%',
    background:'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))',
    border:'1px solid rgba(201,168,76,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 },
  headerInfo: { display:'flex', flexDirection:'column', gap:3, flex:1 },
  roomName: { fontSize:15, fontWeight:600, color:'var(--text)' },
  onlineRow: { display:'flex', alignItems:'center', gap:5 },
  onlineDot: { width:7, height:7, borderRadius:'50%', background:'#52b788', boxShadow:'0 0 6px #52b788' },
  onlineText: { fontSize:12, color:'var(--green-light)' },
  uploadBadge: { fontSize:12, color:'var(--gold)', background:'rgba(201,168,76,.1)',
    padding:'4px 10px', borderRadius:10, border:'1px solid rgba(201,168,76,.2)' },
  rooms: { display:'flex', borderTop:'1px solid var(--border)', overflowX:'auto', scrollbarWidth:'none' },
  roomBtn: { display:'flex', alignItems:'center', gap:6, padding:'10px 14px',
    background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer',
    fontFamily:'var(--font-ui)', borderBottom:'2px solid transparent', transition:'all .2s',
    whiteSpace:'nowrap', flexShrink:0 },
  roomBtnActive: { color:'var(--gold)', borderBottomColor:'var(--gold)' },
  messages: { flex:1, padding:'12px 14px', display:'flex', flexDirection:'column', gap:6, overflowY:'auto' },
  loadWrap: { display:'flex', gap:8, justifyContent:'center', padding:'40px 0' },
  loadDot: { width:9, height:9, borderRadius:'50%', background:'var(--gold-dim)', animation:'dotPulse 1.2s ease-in-out infinite' },
  empty: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:40 },
  emptyIcon: { fontSize:48 }, emptyTitle: { fontSize:16, fontWeight:600, color:'var(--text)', textAlign:'center' },
  emptySub: { fontSize:13, color:'var(--text-muted)' },
  errorBar: { background:'rgba(255,80,80,.12)', color:'#ff6b6b', fontSize:13,
    padding:'8px 16px', borderTop:'1px solid rgba(255,80,80,.2)', flexShrink:0 },
  recBar: { display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
    background:'var(--bg-surface)', borderTop:'1px solid var(--border)', flexShrink:0 },
  recDot: { width:10, height:10, borderRadius:'50%', background:'#ff4444',
    boxShadow:'0 0 8px #ff4444', animation:'recPulse 1s ease-in-out infinite', flexShrink:0 },
  recTime: { flex:1, fontSize:14, fontWeight:600, color:'var(--text)' },
  recCancel: { background:'none', border:'1px solid var(--border)', color:'var(--text-muted)',
    borderRadius:12, padding:'6px 12px', cursor:'pointer', fontSize:13, fontFamily:'var(--font-ui)' },
  recStop: { background:'linear-gradient(135deg,#C9A84C,#F0D080)', color:'#070710',
    border:'none', borderRadius:12, padding:'6px 14px', cursor:'pointer', fontWeight:600,
    fontSize:13, fontFamily:'var(--font-ui)' },
  inputArea: { display:'flex', alignItems:'flex-end', gap:8, padding:'10px 12px calc(var(--safe-bottom) + 10px)',
    borderTop:'1px solid var(--border)', background:'var(--bg-surface)', flexShrink:0 },
  attachBtn: { width:40, height:40, borderRadius:'50%', background:'var(--bg-card)',
    border:'1px solid var(--border)', fontSize:18, cursor:'pointer', flexShrink:0,
    display:'flex', alignItems:'center', justifyContent:'center' },
  inputWrap: { flex:1 },
  input: { width:'100%', background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:20, color:'var(--text)', fontFamily:'var(--font-ui)', fontSize:15,
    padding:'11px 16px', outline:'none', resize:'none', lineHeight:1.4, display:'block' },
  sendBtn: { width:44, height:44, borderRadius:'50%', flexShrink:0,
    background:'linear-gradient(135deg,#C9A84C,#F0D080)', color:'#070710',
    border:'none', cursor:'pointer', fontSize:18, fontWeight:700,
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'all .2s', boxShadow:'0 0 16px rgba(201,168,76,.3)' },
  loginHint: { flex:1, textAlign:'center', color:'var(--text-muted)', fontSize:14 }
}

const b = {
  row: { display:'flex', gap:8, alignItems:'flex-end' },
  avatarOther: {
    width:32, height:32, borderRadius:'50%', flexShrink:0,
    background:'linear-gradient(135deg,rgba(201,168,76,.25),rgba(201,168,76,.1))',
    border:'1px solid rgba(201,168,76,.3)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:700, color:'var(--gold)'
  },
  avatarMe: {
    width:32, height:32, borderRadius:'50%', flexShrink:0,
    background:'var(--bg-card)', border:'1px solid var(--border)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:600, color:'var(--text-muted)'
  },
  name: { fontSize:11, marginBottom:3, paddingLeft:4, paddingRight:4 },
  bubbleThem: { background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:'16px 16px 16px 4px', padding:'9px 13px' },
  bubbleMe: { background:'linear-gradient(135deg,#C9A84C,#E8C96A)',
    borderRadius:'16px 16px 4px 16px', padding:'9px 13px' },
  text: { fontSize:14, lineHeight:1.45, wordBreak:'break-word' },
  time: { fontSize:10, marginTop:4, opacity:.7 },
  voiceWrap: { display:'flex', alignItems:'center', gap:8, minWidth:160 },
  playBtn: { background:'none', border:'none', fontSize:20, cursor:'pointer', padding:0, flexShrink:0 },
  voiceWave: { display:'flex', alignItems:'center', gap:2, flex:1, height:24 },
  bar: { width:3, borderRadius:2, transition:'opacity .2s' },
  fileLink: { fontSize:14, textDecoration:'none', fontWeight:500, display:'block',
    padding:'4px 0', wordBreak:'break-all' }
}

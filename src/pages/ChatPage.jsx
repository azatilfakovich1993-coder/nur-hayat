import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { addNur } from '../utils/nur'

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

const LEVEL_BADGES = {
  seeker:     { emoji: '🌱', label: 'Только начинаю',     color: '#2D6A4F' },
  growing:    { emoji: '🌿', label: 'Мусульманин, расту', color: '#40916C' },
  practicing: { emoji: '🌳', label: 'Соблюдаю, ищу общину', color: '#52B788' },
}

const ROOMS = [
  { id: 'general',   label: 'Общий',    icon: '🌙', desc: 'Разговоры обо всём' },
  { id: 'brothers',  label: 'Спросить мужчин', icon: '🧔', desc: 'Вопрос только для мужчин — отвечают мужчины', genderOnly: 'male' },
  { id: 'sisters',   label: 'Спросить женщин', icon: '👩', desc: 'Вопрос только для женщин — отвечают женщины', genderOnly: 'female' },
]

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

function msgDateKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function formatDateLabel(ts) {
  const d    = new Date(ts)
  const now  = new Date()
  const diff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
             - new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = diff / 86400000
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Вчера'
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function DateSeparator({ ts }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        background: 'var(--bg-surface)', borderRadius: 12,
        padding: '3px 10px', border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
      }}>
        {formatDateLabel(ts)}
      </div>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// Галочки статуса сообщения (только для своих)
function MsgStatus({ msg, lastReadAt }) {
  if (msg.pending) {
    // Отправляется
    return <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 3 }}>⏱</span>
  }
  const sentAt = new Date(msg.created_at)
  const isRead = lastReadAt && lastReadAt > sentAt
  const color = isRead ? '#4fc3f7' : 'rgba(7,7,16,0.45)'
  // SVG галочки как в WhatsApp
  return (
    <svg width={isRead ? 18 : 11} height={10} viewBox={isRead ? '0 0 18 10' : '0 0 11 10'}
      style={{ marginLeft: 3, flexShrink: 0, verticalAlign: 'middle' }}>
      {isRead ? (
        // Двойная галочка
        <>
          <polyline points="1,5 4,8 9,2"   fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="6,5 9,8 17,2"  fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </>
      ) : (
        // Одиночная галочка
        <polyline points="1,5 4,8 10,2" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  )
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Кэш последних сообщений комнаты — мгновенный показ при открытии,
// пока свежие данные грузятся в фоне (Supabase отвечает медленно из РФ)
function getCachedMessages(room) {
  try {
    const raw = localStorage.getItem('nur-hayat-chat-' + room)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function setCachedMessages(room, msgs) {
  try { localStorage.setItem('nur-hayat-chat-' + room, JSON.stringify(msgs.slice(-40))) } catch {}
}

export default function ChatPage() {
  const { user, profile, setProfile } = useAuth()
  const location = useLocation()
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
  const [genderBlocked, setGenderBlocked] = useState(false)
  const [replyTo,    setReplyTo]    = useState(null)  // { id, name, text }
  const [menuMsg,    setMenuMsg]    = useState(null)  // сообщение с открытым меню
  const [highlightId, setHighlightId] = useState(null)
  const [lastReadAt,  setLastReadAt]  = useState(null)
  const [userAvatars, setUserAvatars] = useState({}) // user_id -> avatar_url // когда другие последний раз читали этот чат
  const [hasMore,     setHasMore]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError,   setLoadError]   = useState(false)
  const [reloadKey,   setReloadKey]   = useState(0)

  const bottomRef        = useRef()
  const inputRef         = useRef()
  const messagesRef      = useRef()   // scroll container
  const scrollAnchorRef  = useRef(null) // savedHeight перед prepend
  const fileRef     = useRef()
  const msgRefs     = useRef({})  // id -> DOM element
  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)

  const userName   = profile?.name       || user?.email?.split('@')[0] || 'Аноним'
  const userLevel  = profile?.level      || 'seeker'
  const userAvatar = profile?.avatar_url || null

  // Загрузка сообщений + Realtime
  useEffect(() => {
    if (!user) return
    setLoadError(false)
    setMessages([])

    // Кэш — показываем мгновенно, пока свежие данные грузятся в фоне
    const cached = getCachedMessages(room)
    if (cached?.length) {
      setMessages(cached)
      setHasMore(cached.length >= 40)
      setLoading(false)
    } else {
      setLoading(true)
    }

    Promise.race([
      supabase.from('messages').select('*')
        .eq('room', room)
        .order('created_at', { ascending: false })
        .limit(40),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
    ])
      .then(({ data }) => {
        const msgs = [...(data || [])].reverse()
        setMessages(msgs)
        setCachedMessages(room, msgs)
        setHasMore((data?.length || 0) >= 40)
        setLoading(false)
        // Загружаем аватары всех участников
        const ids = [...new Set(msgs.map(m => m.user_id).filter(Boolean))]
        if (ids.length) {
          supabase.from('profiles').select('id, avatar_url').in('id', ids)
            .then(({ data: profiles }) => {
              if (!profiles) return
              const map = {}
              profiles.forEach(p => { map[p.id] = p.avatar_url || null })
              setUserAvatars(map)
            })
        }
      })
      .catch(() => {
        setLoading(false)
        if (!cached?.length) setLoadError(true)
      })

    // Записываем что я сейчас читаю этот чат
    const now = new Date().toISOString()
    supabase.from('chat_reads').upsert(
      { user_id: user.id, room, last_read_at: now },
      { onConflict: 'user_id,room' }
    )

    // Читаем когда другие последний раз были в этом чате
    supabase.from('chat_reads')
      .select('last_read_at')
      .eq('room', room)
      .neq('user_id', user.id)
      .order('last_read_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setLastReadAt(new Date(data[0].last_read_at))
      })

    const channel = supabase.channel('messages-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: msg }) => {
          if (msg.room === room) {
            setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
            // Подгружаем аватар нового участника если его ещё нет в карте
            setUserAvatars(prev => {
              if (msg.user_id in prev) return prev
              supabase.from('profiles').select('avatar_url').eq('id', msg.user_id).single()
                .then(({ data }) => {
                  setUserAvatars(p => ({ ...p, [msg.user_id]: data?.avatar_url || null }))
                })
              return prev
            })
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
        ({ new: msg }) => {
          if (msg.room === room)
            setMessages(prev => prev.map(m => m.id === msg.id ? msg : m))
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        ({ old }) => {
          setMessages(prev => prev.filter(m => m.id !== old.id))
        })
      // Слушаем когда другие открывают чат (обновляют last_read_at)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_reads' },
        ({ new: row }) => {
          if (row.room === room && row.user_id !== user.id)
            setLastReadAt(new Date(row.last_read_at))
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_reads' },
        ({ new: row }) => {
          if (row.room === room && row.user_id !== user.id)
            setLastReadAt(prev => {
              const newDate = new Date(row.last_read_at)
              return (!prev || newDate > prev) ? newDate : prev
            })
        })
      .subscribe()

    // Presence — реальный онлайн
    const presenceChannel = supabase.channel(`presence:${room}`, {
      config: { presence: { key: user.id } }
    })
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setOnline(Object.keys(state).length)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, room })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(presenceChannel)
    }
  }, [room, user?.id, reloadKey])

  // Скролл вниз при новых сообщениях / восстановление позиции при подгрузке старых
  useEffect(() => {
    if (scrollAnchorRef.current !== null) {
      // Восстанавливаем позицию после prepend старых сообщений
      const container = messagesRef.current
      if (container) {
        container.scrollTop = container.scrollHeight - scrollAnchorRef.current
      }
      scrollAnchorRef.current = null
      return
    }
    if (!highlightId) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Подгрузка старых сообщений при скролле вверх
  async function loadMore() {
    if (!hasMore || loadingMore || messages.length === 0) return
    const oldest = messages[0].created_at
    const container = messagesRef.current
    scrollAnchorRef.current = container ? container.scrollHeight : 0
    setLoadingMore(true)
    const { data } = await supabase.from('messages').select('*')
      .eq('room', room)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(40)
    setLoadingMore(false)
    if (!data || data.length === 0) { setHasMore(false); scrollAnchorRef.current = null; return }
    if (data.length < 40) setHasMore(false)
    const older = [...data].reverse()
    // Подгружаем аватары новых авторов
    const ids = older.map(m => m.user_id).filter(id => id && !(id in userAvatars))
    if (ids.length) {
      supabase.from('profiles').select('id, avatar_url').in('id', [...new Set(ids)])
        .then(({ data: profiles }) => {
          if (!profiles) return
          const map = {}
          profiles.forEach(p => { map[p.id] = p.avatar_url || null })
          setUserAvatars(prev => ({ ...map, ...prev }))
        })
    }
    setMessages(prev => [...older, ...prev])
  }

  function handleMessagesScroll(e) {
    if (e.target.scrollTop < 60 && hasMore && !loadingMore) loadMore()
  }

  // Подсветка сообщения из URL-параметра ?highlight=ID
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('highlight')
    if (!id || loading) return
    setHighlightId(id)
    // Ждём рендер и скроллим к сообщению
    setTimeout(() => {
      const el = msgRefs.current[id]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
    // Убираем подсветку через 3 секунды
    setTimeout(() => setHighlightId(null), 3500)
  }, [loading, location.search])

  // ── Отправка текста ──
  async function sendMessage() {
    const content = text.trim()
    if (!content || sending || !user) return
    setSending(true); setText('')

    // Оптимистичное сообщение — показываем сразу со статусом pending
    const tempId = 'pending-' + Date.now()
    const tempMsg = {
      id: tempId, pending: true,
      user_id: user.id, user_name: userName, user_level: userLevel, user_avatar: userAvatar,
      content, room, created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id || null,
      reply_to_name: replyTo?.name || null,
      reply_to_text: replyTo?.text || null,
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase.from('messages').insert({
      user_id: user.id, user_name: userName, user_level: userLevel, user_avatar: userAvatar, content, room,
      reply_to_id: replyTo?.id || null,
      reply_to_name: replyTo?.name || null,
      reply_to_text: replyTo?.text || null,
    }).select().single()

    setSending(false)
    const pendingReply = replyTo
    setReplyTo(null)
    inputRef.current?.focus()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setSendError(`Ошибка: ${error.message}`); setTimeout(() => setSendError(''), 5000); return
    }
    if (data) {
      // Заменяем pending на реальное сообщение
      setMessages(prev => prev.map(m => m.id === tempId ? data : m).filter((m, i, arr) => m.id === data.id ? arr.findIndex(x => x.id === data.id) === i : true))
      addNur(3, user, profile, setProfile)

      // Пуш-уведомление автору оригинального сообщения
      if (pendingReply?.userId && pendingReply.userId !== user.id) {
        supabase.functions.invoke('send-push', {
          body: {
            recipient_id: pendingReply.userId,
            title: `${userName} ответил(а) вам`,
            body:  content.slice(0, 100),
            url:   `/chat?highlight=${data.id}`,
            tag:   `reply-${data.id}`,
          }
        }).catch(() => {}) // не блокируем UI при ошибке
      }
    }
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
      user_id: user.id, user_name: userName, user_level: userLevel,
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
      user_id: user.id, user_name: userName, user_level: userLevel,
      content: '🎤 Голосовое', file_url: publicUrl, file_type: 'voice', room
    }).select().single()

    setUploading(false)
    if (!error && data) setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  async function deleteMessage(id) {
    setMessages(prev => prev.filter(m => m.id !== id))
    setMenuMsg(null)
    await supabase.from('messages').delete().eq('id', id)
  }

  async function toggleReaction(msgId, emoji) {
    if (!user) return
    setMenuMsg(null)
    // Оптимистично обновляем локальный стейт
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const reactions = { ...(m.reactions || {}) }
      const users = [...(reactions[emoji] || [])]
      const idx = users.indexOf(user.id)
      if (idx >= 0) users.splice(idx, 1)
      else users.push(user.id)
      if (users.length === 0) delete reactions[emoji]
      else reactions[emoji] = users
      return { ...m, reactions }
    }))
    // Читаем актуальное из БД и обновляем
    const { data } = await supabase.from('messages').select('reactions').eq('id', msgId).single()
    const reactions = { ...(data?.reactions || {}) }
    const users = [...(reactions[emoji] || [])]
    const idx = users.indexOf(user.id)
    if (idx >= 0) users.splice(idx, 1)
    else users.push(user.id)
    if (users.length === 0) delete reactions[emoji]
    else reactions[emoji] = users
    await supabase.from('messages').update({ reactions }).eq('id', msgId)
  }

  function handleReply(msg) {
    setMenuMsg(null)
    setReplyTo({ id: msg.id, name: msg.user_name, text: msg.content || '📎 Медиа', userId: msg.user_id })
    setTimeout(() => inputRef.current?.focus(), 50)
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
              onClick={() => {
                if (r.genderOnly && profile?.gender !== r.genderOnly) {
                  setRoom(r.id)
                  setGenderBlocked(true)
                } else {
                  setRoom(r.id)
                  setGenderBlocked(false)
                }
              }}>
              <span>{r.icon}</span><span>{r.label}</span>
              {r.genderOnly && <span style={{ fontSize:9, opacity:.6 }}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Сообщения ── */}
      <div ref={messagesRef} style={s.messages} className="scroll-y" onScroll={handleMessagesScroll}>
        {loadError ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>📡</div>
            <div style={s.emptyTitle}>Сервер отвечает медленно</div>
            <div style={s.emptySub}>Не удалось загрузить чат. Проверьте интернет и попробуйте ещё раз</div>
            <button className="btn btn-primary" style={{ marginTop: 14 }}
              onClick={() => setReloadKey(k => k + 1)}>
              Повторить
            </button>
          </div>
        ) : genderBlocked ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>{currentRoom.icon}</div>
            <div style={s.emptyTitle}>
              {currentRoom.genderOnly === 'male'
                ? 'Здесь задают вопросы мужчинам'
                : 'Здесь задают вопросы женщинам'}
            </div>
            <div style={s.emptySub}>
              {!profile?.gender
                ? 'Укажи свой пол в профиле, чтобы получить доступ'
                : currentRoom.genderOnly === 'male'
                  ? 'Этот раздел только для мужчин'
                  : 'Этот раздел только для женщин'}
            </div>
          </div>
        ) : loading ? (
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
            {loadingMore && (
              <div style={s.loadMoreBar}>
                <div style={{ ...s.loadDot, animationDelay:'0s' }} />
                <div style={{ ...s.loadDot, animationDelay:'.2s' }} />
                <div style={{ ...s.loadDot, animationDelay:'.4s' }} />
              </div>
            )}
            {!loadingMore && !hasMore && messages.length > 0 && (
              <div style={s.noMoreBar}>начало чата</div>
            )}
            {messages.map((msg, i) => {
              const isMe     = msg.user_id === user?.id
              const prev     = messages[i - 1]
              const showName = msg.user_name !== prev?.user_name
              const isHighlighted = highlightId === String(msg.id)
              const showDate = !prev || msgDateKey(msg.created_at) !== msgDateKey(prev.created_at)
              return (
                <div key={msg.id} ref={el => { msgRefs.current[msg.id] = el }}
                  style={isHighlighted ? {
                    borderRadius: 14,
                    animation: 'highlightPulse 3s ease-out forwards',
                  } : undefined}
                >
                  {showDate && <DateSeparator ts={msg.created_at} />}
                  <MessageBubble
                    msg={msg} isMe={isMe} showName={showName}
                    userId={user?.id}
                    lastReadAt={lastReadAt}
                    avatarSrcOverride={msg.user_id in userAvatars ? userAvatars[msg.user_id] : undefined}
                    menuOpen={menuMsg?.id === msg.id}
                    onMenu={() => setMenuMsg(msg)}
                    onCloseMenu={() => setMenuMsg(null)}
                    onReply={handleReply}
                    onDelete={deleteMessage}
                    onReaction={toggleReaction}
                  />
                </div>
              )
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

      {/* ── Баннер ответа ── */}
      {replyTo && !recording && (
        <div style={s.replyBanner}>
          <div style={s.replyBannerLine} />
          <div style={s.replyBannerContent}>
            <span style={s.replyBannerName}>↩ {replyTo.name}</span>
            <span style={s.replyBannerText}>{replyTo.text.slice(0, 60)}{replyTo.text.length > 60 ? '…' : ''}</span>
          </div>
          <button style={s.replyBannerClose} onClick={() => setReplyTo(null)}>✕</button>
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
          {genderBlocked ? (
            <div style={s.loginHint}>
              {!profile?.gender ? 'Укажи пол в профиле → Настройки' : 'Доступ закрыт'}
            </div>
          ) : !user ? (
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

      {/* ── Контекстное меню (bottom sheet) ── */}
      {menuMsg && (
        <MsgContextMenu
          msg={menuMsg}
          isMe={menuMsg.user_id === user?.id}
          onReply={() => handleReply(menuMsg)}
          onDelete={() => deleteMessage(menuMsg.id)}
          onReaction={e => toggleReaction(menuMsg.id, e)}
          onClose={() => setMenuMsg(null)}
        />
      )}

      <style>{`
        @keyframes dotPulse { 0%,100%{opacity:.3;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes msgIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sheetUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes emojiBounce { 0%{transform:scale(1)} 30%{transform:scale(1.35)} 60%{transform:scale(.9)} 100%{transform:scale(1)} }
        @keyframes highlightPulse {
          0%   { background: rgba(201,168,76,0.35); box-shadow: 0 0 0 3px rgba(201,168,76,0.4); }
          40%  { background: rgba(201,168,76,0.2);  box-shadow: 0 0 0 2px rgba(201,168,76,0.25); }
          100% { background: transparent; box-shadow: none; }
        }
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

const QUICK_REACTIONS = ['👍','❤️','🤲','😂','😮','🥺','🔥','🤍','😢','🥰','👏','🙌','🫶','🤯','💯']

function Avatar({ src, letter, style }) {
  return (
    <div style={{ ...style, overflow:'hidden', position:'relative' }}>
      {src
        ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
        : letter
      }
    </div>
  )
}

function MessageBubble({ msg, isMe, showName, userId, lastReadAt, avatarSrcOverride, menuOpen, onMenu, onCloseMenu, onReply, onDelete, onReaction }) {
  const letter  = msg.user_name?.charAt(0).toUpperCase() || '?'
  // Если профиль загружен (avatarSrcOverride !== undefined) — используем только его значение.
  // Это гарантирует что удалённый аватар не показывается из старых сообщений.
  const avatarSrc = avatarSrcOverride !== undefined ? avatarSrcOverride : (msg.user_avatar || null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef()
  const pressTimer = useRef(null)

  const emojiOnly = !msg.file_type && isEmojiOnly(msg.content)
  const lvl = msg.user_level ? LEVEL_BADGES[msg.user_level] : null
  const reactions = msg.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0

  function toggleAudio() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  function handlePressStart(e) {
    pressTimer.current = setTimeout(() => onMenu(), 500)
  }
  function handlePressEnd() {
    clearTimeout(pressTimer.current)
  }

  const bubbleContent = (
    <>
      {/* Цитата ответа */}
      {msg.reply_to_id && (
        <div style={{ ...b.replyQuote, borderColor: isMe ? 'rgba(7,7,16,.3)' : 'rgba(201,168,76,.4)', background: isMe ? 'rgba(7,7,16,.15)' : 'rgba(201,168,76,.07)' }}>
          <div style={{ ...b.replyQuoteName, color: isMe ? 'rgba(7,7,16,.7)' : 'var(--gold)' }}>{msg.reply_to_name}</div>
          <div style={{ ...b.replyQuoteText, color: isMe ? 'rgba(7,7,16,.6)' : 'var(--text-muted)' }}>{(msg.reply_to_text || '').slice(0, 80)}</div>
        </div>
      )}

      {/* Изображение */}
      {msg.file_type === 'image' && (
        <img src={msg.file_url} alt="фото"
          style={{ width:'100%', borderRadius:10, marginBottom:6, display:'block', maxHeight:240, objectFit:'cover', cursor:'pointer' }}
          onClick={() => window.open(msg.file_url, '_blank')} />
      )}
      {/* Видео */}
      {msg.file_type === 'video' && (
        <video src={msg.file_url} controls style={{ width:'100%', borderRadius:10, marginBottom:6, maxHeight:200 }} />
      )}
      {/* Голосовое */}
      {(msg.file_type === 'voice' || msg.file_type === 'audio') && (
        <div style={b.voiceWrap}>
          <audio ref={audioRef} src={msg.file_url} onEnded={() => setPlaying(false)} style={{ display:'none' }} />
          <button style={{ ...b.playBtn, color: isMe ? '#070710' : 'var(--gold)' }} onClick={toggleAudio}>
            {playing ? '⏸' : '▶'}
          </button>
          <div style={b.voiceWave}>
            {Array.from({length:16}).map((_,i) => (
              <div key={i} style={{ ...b.bar, height:`${8 + Math.random()*16}px`, background: isMe ? 'rgba(7,7,16,.5)' : 'var(--gold-dim)', opacity: playing ? 1 : 0.5 }} />
            ))}
          </div>
          <span style={{ fontSize:11, opacity:.6, color: isMe ? '#070710' : 'var(--text-muted)' }}>🎤</span>
        </div>
      )}
      {/* Файл */}
      {msg.file_type === 'file' && (
        <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ ...b.fileLink, color: isMe ? '#070710' : 'var(--gold)' }}>
          📎 {msg.file_name || 'Файл'}
        </a>
      )}
      {/* Текст */}
      {msg.content && !(msg.file_type === 'image' || msg.file_type === 'video' || msg.file_type === 'voice' || msg.file_type === 'audio') && (
        <div style={{ ...b.text, color: isMe ? '#070710' : 'var(--text)' }}>{msg.content}</div>
      )}
      <div style={{ ...b.time, color: isMe ? 'rgba(7,7,16,.45)' : 'var(--text-dim)', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:2 }}>
        {formatTime(msg.created_at)}
        {isMe && <MsgStatus msg={msg} lastReadAt={lastReadAt} />}
      </div>
    </>
  )

  if (emojiOnly) {
    const emojis = [...(msg.content.match(/\p{Emoji_Presentation}/gu) || [])]
    return (
      <div style={{ ...b.row, justifyContent: isMe ? 'flex-end' : 'flex-start', animation:'msgIn .25s ease' }}>
        {!isMe && <Avatar src={avatarSrc} letter={letter} style={b.avatarOther} />}
        <div style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
          {showName && (
            <div style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems:'center', gap:6, paddingLeft:4, paddingRight:4, marginBottom:3 }}>
              <div style={{ ...b.name, color: isMe ? 'var(--text-dim)' : 'var(--gold-dim)', margin:0 }}>{msg.user_name}</div>
              {lvl && <div style={{ ...b.levelTag, borderColor: lvl.color+'60', color: lvl.color, background: lvl.color+'14' }}>{lvl.emoji} {lvl.label}</div>}
            </div>
          )}
          <div
            style={{ display:'flex', gap:4, padding:'4px 8px', cursor:'pointer' }}
            onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
            onContextMenu={e => { e.preventDefault(); onMenu() }}
          >
            {emojis.map((e, i) => <BigAnimEmoji key={i} emoji={e} />)}
          </div>
          {hasReactions && <ReactionsRow reactions={reactions} userId={userId} msgId={msg.id} onReaction={onReaction} />}
          <div style={{ ...b.time, textAlign: isMe ? 'right' : 'left', paddingRight:8, display:'flex', alignItems:'center', gap:2, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
            {formatTime(msg.created_at)}
            {isMe && <MsgStatus msg={msg} lastReadAt={lastReadAt} />}
          </div>
        </div>
        {isMe && <Avatar src={avatarSrc} letter={letter} style={b.avatarMe} />}
      </div>
    )
  }

  return (
    <div style={{ ...b.row, justifyContent: isMe ? 'flex-end' : 'flex-start', animation:'msgIn .25s ease' }}>
      {!isMe && <Avatar src={avatarSrc} letter={letter} style={b.avatarOther} />}

      <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {showName && (
          <div style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems:'center', gap:6, paddingLeft:4, paddingRight:4, marginBottom:3 }}>
            <div style={{ ...b.name, color: isMe ? 'var(--text-dim)' : 'var(--gold-dim)', margin:0 }}>{msg.user_name}</div>
            {lvl && <div style={{ ...b.levelTag, borderColor: lvl.color+'60', color: lvl.color, background: lvl.color+'14' }}>{lvl.emoji} {lvl.label}</div>}
          </div>
        )}

        <div
          style={{ ...(isMe ? b.bubbleMe : b.bubbleThem), cursor:'pointer', userSelect:'none' }}
          onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
          onContextMenu={e => { e.preventDefault(); onMenu() }}
          onClick={() => { if (!menuOpen) {} }}
        >
          {bubbleContent}
        </div>

        {hasReactions && <ReactionsRow reactions={reactions} userId={userId} msgId={msg.id} onReaction={onReaction} />}
      </div>

      {isMe && <Avatar src={avatarSrc} letter={letter} style={b.avatarMe} />}
    </div>
  )
}

function ReactionsRow({ reactions, userId, msgId, onReaction }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4, paddingLeft:2, paddingRight:2 }}>
      {Object.entries(reactions).map(([emoji, users]) => {
        const iMine = users.includes(userId)
        const count = users.length
        return (
          <button key={emoji} onClick={() => onReaction(msgId, emoji)}
            style={{ ...b.reactionPill, background: iMine ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)', borderColor: iMine ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.12)' }}>
            <span style={{ fontSize:13 }}>{emoji}</span>
            {count >= 2 && (
              <span style={{ fontSize:11, color: iMine ? 'var(--gold)' : 'var(--text-muted)', fontWeight:600 }}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

const ALL_REACTIONS = [
  ...QUICK_REACTIONS,
  '🌙','⭐','✨','💫','🕌','📖','🤝','💚','🌿','🌺','🌸','🦋','🌈','☀️',
  '😇','🥳','😎','🤩','😜','😴','🤔','🫡','😤','👀','🫶','🤌','🤙','💪','🙏','🫂',
  '🎉','🏆','💎','⚡','❄️','🌊','🍃','🔑','🎯','🌟',
]

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}
function fallbackCopy(text) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
  document.body.appendChild(el)
  el.focus(); el.select()
  try { document.execCommand('copy') } catch {}
  document.body.removeChild(el)
}

async function copyImageToClipboard(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const mimeType = blob.type || 'image/png'
    await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })])
  } catch (err) {
    console.warn('[Copy image] failed:', err.message)
    // fallback: copy URL as text
    copyToClipboard(url)
  }
}

function downloadFile(url, fileName) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function MsgContextMenu({ isMe, msg, onReply, onDelete, onReaction, onClose }) {
  const [showAllReactions, setShowAllReactions] = useState(false)

  function handleReaction(e) { onReaction(e); onClose() }

  return (
    <>
      {/* Фон-затемнение */}
      <div style={sh.backdrop} onClick={onClose} />

      {/* Нижний sheet */}
      <div style={sh.sheet}>
        {/* Превью сообщения */}
        <div style={sh.preview}>
          <div style={sh.previewText} className="arabic">
            {msg.content ? msg.content.slice(0, 80) + (msg.content.length > 80 ? '…' : '') : '📎 Медиа'}
          </div>
        </div>

        {/* Реакции */}
        <div style={sh.reactionsWrap}>
          {(showAllReactions ? ALL_REACTIONS : QUICK_REACTIONS.slice(0, 8)).map(e => (
            <button key={e} style={sh.reactionBtn} onClick={() => handleReaction(e)}>{e}</button>
          ))}
          {!showAllReactions && (
            <button style={{ ...sh.reactionBtn, fontSize:18, color:'var(--text-muted)' }}
              onClick={() => setShowAllReactions(true)}>＋</button>
          )}
        </div>

        <div style={sh.divider} />

        {/* Действия */}
        <button style={sh.item} onClick={() => { onReply(); onClose() }}>
          <span style={sh.itemIcon}>↩</span>
          <span style={sh.itemLabel}>Ответить</span>
        </button>

        {msg?.content && !msg?.file_type && (
          <button style={sh.item} onClick={() => { copyToClipboard(msg.content); onClose() }}>
            <span style={sh.itemIcon}>📋</span>
            <span style={sh.itemLabel}>Копировать</span>
          </button>
        )}

        {msg?.file_type === 'image' && (
          <>
            <button style={sh.item} onClick={() => { copyImageToClipboard(msg.file_url); onClose() }}>
              <span style={sh.itemIcon}>📋</span>
              <span style={sh.itemLabel}>Скопировать фото</span>
            </button>
            <button style={sh.item} onClick={() => { downloadFile(msg.file_url, msg.file_name || 'image.jpg'); onClose() }}>
              <span style={sh.itemIcon}>⬇️</span>
              <span style={sh.itemLabel}>Сохранить фото</span>
            </button>
          </>
        )}

        {(msg?.file_type === 'video' || msg?.file_type === 'audio' || msg?.file_type === 'file') && (
          <button style={sh.item} onClick={() => { downloadFile(msg.file_url, msg.file_name || 'file'); onClose() }}>
            <span style={sh.itemIcon}>⬇️</span>
            <span style={sh.itemLabel}>Скачать</span>
          </button>
        )}

        {isMe && (
          <button style={{ ...sh.item, ...sh.itemDanger }} onClick={() => { onDelete(); onClose() }}>
            <span style={sh.itemIcon}>🗑</span>
            <span style={sh.itemLabel}>Удалить</span>
          </button>
        )}

        <button style={{ ...sh.item, marginTop:4 }} onClick={onClose}>
          <span style={{ ...sh.itemLabel, color:'var(--text-muted)', textAlign:'center', width:'100%' }}>Отмена</span>
        </button>
      </div>
    </>
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
  loadMoreBar: { display:'flex', gap:6, justifyContent:'center', padding:'12px 0' },
  noMoreBar: { textAlign:'center', fontSize:11, color:'var(--text-dim)', padding:'10px 0 4px', letterSpacing:'.04em' },
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
  loginHint: { flex:1, textAlign:'center', color:'var(--text-muted)', fontSize:14 },
  replyBanner: {
    display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
    background:'var(--bg-surface)', borderTop:'1px solid rgba(201,168,76,.2)',
    flexShrink:0,
  },
  replyBannerLine: { width:3, height:32, borderRadius:2, background:'var(--gold)', flexShrink:0 },
  replyBannerContent: { flex:1, display:'flex', flexDirection:'column', gap:2, overflow:'hidden' },
  replyBannerName: { fontSize:12, fontWeight:700, color:'var(--gold)' },
  replyBannerText: { fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  replyBannerClose: { background:'none', border:'none', color:'var(--text-muted)', fontSize:16, cursor:'pointer', padding:'4px 6px', flexShrink:0 },
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
  name: { fontSize:11, paddingLeft:4, paddingRight:4 },
  levelTag: {
    fontSize:9, fontWeight:700, letterSpacing:'.02em',
    border:'1px solid', borderRadius:20, padding:'2px 7px',
    flexShrink:0, lineHeight:1.4,
  },
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
    padding:'4px 0', wordBreak:'break-all' },
  menuBtn: {
    background:'none', border:'none', color:'var(--text-muted)', fontSize:18,
    cursor:'pointer', padding:'0 4px', alignSelf:'center', opacity:0.4,
    lineHeight:1, flexShrink:0,
  },
  replyQuote: {
    borderLeft:'3px solid', borderRadius:6, padding:'5px 8px',
    marginBottom:7, display:'flex', flexDirection:'column', gap:2,
    direction:'ltr', unicodeBidi:'embed',
  },
  replyQuoteName: { fontSize:11, fontWeight:700, direction:'ltr' },
  replyQuoteText: { fontSize:12, lineHeight:1.4, overflow:'hidden',
    display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
    direction:'ltr' },
  reactionPill: {
    display:'flex', alignItems:'center', gap:4, padding:'3px 8px',
    borderRadius:20, border:'1px solid', cursor:'pointer',
    fontFamily:'var(--font-ui)', transition:'all .15s',
  },
}

const sh = {
  backdrop: {
    position:'fixed', inset:0, zIndex:400,
    background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)',
  },
  sheet: {
    position:'fixed', bottom:0, left:0, right:0, zIndex:401,
    background:'var(--bg-surface)', borderRadius:'20px 20px 0 0',
    padding:'12px 16px calc(var(--safe-bottom, 0px) + 16px)',
    fontFamily:'var(--font-ui)',
    animation:'sheetUp .25s cubic-bezier(.32,1,.23,1)',
    boxShadow:'0 -8px 40px rgba(0,0,0,.4)',
  },
  preview: {
    background:'var(--bg-card)', borderRadius:14, padding:'10px 14px',
    marginBottom:14, borderLeft:'3px solid rgba(201,168,76,.5)',
  },
  previewText: {
    fontSize:13, color:'var(--text-muted)', lineHeight:1.5,
    overflow:'hidden', display:'-webkit-box',
    WebkitLineClamp:2, WebkitBoxOrient:'vertical',
  },
  reactionsWrap: {
    display:'flex', flexWrap:'wrap', gap:4, marginBottom:12,
    padding:'4px 0',
  },
  reactionBtn: {
    fontSize:26, background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:12, padding:'6px 8px', cursor:'pointer', lineHeight:1,
    transition:'transform .12s',
  },
  divider: { height:1, background:'var(--border)', margin:'4px 0 8px' },
  item: {
    width:'100%', display:'flex', alignItems:'center', gap:14,
    background:'none', border:'none', color:'var(--text)', fontSize:16,
    padding:'13px 6px', cursor:'pointer', textAlign:'left',
    fontFamily:'var(--font-ui)', borderRadius:12,
  },
  itemIcon: { fontSize:20, width:28, textAlign:'center', flexShrink:0 },
  itemLabel: { fontSize:16, fontWeight:500 },
  itemDanger: { color:'#ff6b6b' },
}

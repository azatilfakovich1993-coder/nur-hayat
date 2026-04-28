import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

export function NotesGoals({ user, onClose }) {
  const [notes,   setNotes]   = useState([])
  const [goals,   setGoals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('notes')
  const [editor,  setEditor]  = useState(null)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setLoading(true)
    const [{ data: n }, { data: g }] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setNotes(n || [])
    setGoals(g || [])
    setLoading(false)
  }

  async function saveNote({ id, title, body, is_favorite }) {
    if (id) {
      const { data } = await supabase.from('notes')
        .update({ title, body, is_favorite }).eq('id', id).select().single()
      if (data) setNotes(prev => prev.map(n => n.id === id ? data : n))
    } else {
      const { data } = await supabase.from('notes')
        .insert({ user_id: user.id, title, body, is_favorite }).select().single()
      if (data) setNotes(prev => [data, ...prev])
    }
    setEditor(null)
  }

  async function saveGoal({ id, title, description, is_done }) {
    if (id) {
      const { data } = await supabase.from('goals')
        .update({ title, description, is_done }).eq('id', id).select().single()
      if (data) setGoals(prev => prev.map(g => g.id === id ? data : g))
    } else {
      const { data } = await supabase.from('goals')
        .insert({ user_id: user.id, title, description, is_done }).select().single()
      if (data) setGoals(prev => [data, ...prev])
    }
    setEditor(null)
  }

  async function toggleFavorite(note) {
    const { data } = await supabase.from('notes')
      .update({ is_favorite: !note.is_favorite }).eq('id', note.id).select().single()
    if (data) setNotes(prev => prev.map(n => n.id === note.id ? data : n))
  }

  async function toggleDone(goal) {
    const { data } = await supabase.from('goals')
      .update({ is_done: !goal.is_done }).eq('id', goal.id).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === goal.id ? data : g))
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const favNotes   = notes.filter(n => n.is_favorite)
  const otherNotes = notes.filter(n => !n.is_favorite)

  return (
    <div style={ng.wrap}>
      {/* Шапка */}
      <div style={ng.header}>
        <button style={ng.backBtn} onClick={onClose}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={ng.headTitle}>Заметки и цели</div>
          <div style={ng.headSub}>{notes.length} заметок · {goals.length} целей</div>
        </div>
        <button style={ng.addBtn}
          onClick={() => setEditor({ type: tab === 'notes' ? 'note' : 'goal', item: null })}>
          +
        </button>
      </div>

      {/* Табы */}
      <div style={ng.tabBar}>
        {[
          { id: 'notes', label: `Заметки (${notes.length})` },
          { id: 'goals', label: `Цели (${goals.length})` },
        ].map(t => (
          <button key={t.id} style={{
            ...ng.tab,
            borderBottomColor: tab === t.id ? 'var(--gold)' : 'transparent',
            color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
          }} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Список */}
      <div style={ng.list} className="scroll-y">
        {loading ? (
          <div style={ng.empty}>Загрузка...</div>
        ) : tab === 'notes' ? (
          notes.length === 0 ? (
            <div style={ng.emptyBlock}>
              <div style={ng.emptyIcon}>📝</div>
              <div style={ng.emptyTitle}>Нет заметок</div>
              <div style={ng.emptySub}>Нажми + чтобы написать первую</div>
            </div>
          ) : (
            <>
              {favNotes.length > 0 && (
                <>
                  <div style={ng.sectionLabel}>⭐ Избранные</div>
                  {favNotes.map(note => (
                    <NoteCard key={note.id} note={note}
                      onEdit={() => setEditor({ type: 'note', item: note })}
                      onToggleFav={() => toggleFavorite(note)}
                      onDelete={() => deleteNote(note.id)} />
                  ))}
                  {otherNotes.length > 0 && <div style={ng.sectionLabel}>Все заметки</div>}
                </>
              )}
              {otherNotes.map(note => (
                <NoteCard key={note.id} note={note}
                  onEdit={() => setEditor({ type: 'note', item: note })}
                  onToggleFav={() => toggleFavorite(note)}
                  onDelete={() => deleteNote(note.id)} />
              ))}
            </>
          )
        ) : (
          goals.length === 0 ? (
            <div style={ng.emptyBlock}>
              <div style={ng.emptyIcon}>🎯</div>
              <div style={ng.emptyTitle}>Нет целей</div>
              <div style={ng.emptySub}>Нажми + чтобы добавить первую цель</div>
            </div>
          ) : (
            <>
              {goals.filter(g => !g.is_done).map(goal => (
                <GoalCard key={goal.id} goal={goal}
                  onEdit={() => setEditor({ type: 'goal', item: goal })}
                  onToggleDone={() => toggleDone(goal)}
                  onDelete={() => deleteGoal(goal.id)} />
              ))}
              {goals.some(g => g.is_done) && (
                <>
                  <div style={ng.sectionLabel}>✓ Выполнено</div>
                  {goals.filter(g => g.is_done).map(goal => (
                    <GoalCard key={goal.id} goal={goal}
                      onEdit={() => setEditor({ type: 'goal', item: goal })}
                      onToggleDone={() => toggleDone(goal)}
                      onDelete={() => deleteGoal(goal.id)} />
                  ))}
                </>
              )}
            </>
          )
        )}
        <div style={{ height: 24 }} />
      </div>

      {/* Редактор */}
      {editor && (
        <EditorModal
          type={editor.type}
          item={editor.item}
          onSave={editor.type === 'note' ? saveNote : saveGoal}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

function NoteCard({ note, onEdit, onToggleFav, onDelete }) {
  const date = new Date(note.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return (
    <div style={ng.card}>
      <div style={ng.cardTop}>
        <div style={ng.cardTitle} onClick={onEdit}>
          {note.title || 'Без названия'}
        </div>
        <button style={{ ...ng.iconBtn, color: note.is_favorite ? '#f4c430' : 'var(--text-dim)' }}
          onClick={onToggleFav}>★</button>
      </div>
      {note.body ? (
        <div style={ng.cardBody}>{note.body}</div>
      ) : null}
      <div style={ng.cardFooter}>
        <span style={ng.cardDate}>{date}</span>
        <button style={ng.deleteBtn} onClick={onDelete}>Удалить</button>
      </div>
    </div>
  )
}

function GoalCard({ goal, onEdit, onToggleDone, onDelete }) {
  const date = new Date(goal.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return (
    <div style={{ ...ng.card, opacity: goal.is_done ? 0.65 : 1 }}>
      <div style={ng.cardTop}>
        <button style={{
          ...ng.checkbox,
          borderColor: goal.is_done ? 'var(--gold)' : 'var(--border)',
          background: goal.is_done ? 'rgba(201,168,76,.2)' : 'transparent',
        }} onClick={onToggleDone}>
          {goal.is_done && <span style={{ color: 'var(--gold)', fontSize: 13, lineHeight: 1 }}>✓</span>}
        </button>
        <div style={{ ...ng.cardTitle, flex: 1,
          textDecoration: goal.is_done ? 'line-through' : 'none',
          cursor: 'pointer', color: goal.is_done ? 'var(--text-muted)' : 'var(--text)',
        }} onClick={onEdit}>
          {goal.title || 'Без названия'}
        </div>
      </div>
      {goal.description ? (
        <div style={{ ...ng.cardBody, paddingLeft: 34 }}>{goal.description}</div>
      ) : null}
      <div style={ng.cardFooter}>
        <span style={ng.cardDate}>{date}</span>
        <button style={ng.deleteBtn} onClick={onDelete}>Удалить</button>
      </div>
    </div>
  )
}

function EditorModal({ type, item, onSave, onClose }) {
  const isNote = type === 'note'
  const [title,       setTitle]       = useState(item?.title       || '')
  const [body,        setBody]        = useState(item?.body        || '')
  const [description, setDescription] = useState(item?.description || '')
  const [isFavorite,  setIsFavorite]  = useState(item?.is_favorite || false)
  const [isDone,      setIsDone]      = useState(item?.is_done     || false)
  const [saving,      setSaving]      = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    if (isNote) {
      await onSave({ id: item?.id, title: title.trim(), body, is_favorite: isFavorite })
    } else {
      await onSave({ id: item?.id, title: title.trim(), description, is_done: isDone })
    }
    setSaving(false)
  }

  return (
    <>
      <div style={ng.backdrop} onClick={onClose} />
      <div style={ng.sheet}>
        <div style={ng.sheetTitle}>
          {item ? 'Редактировать' : (isNote ? '📝 Новая заметка' : '🎯 Новая цель')}
        </div>

        <input
          style={ng.input}
          placeholder={isNote ? 'Название заметки...' : 'Название цели...'}
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          maxLength={100}
        />

        {isNote ? (
          <>
            <textarea
              style={ng.textarea}
              placeholder="Текст заметки..."
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={2000}
            />
            <button style={{ ...ng.toggleRow, color: isFavorite ? '#f4c430' : 'var(--text-muted)' }}
              onClick={() => setIsFavorite(v => !v)}>
              <span style={{ fontSize: 20 }}>{isFavorite ? '★' : '☆'}</span>
              <span>В избранное</span>
            </button>
          </>
        ) : (
          <>
            <textarea
              style={ng.textarea}
              placeholder="Описание цели (необязательно)..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
            />
            <button style={{ ...ng.toggleRow, color: isDone ? 'var(--gold)' : 'var(--text-muted)' }}
              onClick={() => setIsDone(v => !v)}>
              <span style={{
                fontSize: 13, border: '1.5px solid', borderRadius: 6,
                width: 20, height: 20, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {isDone ? '✓' : ''}
              </span>
              <span>Отметить как выполнено</span>
            </button>
          </>
        )}

        <div style={ng.sheetBtns}>
          <button style={{ ...ng.saveBtn, opacity: (!title.trim() || saving) ? 0.5 : 1 }}
            onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? '...' : 'Сохранить'}
          </button>
          <button style={ng.cancelBtn} onClick={onClose}>Отмена</button>
        </div>
      </div>
    </>
  )
}

const ng = {
  wrap:      { position:'fixed', inset:0, zIndex:120, background:'var(--bg-deep)', display:'flex', flexDirection:'column', fontFamily:'var(--font-ui)' },
  header:    { flexShrink:0, display:'flex', alignItems:'center', gap:12, padding:'16px 16px 12px', borderBottom:'1px solid var(--border)' },
  backBtn:   { width:36, height:36, borderRadius:12, flexShrink:0, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text)', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', outline:'none', lineHeight:1 },
  addBtn:    { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#9a6a10,#c9a84c)', color:'#070710', border:'none', fontSize:24, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', outline:'none', flexShrink:0, boxShadow:'0 0 12px rgba(201,168,76,.3)' },
  headTitle: { fontSize:20, fontWeight:800, color:'var(--text)' },
  headSub:   { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  tabBar:    { flexShrink:0, display:'flex', borderBottom:'1px solid var(--border)' },
  tab:       { flex:1, padding:'12px 0', fontSize:14, fontWeight:600, background:'none', border:'none', borderBottom:'2px solid', cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)', transition:'color .2s, border-color .2s' },
  list:      { flex:1, overflowY:'auto', padding:'14px 16px 0' },
  sectionLabel: { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em', margin:'8px 0 8px 2px' },

  emptyBlock:{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'60px 24px' },
  emptyIcon: { fontSize:48 },
  emptyTitle:{ fontSize:17, fontWeight:700, color:'var(--text)' },
  emptySub:  { fontSize:13, color:'var(--text-muted)', textAlign:'center' },
  empty:     { textAlign:'center', color:'var(--text-muted)', fontSize:14, padding:'40px 0' },

  card:      { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'14px 14px 10px', marginBottom:10, display:'flex', flexDirection:'column', gap:7 },
  cardTop:   { display:'flex', alignItems:'flex-start', gap:8 },
  cardTitle: { fontSize:15, fontWeight:600, color:'var(--text)', flex:1, lineHeight:1.4, cursor:'pointer' },
  cardBody:  { fontSize:13, color:'var(--text-muted)', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' },
  cardFooter:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:2 },
  cardDate:  { fontSize:11, color:'var(--text-dim)' },
  iconBtn:   { background:'none', border:'none', fontSize:20, cursor:'pointer', outline:'none', padding:'2px 4px', flexShrink:0, lineHeight:1 },
  deleteBtn: { background:'none', border:'none', color:'rgba(255,80,80,.5)', fontSize:12, cursor:'pointer', outline:'none', padding:'2px 4px' },
  checkbox:  { width:22, height:22, borderRadius:6, border:'1.5px solid', flexShrink:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', outline:'none', marginTop:1 },

  backdrop:  { position:'absolute', inset:0, background:'rgba(7,7,16,.75)', zIndex:1, backdropFilter:'blur(4px)' },
  sheet:     { position:'absolute', bottom:0, left:0, right:0, zIndex:2, background:'var(--bg-surface)', borderRadius:'20px 20px 0 0', padding:'20px 16px calc(var(--safe-bottom, 0px) + 24px)', display:'flex', flexDirection:'column', gap:12, boxShadow:'0 -8px 32px rgba(0,0,0,.4)' },
  sheetTitle:{ fontSize:17, fontWeight:700, color:'var(--text)' },
  input:     { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text)', fontFamily:'var(--font-ui)', fontSize:15, padding:'12px 14px', outline:'none', width:'100%' },
  textarea:  { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text)', fontFamily:'var(--font-ui)', fontSize:14, padding:'12px 14px', outline:'none', width:'100%', minHeight:110, resize:'none', lineHeight:1.6 },
  toggleRow: { display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', outline:'none', fontFamily:'var(--font-ui)', fontSize:14, padding:'2px 0' },
  sheetBtns: { display:'flex', gap:8, marginTop:4 },
  saveBtn:   { flex:1, padding:'13px', borderRadius:14, background:'linear-gradient(135deg,#9a6a10,#c9a84c)', color:'#070710', border:'none', cursor:'pointer', fontWeight:700, fontSize:15, fontFamily:'var(--font-ui)' },
  cancelBtn: { flex:1, padding:'13px', borderRadius:14, background:'transparent', color:'var(--text-muted)', border:'1px solid var(--border)', cursor:'pointer', fontSize:14, fontFamily:'var(--font-ui)' },
}

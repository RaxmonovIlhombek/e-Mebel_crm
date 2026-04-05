import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { Btn, PageHeader, Card, Spinner, Empty } from '@/components/UI'
import { Plus, RefreshCw, ArrowUpRight, ArrowDownLeft, Search, Send, X, MessageSquare } from 'lucide-react'

const fmtDate = d => {
  if (!d) return ''
  const dt = new Date(d)
  const today = new Date()
  const isToday = dt.toDateString() === today.toDateString()
  if (isToday) return dt.toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' })
  return dt.toLocaleDateString('uz-UZ') + ' ' + dt.toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' })
}

const ROLE_LABELS = {
  admin:'Admin', manager:'Menejer', accountant:'Buxgalter', worker:'Omborchi', client:'Mijoz'
}

const displayName = (u) => {
  if (!u) return '—'
  if (typeof u === 'string') return u
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ')
  return full || u.username || `#${u.id}`
}

export default function Messages() {
  const { user, toast, addNotif } = useApp()
  const [msgs,    setMsgs]    = useState([])
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [search,  setSearch]  = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [readIds, setReadIds] = useState(new Set())
  const scrollRef = useRef(null)

  const load = useCallback(async (isSilent=false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await api.messages()
      setMsgs(Array.isArray(res) ? res : (res?.results ?? []))
    } catch(e) { if (!isSilent) toast(e.message, 'error') }
    finally { if (!isSilent) setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  // Short polling (har 15 soniyada)
  useEffect(() => {
    const t = setInterval(() => load(true), 15000)
    return () => clearInterval(t)
  }, [load])

  const markRead = async (msgId) => {
    setReadIds(prev => new Set([...prev, msgId]))
    try { await api.messageUpdate(msgId, { is_read: true }) } catch {}
  }

  // Xabarlarni suhbatlarga guruhlash
  const conversations = useMemo(() => {
    const groups = {}
    msgs.forEach(m => {
      const isSent = m.sender === user?.id || m.sender_id === user?.id
      const otherUser = isSent 
        ? (m.receiver_info || m.receiver_detail || { id: m.receiver, username: m.receiver_name })
        : (m.sender_info   || m.sender_detail   || { id: m.sender,   username: m.sender_name })
      
      const oid = otherUser.id
      if (!groups[oid]) {
        groups[oid] = {
          user: otherUser,
          messages: [],
          lastMessage: m,
          unreadCount: 0
        }
      }
      groups[oid].messages.push(m)
      
      // O'qilmagan xabar bo'lsa
      const isUnread = !isSent && !m.is_read && !readIds.has(m.id)
      if (isUnread) groups[oid].unreadCount++
      
      // Oxirgi xabar vaqtini tekshirish
      if (new Date(m.created_at) > new Date(groups[oid].lastMessage.created_at)) {
        groups[oid].lastMessage = m
      }
    })
    
    // Qidiruv bo'yicha filtr
    let list = Object.values(groups)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c => 
        displayName(c.user).toLowerCase().includes(s) ||
        c.messages.some(m => m.body.toLowerCase().includes(s))
      )
    }

    // Xabar vaqti bo'yicha saralash (eng oxirgisi tepada)
    return list.sort((a,b) => 
      new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
    )
  }, [msgs, user, readIds, search])

  // Tanlangan suhbat xabarlari
  const activeConv = conversations.find(c => String(c.user.id) === String(selectedId))

  const currentUnread = msgs.filter(m =>
    (m.receiver === user?.id || m.receiver_id === user?.id) &&
    !m.is_read && !readIds.has(m.id)
  ).length

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedId, activeConv?.messages.length])

  return (
    <div>
      <PageHeader
        title="Xabarlar"
        subtitle={currentUnread > 0 ? `${currentUnread} ta o'qilmagan xabar` : "Barcha xabarlar o'qilgan"}
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" icon={<RefreshCw size={14}/>} onClick={load}>Yangilash</Btn>
            <Btn icon={<Plus size={14}/>} onClick={() => setShowNew(true)}>Xabar yuborish</Btn>
          </div>
        }
      />

      {/* Qidiruv */}
      <div style={{ position:'relative', marginBottom:16, maxWidth:360 }}>
        <Search size={15} style={{ position:'absolute', left:12, top:'50%',
          transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }}/>
        <input
          placeholder="Xabarlarda qidirish..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'9px 12px 9px 36px', borderRadius:10, fontSize:13,
            border:'1.5px solid var(--border2)', background:'#fff', boxSizing:'border-box',
            fontFamily:'inherit', outline:'none' }}
          onFocus={e => e.target.style.borderColor='var(--accent)'}
          onBlur={e => e.target.style.borderColor='var(--border2)'}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%',
            transform:'translateY(-50%)', background:'none', border:'none',
            cursor:'pointer', color:'var(--text3)', padding:2 }}>
            <X size={13}/>
          </button>
        )}
      </div>

      {loading && !msgs.length ? <Spinner/> : (
        <div style={{
          display:'flex', height:'calc(100vh - 180px)', background:'#fff',
          borderRadius:16, border:'1px solid var(--border)', overflow:'hidden',
          boxShadow:'var(--shadow-sm)'
        }}>
          {/* ────── LEV: KONTAKTLAR ────── */}
          <div style={{
            width:320, borderRight:'1px solid var(--border)', display:'flex',
            flexDirection:'column', background:'#f8fafc', flexShrink:0
          }}>
            <div style={{ padding:16, borderBottom:'1px solid var(--border)' }}>
              <Btn icon={<Plus size={14}/>} onClick={() => setShowNew(true)} style={{ width:'100%' }}>
                Yangi suhbat
              </Btn>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {conversations.length === 0 && !loading && (
                <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                  Suhbatlar mavjud emas
                </div>
              )}
              {conversations.map(conv => {
                const u = conv.user
                const isActive = String(u.id) === String(selectedId)
                return (
                  <div key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    style={{
                      display:'flex', gap:12, padding:'14px 16px', cursor:'pointer',
                      background: isActive ? 'var(--accent-lo)' : 'transparent',
                      borderBottom:'1px solid var(--border)', transition:'all 0.1s'
                    }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background='var(--surface2)')}
                    onMouseLeave={e => !isActive && (e.currentTarget.style.background='transparent')}
                  >
                    <div style={{
                      width:44, height:44, borderRadius:'50%', flexShrink:0,
                      background: isActive ? 'var(--accent)' : 'var(--blue-lo)',
                      color: isActive ? '#fff' : 'var(--blue)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:16, fontWeight:700
                    }}>
                      {(u.first_name?.[0] || u.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:4 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {displayName(u)}
                        </div>
                        <div style={{ fontSize:10, color:'var(--text3)', whiteSpace:'nowrap' }}>
                          {fmtDate(conv.lastMessage.created_at)}
                        </div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2 }}>
                        <div style={{ fontSize:12, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {conv.lastMessage.body}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span style={{
                            background:'var(--accent)', color:'#fff', minWidth:18, height:18,
                            borderRadius:10, fontSize:10, fontWeight:800,
                            display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px'
                          }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ────── O'NG: CHAT OYNASI ────── */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff' }}>
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding:'12px 20px', borderBottom:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  background:'var(--surface2)'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--blue-lo)', color:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                      {(activeConv.user.first_name?.[0] || activeConv.user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{displayName(activeConv.user)}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{ROLE_LABELS[activeConv.user.role] || activeConv.user.role}</div>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:12, background:'#f1f5f9' }}>
                  {activeConv.messages.slice().sort((a,b) => new Date(a.created_at) - new Date(b.created_at)).map(m => {
                    const isMe = m.sender === user?.id || m.sender_id === user?.id
                    const isUnread = !isMe && !m.is_read && !readIds.has(m.id)
                    if (isUnread) markRead(m.id)

                    return (
                      <div key={m.id} style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth:'75%',
                        display:'flex', flexDirection:'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{
                          padding:'10px 14px', borderRadius:16,
                          borderBottomRightRadius: isMe ? 4 : 16,
                          borderBottomLeftRadius: isMe ? 16 : 4,
                          background: isMe ? 'var(--accent)' : '#fff',
                          color: isMe ? '#fff' : 'var(--text)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          fontSize:13.5, whiteSpace:'pre-wrap', lineHeight:1.5
                        }}>
                          {m.body}
                          <div style={{
                            textAlign:'right', fontSize:10, marginTop:4, opacity:0.7,
                            display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4
                          }}>
                            {new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' })}
                            {isMe && (m.is_read ? ' ✓✓' : ' ✓')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Reply Input */}
                <div style={{ padding:16, borderTop:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', gap:10 }}>
                    <textarea
                      placeholder="Xabar yozing..."
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          const input = e.target.value
                          if (!input.trim()) return
                          api.messageSend({ receiver: activeConv.user.id, body: input.trim() })
                            .then(() => { e.target.value = ''; load(true) })
                        }
                      }}
                      style={{
                        flex:1, padding:'10px 14px', borderRadius:12, border:'1.5px solid var(--border2)',
                        fontFamily:'inherit', fontSize:13.5, outline:'none', resize:'none', background:'var(--surface2)'
                      }}
                      onFocus={e => e.target.style.borderColor='var(--accent)'}
                      onBlur={e => e.target.style.borderColor='var(--border2)'}
                    />
                    <Btn 
                      onClick={(e) => {
                        const textarea = e.currentTarget.previousSibling
                        const input = textarea.value
                        if (!input.trim()) return
                        api.messageSend({ receiver: activeConv.user.id, body: input.trim() })
                          .then(() => { textarea.value = ''; load(true) })
                      }}
                      icon={<Send size={16}/>} 
                      style={{ height:'auto', padding:'0 20px' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text3)', gap:16 }}>
                <div style={{ width:80, height:80, background:'var(--surface2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MessageSquare size={32} style={{ opacity:0.3 }}/>
                </div>
                <div style={{ fontSize:15, fontWeight:600 }}>Suhbatni tanlang</div>
                <Btn variant="outline" onClick={() => setShowNew(true)}>Yangi xabar yozish</Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {showNew && (
        <NewMessageModal
          currentUserId={user?.id}
          onClose={() => setShowNew(false)}
          toast={toast}
          reload={load}
        />
      )}
    </div>
  )
}

// ── Yangi xabar modal ─────────────────────────────────────────────────────────
function NewMessageModal({ currentUserId, onClose, toast, reload }) {
  const [users,   setUsers]   = useState([])
  const [uLoad,   setULoad]   = useState(true)
  const [form,    setForm]    = useState({ receiver:'', body:'', order_ref:'' })
  const [saving,  setSaving]  = useState(false)
  const [uSearch, setUSearch] = useState('')
  const bodyRef = useRef(null)

  // Barcha foydalanuvchilarni yuklash
  useEffect(() => {
    const loadUsers = async () => {
      setULoad(true)
      try {
        // Barcha rollarni yuklash
        const res = await api.users()
        const list = Array.isArray(res) ? res : (res?.results ?? [])
        // O'zini ro'yxatdan chiqarish
        setUsers(list.filter(u => u.id !== currentUserId))
      } catch(e) {
        toast('Foydalanuvchilar yuklanmadi', 'error')
      } finally {
        setULoad(false)
      }
    }
    loadUsers()
  }, [])

  const filteredUsers = users.filter(u => {
    if (!uSearch) return true
    const s = uSearch.toLowerCase()
    const name = [u.first_name, u.last_name, u.username].filter(Boolean).join(' ').toLowerCase()
    return name.includes(s)
  })

  const selectedUser = users.find(u => String(u.id) === String(form.receiver))

  const send = async () => {
    if (!form.receiver) { toast('Qabul qiluvchi tanlang', 'error'); return }
    if (!form.body.trim()) { toast('Xabar matni kiriting', 'error'); return }
    setSaving(true)
    try {
      await api.messageSend({
        receiver:  Number(form.receiver),
        body:      form.body.trim(),
        order_ref: form.order_ref ? Number(form.order_ref) : null,
      })
      toast('Xabar yuborildi ✉️', 'success')
      reload()
      onClose()
    } catch(e) {
      const errMsg = typeof e.message === 'string' ? e.message : JSON.stringify(e)
      toast('XATO: ' + errMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, background:'rgba(17,24,39,0.5)',
      backdropFilter:'blur(4px)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
    <div style={{
      background:'#fff', borderRadius:18, width:'100%', maxWidth:520,
      maxHeight:'90vh', overflowY:'auto',
      boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'20px 24px', borderBottom:'1px solid #e5e7eb' }}>
        <span style={{ fontWeight:700, fontSize:16 }}>Xabar yuborish ✉️</span>
        <button type="button" onClick={onClose} style={{ background:'#f3f4f6', border:'none',
          width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:16 }}>✕</button>
      </div>
      <div style={{ padding:'20px 24px' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Qabul qiluvchi qidirish */}
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
            Qabul qiluvchi *
          </label>

          {/* Qidiruv */}
          <div style={{ position:'relative', marginBottom:8 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%',
              transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }}/>
            <input
              placeholder="Ism yoki username bilan qidiring..."
              value={uSearch} onChange={e => setUSearch(e.target.value)}
              style={{ width:'100%', padding:'9px 12px 9px 32px', borderRadius:9,
                border:'1.5px solid var(--border2)', fontSize:13, boxSizing:'border-box',
                fontFamily:'inherit', outline:'none', background:'var(--surface2)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
          </div>

          {/* Foydalanuvchilar ro'yxati */}
          {uLoad ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:13 }}>
              Yuklanmoqda...
            </div>
          ) : (
            <div style={{ maxHeight:200, overflowY:'auto', border:'1.5px solid var(--border)',
              borderRadius:10, background:'#fff' }}>
              {filteredUsers.length === 0 && (
                <div style={{ padding:'16px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                  {uSearch ? 'Topilmadi' : "Foydalanuvchilar yo'q"}
                </div>
              )}
              {filteredUsers.map(u => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
                const isSelected = String(form.receiver) === String(u.id)
                return (
                  <div key={u.id}
                    onClick={() => { setForm(f => ({...f, receiver: String(u.id)})); bodyRef.current?.focus() }}
                    style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                      cursor:'pointer', transition:'background 0.15s',
                      background: isSelected ? 'var(--accent-lo)' : 'transparent',
                      borderBottom:'1px solid var(--border)',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                      background: isSelected ? 'var(--accent)' : 'var(--surface3)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:700,
                      color: isSelected ? '#fff' : 'var(--text2)' }}>
                      {(u.first_name?.[0] || u.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{name}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>
                        {ROLE_LABELS[u.role] || u.role}
                        {u.phone ? ` · ${u.phone}` : ''}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize:16, color:'var(--accent)' }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Tanlangan foydalanuvchi */}
          {selectedUser && (
            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8,
              background:'var(--accent-lo)', padding:'8px 12px', borderRadius:8 }}>
              <span style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>
                ✓ Tanlandi:
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>
                {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.username}
              </span>
              <span style={{ fontSize:11, color:'var(--text3)' }}>
                ({ROLE_LABELS[selectedUser.role] || selectedUser.role})
              </span>
            </div>
          )}
        </div>

        {/* Xabar matni */}
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
            Xabar matni *
          </label>
          <textarea
            ref={bodyRef}
            placeholder="Xabaringizni yozing..."
            value={form.body}
            onChange={e => setForm(f => ({...f, body: e.target.value}))}
            rows={4}
            style={{ width:'100%', padding:'10px 14px', borderRadius:10, fontSize:13,
              border:'1.5px solid var(--border2)', resize:'vertical', minHeight:100,
              fontFamily:'inherit', outline:'none', boxSizing:'border-box',
              background:'var(--surface2)', color:'var(--text)', lineHeight:1.6 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>

        {/* Buyurtma ID (ixtiyoriy) */}
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)',
            textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>
            Buyurtma ID <span style={{ fontWeight:400, textTransform:'none', color:'var(--text3)' }}>(ixtiyoriy)</span>
          </label>
          <input
            type="text" placeholder="Masalan: 42"
            value={form.order_ref}
            onChange={e => setForm(f => ({...f, order_ref: e.target.value.replace(/\D/g, '')}))}
            style={{ width:'100%', padding:'9px 14px', borderRadius:9, fontSize:13,
              border:'1.5px solid var(--border2)', fontFamily:'inherit', outline:'none',
              background:'var(--surface2)', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border2)'}
          />
        </div>
      </div>
      </div>
      <div style={{ padding:'16px 24px', borderTop:'1px solid #e5e7eb',
        display:'flex', gap:8, justifyContent:'flex-end', background:'#f9fafb',
        borderRadius:'0 0 18px 18px' }}>
        <button type="button" onClick={onClose} style={{
          padding:'8px 16px', borderRadius:8, border:'1px solid #d1d5db',
          background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          Bekor
        </button>
        <button type="button" onClick={send} disabled={saving} style={{
          padding:'8px 16px', borderRadius:8, border:'none',
          background:'var(--accent)', color:'#fff', cursor:'pointer',
          fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6,
          opacity: saving ? 0.7 : 1 }}>
          {saving ? '...' : '✈️ Yuborish'}
        </button>
      </div>
    </div>
    </div>
  )
}
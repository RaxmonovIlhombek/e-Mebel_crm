import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import {
  Btn, Modal, Input, Select, PageHeader, Card,
  Spinner, SLabel, SearchInput, Pagination,
} from '@/components/UI'
import { PhoneInput, rawPhone, isPhoneComplete } from '@/components/PhoneInput'
import {
  Plus, Edit2, Trash2, UserCheck, UserX, RefreshCw,
  Eye, EyeOff, Phone, Mail, ShieldCheck, KeyRound,
  BarChart2, Clock, TrendingUp, CheckCircle, XCircle, User,
} from 'lucide-react'
import ReactSelect from 'react-select'
import { useFetch } from '@/hooks/useFetch'

const ROLE_LABELS = {
  admin:'Admin', manager:'Menejer', accountant:'Buxgalter', worker:'Omborchi', client:'Mijoz',
}
const ROLE_COLORS = {
  admin:      { bg:'#fef3c7', color:'#d97706', dot:'#f59e0b' },
  manager:    { bg:'#dbeafe', color:'#2563eb', dot:'#3b82f6' },
  accountant: { bg:'#d1fae5', color:'#059669', dot:'#10b981' },
  worker:     { bg:'#ede9fe', color:'#7c3aed', dot:'#8b5cf6' },
  client:     { bg:'#f3f4f6', color:'#6b7280', dot:'#9ca3af' },
}
const ROLE_ICONS = {
  admin:'🛡️', manager:'📋', accountant:'💰', worker:'🔧', client:'👤',
}

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.client
  return (
    <span style={{ ...c, fontSize:11, fontWeight:700, padding:'3px 10px',
      borderRadius:100, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:4 }}>
      <span>{ROLE_ICONS[role]}</span>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

function Avatar({ user, size=38 }) {
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()
  const colors   = ['#f97316','#6366f1','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6','#f59e0b']
  const color    = colors[(user?.id||0) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`linear-gradient(135deg,${color},${color}bb)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.38, fontWeight:800, color:'#fff', border:`2px solid ${color}40` }}>
      {initials}
    </div>
  )
}

/* ── Stat karta ── */
function StatCard({ icon, label, value, sub, color='#6366f1', onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:14, padding:'16px 18px',
      border:`1.5px solid #e2e8f0`, cursor:onClick?'pointer':'default',
      transition:'all 0.15s', flex:1, minWidth:130,
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor=color)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor='#e2e8f0')}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:`${color}15`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
          {icon}
        </div>
        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600,
          textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ASOSIY SAHIFA
═══════════════════════════════════════════════════════════════════════════ */
export default function Staff() {
  const { user: me, toast } = useApp()
  const [staff,      setStaff]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAdd,    setShowAdd]    = useState(false)
  const [editUser,   setEditUser]   = useState(null)
  const [delUser,    setDelUser]    = useState(null)
  const [viewUser,   setViewUser]   = useState(null)
  const [resetUser,  setResetUser]  = useState(null)
  const [activeFilter, setActiveFilter] = useState('')
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)

  const isAdmin = me?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.users({ role: roleFilter, active: activeFilter, search, page })
      const list = res.results || []
      setStaff(list.filter(u => u.id !== me?.id))
      setTotal(res.count || 0)
    } catch(e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [roleFilter, activeFilter, search, page, me?.id])

  useEffect(() => { setPage(1) }, [roleFilter, activeFilter, search])
  useEffect(() => { load() }, [load])


  /* ── Toggle faollik ── */
  const handleToggleActive = async (u) => {
    const newVal = !u.is_active
    // Optimistik update — darhol UI ni yangilaymiz
    setStaff(prev => prev.map(s => s.id === u.id ? { ...s, is_active: newVal } : s))
    try {
      await api.userToggleActive(u.id)
      toast(`${u.first_name || u.username} ${newVal ? '✅ faollashtirildi' : '🔒 bloklandi'}`, 'success')
    } catch(e) {
      // Xato bo'lsa qayta asl holatiga qaytaramiz
      setStaff(prev => prev.map(s => s.id === u.id ? { ...s, is_active: u.is_active } : s))
      toast(e.message, 'error')
    }
  }

  /* ── O'chirish ── */
  const handleDelete = async () => {
    if (!delUser) return
    try {
      await api.del(`/users/${delUser.id}/`)
      toast("Xodim o'chirildi", 'success')
      setDelUser(null); load()
    } catch(e) { toast(e.message, 'error') }
  }

  /* ── Statistika ── */
  const roleCounts = Object.entries(ROLE_LABELS).map(([role, label]) => ({
    role, label, count: staff.filter(u => u.role === role).length,
  })).filter(s => s.count > 0)

  const activeCount   = staff.filter(u => u.is_active).length
  const blockedCount  = staff.length - activeCount

  return (
    <div>
      <PageHeader
        title="Xodimlar"
        subtitle={`Jami ${total} ta xodim`}
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" icon={<RefreshCw size={13}/>} size="sm" onClick={load}>Yangilash</Btn>
            <Btn icon={<Plus size={14}/>} onClick={() => setShowAdd(true)}>Xodim qo'shish</Btn>
          </div>
        }
      />

      {/* ── Stat kartalar ── */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard icon="👥" label="Jami" value={staff.length} sub="xodim" color="#6366f1"
          onClick={() => setRoleFilter('')}/>
        <StatCard icon="✅" label="Faol" value={activeCount} sub="xodim" color="#10b981"/>
        {blockedCount > 0 && (
          <StatCard icon="🔒" label="Bloklangan" value={blockedCount} sub="xodim" color="#ef4444"/>
        )}
        {roleCounts.map(s => (
          <StatCard key={s.role} icon={ROLE_ICONS[s.role]} label={s.label}
            value={s.count} color={ROLE_COLORS[s.role]?.dot}
            onClick={() => setRoleFilter(roleFilter===s.role ? '' : s.role)}/>
        ))}
      </div>

      {/* ── Filter ── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Ism, username, telefon..."/>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding:'8px 14px', borderRadius:10, border:'1.5px solid #e2e8f0',
            fontSize:13, fontFamily:'inherit', background:'#fff', outline:'none', cursor:'pointer' }}
          onFocus={e => e.target.style.borderColor='var(--accent)'}
          onBlur={e => e.target.style.borderColor='#e2e8f0'}>
          <option value="">Barcha rollar</option>
          {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {/* Faol/blok filter */}
        <div style={{ display:'flex', gap:5 }}>
          {[['','Barchasi'],['true','Faollar'],['false','Bloklangan']].map(([v,l]) => (
            <button key={v} onClick={() => setActiveFilter(v)} style={{
              padding:'7px 13px', borderRadius:9, border:'1.5px solid #e2e8f0',
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              transition:'all 0.1s',
              background: activeFilter===v ? 'var(--accent)':'#fff',
              color:       activeFilter===v ? '#fff':'#64748b',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Jadval ── */}
      {loading ? <Card><Spinner/></Card> : (
        <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e2e8f0',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          {staff.length === 0 ? (
            <div style={{ padding:'48px 0', textAlign:'center', color:'#94a3b8', fontSize:14 }}>
              👤 Xodimlar topilmadi
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                  {['Xodim','Rol','Telefon / Email','Faollik','Holat','Amallar'].map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11,
                      fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                      letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((u, i) => {
                  const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
                  const canEdit  = isAdmin || (me?.role==='manager' && u.role!=='admin')
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: i<staff.length-1 ? '1px solid #f1f5f9':'none', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      onClick={() => setViewUser(u)}>

                      {/* Xodim */}
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                          <div style={{ position:'relative' }}>
                            <Avatar user={u}/>
                            <div style={{ position:'absolute', bottom:0, right:0,
                              width:10, height:10, borderRadius:'50%', border:'2px solid #fff',
                              background: u.is_active ? '#22c55e' : '#94a3b8' }}/>
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{fullName}</div>
                            <div style={{ fontSize:11, color:'#94a3b8' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td style={{ padding:'13px 16px' }} onClick={e => e.stopPropagation()}>
                        <RoleBadge role={u.role}/>
                      </td>

                      {/* Telefon / Email */}
                      <td style={{ padding:'13px 16px' }}>
                        {u.phone && (
                          <div style={{ display:'flex', alignItems:'center', gap:5,
                            fontSize:12, color:'#374151', fontFamily:'var(--mono)', marginBottom:2 }}>
                            <Phone size={10} color="#94a3b8"/> {u.phone}
                          </div>
                        )}
                        {u.email && (
                          <div style={{ display:'flex', alignItems:'center', gap:5,
                            fontSize:12, color:'#94a3b8' }}>
                            <Mail size={10}/> {u.email}
                          </div>
                        )}
                        {!u.phone && !u.email && <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                      </td>

                      {/* Faollik (oxirgi kirish) */}
                      <td style={{ padding:'13px 16px' }}>
                        {u.last_login ? (
                          <div style={{ fontSize:11, color:'#94a3b8' }}>
                            <div style={{ fontWeight:600, color:'#475569', marginBottom:2 }}>Oxirgi kirish</div>
                            {new Date(u.last_login).toLocaleDateString('uz-UZ')}
                          </div>
                        ) : (
                          <span style={{ fontSize:11, color:'#cbd5e1' }}>Kirmagan</span>
                        )}
                      </td>

                      {/* Holat */}
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:100,
                          background: u.is_active ? '#f0fdf4' : '#f1f5f9',
                          color:       u.is_active ? '#15803d' : '#94a3b8' }}>
                          {u.is_active ? '● Faol' : '● Bloklangan'}
                        </span>
                      </td>

                      {/* Amallar */}
                      <td style={{ padding:'13px 16px' }} onClick={e => e.stopPropagation()}>
                        {canEdit && (
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={() => setEditUser(u)} title="Tahrirlash"
                              style={btnStyle('#eff6ff','#2563eb')}>
                              <Edit2 size={13}/>
                            </button>
                            <button onClick={() => handleToggleActive(u)}
                              title={u.is_active ? 'Bloklash' : 'Faollashtirish'}
                              style={btnStyle(u.is_active?'#fefce8':'#f0fdf4', u.is_active?'#d97706':'#16a34a')}>
                              {u.is_active ? <UserX size={13}/> : <UserCheck size={13}/>}
                            </button>
                            {isAdmin && (
                              <>
                                <button onClick={() => setResetUser(u)} title="Parolni reset"
                                  style={btnStyle('#f5f3ff','#7c3aed')}>
                                  <KeyRound size={13}/>
                                </button>
                                <button onClick={() => setDelUser(u)} title="O'chirish"
                                  style={btnStyle('#fef2f2','#dc2626')}>
                                  <Trash2 size={13}/>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <Pagination total={total} current={page} onChange={setPage} />
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd   && <StaffFormModal onClose={() => setShowAdd(false)}  onSaved={() => { setShowAdd(false); load() }}  toast={toast} currentRole={me?.role}/>}
      {editUser  && <StaffFormModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); load() }} toast={toast} currentRole={me?.role}/>}
      {viewUser  && <StaffProfileModal user={viewUser} onClose={() => setViewUser(null)} onEdit={() => { setViewUser(null); setEditUser(viewUser) }} canEdit={isAdmin || (me?.role==='manager' && viewUser?.role!=='admin')}/>}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} toast={toast}/>}

      {delUser && (
        <Modal title="Xodimni o'chirish" onClose={() => setDelUser(null)} maxWidth={400}
          footer={<><Btn variant="ghost" onClick={() => setDelUser(null)}>Bekor</Btn>
            <Btn onClick={handleDelete} style={{ background:'#ef4444', color:'#fff' }}>Ha, o'chirish</Btn></>}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'8px 0' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#fef2f2',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>⚠️</div>
            <p style={{ fontSize:14, color:'#475569', textAlign:'center', lineHeight:1.7 }}>
              <strong>{delUser.first_name || delUser.username}</strong> ni o'chirishni tasdiqlaysizmi?<br/>
              <span style={{ color:'#94a3b8', fontSize:12 }}>Bu amalni bekor qilib bo'lmaydi.</span>
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

const btnStyle = (bg, color) => ({
  padding:'6px 8px', borderRadius:8, border:'none',
  background:bg, color, cursor:'pointer', display:'flex', alignItems:'center',
  transition:'opacity 0.15s',
})

/* ═══════════════════════════════════════════════════════════════════════════
   XODIM PROFIL MODAL
═══════════════════════════════════════════════════════════════════════════ */
function StaffProfileModal({ user, onClose, onEdit, canEdit }) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
  const colors   = ['#f97316','#6366f1','#10b981','#3b82f6','#8b5cf6','#ef4444']
  const color    = colors[(user.id||0) % colors.length]

  return (
    <Modal title="" onClose={onClose} maxWidth={480}>
      {/* Header */}
      <div style={{ margin:'-20px -24px 22px',
        background:`linear-gradient(135deg, #1a2540, #2d3a5e)`,
        padding:'28px 24px 22px', borderRadius:'18px 18px 0 0',
        display:'flex', flexDirection:'column', alignItems:'center', gap:10, textAlign:'center' }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:72, height:72, borderRadius:'50%',
            background:`linear-gradient(135deg,${color},${color}bb)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, fontWeight:900, color:'#fff',
            border:'3px solid rgba(255,255,255,0.2)', boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
            {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
          </div>
          <div style={{ position:'absolute', bottom:2, right:2, width:14, height:14,
            borderRadius:'50%', border:'2px solid #1a2540',
            background: user.is_active ? '#22c55e' : '#94a3b8' }}/>
        </div>
        <div>
          <h3 style={{ fontSize:18, fontWeight:900, color:'#fff', margin:0 }}>{fullName}</h3>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:3 }}>@{user.username}</div>
        </div>
        <RoleBadge role={user.role}/>

        {/* Mini stats */}
        <div style={{ display:'flex', gap:8, marginTop:6, width:'100%' }}>
          {[
            { label:"Buyurtmalar", value: user.order_count ?? '—' },
            { label:"Faollik", value: user.is_active ? 'Faol' : 'Blok' },
            { label:"Qo'shilgan", value: user.date_joined ? new Date(user.date_joined).toLocaleDateString('uz-UZ',{day:'2-digit',month:'short',year:'numeric'}) : '—' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:'rgba(255,255,255,0.08)',
              borderRadius:10, padding:'8px 6px', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kontakt info */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { icon:<Phone size={15}/>,      label:'Telefon', value:user.phone },
          { icon:<Mail size={15}/>,       label:'Email',   value:user.email },
          { icon:<User size={15}/>,       label:'Mijoz profili', value:user.client_profile_name ? (
            <a href={`/clients?search=${user.client_profile_name}`} style={{ color:'var(--accent)', textDecoration:'none', fontWeight:700 }}>
              🔗 {user.client_profile_name}
            </a>
          ) : 'Bog\'lanmagan' },
          { icon:<ShieldCheck size={15}/>, label:'Rol',    value:ROLE_LABELS[user.role]||user.role },
          { icon:<Clock size={15}/>,      label:'Oxirgi kirish',
            value:user.last_login ? new Date(user.last_login).toLocaleString('uz-UZ',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Kirmagan' },
        ].map(row => (
          <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12,
            padding:'10px 14px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
            <div style={{ color:'#94a3b8', display:'flex', alignItems:'center', width:20 }}>{row.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:1 }}>{row.label}</div>
              <div style={{ fontSize:13, fontWeight:600, color: row.value ? '#0f172a':'#cbd5e1' }}>
                {row.value || '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex:1 }}>Yopish</Btn>
          <Btn onClick={onEdit} style={{ flex:2 }} icon={<Edit2 size={13}/>}>Tahrirlash</Btn>
        </div>
      )}
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAROL RESET MODAL
═══════════════════════════════════════════════════════════════════════════ */
function ResetPasswordModal({ user, onClose, toast }) {
  const [newPass,  setNewPass]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving,   setSaving]   = useState(false)

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username

  const save = async () => {
    if (!newPass || newPass.length < 6) return toast("Kamida 6 ta belgi kiriting", 'error')
    setSaving(true)
    try {
      await api.userResetPassword(user.id, { new_password: newPass })
      toast(`${fullName} paroli yangilandi ✅`, 'success')
      onClose()
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={`Parolni reset — ${fullName}`} onClose={onClose} maxWidth={420}
      footer={<><Btn variant="ghost" onClick={onClose}>Bekor</Btn><Btn onClick={save} loading={saving}>Saqlash</Btn></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ padding:'12px 14px', background:'#eff6ff', borderRadius:10,
          fontSize:12, color:'#1d4ed8', fontWeight:600, display:'flex', gap:8, alignItems:'center' }}>
          <KeyRound size={14}/> Admin sifatida xodim parolini almashtirmoqdasiz
        </div>
        <div>
          <SLabel>Yangi parol *</SLabel>
          <div style={{ position:'relative' }}>
            <input type={showPass ? 'text':'password'}
              placeholder="Kamida 6 ta belgi"
              value={newPass} onChange={e => setNewPass(e.target.value)}
              style={{ width:'100%', padding:'10px 40px 10px 12px', borderRadius:10, fontSize:13,
                border:'1.5px solid #e2e8f0', fontFamily:'inherit', outline:'none',
                boxSizing:'border-box', color:'#0f172a' }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                display:'flex', alignItems:'center' }}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        {newPass.length > 0 && newPass.length < 6 && (
          <div style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>
            ⚠ Kamida 6 ta belgi kiritilishi kerak ({newPass.length}/6)
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   XODIM QO'SHISH / TAHRIRLASH FORMASI
═══════════════════════════════════════════════════════════════════════════ */
// ── Forma qatori (StaffFormModal tashqarisida — focus saqlanishi uchun) ──────
function FRow({ label, required, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#64748b',
        textTransform:'uppercase', letterSpacing:'0.5px' }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize:12, color:'#ef4444' }}>⚠ {error}</span>}
    </div>
  )
}

function StaffFormModal({ user, onClose, onSaved, toast, currentRole }) {
  const isEdit     = !!user
  const [saving,   setSaving]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors,   setErrors]   = useState({})
  
  const { data: clientsRaw } = useFetch('/clients/?archived=false')
  const clients = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw?.results ?? [])

  const allowedRoles = currentRole === 'admin'
    ? ['manager','accountant','worker','client']
    : ['worker','client']

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    username:   user?.username   || '',
    email:      user?.email      || '',
    phone:      user?.phone      || '+998(',
    role:       user?.role       || allowedRoles[0],
    password:   '',
    is_active:  user?.is_active ?? true,
    client_profile: user?.client_profile || '',
    telegram_chat_id: user?.telegram_chat_id || '',
    telegram_username: user?.telegram_username || '',
  })

  const set = (k, v) => { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:''})) }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = "Majburiy"
    if (!form.username.trim())   e.username   = "Majburiy"
    else if (form.username.length < 3) e.username = "Kamida 3 ta belgi"
    if (!isEdit && !form.password) e.password = "Majburiy"
    if (form.password && form.password.length < 6) e.password = "Kamida 6 ta belgi"
    if (form.phone && form.phone !== '+998(' && !isPhoneComplete(form.phone))
      e.phone = "To'liq kiriting"
    return e
  }

  const save = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    const data = {
      first_name: form.first_name,
      last_name:  form.last_name,
      username:   form.username,
      email:      form.email,
      phone:      form.phone !== '+998(' ? rawPhone(form.phone) : '',
      role:       form.role,
      is_active:  form.is_active,
      client_profile: form.role === 'client' ? form.client_profile : null,
      telegram_chat_id: form.telegram_chat_id,
      telegram_username: form.telegram_username,
    }
    if (form.password) data.password = form.password
    try {
      if (isEdit) {
        await api.patch(`/users/${user.id}/`, data)
        toast('Xodim yangilandi ✅', 'success')
      } else {
        await api.register({ ...data, password: form.password })
        toast("Xodim qo'shildi ✅", 'success')
      }
      onSaved()
    } catch(e) { toast(e.message || 'Xato yuz berdi', 'error') }
    finally { setSaving(false) }
  }

  const inputSx = (hasError=false) => ({
    width:'100%', padding:'10px 12px', borderRadius:10, fontSize:13,
    border:`1.5px solid ${hasError ? '#ef4444':'#e2e8f0'}`, fontFamily:'inherit',
    outline:'none', boxSizing:'border-box', color:'#0f172a',
  })

  return (
    <Modal
      title={isEdit ? `✏️ Tahrirlash — ${user.username}` : "➕ Yangi xodim qo'shish"}
      onClose={onClose} maxWidth={540}
      footer={
        <><Btn variant="ghost" onClick={onClose}>Bekor</Btn>
          <Btn onClick={save} loading={saving}>{isEdit ? 'Saqlash' : "Qo'shish"}</Btn></>
      }>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FRow label="Ism" required error={errors.first_name}>
            <input style={inputSx(errors.first_name)} placeholder="Alibek"
              value={form.first_name} onChange={e => set('first_name', e.target.value)}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor=errors.first_name?'#ef4444':'#e2e8f0'}/>
          </FRow>
          <FRow label="Familiya" error={errors.last_name}>
            <input style={inputSx()} placeholder="Karimov"
              value={form.last_name} onChange={e => set('last_name', e.target.value)}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
          </FRow>
        </div>

        <FRow label="Username" required error={errors.username}>
          <input style={inputSx(errors.username)} placeholder="alibek_k"
            value={form.username} onChange={e => set('username', e.target.value)}
            autoComplete="off"
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor=errors.username?'#ef4444':'#e2e8f0'}/>
        </FRow>

        <FRow label="Telefon" error={errors.phone}>
          <PhoneInput value={form.phone} onChange={v => set('phone', v)} error={errors.phone}/>
        </FRow>

        <FRow label="Email" error={errors.email}>
          <input type="email" style={inputSx()} placeholder="email@mail.com"
            value={form.email} onChange={e => set('email', e.target.value)}
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
        </FRow>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FRow label="Telegram Chat ID" error={errors.telegram_chat_id}>
            <input style={inputSx()} placeholder="Masalan: 12345678"
              value={form.telegram_chat_id} onChange={e => set('telegram_chat_id', e.target.value)}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
          </FRow>
          <FRow label="Telegram Username" error={errors.telegram_username}>
            <input style={inputSx()} placeholder="@username"
              value={form.telegram_username} onChange={e => set('telegram_username', e.target.value)}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
          </FRow>
        </div>

        <FRow label="Rol" required>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${allowedRoles.length},1fr)`, gap:6 }}>
            {allowedRoles.map(r => {
              const c = ROLE_COLORS[r]
              return (
                <button key={r} type="button" onClick={() => set('role', r)}
                  style={{ padding:'10px 6px', borderRadius:9, border:'none', cursor:'pointer',
                    fontFamily:'inherit', fontSize:12, fontWeight:700, textAlign:'center',
                    transition:'all 0.15s',
                    background: form.role===r ? c.bg : '#f8fafc',
                    color:       form.role===r ? c.color : '#94a3b8',
                    boxShadow:   form.role===r ? `0 0 0 2px ${c.dot}50` : 'none',
                  }}>
                  <div style={{ fontSize:16, marginBottom:3 }}>{ROLE_ICONS[r]}</div>
                  {ROLE_LABELS[r]}
                </button>
              )
            })}
          </div>
        </FRow>

        {form.role === 'client' && (
          <FRow label="Mijoz profili (Bog'lash)" error={errors.client_profile}>
            <ReactSelect
              options={clients.map(c => ({ value: c.id, label: `${c.name} — ${c.phone}` }))}
              value={form.client_profile ? { value: form.client_profile, label: clients.find(c=>c.id===Number(form.client_profile)) ? `${clients.find(c=>c.id===Number(form.client_profile)).name} — ${clients.find(c=>c.id===Number(form.client_profile)).phone}` : '' } : null}
              onChange={v => set('client_profile', v ? v.value : '')}
              placeholder="Profilni tanlang yoki izlang..."
              isClearable
              styles={{
                control: base => ({ ...base, borderRadius:10, borderColor:'#e2e8f0', minHeight:42, fontSize:13 }),
                menu: base => ({ ...base, fontSize:13, zIndex:9999 })
              }}
            />
          </FRow>
        )}

        <FRow label={isEdit ? "Yangi parol (ixtiyoriy)" : "Parol"} required={!isEdit} error={errors.password}>
          <div style={{ position:'relative' }}>
            <input type={showPass?'text':'password'}
              placeholder={isEdit ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"}
              value={form.password} onChange={e => set('password', e.target.value)}
              autoComplete="new-password"
              style={{ ...inputSx(errors.password), paddingRight:40 }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor=errors.password?'#ef4444':'#e2e8f0'}/>
            <button type="button" onClick={() => setShowPass(s => !s)}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                display:'flex', alignItems:'center' }}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </FRow>

        {isEdit && (
          <FRow label="Holat">
            <div style={{ display:'flex', gap:8 }}>
              {[
                [true,  '✅ Faol',       '#f0fdf4','#15803d','#bbf7d0'],
                [false, '🔒 Bloklangan', '#f8fafc','#94a3b8','#e2e8f0'],
              ].map(([val, label, bg, color, border]) => (
                <button key={String(val)} type="button" onClick={() => set('is_active', val)}
                  style={{ flex:1, padding:'9px', borderRadius:9, fontFamily:'inherit',
                    fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                    border:`1.5px solid ${form.is_active===val ? border : '#e2e8f0'}`,
                    background: form.is_active===val ? bg : '#fff',
                    color:       form.is_active===val ? color : '#94a3b8',
                  }}>{label}</button>
              ))}
            </div>
          </FRow>
        )}
      </div>
    </Modal>
  )
}
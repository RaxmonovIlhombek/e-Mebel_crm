import { useState, useRef } from 'react'
import { useApp } from '@/hooks/useApp'
import { api } from '@/api/client'
import {
  User, Phone, Mail, Shield, Camera, Save,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Edit3, LogOut, Smartphone, Hash,
} from 'lucide-react'
import { Btn, Card } from '@/components/UI'
import { PhoneInput, formatPhone, rawPhone, isPhoneComplete } from '@/components/PhoneInput'

const ROLE_META = {
  admin:      { label: 'Admin',      color: '#f59e0b', bg: '#fef3c7', icon: '👑' },
  manager:    { label: 'Menejer',    color: '#3b82f6', bg: '#dbeafe', icon: '💼' },
  accountant: { label: 'Buxgalter', color: '#10b981', bg: '#d1fae5', icon: '📊' },
  worker:     { label: 'Omborchi',   color: '#8b5cf6', bg: '#ede9fe', icon: '🔧' },
  client:     { label: 'Mijoz',      color: '#6b7280', bg: '#f3f4f6', icon: '👤' },
}

const fmt = d => d ? new Date(d).toLocaleDateString('uz-UZ', { year:'numeric', month:'long', day:'numeric' }) : '—'

// ── Reusable field row ──────────────────────────────────────────────────────
function FieldRow({ icon: Icon, label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 0',
      borderBottom:'1px solid #f1f5f9' }}>
      <div style={{ width:36, height:36, borderRadius:10, background:'#f8fafc',
        border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, marginTop:2 }}>
        <Icon size={15} color="#64748b" />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.6px', color:'#94a3b8', marginBottom:5 }}>{label}</div>
        {children}
      </div>
    </div>
  )
}

// ── Input style ─────────────────────────────────────────────────────────────
const inp = (focus) => ({
  width:'100%', padding:'9px 12px', borderRadius:9,
  border: `1.5px solid ${focus ? '#6366f1' : '#e2e8f0'}`,
  background: '#fafafa', fontSize:14, color:'#0f172a',
  outline:'none', fontFamily:'inherit',
  boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
  transition:'all 0.2s', boxSizing:'border-box',
})

export default function Profile() {
  const { user, toast, logout } = useApp()
  const [activeTab, setActiveTab] = useState('info')   // 'info' | 'security' | 'activity'
  const [editing, setEditing]     = useState(false)
  const [saving,  setSaving]      = useState(false)
  const fileRef = useRef(null)

  const role = ROLE_META[user?.role] || ROLE_META.client

  // ── Info form ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
    phone:      user?.phone ? formatPhone(user.phone) : '+998(',
  })
  const [focusField, setFocusField] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const saveInfo = async () => {
    setSaving(true)
    try {
      const payload = { ...form, phone: form.phone && form.phone !== '+998(' ? rawPhone(form.phone) : '' }
      const updated = await api.updateMe(payload)
      // localStorage va user ni yangilash
      const merged = { ...user, ...updated }
      localStorage.setItem('crm_user', JSON.stringify(merged))
      // AppContext ni yangilash uchun page reload (yoki useApp da updateUser qo'shish)
      toast('Ma\'lumotlar saqlandi ✅')
      setEditing(false)
      setTimeout(() => window.location.reload(), 500)
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast('Rasm hajmi juda katta (maks: 5MB)', 'error')
      return
    }

    const fd = new FormData()
    fd.append('avatar', file)

    setSaving(true)
    try {
      const updated = await api.updateMe(fd)
      const merged = { ...user, ...updated }
      localStorage.setItem('crm_user', JSON.stringify(merged))
      toast('Avatar yangilandi ✅')
      setTimeout(() => window.location.reload(), 500)
    } catch(err) {
      toast(err.message || 'Rasm yuklashda xato', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Password form ──────────────────────────────────────────────────────────
  const [pass, setPass] = useState({ old:'', new1:'', new2:'' })
  const [showPass, setShowPass] = useState({ old:false, new1:false, new2:false })
  const [passLoading, setPassLoading] = useState(false)
  const setP = (k, v) => setPass(p => ({ ...p, [k]: v }))

  const passStrength = (p) => {
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^a-zA-Z0-9]/.test(p)) s++
    return s
  }
  const strength = passStrength(pass.new1)
  const strengthLabel = ['', 'Zaif', 'O\'rtacha', 'Yaxshi', 'Kuchli']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']

  const savePassword = async () => {
    if (!pass.old)  { toast('Eski parolni kiriting', 'error'); return }
    if (pass.new1.length < 6) { toast('Yangi parol kamida 6 ta belgi', 'error'); return }
    if (pass.new1 !== pass.new2) { toast('Parollar mos kelmaydi', 'error'); return }
    setPassLoading(true)
    try {
      await api.post('/auth/change-password/', { old_password: pass.old, new_password: pass.new1 })
      toast('Parol o\'zgartirildi ✅')
      setPass({ old:'', new1:'', new2:'' })
    } catch(e) { toast(e.message || 'Eski parol noto\'g\'ri', 'error') }
    finally { setPassLoading(false) }
  }

  const fullName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username

  const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()

  // ── TABS ──────────────────────────────────────────────────────────────────
  const TABS = [
    { key:'info',     label:'👤 Ma\'lumotlar' },
    { key:'security', label:'🔒 Xavfsizlik'   },
    { key:'activity', label:'📊 Statistika'   },
  ]

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>

      {/* ── Profil header ── */}
      <Card style={{ padding:0, marginBottom:20, overflow:'hidden' }}>
        {/* Cover gradient */}
        <div style={{
          height:100,
          background:`linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)`,
          position:'relative',
        }}>
          <div style={{
            position:'absolute', inset:0, opacity:0.1,
            backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize:'20px 20px',
          }}/>
        </div>

        <div style={{ padding:'0 28px 24px', position:'relative' }}>
          {/* Avatar */}
          <div style={{ position:'relative', display:'inline-block', marginTop:-40 }}>
            <div style={{
              width:80, height:80, borderRadius:'50%',
              background:'linear-gradient(135deg,#f97316,#ea580c)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:32, fontWeight:900, color:'#fff',
              border:'4px solid #fff',
              boxShadow:'0 4px 16px rgba(249,115,22,0.3)',
            }}>
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                : initials
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position:'absolute', bottom:2, right:2,
                width:24, height:24, borderRadius:'50%',
                background:'#fff', border:'2px solid #e2e8f0',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
              }}
              title="Avatar o'zgartirish">
              <Camera size={12} color="#64748b"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
              onChange={handleAvatarChange}/>
          </div>

          {/* Info + actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end',
            marginTop:10, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px' }}>
                {fullName}
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
                <span style={{
                  ...{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 },
                  background: role.bg, color: role.color,
                }}>
                  {role.icon} {role.label}
                </span>
                <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
                  <Hash size={11}/> {user?.username}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {!editing ? (
                <Btn icon={<Edit3 size={13}/>} onClick={() => setEditing(true)} variant="ghost" size="sm">
                  Tahrirlash
                </Btn>
              ) : (
                <>
                  <Btn onClick={() => setEditing(false)} variant="ghost" size="sm">Bekor</Btn>
                  <Btn icon={<Save size={13}/>} onClick={saveInfo} loading={saving} size="sm">Saqlash</Btn>
                </>
              )}
              <Btn icon={<LogOut size={13}/>} onClick={logout} variant="danger" size="sm">Chiqish</Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:2, marginBottom:20,
        background:'#f1f5f9', borderRadius:12, padding:4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              flex:1, padding:'9px 0', border:'none', borderRadius:9,
              fontSize:13, fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', transition:'all 0.2s',
              background: activeTab===t.key ? '#fff' : 'transparent',
              color:       activeTab===t.key ? '#0f172a' : '#64748b',
              boxShadow:   activeTab===t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ TAB: MA'LUMOTLAR ══════════════════ */}
      {activeTab === 'info' && (
        <Card style={{ padding:'8px 24px 20px' }}>
          <FieldRow icon={User} label="Ism Familiya">
            {editing ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['first_name','Ism'],['last_name','Familiya']].map(([k,ph]) => (
                  <input key={k}
                    style={inp(focusField===k)}
                    placeholder={ph}
                    value={form[k]}
                    onChange={e => set(k, e.target.value)}
                    onFocus={() => setFocusField(k)}
                    onBlur={() => setFocusField('')}
                  />
                ))}
              </div>
            ) : (
              <span style={{ fontSize:15, fontWeight:600, color:'#0f172a' }}>{fullName || '—'}</span>
            )}
          </FieldRow>

          <FieldRow icon={Phone} label="Telefon">
            {editing ? (
              <PhoneInput
                value={form.phone}
                onChange={v => set('phone', v)}
                style={{ padding:'9px 12px 9px 36px', fontSize:14, borderRadius:8 }}
              />
            ) : (
              <span style={{ fontSize:15, color: form.phone ? '#0f172a' : '#94a3b8', fontWeight: form.phone ? 600:400 }}>
                {user?.phone || 'Kiritilmagan'}
              </span>
            )}
          </FieldRow>

          <FieldRow icon={Mail} label="Email">
            {editing ? (
              <input
                style={inp(focusField==='email')}
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField('')}
              />
            ) : (
              <span style={{ fontSize:15, color: user?.email ? '#0f172a' : '#94a3b8', fontWeight: user?.email ? 600:400 }}>
                {user?.email || 'Kiritilmagan'}
              </span>
            )}
          </FieldRow>

          <FieldRow icon={Shield} label="Rol">
            <span style={{
              fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20,
              background: role.bg, color: role.color,
            }}>
              {role.icon} {role.label}
            </span>
          </FieldRow>

          <FieldRow icon={Hash} label="Username">
            <span style={{ fontSize:14, fontFamily:'monospace', color:'#475569',
              background:'#f8fafc', padding:'4px 10px', borderRadius:6,
              border:'1px solid #e2e8f0' }}>
              @{user?.username}
            </span>
          </FieldRow>

          {user?.telegram_chat_id && (
            <FieldRow icon={Smartphone} label="Telegram">
              <span style={{ fontSize:14, color:'#0f172a', fontWeight:600 }}>
                ✅ Ulangan (ID: {user.telegram_chat_id})
              </span>
            </FieldRow>
          )}
        </Card>
      )}

      {/* ══════════════════ TAB: XAVFSIZLIK ══════════════════ */}
      {activeTab === 'security' && (
        <Card style={{ padding:'8px 24px 24px' }}>
          <div style={{ marginTop:16, marginBottom:20 }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>
              🔒 Parolni o'zgartirish
            </h3>
            <p style={{ fontSize:13, color:'#94a3b8' }}>
              Xavfsizlik uchun vaqti-vaqti bilan parolni yangilang
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:400 }}>
            {/* Eski parol */}
            {[
              { key:'old',  label:'Joriy parol',       ph:'••••••••' },
              { key:'new1', label:'Yangi parol',        ph:'Kamida 6 ta belgi' },
              { key:'new2', label:'Yangi parol (takror)', ph:'Takrorlang' },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b',
                  marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {label}
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass[key] ? 'text' : 'password'}
                    placeholder={ph}
                    value={pass[key]}
                    onChange={e => setP(key, e.target.value)}
                    style={{ ...inp(focusField===`p_${key}`), paddingRight:40 }}
                    onFocus={() => setFocusField(`p_${key}`)}
                    onBlur={() => setFocusField('')}
                  />
                  <button type="button"
                    onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                    style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:2 }}>
                    {showPass[key] ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>

                {/* Kuch ko'rsatgich — faqat new1 da */}
                {key === 'new1' && pass.new1 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex:1, height:3, borderRadius:3,
                          background: i <= strength ? strengthColor[strength] : '#e2e8f0',
                          transition:'all 0.3s',
                        }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:11, color: strengthColor[strength], fontWeight:600 }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}

                {/* Mos kelish tekshiruvi */}
                {key === 'new2' && pass.new2 && (
                  <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                    {pass.new1 === pass.new2
                      ? <><CheckCircle size={12} color="#10b981"/><span style={{color:'#10b981', fontWeight:600}}>Mos keladi</span></>
                      : <><AlertCircle size={12} color="#ef4444"/><span style={{color:'#ef4444', fontWeight:600}}>Mos kelmaydi</span></>
                    }
                  </div>
                )}
              </div>
            ))}

            <Btn
              icon={<Lock size={13}/>}
              onClick={savePassword}
              loading={passLoading}
              disabled={!pass.old || !pass.new1 || pass.new1 !== pass.new2}
              style={{ marginTop:4, alignSelf:'flex-start' }}
            >
              Parolni yangilash
            </Btn>
          </div>

          {/* Xavfsizlik maslahatlari */}
          <div style={{ marginTop:28, padding:16, background:'#f8fafc',
            borderRadius:12, border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:10 }}>
              💡 Xavfsizlik maslahatlari
            </div>
            {[
              'Kamida 8 ta belgi ishlating',
              'Katta va kichik harflar, raqamlarni aralashtiring',
              'Boshqa saytlardagi parol bilan bir xil qilmang',
              'Parolingizni hech kimga bermang',
            ].map((tip, i) => (
              <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:'#64748b',
                marginBottom:6, alignItems:'flex-start' }}>
                <span style={{ color:'#10b981', flexShrink:0 }}>✓</span> {tip}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══════════════════ TAB: STATISTIKA ══════════════════ */}
      {activeTab === 'activity' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { icon:'📅', label:'A\'zo bo\'lgan sana', value: fmt(user?.date_joined) },
              { icon:'🔑', label:'So\'nggi kirish', value: fmt(user?.last_login) || 'Hozir' },
              { icon:'🌐', label:'Tizim', value: 'e-Mebel CRM v2' },
            ].map(s => (
              <Card key={s.label} style={{ padding:'18px 20px', textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'0.6px', color:'#94a3b8', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Rol imkoniyatlari */}
          <Card style={{ padding:'20px 24px' }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:14 }}>
              {role.icon} {role.label} roli imkoniyatlari
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {({
                admin:      ['Dashboard', 'Buyurtmalar', 'Mijozlar', 'Mahsulotlar', 'Ombor', 'Moliya', 'Xodimlar', 'AI', 'Xabarlar'],
                manager:    ['Dashboard', 'Buyurtmalar', 'Mijozlar', 'Mahsulotlar', 'Xodimlar', 'AI', 'Xabarlar'],
                accountant: ['Dashboard', 'Buyurtmalar', 'Moliya', 'AI', 'Xabarlar'],
                worker:     ['Dashboard', 'Ombor', 'Xabarlar'],
                client:     ['Buyurtmalarim', 'Xabarlar'],
              }[user?.role] || []).map(p => (
                <span key={p} style={{
                  fontSize:11, fontWeight:600, padding:'4px 10px',
                  borderRadius:8, background: role.bg, color: role.color,
                }}>
                  ✓ {p}
                </span>
              ))}
            </div>
          </Card>

          {/* Sessiya */}
          <Card style={{ padding:'18px 24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:4 }}>
                  🖥️ Joriy sessiya
                </div>
                <div style={{ fontSize:12, color:'#94a3b8' }}>
                  Toshkent · e-Mebel CRM · Hozir faol
                </div>
              </div>
              <Btn onClick={logout} variant="danger" size="sm" icon={<LogOut size={13}/>}>
                Chiqish
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
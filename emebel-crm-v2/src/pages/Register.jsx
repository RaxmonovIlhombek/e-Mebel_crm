import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import {
  User, Lock, Phone, Mail, Eye, EyeOff,
  AlertCircle, CheckCircle2, ArrowLeft, UserPlus,
} from 'lucide-react'
import { PhoneInput, rawPhone, isPhoneComplete } from '@/components/PhoneInput'

const ROLES = [
  { value: 'manager',    label: '💼 Menejer'   },
  { value: 'accountant', label: '📊 Buxgalter' },
  { value: 'worker',     label: '🔧 Omborchi'  },
  { value: 'client',     label: '👤 Mijoz'     },
]

// Parol kuchini hisoblash
function pwStrength(p) {
  if (!p) return 0
  let s = 0
  if (p.length >= 6)  s++
  if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return s
}
const PW_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#10b981']
const PW_LABELS = ['Juda zaif','Zaif','Yaxshi','Kuchli','Juda kuchli']

function StrengthBar({ password }) {
  const s = pwStrength(password)
  if (!password) return null
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:4,
            background: i <= s ? PW_COLORS[s-1] : '#e2e8f0',
            transition:'background 0.3s',
          }}/>
        ))}
      </div>
      <span style={{ fontSize:11, color: PW_COLORS[s-1], fontWeight:600 }}>{PW_LABELS[s-1]}</span>
    </div>
  )
}

function Field({ label, required, icon: Icon, error, hint, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#64748b',
        textTransform:'uppercase', letterSpacing:'0.6px' }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        {Icon && <Icon size={15} style={{ position:'absolute', left:13, top:'50%',
          transform:'translateY(-50%)', color: error ? '#ef4444' : '#94a3b8', pointerEvents:'none' }}/>}
        {children}
      </div>
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:5, color:'#ef4444', fontSize:12 }}>
          <AlertCircle size={11}/> {error}
        </div>
      )}
      {!error && hint && <div style={{ fontSize:11, color:'#94a3b8' }}>{hint}</div>}
    </div>
  )
}

const INP_BASE = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  fontSize:14, color:'#0f172a', transition:'all 0.2s', boxSizing:'border-box',
}

function Inp({ icon, error, right, style: extraStyle, ...props }) {
  return (
    <input
      {...props}
      style={{
        ...INP_BASE,
        paddingLeft: icon ? 38 : 14,
        paddingRight: right ? 44 : 14,
        border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
        background: error ? '#fff7f7' : '#f8fafc',
        ...extraStyle,
      }}
      onFocus={e => {
        e.target.style.borderColor = error ? '#ef4444' : '#6366f1'
        e.target.style.boxShadow   = `0 0 0 3px ${error ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.12)'}`
        e.target.style.background  = '#fff'
      }}
      onBlur={e => {
        e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'
        e.target.style.boxShadow   = 'none'
        e.target.style.background  = error ? '#fff7f7' : '#f8fafc'
      }}
    />
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showPass2,setShowPass2]= useState(false)
  const [success,  setSuccess]  = useState('')
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')

  const [form, setForm] = useState({
    first_name:'', last_name:'',
    username:'', email:'', phone:'+998(',
    role:'manager',
    password:'', password2:'',
  })

  const set = (k, v) => {
    setForm(f => ({...f, [k]: v}))
    setErrors(e => ({...e, [k]: ''}))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim())         e.username  = "Majburiy maydon"
    else if (form.username.length < 3) e.username  = "Kamida 3 ta belgi"
    else if (/\s/.test(form.username)) e.username  = "Bo'sh joy bo'lmaydi"

    if (!form.password)                e.password  = "Majburiy maydon"
    else if (form.password.length < 6) e.password  = "Kamida 6 ta belgi"

    if (!form.password2)               e.password2 = "Takrorlang"
    else if (form.password !== form.password2) e.password2 = "Parollar mos kelmaydi"

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email noto'g'ri formatda"

    if (form.phone && form.phone !== '+998(' && !isPhoneComplete(form.phone))
      e.phone = "To'liq kiriting: +998(90) 123-45-67"

    return e
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true); setApiError('')
    try {
      await api.register({
        username:   form.username,
        password:   form.password,
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        phone:      rawPhone(form.phone),
        role:       form.role,
      })
      setSuccess("Ro'yxatdan o'tish muvaffaqiyatli! Admin tasdiqlashini kuting.")
      setTimeout(() => navigate('/login'), 3500)
    } catch (err) {
      setApiError(err.message || "Xato yuz berdi. Username band bo'lishi mumkin.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg,#0f172a,#1e1b4b)', fontFamily:"'Outfit',sans-serif" }}>
        <div style={{ background:'#fff', borderRadius:24, padding:'60px 48px',
          textAlign:'center', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
          animation:'popIn 0.4s ease' }}>
          <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
          <h2 style={{ fontSize:24, fontWeight:900, color:'#0f172a', marginBottom:12 }}>
            Muvaffaqiyatli!
          </h2>
          <p style={{ color:'#64748b', lineHeight:1.7, marginBottom:24 }}>{success}</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            color:'#6366f1', fontSize:13, fontWeight:600 }}>
            <span style={{ width:16, height:16, border:'2px solid #6366f1',
              borderTopColor:'transparent', borderRadius:'50%',
              animation:'spin 0.8s linear infinite', display:'inline-block' }}/>
            Login sahifasiga o'tilmoqda...
          </div>
        </div>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Outfit','Segoe UI',sans-serif",
      background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)' }}>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
        <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:560,
          boxShadow:'0 25px 80px rgba(0,0,0,0.35)', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#1a2540,#2d3a5e)',
            padding:'28px 36px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160,
              borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
            <div style={{ position:'absolute', bottom:-20, left:80, width:100, height:100,
              borderRadius:'50%', background:'rgba(255,255,255,0.03)' }}/>

            {/* Logo */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:20, position:'relative', zIndex:1 }}>
              <img src="/logo (2).png" alt="e-Mebel CRM"
                style={{ height:52, width:'auto', objectFit:'contain' }}/>
            </div>

            <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6,
              color:'rgba(255,255,255,0.6)', fontSize:13, marginBottom:16, textDecoration:'none',
              position:'relative', zIndex:1 }}
              onMouseEnter={e => e.currentTarget.style.color='#fff'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}>
              <ArrowLeft size={14}/> Kirishga qaytish
            </Link>
            <div style={{ position:'relative', zIndex:1 }}>
              <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:6, letterSpacing:'-0.5px' }}>
                Ro'yxatdan o'ting ✨
              </h1>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>
                Admin tasdiqlashidan keyin tizimga kirasiz
              </p>
            </div>
          </div>

          {/* Form */}
          <div style={{ padding:'32px 36px' }}>

            {apiError && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:10,
                background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10,
                padding:'12px 16px', marginBottom:20 }}>
                <AlertCircle size={16} style={{ color:'#ef4444', flexShrink:0, marginTop:1 }}/>
                <span style={{ fontSize:13, color:'#dc2626', lineHeight:1.5 }}>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Ism + Familiya */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Ism" icon={User} error={errors.first_name}>
                  <Inp icon placeholder="Alibek" value={form.first_name}
                    onChange={e => set('first_name', e.target.value)} error={errors.first_name}/>
                </Field>
                <Field label="Familiya" error={errors.last_name}>
                  <Inp placeholder="Karimov" value={form.last_name}
                    onChange={e => set('last_name', e.target.value)} error={errors.last_name}/>
                </Field>
              </div>

              {/* Username */}
              <Field label="Foydalanuvchi nomi" required icon={User} error={errors.username}
                hint="Faqat harflar, raqamlar va _ belgisi">
                <Inp icon placeholder="alibek_k" value={form.username}
                  onChange={e => set('username', e.target.value)} error={errors.username}
                  autoComplete="username"/>
              </Field>

              {/* Email + Telefon */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Email" icon={Mail} error={errors.email}>
                  <Inp icon type="email" placeholder="email@mail.com" value={form.email}
                    onChange={e => set('email', e.target.value)} error={errors.email}/>
                </Field>
                <Field label="Telefon" icon={Phone} error={errors.phone}>
                  <PhoneInput value={form.phone}
                    onChange={v => set('phone', v)} error={errors.phone}/>
                </Field>
              </div>

              {/* Rol */}
              <Field label="Rol" required>
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  style={{ ...INP_BASE, paddingLeft:14, border:'1.5px solid #e2e8f0',
                    background:'#f8fafc', cursor:'pointer', appearance:'none' }}
                  onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none' }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>

              {/* Parol */}
              <Field label="Parol" required icon={Lock} error={errors.password}>
                <Inp icon type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" right value={form.password}
                  onChange={e => set('password', e.target.value)}
                  error={errors.password} autoComplete="new-password"/>
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                  padding:2, display:'flex', alignItems:'center',
                }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
                <StrengthBar password={form.password}/>
              </Field>

              {/* Parol takror */}
              <Field label="Parolni takrorlang" required icon={Lock} error={errors.password2}>
                <Inp icon type={showPass2 ? 'text' : 'password'}
                  placeholder="••••••••" right value={form.password2}
                  onChange={e => set('password2', e.target.value)}
                  error={errors.password2} autoComplete="new-password"/>
                <button type="button" onClick={() => setShowPass2(s => !s)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                  padding:2, display:'flex', alignItems:'center',
                }}>
                  {showPass2 ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
                {!errors.password2 && form.password && form.password2 &&
                  form.password === form.password2 && (
                  <div style={{ display:'flex', alignItems:'center', gap:5,
                    color:'#10b981', fontSize:12, marginTop:5 }}>
                    <CheckCircle2 size={12}/> Parollar mos keladi
                  </div>
                )}
              </Field>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'14px 0', border:'none', borderRadius:12, marginTop:4,
                background: loading
                  ? 'linear-gradient(135deg,#c7d2fe,#ddd6fe)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', fontSize:15, fontWeight:800,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(99,102,241,0.38)',
                fontFamily:'inherit', transition:'all 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {loading
                  ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)',
                      borderTopColor:'white', borderRadius:'50%',
                      animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Yuklanmoqda...</>
                  : <><UserPlus size={16}/> Ro'yxatdan o'tish</>
                }
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#94a3b8' }}>
              Hisobingiz bormi?{' '}
              <Link to="/login" style={{ color:'#6366f1', fontWeight:700 }}>
                Kirish
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
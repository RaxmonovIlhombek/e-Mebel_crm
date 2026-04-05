import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/hooks/useApp'
import { Eye, EyeOff, LogIn, Phone, User, Lock, AlertCircle } from 'lucide-react'
import { PhoneInput, rawPhone, isPhoneComplete } from '@/components/PhoneInput'

const FEATURES = [
  { icon: '📦', title: 'Buyurtmalar',    desc: 'Real vaqtda kuzatish'  },
  { icon: '👥', title: 'Mijozlar bazasi', desc: "To'liq CRM tizimi"     },
  { icon: '🏭', title: 'Ombor nazorati', desc: 'Stok boshqaruvi'       },
  { icon: '💰', title: 'Moliya',         desc: 'Tushum va qarz hisobi' },
  { icon: '🤖', title: 'AI Yordamchi',   desc: 'Aqlli tahlil'          },
]

const STATS = [['500+','Mijozlar'],['10K+','Buyurtmalar'],['99%','Ishonchlilik']]

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#64748b',
        textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</label>
      <div style={{ position:'relative' }}>
        {Icon && (
          <Icon size={15} style={{ position:'absolute', left:13, top:'50%',
            transform:'translateY(-50%)', color: error ? '#ef4444' : '#94a3b8', pointerEvents:'none' }} />
        )}
        {children}
      </div>
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:5, color:'#ef4444', fontSize:12 }}>
          <AlertCircle size={12}/> {error}
        </div>
      )}
    </div>
  )
}

// ── Styled input ──────────────────────────────────────────────────────────────
function Inp({ icon, error, right, ...props }) {
  return (
    <input
      {...props}
      style={{
        width:'100%', padding:`11px 14px 11px ${icon ? 38 : 14}px`,
        paddingRight: right ? 44 : 14,
        borderRadius:10, fontSize:14, color:'#0f172a',
        border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
        background: error ? '#fff7f7' : '#f8fafc',
        transition:'all 0.2s', boxSizing:'border-box',
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

// ── Asosiy Login sahifasi ─────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useApp()

  const [loading,   setLoading]   = useState(false)
  const [showPass,  setShowPass]  = useState(false)
  const [remember,  setRemember]  = useState(() => !!localStorage.getItem('crm_remember'))
  const [loginType, setLoginType] = useState('username')
  const [errors,    setErrors]    = useState({})
  const [apiError,  setApiError]  = useState('')
  const [tick,      setTick]      = useState(0)

  const [form, setForm] = useState({
    username: remember ? (localStorage.getItem('crm_saved_user') || '') : '',
    phone:    '+998(',
    password: remember ? (localStorage.getItem('crm_saved_pass') || '') : '',
  })

  const usernameRef = useRef(null)

  useEffect(() => { usernameRef.current?.focus() }, [])
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3500)
    return () => clearInterval(t)
  }, [])

  const setField = (k, v) => {
    setForm(f => ({...f, [k]: v}))
    setErrors(e => ({...e, [k]: ''}))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (loginType === 'username' && !form.username.trim())
      e.username = "Foydalanuvchi nomi kiritilmadi"
    if (loginType === 'phone') {
      if (!form.phone || form.phone === '+998(') e.phone = "Telefon raqam kiritilmadi"
      else if (!isPhoneComplete(form.phone))     e.phone = "To'liq kiriting: +998(90) 123-45-67"
    }
    if (!form.password)           e.password = "Parol kiritilmadi"
    else if (form.password.length < 4) e.password = "Parol juda qisqa"
    return e
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    try {
      await login({
        username: loginType === 'phone' ? rawPhone(form.phone) : form.username,
        password: form.password,
      })
      if (remember) {
        localStorage.setItem('crm_remember',   '1')
        localStorage.setItem('crm_saved_user', form.username || form.phone)
        localStorage.setItem('crm_saved_pass', form.password)
      } else {
        localStorage.removeItem('crm_remember')
        localStorage.removeItem('crm_saved_user')
        localStorage.removeItem('crm_saved_pass')
      }
    } catch (err) {
      setApiError(err.message || "Foydalanuvchi nomi yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Outfit','Segoe UI',sans-serif", background:'#0f172a' }}>

      {/* ── Chap panel ── */}
      <div style={{
        flex:1, position:'relative', overflow:'hidden',
        background:'linear-gradient(145deg,#0f172a 0%,#1e1b4b 45%,#312e81 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'60px 48px',
      }}>
        {/* Fon efektlari */}
        {[
          { w:450, h:450, top:-120, right:-120, c:'#6366f1' },
          { w:320, h:320, bottom:-90, left:-90,  c:'#8b5cf6' },
          { w:220, h:220, top:'45%', left:'55%', c:'#4f46e5' },
        ].map((p,i) => (
          <div key={i} style={{
            position:'absolute', borderRadius:'50%', opacity:0.15,
            width:p.w, height:p.h, top:p.top, bottom:p.bottom, left:p.left, right:p.right,
            background:`radial-gradient(circle,${p.c} 0%,transparent 70%)`,
            pointerEvents:'none',
          }}/>
        ))}
        <div style={{
          position:'absolute', inset:0, opacity:0.04, pointerEvents:'none',
          backgroundImage:'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)',
          backgroundSize:'40px 40px',
        }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:420, width:'100%' }}>
          <div style={{ marginBottom:44 }}>
            <img src="/logo (2).png" alt="e-Mebel CRM"
              style={{ height:90, width:'auto', objectFit:'contain' }}/>
          </div>
          <h1 style={{ fontSize:40, fontWeight:900, color:'#fff', lineHeight:1.1,
            marginBottom:14, letterSpacing:'-1px' }}>
            Mebel biznesini<br/>
            <span style={{ color:'#a5b4fc', display:'inline-block',
              animation:`fadeIn 0.6s ease ${tick * 0.1}s both` }}>
              aqlli boshqaring
            </span>
          </h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.45)', marginBottom:44, lineHeight:1.7 }}>
            Zamonaviy CRM — buyurtmadan yetkazib berishgacha
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{
                display:'flex', alignItems:'center', gap:16, opacity:0.88,
                transform:`translateX(${tick % 2 === 0 ? 0 : i % 2 === 0 ? 3 : -3}px)`,
                transition:`transform ${0.8 + i * 0.15}s ease`,
              }}>
                <div style={{
                  width:44, height:44, borderRadius:12, flexShrink:0,
                  background:'rgba(99,102,241,0.18)', border:'1px solid rgba(165,180,252,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e0e7ff' }}>{f.title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:36, marginTop:44, paddingTop:28,
            borderTop:'1px solid rgba(99,102,241,0.2)' }}>
            {STATS.map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize:22, fontWeight:900, color:'#a5b4fc' }}>{val}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── O'ng panel ── */}
      <div style={{
        width:500, background:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'40px 52px', flexDirection:'column',
        boxShadow:'-20px 0 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ width:'100%', maxWidth:396 }}>

          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:28, fontWeight:900, color:'#0f172a',
              marginBottom:6, letterSpacing:'-0.5px' }}>Xush kelibsiz 👋</h2>
            <p style={{ fontSize:14, color:'#94a3b8' }}>Hisobingizga kiring</p>
          </div>

          {/* Login turi — username / phone */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10,
            padding:3, marginBottom:20, gap:3 }}>
            {[
              ['username', <User  size={13}/>, 'Username'],
              ['phone',    <Phone size={13}/>, 'Telefon' ],
            ].map(([val, ico, lbl]) => (
              <button key={val}
                onClick={() => { setLoginType(val); setErrors({}); setApiError('') }}
                style={{
                  flex:1, padding:'9px 0', border:'none', borderRadius:8,
                  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                  background: loginType===val ? '#fff' : 'transparent',
                  color:      loginType===val ? '#4f46e5' : '#94a3b8',
                  boxShadow:  loginType===val ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
                  transition:'all 0.18s',
                }}>
                {ico} {lbl}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {loginType === 'username' ? (
              <Field label="Foydalanuvchi nomi *" icon={User} error={errors.username}>
                <Inp ref={usernameRef} icon placeholder="admin"
                  value={form.username} onChange={e => setField('username', e.target.value)}
                  error={errors.username} autoComplete="username"/>
              </Field>
            ) : (
              <Field label="Telefon raqam *" icon={Phone} error={errors.phone}>
                <PhoneInput value={form.phone}
                  onChange={v => setField('phone', v)} error={errors.phone}/>
              </Field>
            )}

            <Field label="Parol *" icon={Lock} error={errors.password}>
              <Inp icon type={showPass ? 'text' : 'password'}
                placeholder="••••••••" right
                value={form.password} onChange={e => setField('password', e.target.value)}
                error={errors.password} autoComplete="current-password"/>
              <button type="button" onClick={() => setShowPass(s => !s)} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer',
                color:'#94a3b8', padding:2, display:'flex', alignItems:'center',
              }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </Field>

            {/* Eslab qolish + Parolni unutdim */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8,
                cursor:'pointer', fontSize:13, color:'#475569', userSelect:'none' }}>
                <input type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ width:15, height:15, accentColor:'#6366f1', cursor:'pointer' }}/>
                Eslab qolish
              </label>
              <Link to="/forgot-password" style={{ fontSize:13, color:'#6366f1',
                fontWeight:600, textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Parolni unutdingizmi?
              </Link>
            </div>

            {/* API xatosi */}
            {apiError && (
              <div style={{
                display:'flex', alignItems:'flex-start', gap:10,
                background:'#fef2f2', border:'1px solid #fecaca',
                borderRadius:10, padding:'11px 14px',
              }}>
                <AlertCircle size={16} style={{ color:'#ef4444', flexShrink:0, marginTop:1 }}/>
                <span style={{ fontSize:13, color:'#dc2626', lineHeight:1.5 }}>{apiError}</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px 0', border:'none', borderRadius:12, marginTop:4,
              background: loading
                ? 'linear-gradient(135deg,#c7d2fe,#ddd6fe)'
                : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color:'#fff', fontSize:15, fontWeight:800, cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 18px rgba(99,102,241,0.38)',
              fontFamily:'inherit', transition:'all 0.2s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              {loading
                ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)',
                    borderTopColor:'white', borderRadius:'50%',
                    animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Kirilmoqda...</>
                : <><LogIn size={16}/> Kirish</>
              }
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:24, fontSize:13, color:'#94a3b8' }}>
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" style={{ color:'#6366f1', fontWeight:700 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              Ro'yxatdan o'ting
            </Link>
          </div>

          <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'#cbd5e1' }}>
            © 2026 e-Mebel CRM · Barcha huquqlar himoyalangan
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
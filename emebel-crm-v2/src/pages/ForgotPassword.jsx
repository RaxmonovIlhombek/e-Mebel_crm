import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Mail, ArrowLeft, Send, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [identity, setIdentity] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!identity.trim()) { setError("Username yoki telefon kiritilmadi"); return }

    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password/', { identity })
      setSuccess(true)
    } catch (err) {
      setError(err.message || "Xato yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0f172a,#1e1b4b)', fontFamily:"'Outfit',sans-serif", padding:20 }}>

      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420,
        boxShadow:'0 25px 80px rgba(0,0,0,0.35)', overflow:'hidden' }}>

        <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:'28px 36px' }}>
          <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6,
            color:'rgba(255,255,255,0.7)', fontSize:13, marginBottom:20, textDecoration:'none' }}
            onMouseEnter={e => e.currentTarget.style.color='#fff'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}>
            <ArrowLeft size={14}/> Kirishga qaytish
          </Link>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:6 }}>
            🔐 Parolni tiklash
          </h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>
            Username yoki Telefon raqamingizni kiriting — admin bilan bog'lanamiz
          </p>
        </div>

        <div style={{ padding:'32px 36px' }}>
          {success ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:10 }}>
                Email yuborildi!
              </h3>
              <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
                <strong>{identity}</strong> uchun parolni tiklash so'rovi adminga yuborildi.
                Admin tez orada siz bilan bog'lanadi.
              </p>
              <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6,
                color:'#6366f1', fontWeight:700, fontSize:14 }}>
                <ArrowLeft size={14}/> Kirishga qaytish
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b',
                  textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>
                  Username yoki Telefon *
                </label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} style={{ position:'absolute', left:13, top:'50%',
                    transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                  <input type="text" placeholder="admin yoki +998..."
                    value={identity} onChange={e => { setIdentity(e.target.value); setError('') }}
                    style={{ width:'100%', padding:'11px 14px 11px 38px', borderRadius:10,
                      fontSize:14, color:'#0f172a', boxSizing:'border-box',
                      border:`1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
                      background: error ? '#fff7f7' : '#f8fafc', transition:'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)' }}
                    onBlur={e => { e.target.style.borderColor= error ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow='none' }}/>
                </div>
                {error && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, color:'#ef4444', fontSize:12, marginTop:5 }}>
                    <AlertCircle size={12}/> {error}
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'13px 0', border:'none', borderRadius:12,
                background: loading ? '#c7d2fe' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', fontSize:14, fontWeight:800, cursor: loading ? 'wait' : 'pointer',
                fontFamily:'inherit', boxShadow:'0 4px 16px rgba(99,102,241,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {loading
                  ? <><span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.4)',
                      borderTopColor:'white', borderRadius:'50%',
                      animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Yuklanmoqda...</>
                  : <><Send size={15}/> Havolani yuborish</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
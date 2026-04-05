import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

/* ── Button ─────────────────────────────── */
export function Btn({ children, variant = 'primary', size = 'md', className, loading, icon, style, type = 'button', ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontWeight: 600, borderRadius: 8, transition: 'all 0.15s',
    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    opacity: props.disabled ? 0.45 : 1,
  }
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.35)' },
    ghost:   { background: '#fff', color: 'var(--text2)', border: '1px solid var(--border2)', boxShadow: 'var(--shadow-sm)' },
    danger:  { background: 'var(--red-lo)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)' },
    success: { background: 'var(--green-lo)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.25)' },
    surface: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border2)', boxShadow: 'var(--shadow-sm)' },
    blue:    { background: 'var(--blue-lo)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.25)' },
  }
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 },
  }
  return (
    <button type={type} style={{ ...base, ...variants[variant], ...sizes[size], ...style }} {...props}>
      {loading ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : icon}
      {children}
    </button>
  )
}

/* ── Input ──────────────────────────────── */
export function Input({ label, error, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{label}</label>}
      <input
        style={{
          background: '#fff',
          border: `1.5px solid ${error ? 'var(--red)' : 'var(--border2)'}`,
          borderRadius: 8, color: 'var(--text)',
          padding: '9px 12px', fontSize: 13, width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: 'var(--shadow-sm)',
          ...style,
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)' }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border2)'; e.target.style.boxShadow = 'var(--shadow-sm)' }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}

/* ── Select ─────────────────────────────── */
export function Select({ label, children, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{label}</label>}
      <select style={{
        background: '#fff',
        border: '1.5px solid var(--border2)',
        borderRadius: 8, color: 'var(--text)',
        padding: '9px 36px 9px 12px', fontSize: 13,
        width: '100%', cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        ...style,
      }} {...props}>
        {children}
      </select>
    </div>
  )
}

/* ── Textarea ───────────────────────────── */
export function Textarea({ label, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{label}</label>}
      <textarea style={{
        background: '#fff', border: '1.5px solid var(--border2)',
        borderRadius: 8, color: 'var(--text)',
        padding: '9px 12px', fontSize: 13,
        resize: 'vertical', minHeight: 80, width: '100%',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'var(--shadow-sm)' }}
      {...props} />
    </div>
  )
}

/* ── Card ───────────────────────────────── */
export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 14,
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Badge ──────────────────────────────── */
const BADGE = {
  new:        { bg:'#dbeafe', color:'#1d4ed8', label:'Yangi' },
  pending:    { bg:'#fef3c7', color:'#92400e', label:'Jarayonda' },
  production: { bg:'#ffedd5', color:'#c2410c', label:'Ishlab chiqarishda' },
  ready:      { bg:'#d1fae5', color:'#065f46', label:'Tayyor' },
  delivered:  { bg:'#d1fae5', color:'#047857', label:'Yetkazildi' },
  completed:  { bg:'#f3f4f6', color:'#374151', label:'Yakunlandi' },
  cancelled:  { bg:'#fee2e2', color:'#b91c1c', label:'Bekor' },
  paid:       { bg:'#d1fae5', color:'#065f46', label:"To'langan" },
  partial:    { bg:'#fef3c7', color:'#92400e', label:'Qisman' },
  unpaid:     { bg:'#fee2e2', color:'#b91c1c', label:"To'lanmagan" },
  in:         { bg:'#d1fae5', color:'#065f46', label:'Kirim' },
  out:        { bg:'#fee2e2', color:'#b91c1c', label:'Chiqim' },
  adjust:     { bg:'#dbeafe', color:'#1d4ed8', label:'Tuzatish' },
}

export function Badge({ status, label: customLabel }) {
  const s = BADGE[status] || { bg:'#f3f4f6', color:'#6b7280', label: status }
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 100, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {customLabel || s.label}
    </span>
  )
}

/* ── Spinner ────────────────────────────── */
export function Spinner({ size = 28 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding: 56 }}>
      <div style={{
        width: size, height: size,
        border: '2.5px solid #e5e7eb',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

/* ── Empty ──────────────────────────────── */
export function Empty({ icon = '📭', text = "Ma'lumot yo'q" }) {
  return (
    <div style={{ textAlign:'center', padding:'56px 20px', color:'var(--text3)' }}>
      <div style={{ fontSize: 38, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{text}</div>
    </div>
  )
}

/* ── Modal ──────────────────────────────── */
export function Modal({ title, children, footer, onClose, maxWidth = 520 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{
        position:'fixed', inset:0,
        background:'rgba(17,24,39,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex:200, display:'flex',
        alignItems:'center', justifyContent:'center',
        padding:20, animation:'fadeIn 0.15s ease',
      }}>
      <div style={{
        background:'#fff',
        borderRadius:18,
        width:'100%', maxWidth,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
        animation:'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'20px 24px',
          borderBottom:'1px solid var(--border)',
        }}>
          <span style={{ fontWeight:700, fontSize:16, color:'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{
            background:'var(--surface2)', border:'none', width:30, height:30,
            borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text3)', fontSize:16, cursor:'pointer',
            transition:'all 0.15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--red-lo)';e.currentTarget.style.color='var(--red)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.color='var(--text3)'}}>
            ✕
          </button>
        </div>
        {/* Body */}
        <div style={{ padding:'20px 24px' }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{
            padding:'16px 24px',
            borderTop:'1px solid var(--border)',
            display:'flex', gap:8, justifyContent:'flex-end',
            background:'var(--surface2)', borderRadius:'0 0 18px 18px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Table ──────────────────────────────── */
export function Table({ columns, data, onRow, emptyText }) {
  if (!data?.length) return <Empty text={emptyText} />
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'var(--surface2)' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                padding:'10px 16px', textAlign:'left',
                fontSize:11, fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.8px',
                color:'var(--text3)', whiteSpace:'nowrap',
                borderBottom:'2px solid var(--border2)',
              }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRow?.(row)}
              style={{ cursor: onRow ? 'pointer' : 'default', transition:'background 0.1s',
                borderBottom:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {columns.map(c => (
                <td key={c.key} style={{ padding:'12px 16px', fontSize:13, ...c.style }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Stat Card ──────────────────────────── */
export function StatCard({ label, value, sub, accent, icon, trend }) {
  return (
    <Card style={{ padding:'22px 24px', position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'1px', color:'var(--text3)', marginBottom:10 }}>
            {label}
          </div>
          <div style={{ fontSize:28, fontWeight:800, color: accent || 'var(--text)', lineHeight:1 }}>
            {value ?? '—'}
          </div>
          {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:7 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width:46, height:46, borderRadius:12,
            background: accent ? `${accent}15` : 'var(--surface2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, flexShrink:0,
          }}>
            {icon}
          </div>
        )}
      </div>
      {accent && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:3,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          opacity:0.5,
        }}/>
      )}
    </Card>
  )
}

/* ── Page Header ────────────────────────── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      marginBottom:24, gap:16 }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:'-0.3px' }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Search Input ───────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Qidirish...' }) {
  return (
    <div style={{ position:'relative' }}>
      <svg style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background:'#fff', border:'1.5px solid var(--border2)',
          borderRadius:9, color:'var(--text)',
          padding:'8px 12px 8px 34px', fontSize:13, width:230,
          boxShadow:'var(--shadow-sm)', transition:'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
      />
    </div>
  )
}

/* ── Tabs ───────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display:'flex', gap:2,
      background:'var(--surface2)',
      borderRadius:10, padding:3,
      marginBottom:20, width:'fit-content',
      border:'1px solid var(--border)',
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding:'7px 18px', borderRadius:7,
          fontSize:13, fontWeight:500,
          transition:'all 0.15s', border:'none', cursor:'pointer',
          background: active===t.key ? '#fff' : 'transparent',
          color:       active===t.key ? 'var(--text)' : 'var(--text3)',
          boxShadow:   active===t.key ? 'var(--shadow-sm)' : 'none',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ── Section Label ──────────────────────── */
export function SLabel({ children }) {
  return (
    <div style={{
      fontSize:11, fontWeight:700, textTransform:'uppercase',
      letterSpacing:'0.8px', color:'var(--text3)', marginBottom:10,
    }}>
      {children}
    </div>
  )
}

/* ── Inline input style (for modals) ───── */
export const iStyle = {
  background:'#fff', border:'1.5px solid var(--border2)',
  borderRadius:8, color:'var(--text)',
  padding:'9px 12px', fontSize:13, width:'100%',
  boxShadow:'var(--shadow-sm)',
}

/* ── Toast Container ────────────────────── */
export function ToastContainer({ toasts }) {
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
      display:'flex', flexDirection:'column', gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:'12px 18px', borderRadius:10, fontSize:13, fontWeight:600,
          animation:'toast-in 0.2s ease', maxWidth:340,
          boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
          display:'flex', alignItems:'center', gap:10,
          ...(t.type==='success'
            ? { background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0' }
            : { background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca' }
          ),
        }}>
          <span style={{ fontSize:16 }}>{t.type==='success' ? '✅' : '❌'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ── Pagination ──────────────────────────── */
export function Pagination({ total, current, pageSize = 50, onChange }) {
  const pages = Math.ceil(total / (pageSize || 50))
  if (pages <= 1) return null

  const start = (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderTop:'1px solid var(--border)' }}>
      <div style={{ fontSize:13, color:'var(--text3)' }}>
        Ko'rsatilyapti <span style={{ fontWeight:700, color:'var(--text)' }}>{start}-{end}</span> / <span style={{ fontWeight:700, color:'var(--text)' }}>{total}</span>
      </div>
      <div style={{ display:'flex', gap:12 }}>
        <div style={{ display:'flex', gap:4 }}>
          <Btn size="sm" variant="ghost" disabled={current === 1} onClick={() => onChange(current - 1)} style={{ padding:'0 8px', height:30 }}>
            «
          </Btn>
          <div style={{ display:'flex', gap:4, margin:'0 4px' }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => {
              if (pages > 8 && Math.abs(p - current) > 2 && p !== 1 && p !== pages) {
                if (p === 2 || p === pages - 1) return <span key={p} style={{ alignSelf:'center', color:'var(--text3)', padding:'0 2px' }}>...</span>
                return null
              }
              return (
                <button key={p} onClick={() => onChange(p)} style={{
                  minWidth:30, height:30, borderRadius:8, border:'none', cursor:'pointer',
                  fontSize:12, fontWeight:700, transition:'all 0.1s',
                  background: current === p ? 'var(--accent)' : 'var(--surface2)',
                  color:      current === p ? '#fff' : 'var(--text2)',
                }}>
                  {p}
                </button>
              )
            })}
          </div>
          <Btn size="sm" variant="ghost" disabled={current === pages} onClick={() => onChange(current + 1)} style={{ padding:'0 8px', height:30 }}>
            »
          </Btn>
        </div>
      </div>
    </div>
  )
}
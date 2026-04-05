import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { Badge } from '@/components/UI'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ShoppingBag, Users, TrendingUp, AlertTriangle,
  Package, RefreshCw, Clock, DollarSign, CreditCard,
  CheckCircle, XCircle, Truck, ArrowUpRight, ArrowDownRight,
  Zap, Plus, UserPlus, CalendarClock, Star,
  Banknote, Wallet, Building2, ChevronRight, LayoutGrid,
} from 'lucide-react'

const fmt      = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtShort = n => {
  n = Number(n || 0)
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' mln'
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'short' }) : '—'
const fmtDT   = d => d ? new Date(d).toLocaleDateString('uz-UZ', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const STATUS_LABELS = {
  new:'Yangi', pending:'Jarayonda', production:'Ishlab chiqarishda',
  ready:'Tayyor', delivered:'Yetkazildi', completed:'Yakunlandi', cancelled:'Bekor',
}
const STATUS_COLORS = {
  new:'#6366f1', pending:'#f59e0b', production:'#f97316',
  ready:'#10b981', delivered:'#059669', completed:'#94a3b8', cancelled:'#ef4444',
}
const STATUS_ORDER = ['new','pending','production','ready','delivered','completed','cancelled']

// Demo spark data
const SPARK = [30,45,38,60,52,75,68,90,82,100].map((v,i)=>({v,i}))

// ── KPI karta ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, trend, trendUp, onClick, live }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--surface)', border: `1px solid ${hov ? color+'40' : 'var(--border)'}`,
        borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
        boxShadow: hov ? `0 8px 28px ${color}22` : 'var(--shadow-sm)',
        transition: 'all 0.2s', cursor: onClick ? 'pointer' : 'default',
        transform: hov && onClick ? 'translateY(-3px)' : 'none',
      }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color,
        borderRadius:'16px 16px 0 0', transform: hov ? 'scaleX(1)':'scaleX(0.35)',
        transformOrigin:'left', transition:'transform 0.3s ease' }}/>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ width:44, height:44, borderRadius:13, background:`${color}18`,
          display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <Icon size={21} color={color}/>
          {live && (
            <div style={{ position:'absolute', top:0, right:0, width:9, height:9,
              borderRadius:'50%', background:'#10b981', border:'2px solid var(--surface)',
              animation:'pulse 1.5s ease-in-out infinite' }}/>
          )}
        </div>
        {trend !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, fontWeight:700,
            color: trendUp ? '#16a34a':'#dc2626',
            background: trendUp ? '#f0fdf4':'#fef2f2',
            padding:'3px 8px', borderRadius:20 }}>
            {trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px',
        color:'var(--text3)', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:900, color:'var(--text)', lineHeight:1,
        letterSpacing:'-0.5px', marginBottom:3 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text3)' }}>{sub}</div>}

      <div style={{ marginTop:10, opacity:0.55 }}>
        <ResponsiveContainer width="100%" height={28}>
          <AreaChart data={SPARK} margin={{top:0,right:0,left:0,bottom:0}}>
            <defs>
              <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
              fill={`url(#sg${color.replace('#','')})`} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────
function SHead({ title, badge, action, color = '#6366f1' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:3, height:18, background:`linear-gradient(180deg,${color},${color}88)`, borderRadius:2 }}/>
        <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{title}</span>
        {badge !== undefined && (
          <span style={{ background:`${color}18`, color, fontSize:11, fontWeight:700,
            padding:'2px 9px', borderRadius:20 }}>{badge}</span>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CTooltip({ active, payload, label, suffix='' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10,
      padding:'10px 14px', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ fontWeight:700, color:'var(--text2)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:'var(--text2)' }}>{p.name}:</span>
          <span style={{ fontWeight:700, color:'var(--text)' }}>{fmt(p.value)}{suffix}</span>
        </div>
      ))}
    </div>
  )
}

// ── Quick Action button ───────────────────────────────────────────────────────
function QuickBtn({ icon: Icon, label, color, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        padding:'16px 12px', borderRadius:14, border:`1.5px solid ${hov ? color+'60':'var(--border)'}`,
        background: hov ? `${color}10` : 'var(--surface)',
        cursor:'pointer', transition:'all 0.18s', flex:1,
        boxShadow: hov ? `0 4px 16px ${color}20` : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
        fontFamily:'inherit',
      }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`${color}18`,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} color={color}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color: hov ? color : 'var(--text2)',
        textAlign:'center', lineHeight:1.3 }}>{label}</span>
    </button>
  )
}

// ── Asosiy komponent ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useApp()
  const navigate  = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [refreshing, setRefr] = useState(false)
  const [time, setTime]       = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefr(true)
    else { setLoading(true); setError(null) }
    try { setData(await api.dashboard()) }
    catch(e) { setError(e.message) }
    finally { setLoading(false); setRefr(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:44, height:44, border:'3px solid var(--surface2)',
        borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <div style={{ fontSize:13, color:'var(--text3)', fontWeight:600 }}>Yuklanmoqda...</div>
    </div>
  )

  if (error) return (
    <div style={{ maxWidth:400, margin:'80px auto', textAlign:'center', background:'var(--surface)',
      borderRadius:20, padding:48, border:'1px solid var(--border)' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:8, color:'var(--text)' }}>Xato yuz berdi</div>
      <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>{error}</div>
      <button onClick={() => load()}
        style={{ padding:'10px 28px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color:'#fff', borderRadius:10, fontWeight:700, border:'none', cursor:'pointer',
          fontFamily:'inherit' }}>
        Qayta urinish
      </button>
    </div>
  )

  if (!data) return null

  // ── Ma'lumotlarni tayyorlash ───────────────────────────────────────────────

  // Holat grafik
  const pieData = STATUS_ORDER
    .map(s => ({ name: STATUS_LABELS[s], value: data.orders_by_status?.[s]||0, color: STATUS_COLORS[s] }))
    .filter(d => d.value > 0)
  const totalOrders = pieData.reduce((a,b) => a+b.value, 0)

  const statusBarData = STATUS_ORDER
    .filter(s => (data.orders_by_status?.[s]||0) > 0)
    .map(s => ({ name: STATUS_LABELS[s].slice(0,8), full: STATUS_LABELS[s], value: data.orders_by_status?.[s]||0, color: STATUS_COLORS[s] }))

  // Oylik trend — agar backend qaytarmasa, demo data
  const monthlyTrend = data.monthly_trend?.length
    ? data.monthly_trend
    : ['Yan','Feb','Mar','Apr','May','Iyn'].map((m,i) => ({
        month: m,
        revenue: Math.floor(Math.random()*50_000_000 + 10_000_000),
        count: Math.floor(Math.random()*20 + 5),
      }))

  // To'lov usullari
  const pmRaw = data.payment_methods || {}
  const payMethods = [
    { name:'Naqd',     value: pmRaw.cash     || 0, color:'#10b981', icon:'💵' },
    { name:'Karta',    value: pmRaw.card      || 0, color:'#6366f1', icon:'💳' },
    { name:'Transfer', value: pmRaw.transfer  || 0, color:'#f59e0b', icon:'🏦' },
    { name:'Boshqa',   value: pmRaw.other     || 0, color:'#94a3b8', icon:'📋' },
  ].filter(m => m.value > 0)
  const pmTotal = payMethods.reduce((s,m) => s+m.value, 0)

  // Top mahsulotlar
  const topProducts      = data.top_products       || []
  const topClients       = data.top_clients         || []
  const staffActivity    = data.staff_activity      || []
  const overdueOrders    = data.overdue_orders      || []
  const inProduction     = data.in_production       || []
  const todayOrders      = data.today_orders        || 0
  const todayRevenue     = data.today_revenue       || 0
  const lowStockItems    = data.low_stock_items     || []
  const overdueDebtors   = data.overdue_debtors     || []
  const staffLeaderboard = data.staff_leaderboard   || []
  const salesFunnel      = data.sales_funnel        || []
  const activityStream   = data.activity_stream     || []

  // Qarz ogohlantirish darajasi
  const debtRatio = data.total_revenue > 0
    ? (Number(data.total_debt) / Number(data.total_revenue) * 100)
    : 0
  const debtAlert = debtRatio > 30

  const dateStr = time.toLocaleDateString('uz-UZ', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const timeStr = time.toLocaleTimeString('uz-UZ', { hour:'2-digit', minute:'2-digit' })

  const isAdmin   = ['admin','manager'].includes(user?.role)
  const isAcct    = user?.role === 'accountant'
  const isClient  = user?.role === 'client'
  const isWorker  = user?.role === 'worker'

  if (isClient) return <ClientDashboard data={data} user={user} navigate={navigate} load={load} refreshing={refreshing} />

  return (
    <div style={{ animation:'fadeIn 0.25s ease' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.5px',
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Dashboard
            </h1>
            {refreshing && <div style={{ width:15, height:15, border:'2px solid var(--surface2)',
              borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text3)', fontSize:13 }}>
            <Clock size={12}/>
            <span style={{ textTransform:'capitalize' }}>{dateStr}</span>
            <span style={{ opacity:0.4 }}>·</span>
            <span style={{ fontWeight:700, color:'#6366f1' }}>{timeStr}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => load(true)} disabled={refreshing}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
              background:'var(--surface)', border:'1px solid var(--border)',
              fontSize:13, fontWeight:600, color:'var(--text2)', cursor:'pointer', fontFamily:'inherit',
              transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            <RefreshCw size={13} style={{ animation:refreshing?'spin 0.7s linear infinite':'none' }}/>
            Yangilash
          </button>
        </div>
      </div>

      {/* ── Qarz ogohlantirish banner ─────────────────────────────────────── */}
      {debtAlert && (isAdmin || isAcct) && (
        <div style={{
          display:'flex', alignItems:'center', gap:14, padding:'14px 20px',
          background:'linear-gradient(135deg,#fef2f2,#fff5f5)',
          border:'1.5px solid #fecaca', borderRadius:14, marginBottom:20,
          boxShadow:'0 2px 12px rgba(239,68,68,0.1)',
        }}>
          <div style={{ width:40, height:40, borderRadius:11, background:'#fee2e2',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AlertTriangle size={20} color="#ef4444"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#b91c1c', marginBottom:2 }}>
              ⚠️ Qarz darajasi yuqori!
            </div>
            <div style={{ fontSize:12, color:'#dc2626' }}>
              Jami qarz: <strong>{fmt(data.total_debt)} so'm</strong> — daromadning{' '}
              <strong>{Math.round(debtRatio)}%</strong> ini tashkil qiladi.
              {overdueOrders.length > 0 && ` ${overdueOrders.length} ta buyurtma kechikkan.`}
            </div>
          </div>
          <button onClick={() => navigate('/finance?tab=debts')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:9,
              background:'#ef4444', color:'#fff', border:'none', cursor:'pointer',
              fontSize:12, fontWeight:700, fontFamily:'inherit', flexShrink:0 }}>
            Ko'rish <ChevronRight size={13}/>
          </button>
        </div>
      )}

      {/* ── Smart Alerts (Ombor + Qarzdorlar) ────────────────────────────── */}
      {(lowStockItems.length > 0 || overdueDebtors.length > 0) && (
        <div style={{ display:'grid', gridTemplateColumns: lowStockItems.length > 0 && overdueDebtors.length > 0 ? '1fr 1fr' : '1fr', gap:12, marginBottom:14 }}>

          {/* Ombor ogohlantirishlari */}
          {lowStockItems.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#fffbeb,#fff7ed)', border:'1.5px solid #fde68a',
              borderRadius:16, padding:'16px 20px', boxShadow:'0 2px 12px rgba(245,158,11,0.12)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#fef3c7',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Package size={18} color="#d97706"/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#92400e' }}>⚠️ Kam zaxira</div>
                  <div style={{ fontSize:11, color:'#b45309' }}>{lowStockItems.length} ta mahsulot minimal chegarada</div>
                </div>
                <button onClick={() => navigate('/warehouse')}
                  style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'5px 12px',
                    background:'#f59e0b', color:'#fff', border:'none', borderRadius:8,
                    fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Ko'rish <ChevronRight size={11}/>
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {lowStockItems.slice(0,4).map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'6px 10px' }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'#78350f' }}>{item.name}</span>
                    <span style={{ fontSize:11, color:'#d97706', fontWeight:700 }}>
                      {item.quantity} / {item.min_qty} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Muddati o'tgan qarzdorlar */}
          {overdueDebtors.length > 0 && (
            <div style={{ background:'linear-gradient(135deg,#fff1f2,#fef2f2)', border:'1.5px solid #fecdd3',
              borderRadius:16, padding:'16px 20px', boxShadow:'0 2px 12px rgba(239,68,68,0.1)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#fee2e2',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <AlertTriangle size={18} color="#dc2626"/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#991b1b' }}>🚨 Muddati o'tgan</div>
                  <div style={{ fontSize:11, color:'#b91c1c' }}>{overdueDebtors.length} ta buyurtma to'lanmagan</div>
                </div>
                {(isAdmin || isAcct) && (
                  <button onClick={() => navigate('/finance?tab=debts')}
                    style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'5px 12px',
                      background:'#ef4444', color:'#fff', border:'none', borderRadius:8,
                      fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Ko'rish <ChevronRight size={11}/>
                  </button>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {overdueDebtors.slice(0,4).map((d, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'6px 10px' }}>
                    <div>
                      <span style={{ fontFamily:'monospace', fontSize:11, color:'#ef4444', fontWeight:700 }}>#{d.order_number} </span>
                      <span style={{ fontSize:12, color:'#991b1b', fontWeight:600 }}>{d.client_name}</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#dc2626' }}>{fmtShort(d.remaining)} so'm</div>
                      <div style={{ fontSize:10, color:'#ef4444' }}>{d.days_overdue} kun</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bugun live counter ────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:14 }}>
        {/* Bugun buyurtmalar */}
        <div style={{ background:'linear-gradient(135deg,#1a2540,#2d3a5e)', borderRadius:16,
          padding:'20px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120,
            borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
              letterSpacing:'1px', color:'rgba(255,255,255,0.45)' }}>
              Bugun
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5,
              fontSize:10, color:'#6ee7b7', fontWeight:600 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981',
                animation:'pulse 1.5s ease-in-out infinite' }}/>
              LIVE
            </div>
          </div>
          <div style={{ fontSize:42, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:4 }}>
            {todayOrders}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>ta yangi buyurtma</div>
          {todayRevenue > 0 && (
            <div style={{ marginTop:10, fontSize:13, color:'#6ee7b7', fontWeight:600 }}>
              +{fmtShort(todayRevenue)} so'm tushum
            </div>
          )}
        </div>

        {/* Ishlab chiqarishdagi */}
        <div style={{ background:'linear-gradient(135deg,#431407,#7c2d12,#ea580c)', borderRadius:16,
          padding:'20px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120,
            borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'1px', color:'rgba(255,255,255,0.45)', marginBottom:10 }}>
            Ishlab chiqarishda
          </div>
          <div style={{ fontSize:42, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:4 }}>
            {data.orders_by_status?.production || 0}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>ta buyurtma</div>
          {inProduction.slice(0,2).map(o => (
            <div key={o.id} style={{ marginTop:8, display:'flex', justifyContent:'space-between',
              background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'5px 10px', fontSize:11 }}>
              <span style={{ color:'rgba(255,255,255,0.8)', fontFamily:'monospace' }}>#{o.order_number}</span>
              <span style={{ color:'rgba(255,255,255,0.55)' }}>{o.client_name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 ta KPI ─────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
        <KpiCard icon={ShoppingBag} label="Jami buyurtmalar"
          value={data.total_orders} sub={`${data.new_orders} ta yangi`}
          color="#6366f1" trend={12} trendUp
          onClick={() => navigate('/orders')}/>
        <KpiCard icon={Users} label="Faol mijozlar"
          value={data.total_clients} sub="ro'yxatda"
          color="#0ea5e9" trend={5} trendUp
          onClick={(!isWorker && !isClient) ? () => navigate('/clients') : undefined}/>
        {!isWorker && (
          <KpiCard icon={TrendingUp} label="Jami tushum"
            value={fmtShort(data.total_revenue)} sub="so'm"
            color="#10b981" trend={8} trendUp
            onClick={isAdmin || isAcct ? () => navigate('/finance') : undefined}/>
        )}
        <KpiCard
          icon={data.low_stock_count > 0 ? AlertTriangle : Package}
          label="Kam stok" value={data.low_stock_count}
          sub="mahsulot" color={data.low_stock_count > 0 ? '#ef4444' : '#10b981'}
          onClick={() => navigate('/warehouse')}/>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      {isAdmin && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:16, padding:'18px 20px', marginBottom:14 }}>
          <SHead title="Tez amallar" color="#8b5cf6"/>
          <div style={{ display:'flex', gap:10 }}>
            <QuickBtn icon={Plus}       label="Yangi buyurtma" color="#6366f1" onClick={() => navigate('/orders')}/>
            <QuickBtn icon={UserPlus}   label="Yangi mijoz"    color="#10b981" onClick={() => navigate('/clients')}/>
            <QuickBtn icon={Package}    label="Mahsulot qo'sh" color="#f97316" onClick={() => navigate('/products')}/>
            <QuickBtn icon={Zap}        label="AI Yordamchi"   color="#8b5cf6" onClick={() => navigate('/ai')}/>
            <QuickBtn icon={CreditCard} label="Moliya"         color="#0ea5e9" onClick={() => navigate('/finance')}/>
          </div>
        </div>
      )}

      {/* ── 2 ta gradient karta (revenue + qarz) ─────────────────────────── */}
      {!isWorker && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          {[
            { label:'💰 Jami tushum', value:data.total_revenue,
              grad:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', shadow:'rgba(37,99,235,0.25)', spark:'#93c5fd' },
            { label:'📉 Faol qarzlar', value:data.total_debt,
              grad:'linear-gradient(135deg,#450a0a,#991b1b,#dc2626)', shadow:'rgba(220,38,38,0.25)', spark:'#fca5a5' },
          ].map((card,ci) => (
            <div key={ci} style={{ background:card.grad, borderRadius:16, padding:'22px 26px',
              position:'relative', overflow:'hidden', boxShadow:`0 6px 24px ${card.shadow}` }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:150, height:150,
                borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
                letterSpacing:'1.2px', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{card.label}</div>
              <div style={{ fontSize:32, fontWeight:900, color:'#fff', letterSpacing:'-1px', marginBottom:3 }}>
                {fmt(card.value)}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:16 }}>so'm</div>
              <ResponsiveContainer width="100%" height={44}>
                <AreaChart data={SPARK} margin={{top:0,right:0,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id={`g${ci}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.spark} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={card.spark} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={card.spark} strokeWidth={2}
                    fill={`url(#g${ci})`} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* ── Oylik trend + Holat donut ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isWorker ? '1fr' : '1fr 280px', gap:12, marginBottom:14 }}>

        {/* Oylik daromad trend */}
        {!isWorker && (
          <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
            border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
            <SHead title="Oylik daromad trendi" badge="6 oy" color="#10b981"/>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrend} margin={{top:4,right:4,left:-10,bottom:0}}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => fmtShort(v)}/>
                <Tooltip content={<CTooltip suffix=" so'm"/>}/>
                <Area type="monotone" dataKey="revenue" name="Daromad" stroke="#10b981"
                  strokeWidth={2.5} fill="url(#revGrad)" dot={{ r:3, fill:'#10b981', strokeWidth:0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Donut — holat */}
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
          <SHead title="Holat" color="#6366f1"/>
          {pieData.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Buyurtmalar yo'q</div>
          ) : (
            <>
              <div style={{ position:'relative', width:140, height:140, margin:'0 auto 14px' }}>
                <PieChart width={140} height={140}>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={62}
                    dataKey="value" strokeWidth={3} stroke="var(--surface)" paddingAngle={2}>
                    {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
                <div style={{ position:'absolute', inset:0, display:'flex',
                  flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize:20, fontWeight:900, color:'var(--text)' }}>{totalOrders}</div>
                  <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700, textTransform:'uppercase' }}>jami</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:d.color, flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:'var(--text2)', flex:1 }}>{d.name}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{d.value}</span>
                    <span style={{ fontSize:10, color:'var(--text3)', width:30, textAlign:'right' }}>
                      {totalOrders ? Math.round(d.value/totalOrders*100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Holat bar chart + To'lov usullari ────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isWorker ? '1fr' : '1fr 1fr', gap:12, marginBottom:14 }}>

        {/* Holat bar */}
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
          <SHead title="Buyurtmalar holat bo'yicha" badge={`${totalOrders} ta`} color="#6366f1"/>
          {statusBarData.length === 0
            ? <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>Ma'lumot yo'q</div>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={statusBarData} barSize={28} margin={{top:4,right:4,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CTooltip suffix=" ta"/>}/>
                  <Bar dataKey="value" name="Buyurtma" radius={[6,6,0,0]}>
                    {statusBarData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* To'lov usullari */}
        {!isWorker && (
          <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
            border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
            <SHead title="To'lov usullari" color="#f59e0b"/>
            {payMethods.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>
                To'lovlar yo'q
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:4 }}>
                {payMethods.map(m => {
                  const pct = pmTotal > 0 ? Math.round(m.value/pmTotal*100) : 0
                  return (
                    <div key={m.name}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                          <span>{m.icon}</span>
                          <span style={{ fontWeight:600, color:'var(--text)' }}>{m.name}</span>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{fmtShort(m.value)} so'm</div>
                          <div style={{ fontSize:10, color:'var(--text3)' }}>{pct}%</div>
                        </div>
                      </div>
                      <div style={{ height:6, background:'var(--surface2)', borderRadius:10, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:m.color,
                          borderRadius:10, transition:'width 0.6s ease' }}/>
                      </div>
                    </div>
                  )
                })}
                {pmTotal === 0 && (
                  <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                    To'lov ma'lumotlari yo'q
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sotuv Voronkasi + Xodimlar Reytingi ──────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>

        {/* Sales Funnel */}
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
          <SHead title="📊 Bu oy sotuv voronkasi" color="#6366f1"/>
          {salesFunnel.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)', fontSize:13 }}>Ma'lumot yo'q</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {salesFunnel.map((step, i) => {
                const maxVal = salesFunnel[0]?.value || 1
                const pct = maxVal > 0 ? Math.round(step.value / maxVal * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:step.color, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600 }}>{step.label}</span>
                      </div>
                      <div style={{ display:'flex', align:'center', gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{step.value}</span>
                        <span style={{ fontSize:11, color:'var(--text3)', minWidth:32, textAlign:'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:8, background:'var(--surface2)', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:step.color,
                        borderRadius:10, transition:'width 0.8s ease' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Staff Leaderboard */}
        {isAdmin && (
          <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
            border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
            <SHead title="🏆 Bu oy reytingi" badge="Top xodimlar" color="#8b5cf6"/>
            {staffLeaderboard.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)', fontSize:13 }}>Ma'lumot yo'q</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {staffLeaderboard.map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'10px 14px', borderRadius:12,
                    background: i===0 ? 'linear-gradient(135deg,#fef3c7,#fffbeb)'
                               : i===1 ? 'linear-gradient(135deg,#f1f5f9,#f8fafc)'
                               : i===2 ? 'linear-gradient(135deg,#fef2f2,#fff5f5)' : 'var(--surface2)',
                    border: i===0 ? '1.5px solid #fde68a' : i===1 ? '1.5px solid #e2e8f0' : i===2 ? '1.5px solid #fecaca' : '1px solid var(--border)'
                  }}>
                    <div style={{ fontSize:20, flexShrink:0 }}>
                      {i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `${i+1}.`}
                    </div>
                    <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                      background:`hsl(${(s.name?.charCodeAt(0)||65)*7%360},60%,48%)`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontWeight:800, color:'#fff' }}>
                      {s.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{s.month_orders} ta buyurtma</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:12, fontWeight:800,
                        color: i===0 ? '#d97706' : i===1 ? '#64748b' : i===2 ? '#dc2626' : 'var(--text2)' }}>
                        {fmtShort(s.month_revenue)}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)' }}>so'm</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Top mahsulotlar + Top mijozlar ───────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>

        {/* TOP-5 mahsulotlar */}
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
          <SHead title="TOP mahsulotlar" badge="5 ta" color="#f97316"
            action={
              <button onClick={() => navigate('/products')}
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text3)',
                  background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                Barchasi <ChevronRight size={13}/>
              </button>
            }
          />
          {topProducts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)', fontSize:13 }}>
              Ma'lumot yo'q
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {topProducts.map((p,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:26, height:26, borderRadius:8, flexShrink:0,
                    background: i===0?'#fef3c7':i===1?'#f3f4f6':i===2?'#fce7f3':'var(--surface2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:900,
                    color: i===0?'#d97706':i===1?'#6b7280':i===2?'#db2777':'var(--text3)' }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{p.qty} dona sotilgan</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                    {fmtShort(p.revenue)} so'm
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top mijozlar */}
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
          <SHead title="Top mijozlar" badge="5 ta" color="#0ea5e9"
            action={
              <button onClick={() => navigate('/clients')}
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text3)',
                  background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                Barchasi <ChevronRight size={13}/>
              </button>
            }
          />
          {topClients.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text3)', fontSize:13 }}>
              Ma'lumot yo'q
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {topClients.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                    background:`hsl(${(c.name?.charCodeAt(0)||65)*7%360},60%,48%)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:800, color:'#fff' }}>
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{c.order_count} ta buyurtma</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#10b981', flexShrink:0 }}>
                    {fmtShort(c.total_spent)} so'm
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Kechikkan buyurtmalar ─────────────────────────────────────────── */}
      {overdueOrders.length > 0 && (
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1.5px solid #fecaca', boxShadow:'0 2px 12px rgba(239,68,68,0.08)',
          marginBottom:14 }}>
          <SHead title="⏰ Kechikkan buyurtmalar" badge={`${overdueOrders.length} ta`} color="#ef4444"/>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {overdueOrders.map(o => {
              const daysLate = Math.floor((new Date() - new Date(o.delivery_date)) / 86400000)
              return (
                <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 14px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontFamily:'monospace', color:'#ef4444', fontWeight:700, fontSize:12 }}>
                      #{o.order_number}
                    </span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#991b1b' }}>{o.client_name}</div>
                      <div style={{ fontSize:11, color:'#ef4444' }}>
                        {daysLate} kun kechikdi · {fmtDate(o.delivery_date)} bo'lishi kerak edi
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Badge status={o.status}/>
                    <span style={{ fontSize:12, fontWeight:700, color:'#b91c1c' }}>
                      {fmt(o.total_amount)} so'm
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Xodimlar faolligi ─────────────────────────────────────────────── */}
      {staffActivity.length > 0 && isAdmin && (
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', marginBottom:14 }}>
          <SHead title="Xodimlar faolligi" badge="30 kun" color="#8b5cf6"/>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {staffActivity.map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                background:'var(--surface2)', borderRadius:12, padding:'12px 16px',
                border:'1px solid var(--border)', flex:1, minWidth:160 }}>
                <div style={{ width:36, height:36, borderRadius:'50%',
                  background:`hsl(${i*60},60%,48%)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {s.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                    <span style={{ fontSize:18, fontWeight:900, color:'#8b5cf6' }}>{s.order_count}</span>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>ta buyurtma</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Jonli Faoliyat Lentasi ────────────────────────────────────────── */}
      {activityStream.length > 0 && (
        <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
          border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', marginBottom:14 }}>
          <SHead title="⚡ Jonli faoliyat" badge={`${activityStream.length} ta to'lov`} color="#10b981"
            action={
              <button onClick={() => navigate('/finance?tab=payments')}
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text3)',
                  background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                Barchasi <ChevronRight size={13}/>
              </button>
            }
          />
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {activityStream.map((act, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12,
                padding:'10px 0', borderBottom: i < activityStream.length-1 ? '1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:2, flexShrink:0 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'#dcfce7', border:'2px solid #86efac',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Banknote size={14} color="#16a34a"/>
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{act.client}</span>
                      <span style={{ fontSize:12, color:'var(--text3)' }}> · #{act.order_num}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color:'#16a34a', flexShrink:0, marginLeft:8 }}>
                      +{fmtShort(act.amount)} so'm
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, background:'#f0fdf4', color:'#166534',
                      padding:'2px 7px', borderRadius:20, fontWeight:600 }}>{act.method}</span>
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{act.by} · {act.created_at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── So'nggi buyurtmalar ───────────────────────────────────────────── */}
      <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 22px',
        border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
        <SHead title="So'nggi buyurtmalar" badge={`${(data.recent_orders||[]).length} ta`} color="#6366f1"
          action={
            <button onClick={() => navigate('/orders')}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text3)',
                background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
              Barchasi <ChevronRight size={13}/>
            </button>
          }
        />

        {(!data.recent_orders || data.recent_orders.length === 0) ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text3)' }}>
            <ShoppingBag size={32} style={{ opacity:0.3, margin:'0 auto 10px', display:'block' }}/>
            Buyurtmalar yo'q
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 110px 130px 120px 110px',
              padding:'6px 12px', marginBottom:4, fontSize:10, fontWeight:800,
              textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--text3)',
              borderBottom:'2px solid var(--border)' }}>
              <span>#Raqam</span><span>Mijoz</span><span>Menejer</span>
              <span>Summa</span><span style={{textAlign:'center'}}>To'lov</span>
              <span style={{textAlign:'right'}}>Holat</span>
            </div>

            {data.recent_orders.slice(0,10).map((o,i) => {
              const debt    = Number(o.total_amount) - Number(o.paid_amount)
              const paidPct = o.total_amount > 0 ? Math.round(Number(o.paid_amount)/Number(o.total_amount)*100) : 0
              return (
                <div key={o.id} style={{
                  display:'grid', gridTemplateColumns:'80px 1fr 110px 130px 120px 110px',
                  padding:'11px 12px', borderRadius:10, alignItems:'center',
                  background: i%2===0 ? 'transparent':'var(--surface2)', transition:'background 0.1s', cursor:'pointer',
                }}
                onClick={() => navigate('/orders')}
                onMouseEnter={e => e.currentTarget.style.background='var(--accent-lo)'}
                onMouseLeave={e => e.currentTarget.style.background=i%2===0?'transparent':'var(--surface2)'}>

                  <span style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent)', fontWeight:800 }}>
                    #{o.order_number}
                  </span>

                  <div style={{ overflow:'hidden' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.client_name || '—'}
                    </div>
                  </div>

                  <span style={{ fontSize:11, color:'var(--text3)', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {o.manager_name || '—'}
                  </span>

                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{fmt(o.total_amount)}</div>
                    {debt > 0 && <div style={{ fontSize:10, color:'var(--red)', fontWeight:600 }}>Qarz: {fmt(debt)}</div>}
                  </div>

                  <div style={{ paddingRight:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:9, color:'var(--text3)' }}>To'landi</span>
                      <span style={{ fontSize:9, fontWeight:700,
                        color: paidPct===100?'var(--green)':paidPct>50?'var(--yellow)':'var(--red)' }}>
                        {paidPct}%
                      </span>
                    </div>
                    <div style={{ height:5, background:'var(--surface3)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3, transition:'width 0.4s', width:`${paidPct}%`,
                        background: paidPct===100?'var(--green)':paidPct>50?'var(--yellow)':'var(--red)' }}/>
                    </div>
                  </div>

                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <Badge status={o.status}/>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ── Client-Specific Dashboard ────────────────────────────────────────────────
function ClientDashboard({ data, user, navigate, load, refreshing }) {
  const { featured_products: featured = [] } = data

  const stats = [
    { label: 'Qarzdorlik',        value: `${fmt(data.total_debt)} so'm`, icon: Wallet,       color: '#ef4444' },
    { label: 'Jami buyurtmalar', value: `${data.total_orders} ta`,         icon: ShoppingBag,  color: '#6366f1' },
    { label: 'Jarayondagi ishlar',value: `${data.active_orders} ta`,        icon: RefreshCw,    color: '#f59e0b' },
    { label: "Bugungi tushum",    value: `${fmt(data.today_revenue)} so'm`, icon: Banknote, color: '#10b981' },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
             Xush kelibsiz, <span style={{ color: '#6366f1' }}>{data.client_name || user.username}</span>! 👋
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Sizning bugungi buyurtma va to'lov holatingiz.</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
          <RefreshCw size={18} color="var(--text2)" className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 30 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 20, padding: 22, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        {/* Recent Orders */}
        <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>So'nggi buyurtmalarim</h2>
            <button onClick={() => navigate('/orders')} 
              style={{ padding:'6px 14px', borderRadius:8, background:'var(--surface2)', border:'none', fontSize:12, fontWeight:700, color:'var(--text2)', cursor:'pointer' }}>
              Barchasi
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recent_orders?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Sizda hali buyurtmalar yo'q</div>
            ) : (
              data.recent_orders.slice(0, 5).map(o => {
                const unpaid = Number(o.total_amount) - Number(o.paid_amount)
                return (
                  <div key={o.id} onClick={() => navigate('/orders')} 
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, background: 'var(--surface2)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6366f1', fontSize: 14 }}>
                      #{o.order_number.slice(-3)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmt(o.total_amount)} so'm</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDT(o.created_at)}</div>
                    </div>
                    <div style={{ textAlign:'right', marginRight:10 }}>
                      {unpaid > 0 && <div style={{ fontSize:10, color:'#ef4444', fontWeight:700 }}>Qarz: {fmt(unpaid)}</div>}
                      <Badge status={o.status} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Featured Products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Action */}
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 24, padding: 24, color: '#fff', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Yangiliklar bormi?</h3>
            <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 18 }}>Yangi mahsulotlarimizni ko'zdan kechirib, hoziroq buyurtma berishingiz mumkin!</p>
            <button onClick={() => navigate('/products')}
              style={{ width:'100%', padding:'12px', borderRadius:14, background:'#fff', border:'none', fontSize:14, fontWeight:800, color:'#6366f1', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <LayoutGrid size={16}/> Katalogni ochish
            </button>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
             <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Tavsiya etiladi</h2>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
               {featured.map(p => (
                 <div key={p.id} onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
                   <div style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: 'var(--surface2)', marginBottom: 8 }}>
                     {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🪑</div>}
                   </div>
                   <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                   <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>{fmt(p.selling_price)} so'm</div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

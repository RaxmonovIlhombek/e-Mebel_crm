import { useState, useEffect, useMemo } from 'react'
import { exportBeautifulExcel } from '@/utils/excelExport'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { PageHeader, Card, Spinner, Btn } from '@/components/UI'
import { Download, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const fmt = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtShort = n => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

const COLORS = ['#f97316', '#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']

const STATUS_LABELS = {
  new: 'Yangi', pending: 'Jarayonda', production: 'Ishlab chiqarishda',
  ready: 'Tayyor', delivered: 'Yetkazildi', completed: 'Yakunlandi', cancelled: 'Bekor',
}
const STATUS_COLORS_MAP = {
  new: '#6366f1', pending: '#f59e0b', production: '#f97316',
  ready: '#10b981', delivered: '#059669', completed: '#94a3b8', cancelled: '#ef4444',
}

/* ── Stat karta ── */
function KpiCard({ icon, label, value, sub, trend, color = '#f97316' }) {
  const trendUp = trend > 0
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
            color: trendUp ? '#16a34a' : '#dc2626'
          }}>
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{
        fontSize: 11, color: '#94a3b8', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4
      }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>}
    </div>
  )
}

/* ── Custom tooltip ── */
function CustomTooltip({ active, payload, label, prefix = '', suffix = ' so\'m' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || '#fff', marginBottom: 2 }}>
          {p.name}: {prefix}{fmt(p.value)}{suffix}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ASOSIY SAHIFA
═══════════════════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const { toast } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6m') // 1m | 3m | 6m | 1y

  const load = async () => {
    setLoading(true)
    try {
      // Faqat dashboard API — barcha kerakli ma'lumotlar shu yerda
      const dash = await api.dashboard()
      setData({ dash, finance: null })
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // ── Ma'lumotlarni tayyorlash ───────────────────────────────────────────────
  const monthlyTrend = useMemo(() => {
    const raw = data?.dash?.monthly_trend || []
    return raw.map(m => ({
      ...m,
      revenue: Number(m.revenue || 0),
      count: Number(m.count || 0),
    }))
  }, [data])

  const statusData = useMemo(() => {
    const sd = data?.dash?.status_distribution || {}
    return Object.entries(sd)
      .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, status: k }))
      .filter(x => x.value > 0)
  }, [data])

  const payMethods = useMemo(() => {
    const pm = data?.dash?.payment_methods || {}
    const total = Object.values(pm).reduce((s, v) => s + Number(v || 0), 0)
    return [
      { name: '💵 Naqd', value: Number(pm.cash || 0), pct: total > 0 ? Math.round(pm.cash / total * 100) : 0 },
      { name: '💳 Karta', value: Number(pm.card || 0), pct: total > 0 ? Math.round(pm.card / total * 100) : 0 },
      { name: '🏦 Bank', value: Number(pm.transfer || 0), pct: total > 0 ? Math.round(pm.transfer / total * 100) : 0 },
      { name: '📋 Boshqa', value: Number(pm.other || 0), pct: total > 0 ? Math.round(pm.other / total * 100) : 0 },
    ].filter(x => x.value > 0)
  }, [data])

  const topProducts = useMemo(() => (data?.dash?.top_products || []).slice(0, 8), [data])
  const topClients = useMemo(() => (data?.dash?.top_clients || []).slice(0, 6), [data])

  // ── Oylik o'zgarish (trend) ────────────────────────────────────────────────
  const trendRevenue = useMemo(() => {
    if (monthlyTrend.length < 2) return undefined
    const last = monthlyTrend[monthlyTrend.length - 1]?.revenue || 0
    const prev = monthlyTrend[monthlyTrend.length - 2]?.revenue || 0
    if (!prev) return undefined
    return Math.round((last - prev) / prev * 100)
  }, [monthlyTrend])

  const trendOrders = useMemo(() => {
    if (monthlyTrend.length < 2) return undefined
    const last = monthlyTrend[monthlyTrend.length - 1]?.count || 0
    const prev = monthlyTrend[monthlyTrend.length - 2]?.count || 0
    if (!prev) return undefined
    return Math.round((last - prev) / prev * 100)
  }, [monthlyTrend])

  // ── Excel eksport ──────────────────────────────────────────────────────────
  const exportExcel = async () => {
    try {
      const sheets = []

      // 1. Oylik trend
      if (monthlyTrend?.length) {
        sheets.push({
          name: 'Oylik trend',
          columns: [
            { header: 'Oy',                key: 'month'   },
            { header: "Daromad (so'm)",    key: 'revenue' },
            { header: 'Buyurtmalar soni',  key: 'count'   },
          ],
          data: monthlyTrend.map(m => ({ month: m.month, revenue: m.revenue, count: m.count })),
        })
      }

      // 2. Top mahsulotlar
      if (topProducts?.length) {
        sheets.push({
          name: 'Top mahsulotlar',
          columns: [
            { header: 'Mahsulot',        key: 'name'    },
            { header: 'Sotilgan (dona)', key: 'qty'     },
            { header: "Daromad (so'm)",  key: 'revenue' },
          ],
          data: topProducts.map(p => ({ name: p.name, qty: p.qty, revenue: p.revenue })),
        })
      }

      // 3. Top mijozlar
      if (topClients?.length) {
        sheets.push({
          name: 'Top mijozlar',
          columns: [
            { header: 'Mijoz',           key: 'name'        },
            { header: 'Telefon',         key: 'phone'       },
            { header: 'Buyurtmalar',     key: 'order_count' },
            { header: "Xarid (so'm)",    key: 'total_spent' },
          ],
          data: topClients.map(c => ({ name: c.name, phone: c.phone, order_count: c.order_count, total_spent: c.total_spent })),
        })
      }

      if (!sheets.length) { toast("Export uchun ma'lumot yo'q", 'error'); return }

      await exportBeautifulExcel('emebel-analitika', sheets)
      toast('Excel yuklab olindi ✅', 'success')
    } catch (e) {
      toast("Excel yuklab bo'lmadi: " + e.message, 'error')
    }
  }

  if (loading) return (
    <div>
      <PageHeader title="Analytics" subtitle="Tahlil va hisobotlar" />
      <Card><Spinner /></Card>
    </div>
  )

  const d = data?.dash || {}
  const totalRevenue = Number(d.total_revenue || 0)
  const totalOrders = Number(d.total_orders || 0)
  const totalDebt = Number(d.total_debt || 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  return (
    <div>
      <PageHeader
        title="📊 Analytics"
        subtitle="Savdo tahlili va statistika"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" icon={<RefreshCw size={13} />} size="sm" onClick={load}>Yangilash</Btn>
            <Btn variant="ghost" icon={<Download size={13} />} size="sm" onClick={exportExcel}>Excel</Btn>
          </div>
        }
      />

      {/* ── KPI Kartalar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard icon="💰" label="Jami daromad" color="#10b981" trend={trendRevenue}
          value={`${fmtShort(totalRevenue)} so'm`}
          sub={`${fmt(totalRevenue)} so'm`} />
        <KpiCard icon="🛍️" label="Buyurtmalar" color="#6366f1" trend={trendOrders}
          value={`${totalOrders} ta`}
          sub={`O'rtacha: ${fmt(avgOrderValue)} so'm`} />
        <KpiCard icon="⚠️" label="Jami qarz" color="#ef4444"
          value={`${fmtShort(totalDebt)} so'm`}
          sub={totalOrders > 0 ? `${Math.round(totalDebt / totalRevenue * 100) || 0}% dan` : undefined} />
        <KpiCard icon="👥" label="Mijozlar" color="#f97316"
          value={`${d.total_clients || 0} ta`}
          sub={`${d.active_clients || 0} ta faol`} />
      </div>

      {/* ── Oylik daromad trenchi ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>📈 Oylik daromad</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>So'nggi {monthlyTrend.length} oy</div>
            </div>
          </div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Daromad"
                  stroke="#f97316" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ r: 3, fill: '#f97316' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#94a3b8'
            }}>Ma'lumot yo'q</div>
          )}
        </div>

        {/* Buyurtmalar holati (pie) */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 6 }}>🥧 Holat taqsimoti</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Barcha vaqt</div>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS_MAP[entry.status] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' ta', n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {statusData.slice(0, 5).map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: STATUS_COLORS_MAP[s.status] || COLORS[i % COLORS.length]
                      }} />
                      <span style={{ color: '#64748b' }}>{s.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.value} ta</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#94a3b8'
            }}>Ma'lumot yo'q</div>
          )}
        </div>
      </div>

      {/* ── Oylik buyurtmalar soni + To'lov usullari ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Oylik buyurtmalar soni */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 20px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>📦 Oylik buyurtmalar</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Oyma-oy soni</div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip suffix=" ta" />} />
                <Bar dataKey="count" name="Buyurtmalar" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#94a3b8'
            }}>Ma'lumot yo'q</div>
          )}
        </div>

        {/* To'lov usullari */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>💳 To'lov usullari</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>Tushgan to'lovlar taqsimoti</div>
          {payMethods.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {payMethods.map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{m.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{fmt(m.value)} so'm</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>{m.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 7, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 10, width: `${m.pct}%`,
                      background: COLORS[i], transition: 'width 0.6s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#94a3b8'
            }}>Ma'lumot yo'q</div>
          )}
        </div>
      </div>

      {/* ── Top mahsulotlar + Top mijozlar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Top mahsulotlar */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>🏆 Top mahsulotlar</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Eng ko'p sotilganlar</div>
          {topProducts.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProducts} layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtShort}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100}
                    tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip suffix=" dona" />} />
                  <Bar dataKey="qty" name="Sotilgan" radius={[0, 6, 6, 0]}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 8, background: '#f8fafc', fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 900, color: COLORS[i % COLORS.length], minWidth: 18 }}>
                        {['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || `${i + 1}.`}
                      </span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{p.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 11 }}>{p.qty} dona</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{fmtShort(p.revenue)} so'm</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#94a3b8'
            }}>Ma'lumot yo'q</div>
          )}
        </div>

        {/* Top mijozlar */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>👑 Top mijozlar</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Eng ko'p xarid qilganlar</div>
          {topClients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topClients.map((c, i) => {
                const avatarColor = `hsl(${(c.name || '').charCodeAt(0) * 7 % 360},55%,48%)`
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 11, background: '#f8fafc',
                    border: '1px solid #e2e8f0', transition: 'border-color 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0
                    }}>
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: 13, color: '#0f172a',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#10b981' }}>
                        {fmtShort(c.total_spent)} so'm
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.order_count} ta buyurtma</div>
                    </div>
                    <div style={{
                      fontWeight: 900, fontSize: 15, color: COLORS[i % COLORS.length],
                      minWidth: 20, textAlign: 'center'
                    }}>
                      {['🥇', '🥈', '🥉', '④', '⑤', '⑥'][i] || `${i + 1}`}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#94a3b8'
            }}>Ma'lumot yo'q</div>
          )}
        </div>
      </div>
    </div>
  )
}
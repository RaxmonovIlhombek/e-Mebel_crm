import { useState, useEffect, useCallback } from 'react'
import { exportBeautifulExcel } from '@/utils/excelExport'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  Download, RefreshCw, ChevronLeft, ChevronRight,
  CreditCard, Banknote, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, XCircle, Filter, Plus, Trash2, PieChart, Activity
} from 'lucide-react'
import { Spinner, Badge, SearchInput, Btn, SLabel, Pagination, Modal } from '@/components/UI'
import { clsx } from 'clsx'

const fmt     = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtDate = d => d || '—'

// ── Kichik karta ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, growth, loading }) {
  const colors = {
    green:  { bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.2)', icon: '#16a34a', glow: 'rgba(22, 163, 74, 0.4)' },
    red:    { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.2)', icon: '#dc2626', glow: 'rgba(220, 38, 38, 0.4)' },
    blue:   { bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.2)', icon: '#2563eb', glow: 'rgba(37, 99, 235, 0.4)' },
    orange: { bg: 'rgba(234, 88, 12, 0.1)', border: 'rgba(234, 88, 12, 0.2)', icon: '#ea580c', glow: 'rgba(234, 88, 12, 0.4)' },
    purple: { bg: 'rgba(147, 51, 234, 0.1)', border: 'rgba(147, 51, 234, 0.2)', icon: '#9333ea', glow: 'rgba(147, 51, 234, 0.4)' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className="glass-card" style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: 20,
      padding: '24px',
      border: `1px solid ${c.border}`,
      boxShadow: `0 8px 32px -4px ${c.glow}15`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
      gap: 15,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ 
        position: 'absolute', top: -20, right: -20, width: 80, height: 80, 
        borderRadius: '50%', background: c.glow, filter: 'blur(40px)', opacity: 0.1 
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: c.bg, border: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${c.glow}20`
        }}>
          <Icon size={24} style={{ color: c.icon }}/>
        </div>
        {growth !== undefined && (
          <div style={{
            padding: '4px 8px', borderRadius: 20,
            fontSize: 12, fontWeight: 700,
            background: growth >= 0 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            color: growth >= 0 ? '#16a34a' : '#dc2626',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            {growth >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
            {Math.abs(growth)}%
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {loading
          ? <div style={{ height: 32, background: '#f1f5f9', borderRadius: 8, width: '80%', animation: 'shimmer 2s infinite' }}/>
          : <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
              {value}
            </div>
        }
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Mini grafik (bar) ─────────────────────────────────────────────────────────
function MiniBarChart({ data, color = 'var(--accent)' }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0',
            height: `${Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0)}px`,
            background: i === data.length - 1 ? color : `${color}55`,
            transition: 'height .4s ease',
            minHeight: d.value > 0 ? 4 : 0,
          }}/>
          {data.length <= 12 && (
            <div style={{ fontSize: 8, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
              {d.label.slice(-3)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── To'lov usuli badge ────────────────────────────────────────────────────────
const METHOD_LABELS = { cash: '💵 Naqd', card: '💳 Karta', transfer: '🏦 Bank', other: '📋 Boshqa' }
const EXPENSE_CATEGORIES = {
  salary: 'Oylik (Ish haqi)', rent: 'Ijara', materials: 'Xomashyo (Materiallar)',
  marketing: 'Reklama / Marketing', transport: 'Logistika / Transport',
  utilities: 'Kommunal to\'lovlar', other: 'Boshqa',
}
const METHOD_COLORS = {
  cash:     { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
  card:     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  transfer: { bg: '#faf5ff', color: '#9333ea', border: '#d8b4fe' },
  other:    { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}
function MethodBadge({ method }) {
  const c = METHOD_COLORS[method] || METHOD_COLORS.other
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {METHOD_LABELS[method] || method}
    </span>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color,
        borderRadius: 3, transition: 'width .4s ease',
      }}/>
    </div>
  )
}

// ── Excel eksport ─────────────────────────────────────────────────────────────
async function exportOrdersToExcel(orders) {
  const data = orders.map(o => ({
    'Raqam':          o.order_number || '—',
    'Mijoz':          o.client_name  || '—',
    'Menejer':        o.manager_name || '—',
    'Holat':          ({new:'Yangi',pending:'Jarayonda',production:'Ishlab chiqarishda',
                        ready:'Tayyor',delivered:'Yetkazildi',completed:'Yakunlandi',cancelled:'Bekor'}[o.status] || o.status),
    "To'lov holati":  ({unpaid:"To'lanmagan",partial:'Qisman',paid:"To'liq"}[o.payment_status] || o.payment_status),
    'Jami summa':     Number(o.total_amount  || 0),
    "To'langan":      Number(o.paid_amount   || 0),
    'Qarz':           Number(o.remaining_amount || 0),
    'Chegirma (%)':   o.discount || 0,
    'Manzil':         o.full_delivery_address || '—',
    'Yaratilgan':     o.created_at ? new Date(o.created_at).toLocaleDateString('uz-UZ') : '—',
    'Izoh':           o.notes || '—',
  }))
  await exportBeautifulExcel('emebel-buyurtmalar', [
    {
      name: 'Buyurtmalar',
      columns: [
        { header: 'Raqam',          key: 'Raqam'          },
        { header: 'Mijoz',          key: 'Mijoz'          },
        { header: 'Menejer',        key: 'Menejer'        },
        { header: 'Holat',          key: 'Holat'          },
        { header: "To'lov holati",  key: "To'lov holati"  },
        { header: 'Jami summa',     key: 'Jami summa'     },
        { header: "To'langan",      key: "To'langan"      },
        { header: 'Qarz',           key: 'Qarz'           },
        { header: 'Chegirma (%)',   key: 'Chegirma (%)'   },
        { header: 'Manzil',         key: 'Manzil'         },
        { header: 'Yaratilgan',     key: 'Yaratilgan'     },
        { header: 'Izoh',           key: 'Izoh'           },
      ],
      data,
    }
  ])
}

async function exportPaymentsToExcel(payments, summary) {
  const payData = payments.map(p => ({
    'Sana':             p.created_at || '—',
    'Buyurtma':         p.order_number ? '#' + p.order_number : '—',
    'Mijoz':            p.client_name || '—',
    "Summa (so'm)":     Number(p.amount || 0),
    "To'lov turi":      (METHOD_LABELS[p.method] || p.method || '—'),
    'Qabul qildi':      p.received_by || '—',
    'Izoh':             p.note || '—',
  }))

  const r = summary?.revenue || {}
  const d = summary?.debt    || {}
  const o = summary?.orders  || {}

  await exportBeautifulExcel('emebel-moliya', [
    {
      name: 'Xulosa',
      summary: [
        ['e-Mebel CRM — Moliyaviy Hisobot'],
        ['Tuzilgan:', new Date().toLocaleDateString('uz-UZ')],
        [],
        ["Ko'rsatkich", 'Qiymat'],
        ['Jami tushum',          r.total      || 0],
        ['Bu oy tushum',         r.month      || 0],
        ["O'sish (%)",           r.growth     || 0],
        ['Jami qarz',            d.total      || 0],
        ['Kechikkan qarz',       d.overdue    || 0],
        ['Bu oy buyurtmalar',    o.month_count || 0],
      ],
      columns: [],
      data: [],
    },
    {
      name: "To'lovlar",
      columns: [
        { header: 'Sana',           key: 'Sana'           },
        { header: 'Buyurtma',       key: 'Buyurtma'       },
        { header: 'Mijoz',          key: 'Mijoz'          },
        { header: "Summa (so'm)",   key: "Summa (so'm)"   },
        { header: "To'lov turi",    key: "To'lov turi"    },
        { header: 'Qabul qildi',    key: 'Qabul qildi'    },
        { header: 'Izoh',           key: 'Izoh'           },
      ],
      data: payData,
    }
  ])
}


// ── Asosiy komponent ──────────────────────────────────────────────────────────
export default function Finance() {
  const { toast } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tab, setTab]           = useState(searchParams.get('tab') || 'overview')  // overview | payments | debts
  const [summary, setSummary]   = useState(null)
  const [chart, setChart]       = useState([])
  const [chartPeriod, setChartPeriod] = useState('month')
  const [payments, setPayments] = useState([])
  const [payMeta, setPayMeta]   = useState({ total_amount: 0, count: 0 })
  const [debts, setDebts]       = useState([])
  const [debtMeta, setDebtMeta] = useState({ total_debt: 0, count: 0 })
  const [expenses, setExpenses] = useState([])
  const [expMeta, setExpMeta]   = useState({ total_sum: 0, count: 0 })

  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingPay, setLoadingPay]         = useState(false)
  const [loadingDebts, setLoadingDebts]     = useState(false)
  const [loadingExp, setLoadingExp]         = useState(false)
  const [exporting, setExporting]           = useState(false)

  // Filterlar
  const [payFilter, setPayFilter] = useState({ date_from: '', date_to: '', method: '', search: '', page: 1 })
  const [debtFilter, setDebtFilter] = useState({ filter: 'all', search: '', page: 1 })
  const [expFilter, setExpFilter]   = useState({ date_from: '', date_to: '', category: '', search: '', page: 1 })

  // Modal holati
  const [expModal, setExpModal] = useState(false)
  const [expForm, setExpForm]   = useState({ amount: '', category: 'other', note: '', date: new Date().toISOString().slice(0, 10) })
  const [savingExp, setSavingExp] = useState(false)


  // ── Summary & Chart Birlashtirilgan va Tog'rilangan ──────────────────────────
const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const resSum = await api.financeSummary();
      const resChart = await api.financeChart(chartPeriod);

      // MA'LUMOTNI QIDIRISH: Obyektning o'zi yoki .data ichidan
      const s = resSum?.data || resSum || {};
      const c = resChart?.data || resChart || {};

      const mappedSummary = {
        revenue: {
          total: s.revenue?.total ?? s.total_revenue ?? 0,
          month: s.revenue?.month ?? s.month_revenue ?? 0,
          year: s.revenue?.year ?? s.year_revenue ?? 0,
          today: s.revenue?.today ?? s.today_revenue ?? 0,
          prev_month: s.revenue?.prev_month ?? s.prev_month_revenue ?? 0,
          growth: s.revenue?.growth ?? s.revenue_growth ?? 0,
        },
        debt: {
          total: s.debt?.total ?? s.total_debt ?? 0,
          count: s.debt?.count ?? (Number(s.unpaid_orders || 0) + Number(s.partial_orders || 0)) ?? 0,
          overdue: s.debt?.overdue ?? s.overdue_amount ?? 0,
          overdue_count: s.debt?.overdue_count ?? s.overdue_count ?? 0,
        },
        orders: {
          month_count: s.orders?.month_count ?? s.total_orders ?? 0,
          month_sum: s.orders?.month_sum ?? s.month_revenue ?? 0,
          completed: s.orders?.completed ?? s.paid_orders ?? 0,
          cancelled: s.orders?.cancelled ?? s.cancelled_orders ?? 0,
          avg_amount: s.orders?.avg_amount ?? (s.total_orders > 0 ? (s.total_revenue / s.total_orders) : 0),
        },
        method_breakdown: (s.method_breakdown || s.payment_methods || []).map(m => ({
          method: m.method,
          total: m.total || 0,
          count: m.count || 0
        })),
        expenses: {
          total: s.expenses?.total ?? 0,
          month: s.expenses?.month ?? 0,
          breakdown: s.expenses?.breakdown || []
        },
        net_profit: {
          total: s.net_profit?.total ?? 0,
          month: s.net_profit?.month ?? 0,
          growth: s.net_profit?.growth ?? 0
        }
      };

      // Grafik uchun: ch.chart yoki ch yoki ch.results ichidan qidiramize
      const rawChart = Array.isArray(c) ? c : (c.chart || []);
      const mappedChart = rawChart.map(item => ({
        ...item,
        value: Number(item.value || item.revenue || 0),
        label: item.label || item.month || item.date || ''
      }));

      setSummary(mappedSummary);
      setChart(mappedChart);

    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoadingSummary(false);
    }
  }, [chartPeriod, api, toast]);
  // ── To'lovlar ────────────────────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    setLoadingPay(true)
    try {
      const res = await api.financePayments({
        page: payFilter.page,
        date_from: payFilter.date_from,
        date_to:   payFilter.date_to,
        method:    payFilter.method,
        search:    payFilter.search,
      })
      setPayments(res.results || [])
      setPayMeta({ total_amount: res.total_amount || 0, count: res.count || 0 })
    } catch (e) { toast(e.message, 'error') }
    finally { setLoadingPay(false) }
  }, [payFilter])

  // ── Qarzlar ──────────────────────────────────────────────────────────────
  const loadDebts = useCallback(async () => {
    setLoadingDebts(true)
    try {
      const res = await api.financeDebts({
        filter: debtFilter.filter,
        search: debtFilter.search,
        page:   debtFilter.page,
      })
      setDebts(res.results || [])
      setDebtMeta({ total_debt: res.total_debt || 0, count: res.count || 0 })
    } catch (e) { toast(e.message, 'error') }
    finally { setLoadingDebts(false) }
  }, [debtFilter])

  // ── Xarajatlar ───────────────────────────────────────────────────────────
  const loadExpenses = useCallback(async () => {
    setLoadingExp(true)
    try {
      const res = await api.financeExpenses({
        page: expFilter.page,
        date_from: expFilter.date_from,
        date_to:   expFilter.date_to,
        category:  expFilter.category,
        search:    expFilter.search,
      })
      setExpenses(res.results || [])
      setExpMeta({ total_sum: res.total_sum || 0, count: res.count || 0 })
    } catch (e) { toast(e.message, 'error') }
    finally { setLoadingExp(false) }
  }, [expFilter])

  useEffect(() => {
    const t = searchParams.get('tab') || 'overview'
    if (t !== tab) setTab(t)
  }, [searchParams])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => { if (tab === 'payments') loadPayments() }, [tab, loadPayments])
  useEffect(() => { if (tab === 'debts') loadDebts() }, [tab, loadDebts])
  useEffect(() => { if (tab === 'expenses') loadExpenses() }, [tab, loadExpenses])

  const handleExport = async () => {
    setExporting(true)
    try {
      // Barcha to'lovlarni olish
      const data = await api.financePayments({
        per_page: 1000,
        date_from: payFilter.date_from,
        date_to:   payFilter.date_to,
        method:    payFilter.method,
        search:    payFilter.search,
      })
      await exportPaymentsToExcel(data.results || [], summary)
      toast('Excel yuklab olindi ✅', 'success')
    } catch (e) { toast('Xato: ' + e.message, 'error') }
    finally { setExporting(false) }
  }

  const r = summary?.revenue || {}
  const d = summary?.debt    || {}
  const o = summary?.orders  || {}
  const e = summary?.expenses || {}
  const np = summary?.net_profit || {}

  // ── TABS ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview', label: '📊 Umumiy' },
    { id: 'payments', label: "💵 To'lovlar" },
    { id: 'debts',    label: '⚠️ Qarzlar' },
    { id: 'expenses', label: '💸 Xarajatlar' },
  ]

  return (
    <div style={{ animation: 'fadeIn .3s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.4px', marginBottom: 4 }}>
            Moliya
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Tushum · To'lovlar · Qarzlar · Hisobotlar
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={13}/>} onClick={loadSummary}>
            Yangilash
          </Btn>
          <Btn size="sm" icon={<Download size={13}/>}
            loading={exporting} onClick={handleExport}>
            Excel
          </Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--surface2)', padding: 4, borderRadius: 12,
        width: 'fit-content', border: '1px solid var(--border)',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, transition: 'all .15s',
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--text3)',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            <StatCard icon={TrendingUp}  label="Sof foyda (Bu oy)" value={`${fmt(np.month)} so'm`}
              color="green"  growth={np.growth} loading={loadingSummary}
              sub={`Tushum: ${fmt(r.month)} | Xarajat: ${fmt(e.month)}`}/>
            <StatCard icon={DollarSign}  label="Jami Tushum" value={`${fmt(r.total)} so'm`}
              color="blue"   loading={loadingSummary} sub={`Bu yil: ${fmt(r.year)} so'm`}/>
            <StatCard icon={PieChart} label="Umumiy Xarajat" value={`${fmt(e.total)} so'm`}
              color="orange" loading={loadingSummary} sub={`Bu oy: ${fmt(e.month)} so'm`}/>
            <StatCard icon={AlertTriangle} label="Jami Qarz" value={`${fmt(d.total)} so'm`}
              color="red"    loading={loadingSummary} sub={`${d.count} ta buyurtma`}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            {/* Grafik */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 22,
              border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Tushum grafigi</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {chart.length} ta nuqta
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['week','month','year'].map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)} style={{
                      padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'all .15s',
                      background: chartPeriod === p ? 'var(--accent)' : '#f3f4f6',
                      color:      chartPeriod === p ? '#fff' : 'var(--text3)',
                    }}>
                      {p === 'week' ? '7 kun' : p === 'month' ? '30 kun' : 'Yil'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Full bar chart */}
              {chart.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
                    {chart.map((d, i) => {
                      const max = Math.max(...chart.map(x => x.value), 1)
                      const h   = Math.max((d.value / max) * 110, d.value > 0 ? 4 : 0)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 4, cursor: 'default' }}
                          title={`${d.label}: ${fmt(d.value)} so'm`}>
                          <div style={{
                            width: '100%', borderRadius: '3px 3px 0 0',
                            height: h, minHeight: d.value > 0 ? 4 : 0,
                            background: i === chart.length - 1
                              ? 'var(--accent)'
                              : 'rgba(249,115,22,0.35)',
                            transition: 'height .5s ease',
                          }}/>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>
                    <span>{chart[0]?.label}</span>
                    <span>{chart[Math.floor(chart.length/2)]?.label}</span>
                    <span>{chart[chart.length-1]?.label}</span>
                  </div>
                </div>
              ) : <div style={{ height: 120, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
                Ma'lumot yo'q
              </div>}
            </div>

            {/* To'lov usullari */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 22,
              border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>
                Bu oy to'lov usullari
              </div>
              {loadingSummary
                ? <Spinner/>
                : summary?.method_breakdown?.length
                  ? summary.method_breakdown.map((m, i) => {
                      const totalM = summary.method_breakdown.reduce((s, x) => s + x.total, 0)
                      const pct = totalM > 0 ? Math.round(m.total / totalM * 100) : 0
                      return (
                        <div key={i} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 12, marginBottom: 5 }}>
                            <span style={{ fontWeight: 600 }}>{METHOD_LABELS[m.method] || m.method}</span>
                            <span style={{ color: 'var(--text3)' }}>{pct}% · {m.count} ta</span>
                          </div>
                          <ProgressBar value={m.total} max={totalM}
                            color={m.method === 'cash' ? '#16a34a' : m.method === 'card' ? '#2563eb' : 'var(--accent)'}/>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                            {fmt(m.total)} so'm
                          </div>
                        </div>
                      )
                    })
                  : <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>
                      Bu oy to'lov yo'q
                    </div>
              }
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {/* Tushum vs Xarajat (Net Profit) */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 22,
              border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>Sof foyda tahlili</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Joriy oy ko'rsatkichlari</div>
                </div>
                <div style={{ 
                  background: np.month >= 0 ? '#f0fdf4' : '#fef2f2', 
                  color: np.month >= 0 ? '#16a34a' : '#dc2626',
                  padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13 
                }}>
                  Foyda marjasi: {r.month > 0 ? Math.round((np.month / r.month) * 100) : 0}%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Tushum</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>{fmt(r.month)}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Xarajatlar</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>{fmt(e.month)}</div>
                </div>
                <div style={{ padding: 12, background: np.month >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: np.month >= 0 ? '#15803d' : '#991b1b', marginBottom: 4 }}>Sof Foyda</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: np.month >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(np.month)}</div>
                </div>
              </div>

              <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                   <span style={{fontWeight: 600}}>Tushum nisbati</span>
                 </div>
                 <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${r.month > 0 ? (r.month / (r.month+e.month))*100 : 50}%`, background: '#2563eb' }} title="Tushum" />
                    <div style={{ width: `${e.month > 0 ? (e.month / (r.month+e.month))*100 : 50}%`, background: '#f59e0b' }} title="Xarajat" />
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 4}}><div style={{width:8,height:8,borderRadius:2,background:'#2563eb'}}/> Tushum</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 4}}><div style={{width:8,height:8,borderRadius:2,background:'#f59e0b'}}/> Xarajat</div>
                 </div>
              </div>
            </div>

            {/* To'lov usullari */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 22,
              border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>
                Bu oy xarajatlar tarkibi
              </div>
              {loadingSummary
                ? <Spinner/>
                : e.breakdown?.length
                  ? e.breakdown.map((m, i) => {
                      const totalM = e.breakdown.reduce((s, x) => s + x.total, 0)
                      const pct = totalM > 0 ? Math.round(m.total / totalM * 100) : 0
                      return (
                        <div key={i} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 12, marginBottom: 5 }}>
                            <span style={{ fontWeight: 600 }}>{EXPENSE_CATEGORIES[m.category] || m.category}</span>
                            <span style={{ color: 'var(--text3)' }}>{pct}% · {m.count} ta</span>
                          </div>
                          <ProgressBar value={m.total} max={totalM} color="#f59e0b"/>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                            {fmt(m.total)} so'm
                          </div>
                        </div>
                      )
                    })
                  : <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>
                      Xarajatlar yo'q
                    </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── TO'LOVLAR ── */}
      {tab === 'payments' && (
        <div>
          {/* Filter panel */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: '14px 18px',
            border: '1px solid var(--border)', marginBottom: 14,
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Dan</div>
              <input type="date" value={payFilter.date_from}
                onChange={e => setPayFilter(f => ({...f, date_from: e.target.value, page: 1}))}
                style={{ padding: '8px 10px', border: '1.5px solid var(--border2)',
                  borderRadius: 8, fontSize: 13 }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Gacha</div>
              <input type="date" value={payFilter.date_to}
                onChange={e => setPayFilter(f => ({...f, date_to: e.target.value, page: 1}))}
                style={{ padding: '8px 10px', border: '1.5px solid var(--border2)',
                  borderRadius: 8, fontSize: 13 }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Usul</div>
              <select value={payFilter.method}
                onChange={e => setPayFilter(f => ({...f, method: e.target.value, page: 1}))}
                style={{ padding: '8px 10px', border: '1.5px solid var(--border2)',
                  borderRadius: 8, fontSize: 13 }}>
                <option value="">Barchasi</option>
                <option value="cash">💵 Naqd</option>
                <option value="card">💳 Karta</option>
                <option value="transfer">🏦 Bank</option>
                <option value="other">📋 Boshqa</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Qidiruv</div>
              <input placeholder="Buyurtma raqami yoki mijoz..."
                value={payFilter.search}
                onChange={e => setPayFilter(f => ({...f, search: e.target.value, page: 1}))}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border2)',
                  borderRadius: 8, fontSize: 13 }}/>
            </div>
            <Btn size="sm" onClick={loadPayments}>Qidirish</Btn>
            <Btn size="sm" variant="ghost" onClick={() => {
              setPayFilter({ date_from:'', date_to:'', method:'', search:'', page: 1 })
            }}>Tozalash</Btn>
          </div>

          {/* Jami */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderRadius: 10, marginBottom: 12,
            background: '#f0fdf4', border: '1px solid #86efac',
          }}>
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
              Jami: {payMeta.count} ta to'lov
            </span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#15803d' }}>
              {fmt(payMeta.total_amount)} so'm
            </span>
          </div>

          {/* Jadval */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Sana', 'Buyurtma', 'Mijoz', 'Summa', 'Usul', 'Qabul qildi', 'Izoh'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left',
                      fontWeight: 700, color: '#374151', fontSize: 12,
                      borderBottom: '2px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingPay
                  ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center' }}><Spinner/></td></tr>
                  : payments.length === 0
                    ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
                        To'lovlar topilmadi
                      </td></tr>
                    : payments.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb',
                        borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '9px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{p.created_at}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--accent)' }}>#{p.order_number}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600 }}>{p.client_name}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>
                          +{fmt(p.amount)} so'm
                        </td>
                        <td style={{ padding: '9px 14px' }}><MethodBadge method={p.method}/></td>
                        <td style={{ padding: '9px 14px', color: 'var(--text3)' }}>{p.received_by}</td>
                        <td style={{ padding: '9px 14px', color: 'var(--text3)', fontSize: 12 }}>{p.note || '—'}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          <Pagination total={payMeta.count} current={payFilter.page} onChange={p => setPayFilter(f => ({...f, page: p}))} />
        </div>
      )}

      {/* ── QARZLAR ── */}
      {tab === 'debts' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all','Barchasi'],['overdue','Kechikkan'],['partial','Qisman']].map(([v,l]) => (
                <button key={v} onClick={() => setDebtFilter(f => ({...f, filter: v, page: 1}))} style={{
                  padding: '8px 16px', borderRadius: 9, outline: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all .15s',
                  background: debtFilter.filter === v ? 'var(--accent)' : '#fff',
                  color: debtFilter.filter === v ? '#fff' : 'var(--text3)',
                  border: `1.5px solid ${debtFilter.filter === v ? 'var(--accent)' : 'var(--border2)'}`,
                }}>{l}</button>
              ))}
            </div>
            <input placeholder="Buyurtma yoki mijoz qidiring..."
              value={debtFilter.search}
              onChange={e => setDebtFilter(f => ({...f, search: e.target.value, page: 1}))}
              style={{ flex: 1, minWidth: 200, padding: '8px 12px',
                border: '1.5px solid var(--border2)', borderRadius: 9, fontSize: 13 }}/>
            <Btn size="sm" onClick={loadDebts}>Qidirish</Btn>
          </div>

          {/* Jami qarz */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 18px', borderRadius: 12, marginBottom: 14,
            background: '#fef2f2', border: '1.5px solid #fecaca',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} style={{ color: '#dc2626' }}/>
              <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>
                Jami qarz: {debtMeta.count} ta buyurtma
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#dc2626' }}>
              {fmt(debtMeta.total_debt)} so'm
            </span>
          </div>

          {/* Qarzlar jadval */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {loadingDebts
              ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner/></div>
              : debts.length === 0
                ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    Qarzlar yo'q 🎉
                  </div>
                : debts.map((d, i) => (
                  <div key={d.id} style={{
                    padding: '14px 18px', borderBottom: i < debts.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: d.overdue ? '#fff9f9' : '#fff',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '6px 14px', alignItems: 'center' }}>
                      {/* Buyurtma raqami */}
                      <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 13 }}>
                        #{d.order_number}
                      </span>
                      {/* Mijoz */}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{d.client_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {d.client_phone}
                          {d.manager !== '—' && ` · Menejer: ${d.manager}`}
                        </div>
                      </div>
                      {/* Holat */}
                      <div style={{ textAlign: 'right' }}>
                        {d.overdue && (
                          <div style={{
                            fontSize: 11, fontWeight: 700, color: '#dc2626',
                            background: '#fef2f2', padding: '2px 8px', borderRadius: 6,
                            display: 'inline-block', marginBottom: 4,
                          }}>
                            ⚠️ {d.days_overdue} kun kechikkan
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {d.delivery_date ? `Yetkazish: ${d.delivery_date}` : 'Sana belgilanmagan'}
                        </div>
                      </div>

                      {/* Progress qatori — 3 ustunni egallaydi */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                          <span>To'langan: {fmt(d.paid_amount)} so'm ({d.paid_pct}%)</span>
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>
                            Qarz: {fmt(d.debt)} so'm
                          </span>
                        </div>
                        <ProgressBar
                          value={d.paid_amount} max={d.total_amount}
                          color={d.paid_pct >= 75 ? '#16a34a' : d.paid_pct >= 40 ? '#f59e0b' : '#ef4444'}
                        />
                      </div>
                    </div>

                    {/* Jami */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Jami summa</div>
                      <div style={{ fontSize: 16, fontWeight: 900 }}>{fmt(d.total_amount)} so'm</div>
                    </div>
                  </div>
                ))
            }
          </div>
          <Pagination total={debtMeta.count} current={debtFilter.page || 1} onChange={p => setDebtFilter(f => ({...f, page: p}))} />
        </div>
      )}

      {/* ── XARAJATLAR ── */}
      {tab === 'expenses' && (
        <div>
          {/* Header & Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Dan</div>
              <input type="date" value={expFilter.date_from} onChange={e => setExpFilter(f => ({...f, date_from: e.target.value, page: 1}))}
                style={{ padding: '8px 10px', border: '1.5px solid var(--border2)', borderRadius: 8, fontSize: 13 }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Gacha</div>
              <input type="date" value={expFilter.date_to} onChange={e => setExpFilter(f => ({...f, date_to: e.target.value, page: 1}))}
                style={{ padding: '8px 10px', border: '1.5px solid var(--border2)', borderRadius: 8, fontSize: 13 }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Kategoriya</div>
              <select value={expFilter.category} onChange={e => setExpFilter(f => ({...f, category: e.target.value, page: 1}))}
                style={{ padding: '8px 10px', border: '1.5px solid var(--border2)', borderRadius: 8, fontSize: 13 }}>
                <option value="">Barchasi</option>
                {Object.entries(EXPENSE_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Qidiruv</div>
              <input placeholder="Izoh..." value={expFilter.search} onChange={e => setExpFilter(f => ({...f, search: e.target.value, page: 1}))}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border2)', borderRadius: 8, fontSize: 13 }}/>
            </div>
            <Btn size="sm" onClick={loadExpenses}>Qidirish</Btn>
            <Btn size="sm" variant="primary" icon={<Plus size={14}/>} onClick={() => setExpModal(true)}>
              Xarajat qo'shish
            </Btn>
          </div>

          {/* Jami */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 18px', borderRadius: 12, marginBottom: 14,
            background: '#fff7ed', border: '1.5px solid #ffedd5',
          }}>
            <span style={{ fontSize: 13, color: '#c2410c', fontWeight: 700 }}>
              Jami xarajat: {expMeta.count} ta yozuv
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#ea580c' }}>
               {fmt(expMeta.total_sum)} so'm
            </span>
          </div>

          {/* Xarajatlar jadvali */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
               <thead>
                 <tr style={{ background: '#f8fafc' }}>
                   {['Sana', 'Kategoriya', 'Summa', 'Izoh', 'Bajaruvchi', ''].map(h => (
                     <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12, borderBottom: '2px solid var(--border)' }}>{h}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                  {loadingExp 
                    ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}><Spinner/></td></tr>
                    : expenses.length === 0
                      ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Xarajatlar topilmadi.</td></tr>
                      : expenses.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{e.date}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>{e.category_display}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#ea580c', whiteSpace: 'nowrap' }}>- {fmt(e.amount)} so'm</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text3)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.note || '—'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text3)' }}>{e.performed_by_name || e.performed_by_username || 'Tizim'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                             <button onClick={async () => {
                               if(!confirm('Haqiqatan ham o`chirasizmi?')) return;
                               try { await api.financeExpenseDelete(e.id); toast('O`chirildi', 'success'); loadExpenses(); loadSummary(); } 
                               catch(err) { toast(err.message, 'error'); }
                             }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))
                  }
               </tbody>
            </table>
          </div>
          <Pagination total={expMeta.count} current={expFilter.page || 1} onChange={p => setExpFilter(f => ({...f, page: p}))} />
        </div>
      )}

      {/* Xarajat Qo'shish Modali */}
      {expModal && (
        <Modal onClose={() => setExpModal(false)} title="💸 Yangi Xarajat" maxWidth={450}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <SLabel>Kategoriya *</SLabel>
                <select value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border2)' }}>
                  {Object.entries(EXPENSE_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <SLabel>Summa (so'm) *</SLabel>
                <input type="number" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border2)' }} placeholder="Masalan: 500000" />
              </div>
              <div>
                <SLabel>Sana</SLabel>
                <input type="date" value={expForm.date} onChange={e => setExpForm({...expForm, date: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border2)' }} />
              </div>
              <div>
                <SLabel>Izoh</SLabel>
                <textarea value={expForm.note} onChange={e => setExpForm({...expForm, note: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border2)', minHeight: 80 }} placeholder="Xarajat sababi yoki izoh..."/>
              </div>
              <Btn variant="primary" loading={savingExp} style={{ marginTop: 10 }} onClick={async () => {
                 if(!expForm.amount) return toast('Summani kiriting', 'error');
                 setSavingExp(true);
                 try {
                   await api.financeExpenseCreate(expForm);
                   toast('Saqlandi ✅', 'success');
                   setExpModal(false);
                   setExpForm({ amount: '', category: 'other', note: '', date: new Date().toISOString().slice(0, 10) });
                   loadExpenses();
                   loadSummary();
                 } catch(e) { toast(e.message, 'error'); }
                 finally { setSavingExp(false); }
              }}>Saqlash</Btn>
           </div>
        </Modal>
      )}

    </div>
  )
}
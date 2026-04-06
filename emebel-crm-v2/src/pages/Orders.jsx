import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { useFetch } from '@/hooks/useFetch'
import {
  Btn, Badge, Table, Modal, Input, Select, Textarea,
  SearchInput, PageHeader, Card, Spinner, SLabel, iStyle, Pagination,
} from '@/components/UI'
import {
  Plus, XCircle, Download, AlertTriangle, FileText,
  Printer, Receipt, Clock, LayoutGrid, List,
} from 'lucide-react'
import { printOrderReceipt, printOrderInvoice } from '@/components/OrderPDF'
import { DeliveryAddress } from '@/components/DeliveryAddress'
import ReactSelect from 'react-select'

const STATUS_ORDER = ['new', 'pending', 'production', 'ready', 'delivered', 'completed', 'cancelled']
const STATUS_LABELS = {
  new: 'Yangi', pending: 'Jarayonda', production: 'Ishlab chiqarishda',
  ready: 'Tayyor', delivered: 'Yetkazildi', completed: 'Yakunlandi', cancelled: 'Bekor',
}
const STATUS_ICONS = {
  new: '🆕', pending: '⏳', production: '🔨', ready: '✅',
  delivered: '🚚', completed: '🏁', cancelled: '❌',
}
const STATUS_COLORS = {
  new: { bg: '#eff6ff', border: '#93c5fd', header: '#3b82f6', text: '#1d4ed8' },
  pending: { bg: '#fefce8', border: '#fde68a', header: '#eab308', text: '#a16207' },
  production: { bg: '#fff7ed', border: '#fed7aa', header: '#f97316', text: '#c2410c' },
  ready: { bg: '#f0fdf4', border: '#86efac', header: '#22c55e', text: '#15803d' },
  delivered: { bg: '#ecfdf5', border: '#6ee7b7', header: '#10b981', text: '#047857' },
  completed: { bg: '#f8fafc', border: '#cbd5e1', header: '#94a3b8', text: '#475569' },
  cancelled: { bg: '#fef2f2', border: '#fca5a5', header: '#ef4444', text: '#b91c1c' },
}

const fmt = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ') : '—'
const fmtDT = d => d ? new Date(d).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/* ═══════════════════════════════════════════════════════════════════════════
   ASOSIY SAHIFA
═══════════════════════════════════════════════════════════════════════════ */
export default function Orders() {
  const { toast, user, addNotif } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('orders_view') || 'list')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const isWorker = user?.role === 'worker'

  const load = useCallback(async () => {
    setLoading(true); setOrders([])
    try {
      const res = await api.orders({ status: statusFilter, search, page })
      setOrders(res.results || [])
      setTotal(res.count || 0)
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [search, statusFilter, page])

  useEffect(() => {
    const s = searchParams.get('status') || ''
    if (s !== statusFilter) setStatusFilter(s)
  }, [searchParams])

  useEffect(() => { setPage(1) }, [search, statusFilter])
  useEffect(() => { load() }, [load])

  const switchView = (mode) => {
    setViewMode(mode)
    localStorage.setItem('orders_view', mode)
  }

  const COLS = [
    {
      key: 'order_number', label: 'Raqam',
      render: r => <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>#{r.order_number}</span>
    },
    {
      key: 'client_name', label: 'Mijoz',
      render: r => <span style={{ fontWeight: 600 }}>{r.client_name || '—'}</span>
    },
    !isWorker && {
      key: 'total_amount', label: 'Summa',
      render: r => <span style={{ fontWeight: 600 }}>{fmt(r.total_amount)} so'm</span>
    },
    { key: 'status', label: 'Holat', render: r => <Badge status={r.status} /> },
    !isWorker && { key: 'payment_status', label: "To'lov", render: r => <Badge status={r.payment_status} /> },
    {
      key: 'delivery_date', label: 'Yetkazish',
      render: r => <span style={{ color: 'var(--text3)', fontSize: 12 }}>{fmtDate(r.delivery_date)}</span>
    },
    {
      key: 'actions', label: '',
      render: r => (
        <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSelected(r) }}>Ko'rish</Btn>
      )
    },
  ].filter(Boolean)

  const KANBAN_STATUSES = ['new', 'pending', 'production', 'ready', 'delivered']

  return (
    <div>
      <PageHeader title="Buyurtmalar"
        subtitle={`Jami: ${total} ta`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 9, padding: 3, gap: 2 }}>
              {[['list', <List size={14} />], ['kanban', <LayoutGrid size={14} />]].map(([mode, icon]) => (
                <button key={mode} onClick={() => switchView(mode)}
                  title={mode === 'list' ? 'Jadval ko\'rinishi' : 'Kanban ko\'rinishi'}
                  style={{
                    padding: '6px 10px', border: 'none', borderRadius: 7, cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                    background: viewMode === mode ? '#fff' : 'transparent',
                    color: viewMode === mode ? 'var(--accent)' : 'var(--text3)',
                    boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
            <Btn icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Yangi buyurtma</Btn>
          </div>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Raqam, mijoz nomi..." />
        {viewMode === 'list' && (
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 200 }}>
            <option value="">Barcha holat</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
        )}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {['new', 'production', 'ready', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              style={{
                padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                border: statusFilter === s ? 'none' : '1px solid var(--border2)',
                cursor: 'pointer', transition: 'all .15s',
                background: statusFilter === s ? 'var(--accent)' : '#fff',
                color: statusFilter === s ? '#fff' : 'var(--text3)',
                boxShadow: statusFilter === s ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
              }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card><Spinner /></Card>
      ) : viewMode === 'list' ? (
        <Card>
          <Table columns={COLS} data={orders} onRow={r => setSelected(r)} emptyText="Buyurtmalar yo'q" />
          <Pagination total={total} current={page} onChange={setPage} />
        </Card>
      ) : (
        <>
          <KanbanBoard
            orders={orders}
            statuses={KANBAN_STATUSES}
            onSelect={setSelected}
            isWorker={isWorker}
            onStatusChange={async (orderId, newStatus) => {
              try {
                await api.orderStatusUpdate(orderId, newStatus)
                toast('Holat yangilandi ✅', 'success')
                load()
              } catch (e) { toast(e.message, 'error') }
            }}
          />
          <div style={{ marginTop: 20 }}>
            <Pagination total={total} current={page} onChange={setPage} />
          </div>
        </>
      )}

      {selected && (
        <OrderDetailModal orderId={selected.id} user={user} isWorker={isWorker}
          onClose={() => setSelected(null)} toast={toast} onReload={load} />
      )}
      {showNew && (
        <NewOrderModal onClose={() => setShowNew(false)} toast={toast} onReload={load} user={user} addNotif={addNotif} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   KANBAN BOARD
═══════════════════════════════════════════════════════════════════════════ */
function KanbanBoard({ orders, statuses, onSelect, onStatusChange }) {
  const [dragging, setDragging] = useState(null)  // { orderId, fromStatus }
  const [dragOver, setDragOver] = useState(null)  // status key
  const [moving, setMoving] = useState(null)  // orderId being moved

  const grouped = {}
  statuses.forEach(s => { grouped[s] = [] })
  orders.forEach(o => {
    if (grouped[o.status]) grouped[o.status].push(o)
    else grouped['new']?.push(o)
  })

  const handleDragStart = (e, order) => {
    setDragging({ orderId: order.id, fromStatus: order.status })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, toStatus) => {
    e.preventDefault()
    if (!dragging || dragging.fromStatus === toStatus) {
      setDragging(null); setDragOver(null); return
    }
    setMoving(dragging.orderId)
    await onStatusChange(dragging.orderId, toStatus)
    setDragging(null); setDragOver(null); setMoving(null)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${statuses.length}, minmax(220px, 1fr))`,
      gap: 12, overflowX: 'auto', paddingBottom: 8,
    }}>
      {statuses.map(status => {
        const c = STATUS_COLORS[status] || STATUS_COLORS.new
        const cards = grouped[status] || []
        const isOver = dragOver === status

        return (
          <div key={status}
            onDragOver={e => { e.preventDefault(); setDragOver(status) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, status)}
            style={{
              borderRadius: 14, border: `2px solid ${isOver ? c.header : c.border}`,
              background: isOver ? `${c.header}08` : c.bg,
              transition: 'all 0.15s', minHeight: 400,
              display: 'flex', flexDirection: 'column',
            }}>

            {/* Column header */}
            <div style={{
              padding: '12px 14px', borderBottom: `2px solid ${c.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderRadius: '12px 12px 0 0',
              background: `linear-gradient(135deg, ${c.header}18, ${c.header}08)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{STATUS_ICONS[status]}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: c.text }}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <span style={{
                background: c.header, color: '#fff',
                borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 700,
              }}>{cards.length}</span>
            </div>

            {/* Cards */}
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {cards.length === 0 && (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '20px 0',
                }}>
                  {isOver ? '📥 Bu yerga tashlang' : "Bo'sh"}
                </div>
              )}
              {cards.map(order => (
                <KanbanCard
                  key={order.id}
                  order={order}
                  color={c}
                  isWorker={isWorker}
                  dragging={dragging?.orderId === order.id}
                  moving={moving === order.id}
                  onDragStart={handleDragStart}
                  onDragEnd={() => { setDragging(null); setDragOver(null) }}
                  onClick={() => onSelect(order)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Kanban karta ── */
function KanbanCard({ order, color, dragging, moving, onDragStart, onDragEnd, onClick, isWorker }) {
  const debt = Number(order.remaining_amount || 0)
  const paid = Number(order.paid_amount || 0)
  const total = Number(order.total_amount || 0)
  const pct = total > 0 ? Math.round(paid / total * 100) : 0
  const isOverdue = order.delivery_date &&
    new Date(order.delivery_date) < new Date() &&
    !['delivered', 'completed', 'cancelled'].includes(order.status)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, order)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 11,
        border: `1px solid ${dragging ? color.header : '#e2e8f0'}`,
        padding: '12px 13px', cursor: 'grab',
        opacity: dragging ? 0.5 : moving ? 0.7 : 1,
        boxShadow: dragging ? `0 8px 24px ${color.header}30` : '0 1px 4px rgba(0,0,0,0.06)',
        transform: dragging ? 'rotate(2deg) scale(1.02)' : 'none',
        transition: 'all 0.15s', userSelect: 'none',
      }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 800, fontSize: 12 }}>
          #{order.order_number}
        </span>
        {!isWorker && <Badge status={order.payment_status} />}
      </div>

      {/* Mijoz */}
      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
        {order.client_name || '—'}
      </div>

      {/* Manager */}
      {order.manager_name && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
          👤 {order.manager_name}
        </div>
      )}

      {/* Mahsulotlar */}
      {order.items?.length > 0 && (
        <div style={{
          fontSize: 11, color: '#64748b', marginBottom: 8,
          background: '#f8fafc', borderRadius: 7, padding: '5px 8px',
          border: '1px solid #f1f5f9'
        }}>
          {order.items.slice(0, 2).map(it => it.product_name).join(', ')}
          {order.items.length > 2 && <span style={{ color: '#94a3b8' }}> +{order.items.length - 2}</span>}
        </div>
      )}

      {/* Summa */}
      {!isWorker && (
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>
          {fmt(total)} so'm
        </div>
      )}

      {/* To'lov progress */}
      {!isWorker && total > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 3 }}>
            <div style={{
              height: '100%', borderRadius: 10, width: `${pct}%`,
              background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#f97316,#fbbf24)',
              transition: 'width 0.4s'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
            <span>{fmt(paid)} so'm</span>
            {debt > 0 && <span style={{ color: '#ef4444' }}>Qarz: {fmt(debt)}</span>}
            {debt === 0 && <span style={{ color: '#22c55e' }}>✓ To'liq</span>}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        {order.delivery_date && (
          <span style={{
            fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600,
            color: isOverdue ? '#ef4444' : '#94a3b8',
          }}>
            {isOverdue ? '⚠️' : '📅'} {fmtDate(order.delivery_date)}
          </span>
        )}
        <span style={{ fontSize: 10, color: '#cbd5e1', marginLeft: 'auto' }}>
          {fmtDate(order.created_at)}
        </span>
      </div>

      {moving && (
        <div style={{ textAlign: 'center', fontSize: 11, color: color.text, marginTop: 6, fontWeight: 600 }}>
          ⏳ Ko'chirilmoqda...
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORDER DETAIL MODAL
═══════════════════════════════════════════════════════════════════════════ */
function OrderDetailModal({ orderId, onClose, toast, onReload, user }) {
  const isClient = user?.role === 'client'
  const isWorker = user?.role === 'worker'
  const { data: order, loading, error: fetchError, reload: reloadOrder } = useFetch(`/orders/${orderId}/`)
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', note: '' })
  const [savingPay, setSavingPay] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [showPayment, setShowPayment] = useState(false)

  const changeStatus = async (newStatus) => {
    if (changingStatus) return
    if (newStatus === 'cancelled' && !confirm("Buyurtmani bekor qilasizmi?")) return
    setChangingStatus(true)
    try {
      await api.orderStatusUpdate(orderId, newStatus)
      toast('Holat yangilandi', 'success')
      reloadOrder(); onReload()
    } catch (e) { toast(e.message, 'error') }
    finally { setChangingStatus(false) }
  }

  const remaining = Number(order?.total_amount || 0) - Number(order?.paid_amount || 0)
  const payAmt = Number(payForm.amount || 0)
  const payWarn = payAmt > 0 && payAmt > remaining
    ? `⚠️ Summa qolgan qarzdan (${fmt(remaining)} so'm) oshib ketmoqda!` : null

  const addPayment = async () => {
    if (!payForm.amount || payAmt <= 0) return toast("Summa kiriting", 'error')
    if (payAmt > remaining) return toast(`To'lov qolgan qarzdan oshib ketadi!`, 'error')
    setSavingPay(true)
    try {
      await api.paymentAdd(orderId, { amount: payAmt, method: payForm.method, note: payForm.note })
      toast("To'lov qo'shildi ✅", 'success')
      setPayForm({ amount: '', method: 'cash', note: '' })
      reloadOrder(); onReload()
    } catch (e) { toast(e.message, 'error') }
    finally { setSavingPay(false) }
  }

  const downloadContract = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const resp = await fetch(`/api/orders/${orderId}/contract/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}));
        throw new Error(d.error || "Yuklashda xatolik yuz berdi. (Auth xatosi bo'lishi mumkin)");
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Shartnoma_${order.order_number || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { toast(e.message, 'error') }
  }

  if (loading) return <Modal title="Buyurtma" onClose={onClose}><Spinner /></Modal>
  if (fetchError || !order) return (
    <Modal title="Buyurtma" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Buyurtmani yuklashda xato</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          {fetchError || "Ma'lumot topilmadi. Ruxsat yo'q yoki buyurtma mavjud emas."}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={reloadOrder}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)',
              color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit'
            }}>
            🔄 Qayta urinish
          </button>
          <button onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer',
              fontSize: 13, fontFamily: 'inherit'
            }}>
            Yopish
          </button>
        </div>
      </div>
    </Modal>
  )

  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const flowSteps = STATUS_ORDER.filter(s => s !== 'cancelled')

  return (
    <Modal title={`Buyurtma #${order.order_number}`} onClose={onClose} maxWidth={720}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn icon={<Receipt size={13} />} variant="ghost" size="sm"
              onClick={() => order && printOrderReceipt(order)}>Chek</Btn>
            <Btn icon={<Printer size={13} />} variant="ghost" size="sm"
              onClick={() => order && printOrderInvoice(order)}>Faktura</Btn>
            <button onClick={downloadContract}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff', color: '#374151',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              <FileText size={12} /> Shartnoma
            </button>
          </div>
          <Btn variant="ghost" onClick={onClose}>Yopish</Btn>
        </div>
      }
    >
      {showPayment && (
        <PaymentModal
          orderId={orderId}
          onClose={() => setShowPayment(false)}
          toast={toast}
        />
      )}
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {[['info', "📋 Ma'lumotlar"], ['timeline', '📍 Timeline']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              flex: 1, padding: '7px', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              background: activeTab === key ? '#fff' : 'transparent',
              color: activeTab === key ? 'var(--text)' : 'var(--text3)',
              boxShadow: activeTab === key ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && <>
        {/* Status stepper */}
        <div style={{ marginBottom: 20 }}>
          {!isClient ? (
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {flowSteps.map((s, i) => {
                const past = i < currentIdx; const curr = i === currentIdx
                return (
                  <button key={s} onClick={() => !curr && changeStatus(s)}
                    disabled={changingStatus || order.status === 'cancelled'}
                    style={{
                      flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: 700,
                      cursor: (curr || order.status === 'cancelled') ? 'default' : 'pointer',
                      border: 'none', transition: 'all .15s', textAlign: 'center',
                      borderRadius: i === 0 ? '8px 0 0 8px' : i === flowSteps.length - 1 ? '0 8px 8px 0' : 0,
                      background: curr ? 'var(--accent)' : past ? '#fed7aa' : 'var(--surface2)',
                      color: curr ? '#fff' : past ? '#c2410c' : 'var(--text3)'
                    }}>
                    {STATUS_LABELS[s]}
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge status={order.status} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
          )}

          {!isClient && order.status !== 'cancelled' && order.status !== 'completed' && (
            <Btn size="sm" variant="danger" icon={<XCircle size={13} />}
              onClick={() => changeStatus('cancelled')} loading={changingStatus}>
              Bekor qilish
            </Btn>
          )}
          {order.status === 'cancelled' && (
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>❌ Bekor qilingan</span>
          )}
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14 }}>
            <SLabel>Buyurtma ma'lumotlari</SLabel>
            {[
              ["Mijoz", order.client_name || '—'],
              ["Menejer", order.manager_name || '(belgilanmagan)'],
              ["Yetkazish", fmtDate(order.delivery_date)],
              ["Manzil", order.full_delivery_address || '—'],
              ["Izoh", order.notes || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13
              }}>
                <span style={{ color: 'var(--text3)' }}>{l}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: 200, wordBreak: 'break-word' }}>{v}</span>
              </div>
            ))}
          </div>
          {!isWorker && (
            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14 }}>
              <SLabel>To'lov</SLabel>
              {[
                ["Jami summa", `${fmt(order.total_amount)} so'm`, 'var(--text)'],
                ["To'langan", `${fmt(order.paid_amount)} so'm`, 'var(--green)'],
                ["Qolgan qarz", `${fmt(order.remaining_amount)} so'm`, 'var(--red)'],
                ["Chegirma", `${order.discount || 0}%`, 'var(--text2)'],
                ["To'lov holati", null, 'var(--text)'],
              ].map(([l, v, c]) => (
                <div key={l} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13
                }}>
                  <span style={{ color: 'var(--text3)' }}>{l}</span>
                  {v !== null ? <span style={{ fontWeight: 700, color: c }}>{v}</span> : <Badge status={order.payment_status} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        {!!order.items?.length && (
          <div style={{ marginBottom: 20 }}>
            <SLabel>Mahsulotlar</SLabel>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {order.items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', gap: 12, padding: '11px 14px', fontSize: 13,
                  background: i % 2 === 0 ? '#fff' : 'var(--surface2)',
                  borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{ flex: 1, fontWeight: 500 }}>{item.product_name}</span>
                  <span style={{ color: 'var(--text3)' }}>×{item.quantity}</span>
                  {!isWorker && <span style={{ color: 'var(--text2)', width: 100, textAlign: 'right' }}>{fmt(item.price)} so'm</span>}
                  {!isWorker && <span style={{ color: 'var(--accent)', fontWeight: 700, width: 110, textAlign: 'right' }}>{fmt(item.subtotal)} so'm</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* To'lov qo'shish (Faqat xodimlar uchun) */}
        {!isClient && !isWorker && (
          <div style={{ marginBottom: 20 }}>
            <SLabel>To'lov qo'shish</SLabel>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: 8, marginBottom: 10,
              background: remaining <= 0 ? '#f0fdf4' : '#eff6ff',
              border: `1px solid ${remaining <= 0 ? '#86efac' : '#bfdbfe'}`
            }}>
              <span style={{ fontSize: 12, color: remaining <= 0 ? '#065f46' : '#1e40af', fontWeight: 600 }}>
                {remaining <= 0 ? '✅ To\'liq to\'langan' : `💳 Qolgan qarz: ${fmt(remaining)} so'm`}
              </span>
              {isClient && remaining > 0 && (
                <Btn size="sm" onClick={() => setShowPayment(true)}>To'lov qilish 💳</Btn>
              )}
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {fmt(order.paid_amount)} / {fmt(order.total_amount)} so'm
              </span>
            </div>
            {payWarn && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderRadius: 8, marginBottom: 10, background: '#fef3c7', border: '1px solid #fde68a',
                fontSize: 12, color: '#92400e', fontWeight: 600
              }}>
                <AlertTriangle size={14} />{payWarn}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="number" placeholder={`Summa — max ${fmt(remaining)} so'm`}
                value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                style={{ ...iStyle, flex: 1, minWidth: 120, borderColor: payWarn ? '#f59e0b' : undefined }}
                disabled={remaining <= 0} />
              <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}
                style={{ ...iStyle, width: 120 }}>
                <option value="cash">💵 Naqd</option>
                <option value="card">💳 Karta</option>
                <option value="transfer">🏦 Bank</option>
                <option value="other">📋 Boshqa</option>
              </select>
              <input placeholder="Izoh" value={payForm.note}
                onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                style={{ ...iStyle, flex: 1, minWidth: 100 }} />
              <Btn variant="success" onClick={addPayment} loading={savingPay} disabled={remaining <= 0}>
                + Qo'shish
              </Btn>
            </div>
          </div>
        )}

        {/* To'lovlar tarixi */}
        {!isWorker && !!order.payments?.length && (
          <div>
            <SLabel>To'lovlar tarixi</SLabel>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {order.payments.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', fontSize: 13,
                  background: i % 2 === 0 ? '#fff' : 'var(--surface2)',
                  borderBottom: i < order.payments.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{p.method}</span>
                    {p.received_by_name && <span style={{ color: 'var(--text3)', marginLeft: 8 }}>{p.received_by_name}</span>}
                    {p.note && <span style={{ color: 'var(--text3)', marginLeft: 8 }}>· {p.note}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}>{fmtDate(p.created_at)}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{fmt(p.amount)} so'm</span>
                    <button onClick={() => printOrderReceipt(order, p)}
                      style={{
                        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6,
                        padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#1e40af',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                      }}>
                      <Download size={10} /> Chek
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}

      {activeTab === 'timeline' && <OrderTimeline order={order} />}
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENT MODAL (Click / Payme)
   ═══════════════════════════════════════════════════════════════════════════ */
function PaymentModal({ orderId, onClose, toast }) {
  const [links, setLinks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await api.get(`/orders/${orderId}/pay/`)
        setLinks(res)
      } catch (e) {
        toast(e.message || "To'lov linklarini olishda xatolik", 'error')
        onClose()
      } finally {
        setLoading(false)
      }
    }
    fetchLinks()
  }, [orderId])

  if (loading) return <Modal title="To'lov tizimini tanlang" onClose={onClose}><Spinner /></Modal>

  return (
    <Modal title="To'lov turini tanlang" onClose={onClose} maxWidth={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginBottom: 10 }}>
          To'lov summasi: <b style={{ color: 'var(--text)' }}>{Number(links?.amount || 0).toLocaleString()} so'm</b>
        </p>

        {/* Click */}
        <button
          onClick={() => links?.click_url && (window.location.href = links.click_url)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px', borderRadius: 14, border: '1px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#00a8ff'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <img src="https://click.uz/click/images/click-logo.png" alt="Click" style={{ height: 24 }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#00a8ff' }}>Click</span>
        </button>

        {/* Payme */}
        <button
          onClick={() => links?.payme_url && (window.location.href = links.payme_url)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px', borderRadius: 14, border: '1px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#33cccc'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <img src="https://cdn.payme.uz/logo/payme_color.svg" alt="Payme" style={{ height: 24 }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#33cccc' }}>Payme</span>
        </button>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          To'lov amalga oshirilgandan so'ng, buyurtma holati avtomatik ravishda yangilanadi.
        </p>
      </div>
    </Modal>
  )
}

/* ── Order Timeline ── */
function OrderTimeline({ order }) {
  if (!order) return null
  const events = []
  events.push({
    icon: '🆕', color: '#6366f1', title: 'Buyurtma yaratildi',
    sub: `Menejer: ${order.manager_name || 'belgilanmagan'}`, time: order.created_at
  })
    ; (order.payments || []).forEach(p => {
      events.push({
        icon: '💰', color: '#10b981',
        title: `To'lov: +${Number(p.amount).toLocaleString('uz-UZ')} so'm`,
        sub: `${{ cash: '💵 Naqd', card: '💳 Karta', transfer: '🏦 Bank', other: '📋 Boshqa' }[p.method] || p.method}${p.note ? ' · ' + p.note : ''}`,
        time: p.created_at
      })
    })
    ; (order.status_logs || []).forEach(log => {
      events.push({
        icon: STATUS_ICONS[log.new_status] || '🔄', color: '#3b82f6',
        title: `${STATUS_LABELS[log.old_status] || log.old_status} → ${STATUS_LABELS[log.new_status] || log.new_status}`,
        sub: log.changed_by_name || '', time: log.created_at
      })
    })
  if (!order.status_logs?.length) {
    events.push({
      icon: STATUS_ICONS[order.status] || '🔄', color: '#3b82f6',
      title: `Joriy holat: ${STATUS_LABELS[order.status] || order.status}`,
      sub: '', time: order.updated_at || order.created_at
    })
  }
  if (order.delivery_date) {
    const isOverdue = new Date(order.delivery_date) < new Date() && !['delivered', 'completed'].includes(order.status)
    events.push({
      icon: isOverdue ? '⚠️' : '🚚', color: isOverdue ? '#ef4444' : '#f97316',
      title: isOverdue ? 'Yetkazish kechikdi!' : 'Rejalashtirilgan yetkazish',
      sub: new Date(order.delivery_date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' }),
      time: null, isPlanned: true
    })
  }
  events.sort((a, b) => { if (a.isPlanned) return 1; if (b.isPlanned) return -1; return new Date(a.time) - new Date(b.time) })

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: "Buyurtma qilingan", value: fmtDT(order.created_at) },
          { label: "Yangilanish", value: fmtDT(order.updated_at) },
          {
            label: "Yetkazish", value: order.delivery_date
              ? new Date(order.delivery_date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
              : "Belgilanmagan"
          },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface2)', borderRadius: 10,
            padding: '10px 14px', flex: 1, minWidth: 140
          }}>
            <div style={{
              fontSize: 10, color: 'var(--text3)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3
            }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div style={{
          position: 'absolute', left: 11, top: 8, bottom: 8,
          width: 2, background: 'var(--border2)', borderRadius: 2
        }} />
        {events.map((ev, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? 18 : 0 }}>
            <div style={{
              position: 'absolute', left: -28, top: 2, width: 22, height: 22, borderRadius: '50%',
              background: `${ev.color}20`, border: `2px solid ${ev.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
            }}>
              {ev.icon}
            </div>
            <div style={{
              background: ev.isPlanned ? 'transparent' : 'var(--surface2)', borderRadius: 10,
              padding: ev.isPlanned ? '4px 0' : '11px 14px',
              border: ev.isPlanned ? '1px dashed var(--border2)' : '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ev.isPlanned ? 'var(--text3)' : 'var(--text)' }}>
                    {ev.title}
                  </div>
                  {ev.sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{ev.sub}</div>}
                </div>
                {ev.time && (
                  <div style={{
                    fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap',
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3
                  }}>
                    <Clock size={10} /> {fmtDT(ev.time)}
                  </div>
                )}
                {ev.isPlanned && <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>rejalashtirilgan</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEW ORDER MODAL
═══════════════════════════════════════════════════════════════════════════ */
export function NewOrderModal({ onClose, toast, onReload, user, addNotif, preselectedProduct }) {
  const isClient = user?.role === 'client'
  const { data: clientsRaw } = useFetch(isClient ? null : '/clients/?archived=false')
  const { data: productsRaw } = useFetch('/products/?active=true')
  const { data: managersRaw } = useFetch(isClient ? null : '/users/?role=manager')

  const clients = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw?.results ?? [])
  const products = Array.isArray(productsRaw) ? productsRaw : (productsRaw?.results ?? [])
  const managers = Array.isArray(managersRaw) ? managersRaw : (managersRaw?.results ?? [])

  const [form, setForm] = useState({
    client: '', manager: '',
    delivery_region: '', delivery_district: '', delivery_mfy: '', delivery_address: '',
    delivery_date: '', discount: '0', notes: '',
  })
  const [items, setItems] = useState(() => {
    if (preselectedProduct) {
      return [{
        product: preselectedProduct.id,
        quantity: 1,
        price: preselectedProduct.selling_price
      }]
    }
    return [{ product: '', quantity: 1, price: '' }]
  })
  const [saving, setSaving] = useState(false)

  const updateItem = (i, k, v) => {
    const a = [...items]; a[i] = { ...a[i], [k]: v }
    if (k === 'product') {
      const p = products.find(x => x.id === Number(v))
      if (p) a[i].price = p.selling_price
    }
    setItems(a)
  }
  const total = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)

  const save = async () => {
    if (!isClient && !form.client) return toast('Mijoz tanlang', 'error')
    if (items.some(it => !it.product || !it.price))
      return toast("Barcha mahsulotlarni to'ldiring", 'error')
    setSaving(true)
    try {
      const payload = {
        delivery_region: form.delivery_region, delivery_district: form.delivery_district,
        delivery_mfy: form.delivery_mfy, delivery_address: form.delivery_address,
        delivery_date: form.delivery_date || null, notes: form.notes,
        items: items.map(it => ({ product: Number(it.product), quantity: Number(it.quantity), price: String(it.price) })),
      }
      if (!isClient) {
        payload.client = Number(form.client); payload.manager = form.manager ? Number(form.manager) : null
        payload.discount = Number(form.discount) || 0
      }
      await api.orderCreate(payload)
      toast('Buyurtma yaratildi ✅', 'success')
      addNotif?.({ type: 'new_order', title: 'Buyurtma yaratildi', body: `Yangi buyurtma qo'shildi`, link: '/orders' })
      onReload(); onClose()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm({ ...form, [k]: e.target.value }) })

  return (
    <Modal title="Yangi buyurtma" onClose={onClose} maxWidth={640}
      footer={<><Btn variant="ghost" onClick={onClose}>Bekor</Btn><Btn onClick={save} loading={saving}>Saqlash</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!isClient && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Mijoz *</span>
              <ReactSelect
                options={clients.map(c => ({ value: c.id, label: `${c.name} — ${c.phone}` }))}
                value={form.client ? { value: form.client, label: clients.find(c => c.id === Number(form.client)) ? `${clients.find(c => c.id === Number(form.client)).name} — ${clients.find(c => c.id === Number(form.client)).phone}` : '' } : null}
                onChange={v => setForm({ ...form, client: v ? v.value : '' })}
                placeholder="Tanlang yoki ismini izlang..."
                isClearable
                styles={{ control: base => ({ ...base, borderRadius: 9, borderColor: 'var(--border)', minHeight: 40, fontSize: 13 }), menu: base => ({ ...base, fontSize: 13 }) }}
              />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Menejer</span>
              <ReactSelect
                options={managers.map(u => ({ value: u.id, label: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username }))}
                value={form.manager ? { value: form.manager, label: managers.find(u => u.id === Number(form.manager)) ? (managers.find(u => u.id === Number(form.manager)).first_name ? `${managers.find(u => u.id === Number(form.manager)).first_name} ${managers.find(u => u.id === Number(form.manager)).last_name || ''}`.trim() : managers.find(u => u.id === Number(form.manager)).username) : '' } : null}
                onChange={v => setForm({ ...form, manager: v ? v.value : '' })}
                placeholder="Menejer tanlang..."
                isClearable
                styles={{ control: base => ({ ...base, borderRadius: 9, borderColor: 'var(--border)', minHeight: 40, fontSize: 13 }), menu: base => ({ ...base, fontSize: 13 }) }}
              />
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Yetkazish sanasi" type="date" min={new Date().toISOString().split('T')[0]} {...f('delivery_date')} />
          {!isClient && <Input label="Chegirma (%)" type="number" min="0" max="100" {...f('discount')} />}
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
          <SLabel>📍 Yetkazib berish manzili</SLabel>
          <DeliveryAddress
            value={{
              region: form.delivery_region, district: form.delivery_district,
              mfy: form.delivery_mfy, address: form.delivery_address
            }}
            onChange={(field, val) => setForm(prev => ({ ...prev, [field]: val }))}
          />
        </div>
        <Textarea label="Izoh" {...f('notes')} />
        <SLabel>Mahsulotlar *</SLabel>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <ReactSelect
                options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku}) — ${Number(p.selling_price).toLocaleString()} so'm` }))}
                value={it.product ? { value: it.product, label: products.find(p => p.id === Number(it.product)) ? `${products.find(p => p.id === Number(it.product)).name} (${products.find(p => p.id === Number(it.product)).sku})` : '' } : null}
                onChange={v => updateItem(i, 'product', v ? v.value : '')}
                placeholder="Mahsulot tanlang/izlang..."
                isClearable
                styles={{ control: base => ({ ...base, borderRadius: 9, borderColor: 'var(--border)', minHeight: 40, fontSize: 13 }), menu: base => ({ ...base, fontSize: 13, zIndex: 9999 }) }}
              />
            </div>
            <input type="number" min="1" value={it.quantity}
              onChange={e => updateItem(i, 'quantity', e.target.value)}
              placeholder="Soni" style={{ ...iStyle, width: 68 }} />
            <input type="number" value={it.price}
              onChange={e => updateItem(i, 'price', e.target.value)}
              placeholder="Narx" style={{ ...iStyle, flex: 1 }} />
            {items.length > 1 && (
              <Btn size="sm" variant="danger" onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</Btn>
            )}
          </div>
        ))}
        <Btn variant="ghost" size="sm" onClick={() => setItems([...items, { product: '', quantity: 1, price: '' }])}
          style={{ width: 'fit-content' }}>
          + Mahsulot qo'shish
        </Btn>
        {total > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#fff7ed,#fff)', border: '2px solid var(--accent)'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text2)' }}>Jami summa:</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>
              {total.toLocaleString('uz-UZ')} so'm
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
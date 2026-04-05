import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/api/client'
import { NewOrderModal } from './Orders'
import { useApp } from '@/hooks/useApp'
import { useFetch } from '@/hooks/useFetch'
import {
  Btn, Badge, Table, Modal, Input, Select, Textarea,
  SearchInput, PageHeader, Card, Spinner, SLabel, Pagination,
} from '@/components/UI'
import {
  Plus, Package, TrendingUp, AlertTriangle,
  ToggleLeft, ToggleRight, ChevronRight, Edit2, Upload, X, Image, ShoppingBag, Eye,
  List, LayoutGrid,
} from 'lucide-react'

const fMoney = n => Number(n || 0).toLocaleString('uz-UZ')

function MiniStat({ icon, label, value, color = '#f97316' }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
      padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:11, background:`${color}15`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase',
          letterSpacing:'0.5px', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{value}</div>
      </div>
    </div>
  )
}

function ProductCard({ product: p, onClick, onOrder, user }) {
  const [hov, setHov] = useState(false)
  const isAdmin = ['admin', 'manager'].includes(user?.role)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 12px 30px rgba(0,0,0,0.12)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Image Container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f8fafc' }}>
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              transform: hov ? 'scale(1.08)' : 'scale(1)'
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, background: 'var(--surface2)'
          }}>
            🪑
          </div>
        )}
        
        {/* Badge Overlay */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {p.stock_quantity <= 0 ? (
            <span style={{ background: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>TUGAGAN</span>
          ) : p.stock_quantity <= 5 ? (
            <span style={{ background: '#f59e0b', color: '#fff', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>KAM QOLDI</span>
          ) : null}
          {p.category_name && (
            <span style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--text)', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {p.category_name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
          {p.sku}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
          {p.name}
        </h3>
        
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>Narxi</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--accent)' }}>
              {(!user || user.role === 'worker') ? '—' : fMoney(p.selling_price)} <span style={{ fontSize: 11, fontWeight: 600 }}>{(!user || user.role === 'worker') ? '' : "so'm"}</span>
            </div>
          </div>
          
          {user?.role !== 'worker' && (
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--accent-lo)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', transition: 'all 0.2s',
              transform: hov ? 'scale(1.1)' : 'scale(1)',
              boxShadow: hov ? '0 4px 12px var(--accent-lo)' : 'none'
            }} onClick={e => { e.stopPropagation(); onOrder(p) }} title="Buyurtma berish">
              <ShoppingBag size={18} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const { toast, user, addNotif } = useApp()
  const isWorker = user?.role === 'worker'
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [activeFilter, setActive] = useState('')
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [detail, setDetail]       = useState(null)
  const [editing, setEditing]     = useState(null)
  const [showNew, setShowNew]     = useState(false)
  const [ordering, setOrdering]   = useState(null)
  const [viewMode, setViewMode]   = useState(() => {
    if (user?.role === 'client') return 'grid'
    return localStorage.getItem('products_view') || 'table'
  })
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const { data: catsRaw } = useFetch('/categories/')
  const cats = Array.isArray(catsRaw) ? catsRaw : (catsRaw?.results || [])

  const canEdit = ['admin', 'manager'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true); setProducts([])
    try {
      const res = await api.products({ search, category: catFilter, active: activeFilter, page })
      const list = Array.isArray(res) ? res : (res.results || [])
      setProducts(list)
      setTotal(Array.isArray(res) ? res.length : (res.count || 0))
    } catch(e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [search, catFilter, activeFilter, page])

  useEffect(() => { setPage(1) }, [search, catFilter, activeFilter])
  useEffect(() => { load() }, [load])

  const toggleActive = async (p, e) => {
    e.stopPropagation()
    try {
      await api.productUpdate(p.id, { is_active: !p.is_active })
      toast(p.is_active ? "O'chirildi" : 'Faollashtirildi', 'success')
      load()
    } catch(e) { toast(e.message, 'error') }
  }

  const COLS = [
    {
      key: 'name', label: 'Mahsulot',
      render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {r.image
            ? <img src={r.image} alt={r.name} style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
            : <div style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🪑</div>
          }
          <div>
            <div style={{ fontWeight:700, fontSize:13 }}>{r.name}</div>
            <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:1 }}>{r.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category_name', label: 'Kategoriya',
      render: r => r.category_name
        ? <span style={{ background:'var(--purple-lo)', color:'var(--purple)',
            borderRadius:100, padding:'3px 10px', fontSize:11, fontWeight:600 }}>{r.category_name}</span>
        : <span style={{ color:'var(--text3)' }}>—</span>,
    },
    !isWorker && {
      key: 'selling_price', label: 'Narxi',
      render: r => (
        <div>
          <div style={{ color:'var(--accent)', fontWeight:700 }}>{fMoney(r.selling_price)} so'm</div>
          {r.cost_price > 0 && (
            <div style={{ fontSize:11, color:'var(--text3)' }}>Tan: {fMoney(r.cost_price)} so'm</div>
          )}
        </div>
      ),
    },
    {
      key: 'stock_quantity', label: 'Stok',
      render: r => {
        const low   = r.stock_quantity > 0 && r.stock_quantity <= 5
        const empty = r.stock_quantity <= 0
        return (
          <span style={{ display:'flex', alignItems:'center', gap:5, fontWeight:700,
            color: empty ? 'var(--red)' : low ? 'var(--yellow)' : 'var(--green)' }}>
            {empty && <AlertTriangle size={11}/>}
            {r.stock_quantity} dona
          </span>
        )
      },
    },
    !isWorker && {
      key: 'margin', label: 'Foyda',
      render: r => {
        const margin = Number(r.selling_price||0) - Number(r.cost_price||0)
        const pct    = r.cost_price > 0 ? Math.round(margin/Number(r.cost_price)*100) : 0
        return margin > 0
          ? <span style={{ color:'var(--green)', fontSize:12, fontWeight:600 }}>
              +{fMoney(margin)} <span style={{ color:'var(--text3)' }}>({pct}%)</span>
            </span>
          : <span style={{ color:'var(--text3)' }}>—</span>
      },
    },
    {
      key: 'material', label: 'Material',
      render: r => <span style={{ color:'var(--text2)', fontSize:12 }}>
        {[r.material,r.color,r.dimensions].filter(Boolean).join(' · ') || '—'}
      </span>,
    },
    {
      key: 'is_active', label: 'Holat',
      render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:6 }} onClick={e => e.stopPropagation()}>
          <Badge status={r.is_active ? 'ready':'cancelled'} label={r.is_active ? 'Faol':'Nofaol'}/>
          {canEdit && (
            <button onClick={e => toggleActive(r,e)} title="Holat o'zgartirish"
              style={{ background:'none', border:'none', cursor:'pointer', padding:2,
                color: r.is_active ? 'var(--green)':'var(--text3)', display:'flex' }}>
              {r.is_active ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'actions', label: '',
      render: r => (
        <div style={{ display:'flex', gap:5 }} onClick={e => e.stopPropagation()}>
          <Btn size="sm" variant="ghost" icon={<ChevronRight size={12}/>} onClick={() => setDetail(r)}>Ko'rish</Btn>
          {user?.role === 'client' && <Btn size="sm" variant="success" icon={<ShoppingBag size={12}/>} onClick={() => setOrdering(r)}>Buyurtma</Btn>}
          {canEdit && !isWorker && <Btn size="sm" variant="ghost" icon={<Edit2 size={11}/>} onClick={() => setEditing(r)}/>}
        </div>
      ),
    },
  ].filter(Boolean)

  const active   = Array.isArray(products) ? products.filter(p => p.is_active).length : 0
  const lowStock = Array.isArray(products) ? products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length : 0
  const outStock = Array.isArray(products) ? products.filter(p => p.stock_quantity <= 0).length : 0
  const totalVal = Array.isArray(products) ? products.reduce((s,p) => s + Number(p.selling_price||0)*Number(p.stock_quantity||0), 0) : 0

  return (
    <div>
      <PageHeader title="Mahsulotlar" subtitle={`Jami: ${total} ta`}
        action={canEdit && <Btn icon={<Plus size={14}/>} onClick={() => setShowNew(true)}>Yangi mahsulot</Btn>}
      />

      {user?.role !== 'client' && (
        <div style={{ display:'grid', gridTemplateColumns: isWorker ? 'repeat(3,1fr)' : 'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          <MiniStat icon="📦" label="Faol mahsulotlar" value={`${active} ta`}          color="#6366f1"/>
          <MiniStat icon="⚠️" label="Kam qoldiq"       value={`${lowStock} ta`}         color="#f59e0b"/>
          <MiniStat icon="❌" label="Tugagan"           value={`${outStock} ta`}         color="#ef4444"/>
          {!isWorker && <MiniStat icon="💰" label="Stok qiymati"      value={`${fMoney(totalVal)} so'm`}  color="#10b981"/>}
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, artikul, material..."/>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid var(--border2)',
            background:'var(--surface)', color:'var(--text)', fontSize:13, fontFamily:'inherit', cursor:'pointer' }}>
          <option value="">Barcha kategoriyalar</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        {user?.role !== 'client' && (
          <div style={{ display:'flex', gap:6 }}>
            {[['','Barchasi'],['true','Faol'],['false','Nofaol']].map(([v,l]) => (
              <button key={v} onClick={() => setActive(activeFilter===v&&v?'':v)}
                style={{ padding:'6px 14px', borderRadius:100, fontSize:12, fontWeight:600,
                  border: activeFilter===v ? 'none':'1px solid var(--border2)', cursor:'pointer',
                  background: activeFilter===v ? 'var(--accent)':'var(--surface)',
                  color:       activeFilter===v ? '#fff':'var(--text3)' }}>
                {l}
              </button>
            ))}
          </div>
        )}

        <div style={{ display:'flex', background:'var(--surface2)', borderRadius:10, padding:3, marginLeft: 'auto' }}>
          {[
            { mode: 'table', icon: <List size={14} />, label: 'Jadval' },
            { mode: 'grid', icon: <LayoutGrid size={14} />, label: 'Galereya' }
          ].map(m => (
            <button
              key={m.mode}
              onClick={() => { setViewMode(m.mode); localStorage.setItem('products_view', m.mode) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: viewMode === m.mode ? '#fff' : 'transparent',
                color: viewMode === m.mode ? 'var(--accent)' : 'var(--text3)',
                boxShadow: viewMode === m.mode ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? <Spinner/> : (
          <>
            {viewMode === 'table' ? (
              <Table columns={COLS} data={products} onRow={r => setDetail(r)} emptyText="Mahsulotlar yo'q"/>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
                padding: '10px 0'
              }}>
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onClick={() => setDetail(p)} onOrder={setOrdering} user={user} />
                ))}
                {products.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                    Mahsulotlar topilmadi
                  </div>
                )}
              </div>
            )}
            <Pagination total={total} current={page} onChange={setPage} />
          </>
        )}
      </Card>

      {showNew  && <ProductModal onClose={() => setShowNew(false)} toast={toast} reload={load}/>}
      {editing  && <ProductModal product={editing} onClose={() => setEditing(null)} toast={toast} reload={load}/>}
      {ordering && (
        <NewOrderModal 
          preselectedProduct={ordering} 
          onClose={() => setOrdering(null)} 
          toast={toast} 
          onReload={load} 
          user={user}
          addNotif={addNotif}
        />
      )}
      {detail   && (
        <ProductDetailModal
          product={detail}
          user={user}
          isWorker={isWorker}
          onClose={() => setDetail(null)}
          onOrder={() => { setOrdering(detail); setDetail(null) }}
          onEdit={canEdit && !isWorker ? () => { setEditing(detail); setDetail(null) } : null}
        />
      )}
    </div>
  )
}

// ── Detail modal ───────────────────────────────────────────────────────────────
function ProductDetailModal({ product: p, onClose, onEdit, onOrder, user, isWorker }) {
  const isAdmin = ['admin', 'manager'].includes(user?.role)
  const isClient = user?.role === 'client'

  const { data: movements } = useFetch(`/movements/?product=${p.id}`)
  const mvs = Array.isArray(movements) ? movements : (movements?.results ?? [])
  const fmtDT = d => d ? new Date(d).toLocaleString('uz-UZ', { day:'2-digit', month:'short', year:'numeric' }) : '—'
  const margin = Number(p.selling_price||0) - Number(p.cost_price||0)
  const pct    = p.cost_price > 0 ? Math.round(margin/Number(p.cost_price)*100) : 0

  return (
    <Modal title="" onClose={onClose} maxWidth={620}
      footer={
        <div style={{ display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center' }}>
          <div style={{ display:'flex', gap:10 }}>
            {onEdit && <Btn icon={<Edit2 size={13}/>} onClick={onEdit}>Tahrirlash</Btn>}
            {isClient && (
              <Btn variant="success" icon={<ShoppingBag size={14}/>} onClick={onOrder} 
                style={{ padding:'10px 24px', fontSize:14 }}>
                Buyurtma berish
              </Btn>
            )}
          </div>
          <Btn variant="ghost" onClick={onClose}>Yopish</Btn>
        </div>
      }
    >
      <div style={{ margin:'-20px -24px 20px', background:'linear-gradient(135deg,#1a2540,#2d3a5e)',
        padding:'22px 24px 20px', borderRadius:'18px 18px 0 0' }}>
        <div style={{ display:'flex', gap:18, alignItems:'center' }}>
          {p.image
            ? <img src={p.image} alt={p.name} style={{ width:110, height:110, borderRadius:16,
                objectFit:'cover', border:'3px solid rgba(255,255,255,0.25)', flexShrink:0,
                boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}/>
            : <div style={{ width:110, height:110, borderRadius:16, flexShrink:0,
                background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:44, border:'2px solid rgba(255,255,255,0.1)' }}>🪑</div>
          }
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:600, letterSpacing:1, marginBottom:4 }}>{p.sku}</div>
            <h2 style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:8, lineHeight:1.2 }}>{p.name}</h2>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              {p.category_name && (
                <span style={{ fontSize:11, background:'rgba(255,255,255,0.15)', color:'#fff',
                  padding:'3px 12px', borderRadius:100, fontWeight:700 }}>{p.category_name}</span>
              )}
              {!isClient && <Badge status={p.is_active ? 'ready':'cancelled'} label={p.is_active?'Faol':'Nofaol'}/>}
              {isClient && p.stock_quantity > 0 && <span style={{ color:'#6ee7b7', fontSize:12, fontWeight:700 }}>● Sotuvda mavjud</span>}
            </div>
          </div>
        </div>
        <div style={{
          display:'grid',
          gridTemplateColumns: (isClient || isWorker) ? '1fr' : 'repeat(3,1fr)',
          gap:8, marginTop:20
        }}>
          {isClient ? (
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'14px 20px',
              border:'1px solid rgba(255,255,255,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Mahsulot narxi</div>
                <div style={{ fontSize:28, fontWeight:950, color:'#fb923c' }}>{fMoney(p.selling_price)} <span style={{ fontSize:14, fontWeight:700 }}>so'm</span></div>
              </div>
              <ShoppingBag size={32} color="rgba(255,255,255,0.2)"/>
            </div>
          ) : isWorker ? (
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:11, padding:'14px 16px',
              border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📦</div>
              <div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:700, textTransform:'uppercase' }}>Stok miqdori</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{p.stock_quantity} dona</div>
              </div>
            </div>
          ) : (
            [
              { l:'Sotish narxi', v:`${fMoney(p.selling_price)} so'm`, c:'#fb923c' },
              { l:'Tan narxi',    v:`${fMoney(p.cost_price)} so'm`,    c:'#94a3b8' },
              { l:'Foyda',        v: margin>0 ? `${fMoney(margin)} so'm (${pct}%)` : '—', c:'#6ee7b7' },
            ].map(s => (
              <div key={s.l} style={{ background:'rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 12px',
                border:'1px solid rgba(255,255,255,0.09)' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:s.c }}>{s.v}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:'var(--surface2)', borderRadius:11, padding:14 }}>
          <SLabel>📦 Stok ma'lumoti</SLabel>
          {[
            ['Stok miqdori', p.stock_quantity > 0 ? `${p.stock_quantity} dona` : 'Tugagan', p.stock_quantity<=0?'var(--red)':p.stock_quantity<=5?'var(--yellow)':'var(--green)'],
            !isClient && ['Holat', p.is_active ? '✅ Faol':'❌ Nofaol', 'var(--text)'],
          ].filter(Boolean).map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
              borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text3)' }}>{l}</span>
              <span style={{ fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'var(--surface2)', borderRadius:11, padding:14 }}>
          <SLabel>🎨 Xususiyatlar</SLabel>
          {[
            ['Material', p.material||'—'],
            ['Rang',     p.color||'—'],
            ["O'lcham",  p.dimensions||'—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
              borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text3)' }}>{l}</span>
              <span style={{ fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {p.description && (
        <div style={{ marginBottom:20, background:'var(--surface2)', borderRadius:11, padding:14 }}>
          <SLabel>Tavsif</SLabel>
          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{p.description}</p>
        </div>
      )}

      {isAdmin && mvs.length > 0 && (
        <div>
          <SLabel>📋 Ombor harakati tarixi</SLabel>
          <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            {mvs.slice(0,8).map((m,i) => (
              <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'9px 14px', fontSize:12,
                background: i%2===0 ? 'var(--surface)':'var(--surface2)',
                borderBottom: i<Math.min(mvs.length,8)-1 ? '1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:14 }}>
                    {m.movement_type==='in'?'📥':m.movement_type==='out'?'📤':'🔄'}
                  </span>
                  <div>
                    <span style={{ fontWeight:600, color: m.movement_type==='in'?'var(--green)':m.movement_type==='out'?'var(--red)':'var(--blue)' }}>
                      {m.movement_type==='in'?'+':m.movement_type==='out'?'-':'~'}{m.quantity} dona
                    </span>
                    {m.reason && <span style={{ color:'var(--text3)', marginLeft:6 }}>{m.reason}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', color:'var(--text3)' }}>
                  <div>{m.performed_by_name}</div>
                  <div>{fmtDT(m.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── ProductModal — rasm yuklash bilan ─────────────────────────────────────────
function ProductModal({ product, onClose, toast, reload }) {
  const { data: catsRaw } = useFetch('/categories/')
  const cats = Array.isArray(catsRaw) ? catsRaw : (catsRaw?.results || [])
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name:          product?.name          ?? '',
    sku:           product?.sku           ?? '',
    description:   product?.description   ?? '',
    category:      product?.category      ?? '',
    selling_price: product?.selling_price ?? '',
    cost_price:    product?.cost_price    ?? '',
    material:      product?.material      ?? '',
    color:         product?.color         ?? '',
    dimensions:    product?.dimensions    ?? '',
    is_active:     product?.is_active     ?? true,
  })
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setPreview]    = useState(product?.image || null)
  const [saving, setSaving]           = useState(false)
  const [errors, setErrors]           = useState({})

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Faqat rasm fayllari', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { toast("Rasm 5MB dan kichik bo'lishi kerak", 'error'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nom kiritilishi shart'
    if (!form.sku.trim())  e.sku  = 'Artikul kiritilishi shart'
    if (!form.selling_price || Number(form.selling_price) <= 0)
      e.selling_price = 'Sotish narxini kiriting'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      // Rasm bor bo'lsa FormData, yo'q bo'lsa JSON
      if (imageFile) {
        const fd = new FormData()
        Object.entries(form).forEach(([k,v]) => {
          if (v !== null && v !== undefined && v !== '') fd.append(k, v)
        })
        if (form.category) fd.set('category', String(form.category))
        else fd.delete('category')
        fd.append('image', imageFile)
        if (product) await api.patchForm(`/products/${product.id}/`, fd)
        else         await api.postForm('/products/', fd)
      } else {
        const payload = {
          ...form,
          category:      form.category ? Number(form.category) : null,
          selling_price: String(form.selling_price || '0'),
          cost_price:    String(form.cost_price    || '0'),
        }
        if (product) await api.productUpdate(product.id, payload)
        else         await api.productCreate(payload)
      }
      toast(product ? 'Yangilandi ✅' : "Mahsulot qo'shildi ✅", 'success')
      reload(); onClose()
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const f = k => ({
    value: form[k] ?? '',
    onChange: e => { setForm({...form,[k]:e.target.value}); setErrors({...errors,[k]:''}) },
    error: errors[k],
  })

  const margin = Number(form.selling_price||0) - Number(form.cost_price||0)
  const pct    = form.cost_price > 0 ? Math.round(margin/Number(form.cost_price)*100) : 0

  return (
    <Modal title={product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} onClose={onClose} maxWidth={580}
      footer={<><Btn variant="ghost" onClick={onClose}>Bekor</Btn><Btn onClick={save} loading={saving}>Saqlash</Btn></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Rasm yuklash */}
        <div style={{ background:'var(--surface2)', borderRadius:12, padding:14 }}>
          <SLabel>🖼️ Mahsulot rasmi</SLabel>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            {/* Preview */}
            <div style={{ position:'relative', flexShrink:0 }}>
              {imagePreview
                ? <img src={imagePreview} alt="preview"
                    style={{ width:90, height:90, borderRadius:10, objectFit:'cover',
                      border:'2px solid var(--border)' }}/>
                : <div style={{ width:90, height:90, borderRadius:10, background:'#f1f5f9',
                    border:'2px dashed #cbd5e1', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap:4 }}>
                    <Image size={24} color="#94a3b8"/>
                    <span style={{ fontSize:10, color:'#94a3b8' }}>Rasm yo'q</span>
                  </div>
              }
              {imagePreview && (
                <button onClick={removeImage}
                  style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%',
                    background:'#ef4444', border:'none', cursor:'pointer', color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={11}/>
                </button>
              )}
            </div>
            {/* Upload button */}
            <div style={{ flex:1 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange}
                style={{ display:'none' }}/>
              <Btn variant="ghost" size="sm" icon={<Upload size={13}/>}
                onClick={() => fileRef.current?.click()}>
                Rasm tanlash
              </Btn>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
                JPG, PNG, WebP • Max 5MB
              </div>
              {imageFile && (
                <div style={{ fontSize:11, color:'var(--green)', marginTop:4, fontWeight:600 }}>
                  ✓ {imageFile.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Asosiy ma'lumotlar */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Input label="Nomi *"    placeholder="Divan Comfort"  {...f('name')}/>
          <Input label="Artikul *" placeholder="DIV-001"        {...f('sku')}/>
        </div>

        {/* Narxlar */}
        <div style={{ background:'var(--surface2)', borderRadius:12, padding:'14px 14px 10px' }}>
          <SLabel>💰 Narxlar</SLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom: margin>0 ? 10:0 }}>
            <Input label="Sotish narxi (so'm) *" type="number" min="0" {...f('selling_price')}/>
            <Input label="Tan narxi (so'm)"      type="number" min="0" {...f('cost_price')}/>
          </div>
          {margin > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12,
              color:'var(--green)', fontWeight:600, padding:'6px 10px',
              background:'var(--green-lo)', borderRadius:8 }}>
              <TrendingUp size={13}/>
              Foyda: +{fMoney(margin)} so'm ({pct}%)
            </div>
          )}
        </div>

        {/* Kategoriya + Material */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Select label="Kategoriya" value={form.category||''}
            onChange={e => setForm({...form, category:e.target.value})}>
            <option value="">Kategoriyasiz</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Material" placeholder="Temir, Yog'och..." {...f('material')}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <Input label="Rang"    {...f('color')}/>
          <Input label="O'lcham" placeholder="200×90×70 sm" {...f('dimensions')}/>
          <Select label="Holat" value={form.is_active?'true':'false'}
            onChange={e => setForm({...form, is_active:e.target.value==='true'})}>
            <option value="true">✅ Faol</option>
            <option value="false">❌ Nofaol</option>
          </Select>
        </div>

        <Textarea label="Tavsif" {...f('description')}/>
      </div>
    </Modal>
  )
}
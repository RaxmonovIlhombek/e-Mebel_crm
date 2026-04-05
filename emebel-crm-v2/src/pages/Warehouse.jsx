import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { exportBeautifulExcel } from '@/utils/excelExport'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { useFetch } from '@/hooks/useFetch'
import {
  Btn, Badge, Table, Modal, Select, Input,
  PageHeader, Card, Spinner, SLabel, SearchInput,
} from '@/components/UI'
import {
  Plus, AlertTriangle, Package, TrendingUp, TrendingDown,
  RotateCcw, Download, BarChart2, Edit2, X, CheckCircle,
  ArrowUpCircle, ArrowDownCircle, Settings, Scan, Camera, ZapOff,
} from 'lucide-react'

// ── Barcode Scanner hook ─────────────────────────────────────────────────────
function useBarcodeScanner(onScan) {
  const bufRef  = useRef('')
  const timerRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      // Barcode scanner klaviatura kabi tez yozadi (har belgi <50ms)
      if (timerRef.current) clearTimeout(timerRef.current)

      if (e.key === 'Enter') {
        const code = bufRef.current.trim()
        if (code.length >= 3) onScan(code)
        bufRef.current = ''
        return
      }

      if (e.key.length === 1) {
        bufRef.current += e.key
        // 100ms ichida yangi belgi kelmasa — buferni tozala
        timerRef.current = setTimeout(() => { bufRef.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onScan])
}

// ── Barcode Modal ─────────────────────────────────────────────────────────────
function BarcodeModal({ stocks, onFound, onClose }) {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')
  const inputRef            = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback((code) => {
    const c = code.trim().toUpperCase()
    if (!c) return
    const found = stocks.find(s =>
      s.product_sku?.toUpperCase() === c ||
      s.product_name?.toUpperCase().includes(c)
    )
    if (found) {
      setResult(found)
      setError('')
      onFound && onFound(found)
    } else {
      setResult(null)
      setError(`"${code}" — topilmadi`)
    }
    setInput('')
  }, [stocks, onFound])

  return (
    <Modal title="🔍 Barcode / SKU Skaner" onClose={onClose} width={480}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Scanner ikonkasi */}
        <div style={{ textAlign:'center', padding:'12px 0' }}>
          <div style={{ width:70, height:70, borderRadius:'50%', background:'#f97316',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
            <Scan size={32} color="#fff" />
          </div>
          <p style={{ color:'#64748b', fontSize:13 }}>
            Barcode skanerini yoki kamerani ishlating.<br/>
            Skanerdan o'qilganda avtomatik izlaydi.
          </p>
        </div>

        {/* Qo'lda kiritish */}
        <div style={{ display:'flex', gap:8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(input)}
            placeholder="SKU yoki barcode skanerlang / kiriting..."
            style={{
              flex:1, padding:'10px 14px', borderRadius:10, fontSize:14,
              border:'2px solid #e2e8f0', outline:'none',
              transition:'border 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <Btn onClick={() => search(input)}>Izla</Btn>
        </div>

        {/* Natija */}
        {result && (
          <div style={{
            background:'#f0fdf4', border:'2px solid #22c55e',
            borderRadius:12, padding:16,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16, color:'#0f172a' }}>{result.product_name}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                  SKU: <b>{result.product_sku || '—'}</b> &nbsp;|&nbsp;
                  Kategoriya: {result.product_category || '—'}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{
                  fontSize:28, fontWeight:900,
                  color: result.quantity <= 0 ? '#ef4444' : result.quantity <= result.min_quantity ? '#f97316' : '#16a34a'
                }}>
                  {result.quantity}
                </div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>dona</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fca5a5',
            borderRadius:10, padding:12, color:'#b91c1c', fontSize:14 }}>
            ❌ {error}
          </div>
        )}

        {/* Barcha mahsulotlar ro'yxati */}
        <div style={{ maxHeight:220, overflowY:'auto', borderRadius:10,
          border:'1px solid #e2e8f0' }}>
          {stocks.map(s => (
            <div key={s.id} onClick={() => { setResult(s); setError('') }}
              style={{
                padding:'10px 14px', cursor:'pointer', display:'flex',
                justifyContent:'space-between', alignItems:'center',
                borderBottom:'1px solid #f1f5f9',
                background: result?.id === s.id ? '#fff7ed' : 'transparent',
                transition:'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = result?.id === s.id ? '#fff7ed' : 'transparent'}
            >
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{s.product_name}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{s.product_sku || '—'}</div>
              </div>
              <div style={{
                fontWeight:700, fontSize:15,
                color: s.quantity <= 0 ? '#ef4444' : s.quantity <= s.min_quantity ? '#f97316' : '#16a34a'
              }}>
                {s.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

const fmt     = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('uz-UZ', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

// ── Stat karta ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#f97316', onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'#fff', border:'1px solid #e2e8f0', borderRadius:14,
      padding:'16px 18px', cursor: onClick ? 'pointer' : 'default',
      transition:'all 0.15s', display:'flex', flexDirection:'column', gap:8,
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = '#e2e8f0')}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:`${color}15`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:17 }}>{icon}</span>
        </div>
        <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600,
          textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:'#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'#94a3b8' }}>{sub}</div>}
    </div>
  )
}

// ── Stok rangi ──────────────────────────────────────────────────────────────
function stockColor(qty, min) {
  if (qty <= 0)       return { bg:'#fef2f2', text:'#b91c1c', label:'Tugagan',  dot:'#ef4444' }
  if (qty <= min)     return { bg:'#fff7ed', text:'#c2410c', label:'Kam',      dot:'#f97316' }
  if (qty <= min * 2) return { bg:'#fefce8', text:'#a16207', label:'Ozaymoqda', dot:'#eab308' }
  return               { bg:'#f0fdf4', text:'#15803d', label:'Yetarli',  dot:'#22c55e' }
}

// ── Asosiy sahifa ────────────────────────────────────────────────────────────
export default function Warehouse() {
  const { toast, user }       = useApp()
  const [searchParams]        = useSearchParams()
  
  const [stocks, setStocks]   = useState([])
  const [moves, setMoves]     = useState([])
  const [sLoad, setSLoad]     = useState(false)
  const [mLoad, setMLoad]     = useState(false)
  
  const [tab, setTab]         = useState(searchParams.get('type') ? 'moves' : 'stock')
  const [moveFilter, setMoveFilter] = useState(searchParams.get('type') || '')
  
  const [showMove, setShowMove]       = useState(false)
  const [showMinEdit, setShowMinEdit] = useState(null)
  const [showDetail, setShowDetail]   = useState(null)
  const [filterLow, setFilterLow]     = useState(false)
  const [search, setSearch]           = useState('')
  const [showBarcode, setShowBarcode] = useState(false)
  
  const canEdit = ['admin','manager'].includes(user?.role)

  const loadStock = useCallback(async () => {
    setSLoad(true)
    try {
      const res = await api.stock()
      setStocks(Array.isArray(res) ? res : (res?.results ?? []))
    } catch(e) { toast(e.message, 'error') }
    finally { setSLoad(false) }
  }, [api, toast])

  const loadMoves = useCallback(async () => {
    setMLoad(true)
    try {
      const res = await api.movements()
      setMoves(Array.isArray(res) ? res : (res?.results ?? []))
    } catch(e) { toast(e.message, 'error') }
    finally { setMLoad(false) }
  }, [api, toast])

  useEffect(() => {
    const type = searchParams.get('type')
    if (type) {
      setTab('moves')
      setMoveFilter(type)
    } else if (searchParams.get('tab') === 'moves' || tab === 'moves') {
       // Keep moves if we were already there or explicitly asked
       if (searchParams.get('tab') === 'stock') setTab('stock')
    } else {
      setTab('stock')
    }
  }, [searchParams])

  useEffect(() => { loadStock(); loadMoves() }, [loadStock, loadMoves])

  // ── Hisob-kitoblar ────────────────────────────────────────────────────────
  const lowStocks    = stocks.filter(s => s.quantity <= s.min_quantity && s.quantity > 0)
  const outStocks    = stocks.filter(s => s.quantity <= 0)
  const totalItems   = stocks.reduce((sum, s) => sum + s.quantity, 0)

  const filteredStocks = useMemo(() => {
    let list = stocks
    if (filterLow) list = list.filter(s => s.quantity <= s.min_quantity)
    if (search)    list = list.filter(s =>
      s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.product_sku?.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [stocks, filterLow, search])

  const filteredMoves = useMemo(() => {
    let list = moves
    if (moveFilter) list = list.filter(m => m.movement_type === moveFilter)
    if (search)     list = list.filter(m =>
      m.product_name?.toLowerCase().includes(search.toLowerCase())
    )
    return list
  }, [moves, moveFilter, search])

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportExcel = async () => {
    try {
      const data = filteredStocks.map(s => ({
        'Mahsulot':      s.product_name,
        'SKU':           s.product_sku || '—',
        'Miqdor (dona)': s.quantity,
        'Min. chegara':  s.min_quantity,
        'Holat':         s.quantity <= 0 ? 'Tugagan' : s.quantity <= s.min_quantity ? 'Kam' : 'Yetarli',
        'Yangilangan':   fmtDate(s.updated_at),
      }))
      const totalQty = filteredStocks.reduce((sum, s) => sum + s.quantity, 0)
      const outCount = filteredStocks.filter(s => s.quantity <= 0).length
      const lowCount = filteredStocks.filter(s => s.quantity > 0 && s.quantity <= s.min_quantity).length
      await exportBeautifulExcel('ombor-holati', [
        {
          name: 'Ombor holati',
          summary: [
            ['e-Mebel CRM — Ombor holati hisoboti'],
            ['Sana:', new Date().toLocaleDateString('uz-UZ')],
            ['Jami mahsulot turi:', filteredStocks.length],
            ['Jami dona:', totalQty],
            ['Tugagan:', outCount],
            ['Kam qolgan:', lowCount],
          ],
          columns: [
            { header: 'Mahsulot',      key: 'Mahsulot'      },
            { header: 'SKU',           key: 'SKU'           },
            { header: 'Miqdor (dona)', key: 'Miqdor (dona)' },
            { header: 'Min. chegara',  key: 'Min. chegara'  },
            { header: 'Holat',         key: 'Holat'         },
            { header: 'Yangilangan',   key: 'Yangilangan'   },
          ],
          data,
        }
      ])
      toast('Excel yuklab olindi ✅', 'success')
    } catch (e) { toast('Excel yuklab bo\'lmadi: ' + e.message, 'error') }
  }

  // ── Stock jadval ustunlari ────────────────────────────────────────────────
  const STOCK_COLS = [
    {
      key:'product_name', label:'Mahsulot',
      render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:38, height:38, borderRadius:10, flexShrink:0,
            background:`hsl(${(r.product_name?.charCodeAt(0)||0)*7%360},55%,88%)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16,
          }}>
            📦
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:13 }}>{r.product_name}</div>
            <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text3)', marginTop:1 }}>
              {r.product_sku}
            </div>
          </div>
        </div>
      ),
    },
    {
      key:'quantity', label:'Miqdor',
      render: r => {
        const c = stockColor(r.quantity, r.min_quantity)
        return (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:c.dot, flexShrink:0 }}/>
            <span style={{ fontSize:20, fontWeight:900, color:c.text }}>{r.quantity}</span>
            <span style={{ fontSize:12, color:'var(--text3)' }}>dona</span>
          </div>
        )
      },
    },
    {
      key:'progress', label:'Stok darajasi',
      render: r => {
        const c   = stockColor(r.quantity, r.min_quantity)
        const max = Math.max(r.quantity, r.min_quantity * 3, 10)
        const pct = Math.round(r.quantity / max * 100)
        return (
          <div style={{ minWidth:120 }}>
            <div style={{ height:6, background:'#e2e8f0', borderRadius:10, overflow:'hidden', marginBottom:4 }}>
              <div style={{ height:'100%', borderRadius:10, transition:'width 0.4s',
                width:`${Math.min(pct,100)}%`, background:c.dot }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:700,
              background:c.bg, color:c.text, borderRadius:100,
              padding:'2px 8px' }}>{c.label}</span>
          </div>
        )
      },
    },
    {
      key:'min_quantity', label:'Min. chegara',
      render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ color:'var(--text3)', fontWeight:600 }}>{r.min_quantity} dona</span>
          {canEdit && (
            <button title="Chegarani o'zgartirish"
              onClick={e => { e.stopPropagation(); setShowMinEdit(r) }}
              style={{ background:'none', border:'none', cursor:'pointer',
                color:'#94a3b8', padding:2, display:'flex', alignItems:'center' }}>
              <Edit2 size={11}/>
            </button>
          )}
        </div>
      ),
    },
    {
      key:'updated_at', label:'Yangilangan',
      render: r => <span style={{ color:'var(--text3)', fontSize:12 }}>{fmtDate(r.updated_at)}</span>,
    },
    {
      key:'actions', label:'',
      render: r => (
        <div style={{ display:'flex', gap:5 }} onClick={e => e.stopPropagation()}>
          <Btn size="sm" variant="ghost" onClick={() => setShowDetail(r)}>Ko'rish</Btn>
          {canEdit && (
            <Btn size="sm" variant="primary" icon={<Plus size={11}/>}
              onClick={() => setShowMove({ product: r.product_id || r.id, productName: r.product_name })}>
              Kirim
            </Btn>
          )}
        </div>
      ),
    },
  ]

  // ── Harakatlar ustunlari ──────────────────────────────────────────────────
  const MOVE_COLS = [
    {
      key:'movement_type', label:'Tur',
      render: r => {
        const cfg = {
          in:     { icon: <ArrowUpCircle size={14}/>,   label:'Kirim',    bg:'#f0fdf4', color:'#16a34a' },
          out:    { icon: <ArrowDownCircle size={14}/>, label:'Chiqim',   bg:'#fef2f2', color:'#dc2626' },
          adjust: { icon: <RotateCcw size={14}/>,       label:'Tuzatish', bg:'#eff6ff', color:'#2563eb' },
        }[r.movement_type] || { icon:'?', label:r.movement_type, bg:'#f1f5f9', color:'#64748b' }
        return (
          <span style={{ display:'flex', alignItems:'center', gap:6,
            background:cfg.bg, color:cfg.color,
            borderRadius:100, padding:'4px 10px', fontSize:11, fontWeight:700, width:'fit-content' }}>
            {cfg.icon} {cfg.label}
          </span>
        )
      },
    },
    {
      key:'product_name', label:'Mahsulot',
      render: r => <span style={{ fontWeight:600 }}>{r.product_name}</span>,
    },
    {
      key:'quantity', label:'Miqdor',
      render: r => (
        <span style={{
          fontWeight:900, fontSize:16,
          color: r.movement_type==='in' ? '#16a34a' : r.movement_type==='out' ? '#dc2626' : '#2563eb',
        }}>
          {r.movement_type==='in' ? '+' : r.movement_type==='out' ? '-' : '~'}{r.quantity}
        </span>
      ),
    },
    {
      key:'reason', label:'Sabab',
      render: r => <span style={{ color:'var(--text2)', fontSize:13 }}>{r.reason || '—'}</span>,
    },
    {
      key:'performed_by_name', label:'Kim',
      render: r => (
        <span style={{ color:'var(--text3)', fontSize:12,
          background:'var(--surface2)', borderRadius:100, padding:'3px 10px' }}>
          {r.performed_by_name || '—'}
        </span>
      ),
    },
    {
      key:'created_at', label:'Sana',
      render: r => <span style={{ color:'var(--text3)', fontSize:12 }}>{fmtDT(r.created_at)}</span>,
    },
  ]

  // ── Ko'rinish ─────────────────────────────────────────────────────────────
  const TAB_STYLE = (active) => ({
    flex:1, padding:'9px 4px', border:'none', borderRadius:9,
    fontSize:12, fontWeight:600, cursor:'pointer',
    fontFamily:'inherit', transition:'all 0.15s',
    background: active ? '#fff' : 'transparent',
    color:       active ? '#0f172a' : '#64748b',
    boxShadow:   active ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
  })

  return (
    <div>
      <PageHeader
        title="Ombor boshqaruvi"
        subtitle="Mahsulot qoldiqlari, kirim-chiqim tarixi"
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="ghost" icon={<Scan size={13}/>} size="sm" onClick={() => setShowBarcode(true)}>
              Skaner
            </Btn>
            <Btn variant="ghost" icon={<Download size={13}/>} size="sm" onClick={exportExcel}>
              Excel
            </Btn>
            {canEdit && (
              <Btn icon={<Plus size={14}/>} onClick={() => setShowMove(true)}>
                Harakat qo'shish
              </Btn>
            )}
          </div>
        }
      />

      {/* ── Stat kartalar ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        <StatCard icon="📦" label="Jami mahsulot" value={`${stocks.length} tur`}
          sub={`${fmt(totalItems)} dona`} color="#6366f1"/>
        <StatCard icon="✅" label="Yetarli" color="#22c55e"
          value={`${stocks.filter(s=>s.quantity>s.min_quantity*2).length} ta`}
          sub="Stok normal"/>
        <StatCard icon="⚠️" label="Kam qolgan" color="#f97316"
          value={`${lowStocks.length} ta`}
          sub="Zaxira kerak"
          onClick={lowStocks.length ? () => { setFilterLow(true); setTab('stock') } : null}/>
        <StatCard icon="🚨" label="Tugagan" color="#ef4444"
          value={`${outStocks.length} ta`}
          sub="Kirim zarur"
          onClick={outStocks.length ? () => { setFilterLow(true); setTab('stock') } : null}/>
      </div>

      {/* ── Ogohlantrish banneri ── */}
      {(lowStocks.length > 0 || outStocks.length > 0) && (
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'12px 16px', borderRadius:12, marginBottom:18,
          background: outStocks.length ? '#fef2f2' : '#fff7ed',
          border:`1px solid ${outStocks.length ? '#fca5a5' : '#fed7aa'}`,
        }}>
          <AlertTriangle size={18} color={outStocks.length ? '#dc2626' : '#ea580c'}/>
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:700, color: outStocks.length ? '#b91c1c' : '#c2410c' }}>
              {outStocks.length > 0
                ? `${outStocks.length} ta mahsulot tugagan!`
                : `${lowStocks.length} ta mahsulot zaxirasi kam`}
            </span>
            <span style={{ fontSize:12, color:'#94a3b8', marginLeft:8 }}>
              {outStocks.slice(0,3).map(s=>s.product_name).join(', ')}
              {outStocks.length > 3 && ` +${outStocks.length-3} ta`}
              {outStocks.length===0 && lowStocks.slice(0,3).map(s=>s.product_name).join(', ')}
            </span>
          </div>
          <Btn size="sm" variant={outStocks.length ? 'danger' : 'ghost'}
            onClick={() => { setFilterLow(true); setTab('stock') }}>
            Ko'rish
          </Btn>
        </div>
      )}

      {/* ── Tab + Filter ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, gap:12 }}>
        <div style={{ display:'flex', gap:2, background:'#f1f5f9', borderRadius:11, padding:3, flex:'0 0 340px' }}>
          <button style={TAB_STYLE(tab==='stock')} onClick={() => setTab('stock')}>
            📦 Ombor holati {lowStocks.length+outStocks.length > 0 && `(${lowStocks.length+outStocks.length} ⚠️)`}
          </button>
          <button style={TAB_STYLE(tab==='moves')} onClick={() => setTab('moves')}>
            📋 Harakatlar ({moves.length})
          </button>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flex:1, justifyContent:'flex-end' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Mahsulot nomi, SKU..."/>
          {tab==='stock' && (
            <button onClick={() => setFilterLow(v=>!v)} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 14px', borderRadius:9, border:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:12, fontWeight:600, transition:'all 0.15s',
              background: filterLow ? '#f97316' : '#f1f5f9',
              color:       filterLow ? '#fff' : '#64748b',
            }}>
              <AlertTriangle size={13}/> {filterLow ? 'Barchasi' : 'Faqat kamlar'}
            </button>
          )}
          {tab==='moves' && (
            <div style={{ display:'flex', gap:5 }}>
              {[['','Barchasi'],['in','Kirim'],['out','Chiqim'],['adjust','Tuzatish']].map(([v,l]) => (
                <button key={v} onClick={() => setMoveFilter(v)} style={{
                  padding:'7px 12px', borderRadius:8, border:'none', cursor:'pointer',
                  fontFamily:'inherit', fontSize:11, fontWeight:600,
                  background: moveFilter===v ? '#1a2540' : '#f1f5f9',
                  color:       moveFilter===v ? '#fff' : '#64748b',
                }}>{l}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Jadvallar ── */}
      <Card>
        {tab==='stock' && (
          sLoad ? <Spinner/> : (
            <Table columns={STOCK_COLS} data={filteredStocks}
              onRow={r => setShowDetail(r)}
              emptyText={filterLow ? "Kam qolgan mahsulotlar yo'q 🎉" : "Ombor bo'sh"}/>
          )
        )}
        {tab==='moves' && (
          mLoad ? <Spinner/> : (
            <Table columns={MOVE_COLS} data={filteredMoves}
              emptyText="Harakatlar yo'q"/>
          )
        )}
      </Card>

      {/* ── Modals ── */}
      {showMove && (
        <MovementModal
          initial={typeof showMove === 'object' ? showMove : null}
          onClose={() => setShowMove(false)}
          toast={toast}
          reload={() => { loadStock(); loadMoves() }}
        />
      )}
      {showMinEdit && (
        <MinQtyModal
          stock={showMinEdit}
          onClose={() => setShowMinEdit(null)}
          toast={toast}
          reload={loadStock}
        />
      )}
      {showDetail && (
        <StockDetailModal
          stock={showDetail}
          moves={moves.filter(m => m.product_name === showDetail.product_name)}
          onClose={() => setShowDetail(null)}
          onAddMove={() => {
            setShowDetail(null)
            setShowMove({ product: showDetail.product_id || showDetail.id, productName: showDetail.product_name })
          }}
          canEdit={canEdit}
        />
      )}
      {showBarcode && (
        <BarcodeModal
          stocks={stocks}
          onFound={(s) => setShowDetail(s)}
          onClose={() => setShowBarcode(false)}
        />
      )}
    </div>
  )
}

// ── Harakat qo'shish modal ────────────────────────────────────────────────────
function MovementModal({ initial, onClose, toast, reload }) {
  const { data: productsRaw } = useFetch('/products/?active=true')
  const products = Array.isArray(productsRaw) ? productsRaw : (productsRaw?.results ?? [])

  const [form, setForm] = useState({
    product:       initial?.product  || '',
    movement_type: 'in',
    quantity:      1,
    reason:        '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.product) return toast('Mahsulot tanlang', 'error')
    if (!form.quantity || Number(form.quantity) < 1)
      return toast("Miqdor 1 dan katta bo'lishi kerak", 'error')
    setSaving(true)
    try {
      await api.movementCreate({
        product:       Number(form.product),
        movement_type: form.movement_type,
        quantity:      Number(form.quantity),
        reason:        form.reason,
      })
      toast("Harakat qo'shildi ✅", 'success')
      reload(); onClose()
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const typeConfig = {
    in:     { label:'📥 Kirim',    desc:'Omborga mahsulot kiritish',      color:'#16a34a', bg:'#f0fdf4' },
    out:    { label:'📤 Chiqim',   desc:'Ombordan mahsulot chiqarish',    color:'#dc2626', bg:'#fef2f2' },
    adjust: { label:'🔧 Tuzatish', desc:'Inventarizatsiya / qayta hisob', color:'#2563eb', bg:'#eff6ff' },
  }
  const curr = typeConfig[form.movement_type]

  return (
    <Modal title="Ombor harakati" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Bekor</Btn><Btn onClick={save} loading={saving}>Saqlash</Btn></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Harakat turi */}
        <div>
          <SLabel>Harakat turi *</SLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {Object.entries(typeConfig).map(([k,v]) => (
              <button key={k} onClick={() => setForm({...form, movement_type:k})}
                style={{
                  padding:'12px 8px', border:`2px solid ${form.movement_type===k ? v.color : '#e2e8f0'}`,
                  borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700,
                  background: form.movement_type===k ? v.bg : '#fafafa',
                  color:       form.movement_type===k ? v.color : '#64748b',
                  transition:'all 0.15s', textAlign:'center',
                }}>
                {v.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop:8, padding:'8px 12px', borderRadius:8,
            background:curr.bg, fontSize:12, color:curr.color, fontWeight:600 }}>
            ℹ️ {curr.desc}
          </div>
        </div>

        {/* Mahsulot */}
        <Select label="Mahsulot *"
          value={form.product}
          onChange={e => setForm({...form, product:e.target.value})}>
          <option value="">Tanlang...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) — stok: {p.stock_quantity ?? '?'} dona
            </option>
          ))}
        </Select>

        {/* Miqdor + Sabab */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
          <Input label="Miqdor (dona) *" type="number" min="1"
            value={form.quantity}
            onChange={e => setForm({...form, quantity:e.target.value})}/>
          <Input label="Sabab (ixtiyoriy)"
            placeholder="Zavod yetkazib berdi, Buyurtma #42..."
            value={form.reason}
            onChange={e => setForm({...form, reason:e.target.value})}/>
        </div>
      </div>
    </Modal>
  )
}

// ── Min qoldiq o'zgartirish ──────────────────────────────────────────────────
function MinQtyModal({ stock, onClose, toast, reload }) {
  const [minQty, setMinQty] = useState(stock.min_quantity)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!minQty || Number(minQty) < 0) return toast("Noto'g'ri qiymat", 'error')
    setSaving(true)
    try {
      // PATCH /api/stock/<id>/ yoki /api/products/<product_id>/
      await api.patch(`/stock/${stock.id}/`, { min_quantity: Number(minQty) })
      toast('Minimal chegara yangilandi ✅', 'success')
      reload(); onClose()
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={`Min. chegara — ${stock.product_name}`} onClose={onClose} maxWidth={400}
      footer={<><Btn variant="ghost" onClick={onClose}>Bekor</Btn><Btn onClick={save} loading={saving}>Saqlash</Btn></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ padding:'12px 14px', background:'#eff6ff', borderRadius:10,
          fontSize:12, color:'#1d4ed8', fontWeight:600 }}>
          📊 Joriy miqdor: <strong>{stock.quantity} dona</strong>
          &nbsp;·&nbsp; Hozirgi chegara: <strong>{stock.min_quantity} dona</strong>
        </div>
        <Input
          label="Yangi minimal chegara (dona)"
          type="number" min="0"
          value={minQty}
          onChange={e => setMinQty(e.target.value)}
        />
        <div style={{ fontSize:12, color:'#94a3b8' }}>
          Bu qiymatdan kam bo'lsa ogohlantirish chiqadi
        </div>
      </div>
    </Modal>
  )
}

// ── Mahsulot detail modal ─────────────────────────────────────────────────────
function StockDetailModal({ stock, moves, onClose, onAddMove, canEdit }) {
  const c   = stockColor(stock.quantity, stock.min_quantity)
  const max = Math.max(stock.quantity, stock.min_quantity * 3, 10)
  const pct = Math.round(stock.quantity / max * 100)

  const totalIn  = moves.filter(m=>m.movement_type==='in').reduce((s,m)=>s+m.quantity,0)
  const totalOut = moves.filter(m=>m.movement_type==='out').reduce((s,m)=>s+m.quantity,0)

  return (
    <Modal title="" onClose={onClose} maxWidth={600}>
      {/* Header */}
      <div style={{ margin:'-20px -24px 20px',
        background:'linear-gradient(135deg,#1a2540,#2d3a5e)',
        padding:'24px 24px 20px', borderRadius:'18px 18px 0 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>
              {stock.product_sku}
            </div>
            <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:12 }}>
              {stock.product_name}
            </h2>
            {/* Stok progress */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:32, fontWeight:900, color:c.dot }}>{stock.quantity}</span>
              <div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>dona qolgan</div>
                <span style={{ background:c.bg, color:c.text, borderRadius:100,
                  padding:'3px 10px', fontSize:11, fontWeight:700 }}>{c.label}</span>
              </div>
            </div>
          </div>
          {canEdit && (
            <Btn size="sm" icon={<Plus size={12}/>} onClick={onAddMove}
              style={{ background:'rgba(255,255,255,0.12)', color:'#fff',
                borderColor:'rgba(255,255,255,0.2)', border:'1px solid' }}>
              Kirim
            </Btn>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11,
            color:'rgba(255,255,255,0.45)', marginBottom:4 }}>
            <span>0</span>
            <span>Min: {stock.min_quantity}</span>
            <span>{max}</span>
          </div>
          <div style={{ height:8, background:'rgba(255,255,255,0.1)', borderRadius:10, overflow:'hidden', position:'relative' }}>
            {/* Min chegara marker */}
            <div style={{
              position:'absolute', left:`${Math.round(stock.min_quantity/max*100)}%`,
              top:0, bottom:0, width:2, background:'rgba(255,255,255,0.4)', zIndex:1
            }}/>
            <div style={{ height:'100%', borderRadius:10,
              width:`${Math.min(pct,100)}%`, background:c.dot, transition:'width 0.5s' }}/>
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:14 }}>
          {[
            { label:'Jami kirim', value:`+${totalIn}`, color:'#6ee7b7' },
            { label:'Jami chiqim', value:`-${totalOut}`, color:'#fca5a5' },
            { label:'Harakatlar', value:`${moves.length} ta`, color:'#a5b4fc' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.07)', borderRadius:9,
              padding:'10px 12px', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Harakatlar tarixi */}
      <SLabel>Harakatlar tarixi</SLabel>
      {moves.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px', color:'#94a3b8', fontSize:13 }}>
          📋 Harakatlar yo'q
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto' }}>
          {moves.slice(0,20).map((m, i) => {
            const cfg = {
              in:     { icon:<ArrowUpCircle size={13}/>,   color:'#16a34a', sign:'+' },
              out:    { icon:<ArrowDownCircle size={13}/>, color:'#dc2626', sign:'-' },
              adjust: { icon:<RotateCcw size={13}/>,       color:'#2563eb', sign:'~' },
            }[m.movement_type] || { icon:'?', color:'#64748b', sign:'' }
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 12px', borderRadius:9, background:'#f8fafc',
                border:'1px solid #e2e8f0', fontSize:13,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:cfg.color }}>{cfg.icon}</span>
                  <div>
                    <span style={{ fontWeight:700, color:cfg.color }}>
                      {cfg.sign}{m.quantity} dona
                    </span>
                    {m.reason && (
                      <span style={{ marginLeft:8, color:'#64748b' }}>· {m.reason}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  {m.performed_by_name && (
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{m.performed_by_name}</div>
                  )}
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{fmtDT(m.created_at)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
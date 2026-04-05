import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import {
  Btn, Table, Modal, Input, Textarea, SearchInput,
  PageHeader, Card, Spinner, Badge, Empty, SLabel, Pagination,
} from '@/components/UI'
import { PhoneInput, rawPhone, isPhoneComplete, formatPhone } from '@/components/PhoneInput'
import { DeliveryAddress } from '@/components/DeliveryAddress'
import {
  Plus, Archive, ArchiveRestore, Phone, Mail, MapPin,
  Edit2, MessageSquare, User, ChevronRight,
} from 'lucide-react'

const fmt     = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtDate = d => d ? new Date(d).toLocaleDateString('uz-UZ') : '—'
const fmtDT   = d => d ? new Date(d).toLocaleString('uz-UZ', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const STATUS_LABELS = {
  new:'Yangi', pending:'Jarayonda', production:'Ishlab chiqarishda',
  ready:'Tayyor', delivered:'Yetkazildi', completed:'Yakunlandi', cancelled:'Bekor',
}

function MiniStat({ icon, label, value, color='#f97316' }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 16px',
      display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:11, background:`${color}15`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase',
          letterSpacing:'0.5px', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>{value}</div>
      </div>
    </div>
  )
}

export default function Clients() {
  const { toast, user } = useApp()
  const isWorker = user?.role === 'worker'
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]     = useState('')
  const [archived, setArchived] = useState(searchParams.get('archived') === 'true')
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [profile, setProfile]   = useState(null)
  const [editing, setEditing]   = useState(null)
  const [showNew, setShowNew]   = useState(false)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)

  const load = useCallback(async () => {
    setLoading(true); setClients([])
    try {
      const res = await api.clients({ search, archived, page })
      setClients(res.results || [])
      setTotal(res.count || 0)
    } catch(e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [search, archived, page])

  useEffect(() => {
    const a = searchParams.get('archived') === 'true'
    if (a !== archived) setArchived(a)
  }, [searchParams])

  useEffect(() => { setPage(1) }, [search, archived])
  useEffect(() => { load() }, [load])

  const archiveClient = async (c, e) => {
    e.stopPropagation()
    if (!confirm(c.is_archived ? `"${c.name}"ni arxivdan chiqarasizmi?` : `"${c.name}"ni arxivlaysizmi?`)) return
    try {
      await api.clientUpdate(c.id, { is_archived: !c.is_archived })
      toast(c.is_archived ? 'Arxivdan chiqarildi' : 'Arxivlandi', 'success')
      load()
    } catch(e) { toast(e.message, 'error') }
  }

  const COLS = [
    {
      key:'name', label:'Mijoz',
      render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:'50%', flexShrink:0,
            background:`hsl(${r.name.charCodeAt(0)*7%360},60%,48%)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:800, color:'#fff',
          }}>{r.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:13 }}>{r.name}</div>
            <div style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:3, marginTop:1 }}>
              <Phone size={9}/> {r.phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      key:'location', label:'Joylashuv',
      render: r => (
        <span style={{ color:'var(--text2)', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
          {[r.city, r.region].filter(Boolean).length
            ? <><MapPin size={10}/>{[r.city, r.region].filter(Boolean).join(', ')}</>
            : <span style={{ color:'var(--text3)' }}>—</span>}
        </span>
      ),
    },
    {
      key:'total_orders', label:'Buyurtmalar',
      render: r => (
        <span style={{ background:'var(--blue-lo)', color:'var(--blue)',
          borderRadius:100, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
          {r.total_orders ?? 0} ta
        </span>
      ),
    },
    !isWorker && {
      key:'total_spent', label:'Jami xarid',
      render: r => <span style={{ color:'var(--green)', fontWeight:700 }}>{fmt(r.total_spent)} so'm</span>,
    },
    {
      key:'created_at', label:"Qo'shilgan",
      render: r => <span style={{ color:'var(--text3)', fontSize:12 }}>{fmtDate(r.created_at)}</span>,
    },
    {
      key:'actions', label:'',
      render: r => (
        <div style={{ display:'flex', gap:5 }} onClick={e => e.stopPropagation()}>
          <Btn size="sm" variant="ghost" icon={<ChevronRight size={12}/>} onClick={() => setProfile(r)}>Ko'rish</Btn>
          {!isWorker && (
            <>
              <Btn size="sm" variant="ghost" icon={<Edit2 size={11}/>} onClick={() => setEditing(r)}/>
              <Btn size="sm" variant={r.is_archived ? 'success':'danger'}
                icon={r.is_archived ? <ArchiveRestore size={11}/> : <Archive size={11}/>}
                onClick={e => archiveClient(r,e)}/>
            </>
          )}
        </div>
      ),
    },
  ].filter(Boolean)

  const totalSpent  = clients.reduce((s,c) => s + Number(c.total_spent||0), 0)
  const totalOrders = clients.reduce((s,c) => s + Number(c.total_orders||0), 0)

  return (
    <div>
      <PageHeader
        title={archived ? 'Arxiv — Mijozlar' : 'Mijozlar'}
        subtitle={`Jami: ${clients.length} ta ${archived ? 'arxivlangan' : 'faol'} mijoz`}
        action={
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant={archived?'primary':'ghost'} icon={<Archive size={13}/>}
              onClick={() => setArchived(v=>!v)} size="sm">
              {archived ? 'Faollarni ko\'rish' : 'Arxiv'}
            </Btn>
            {!archived && <Btn icon={<Plus size={14}/>} onClick={() => setShowNew(true)}>Yangi mijoz</Btn>}
          </div>
        }
      />

      {!archived && (
        <div style={{ display:'grid', gridTemplateColumns: isWorker ? '1fr 1fr' : 'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          <MiniStat icon="👥" label="Faol mijozlar"    value={`${clients.length} ta`} color="#6366f1"/>
          <MiniStat icon="🛍️" label="Jami buyurtmalar" value={`${totalOrders} ta`}    color="#f97316"/>
          {!isWorker && <MiniStat icon="💰" label="Jami xaridlar"    value={`${fmt(totalSpent)} so'm`} color="#10b981"/>}
        </div>
      )}

      <div style={{ marginBottom:16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Ism, telefon, shahar..."/>
      </div>

      <Card>
        {loading ? <Spinner/> : (
          <>
            <Table columns={COLS} data={clients} onRow={r => setProfile(r)}
              emptyText={archived ? "Arxiv bo'sh" : "Mijozlar yo'q"}/>
            <Pagination total={total} current={page} onChange={setPage} />
          </>
        )}
      </Card>

      {showNew  && <ClientFormModal onClose={() => setShowNew(false)} toast={toast} reload={load}/>}
      {editing  && <ClientFormModal client={editing} onClose={() => setEditing(null)} toast={toast} reload={load}/>}
      {profile  && (
        <ClientProfileModal
          client={profile}
          onClose={() => setProfile(null)}
          toast={toast}
          isWorker={isWorker}
          onEdit={() => { setEditing(profile); setProfile(null) }}
          reload={load}
        />
      )}
    </div>
  )
}

// ── Mijoz profil modal ─────────────────────────────────────────────────────────
function ClientProfileModal({ client, onClose, toast, onEdit, isWorker }) {
  const [tab, setTab]           = useState('orders')
  const [orders, setOrders]     = useState([])
  const [loadingO, setLoadingO] = useState(false)
  const [msgBody, setMsgBody]   = useState('')
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    setLoadingO(true)
    api.orders({ client: client.id })
      .then(res => setOrders(Array.isArray(res) ? res : (res?.results ?? [])))
      .catch(() => {})
      .finally(() => setLoadingO(false))
  }, [client.id])

  const sendMessage = async () => {
    if (!msgBody.trim()) return
    setSending(true)
    try {
      await api.messageSend({ receiver: client.id, body: msgBody })
      toast('Xabar yuborildi ✅')
      setMsgBody(''); setTab('orders')
    } catch(e) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  const totalSpent = orders.reduce((s,o) => s + Number(o.total_amount||0), 0)
  const totalPaid  = orders.reduce((s,o) => s + Number(o.paid_amount||0), 0)
  const totalDebt  = orders.reduce((s,o) => s + Number(o.remaining_amount||0), 0)
  const avatarColor = `hsl(${client.name.charCodeAt(0)*7%360},60%,42%)`

  return (
    <Modal title="" onClose={onClose} maxWidth={660}>
      {/* Header */}
      <div style={{ margin:'-20px -24px 20px',
        background:'linear-gradient(135deg,#1a2540 0%,#2d3a5e 100%)',
        padding:'24px 24px 20px', borderRadius:'18px 18px 0 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:58, height:58, borderRadius:'50%', background:avatarColor, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, fontWeight:900, color:'#fff', border:'3px solid rgba(255,255,255,0.2)' }}>
              {client.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:5 }}>{client.name}</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                {client.phone && (
                  <a href={`tel:${client.phone}`} style={{ fontSize:12, color:'rgba(255,255,255,0.7)',
                    display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                    <Phone size={10}/>{client.phone}
                  </a>
                )}
                {client.phone2 && (
                  <a href={`tel:${client.phone2}`} style={{ fontSize:12, color:'rgba(255,255,255,0.55)',
                    display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                    <Phone size={10}/>{client.phone2}
                  </a>
                )}
                {client.email && (
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>
                    <Mail size={10}/>{client.email}
                  </span>
                )}
                {(client.city||client.region) && (
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:4 }}>
                    <MapPin size={10}/>{[client.city,client.region].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isWorker && (
            <Btn size="sm" variant="ghost" icon={<Edit2 size={12}/>} onClick={onEdit}
              style={{ color:'#fff', borderColor:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.1)' }}>
              Tahrirlash
            </Btn>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isWorker ? '1fr' : 'repeat(4,1fr)', gap:8, marginTop:16 }}>
          {isWorker ? (
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:10,
              padding:'10px 12px', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.45)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Buyurtmalar soni</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#a5b4fc' }}>{orders.length} ta</div>
            </div>
          ) : [
            { label:'Buyurtmalar', value:`${orders.length} ta`,          color:'#a5b4fc' },
            { label:'Jami xarid',  value:`${fmt(totalSpent)} so'm`,      color:'#6ee7b7' },
            { label:"To'langan",   value:`${fmt(totalPaid)} so'm`,       color:'#6ee7b7' },
            { label:'Qarz',        value: totalDebt>0 ? `${fmt(totalDebt)} so'm`:"✓ Yo'q",
              color: totalDebt>0 ? '#fca5a5':'#6ee7b7' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.08)', borderRadius:10,
              padding:'10px 12px', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.45)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:13, fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, background:'#f1f5f9', borderRadius:10, padding:3, marginBottom:16 }}>
        {[
          { key:'orders',  label:`🛍️ Buyurtmalar (${orders.length})` },
          { key:'info',    label:"📋 Ma'lumotlar" },
          { key:'message', label:'💬 Xabar' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:'8px 4px', border:'none', borderRadius:8,
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              background: tab===t.key ? '#fff':'transparent',
              color:       tab===t.key ? '#0f172a':'#64748b',
              boxShadow:   tab===t.key ? '0 2px 6px rgba(0,0,0,0.08)':'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ORDERS */}
      {tab === 'orders' && (
        loadingO ? <Spinner/> : orders.length === 0 ? <Empty icon="🛍️" text="Buyurtmalar yo'q"/> : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {orders.map(o => {
              const debt  = Number(o.remaining_amount||0)
              const paid  = Number(o.paid_amount||0)
              const total = Number(o.total_amount||0)
              const pct   = total > 0 ? Math.round(paid/total*100) : 0
              return (
                <div key={o.id} style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px',
                  border:'1px solid #e2e8f0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <span style={{ fontFamily:'monospace', color:'var(--accent)', fontWeight:700, fontSize:13 }}>
                        #{o.order_number}
                      </span>
                      <span style={{ marginLeft:8, fontSize:11, color:'#94a3b8' }}>{fmtDT(o.created_at)}</span>
                    </div>
                    <div style={{ display:'flex', gap:5 }}>
                      <Badge status={o.status}/>
                      <Badge status={o.payment_status}/>
                    </div>
                  </div>
                  {o.items?.length > 0 && (
                    <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>
                      {o.items.slice(0,3).map(it=>it.product_name).join(', ')}
                      {o.items.length>3 && ` +${o.items.length-3} ta`}
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                    {!isWorker && <span style={{ color:'#64748b' }}>{fmt(paid)} / {fmt(total)} so'm</span>}
                    {!isWorker && (
                      <span style={{ fontWeight:700, color: debt>0 ? '#ef4444':'#10b981' }}>
                        {debt>0 ? `Qarz: ${fmt(debt)} so'm`:"✓ To'liq"}
                      </span>
                    )}
                  </div>
                  {!isWorker && (
                    <div style={{ height:4, background:'#e2e8f0', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:10, width:`${pct}%`,
                        background: pct===100 ? '#10b981':'linear-gradient(90deg,#f97316,#f59e0b)',
                        transition:'width 0.5s' }}/>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* INFO */}
      {tab === 'info' && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {[
            [User,   'Ism familiya',      client.name],
            [Phone,  'Asosiy telefon',    client.phone],
            [Phone,  "Qo'shimcha tel",    client.phone2||'—'],
            [Mail,   'Email',             client.email||'—'],
            [MapPin, 'Viloyat / Tuman / MFY', [client.region,client.district,client.mfy].filter(Boolean).join(' → ')||'—'],
            [MapPin, "Shahar / Ko'cha",   [client.city,client.address].filter(Boolean).join(', ')||'—'],
          ].map(([Icon,label,value]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:12,
              padding:'11px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'#f8fafc',
                border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={12} color="#64748b"/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:1 }}>{label}</div>
                <div style={{ fontSize:13, color:'#0f172a', fontWeight:500 }}>{value}</div>
              </div>
            </div>
          ))}
          {client.notes && (
            <div style={{ padding:'12px 0' }}>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Izoh</div>
              <div style={{ fontSize:13, color:'#475569', background:'#f8fafc',
                padding:'10px 14px', borderRadius:9, border:'1px solid #e2e8f0', lineHeight:1.6 }}>
                {client.notes}
              </div>
            </div>
          )}
          <div style={{ paddingTop:10, fontSize:12, color:'#94a3b8' }}>
            Qo'shilgan: {fmtDT(client.created_at)}
          </div>
        </div>
      )}

      {/* MESSAGE */}
      {tab === 'message' && (
        <div>
          <div style={{ marginBottom:12, padding:'10px 14px', background:'#f0fdf4',
            border:'1px solid #bbf7d0', borderRadius:9, fontSize:12, color:'#15803d' }}>
            💬 <strong>{client.name}</strong> ga xabar yuboriladi
          </div>
          <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)}
            placeholder="Xabar matni..." rows={5}
            style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #e2e8f0',
              background:'#fafafa', fontSize:14, color:'#0f172a', outline:'none',
              fontFamily:'inherit', resize:'vertical', lineHeight:1.6, boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor='#e2e8f0'}
          />
          <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
            <Btn icon={<MessageSquare size={13}/>} onClick={sendMessage}
              loading={sending} disabled={!msgBody.trim()}>Yuborish</Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Forma modal ────────────────────────────────────────────────────────────────
function ClientFormModal({ client, onClose, toast, reload }) {
  const [form, setForm] = useState({
    name:     client?.name     ?? '',
    phone:    client?.phone    ? formatPhone(client.phone) : '+998(',
    phone2:   client?.phone2   ? formatPhone(client.phone2) : '+998(',
    email:    client?.email    ?? '',
    region:   client?.region   ?? '',
    district: client?.district ?? '',
    mfy:      client?.mfy      ?? '',
    city:     client?.city     ?? '',
    address:  client?.address  ?? '',
    notes:    client?.notes    ?? '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrors(p => ({...p,[k]:''})) }

  const save = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Ism kiritilishi shart'
    if (!isPhoneComplete(form.phone)) e.phone = "To'liq kiriting: +998(XX) XXX-XX-XX"
    if (form.phone2 && form.phone2 !== '+998(' && !isPhoneComplete(form.phone2))
      e.phone2 = "To'liq kiriting yoki bo'sh qoldiring"
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        phone:  rawPhone(form.phone),
        phone2: form.phone2 && form.phone2 !== '+998(' ? rawPhone(form.phone2) : '',
      }
      if (client) await api.clientUpdate(client.id, payload)
      else        await api.clientCreate(payload)
      toast(client ? 'Yangilandi ✅' : "Qo'shildi ✅", 'success')
      reload(); onClose()
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={client ? `Tahrirlash — ${client.name}` : 'Yangi mijoz'} onClose={onClose} maxWidth={580}
      footer={<><Btn variant="ghost" onClick={onClose}>Bekor</Btn><Btn onClick={save} loading={saving}>{client?'Saqlash':"Qo'shish"}</Btn></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Asosiy */}
        <Input label="Ism familiya *" placeholder="Abdullayev Sarvar"
          value={form.name} onChange={e => set('name', e.target.value)} error={errors.name}/>

        {/* Telefonlar */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <PhoneInput label="Telefon *"
            value={form.phone}
            onChange={v => set('phone', v)}
            error={errors.phone}
          />
          <PhoneInput label="Qo'shimcha tel"
            value={form.phone2}
            onChange={v => set('phone2', v)}
            error={errors.phone2}
          />
        </div>

        <Input label="Email" type="email" placeholder="email@example.com"
          value={form.email} onChange={e => set('email', e.target.value)}/>

        {/* Manzil — DeliveryAddress komponenti */}
        <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 14px 8px' }}>
          <SLabel>📍 Manzil (Viloyat → Tuman → MFY)</SLabel>
          <DeliveryAddress
            value={{ region:form.region, district:form.district, mfy:form.mfy, address:form.address }}
            onChange={(field, val) => {
              const key = field.replace('delivery_', '')
              set(key, val)
            }}
          />
          <div style={{ marginTop:10 }}>
            <Input label="Shahar" placeholder="Toshkent"
              value={form.city} onChange={e => set('city', e.target.value)}/>
          </div>
        </div>

        <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot..."
          value={form.notes} onChange={e => set('notes', e.target.value)}/>
      </div>
    </Modal>
  )
}
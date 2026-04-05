import { useState, useCallback } from 'react'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { useFetch } from '@/hooks/useFetch'
import {
  Btn, Modal, Input, Textarea, PageHeader, Card, Spinner, Empty, SLabel,
} from '@/components/UI'
import { Plus, Edit2, Trash2, Tag, Package } from 'lucide-react'

export default function Categories() {
  const { toast, user } = useApp()
  const { data: raw, loading, refetch } = useFetch('/categories/')
  const cats = Array.isArray(raw) ? raw : (raw?.results ?? [])

  const [showNew, setShowNew]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const canEdit = ['admin', 'manager'].includes(user?.role)

  const deleteCategory = async (c) => {
    if (!confirm(`"${c.name}" kategoriyasini o'chirasizmi?`)) return
    try {
      await api.categoryDelete(c.id)
      toast("O'chirildi ✅", 'success')
      refetch()
    } catch(e) { toast(e.message, 'error') }
  }

  return (
    <div>
      <PageHeader
        title="Kategoriyalar"
        subtitle={`Jami: ${cats.length} ta`}
        action={canEdit && (
          <Btn icon={<Plus size={14}/>} onClick={() => setShowNew(true)}>
            Yangi kategoriya
          </Btn>
        )}
      />

      {loading ? (
        <Card><Spinner/></Card>
      ) : cats.length === 0 ? (
        <Card><Empty icon="🏷️" text="Kategoriyalar yo'q"/></Card>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {cats.map(c => (
            <div key={c.id} style={{
              background:'#fff', borderRadius:14, border:'1px solid #e2e8f0',
              padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
              transition:'box-shadow 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.09)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}
            >
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:11,
                    background:'#f0f4ff', border:'1px solid #c7d2fe',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Tag size={18} color="#6366f1"/>
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, color:'#0f172a' }}>{c.name}</div>
                    {c.slug && (
                      <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:1 }}>
                        /{c.slug}
                      </div>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => setEditing(c)} title="Tahrirlash"
                      style={{ padding:'6px', borderRadius:8, border:'1px solid #e2e8f0',
                        background:'#f8fafc', cursor:'pointer', color:'#6366f1',
                        display:'flex', alignItems:'center' }}>
                      <Edit2 size={13}/>
                    </button>
                    <button onClick={() => deleteCategory(c)} title="O'chirish"
                      style={{ padding:'6px', borderRadius:8, border:'1px solid #fee2e2',
                        background:'#fff5f5', cursor:'pointer', color:'#ef4444',
                        display:'flex', alignItems:'center' }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                )}
              </div>

              {c.description && (
                <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6, margin:0,
                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical' }}>
                  {c.description}
                </p>
              )}

              <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #f1f5f9',
                display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#94a3b8' }}>
                <Package size={11}/>
                <span>ID: {c.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew  && <CategoryModal onClose={() => setShowNew(false)} toast={toast} reload={refetch}/>}
      {editing  && <CategoryModal category={editing} onClose={() => setEditing(null)} toast={toast} reload={refetch}/>}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function CategoryModal({ category, onClose, toast, reload }) {
  const [form, setForm] = useState({
    name:        category?.name        ?? '',
    description: category?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const save = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Nom kiritilishi shart' }); return }
    setSaving(true)
    try {
      if (category) await api.categoryUpdate(category.id, form)
      else          await api.categoryCreate(form)
      toast(category ? 'Yangilandi ✅' : "Qo'shildi ✅", 'success')
      reload(); onClose()
    } catch(e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal
      title={category ? `Tahrirlash — ${category.name}` : 'Yangi kategoriya'}
      onClose={onClose}
      maxWidth={440}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Bekor</Btn>
          <Btn onClick={save} loading={saving}>{category ? 'Saqlash' : "Qo'shish"}</Btn>
        </>
      }
    >
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input
          label="Kategoriya nomi *"
          placeholder="Masalan: Divonlar, Stollar..."
          value={form.name}
          onChange={e => { setForm(p=>({...p,name:e.target.value})); setErrors({}) }}
          error={errors.name}
        />
        <Textarea
          label="Tavsif"
          placeholder="Qo'shimcha ma'lumot..."
          value={form.description}
          onChange={e => setForm(p=>({...p,description:e.target.value}))}
          rows={3}
        />
      </div>
    </Modal>
  )
}
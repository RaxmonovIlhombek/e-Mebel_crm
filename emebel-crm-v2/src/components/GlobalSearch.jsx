/**
 * GlobalSearch.jsx
 * Ctrl+K bilan ochiluvchi global qidiruv modali
 * Buyurtmalar, mijozlar, mahsulotlar qidiradi
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { Search, X, ShoppingBag, Users, Package, ArrowRight, Loader } from 'lucide-react'

const CATEGORIES = [
  { key: 'orders',   label: 'Buyurtmalar', icon: ShoppingBag, color: '#6366f1' },
  { key: 'clients',  label: 'Mijozlar',    icon: Users,       color: '#10b981' },
  { key: 'products', label: 'Mahsulotlar', icon: Package,     color: '#f97316' },
]

function useDebounce(val, delay) {
  const [debounced, setDebounced] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(val), delay)
    return () => clearTimeout(t)
  }, [val, delay])
  return debounced
}

export function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useApp()
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState({ orders: [], clients: [], products: [] })
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const debouncedQ = useDebounce(query, 280)

  // Focus input on open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults({ orders: [], clients: [], products: [] })
      setActiveIdx(0)
    }
  }, [searchOpen])

  // Search
  useEffect(() => {
    if (!debouncedQ.trim() || debouncedQ.length < 2) {
      setResults({ orders: [], clients: [], products: [] })
      return
    }
    setLoading(true)
    Promise.allSettled([
      api.orders({ search: debouncedQ }),
      api.clients({ search: debouncedQ, archived: false }),
      api.products({ search: debouncedQ }),
    ]).then(([orders, clients, products]) => {
      const get = r => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : (r.value?.results ?? [])) : []
      setResults({
        orders:   get(orders).slice(0, 5),
        clients:  get(clients).slice(0, 4),
        products: get(products).slice(0, 4),
      })
    }).finally(() => setLoading(false))
  }, [debouncedQ])

  // Flat list for keyboard nav
  const flatItems = [
    ...results.orders.map(o => ({ type: 'orders', item: o,
      label: `#${o.order_number} — ${o.client_name || ''}`,
      sub: `${Number(o.total_amount||0).toLocaleString('uz-UZ')} so'm`,
      link: '/orders', })),
    ...results.clients.map(c => ({ type: 'clients', item: c,
      label: c.name, sub: c.phone,
      link: '/clients', })),
    ...results.products.map(p => ({ type: 'products', item: p,
      label: p.name, sub: `${Number(p.selling_price||0).toLocaleString('uz-UZ')} so'm · ${p.sku}`,
      link: '/products', })),
  ]

  const go = useCallback((link) => {
    navigate(link)
    setSearchOpen(false)
  }, [navigate, setSearchOpen])

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i+1, flatItems.length-1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)) }
    if (e.key === 'Enter' && flatItems[activeIdx]) go(flatItems[activeIdx].link)
    if (e.key === 'Escape') setSearchOpen(false)
  }

  if (!searchOpen) return null

  const total = flatItems.length
  const hasResults = total > 0
  const showEmpty  = debouncedQ.length >= 2 && !loading && !hasResults

  return (
    <div
      onClick={() => setSearchOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in-scale"
        style={{
          width: '100%', maxWidth: 620,
          background: 'var(--surface)', borderRadius: 18,
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden', margin: '0 16px',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: hasResults || showEmpty ? '1px solid var(--border)' : 'none',
        }}>
          {loading
            ? <Loader size={18} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', flexShrink:0 }}/>
            : <Search size={18} color="var(--text3)" style={{ flexShrink: 0 }}/>
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKey}
            placeholder="Qidirish... (buyurtma, mijoz, mahsulot)"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 16, color: 'var(--text)', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <kbd style={{
              padding: '2px 7px', borderRadius: 5, fontSize: 11,
              background: 'var(--surface2)', color: 'var(--text3)',
              border: '1px solid var(--border2)', fontFamily: 'inherit',
            }}>Esc</kbd>
            <button onClick={() => setSearchOpen(false)}
              style={{ background: 'none', border: 'none', padding: 4,
                color: 'var(--text3)', cursor: 'pointer', borderRadius: 6,
                display: 'flex', alignItems: 'center' }}>
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Results */}
        {hasResults && (
          <div style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>
            {CATEGORIES.map(cat => {
              const items = results[cat.key]
              if (!items.length) return null
              const Icon = cat.icon
              return (
                <div key={cat.key}>
                  <div style={{
                    padding: '6px 18px', fontSize: 10, fontWeight: 700,
                    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>
                    {cat.label}
                  </div>
                  {items.map((item) => {
                    const fi = flatItems.findIndex(f => f.type === cat.key && f.item.id === item.id)
                    const isActive = fi === activeIdx
                    const fItem = flatItems[fi]
                    return (
                      <div
                        key={item.id}
                        onClick={() => go(fItem.link)}
                        onMouseEnter={() => setActiveIdx(fi)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 18px', cursor: 'pointer', transition: 'background 0.1s',
                          background: isActive ? 'var(--surface2)' : 'transparent',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: `${cat.color}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={14} color={cat.color}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {fItem.label}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                            {fItem.sub}
                          </div>
                        </div>
                        {isActive && <ArrowRight size={14} color="var(--text3)"/>}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>"{query}" bo'yicha natija topilmadi</div>
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div style={{
            padding: '18px 18px', display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            {[['↑↓', 'Navigatsiya'], ['↵', 'Ochish'], ['Esc', 'Yopish']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                <kbd style={{ padding: '2px 7px', borderRadius: 5, fontSize: 11,
                  background: 'var(--surface2)', border: '1px solid var(--border2)', fontFamily: 'inherit' }}>
                  {key}
                </kbd>
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
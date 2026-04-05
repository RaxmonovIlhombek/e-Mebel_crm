import { createContext, useState, useCallback, useEffect, useRef } from 'react'
import { api } from '@/api/client'
import { useWebSocket } from '@/hooks/useWebSocket'

const AppContext = createContext(null)

export const NOTIF_TYPES = {
  new_order:     { icon: '🛍️', color: '#6366f1', label: 'Yangi buyurtma'  },
  overdue:       { icon: '⏰', color: '#ef4444', label: 'Kechikkan'        },
  payment:       { icon: '💰', color: '#10b981', label: "To'lov qilindi"   },
  low_stock:     { icon: '📦', color: '#f97316', label: 'Kam qoldiq'       },
  status_change: { icon: '🔄', color: '#3b82f6', label: "Holat o'zgardi"   },
  message:       { icon: '💬', color: '#8b5cf6', label: 'Yangi xabar'      },
  system:        { icon: '⚙️', color: '#94a3b8', label: 'Tizim'            },
}

// ── Toast popup komponenti (AppContext ichida) ────────────────────────────────
function NotifToast({ notif, onClose }) {
  const cfg = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        display:'flex', alignItems:'flex-start', gap:10,
        padding:'12px 14px', borderRadius:12, cursor:'pointer',
        background:'#fff', boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
        border:`1px solid ${cfg.color}30`,
        minWidth:260, maxWidth:340,
        animation:'slideInRight 0.3s ease',
      }}>
      <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
        background:`${cfg.color}15`, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:16 }}>
        {cfg.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#0f172a',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {notif.title}
        </div>
        {notif.body && (
          <div style={{ fontSize:12, color:'#64748b', marginTop:2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {notif.body}
          </div>
        )}
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>
          {new Date().toLocaleTimeString('uz-UZ', {hour:'2-digit', minute:'2-digit'})}
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onClose() }}
        style={{ background:'none', border:'none', cursor:'pointer',
          color:'#94a3b8', padding:0, display:'flex', alignItems:'center', flexShrink:0 }}>
        ✕
      </button>
    </div>
  )
}

// ── WebSocket + Notification ichki hook ──────────────────────────────────────
function useNotifications(user, toast) {
  const [notifications, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_notifs') || '[]') }
    catch { return [] }
  })
  const [unreadCount, setUnreadCount]   = useState(0)
  const [wsConnected, setWsConnected]   = useState(false)
  const [notifToasts, setNotifToasts]   = useState([])   // real-time popup toasts

  // Token localStorage'dan olamiz
  const token = user ? localStorage.getItem('crm_token') : null

  // ── WebSocket xabar handleri ─────────────────────────────────────────────
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        setWsConnected(true)
        setUnreadCount(data.unread_count || 0)
        break

      case 'notification': {
        const n = { ...data.notification, read: data.notification.is_read }
        // State ga qo'shamiz
        setNotifs(prev => {
          // Duplicate check
          if (prev.find(p => p.id === n.id)) return prev
          const updated = [n, ...prev].slice(0, 50)
          localStorage.setItem('crm_notifs', JSON.stringify(updated))
          return updated
        })
        // Popup toast chiqaramiz
        const toastId = Date.now()
        setNotifToasts(prev => [...prev, { ...n, toastId }])
        break
      }

      case 'list': {
        const list = (data.notifications || []).map(n => ({ ...n, read: n.is_read }))
        setNotifs(list)
        localStorage.setItem('crm_notifs', JSON.stringify(list))
        setUnreadCount(list.filter(n => !n.is_read).length)
        break
      }

      case 'marked_read':
        setNotifs(prev => {
          const updated = data.id === 'all'
            ? prev.map(n => ({ ...n, is_read: true, read: true }))
            : prev.map(n => n.id === data.id ? { ...n, is_read: true, read: true } : n)
          localStorage.setItem('crm_notifs', JSON.stringify(updated))
          return updated
        })
        break

      case 'all_read':
        setNotifs(prev => {
          const updated = prev.map(n => ({ ...n, is_read: true, read: true }))
          localStorage.setItem('crm_notifs', JSON.stringify(updated))
          return updated
        })
        setUnreadCount(0)
        break

      default:
        break
    }
  }, [])

  const { send } = useWebSocket({
    token,
    enabled: !!user,
    onMessage: handleWsMessage,
  })

  // ── Unread count sinxi ───────────────────────────────────────────────────
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.is_read && !n.read).length)
  }, [notifications])

  // ── WS disconnect bo'lsa — localStorage'dan qayta yuklaymiz ─────────────
  useEffect(() => {
    if (!user) {
      setNotifs([])
      setUnreadCount(0)
      setWsConnected(false)
    }
  }, [user])

  // ── API metodlar ─────────────────────────────────────────────────────────
  const addNotif = useCallback((notif) => {
    const n = { id: Date.now() + Math.random(), is_read:false, read:false,
      time: new Date().toISOString(), created_at: new Date().toISOString(), ...notif }
    setNotifs(prev => {
      const updated = [n, ...prev].slice(0, 50)
      localStorage.setItem('crm_notifs', JSON.stringify(updated))
      return updated
    })
    // Popup toast
    const toastId = Date.now()
    setNotifToasts(prev => [...prev, { ...n, toastId }])
  }, [])

  const markRead = useCallback((id) => {
    if (wsConnected) {
      send({ action: id === 'all' ? 'mark_all_read' : 'mark_read', id })
    } else {
      // Offline fallback
      setNotifs(prev => {
        const updated = id === 'all'
          ? prev.map(n => ({ ...n, is_read:true, read:true }))
          : prev.map(n => n.id === id ? { ...n, is_read:true, read:true } : n)
        localStorage.setItem('crm_notifs', JSON.stringify(updated))
        return updated
      })
    }
    // REST API orqali ham saqlaymiz
    api.notifMarkRead(id).catch(() => {})
  }, [wsConnected, send])

  const clearNotifs = useCallback(() => {
    setNotifs([])
    localStorage.removeItem('crm_notifs')
    api.notifClear().catch(() => {})
  }, [])

  const dismissNotifToast = useCallback((toastId) => {
    setNotifToasts(prev => prev.filter(t => t.toastId !== toastId))
  }, [])

  // ── Polling fallback (WebSocket yo'q bo'lsa) ─────────────────────────────
  const pollRef      = useRef(null)
  const lastCheckRef = useRef(localStorage.getItem('crm_last_check') || null)

  const pollNotifications = useCallback(async () => {
    if (!user || wsConnected) return
    try {
      const data = await api.dashboard()
      const newOrders = data.recent_orders?.filter(o => {
        const created = new Date(o.created_at).getTime()
        const last    = lastCheckRef.current ? new Date(lastCheckRef.current).getTime() : 0
        return created > last && o.status === 'new'
      }) || []
      newOrders.forEach(o => addNotif({
        type:'new_order', title:'Yangi buyurtma!',
        body:`#${o.order_number} — ${o.client_name||'Mijoz'} · ${Number(o.total_amount||0).toLocaleString('uz-UZ')} so'm`,
        link:'/orders',
      }))
      lastCheckRef.current = new Date().toISOString()
      localStorage.setItem('crm_last_check', lastCheckRef.current)
    } catch (_) {}
  }, [user, wsConnected, addNotif])

  useEffect(() => {
    if (!user) { clearInterval(pollRef.current); return }
    pollNotifications()
    pollRef.current = setInterval(pollNotifications, 30_000)
    return () => clearInterval(pollRef.current)
  }, [user, pollNotifications])

  return {
    notifications, unreadCount, wsConnected,
    addNotif, markRead, clearNotifs,
    notifToasts, dismissNotifToast,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// AppProvider
// ═════════════════════════════════════════════════════════════════════════════
export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_user') || 'null') }
    catch { return null }
  })
  const [toasts, setToasts] = useState([])

  // ── Dark mode ─────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('crm_theme') || 'light')
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('crm_theme', next)
      return next
    })
  }, [])
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('crm_sidebar') === 'collapsed'
  )
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(v => {
      const next = !v
      localStorage.setItem('crm_sidebar', next ? 'collapsed' : 'open')
      return next
    })
  }, [])

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); setSearchOpen(v => !v)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800)
  }, [])

  // ── Notifications + WebSocket ─────────────────────────────────────────────
  const {
    notifications, unreadCount, wsConnected,
    addNotif, markRead, clearNotifs,
    notifToasts, dismissNotifToast,
  } = useNotifications(user, toast)

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials)
    api.setToken(data.token)
    localStorage.setItem('crm_user', JSON.stringify(data.user))
    localStorage.setItem('crm_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    api.logout().catch(() => {})
    api.setToken('')
    localStorage.removeItem('crm_user')
    localStorage.removeItem('crm_token')
    setUser(null)
  }, [])

  return (
    <AppContext.Provider value={{
      user, login, logout, toast, toasts,
      notifications, unreadCount, markRead, clearNotifs, addNotif,
      wsConnected,
      theme, toggleTheme,
      sidebarCollapsed, toggleSidebar,
      searchOpen, setSearchOpen,
    }}>
      {children}

      {/* ── Real-time bildirishnoma popup'lar ── */}
      {notifToasts.length > 0 && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:9999,
          display:'flex', flexDirection:'column', gap:8,
          pointerEvents:'none',
        }}>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(120%); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
          `}</style>
          {notifToasts.map(n => (
            <div key={n.toastId} style={{ pointerEvents:'all' }}>
              <NotifToast
                notif={n}
                onClose={() => dismissNotifToast(n.toastId)}
              />
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  )
}

export { AppContext }
import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useApp'
import { NOTIF_TYPES } from '@/context/AppContext'
import { Bell, X, CheckCheck, Trash2, ExternalLink } from 'lucide-react'

// ── Bell tugmasi (Sidebar yoki Header da ishlatilinadi) ───────────────────────
export function NotifBell({ style }) {
  const { unreadCount, wsConnected } = useApp()
  return (
    <div style={{ position: 'relative', display: 'inline-flex', ...style }}>
      <Bell size={18} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          background: '#ef4444', color: '#fff',
          fontSize: 9, fontWeight: 800,
          width: 16, height: 16, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--sidebar-bg)',
          animation: 'notif-pulse 2s infinite',
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      {/* WebSocket ulanish indikatori */}
      <span style={{
        position:'absolute', bottom:-2, right:-2,
        width:7, height:7, borderRadius:'50%',
        background: wsConnected ? '#22c55e' : '#94a3b8',
        border:'1.5px solid var(--sidebar-bg)',
        transition:'background 0.4s',
      }} title={wsConnected ? 'Real-time ulanish faol' : 'Offline rejim'}/>
    </div>
  )
}

// ── Vaqt formatlash ───────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Hozir'
  if (m < 60) return `${m} daqiqa oldin`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} soat oldin`
  return `${Math.floor(h / 24)} kun oldin`
}

// ── Asosiy panel ─────────────────────────────────────────────────────────────
export function NotificationPanel({ onClose }) {
  const { notifications, markRead, clearNotifs, unreadCount, wsConnected, sidebarCollapsed } = useApp()
  const navigate = useNavigate()
  const panelRef = useRef(null)

  // Outside click — yopish
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleClick = (n) => {
    markRead(n.id)
    if (n.link) { navigate(n.link); onClose() }
  }

  return (
    <div ref={panelRef} style={{
      position: 'fixed', left: sidebarCollapsed ? 'var(--sidebar-w-mini)' : 'var(--sidebar-w)', bottom: 80,
      width: 340, background: '#fff',
      borderRadius: 16, border: '1px solid #e2e8f0',
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      zIndex: 9000, overflow: 'hidden',
      animation: 'notif-slide 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        background: 'linear-gradient(135deg, #f8fafc, #fff)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={15} color="#0f172a" />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
            Bildirishnomalar
          </span>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444', color: '#fff',
              fontSize: 10, fontWeight: 800,
              padding: '1px 6px', borderRadius: 20,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {unreadCount > 0 && (
            <button onClick={() => markRead('all')} title="Barchasini o'qildi deb belgilash"
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#6366f1', padding: 5, borderRadius: 7,
                display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f0ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <CheckCheck size={14} />
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearNotifs} title="Tozalash"
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', padding: 5, borderRadius: 7,
                display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: 5, borderRadius: 7,
              display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Bildirishnomalar yo'q
            </div>
          </div>
        ) : (
          notifications.map(n => {
            const meta = NOTIF_TYPES[n.type] || NOTIF_TYPES.system
            return (
              <div key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid #f8fafc',
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.read ? '#fff' : `${meta.color}06`,
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = n.read ? '#f8fafc' : `${meta.color}10`}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : `${meta.color}06`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <div style={{
                    position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 6, height: 6, borderRadius: '50%', background: meta.color,
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: `${meta.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 12, fontWeight: n.read ? 600 : 800,
                      color: '#0f172a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                      {timeAgo(n.time)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11, color: '#64748b', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {n.body}
                  </div>
                  {n.link && (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, color: meta.color, fontWeight: 600 }}>
                      <ExternalLink size={9} /> Ko'rish
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #f1f5f9',
          background: '#fafafa', textAlign: 'center',
          fontSize: 11, color: '#94a3b8',
        }}>
          Jami {notifications.length} ta bildirishnoma
        </div>
      )}

      <style>{`
        @keyframes notif-slide {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes notif-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
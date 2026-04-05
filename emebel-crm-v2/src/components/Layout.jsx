import { useState } from 'react'
import { NotifBell, NotificationPanel } from '@/components/NotificationPanel'
import { GlobalSearch } from '@/components/GlobalSearch'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useApp'
import {
  LayoutDashboard, Package, Users, ShoppingBag, Tag,
  Warehouse, MessageSquare, LogOut, ChevronDown,
  BarChart2, Sparkles, UserPlus, ScanLine,
  ClipboardList, Archive, ArrowDownCircle,
  ArrowUpCircle, BoxesIcon, CreditCard, AlertCircle,
  FileBarChart2, LineChart, Search, Moon, Sun, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

const ROLE_NAV = {
  admin: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { icon: ShoppingBag, label: 'Buyurtmalar', key: 'orders', children: [
      { to: '/orders',                   icon: ClipboardList,  label: 'Barcha buyurtmalar'  },
      { to: '/orders?status=new',        icon: ShoppingBag,    label: 'Yangi buyurtmalar'   },
      { to: '/orders?status=production', icon: Package,        label: 'Ishlab chiqarishda'  },
      { to: '/orders?status=ready',      icon: BoxesIcon,      label: 'Tayyor / Yetkazildi' },
      { to: '/orders?status=cancelled',  icon: Archive,        label: 'Arxiv'               },
    ]},
    { icon: Users, label: 'Mijozlar', key: 'clients', children: [
      { to: '/clients',               icon: Users,   label: 'Barcha mijozlar' },
      { to: '/clients?archived=true', icon: Archive, label: 'Arxivlangan'     },
    ]},
    { icon: Package, label: 'Mahsulotlar', key: 'products', children: [
      { to: '/products',   icon: Package, label: 'Barcha mahsulotlar' },
      { to: '/categories', icon: Tag,     label: 'Kategoriyalar'      },
    ]},
    { icon: Warehouse, label: 'Ombor', key: 'warehouse', children: [
      { to: '/warehouse',          icon: BoxesIcon,       label: 'Qoldiqlar' },
      { to: '/barcode',            icon: ScanLine,        label: 'Barcode'   },
      { to: '/warehouse?type=in',  icon: ArrowDownCircle, label: 'Kirim'     },
      { to: '/warehouse?type=out', icon: ArrowUpCircle,   label: 'Chiqim'    },
    ]},
    { icon: BarChart2, label: 'Moliya', key: 'finance', children: [
      { to: '/finance',              icon: FileBarChart2, label: 'Umumiy hisobot'   },
      { to: '/finance?tab=payments', icon: CreditCard,    label: "To'lovlar tarixi" },
      { to: '/finance?tab=debts',    icon: AlertCircle,   label: 'Qarzlar'          },
    ]},
    { to: '/analytics', icon: LineChart, label: 'Analytics' },
    { icon: Users, label: 'Xodimlar', key: 'staff', children: [
      { to: '/staff',     icon: Users,    label: 'Xodimlar' },
    ]},
    { to: '/ai',       icon: Sparkles,      label: 'AI Yordamchi' },
    { to: '/messages', icon: MessageSquare, label: 'Xabarlar'     },
  ],

  manager: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { icon: ShoppingBag, label: 'Buyurtmalar', key: 'orders', children: [
      { to: '/orders',                   icon: ClipboardList, label: 'Barcha buyurtmalar'  },
      { to: '/orders?status=new',        icon: ShoppingBag,   label: 'Yangi buyurtmalar'   },
      { to: '/orders?status=production', icon: Package,       label: 'Ishlab chiqarishda'  },
      { to: '/orders?status=ready',      icon: BoxesIcon,     label: 'Tayyor / Yetkazildi' },
    ]},
    { icon: Users, label: 'Mijozlar', key: 'clients', children: [
      { to: '/clients',               icon: Users,   label: 'Barcha mijozlar' },
      { to: '/clients?archived=true', icon: Archive, label: 'Arxivlangan'     },
    ]},
    { icon: Package, label: 'Mahsulotlar', key: 'products', children: [
      { to: '/products',   icon: Package, label: 'Barcha mahsulotlar' },
      { to: '/categories', icon: Tag,     label: 'Kategoriyalar'      },
    ]},
    { icon: Users, label: 'Xodimlar', key: 'staff', children: [
      { to: '/staff',     icon: Users,    label: 'Xodimlar' },
    ]},
    { to: '/analytics', icon: LineChart,     label: 'Analytics'    },
    { to: '/ai',        icon: Sparkles,      label: 'AI Yordamchi' },
    { to: '/messages',  icon: MessageSquare, label: 'Xabarlar'     },
  ],

  accountant: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { icon: ShoppingBag, label: 'Buyurtmalar', key: 'orders', children: [
      { to: '/orders',            icon: ClipboardList, label: 'Barcha buyurtmalar' },
      { to: '/orders?status=new', icon: ShoppingBag,   label: 'Yangi buyurtmalar'  },
    ]},
    { icon: BarChart2, label: 'Moliya', key: 'finance', children: [
      { to: '/finance',              icon: FileBarChart2, label: 'Umumiy hisobot'   },
      { to: '/finance?tab=payments', icon: CreditCard,    label: "To'lovlar tarixi" },
      { to: '/finance?tab=debts',    icon: AlertCircle,   label: 'Qarzlar'          },
    ]},
    { to: '/analytics', icon: LineChart,     label: 'Analytics'    },
    { to: '/ai',        icon: Sparkles,      label: 'AI Yordamchi' },
    { to: '/messages',  icon: MessageSquare, label: 'Xabarlar'     },
  ],

  worker: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { icon: ShoppingBag, label: 'Buyurtmalar', key: 'orders', children: [
      { to: '/orders',                   icon: ClipboardList, label: 'Barcha buyurtmalar'  },
      { to: '/orders?status=production', icon: Package,       label: 'Ishlab chiqarishda'  },
      { to: '/orders?status=ready',      icon: BoxesIcon,     label: 'Tayyor / Yetkazildi' },
    ]},
    { icon: Package, label: 'Mahsulotlar', key: 'products', children: [
      { to: '/products',   icon: Package, label: 'Barcha mahsulotlar' },
      { to: '/categories', icon: Tag,     label: 'Kategoriyalar'      },
    ]},
    { icon: Warehouse, label: 'Ombor', key: 'warehouse', children: [
      { to: '/warehouse',          icon: BoxesIcon,       label: 'Qoldiqlar' },
      { to: '/barcode',            icon: ScanLine,        label: 'Barcode'   },
      { to: '/warehouse?type=in',  icon: ArrowDownCircle, label: 'Kirim'     },
      { to: '/warehouse?type=out', icon: ArrowUpCircle,   label: 'Chiqim'    },
    ]},
    { to: '/messages', icon: MessageSquare, label: 'Xabarlar' },
  ],

  client: [
    { to: '/products', icon: Package,       label: 'Mahsulotlar' },
    { icon: ShoppingBag, label: 'Buyurtmalarim', key: 'orders', children: [
      { to: '/orders',                  icon: ClipboardList, label: 'Barcha buyurtmalar' },
      { to: '/orders?status=new',       icon: ShoppingBag,   label: 'Yangi'              },
      { to: '/orders?status=delivered', icon: BoxesIcon,     label: 'Yetkazilganlar'     },
    ]},
    { to: '/messages', icon: MessageSquare, label: 'Xabarlar' },
  ],
}

const ROLE_LABELS = {
  admin: 'Admin', manager: 'Menejer', accountant: 'Buxgalter',
  worker: 'Omborchi', client: 'Mijoz',
}

// ── Nav items ─────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, depth = 0, collapsed }) {
  const loc    = useLocation()
  
  let active = false;
  if (to === '/') {
    active = loc.pathname === '/'
  } else if (to.includes('?')) {
    active = loc.pathname + loc.search === to
  } else {
    const baseUrl = to.split('?')[0]
    if (loc.pathname === baseUrl) {
      active = loc.search === ''
    } else {
      active = loc.pathname.startsWith(baseUrl + '/')
    }
  }

  return (
    <NavLink to={to} style={{ textDecoration: 'none' }} title={collapsed && depth === 0 ? label : undefined}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
        padding: depth > 0 ? '7px 12px 7px 36px' : collapsed ? '10px 0' : '9px 12px',
        justifyContent: collapsed && depth === 0 ? 'center' : 'flex-start',
        borderRadius: 8, marginBottom: 1,
        color:      active ? '#fff' : depth > 0 ? 'rgba(255,255,255,0.5)' : 'var(--sidebar-text)',
        background: active ? (depth > 0 ? 'rgba(21,101,192,0.2)' : 'rgba(21,101,192,0.22)') : 'transparent',
        borderLeft: active ? '2px solid #1565C0' : '2px solid transparent',
        fontSize:   depth > 0 ? 12.5 : 13.5, fontWeight: active ? 700 : 400,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff' }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=depth>0?'rgba(255,255,255,0.5)':'var(--sidebar-text)' }}}
      >
        {depth > 0
          ? <span style={{ width:5, height:5, borderRadius:'50%', flexShrink:0,
              background: active ? '#1565C0' : 'rgba(255,255,255,0.3)' }}/>
          : <Icon size={15} style={{ flexShrink:0 }}/>
        }
        {!collapsed && (
          <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {label}
          </span>
        )}
      </div>
    </NavLink>
  )
}

function NavGroup({ item, collapsed }) {
  const loc     = useLocation()
  const Icon    = item.icon
  const hasActive = item.children?.some(c => loc.pathname.startsWith(c.to.split('?')[0]))
  const [open, setOpen] = useState(hasActive)

  // Collapsed mode: tooltip style
  if (collapsed) {
    return (
      <div title={item.label} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '10px 0', borderRadius: 8, marginBottom: 1,
          color: hasActive ? '#fff' : 'var(--sidebar-text)',
          background: hasActive ? 'rgba(21,101,192,0.22)' : 'transparent',
          borderLeft: hasActive ? '2px solid #1565C0' : '2px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { if (!hasActive) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff' }}}
          onMouseLeave={e => { if (!hasActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--sidebar-text)' }}}
          onClick={() => setOpen(v => !v)}
        >
          <Icon size={15}/>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8, marginBottom: 1,
        color: hasActive ? '#fff' : 'var(--sidebar-text)',
        background: hasActive ? 'rgba(21,101,192,0.15)' : 'transparent',
        fontSize: 13.5, fontWeight: hasActive ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
      }}
        onMouseEnter={e => { if (!hasActive) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff' }}}
        onMouseLeave={e => { if (!hasActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--sidebar-text)' }}}
      >
        <Icon size={15} style={{ flexShrink: 0 }}/>
        <span style={{ flex: 1 }}>{item.label}</span>
        <ChevronDown size={13} style={{ flexShrink:0, transform: open?'rotate(180deg)':'rotate(0deg)', transition:'transform 0.22s', opacity:0.5 }}/>
      </div>
      <div style={{ overflow:'hidden', maxHeight: open ? `${(item.children?.length||0)*40}px`:'0px', transition:'max-height 0.25s ease' }}>
        {item.children?.map(child => (
          <NavItem key={child.to} to={child.to} icon={child.icon} label={child.label} depth={1} collapsed={false}/>
        ))}
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { user, logout, theme, toggleTheme, sidebarCollapsed, toggleSidebar, setSearchOpen } = useApp()
  const navigate    = useNavigate()
  const nav         = ROLE_NAV[user?.role] || ROLE_NAV.client
  const [showNotif, setShowNotif] = useState(false)
  const initials    = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()
  const fullName    = user?.first_name ? `${user.first_name} ${user.last_name||''}`.trim() : user?.username
  const w           = sidebarCollapsed ? 'var(--sidebar-w-mini)' : 'var(--sidebar-w)'

  return (
    <aside className="sidebar-transition" style={{
      width: w, minWidth: w, maxWidth: w,
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100vh',
      position: 'sticky', top: 0, overflow: 'hidden',
    }}>

      {/* Logo + collapse toggle */}
      <div style={{
        padding: '12px 10px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        minHeight: 72,
      }}>
        {!sidebarCollapsed && (
          <img src="/logo (2).png" alt="e-Mebel CRM"
            style={{ height: 44, width: 'auto', objectFit: 'contain', maxWidth: 160 }}/>
        )}
        <button onClick={toggleSidebar} title={sidebarCollapsed ? "Kengaytirish" : "Yig'ish"}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
            padding: 7, cursor: 'pointer', color: 'var(--sidebar-text)', display: 'flex',
            alignItems: 'center', flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.color='#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='var(--sidebar-text)' }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={15}/> : <PanelLeftClose size={15}/>}
        </button>
      </div>

      {/* Search button */}
      {!sidebarCollapsed && (
        <div style={{ padding: '8px 10px 0' }}>
          <button onClick={() => setSearchOpen(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.4)' }}
          >
            <Search size={13}/>
            <span style={{ flex: 1, textAlign: 'left' }}>Qidirish...</span>
            <kbd style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>Ctrl K</kbd>
          </button>
        </div>
      )}

      {/* Collapsed search icon */}
      {sidebarCollapsed && (
        <div style={{ padding: '8px 10px 0', display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setSearchOpen(true)} title="Qidirish (Ctrl+K)"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
              padding: 8, cursor: 'pointer', color: 'var(--sidebar-text)', display: 'flex' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='var(--sidebar-text)' }}
          >
            <Search size={15}/>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map(item =>
          item.children
            ? <NavGroup key={item.key} item={item} collapsed={sidebarCollapsed}/>
            : <NavItem  key={item.to}  {...item}   collapsed={sidebarCollapsed}/>
        )}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '0 10px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Dark mode toggle */}
        <button onClick={toggleTheme} title={theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: sidebarCollapsed ? 0 : 10,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? '9px 0' : '9px 12px',
            borderRadius: 8, background: 'rgba(255,255,255,0.05)',
            border: 'none', cursor: 'pointer',
            color: 'var(--sidebar-text)', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='var(--sidebar-text)' }}
        >
          {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
          {!sidebarCollapsed && (
            <span style={{ fontSize: 13 }}>{theme === 'dark' ? "Yorug' rejim" : "Qorong'u rejim"}</span>
          )}
        </button>

        {/* Notifications — kompakt tugma, nav item emas */}
        <div style={{ position: 'relative', display:'flex', padding: sidebarCollapsed ? '2px 0' : '2px 12px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <button onClick={() => setShowNotif(v => !v)}
            title="Bildirishnomalar"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 8,
              background: showNotif ? 'rgba(21,101,192,0.18)' : 'transparent',
              border: `1px solid ${showNotif ? 'rgba(21,101,192,0.35)' : 'transparent'}`,
              cursor: 'pointer',
              color: showNotif ? '#1565C0' : 'rgba(255,255,255,0.5)',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!showNotif) { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)' }}}
            onMouseLeave={e => { if (!showNotif) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='transparent' }}}
          >
            <NotifBell/>
            {!sidebarCollapsed && <span style={{ fontSize: 12.5, fontWeight: 500 }}>Bildirishnomalar</span>}
          </button>
          {showNotif && <NotificationPanel onClose={() => setShowNotif(false)}/>}
        </div>
      </div>

      {/* User block */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)' }}>
        <div onClick={() => navigate('/profile')} title={sidebarCollapsed ? fullName : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            gap: sidebarCollapsed ? 0 : 10,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? '8px 0' : '10px 12px',
            borderRadius: 10, background: 'rgba(255,255,255,0.07)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.13)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
        >
          <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#1565C0,#0D47A1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:700, color:'#fff' }}>
            {initials}
          </div>
          {!sidebarCollapsed && (
            <>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fullName}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)',
                  textTransform:'uppercase', letterSpacing:'0.8px' }}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); logout() }} title="Chiqish"
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)',
                  padding:4, borderRadius:6, cursor:'pointer', display:'flex' }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}
              >
                <LogOut size={15}/>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export function Shell({ children }) {
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar/>
      <GlobalSearch/>
      <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
        <div style={{ padding:'28px 32px', animation:'fadeIn 0.2s ease' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
/**
 * KeyboardShortcuts.jsx
 * "?" tugmasi bilan ochiluvchi keyboard shortcuts yo'riqnomasi
 * AppContext orqali global shortcuts boshqariladi
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useApp'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { group: 'Navigatsiya', items: [
    { keys: ['Ctrl', 'K'],  desc: 'Global qidiruv' },
    { keys: ['?'],           desc: 'Shortcuts oynasi' },
    { keys: ['G', 'D'],     desc: 'Dashboard' },
    { keys: ['G', 'O'],     desc: 'Buyurtmalar' },
    { keys: ['G', 'C'],     desc: 'Mijozlar' },
    { keys: ['G', 'P'],     desc: 'Mahsulotlar' },
    { keys: ['G', 'F'],     desc: 'Moliya' },
    { keys: ['G', 'N'],     desc: 'Analytics' },
    { keys: ['G', 'M'],     desc: 'Xabarlar' },
    { keys: ['G', 'W'],     desc: 'Ombor' },
  ]},
  { group: 'Amallar', items: [
    { keys: ['N'],           desc: "Yangi buyurtma (Orders sahifasida)" },
    { keys: ['Esc'],         desc: "Modalni yopish / Qidiruvni yopish" },
    { keys: ['Ctrl', 'P'],  desc: 'Chop etish (hisob-faktura)' },
  ]},
  { group: 'Interfeys', items: [
    { keys: ['Ctrl', 'B'],  desc: 'Sidebarni yig\'ish/kengaytirish' },
    { keys: ['Ctrl', 'L'],  desc: "Dark/Light rejim almashtirish" },
  ]},
]

function Kbd({ children }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 26, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: 'var(--surface2)', color: 'var(--text2)',
      border: '1px solid var(--border2)',
      boxShadow: '0 2px 0 var(--border2)',
      fontFamily: 'var(--mono)',
    }}>
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsModal({ open, onClose }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} className="fade-in-scale" style={{
        width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: 18,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden', margin: '0 16px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Keyboard size={18} color="var(--accent)"/>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Klaviatura yorliqlari
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
            color: 'var(--text3)', cursor: 'pointer', borderRadius: 6, padding: 4,
            display: 'flex', alignItems: 'center' }}>
            <X size={16}/>
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '16px 22px 22px' }}>
          {SHORTCUTS.map(group => (
            <div key={group.group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.items.map(item => (
                  <div key={item.desc} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8, background: 'var(--surface2)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{item.desc}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {item.keys.map((k, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Kbd>{k}</Kbd>
                          {i < item.keys.length - 1 && (
                            <span style={{ fontSize: 10, color: 'var(--text3)' }}>+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Global keyboard handler hook ──────────────────────────────────────────────
export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { setSearchOpen, toggleSidebar, toggleTheme } = useApp()
  const [showHelp, setShowHelp] = useState(false)
  const gMode = { current: false }

  useEffect(() => {
    let gPressed = false
    let gTimer   = null

    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      const inInput = ['input','textarea','select'].includes(tag)

      // Ctrl+K — search (AppContext handles)
      // Ctrl+B — sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }
      // Ctrl+L — dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        toggleTheme()
        return
      }

      if (inInput) return

      // ? — help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(v => !v)
        return
      }
      // Esc — close help
      if (e.key === 'Escape') {
        setShowHelp(false)
        return
      }
      // G + key — navigate
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true
        clearTimeout(gTimer)
        gTimer = setTimeout(() => { gPressed = false }, 800)
        return
      }
      if (gPressed) {
        gPressed = false
        clearTimeout(gTimer)
        const map = { d:'/', o:'/orders', c:'/clients', p:'/products', f:'/finance', m:'/messages', w:'/warehouse', a:'/ai', s:'/staff', n:'/analytics' }
        const dest = map[e.key.toLowerCase()]
        if (dest) { e.preventDefault(); navigate(dest) }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, setSearchOpen, toggleSidebar, toggleTheme])

  return { showHelp, setShowHelp }
}
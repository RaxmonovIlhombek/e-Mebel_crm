import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { Btn } from '@/components/UI'
import { Sparkles, Send, FileText, Lightbulb, MessageSquare, RefreshCw, Download, Mic, MicOff, CheckCircle2, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { exportBeautifulExcel } from '@/utils/excelExport'

const API_BASE = '/api'

async function askAI(message, mode, history, token) {
  const res = await fetch(`${API_BASE}/ai/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
    body: JSON.stringify({ message, mode, history }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Xato yuz berdi')
  return data
}

const QUICK = [
  { icon: '📊', text: "Bu oylik hisobotni tayyorla",          mode: 'report' },
  { icon: '💰', text: "Umumiy moliyaviy holat qanday?",       mode: 'chat'   },
  { icon: '⚠️', text: "Kechikkan buyurtmalar bormi?",         mode: 'chat'   },
  { icon: '📦', text: "Qaysi mahsulotlar kamayib ketgan?",    mode: 'advice' },
  { icon: '👥', text: "Eng faol mijozlar kimlar?",            mode: 'chat'   },
  { icon: '✅', text: "Bugun nima qilish kerak — tavsiyalar", mode: 'advice' },
]

const ALERT_STYLE = {
  danger:  { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
}

// ── Matnni bloklarga ajratish ─────────────────────────────────────────────────
function parseAIContent(text) {
  if (!text) return []
  const blocks = []
  const lines  = text.split('\n')
  let tableLines = [], inTable = false

  const flushTable = () => {
    if (tableLines.length >= 2) blocks.push({ type: 'table', lines: [...tableLines] })
    tableLines = []; inTable = false
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('|')) { inTable = true; tableLines.push(line); continue }
    else if (inTable) flushTable()

    if (!line)                      { blocks.push({ type: 'spacer' }); continue }
    if (line.startsWith('### '))    { blocks.push({ type: 'h3', text: line.slice(4) }); continue }
    if (line.startsWith('## '))     { blocks.push({ type: 'h2', text: line.slice(3) }); continue }
    if (line.startsWith('# '))      { blocks.push({ type: 'h1', text: line.slice(2) }); continue }

    if (/^[✅❌⚠️📌🔴🟡🟢📦💰👥🆕➡️•\-\*]\s/.test(line)) {
      blocks.push({ type: 'listitem', text: line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[\-\*]\s/, '• ') }); continue
    }
    if (/^\d+\.\s/.test(line)) {
      blocks.push({ type: 'listitem', text: line.replace(/\*\*(.*?)\*\*/g, '$1') }); continue
    }
    blocks.push({ type: 'text', text: line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/#{1,3}\s/g, '') })
  }
  if (inTable) flushTable()
  return blocks
}

// ── Jadval satrlarini parse qilish ────────────────────────────────────────────
function parseTableLines(lines) {
  const rows = lines.filter(l => !/^\|[\s\-:|]+\|$/.test(l))
  const parseRow = r =>
    r.split('|').map(c => c.trim().replace(/\*\*(.*?)\*\*/g, '$1'))
     .filter((_, i, a) => i !== 0 && i !== a.length - 1)
  if (!rows.length) return { headers: [], body: [] }
  return { headers: parseRow(rows[0]), body: rows.slice(1).map(parseRow) }
}

// ── SheetJS yordamida Excel export (AI hisoboti uchun)──────────────────────
async function exportToExcel(aiText, reportTitle) {
  const blocks  = parseAIContent(aiText)
  const tables  = blocks.filter(b => b.type === 'table')
  const sheets  = []

  // ─ 1-varaq: Asosiy matn xulosa ───────────────────────────────────────────────────
  const infoRows = [
    [reportTitle],
    ['Sana', new Date().toLocaleDateString('uz-UZ')],
    ['Tizim', 'e-Mebel CRM'],
    [],
  ]
  for (const b of blocks) {
    if (b.type === 'spacer') { infoRows.push([]); continue }
    if (b.type === 'table')  continue
    if (['h1','h2','h3'].includes(b.type)) { infoRows.push([b.text.toUpperCase()]); continue }
    infoRows.push([b.text || ''])
  }
  sheets.push({
    name: 'Hisobot',
    summary: infoRows,
    columns: [],
    data: [],
  })

  // ─ Har bir jadval uchun alohida varaq ────────────────────────────────────
  tables.forEach((tb, idx) => {
    const tbIdx = blocks.indexOf(tb)
    let sheetName = `Jadval ${idx + 1}`
    for (let j = tbIdx - 1; j >= 0; j--) {
      if (['h1','h2','h3'].includes(blocks[j].type)) {
        sheetName = blocks[j].text.slice(0, 31); break
      }
    }
    const { headers, body } = parseTableLines(tb.lines)
    if (!headers.length) return
    sheets.push({
      name: sheetName,
      columns: headers.map(h => ({ header: h, key: h })),
      data: body.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))),
    })
  })

  // Agar jadval yo'q bo'lsa — matnni ham varaq sifatida
  if (!tables.length) {
    const textRows = []
    for (const b of blocks) {
      if (b.type === 'spacer') { textRows.push([]); continue }
      if (b.type === 'text' || b.type === 'listitem') textRows.push([b.text])
    }
    if (textRows.length) {
      sheets.push({ name: 'Tafsilot', summary: textRows, columns: [], data: [] })
    }
  }

  await exportBeautifulExcel('emebel-hisobot', sheets)
}

// ── Jadval komponenti ─────────────────────────────────────────────────────────
function TableBlock({ lines }) {
  const { headers, body } = parseTableLines(lines)
  if (!headers.length) return null
  return (
    <div style={{ overflowX: 'auto', margin: '10px 0', borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#1a2540' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '9px 14px', textAlign: 'left',
                fontWeight: 700, color: '#fff',
                whiteSpace: 'nowrap', fontSize: 12,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f9fafb' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '8px 14px', color: '#374151',
                  borderBottom: '1px solid #f3f4f6', fontSize: 13,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Formatlangan javob ────────────────────────────────────────────────────────
function FormattedContent({ text }) {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--text)' }}>
      {parseAIContent(text).map((b, i) => {
        if (b.type === 'spacer')   return <div key={i} style={{ height: 6 }} />
        if (b.type === 'table')    return <TableBlock key={i} lines={b.lines} />
        if (b.type === 'h1')       return <div key={i} style={{ fontSize: 17, fontWeight: 900, color: '#111', margin: '16px 0 6px' }}>{b.text}</div>
        if (b.type === 'h2')       return (
          <div key={i} style={{
            fontSize: 14, fontWeight: 800, color: '#1f2937',
            margin: '14px 0 6px', padding: '6px 12px',
            background: '#f8fafc', borderLeft: '3px solid var(--accent)',
            borderRadius: '0 6px 6px 0',
          }}>{b.text}</div>
        )
        if (b.type === 'h3')       return <div key={i} style={{ fontSize: 13.5, fontWeight: 700, color: '#374151', margin: '10px 0 3px' }}>{b.text}</div>
        if (b.type === 'listitem') return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', color: '#374151' }}>
            <span style={{ flexShrink: 0 }}>{b.text[0]}</span>
            <span>{b.text.slice(b.text[1] === ' ' ? 2 : 1)}</span>
          </div>
        )
        return <p key={i} style={{ margin: '2px 0', color: '#374151' }}>{b.text}</p>
      })}
    </div>
  )
}

// ── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ action, onExecute }) {
  const { toast } = useApp()
  const [status, setStatus] = useState('pending') // pending, loading, success, error
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)

  const handleRun = async () => {
    setStatus('loading')
    try {
      if (action.type === 'SEND_BROADCAST') {
        const { target, body } = action.data
        if (target === 'staff') {
          const res = await api.users({ active: 'true' })
          const users = res.results || []
          const staff = users.filter(u => u.role !== 'client')
          setTotal(staff.length)
          
          let count = 0
          for (const u of staff) {
            await api.messageSend({ receiver: u.id, body })
            count++
            setProgress(count)
          }
        }
      }
      setStatus('success')
      toast("Xabarlar muvaffaqiyatli yuborildi", "success")
      if (onExecute) onExecute()
    } catch (e) {
      setStatus('error')
      toast("Xabar yuborishda xatolik: " + e.message, "error")
    }
  }

  const isBcast = action.type === 'SEND_BROADCAST'

  return (
    <div style={{
      marginTop: 12, padding: 14, borderRadius: 12,
      background: 'rgba(249,115,22,0.03)', border: '1.5px dashed rgba(249,115,22,0.3)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ padding: 6, borderRadius: 8, background: 'rgba(249,115,22,0.1)', color: 'var(--accent)' }}>
          <MessageSquare size={16}/>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {isBcast ? "Xodimlarga xabar yuborish taklifi" : "Harakat taklifi"}
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text2)', background: '#fff', padding: 10, borderRadius: 8, marginBottom: 12, border: '1px solid #f1f5f9' }}>
        {action.data.body}
      </div>

      {status === 'pending' && (
        <button onClick={handleRun} style={{
          width: '100%', padding: '9px', borderRadius: 8,
          background: 'var(--accent)', color: '#fff',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 12px rgba(249,115,22,0.2)'
        }}>
          Tasdiqlash va Yuborish
        </button>
      )}

      {status === 'loading' && (
        <div style={{
          padding: '9px', borderRadius: 8, background: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12.5, fontWeight: 500, color: 'var(--text2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={16} className="spin" style={{ color: 'var(--accent)' }}/>
            Yuborilmoqda...
          </div>
          <div>{progress} / {total}</div>
        </div>
      )}

      {status === 'success' && (
        <div style={{
          padding: '9px', borderRadius: 8, background: '#f0fdf4',
          color: '#166534', fontSize: 12.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: '1px solid #bbf7d0'
        }}>
          <CheckCircle2 size={16}/>
          Muvaffaqiyatli yuborildi
        </div>
      )}

      {status === 'error' && (
        <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
          Xatolik yuz berdi. Qayta urinib ko'ring.
        </div>
      )}
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
function AlertBadge({ alert }) {
  const s = ALERT_STYLE[alert.type] || ALERT_STYLE.info
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 14px', borderRadius: 10,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 13, color: s.color, fontWeight: 500,
    }}>
      <span>{alert.icon}</span><span>{alert.text}</span>
    </div>
  )
}

// ── Typing effect hook ──────────────────────────────────────────────────────
function useTypeWriter(text, speed = 12, enabled = true) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!enabled || !text) { setDisplayed(text); setDone(true); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const t = setInterval(() => {
      setDisplayed(prev => text.slice(0, i + 1))
      i++
      if (i >= text.length) { clearInterval(t); setDone(true) }
    }, speed)
    return () => clearInterval(t)
  }, [text, speed, enabled])

  return { displayed, done }
}

function Bubble({ msg, isLast }) {
  const isUser   = msg.role === 'user'
  const isReport = !isUser && msg.mode === 'report'
  const [exporting, setExporting] = useState(false)

  // Faqat oxirgi AI javobi uchun "typing" effekti
  const { displayed, done } = useTypeWriter(msg.content, 10, !isUser && isLast && !msg.alreadyTyped)

  useEffect(() => { if (done && isLast) msg.alreadyTyped = true }, [done, isLast, msg])

  const handleExport = async () => {
    setExporting(true)
    try { await exportToExcel(msg.content, 'e-Mebel CRM Hisobot') }
    catch (e) { alert('Export xatosi: ' + e.message) }
    finally { setExporting(false) }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16, animation: 'fadeIn 0.2s ease',
    }}>
      {!isUser && (
        <div className="glow-icon" style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 10, marginTop: 2, fontSize: 18,
          boxShadow: '0 0 15px rgba(249,115,22,0.4)',
        }}>✨</div>
      )}
      <div style={{
        maxWidth: isReport ? '92%' : '78%',
        padding: isUser ? '11px 16px' : '15px 20px',
        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        background: isUser ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.88)',
        backdropFilter: isUser ? 'none' : 'blur(10px)',
        color: isUser ? '#fff' : 'var(--text)',
        boxShadow: isUser ? '0 10px 25px -5px rgba(249,115,22,0.4)' : '0 4px 20px -5px rgba(0,0,0,0.1)',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.5)',
        position: 'relative'
      }}>
        {isUser
          ? <span style={{ fontSize: 14, lineHeight: 1.6 }}>{msg.content}</span>
          : <FormattedContent text={displayed} />
        }

        {/* Excel tugmasi — faqat hisobot uchun */}
        {isReport && (
          <button onClick={handleExport} disabled={exporting} style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, cursor: exporting ? 'wait' : 'pointer',
            background: exporting ? '#f3f4f6' : 'rgba(6,95,70,0.05)',
            color: exporting ? '#9ca3af' : '#059669',
            border: `1.5px solid ${exporting ? '#e5e7eb' : 'rgba(16,185,129,0.3)'}`,
            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          }}>
            <Download size={14}/>
            {exporting ? 'Tayyorlanmoqda...' : '📥 Excel (.xlsx) yuklab olish'}
          </button>
        )}

        {!isUser && msg.mode && msg.mode !== 'chat' && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.05)',
            fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            {msg.mode === 'report' ? <><FileText size={11}/> Hisobot rejimi</> : <><Lightbulb size={11}/> Tavsiya rejimi</>}
          </div>
        )}

        {!isUser && msg.actions?.map((act, idx) => (
          <ActionCard key={idx} action={act} />
        ))}
      </div>
      {isUser && (
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: '#f1f5f9', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginLeft: 10, marginTop: 2, fontSize: 15, color: '#64748b',
          border: '1px solid #e2e8f0'
        }}>👤</div>
      )}
    </div>
  )
}

function Typing() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #f97316, #ea580c)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginRight: 10, fontSize: 16,
      }}>✨</div>
      <div style={{
        padding: '14px 18px', borderRadius: '18px 18px 18px 4px',
        background: '#fff', border: '1px solid var(--border)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
            animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite`,
          }}/>
        ))}
      </div>
    </div>
  )
}

function ModeBtn({ active, icon: Icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
      background: active ? 'var(--accent)' : '#fff',
      color: active ? '#fff' : 'var(--text2)',
      border: active ? 'none' : '1.5px solid var(--border2)',
      boxShadow: active ? '0 4px 12px rgba(249,115,22,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'all 0.15s', fontSize: 13, fontWeight: 600,
    }}>
      <Icon size={15}/>
      <div style={{ textAlign: 'left' }}>
        <div>{label}</div>
        {!active && <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>{desc}</div>}
      </div>
    </button>
  )
}

// ── Asosiy sahifa ─────────────────────────────────────────────────────────────
export default function AIPage() {
  const { user, toast } = useApp()
  const token = localStorage.getItem('crm_token') || ''
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [mode, setMode]         = useState('chat')
  const [loading, setLoading]   = useState(false)
  const [alerts, setAlerts]     = useState([])
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Voice Recognition
  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { toast("Brauzerda ovozli qidiruv mavjud emas", "error"); return }
    const rec = new SpeechRecognition()
    rec.lang = 'uz-UZ'
    rec.onstart = () => setIsListening(true)
    rec.onend = () => setIsListening(false)
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInput(text)
    }
    rec.start()
  }

  const loadAlerts = useCallback(async () => {
    try {
      const res = await askAI('Ogohlantirishlar', 'advice', [], token)
      if (res.alerts?.length) setAlerts(res.alerts)
    } catch {}
  }, [token])

  useEffect(() => { loadAlerts() }, [loadAlerts])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text, sendMode) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const m = sendMode || mode
    setMessages(prev => [...prev, { role: 'user', content: msg, mode: m }])
    setLoading(true)
    try {
      const history = messages.slice(-10).map(x => ({ role: x.role, content: x.content }))
      const res = await askAI(msg, m, history, token)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.answer, 
        mode: m,
        actions: res.actions 
      }])
      if (res.alerts?.length) setAlerts(res.alerts)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Xato: ${e.message}` }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
          }}>✨</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.4px' }}>AI Yordamchi</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Hisobotlar · Tavsiyalar · Chat — real CRM ma'lumotlari asosida
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={13}/>} onClick={() => setMessages([])}>
            Tozalash
          </Btn>
        )}
      </div>

      {/* Ogohlantirishlar */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
          {alerts.map((a, i) => <AlertBadge key={i} alert={a}/>)}
        </div>
      )}

      {/* Rejimlar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <ModeBtn active={mode==='chat'}   icon={MessageSquare} label="Suhbat"  desc="Savollar"    onClick={() => setMode('chat')}/>
        <ModeBtn active={mode==='report'} icon={FileText}      label="Hisobot" desc="Excel export" onClick={() => setMode('report')}/>
        <ModeBtn active={mode==='advice'} icon={Lightbulb}     label="Tavsiya" desc="Takliflar"    onClick={() => setMode('advice')}/>
      </div>

      {/* Chat */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: 0,
        background: '#fff', borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: 20, marginBottom: 12,
      }}>
        {isEmpty ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>
              Salom, {user?.first_name || user?.username}!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, textAlign: 'center', lineHeight: 1.7 }}>
              CRM ma'lumotlariga asoslanib javob beraman.<br/>
              <strong>Hisobot</strong> rejimida natija <strong>Excel .xlsx</strong> formatida yuklanadi.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, width: '100%', maxWidth: 520 }}>
              {QUICK.map((q, i) => (
                <button key={i} onClick={() => send(q.text, q.mode)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                  background: 'var(--surface2)', border: '1.5px solid var(--border)',
                  textAlign: 'left', transition: 'all 0.15s',
                  fontSize: 12.5, color: 'var(--text2)', fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.background='#fff7ed'; e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{q.icon}</span>
                  <span style={{ lineHeight: 1.4 }}>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {messages.map((m, i) => <Bubble key={i} msg={m} isLast={i === messages.length - 1} />)}
            {loading && <Typing/>}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-end',
        background: '#fff', borderRadius: 20,
        border: '1.5px solid var(--border2)',
        padding: '10px 10px 10px 18px',
        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.08)', transition: 'all 0.15s',
      }}
      className="ai-input-wrapper"
      >
        <button onClick={startVoice} title="Ovozli qidiruv" style={{
          background: 'none', border: 'none', cursor: 'pointer', paddingBottom: 8,
          color: isListening ? 'var(--accent)' : '#94a3b8',
          animation: isListening ? 'pulse 1.2s infinite' : 'none',
        }}>
          {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
        </button>

        <textarea ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={
            mode==='report' ? "Hisobot turini ayting..." :
            mode==='advice' ? "Maslahat kerakmi?..." :
            "AI yordamchidan so'rang..."
          }
          rows={1}
          style={{
            flex: 1, background: 'none', border: 'none', color: 'var(--text)',
            fontSize: 14, resize: 'none', lineHeight: 1.5, padding: '8px 0',
            maxHeight: 120, overflowY: 'auto', outline: 'none'
          }}
          onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
        />
        <button onClick={() => send()} disabled={!input.trim() || loading} style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: !input.trim()||loading ? '#f1f5f9' : 'var(--accent)',
          color: !input.trim()||loading ? '#94a3b8' : '#fff',
          border: 'none', cursor: !input.trim()||loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          boxShadow: input.trim()&&!loading ? '0 10px 15px -3px rgba(249,115,22,0.4)' : 'none',
        }}>
          {loading
            ? <div style={{ width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            : <Send size={18}/>
          }
        </button>
      </div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:7 }}>
        Hisobot rejimida har bir jadval Excel da alohida varaqda chiqadi
      </div>
    </div>
    
  )

}
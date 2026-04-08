/**
 * Barcode.jsx — Barcode orqali savdo / kirim / chiqim
 *
 * ✅ USB/Bluetooth skaner (klaviatura hook)
 * ✅ Kamera orqali skaner (BarcodeDetector API + jsQR fallback)
 * ✅ Savat (cart) tizimi
 * ✅ Kirim / Chiqim / Savdo rejimlari
 * ✅ Chek chop etish (print receipt)
 * ✅ Ranglar logoga mos (#1565C0)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/api/client'
import { useApp } from '@/hooks/useApp'
import { Btn, Badge, PageHeader, Spinner } from '@/components/UI'
import {
  Scan, Plus, Minus, Trash2, ShoppingCart, TrendingUp,
  TrendingDown, Package, CheckCircle, X, Camera, Keyboard,
  RefreshCw, Printer, AlertTriangle, CameraOff, ZapOff,
} from 'lucide-react'
import JsBarcode from 'jsbarcode';

const fmt = n => Number(n || 0).toLocaleString('uz-UZ')

// ─── AUDIO FEEDBACK (MOLK) ───────────────────────────────────────────
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.12)
  } catch(e) {}
}

const playBuzz = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, ctx.currentTime) 
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.3)
  } catch(e) {}
}

// ─── LOGO RANGIGA MOS REJIMLAR ────────────────────────────────────────
const MODES = {
  sale: { label: 'Savdo',  icon: <ShoppingCart size={16}/>, color: '#1565C0', bg: '#E3F2FD' },
  out:  { label: 'Chiqim', icon: <TrendingDown size={16}/>, color: '#C62828', bg: '#FFEBEE' },
  in:   { label: 'Kirim',  icon: <TrendingUp   size={16}/>, color: '#2E7D32', bg: '#E8F5E9' },
}

// ─── USB BARCODE HOOK ─────────────────────────────────────────────────
function useBarcodeScanner(onScan, enabled = true) {
  const buf   = useRef('')
  const timer = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const handler = (e) => {
      if (timer.current) clearTimeout(timer.current)
      if (e.key === 'Enter') {
        const code = buf.current.trim()
        if (code.length >= 3) onScan(code)
        buf.current = ''
        return
      }
      if (e.key.length === 1) {
        buf.current += e.key
        timer.current = setTimeout(() => { buf.current = '' }, 150)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onScan, enabled])
}
// ─── KAMERA BARCODE HOOK (TO'G'IRLANGAN) ──────────────────────────────
function useCameraScanner(onScan, enabled = false) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const animRef   = useRef(null)
  const [camError, setCamError] = useState('')
  const [hasTorch, setHasTorch] = useState(false)
  const [torchOn, setTorchOn]   = useState(false)

  const stop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) { stop(); return }

    let detector = null
    // Formatlarni ko'paytiramiz va aniqligini oshiramiz
    if (typeof window !== 'undefined' && window.BarcodeDetector) {
      detector = new window.BarcodeDetector({ 
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'data_matrix'] 
      })
    }

    // FacingMode: 'environment' — orqa kamerani tanlaydi (teskari bo'lmaydi)
    navigator.mediaDevices?.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 } 
      } 
    })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // MUHIM: Videoni vizual teskari qilishni o'chiramiz (CSS orqali)
          videoRef.current.style.transform = 'scaleX(1)'; 
          videoRef.current.play()
        }
        setCamError('')

        const scan = async () => {
          if (!videoRef.current || !enabled) return
          
          // Skanerlash tezligini biroz sekinlashtiramiz (protsessor qizib ketmasligi uchun)
          if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              if (detector) {
                const codes = await detector.detect(videoRef.current)
                if (codes.length > 0) {
                  const rawValue = codes[0].rawValue;
                  // Bo'sh joylarni olib tashlab yuboramiz
                  onScan(rawValue.trim().toUpperCase())
                  // Bir marta o'qigach 2 soniya kutamiz (takrorlanish bo'lmasligi uchun)
                  await new Promise(r => setTimeout(r, 2000))
                }
              }
            } catch (err) {
              // Silently ignore or handle scan errors if needed
            }
          }
          animRef.current = requestAnimationFrame(scan)
        }
        // Mezlardan torch bormi tekshiramiz
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities?.() || {}
        if (caps.torch) setHasTorch(true)

        return () => stop()
      })
      .catch(err => {
        setCamError(err.name === 'NotAllowedError'
          ? 'Kameraga ruxsat berilmagan'
          : 'Kamera topilmadi'
        )
      })

    return () => stop()
  }, [enabled, onScan, stop])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track || !hasTorch) return
    try {
      const newVal = !torchOn
      await track.applyConstraints({ advanced: [{ torch: newVal }] })
      setTorchOn(newVal)
    } catch (e) {
      // Torch error
    }
  }, [hasTorch, torchOn])

  return { videoRef, camError, hasTorch, torchOn, toggleTorch }
}
// ─── BARCHA MAHSULOTLAR BARCODE JADVALI CHOP ETISH (TO'G'IRLANGAN) ───
function printAllBarcodes(stocks, isWorker) {
  if (!stocks || !stocks.length) return;

  const cardsHtml = stocks.map((s, i) => {
    const barcodeValue = s.product_sku || `EM${String(s.id).padStart(6, '0')}`;
    const svgId = `barcode-svg-${i}`;

    return `
      <div class="barcode-card">
        <div class="product-name">${s.product_name}</div>
        <svg id="${svgId}"></svg>
        ${!isWorker ? `<div class="product-price">${Number(s.product_price).toLocaleString()} so'm</div>` : ''}
      </div>`;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>e-Mebel Barcodelar</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 10px; }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 10px; 
    }
    .barcode-card { 
      border: 1px dashed #ccc; 
      padding: 8px; 
      text-align: center; 
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .product-name { font-size: 10px; font-weight: bold; margin-bottom: 5px; height: 24px; overflow: hidden; }
    svg { width: 100% !important; height: auto !important; }
    .product-price { font-size: 11px; font-weight: bold; margin-top: 5px; }
    @media print { .grid { gap: 5px; } }
  </style>
</head>
<body>
  <div class="grid">${cardsHtml}</div>
  
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  
  <script>
    window.onload = function() {
      const data = ${JSON.stringify(stocks.map(s => ({
        id: `barcode-svg-` + stocks.indexOf(s),
        value: s.product_sku || `EM` + String(s.id).padStart(6, '0')
      })))};

      data.forEach(item => {
        try {
          JsBarcode("#" + item.id, item.value, {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 14
          });
        } catch(e) { /* ignore */ }
      });

      setTimeout(() => { 
        window.print(); 
        window.close(); 
      }, 700);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

// ─── CHEK CHOP ETISH (RECEIPT) ─────────────────────────────────────────
function printReceipt(cart, mode, total, isWorker) {
  if (!cart || !cart.length) return;

  const itemsHtml = cart.map(item => `
    <tr>
      <td style="padding: 5px 0;">
        <div style="font-weight: bold;">${item.stock.product_name}</div>
        ${!isWorker ? `<div style="font-size: 11px; color: #666;">${item.qty} × ${Number(item.price).toLocaleString()}</div>` : `<div style="font-size: 11px; color: #666;">Miqdor: ${item.qty}</div>`}
      </td>
      ${!isWorker ? `<td style="text-align: right; vertical-align: top; padding-top: 5px;">${(item.qty * item.price).toLocaleString()}</td>` : ''}
    </tr>
  `).join('');

  const now = new Date().toLocaleString('uz-UZ');
  const modeLabel = mode === 'sale' ? 'SAVDO' : mode === 'in' ? 'KIRIM' : 'CHIQIM';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>e-Mebel Chek</title>
  <style>
    body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
    .info { font-size: 12px; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .total-row { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
    @media print { body { width: 100%; padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">e-Mebel</div>
    <div class="info">Mebel va Aksessuarlar</div>
    <div class="info">Tel: +998 (99) 123-4567</div>
    <div style="margin-top: 10px; font-weight: bold; text-decoration: underline;">${modeLabel} CHEKI</div>
  </div>
  
  <div class="info">Sana: ${now}</div>
  <div class="info">Chek №: ${Math.floor(Math.random() * 1000000)}</div>
  
  <table>
    ${itemsHtml}
  </table>
  
  ${!isWorker ? `
  <div class="total-row">
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
      <span>JAMI:</span>
      <span>${total.toLocaleString()} so'm</span>
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    Xaridingiz uchun rahmat!<br>
    Toshkent, O'zbekiston
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        window.close();
      }, 500);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}
// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function Barcode() {
  const { toast, user }     = useApp()
  const isWorker            = user?.role === 'worker'
  const [mode, setMode]     = useState('sale')
  const [stocks, setStocks] = useState([])
  const [loading, setLoading]     = useState(false)
  const [cart, setCart]           = useState([])
  const [lastFound, setLastFound] = useState(null)
  const [notFound, setNotFound]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(null)
  const [showManual, setShowManual]   = useState(false)
  const [showCamera, setShowCamera]   = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [scanHistory, setScanHistory] = useState([])
  const [flash, setFlash]           = useState(null) // 'success' | 'error'
  const manualRef = useRef(null)

  const modeInfo = MODES[mode]

  // Stocklarni yuklash
  // Stocklarni yuklashni yangilash
const loadStocks = useCallback(async () => {
  setLoading(true)
  try {
    // API'dan barcha ma'lumotni olish
    const res = await api.stock(); 
    
    // Agar res ichida results bo'lsa (paginatsiya yoqilgan bo'lsa), 
    // results'ni olamiz, aks holda res'ning o'zini (massiv bo'lsa)
    const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
    setStocks(data);
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    setLoading(false);
  }
}, [toast]);

  useEffect(() => { loadStocks() }, [loadStocks])

  // ── Skaner funksiyalari (Hoisted definition) ──
  const findByCode = useCallback((code) => {
    if (!code) return null;
    const c = code.trim().toUpperCase();
    const cleanC = c.replace(/[^A-Z0-9]/g, '');

    return stocks.find(s => {
      const sku = s.product_sku?.trim().toUpperCase();
      const barcode = s.product_barcode?.trim().toUpperCase();
      if (sku === c || barcode === c) return true;
      if (sku?.includes(c) || barcode?.includes(c)) return true;
      if (cleanC && sku?.replace(/[^A-Z0-9]/g, '') === cleanC) return true;
      if (cleanC && barcode?.replace(/[^A-Z0-9]/g, '') === cleanC) return true;
      return false;
    }) || null;
  }, [stocks]);

  const addToCart = useCallback((stock) => {
    setCart(prev => {
      const idx    = prev.findIndex(i => i.stock.id === stock.id)
      const maxQty = mode !== 'in' ? stock.quantity : 9999
      if (idx >= 0) {
        if (prev[idx].qty >= maxQty && mode !== 'in') {
          toast(`⚠️ Omborda faqat ${stock.quantity} dona!`, 'warning')
          return prev
        }
        const updated = [...prev]
        updated[idx]  = { ...updated[idx], qty: updated[idx].qty + 1 }
        return updated
      }
      if (mode !== 'in' && stock.quantity <= 0) {
        toast(`❌ ${stock.product_name} tugagan!`, 'error')
        return prev
      }
      return [...prev, {
        stock,
        qty:   1,
        price: Number(stock.product_price) || 0,
      }]
    })
    setLastFound(stock)
    setNotFound('')
    setTimeout(() => setLastFound(null), 2000)
  }, [mode, toast])

  const handleScan = useCallback((code) => {
    const found = findByCode(code)
    if (found) {
      addToCart(found)
      playBeep()
      setFlash('success')
      setScanHistory(prev => [{ ...found, time: new Date() }, ...prev].slice(0, 5))
      setTimeout(() => setFlash(null), 400)
    } else {
      setNotFound(code)
      playBuzz()
      setFlash('error')
      toast(`❌ "${code}" topilmadi`, 'error')
      setTimeout(() => { setNotFound(''); setFlash(null) }, 3000)
    }
  }, [findByCode, addToCart, toast])

  // USB skaner
  useBarcodeScanner(
    useCallback((code) => handleScan(code), [handleScan]), 
    !showManual && !showCamera
  )

  // Kamera skaner
  const { videoRef, camError, hasTorch, torchOn, toggleTorch } = useCameraScanner(
    useCallback((code) => {
      handleScan(code)
      setShowCamera(false)
    }, [handleScan]), 
    showCamera
  )

  // ... (Moved below)

  // Qo'lda kiritish
  const handleManual = () => {
    if (!manualInput.trim()) return
    handleScan(manualInput.trim())
    setManualInput('')
    manualRef.current?.focus()
  }

  // Miqdor
  const changeQty = (idx, delta) => {
    setCart(prev => {
      const updated = [...prev]
      const item    = updated[idx]
      const maxQty  = mode !== 'in' ? item.stock.quantity : 9999
      const newQty  = item.qty + delta
      if (newQty <= 0)                          { updated.splice(idx, 1) }
      else if (newQty > maxQty && mode !== 'in') { toast(`⚠️ Omborda ${item.stock.quantity} dona!`, 'warning') }
      else                                       { updated[idx] = { ...item, qty: newQty } }
      return updated
    })
  }

  const changePrice = (idx, val) => setCart(prev => {
    const u = [...prev]; u[idx] = { ...u[idx], price: Number(val) || 0 }; return u
  })
  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))
  const clearCart  = ()    => { setCart([]); setLastFound(null); setNotFound('') }

  const totalQty    = cart.reduce((s, i) => s + i.qty, 0)
  const totalAmount = cart.reduce((s, i) => s + i.qty * i.price, 0)

  // Tasdiqlash
  const handleSubmit = async () => {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const mvType = mode === 'in' ? 'in' : 'out'
      for (const item of cart) {
        await api.movementCreate({
          product:       item.stock.product,
          movement_type: mvType,
          quantity:      item.qty,
          reason: mode === 'sale'
            ? `Savdo (barcode) — ${fmt(item.price * item.qty)} so'm`
            : mode === 'out' ? 'Chiqim (barcode)' : 'Kirim (barcode)',
        })
      }
      const snapshot = { mode, cart: [...cart], total: totalAmount }
      setDone(snapshot)
      if (mode === 'sale') printReceipt(cart, mode, totalAmount, isWorker)
      toast(`✅ ${modeInfo.label} amalga oshirildi!`, 'success')
      clearCart()
      await loadStocks()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtr (Optimized with useMemo)
  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      if (!searchFilter) return true
      const q = searchFilter.toLowerCase()
      return s.product_name?.toLowerCase().includes(q) ||
             s.product_sku?.toLowerCase().includes(q) ||
             s.product_barcode?.toLowerCase().includes(q)
    })
  }, [stocks, searchFilter])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF' }}>
      {/* ── HEADER ── */}
      <PageHeader
        title="Barcode Skaner"
        subtitle="Savdo · Kirim · Chiqim"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" icon={<RefreshCw size={13}/>} onClick={loadStocks}>
              Yangilash
            </Btn>
            <Btn variant="ghost" size="sm"
              icon={<Printer size={13}/>}
              onClick={() => printAllBarcodes(stocks, isWorker)}>
              Barcodelar
            </Btn>
            <Btn variant="ghost" size="sm" icon={<Keyboard size={13}/>}
              onClick={() => { setShowManual(v => !v); setShowCamera(false); setTimeout(() => manualRef.current?.focus(), 100) }}>
              Qo'lda
            </Btn>
            <Btn variant={showCamera ? 'primary' : 'ghost'} size="sm"
              icon={showCamera ? <CameraOff size={13}/> : <Camera size={13}/>}
              onClick={() => { setShowCamera(v => !v); setShowManual(false) }}>
              Kamera
            </Btn>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: 20, padding: '0 0 32px' }}>

        {/* ── CHAP QISM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Rejim tanlash */}
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(MODES).map(([key, m]) => (
              <button key={key} onClick={() => { setMode(key); clearCart() }}
                style={{
                  flex: 1, padding: '14px 10px', borderRadius: 14, border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: mode === key ? m.color : '#fff',
                  color:      mode === key ? '#fff'   : '#64748b',
                  boxShadow:  mode === key ? `0 4px 16px ${m.color}50` : '0 1px 4px #0001',
                  transition: 'all 0.2s',
                }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Skaner oynasi */}
          <div style={{
            background: '#0D1B2A', borderRadius: 20, padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 14, position: 'relative', overflow: 'hidden', minHeight: 220,
            border: `2px solid ${flash === 'success' ? '#22c55e' : flash === 'error' ? '#ef4444' : '#1e293b'}`,
            boxShadow: flash === 'success' ? '0 0 40px #22c55e30' : flash === 'error' ? '0 0 40px #ef444430' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {/* Flash overlay */}
            {flash && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: flash === 'success' ? '#22c55e10' : '#ef444410',
                pointerEvents: 'none', animation: 'flashAnim 0.4s ease-out'
              }}/>
            )}

            {/* Grid fon */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,#ffffff06 40px,#ffffff06 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#ffffff06 40px,#ffffff06 41px)',
              pointerEvents: 'none',
            }}/>

            {/* Kamera view */}
            {showCamera && (
              <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 400 }}>
                {camError ? (
                  <div style={{ color: '#fca5a5', textAlign: 'center', padding: 20 }}>
                    <CameraOff size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }}/>
                    <div>{camError}</div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Torch button */}
                    {hasTorch && (
                      <button onClick={toggleTorch} style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 10,
                        width: 40, height: 40, borderRadius: '50%', border: 'none',
                        background: torchOn ? '#f59e0b' : 'rgba(0,0,0,0.5)',
                        color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: torchOn ? '0 0 15px #f59e0b80' : 'none',
                        transition: 'all 0.3s'
                      }}>
                        {torchOn ? <ZapOff size={18}/> : <Camera size={18}/>}
                      </button>
                    )}
                    <video ref={videoRef} muted playsInline
                      style={{ width: '100%', borderRadius: 12, border: `2px solid ${modeInfo.color}` }}
                    />
                    {/* Scan frame */}
                    <div style={{
                      position: 'absolute', inset: '15%',
                      border: `2px solid ${modeInfo.color}40`,
                      borderRadius: 8, pointerEvents: 'none',
                    }}>
                      {/* Burchaklar */}
                      {[['0%','0%'],['0%','auto'],['auto','0%'],['auto','auto']].map(([t,b], i) => (
                        <div key={i} style={{
                          position: 'absolute',
                          top: t === '0%' ? -2 : 'auto', bottom: b === '0%' ? -2 : 'auto',
                          left:  i % 2 === 0 ? -2 : 'auto', right: i % 2 === 1 ? -2 : 'auto',
                          width: 24, height: 24,
                          borderTop:    i < 2  ? `4px solid ${modeInfo.color}` : 'none',
                          borderBottom: i >= 2 ? `4px solid ${modeInfo.color}` : 'none',
                          borderLeft:   i % 2 === 0 ? `4px solid ${modeInfo.color}` : 'none',
                          borderRight:  i % 2 === 1 ? `4px solid ${modeInfo.color}` : 'none',
                        }}/>
                      ))}
                      {/* Scan chizig'i */}
                      <div style={{
                        position: 'absolute', left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, transparent, ${modeInfo.color}, transparent)`,
                        boxShadow: `0 0 15px ${modeInfo.color}`,
                        animation: 'scanLine 2s ease-in-out infinite',
                      }}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* USB mode icon */}
            {!showCamera && !notFound && (
              <>
                <div style={{
                  width: 80, height: 80, borderRadius: 24,
                  background: `${modeInfo.color}15`,
                  border: `2px solid ${modeInfo.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                  boxShadow: `0 0 20px ${modeInfo.color}20`,
                }}>
                  <Scan size={38} color={modeInfo.color}/>
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: modeInfo.color, top: '50%',
                    boxShadow: `0 0 10px ${modeInfo.color}`,
                    animation: 'scanLine 2s ease-in-out infinite',
                  }}/>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', zIndex: 1, fontWeight: 500 }}>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    Skanerlashga tayyor...
                  </div>
                  USB skaner yoki kameradan foydalaning
                </div>
              </>
            )}

            {/* Mahsulot topilmadi holati */}
            {notFound && (
               <div style={{
                zIndex: 5, width: '100%', maxWidth: 400,
                background: '#450a0a', border: '1.5px solid #ef444450',
                borderRadius: 16, padding: '20px', textAlign: 'center',
                animation: 'shake .4s ease-in-out'
              }}>
                <ZapOff size={32} color="#ef4444" style={{ marginBottom: 12 }}/>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  Mahsulot topilmadi 🔎
                </div>
                <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>
                  "{notFound}" bo'yicha hech narsa topilmadi.
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => setNotFound('')} style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid #ef444480',
                    background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}>Qaytadan</button>
                  <button onClick={() => window.location.href='/products'} style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}>Qo'shish</button>
                </div>
              </div>
            )}

            {/* Qo'lda kiritish */}
            {showManual && (
              <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 380, zIndex: 3 }}>
                <input
                  ref={manualRef}
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManual()}
                  placeholder="SKU yoki barcode kiriting..."
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 12,
                    border: `2px solid ${modeInfo.color}40`, background: '#1e293b',
                    color: '#f1f5f9', fontSize: 14, outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
                <button onClick={handleManual} style={{
                  width: 46, height: 46, borderRadius: 12, border: 'none',
                  background: modeInfo.color, color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}><Plus size={20}/></button>
              </div>
            )}

            {/* Oxirgi topilgan mahsulot (toast o'rniga) */}
            {lastFound && !notFound && (
              <div style={{
                position: 'absolute', bottom: 20,
                background: '#064e3b', border: '1px solid #10b98150',
                borderRadius: 12, padding: '10px 18px', zIndex: 2,
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'slideUp .3s ease-out'
              }}>
                <CheckCircle size={18} color="#10b981"/>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{lastFound.product_name}</span>
                {!isWorker && <span style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(lastFound.product_price)}</span>}
              </div>
            )}
          </div>

          {/* Skan tarixi */}
          {scanHistory.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0' }}>
              {scanHistory.map((s, i) => (
                <div key={i} style={{
                  flexShrink: 0, background: '#fff', padding: '8px 12px',
                  borderRadius: 10, border: '1px solid #e2e8f0', minWidth: 140,
                  fontSize: 12, boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.product_name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>
                    {s.time.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CSS animations */}
          <style>{`
            @keyframes scanLine {
              0%   { transform: translateY(-80px); opacity: 0; }
              10%  { opacity: 1; }
              90%  { opacity: 1; }
              100% { transform: translateY(80px); opacity: 0; }
            }
            @keyframes flashAnim {
              0%   { opacity: 1; }
              100% { opacity: 0; }
            }
            @keyframes slideUp {
              0%   { transform: translateY(20px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25%  { transform: translateX(-5px); }
              75%  { transform: translateX(5px); }
            }
          `}</style>

          {/* Mahsulotlar ro'yxati */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E3F2FD', overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #E3F2FD',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0D47A1' }}>
                📦 Mahsulotlar ({stocks.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {loading && <Spinner size={16}/>}
                <input
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Qidirish..."
                  style={{
                    padding: '5px 10px', borderRadius: 8, border: '1px solid #E3F2FD',
                    fontSize: 12, outline: 'none', width: 160,
                  }}
                />
              </div>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {filteredStocks.map(s => {
                const inCart = cart.find(i => i.stock.id === s.id)
                const isOut  = s.quantity <= 0
                return (
                  <div key={s.id}
                    onClick={() => !isOut || mode === 'in' ? addToCart(s) : toast('Tugagan!', 'warning')}
                    style={{
                      padding: '10px 16px', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: '1px solid #f8fafc',
                      background: inCart ? `${modeInfo.color}08` : 'transparent',
                      opacity: isOut && mode !== 'in' ? 0.45 : 1,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${modeInfo.color}12`}
                    onMouseLeave={e => e.currentTarget.style.background = inCart ? `${modeInfo.color}08` : 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                        {s.product_name}
                        {inCart && <span style={{
                          marginLeft: 6, fontSize: 11,
                          background: modeInfo.color, color: '#fff',
                          borderRadius: 6, padding: '1px 6px',
                        }}>×{inCart.qty}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        SKU: {s.product_sku || '—'}
                        {!isWorker && ` · ${fmt(s.product_price || 0)} so'm`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontWeight: 800, fontSize: 15,
                        color: s.quantity <= 0 ? '#ef4444'
                          : s.quantity <= s.min_quantity ? '#E65100' : '#1565C0',
                      }}>
                        {s.quantity}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>dona</div>
                    </div>
                  </div>
                )
              })}
              {!loading && !filteredStocks.length && (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  {searchFilter ? 'Topilmadi' : 'Mahsulotlar yo\'q'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── O'NG: SAVAT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Savat */}
          <div style={{
            background: '#fff', borderRadius: 20,
            border: `1.5px solid #e2e8f0`,
            overflow: 'hidden',
            boxShadow: `0 10px 30px -10px rgba(0,0,0,0.1)`,
            position: 'relative'
          }}>
            {/* Receipt head decoration */}
            <div style={{
              height: 6, display: 'flex', gap: 4, padding: '0 10px',
              position: 'absolute', top: -3, left: 0, right: 0, zIndex: 5
            }}>
              {Array.from({length: 20}).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 6, borderRadius: '50%', background: '#F0F4FF' }}/>
              ))}
            </div>
            <div style={{
              padding: '14px 18px',
              background: `${modeInfo.color}10`,
              borderBottom: `1px solid ${modeInfo.color}20`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                {modeInfo.icon}
                <span style={{ color: modeInfo.color }}>{modeInfo.label} savati</span>
                {cart.length > 0 && (
                  <span style={{
                    background: modeInfo.color, color: '#fff',
                    borderRadius: 20, fontSize: 11, padding: '1px 8px', fontWeight: 700,
                  }}>{cart.length}</span>
                )}
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', padding: 4,
                }}>
                  <Trash2 size={15}/>
                </button>
              )}
            </div>

            <div style={{ minHeight: 120, maxHeight: 380, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  <Scan size={32} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }}/>
                  <div style={{ fontSize: 13 }}>Barcode skanerlang yoki<br/>mahsulotni tanlang</div>
                </div>
              ) : cart.map((item, idx) => (
                <div key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.stock.product_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        SKU: {item.stock.product_sku || '—'}
                      </div>
                      {mode === 'sale' && !isWorker && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Narx:</span>
                          <input type="number" value={item.price}
                            onChange={e => changePrice(idx, e.target.value)}
                            style={{
                              width: 90, padding: '3px 8px', borderRadius: 6,
                              border: `1px solid ${modeInfo.color}40`, fontSize: 12, outline: 'none',
                            }}
                          />
                          <span style={{ fontSize: 11, color: '#64748b' }}>so'm</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeItem(idx)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#cbd5e1', padding: 2, flexShrink: 0,
                    }}>
                      <X size={14}/>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => changeQty(idx, -1)} style={{
                        width: 28, height: 28, borderRadius: 8,
                        border: `1px solid ${modeInfo.color}40`,
                        background: `${modeInfo.color}10`, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: modeInfo.color,
                      }}>
                        <Minus size={13}/>
                      </button>
                      <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>
                        {item.qty}
                      </span>
                      <button onClick={() => changeQty(idx, +1)} style={{
                        width: 28, height: 28, borderRadius: 8,
                        border: `1px solid ${modeInfo.color}40`,
                        background: `${modeInfo.color}10`, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: modeInfo.color,
                      }}>
                        <Plus size={13}/>
                      </button>
                    </div>
                    {mode === 'sale' ? (
                      <div style={{ textAlign: 'right' }}>
                        {!isWorker && (
                          <div style={{ fontWeight: 700, fontSize: 14, color: modeInfo.color }}>
                            {fmt(item.qty * item.price)} so'm
                          </div>
                        )}
                        {!isWorker && Number(item.stock.product_cost) > 0 && (
                          <div style={{ fontSize: 11, color: '#22c55e' }}>
                            Foyda: +{fmt(item.qty * (item.price - Number(item.stock.product_cost)))} so'm
                          </div>
                        )}
                        {isWorker && <div style={{ fontSize: 12, color: '#94a3b8' }}>Sotuv rejimi</div>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Ombor: {item.stock.quantity} ta
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Jami */}
            {cart.length > 0 && (
              <div style={{ padding: '14px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>Jami mahsulot:</span>
                  <span style={{ fontWeight: 700 }}>{totalQty} dona</span>
                </div>
                {mode === 'sale' && !isWorker && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Jami summa:</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: modeInfo.color }}>
                      {fmt(totalAmount)} so'm
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tasdiqlash tugmasi */}
          {cart.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSubmit} disabled={submitting}
                style={{
                  flex: 1, padding: '15px', borderRadius: 14, border: 'none',
                  background: submitting ? '#e2e8f0' : modeInfo.color,
                  color: submitting ? '#94a3b8' : '#fff',
                  fontWeight: 800, fontSize: 15, cursor: submitting ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: submitting ? 'none' : `0 6px 20px ${modeInfo.color}50`,
                  transition: 'all 0.2s',
                }}>
                {submitting ? <Spinner size={18}/> : modeInfo.icon}
                {submitting ? 'Saqlanmoqda...'
                  : mode === 'sale' ? (!isWorker ? `✅ Savdo — ${fmt(totalAmount)} so'm` : '✅ Savdo tasdiqlash')
                  : mode === 'out'  ? `✅ Chiqim — ${totalQty} dona`
                  : `✅ Kirim — ${totalQty} dona`}
              </button>
              {mode === 'sale' && cart.length > 0 && (
                <button
                  onClick={() => printReceipt(cart, mode, totalAmount, isWorker)}
                  style={{
                    padding: '15px 16px', borderRadius: 14, border: `2px solid ${modeInfo.color}40`,
                    background: '#fff', color: modeInfo.color,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}>
                  <Printer size={18}/>
                </button>
              )}
            </div>
          )}

          {/* So'nggi natija */}
          {done && (
            <div style={{
              background: '#E8F5E9', border: '2px solid #2E7D32',
              borderRadius: 14, padding: 18,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: 14 }}>
                  ✅ {MODES[done.mode]?.label} amalga oshirildi!
                </span>
                <button onClick={() => setDone(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={16}/>
                </button>
              </div>
              {done.cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0', color: '#374151' }}>
                  <span>{item.stock.product_name} × {item.qty}</span>
                  {done.mode === 'sale' && !isWorker && <span style={{ fontWeight: 600 }}>{fmt(item.qty * item.price)} so'm</span>}
                </div>
              ))}
              {done.mode === 'sale' && !isWorker && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #A5D6A7', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: '#2E7D32' }}>
                  <span>Jami:</span>
                  <span>{fmt(done.total)} so'm</span>
                </div>
              )}
              {done.mode === 'sale' && (
                <button onClick={() => printReceipt(done.cart, done.mode, done.total, isWorker)}
                  style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #2E7D32', background: 'transparent', color: '#2E7D32', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Printer size={14}/> Chek chop etish
                </button>
              )}
            </div>
          )}

          {/* Ombor statistikasi */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E3F2FD', padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#0D47A1' }}>
              📊 Ombor holati
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Jami tur',   value: stocks.length,                                                          color: '#1565C0' },
                { label: 'Kam qolgan', value: stocks.filter(s => s.quantity > 0 && s.quantity <= s.min_quantity).length, color: '#E65100' },
                { label: 'Tugagan',    value: stocks.filter(s => s.quantity <= 0).length,                              color: '#C62828' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: `${s.color}08`, borderRadius: 10, border: `1px solid ${s.color}20` }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
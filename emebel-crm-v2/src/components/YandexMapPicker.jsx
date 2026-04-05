/**
 * YandexMapPicker — Yandex Maps orqali manzil tanlash komponenti
 *
 * Ishlatish:
 *   import YandexMapPicker from '@/components/YandexMapPicker'
 *
 *   <YandexMapPicker
 *     value={{ lat, lng, address }}
 *     onChange={({ lat, lng, address }) => ...}
 *   />
 *
 * .env ga qo'shing (ixtiyoriy, bepul ham ishlaydi):
 *   VITE_YANDEX_MAPS_KEY=your_key
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Search, X, Check } from 'lucide-react'

// O'zbekiston viloyatlari va tumanlari
const REGIONS = {
  "Toshkent shahri": ["Bektemir", "Chilonzor", "Hamza", "Mirzo Ulug'bek", "Mirobod", "Olmazor", "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yunusobod", "Yashnobod"],
  "Toshkent viloyati": ["Angren", "Bekabad", "Bo'stonliq", "Chinoz", "Qibray", "O'rtachirchiq", "Ohangarons", "Parkent", "Piskent", "Quyi Chirchiq", "Toshkent", "Yuqori Chirchiq", "Zangiota"],
  "Samarqand": ["Samarqand", "Ishtixon", "Jomboy", "Kattaqo'rg'on", "Narpay", "Nurobod", "Oqdaryo", "Pastdarg'om", "Paxtachi", "Payariq", "Qo'shrabot", "Toyloq", "Urgut"],
  "Buxoro": ["Buxoro", "G'ijduvon", "Jondor", "Kogon", "Olot", "Peshku", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent"],
  "Andijon": ["Andijon", "Asaka", "Baliqchi", "Bo'ston", "Buloqboshi", "Jalaquduq", "Izboskan", "Marhamat", "Oltinko'l", "Paxtaobod", "Qo'rg'ontepa", "Shahrixon", "Ulug'nor", "Xo'jaobod"],
  "Farg'ona": ["Farg'ona", "Beshariq", "Bog'dod", "Dang'ara", "Furqat", "Oltiariq", "O'zbekiston", "Qo'qon", "Quva", "Rishton", "So'x", "Toshloq", "Uchko'prik", "Yozyovon"],
  "Namangan": ["Namangan", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uychi", "Yangiqo'rg'on"],
  "Qashqadaryo": ["Qarshi", "Chiroqchi", "G'uzor", "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Shahrisabz", "Yakkabog'"],
  "Surxondaryo": ["Termiz", "Angor", "Bandixon", "Boysun", "Denov", "Jarqo'rg'on", "Qiziriq", "Qumqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun"],
  "Xorazm": ["Urganch", "Bog'ot", "Gurlan", "Xiva", "Qo'shko'pir", "Shovot", "Tuproqqal'a", "Urganch tumani", "Yangiariq", "Yangibozor"],
  "Navoiy": ["Navoiy", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi"],
  "Jizzax": ["Jizzax", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Mirzacho'l", "Paxtakor", "Sharof Rashidov", "Yangiobod", "Zarbdor", "Zomin"],
  "Sirdaryo": ["Guliston", "Boyovut", "Xavast", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod", "Shirin", "Yangiyer"],
  "Qoraqalpog'iston": ["Nukus", "Amudaryo", "Beruniy", "Chimboy", "Ellikkala", "Kegeyli", "Mo'ynoq", "Qanliko'l", "Qo'ng'irot", "Qorao'zak", "Shumanay", "Taxtako'pir", "To'rtko'l", "Xo'jayli"],
}

export default function YandexMapPicker({ value, onChange, label }) {
  const [open, setOpen]         = useState(false)
  const [search, setSearch]     = useState('')
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [region, setRegion]     = useState(value?.region || '')
  const [district, setDistrict] = useState(value?.district || '')
  const [address, setAddress]   = useState(value?.address || '')
  const [coords, setCoords]     = useState(
    value?.lat && value?.lng ? [value.lat, value.lng] : [41.2995, 69.2401]
  )
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef    = useRef(null)
  const ymapsRef  = useRef(null)
  const mapObjRef = useRef(null)
  const pinRef    = useRef(null)

  // Yandex Maps SDK yuklash
  const loadYmaps = useCallback(() => {
    if (window.ymaps) { setMapLoaded(true); return }
    const key = import.meta.env?.VITE_YANDEX_MAPS_KEY || ''
    const src = key
      ? `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=uz_UZ`
      : `https://api-maps.yandex.ru/2.1/?lang=uz_UZ`
    const s = document.createElement('script')
    s.src = src
    s.onload = () => {
      window.ymaps.ready(() => {
        ymapsRef.current = window.ymaps
        setMapLoaded(true)
      })
    }
    document.head.appendChild(s)
  }, [])

  useEffect(() => { if (open) loadYmaps() }, [open, loadYmaps])

  // Xaritani yaratish
  useEffect(() => {
    if (!open || !mapLoaded || !mapRef.current || mapObjRef.current) return
    const ymaps = ymapsRef.current || window.ymaps
    if (!ymaps) return

    const map = new ymaps.Map(mapRef.current, {
      center: coords,
      zoom:   12,
      controls: ['zoomControl'],
    })

    const pin = new ymaps.Placemark(coords, {}, {
      preset: 'islands#redDotIcon',
      draggable: true,
    })

    pin.events.add('dragend', async () => {
      const c = pin.geometry.getCoordinates()
      setCoords(c)
      await reverseGeocode(c, ymaps)
    })

    map.events.add('click', async (e) => {
      const c = e.get('coords')
      pin.geometry.setCoordinates(c)
      setCoords(c)
      await reverseGeocode(c, ymaps)
    })

    map.geoObjects.add(pin)
    mapObjRef.current = map
    pinRef.current    = pin
  }, [open, mapLoaded])

  // Teskari geocoding — koordinatdan manzil
  const reverseGeocode = async (c, ymaps) => {
    try {
      const res = await ymaps.geocode(c, { results: 1, kind: 'house' })
      const obj = res.geoObjects.get(0)
      if (obj) {
        const addr = obj.getAddressLine()
        setAddress(addr)
      }
    } catch {}
  }

  // Manzil qidirish
  const searchAddress = async () => {
    if (!search.trim() || !ymapsRef.current) return
    setSearching(true)
    try {
      const ymaps = ymapsRef.current
      const res = await ymaps.geocode(`O'zbekiston, ${search}`, { results: 5 })
      const items = []
      res.geoObjects.each(obj => {
        items.push({
          name: obj.getAddressLine(),
          coords: obj.geometry.getCoordinates(),
        })
      })
      setSuggestions(items)
    } catch {}
    setSearching(false)
  }

  const selectSuggestion = (s) => {
    setCoords(s.coords)
    setAddress(s.name)
    setSuggestions([])
    setSearch('')
    if (mapObjRef.current) {
      mapObjRef.current.setCenter(s.coords, 15)
      pinRef.current?.geometry.setCoordinates(s.coords)
    }
  }

  const handleSave = () => {
    onChange({
      lat:      coords[0],
      lng:      coords[1],
      region,
      district,
      address,
    })
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
    mapObjRef.current = null
    setSuggestions([])
  }

  // Ko'rsatish uchun qisqa manzil
  const displayAddr = value?.address
    ? value.address.length > 50 ? value.address.slice(0, 50) + '...' : value.address
    : null

  return (
    <>
      {/* Trigger tugmasi */}
      <div>
        {label && (
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            {label}
          </div>
        )}
        <button onClick={() => setOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1.5px solid var(--border2)', background: '#fff',
          cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
        >
          <MapPin size={16} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            {displayAddr ? (
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{displayAddr}</div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Xaritadan manzil tanlash...</div>
            )}
            {(value?.region || value?.district) && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                📍 {[value.region, value.district].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>
            {displayAddr ? 'Tahrirlash' : 'Belgilash'} →
          </span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={e => e.target === e.currentTarget && handleClose()}>
          <div style={{
            background: '#fff', borderRadius: 20,
            width: '100%', maxWidth: 760,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '90vh',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={18} style={{ color: 'var(--accent)' }}/>
                <strong style={{ fontSize: 15 }}>Manzilni xaritadan belgilang</strong>
              </div>
              <button onClick={handleClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                <X size={18}/>
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Viloyat / Tuman */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Viloyat</div>
                  <select value={region} onChange={e => { setRegion(e.target.value); setDistrict('') }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border2)', fontSize: 13 }}>
                    <option value="">— tanlang —</option>
                    {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Tuman / Shahar</div>
                  <select value={district} onChange={e => setDistrict(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border2)', fontSize: 13 }}
                    disabled={!region}>
                    <option value="">— tanlang —</option>
                    {(REGIONS[region] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Qidiruv */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchAddress()}
                    placeholder="Ko'cha, bino yoki joy nomini qidiring..."
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border2)', fontSize: 13 }}
                  />
                  <button onClick={searchAddress} disabled={searching}
                    style={{
                      padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <Search size={14}/>
                    {searching ? '...' : 'Qidirish'}
                  </button>
                </div>
                {/* Taklif ro'yxati */}
                {suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    marginTop: 4, overflow: 'hidden',
                  }}>
                    {suggestions.map((s, i) => (
                      <div key={i} onClick={() => selectSuggestion(s)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          borderBottom: i < suggestions.length-1 ? '1px solid var(--border)' : 'none',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <MapPin size={12} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Xarita */}
              <div style={{ position: 'relative' }}>
                {!mapLoaded && (
                  <div style={{
                    height: 320, borderRadius: 12, background: '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: 'var(--text3)', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ width: 24, height: 24, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                    Xarita yuklanmoqda...
                  </div>
                )}
                <div
                  ref={mapRef}
                  style={{
                    height: 320, borderRadius: 12, overflow: 'hidden',
                    border: '1.5px solid var(--border)',
                    display: mapLoaded ? 'block' : 'none',
                  }}
                />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, textAlign: 'center' }}>
                  📍 Xaritaga bosing yoki pinni sudrab aniq manzilni belgilang
                </div>
              </div>

              {/* Tanlangan manzil */}
              {address && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: '#f0fdf4', border: '1px solid #86efac',
                  fontSize: 13, color: '#065f46',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }}/>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>Tanlangan manzil:</div>
                    <div>{address}</div>
                    <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                      {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
                    </div>
                  </div>
                </div>
              )}

              {/* Qo'lda kiritish */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>
                  Ko'cha / uy raqami (qo'lda kiritish)
                </div>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ko'cha nomi, uy/kvartira raqami..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border2)', fontSize: 13 }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
            }}>
              <button onClick={handleClose} style={{
                padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
                background: '#f3f4f6', border: 'none', fontSize: 13,
                fontWeight: 600, color: 'var(--text2)',
              }}>Bekor</button>
              <button onClick={handleSave} style={{
                padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
                background: 'var(--accent)', border: 'none', fontSize: 13,
                fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              }}>
                <Check size={14}/> Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
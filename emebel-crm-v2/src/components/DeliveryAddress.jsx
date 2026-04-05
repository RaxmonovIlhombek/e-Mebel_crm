// src/components/DeliveryAddress.jsx
// O'zbekiston viloyat → tuman → MFY tanlash komponenti

// ── Ma'lumotlar bazasi ────────────────────────────────────────────────────────
export const UZ_REGIONS = {
  "Toshkent shahri": {
    "Bektemir tumani":     ["Bektemir MFY","Qorasaroy MFY","Mirobod MFY"],
    "Chilonzor tumani":    ["Qo'yliq MFY","Ippodrom MFY","Navruz MFY","Bog'ishamol MFY","Chilonzor MFY"],
    "Mirobod tumani":      ["Mirobod MFY","Tinchlik MFY","Hamza MFY","Shota Rustaveli MFY"],
    "Mirzo Ulug'bek tumani":["Akademgorodok MFY","Do'stlik MFY","Universitet MFY","Yunusobod MFY"],
    "Sergeli tumani":      ["Sergeli MFY","Bunyodkor MFY","Yangi hayot MFY"],
    "Shayxontohur tumani": ["Shayxontohur MFY","Ko'kcha MFY","Eski shahar MFY"],
    "Uchtepa tumani":      ["Uchtepa MFY","O'rta osiyo MFY","Quvasoy MFY"],
    "Yakkasaroy tumani":   ["Yakkasaroy MFY","Hamkorlik MFY","Amir Temur MFY"],
    "Yashnobod tumani":    ["Yashnobod MFY","Qoratosh MFY","Kichik halqa yo'li MFY"],
    "Yunusobod tumani":    ["Yunusobod MFY","19-mavze","20-mavze","21-mavze","Navruz MFY"],
    "Olmazor tumani":      ["Olmazor MFY","Choshtepa MFY","Zangiota MFY"],
    "Larbod tumani":       ["Larbod MFY","Qorasuv MFY"],
  },
  "Toshkent viloyati": {
    "Angren shahri":     ["Markaziy MFY","Sanoat MFY","Yangi qurilish MFY"],
    "Bekobod tumani":    ["Bekobod MFY","Qizilcha MFY","Yangiyo'l MFY"],
    "Bo'stonliq tumani": ["Bo'stonliq MFY","Chorvoq MFY","Gazalkent MFY"],
    "Bo'ka tumani":      ["Bo'ka MFY","Ulmas MFY"],
    "Chinoz tumani":     ["Chinoz MFY","Aqqo'rg'on MFY"],
    "Qibray tumani":     ["Qibray MFY","Parkent MFY","Yangibozor MFY"],
    "Ohangaron tumani":  ["Ohangaron MFY","Toshbuloq MFY"],
    "Oqqo'rg'on tumani": ["Oqqo'rg'on MFY","Sho'rko'l MFY"],
    "Piskent tumani":    ["Piskent MFY","Do'stobod MFY"],
    "Quyi Chirchiq tumani":["Quyi Chirchiq MFY","Yangiyo'l MFY"],
    "Yuqori Chirchiq tumani":["Yuqori Chirchiq MFY","Gazalkent MFY"],
    "O'rtachirchiq tumani":["O'rtachirchiq MFY"],
    "Zangiota tumani":   ["Zangiota MFY","Kibray MFY","Qorasaroy MFY"],
  },
  "Samarqand viloyati": {
    "Samarqand shahri":  ["Registon MFY","Siyob MFY","Bog'ishamol MFY","Hazrat Dovud MFY"],
    "Bulung'ur tumani":  ["Bulung'ur MFY","Qo'shrabot MFY"],
    "Ishtixon tumani":   ["Ishtixon MFY","Zirabuloq MFY"],
    "Jomboy tumani":     ["Jomboy MFY","Yangi Jomboy MFY"],
    "Kattaqo'rg'on tumani":["Kattaqo'rg'on MFY","Eski Kattaqo'rg'on MFY"],
    "Narpay tumani":     ["Narpay MFY","Oqtepa MFY"],
    "Nurobod tumani":    ["Nurobod MFY"],
    "Oqdaryo tumani":    ["Oqdaryo MFY","G'ijduvon MFY"],
    "Pastdarg'om tumani":["Pastdarg'om MFY","Kimyogar MFY"],
    "Payariq tumani":    ["Payariq MFY","Yangi Payariq MFY"],
    "Qo'shrabot tumani": ["Qo'shrabot MFY"],
    "Toyloq tumani":     ["Toyloq MFY"],
    "Urgut tumani":      ["Urgut MFY","Savoy MFY"],
  },
  "Farg'ona viloyati": {
    "Farg'ona shahri":   ["Markaziy MFY","Quvasoy MFY","Bog'dod MFY","Yangi Farg'ona MFY"],
    "Oltiariq tumani":   ["Oltiariq MFY","Buvayda MFY"],
    "Bag'dod tumani":    ["Bag'dod MFY","Ko'kand yo'li MFY"],
    "Beshariq tumani":   ["Beshariq MFY"],
    "Buvayda tumani":    ["Buvayda MFY","Olmos MFY"],
    "Dang'ara tumani":   ["Dang'ara MFY"],
    "Farg'ona tumani":   ["Farg'ona tumani MFY","Yangi MFY"],
    "Furqat tumani":     ["Furqat MFY"],
    "Qo'qon shahri":     ["Qo'qon markaziy MFY","Yangi Qo'qon MFY","Sho'rtepa MFY"],
    "Marg'ilon shahri":  ["Marg'ilon MFY","Yangi Marg'ilon MFY","Ipak yo'li MFY"],
    "Rishton tumani":    ["Rishton MFY","Yozyovon MFY"],
    "So'x tumani":       ["So'x MFY"],
    "Toshloq tumani":    ["Toshloq MFY"],
    "Uchko'prik tumani": ["Uchko'prik MFY"],
    "O'zbekiston tumani":["O'zbekiston MFY"],
    "Yozyovon tumani":   ["Yozyovon MFY"],
  },
  "Andijon viloyati": {
    "Andijon shahri":    ["Markaziy MFY","Yangibozor MFY","Asaka yo'li MFY","Navruz MFY"],
    "Asaka tumani":      ["Asaka MFY","Yangi Asaka MFY"],
    "Baliqchi tumani":   ["Baliqchi MFY"],
    "Bo'z tumani":       ["Bo'z MFY","Yangi MFY"],
    "Buloqboshi tumani": ["Buloqboshi MFY"],
    "Izboskan tumani":   ["Izboskan MFY","Qo'rg'ontepa MFY"],
    "Jalaquduq tumani":  ["Jalaquduq MFY"],
    "Xo'jaobod tumani":  ["Xo'jaobod MFY"],
    "Qo'rg'ontepa tumani":["Qo'rg'ontepa MFY"],
    "Marhamat tumani":   ["Marhamat MFY"],
    "Oltinko'l tumani":  ["Oltinko'l MFY"],
    "Paxtaobod tumani":  ["Paxtaobod MFY"],
    "Shahrixon tumani":  ["Shahrixon MFY"],
    "Ulugnor tumani":    ["Ulugnor MFY"],
  },
  "Namangan viloyati": {
    "Namangan shahri":   ["Markaziy MFY","Uychi MFY","Kosonsoy yo'li MFY","Yangi Namangan MFY"],
    "Chortoq tumani":    ["Chortoq MFY"],
    "Chust tumani":      ["Chust MFY","Ko'ktepa MFY"],
    "Kosonsoy tumani":   ["Kosonsoy MFY"],
    "Mingbuloq tumani":  ["Mingbuloq MFY"],
    "Norin tumani":      ["Norin MFY"],
    "Pop tumani":        ["Pop MFY","Yangi MFY"],
    "To'raqo'rg'on tumani":["To'raqo'rg'on MFY"],
    "Uchqo'rg'on tumani":["Uchqo'rg'on MFY"],
    "Uychi tumani":      ["Uychi MFY"],
    "Yangiqo'rg'on tumani":["Yangiqo'rg'on MFY"],
  },
  "Buxoro viloyati": {
    "Buxoro shahri":     ["Markaziy MFY","Kogon yo'li MFY","Romitan MFY","Navruz MFY"],
    "G'ijduvon tumani":  ["G'ijduvon MFY","Yangi G'ijduvon MFY"],
    "Jondor tumani":     ["Jondor MFY"],
    "Kogon shahri":      ["Kogon MFY","Yangi Kogon MFY"],
    "Olot tumani":       ["Olot MFY"],
    "Peshku tumani":     ["Peshku MFY"],
    "Qorakol tumani":    ["Qorakol MFY"],
    "Romitan tumani":    ["Romitan MFY"],
    "Shofirkon tumani":  ["Shofirkon MFY","Yangi Shofirkon MFY"],
    "Vobkent tumani":    ["Vobkent MFY"],
  },
  "Qashqadaryo viloyati": {
    "Qarshi shahri":     ["Markaziy MFY","Yangi Qarshi MFY","Bog'ishamol MFY"],
    "Chiroqchi tumani":  ["Chiroqchi MFY"],
    "Dehqonobod tumani": ["Dehqonobod MFY"],
    "G'uzor tumani":     ["G'uzor MFY"],
    "Kamashi tumani":    ["Kamashi MFY"],
    "Kasbi tumani":      ["Kasbi MFY"],
    "Koson tumani":      ["Koson MFY"],
    "Mirishkor tumani":  ["Mirishkor MFY"],
    "Muborak tumani":    ["Muborak MFY"],
    "Nishon tumani":     ["Nishon MFY"],
    "Qamashi tumani":    ["Qamashi MFY"],
    "Shahrisabz tumani": ["Shahrisabz MFY","Kitob MFY"],
    "Yakkabog' tumani":  ["Yakkabog' MFY"],
  },
  "Surxondaryo viloyati": {
    "Termiz shahri":     ["Markaziy MFY","Yangi Termiz MFY","Al-Termiziy MFY"],
    "Angor tumani":      ["Angor MFY"],
    "Bandixon tumani":   ["Bandixon MFY"],
    "Boysun tumani":     ["Boysun MFY"],
    "Denov tumani":      ["Denov MFY"],
    "Jarqo'rg'on tumani":["Jarqo'rg'on MFY"],
    "Muzrabot tumani":   ["Muzrabot MFY"],
    "Oltinsoy tumani":   ["Oltinsoy MFY"],
    "Qiziriq tumani":    ["Qiziriq MFY"],
    "Qumqo'rg'on tumani":["Qumqo'rg'on MFY"],
    "Sariosiyo tumani":  ["Sariosiyo MFY"],
    "Sherobod tumani":   ["Sherobod MFY"],
    "Shero'bod tumani":  ["Shero'bod MFY"],
    "Uzun tumani":       ["Uzun MFY"],
  },
  "Xorazm viloyati": {
    "Urganch shahri":    ["Markaziy MFY","Yangi Urganch MFY","Al-Xorazmiy MFY"],
    "Bog'ot tumani":     ["Bog'ot MFY"],
    "Gurlan tumani":     ["Gurlan MFY"],
    "Xiva tumani":       ["Xiva MFY","Ichan Qal'a MFY"],
    "Xonqa tumani":      ["Xonqa MFY"],
    "Hazorasp tumani":   ["Hazorasp MFY"],
    "Qo'shko'pir tumani":["Qo'shko'pir MFY"],
    "Shovot tumani":     ["Shovot MFY"],
    "Tuproqqal'a tumani":["Tuproqqal'a MFY"],
    "Yangiariq tumani":  ["Yangiariq MFY"],
    "Yangibozor tumani": ["Yangibozor MFY"],
  },
  "Jizzax viloyati": {
    "Jizzax shahri":     ["Markaziy MFY","Yangi Jizzax MFY","Mirzo Ulug'bek MFY"],
    "Arnasoy tumani":    ["Arnasoy MFY"],
    "Baxmal tumani":     ["Baxmal MFY"],
    "Do'stlik tumani":   ["Do'stlik MFY"],
    "Forish tumani":     ["Forish MFY"],
    "G'allaorol tumani": ["G'allaorol MFY"],
    "Mirzacho'l tumani": ["Mirzacho'l MFY"],
    "Paxtakor tumani":   ["Paxtakor MFY"],
    "Yangiobod tumani":  ["Yangiobod MFY"],
    "Zarbdor tumani":    ["Zarbdor MFY"],
    "Zafarobod tumani":  ["Zafarobod MFY"],
    "Zomin tumani":      ["Zomin MFY"],
  },
  "Sirdaryo viloyati": {
    "Guliston shahri":   ["Markaziy MFY","Yangi Guliston MFY"],
    "Boyovut tumani":    ["Boyovut MFY"],
    "Gurlan tumani":     ["Gurlan MFY"],
    "Xovos tumani":      ["Xovos MFY"],
    "Mirzaobod tumani":  ["Mirzaobod MFY"],
    "Oqoltin tumani":    ["Oqoltin MFY"],
    "Sardoba tumani":    ["Sardoba MFY"],
    "Sayxunobod tumani": ["Sayxunobod MFY"],
    "Shirin shahri":     ["Shirin MFY"],
  },
  "Navoiy viloyati": {
    "Navoiy shahri":     ["Markaziy MFY","Yangi Navoiy MFY","Karmana MFY"],
    "Karmana tumani":    ["Karmana MFY"],
    "Konimex tumani":    ["Konimex MFY"],
    "Navbahor tumani":   ["Navbahor MFY"],
    "Nurota tumani":     ["Nurota MFY"],
    "Qiziltepa tumani":  ["Qiziltepa MFY"],
    "Tomdi tumani":      ["Tomdi MFY"],
    "Uchquduq tumani":   ["Uchquduq MFY"],
    "Xatirchi tumani":   ["Xatirchi MFY"],
  },
  "Qoraqalpog'iston Respublikasi": {
    "Nukus shahri":      ["Markaziy MFY","Yangi Nukus MFY","Dostlik MFY"],
    "Amudaryo tumani":   ["Amudaryo MFY"],
    "Beruniy tumani":    ["Beruniy MFY"],
    "Chimboy tumani":    ["Chimboy MFY"],
    "Ellikkala tumani":  ["Ellikkala MFY"],
    "Kegeyli tumani":    ["Kegeyli MFY"],
    "Mo'ynoq tumani":    ["Mo'ynoq MFY"],
    "Nukus tumani":      ["Nukus tumani MFY"],
    "Qanliko'l tumani":  ["Qanliko'l MFY"],
    "Qo'ng'irot tumani": ["Qo'ng'irot MFY"],
    "Shumanay tumani":   ["Shumanay MFY"],
    "Taxtako'pir tumani":["Taxtako'pir MFY"],
    "To'rtko'l tumani":  ["To'rtko'l MFY"],
    "Xo'jayli tumani":   ["Xo'jayli MFY"],
  },
}

export const REGION_NAMES  = Object.keys(UZ_REGIONS)
export const getDistricts  = (region)  => region  ? Object.keys(UZ_REGIONS[region] || {}) : []
export const getMahallas   = (region, district) =>
  (region && district) ? (UZ_REGIONS[region]?.[district] || []) : []

// ── Select style helper ───────────────────────────────────────────────────────
const selStyle = (error) => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: 9,
  fontSize: 13,
  fontFamily: 'inherit',
  border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
  background: error ? '#fff7f7' : '#f8fafc',
  color: '#0f172a',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
  transition: 'all 0.2s',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 32,
})

const Label = ({ children, required, error }) => (
  <label style={{
    display: 'block', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: error ? '#ef4444' : '#64748b', marginBottom: 5,
  }}>
    {children} {required && <span style={{ color:'#ef4444' }}>*</span>}
  </label>
)

const ErrorMsg = ({ msg }) => msg ? (
  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display:'flex', gap:4, alignItems:'center' }}>
    ⚠ {msg}
  </div>
) : null

// ── Asosiy komponent ──────────────────────────────────────────────────────────
/**
 * DeliveryAddress — O'zbekiston viloyat/tuman/MFY + ko'cha/uy tanlash
 *
 * Props:
 *   value: { region, district, mfy, address }
 *   onChange: (field, value) => void
 *   errors: { region?, district?, mfy?, address? }
 *   required: boolean  — viloyat/tuman/mfy majburiy bo'lsin
 */
export function DeliveryAddress({ value = {}, onChange, errors = {}, required = false }) {
  const { region = '', district = '', mfy = '', address = '' } = value

  const districts = getDistricts(region)
  const mahallas  = getMahallas(region, district)

  const handleRegion = (e) => {
    const v = e.target.value
    onChange('delivery_region',   v)
    onChange('delivery_district', '')   // reset
    onChange('delivery_mfy',      '')   // reset
  }

  const handleDistrict = (e) => {
    const v = e.target.value
    onChange('delivery_district', v)
    onChange('delivery_mfy',      '')   // reset
  }

  const focusStyle = (e) => {
    e.target.style.borderColor = '#f97316'
    e.target.style.boxShadow  = '0 0 0 3px rgba(249,115,22,0.12)'
    e.target.style.background = '#fff'
  }
  const blurStyle  = (e, err) => {
    e.target.style.borderColor = err ? '#fca5a5' : '#e2e8f0'
    e.target.style.boxShadow  = 'none'
    e.target.style.background = err ? '#fff7f7' : '#f8fafc'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Viloyat */}
      <div>
        <Label required={required} error={errors.region}>Viloyat</Label>
        <select
          value={region}
          onChange={handleRegion}
          onFocus={focusStyle}
          onBlur={e => blurStyle(e, errors.region)}
          style={selStyle(errors.region)}
        >
          <option value="">— Viloyatni tanlang —</option>
          {REGION_NAMES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <ErrorMsg msg={errors.region}/>
      </div>

      {/* Tuman */}
      <div>
        <Label required={required} error={errors.district}>Tuman / shahar</Label>
        <select
          value={district}
          onChange={handleDistrict}
          onFocus={focusStyle}
          onBlur={e => blurStyle(e, errors.district)}
          disabled={!region}
          style={{ ...selStyle(errors.district), opacity: region ? 1 : 0.5 }}
        >
          <option value="">
            {region ? '— Tumanni tanlang —' : '— Avval viloyat tanlang —'}
          </option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <ErrorMsg msg={errors.district}/>
      </div>

      {/* MFY */}
      <div>
        <Label required={required} error={errors.mfy}>MFY / qishloq</Label>
        <select
          value={mfy}
          onChange={e => onChange('delivery_mfy', e.target.value)}
          onFocus={focusStyle}
          onBlur={e => blurStyle(e, errors.mfy)}
          disabled={!district}
          style={{ ...selStyle(errors.mfy), opacity: district ? 1 : 0.5 }}
        >
          <option value="">
            {district ? '— MFY tanlang —' : '— Avval tuman tanlang —'}
          </option>
          {mahallas.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
          {/* Qo'lda yozish uchun "Boshqa" opsiyasi */}
          <option value="__other__">Ko'rsatilmagan (qo'lda yozing)</option>
        </select>
        <ErrorMsg msg={errors.mfy}/>
      </div>

      {/* MFY qo'lda yozish */}
      {mfy === '__other__' && (
        <div>
          <Label>MFY / qishloq nomi</Label>
          <input
            placeholder="MFY yoki qishloq nomini kiriting"
            onChange={e => onChange('delivery_mfy', e.target.value || '__other__')}
            style={{ ...selStyle(false), backgroundImage:'none', paddingRight:12 }}
            onFocus={focusStyle}
            onBlur={e => blurStyle(e, false)}
          />
        </div>
      )}

      {/* Ko'cha / uy */}
      <div>
        <Label error={errors.address}>Ko'cha / uy</Label>
        <input
          value={address}
          onChange={e => onChange('delivery_address', e.target.value)}
          onFocus={focusStyle}
          onBlur={e => blurStyle(e, errors.address)}
          placeholder="Ko'cha nomi, uy raqami, kvartira"
          style={{ ...selStyle(errors.address), backgroundImage:'none', paddingRight:12 }}
        />
        <ErrorMsg msg={errors.address}/>
      </div>

      {/* Ko'rinish — to'liq manzil */}
      {(region || district || mfy || address) && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(249,115,22,0.06)',
          border: '1px solid rgba(249,115,22,0.2)',
          fontSize: 12, color: '#92400e', lineHeight: 1.6,
        }}>
          📍 {[region, district, mfy === '__other__' ? '' : mfy, address]
            .filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  )
}
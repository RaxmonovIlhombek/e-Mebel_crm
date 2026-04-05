/**
 * PhoneInput — O'zbekiston telefon raqami
 * Ko'rsatish:  +998(90) 123-45-67
 * DB saqlash:  +998(90) 123-45-67  ← backend validator shu formatni kutadi
 */

// Displayga formatlash
export function formatPhone(input) {
  const digits = input.replace(/\D/g, '')
  const local = digits.startsWith('998') ? digits.slice(3)
              : digits.startsWith('8')   ? digits.slice(1)
              : digits

  if (!local.length) return '+998('
  if (local.length <= 2) return `+998(${local}`

  const op   = local.slice(0, 2)
  const rest = local.slice(2)
  let fmt = `+998(${op}) `
  if (rest.length <= 3)      fmt += rest
  else if (rest.length <= 5) fmt += `${rest.slice(0,3)}-${rest.slice(3)}`
  else                       fmt += `${rest.slice(0,3)}-${rest.slice(3,5)}-${rest.slice(5,7)}`
  return fmt
}

// DB ga: +998(90) 123-45-67 (backend RegexValidator talabi)
export function rawPhone(formatted) {
  const digits = formatted.replace(/\D/g, '')
  if (!digits) return ''
  const local = digits.startsWith('998') ? digits.slice(3) : digits
  if (local.length !== 9) return ''
  return `+998(${local.slice(0,2)}) ${local.slice(2,5)}-${local.slice(5,7)}-${local.slice(7,9)}`
}

// To'liq kiritilganmi?
export function isPhoneComplete(formatted) {
  return formatted.replace(/\D/g, '').length === 12
}

// ── Komponent ─────────────────────────────────────────────────────────────────
export function PhoneInput({ value, onChange, error, label, style: extraStyle, wrapStyle, ...props }) {
  const handleChange = (e) => {
    const raw = e.target.value
    if (raw.length < (value || '+998(').length) {
      if (raw.length <= 6) { onChange('+998('); return }
      onChange(raw); return
    }
    const f = formatPhone(raw)
    if (f.length <= 19) onChange(f)
  }

  const handleKeyDown = (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.selectionStart <= 6)
      e.preventDefault()
  }

  const handleFocus = (e) => {
    const len = e.target.value.length
    setTimeout(() => e.target.setSelectionRange(len, len), 0)
    e.target.style.borderColor = error ? '#ef4444' : '#6366f1'
    e.target.style.boxShadow   = `0 0 0 3px ${error ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.12)'}`
    e.target.style.background  = '#fff'
  }

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'
    e.target.style.boxShadow   = 'none'
    e.target.style.background  = error ? '#fff7f7' : '#f8fafc'
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const f = formatPhone(e.clipboardData.getData('text'))
    if (f.length <= 19) onChange(f)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...wrapStyle }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2, #374151)',
          textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 15, pointerEvents: 'none' }}>📞</span>
        <input
          {...props}
          type="tel"
          value={value || '+998('}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder="+998(90) 123-45-67"
          autoComplete="tel"
          style={{
            width: '100%', padding: '10px 14px 10px 38px',
            borderRadius: 10, fontSize: 14, color: '#0f172a',
            fontFamily: 'monospace', letterSpacing: '0.5px',
            border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
            background: error ? '#fff7f7' : '#f8fafc',
            transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
            ...extraStyle,
          }}
        />
      </div>
      {error && <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>⚠ {error}</div>}
    </div>
  )
}
/**
 * OrderPDF.jsx
 * Buyurtma PDF/Chek generatsiyasi — jsPDF kutubxonasisiz,
 * faqat browser print + CSS @media print
 *
 * Eksport:
 *   printOrderReceipt(order)  — to'lov cheki (kichik, termal printer uslubi)
 *   printOrderInvoice(order)  — to'liq hisob-faktura (A4)
 *   printOrderSummary(order)  — buyurtma xulosasi (A4)
 */

const COMPANY = {
  name:    'e-Mebel',
  tagline: 'Mebel do\'koni CRM tizimi',
  phone:   '+998 (90) 000-00-00',
  address: 'Toshkent shahar',
  website: 'emebel.uz',
}

const fmt      = n => Number(n || 0).toLocaleString('uz-UZ')
const fmtDate  = d => d ? new Date(d).toLocaleDateString('uz-UZ', { year:'numeric', month:'long', day:'numeric' }) : '—'
const fmtDT    = ()  => new Date().toLocaleString('uz-UZ', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })

const STATUS_LABELS = {
  new:'Yangi', pending:'Jarayonda', production:'Ishlab chiqarishda',
  ready:'Tayyor', delivered:'Yetkazildi', completed:'Yakunlandi', cancelled:'Bekor',
}
const PAY_METHOD = { cash:'💵 Naqd pul', card:'💳 Karta', transfer:'🏦 Bank o\'tkazma', other:'📋 Boshqa' }

// ── Chek (termal, kichik) ─────────────────────────────────────────────────────
export function printOrderReceipt(order, payment = null) {
  const paid    = Number(order.paid_amount || 0)
  const total   = Number(order.total_amount || 0)
  const payAmt  = payment ? Number(payment.amount) : paid
  const newPaid = payment ? Math.min(paid + payAmt, total) : paid
  const debt    = Math.max(total - newPaid, 0)

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Chek #${order.order_number}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: 80mm; padding: 8mm 6mm;
    font-size: 12px; line-height: 1.5; color: #000;
  }
  .center   { text-align: center; }
  .right    { text-align: right; }
  .bold     { font-weight: 700; }
  .lg       { font-size: 15px; }
  .xl       { font-size: 18px; }
  .muted    { color: #555; }
  .dashed   { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .dotted   { border: none; border-top: 1px dotted #aaa; margin: 3px 0; }
  .row      { display: flex; justify-content: space-between; padding: 2px 0; }
  .row-bold { display: flex; justify-content: space-between; padding: 3px 0; font-weight: 700; }
  .logo-box { text-align: center; margin-bottom: 6px; }
  .logo-txt { font-size: 22px; font-weight: 900; letter-spacing: 3px; }
  .logo-sub { font-size: 10px; color: #666; letter-spacing: 1px; text-transform: uppercase; }
  .paid-box {
    text-align: center; padding: 6px; margin: 6px 0;
    border: 2px solid #000; border-radius: 4px;
  }
  .barcode {
    text-align: center; font-size: 9px; color: #666;
    margin-top: 8px; font-family: monospace;
    letter-spacing: 4px;
  }
  @media print {
    body { padding: 4mm 4mm; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <!-- Header -->
  <div class="logo-box">
    <div class="logo-txt">★ e-MEBEL ★</div>
    <div class="logo-sub">Mebel do'koni</div>
  </div>
  <hr class="dashed">

  <!-- Chek info -->
  <div class="row"><span class="muted">Chek №:</span><span class="bold">#${order.order_number}</span></div>
  <div class="row"><span class="muted">Sana:</span><span>${fmtDT()}</span></div>
  <div class="row"><span class="muted">Mijoz:</span><span class="bold">${order.client_name || '—'}</span></div>
  ${order.manager_name ? `<div class="row"><span class="muted">Menejer:</span><span>${order.manager_name}</span></div>` : ''}
  <hr class="dashed">

  <!-- Mahsulotlar -->
  ${(order.items || []).map(it => `
  <div style="padding: 2px 0;">
    <div class="bold">${it.product_name}</div>
    <div class="row muted">
      <span>${fmt(it.price)} × ${it.quantity}</span>
      <span class="bold" style="color:#000">${fmt(it.subtotal)} so'm</span>
    </div>
  </div>
  <hr class="dotted">
  `).join('')}

  <!-- Summalar -->
  <div class="row"><span class="muted">Jami:</span><span>${fmt(total)} so'm</span></div>
  ${order.discount > 0 ? `<div class="row"><span class="muted">Chegirma (${order.discount}%):</span><span>-${fmt(total * order.discount / 100)} so'm</span></div>` : ''}
  <hr class="dashed">

  ${payment ? `
  <div class="row-bold"><span>Ushbu to'lov:</span><span>+${fmt(payAmt)} so'm</span></div>
  <div class="row"><span class="muted">Usul:</span><span>${PAY_METHOD[payment.method] || payment.method}</span></div>
  ${payment.note ? `<div class="row"><span class="muted">Izoh:</span><span>${payment.note}</span></div>` : ''}
  <hr class="dashed">
  ` : ''}

  <div class="row-bold"><span>To'langan:</span><span>${fmt(newPaid)} so'm</span></div>
  <div class="row-bold"><span>Qolgan qarz:</span><span>${debt > 0 ? fmt(debt) + ' so\'m' : '✓ To\'liq'}</span></div>

  ${debt === 0 ? `
  <div class="paid-box">
    <div class="bold xl">✓ TO'LIQ TO'LANGAN</div>
  </div>
  ` : `
  <div style="padding:6px; border:1px dashed #000; border-radius:4px; margin:6px 0; text-align:center;">
    <div class="muted" style="font-size:10px;">QOLGAN QARZ</div>
    <div class="bold lg">${fmt(debt)} so'm</div>
  </div>
  `}

  <hr class="dashed">

  <!-- Footer -->
  <div class="center muted" style="font-size:10px; margin-top:4px;">
    <div>${COMPANY.phone}</div>
    <div>${COMPANY.address}</div>
    <div style="margin-top:4px; font-style:italic;">Xarid uchun rahmat! 🙏</div>
    <div>Chek taqdim etilmasa qaytarilmaydi</div>
  </div>

  <div class="barcode">
    ||| ${order.order_number}-${Date.now().toString(36).toUpperCase()} |||
  </div>

  <div class="no-print" style="text-align:center; margin-top:12px; padding-top:8px; border-top:1px solid #ddd;">
    <button onclick="window.print()" style="padding:8px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:700;">
      🖨️ Chop etish
    </button>
    <button onclick="window.close()" style="padding:8px 20px; background:#f3f4f6; color:#333; border:none; border-radius:6px; cursor:pointer; font-size:13px; margin-left:8px;">
      ✕ Yopish
    </button>
  </div>
</body>
</html>`

  _openPrint(html, `chek_${order.order_number}`)
}

// ── Hisob-faktura (Invoice, A4) ───────────────────────────────────────────────
export function printOrderInvoice(order) {
  const total   = Number(order.total_amount || 0)
  const paid    = Number(order.paid_amount || 0)
  const debt    = Number(order.remaining_amount || 0)

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Hisob-faktura #${order.order_number}</title>
<style>
  @page { margin: 15mm 15mm; size: A4; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }
  h1 { font-size: 28px; font-weight: 900; color: #1a1a1a; }
  h2 { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1a2540; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f9fafb; }
  .header    { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #f97316; }
  .logo-name { font-size: 32px; font-weight: 900; color: #1a2540; letter-spacing: -1px; }
  .logo-name span { color: #f97316; }
  .logo-sub  { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
  .invoice-no { text-align: right; }
  .invoice-no .num { font-size: 22px; font-weight: 900; color: #f97316; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
  .badge-new        { background:#dbeafe; color:#1d4ed8; }
  .badge-production { background:#ffedd5; color:#c2410c; }
  .badge-ready      { background:#d1fae5; color:#065f46; }
  .badge-delivered  { background:#d1fae5; color:#047857; }
  .badge-cancelled  { background:#fee2e2; color:#b91c1c; }
  .badge-completed  { background:#f3f4f6; color:#374151; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .info-box  { background: #f9fafb; border-radius: 10px; padding: 16px; border: 1px solid #e5e7eb; }
  .info-row  { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; font-size: 12.5px; }
  .info-row:last-child { border-bottom: none; }
  .info-row .label { color: #6b7280; }
  .info-row .value { font-weight: 600; text-align: right; }
  .total-box { margin-top: 16px; display: flex; justify-content: flex-end; }
  .total-table { min-width: 300px; }
  .total-table td { padding: 7px 12px; }
  .grand-total td { background: #1a2540; color: #fff; font-size: 15px; font-weight: 900; border-radius: 0; }
  .grand-total td:last-child { color: #f97316; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; display:flex; justify-content:space-between; font-size: 11px; color: #9ca3af; }
  .stamp-box { border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px 24px; text-align: center; font-size: 11px; color: #9ca3af; min-width: 150px; }
  @media print {
    .no-print { display: none; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo-name"><span>e-</span>Mebel</div>
      <div class="logo-sub">Mebel do'koni CRM</div>
      <div style="margin-top:10px; font-size:12px; color:#6b7280; line-height:1.8;">
        📍 ${COMPANY.address}<br>
        📞 ${COMPANY.phone}<br>
        🌐 ${COMPANY.website}
      </div>
    </div>
    <div class="invoice-no">
      <div style="font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:2px; margin-bottom:4px;">HISOB-FAKTURA</div>
      <div class="num">#${order.order_number}</div>
      <div style="margin-top:8px; font-size:12px; color:#6b7280;">
        <div>Sana: <strong>${fmtDT()}</strong></div>
        <div style="margin-top:4px;">
          <span class="badge badge-${order.status}">${STATUS_LABELS[order.status] || order.status}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Info grid -->
  <div class="info-grid">
    <div class="info-box">
      <h2>👤 Mijoz</h2>
      <div class="info-row"><span class="label">Ism</span><span class="value">${order.client_name || '—'}</span></div>
      <div class="info-row"><span class="label">Telefon</span><span class="value">${order.client_phone || '—'}</span></div>
      <div class="info-row"><span class="label">Yetkazish manzili</span><span class="value" style="max-width:180px;">${order.full_delivery_address || '—'}</span></div>
      <div class="info-row"><span class="label">Yetkazish sanasi</span><span class="value">${fmtDate(order.delivery_date)}</span></div>
    </div>
    <div class="info-box">
      <h2>💰 To'lov holati</h2>
      <div class="info-row"><span class="label">Jami summa</span><span class="value">${fmt(total)} so'm</span></div>
      ${order.discount > 0 ? `<div class="info-row"><span class="label">Chegirma (${order.discount}%)</span><span class="value" style="color:#ef4444;">-${fmt(total * order.discount / 100)} so'm</span></div>` : ''}
      <div class="info-row"><span class="label">To'langan</span><span class="value" style="color:#10b981;">${fmt(paid)} so'm</span></div>
      <div class="info-row"><span class="label">Qolgan qarz</span><span class="value" style="color:${debt > 0 ? '#ef4444' : '#10b981'};">${debt > 0 ? fmt(debt) + ' so\'m' : '✓ To\'liq to\'langan'}</span></div>
      ${order.manager_name ? `<div class="info-row"><span class="label">Menejer</span><span class="value">${order.manager_name}</span></div>` : ''}
    </div>
  </div>

  <!-- Mahsulotlar jadvali -->
  <h2>📦 Mahsulotlar</h2>
  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Mahsulot nomi</th>
        <th style="width:80px; text-align:center">Soni</th>
        <th style="width:130px; text-align:right">Narxi</th>
        <th style="width:140px; text-align:right">Jami</th>
      </tr>
    </thead>
    <tbody>
      ${(order.items || []).map((it, i) => `
      <tr>
        <td style="color:#9ca3af">${i + 1}</td>
        <td><strong>${it.product_name}</strong>${it.notes ? `<br><small style="color:#9ca3af">${it.notes}</small>` : ''}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${fmt(it.price)} so'm</td>
        <td style="text-align:right; font-weight:700; color:#f97316">${fmt(it.subtotal)} so'm</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Jami -->
  <div class="total-box">
    <table class="total-table">
      <tr><td style="color:#6b7280">Mahsulotlar jami:</td><td style="text-align:right; font-weight:600">${fmt(total)} so'm</td></tr>
      ${order.discount > 0 ? `<tr><td style="color:#ef4444">Chegirma (${order.discount}%):</td><td style="text-align:right; color:#ef4444">-${fmt(total * order.discount / 100)} so'm</td></tr>` : ''}
      <tr><td style="color:#10b981">To'langan:</td><td style="text-align:right; color:#10b981">${fmt(paid)} so'm</td></tr>
      ${debt > 0 ? `<tr><td style="color:#ef4444">Qolgan qarz:</td><td style="text-align:right; color:#ef4444">${fmt(debt)} so'm</td></tr>` : ''}
      <tr class="grand-total"><td>JAMI SUMMA</td><td style="text-align:right">${fmt(total)} so'm</td></tr>
    </table>
  </div>

  <!-- To'lovlar tarixi -->
  ${order.payments?.length ? `
  <div style="margin-top:24px;">
    <h2>💳 To'lovlar tarixi</h2>
    <table>
      <thead><tr>
        <th>Sana</th><th>Usul</th><th>Izoh</th><th style="text-align:right">Summa</th>
      </tr></thead>
      <tbody>
        ${order.payments.map(p => `
        <tr>
          <td>${fmtDate(p.created_at)}</td>
          <td>${PAY_METHOD[p.method] || p.method}</td>
          <td style="color:#6b7280">${p.note || '—'}</td>
          <td style="text-align:right; font-weight:700; color:#10b981">+${fmt(p.amount)} so'm</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Izoh -->
  ${order.notes ? `
  <div style="margin-top:20px; padding:12px 16px; background:#f9fafb; border-radius:8px; border-left:3px solid #f97316;">
    <strong style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Izoh:</strong>
    <p style="margin-top:4px; color:#374151;">${order.notes}</p>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>
      <div style="font-weight:700; color:#374151; margin-bottom:4px;">e-Mebel CRM</div>
      <div>${COMPANY.phone} · ${COMPANY.website}</div>
      <div style="margin-top:8px; max-width:300px;">Ushbu hujjat e-Mebel CRM tizimi tomonidan avtomatik yaratilgan.</div>
    </div>
    <div style="text-align:right;">
      <div class="stamp-box">
        <div style="margin-bottom:8px;">Imzo va muhr uchun</div>
        <div style="height:50px;"></div>
        <div>____________</div>
      </div>
    </div>
  </div>

  <!-- Print button -->
  <div class="no-print" style="position:fixed; bottom:20px; right:20px; display:flex; gap:8px;">
    <button onclick="window.print()" style="padding:10px 24px; background:#f97316; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:700; box-shadow:0 4px 16px rgba(249,115,22,0.4);">
      🖨️ Chop etish / PDF
    </button>
    <button onclick="window.close()" style="padding:10px 20px; background:#f3f4f6; color:#374151; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600;">
      ✕ Yopish
    </button>
  </div>
</body>
</html>`

  _openPrint(html, `faktura_${order.order_number}`)
}

// ── Helper: yangi oynada ochish ───────────────────────────────────────────────
function _openPrint(html, name) {
  const w = window.open('', `_${name}`, 'width=900,height=700,scrollbars=yes')
  if (!w) { alert('Popup bloklangan. Brauzerda ruxsat bering.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
}
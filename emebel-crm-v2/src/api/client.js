/**
 * e-Mebel CRM — API Client
 * Backend: Django REST Framework + Token auth
 * Base URL: /api  (Vite proxy orqali → http://localhost:8000/api)
 */

const BASE = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  #token = localStorage.getItem('crm_token') || ''

  get token() { return this.#token }

  setToken(t) {
    this.#token = t
    if (t) localStorage.setItem('crm_token', t)
    else   localStorage.removeItem('crm_token')
  }

  async #req(method, path, body = null, isFormData = false) {
    const headers = {}
    if (this.#token) headers['Authorization'] = `Token ${this.#token}`
    if (!isFormData)  headers['Content-Type']  = 'application/json'

    const opts = { method, headers }
    if (body) opts.body = isFormData ? body : JSON.stringify(body)

    const res  = await fetch(`${BASE}${path}`, opts)
    if (res.status === 204) return null

    const data = await res.json()
    if (!res.ok) {
      // To'liq xato ma'lumotini ko'rsatamiz
      const msg =
        data?.error ||
        data?.detail ||
        data?.non_field_errors?.[0] ||
        Object.values(data || {}).flat()[0] ||
        JSON.stringify(data) ||
        'Xato yuz berdi'
      if (res.status === 401) {
        this.setToken('')
        localStorage.removeItem('crm_user')
        window.location.href = '/login'
      }
      throw new Error(String(msg))
    }
    return data
  }

  get        = (p)           => this.#req('GET',    p)
  post       = (p, b)        => this.#req('POST',   p, b)
  patch      = (p, b)        => this.#req('PATCH',  p, b)
  put        = (p, b)        => this.#req('PUT',    p, b)
  del        = (p)           => this.#req('DELETE', p)
  postForm   = (p, b)        => this.#req('POST',   p, b, true)
  patchForm  = (p, b)        => this.#req('PATCH',  p, b, true)


  /* ══════════════════════════════════════════
     AUTH
     POST /api/auth/login/  → { token, user }
     POST /api/auth/register/
     POST /api/auth/logout/
     GET  /api/auth/me/     → UserSerializer
     PATCH /api/auth/me/
     POST /api/auth/change-password/
  ══════════════════════════════════════════ */
  login          = (creds) => this.post('/auth/login/',           creds)
  register       = (data)  => this.post('/auth/register/',        data)
  logout         = ()      => this.post('/auth/logout/')
  me             = ()      => this.get('/auth/me/')
  updateMe       = (data)  => this.patch('/auth/me/',             data)
  changePassword = (data)  => this.post('/auth/change-password/', data)


  /* ══════════════════════════════════════════
     DASHBOARD
     GET /api/dashboard/
     Response: {
       total_orders, new_orders, total_clients,
       total_revenue, total_debt, low_stock_count,
       today_orders, today_revenue,
       orders_by_status: {new,pending,...},
       status_distribution: {new:N,...},
       recent_orders: [OrderSerializer],
       overdue_orders: [...], in_production: [...],
       monthly_trend: [{month,revenue,count}],
       payment_methods: {cash,card,transfer,other},
       top_clients: [{name,phone,total_spent,order_count}],
       top_products: [{name,qty,revenue}],
       staff_activity: [{name,order_count}],
     }
  ══════════════════════════════════════════ */
  dashboard = () => this.get('/dashboard/')


  /* ══════════════════════════════════════════
     CLIENTS
     ClientSerializer: id, name, phone, phone2, email,
       region, district, mfy, address, city, avatar,
       notes, is_archived, total_orders, total_spent, created_at
  ══════════════════════════════════════════ */
  clients = ({ search = '', archived = false, page = 1 } = {}) => {
    const p = new URLSearchParams({ archived: String(archived), page: String(page) })
    if (search) p.set('search', search)
    return this.get(`/clients/?${p}`)
  }
  clientCreate = (data)     => this.post('/clients/',      data)
  clientGet    = (id)       => this.get(`/clients/${id}/`)
  clientUpdate = (id, data) => this.patch(`/clients/${id}/`, data)
  clientDelete = (id)       => this.del(`/clients/${id}/`)
  clientArchive= (id)       => this.post(`/clients/${id}/archive/`)


  /* ══════════════════════════════════════════
     CATEGORIES
     CategorySerializer: id, name, slug, description
  ══════════════════════════════════════════ */
  categories     = ()           => this.get('/categories/')
  categoryCreate = (data)       => this.post('/categories/',        data)
  categoryUpdate = (id, data)   => this.patch(`/categories/${id}/`, data)
  categoryDelete = (id)         => this.del(`/categories/${id}/`)


  /* ══════════════════════════════════════════
     PRODUCTS
     ProductSerializer: id, name, sku, description, image,
       category, category_name, cost_price, selling_price,
       material, color, dimensions, is_active, stock_quantity, created_at
  ══════════════════════════════════════════ */
  products = ({ search = '', category = '', active = '', page = 1 } = {}) => {
    const p = new URLSearchParams({ page: String(page) })
    if (search)        p.set('search',   search)
    if (category)      p.set('category', String(category))
    if (active !== '') p.set('active',   String(active))
    return this.get(`/products/?${p}`)
  }
  productCreate = (data)     => this.post('/products/',        data)
  productGet    = (id)       => this.get(`/products/${id}/`)
  productUpdate = (id, data) => this.patch(`/products/${id}/`, data)
  productDelete = (id)       => this.del(`/products/${id}/`)


  /* ══════════════════════════════════════════
     ORDERS
     OrderSerializer: id, order_number, client, client_name, client_phone,
       manager, manager_name, status, payment_status,
       total_amount, paid_amount, remaining_amount, discount,
       delivery_region, delivery_district, delivery_mfy,
       delivery_address, full_delivery_address,
       delivery_date, notes, items[], payments[], created_at, updated_at

     OrderCreateSerializer body: {
       client(int), manager(int?),
       delivery_region, delivery_district, delivery_mfy,
       delivery_address, delivery_date, discount, notes,
       items: [{product(int), quantity(int), price(decimal), notes?}]
     }
  ══════════════════════════════════════════ */
  orders = ({ status = '', client = '', search = '', page = 1 } = {}) => {
    const p = new URLSearchParams({ page: String(page) })
    if (status) p.set('status', status)
    if (client) p.set('client', String(client))
    if (search) p.set('search', search)
    return this.get(`/orders/?${p}`)
  }
  orderCreate       = (data)         => this.post('/orders/',               data)
  orderGet          = (id)           => this.get(`/orders/${id}/`)
  orderUpdate       = (id, data)     => this.patch(`/orders/${id}/`,        data)
  orderDelete       = (id)           => this.del(`/orders/${id}/`)
  orderStatusUpdate = (id, status)   => this.patch(`/orders/${id}/status/`, { status })

  /* PaymentSerializer body: amount(decimal), method(cash|card|transfer|other), note?
     Response: id, amount, method, note, is_confirmed,
               received_by, received_by_name,
               submitted_by, submitted_by_name, created_at */
  paymentAdd = (orderId, data) => this.post(`/orders/${orderId}/payments/`, data)


  /* ══════════════════════════════════════════
     WAREHOUSE / STOCK
     StockSerializer: id, product, product_name, product_sku,
       product_category, quantity, min_quantity, is_low, updated_at

     GET  /api/stock/?search=&low_stock=true
     PATCH /api/stock/<pk>/  body:{min_quantity}

     StockMovementSerializer: id, product, product_name, product_sku,
       movement_type(in|out|adjust), quantity, reason,
       performed_by, performed_by_name, created_at
  ══════════════════════════════════════════ */
  stock = ({ search = '', low_stock = false, page = 1 } = {}) => {
    const p = new URLSearchParams({ page: String(page) })
    if (search)    p.set('search',    search)
    if (low_stock) p.set('low_stock', 'true')
    return this.get(`/stock/?${p}`)
  }
  stockUpdate = (id, data) => this.patch(`/stock/${id}/`, data)

  movements = ({ product = '' } = {}) => {
    const p = new URLSearchParams()
    if (product) p.set('product', String(product))
    return this.get(`/movements/?${p}`)
  }
  movementCreate = (data) => this.post('/movements/', data)


  /* ══════════════════════════════════════════
     MESSAGES
     MessageSerializer: id, sender, sender_name, sender_role,
       receiver, receiver_name, receiver_role,
       body, is_read, order_ref, is_order_notification, created_at
  ══════════════════════════════════════════ */
  messages      = ()           => this.get('/messages/')
  messageSend   = (data)       => this.post('/messages/',        data)
  messageUpdate = (id, data)   => this.patch(`/messages/${id}/`, data)


  /* ══════════════════════════════════════════
     USERS
     UserSerializer: id, username, first_name, last_name, full_name,
       email, role, phone, avatar, telegram_chat_id, telegram_username,
       is_active, last_login, date_joined
  ══════════════════════════════════════════ */
  users = ({ role = '', active = '', page = 1 } = {}) => {
    const p = new URLSearchParams({ page: String(page) })
    if (role)   p.set('role',   role)
    if (active) p.set('active', String(active))
    return this.get(`/users/?${p}`)
  }
  userUpdate         = (id, data) => this.patch(`/users/${id}/`, data)
  userDelete         = (id)       => this.del(`/users/${id}/`)
  userToggleActive   = (id)       => this.post(`/users/${id}/toggle-active/`)
  userResetPassword  = (id, data) => this.post(`/users/${id}/reset-password/`, data)

  messageMarkAllRead = () => this.post('/messages/read-all/')


  /* ══════════════════════════════════════════
     FINANCE
     GET /api/finance/summary/
     Response: {
       revenue: { total, year, month, today, prev_month, growth },
       debt:    { total, count, overdue, overdue_count },
       orders:  { month_count, month_sum, cancelled, completed, avg_amount },
       method_breakdown: [{method, total, count}],
       period:  { today, month_start, year_start }
     }

     GET /api/finance/payments/?date_from=&date_to=&method=&search=&page=&per_page=
     Response: { results:[...], total, count, page, pages }

     GET /api/finance/debts/?filter=all|overdue|partial&search=
     Response: { results:[...], total_debt, count }

     GET /api/finance/chart/?period=week|month|year
     Response: { chart:[{label,value}], period }
  ══════════════════════════════════════════ */
  financeSummary  = ()                => this.get(`/finance/summary/?_t=${Date.now()}`)
  financePayments = (params = {})     => {
    const p = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== undefined) p.set(k, v) })
    return this.get(`/finance/payments/?${p}`)
  }
  financeDebts    = (params = {})     => {
    const p = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== undefined) p.set(k, v) })
    return this.get(`/finance/debts/?${p}`)
  }
  financeChart    = (period = 'month') => this.get(`/finance/chart/?period=${period}`)
  financeExpenses = (params = {})     => {
    const p = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== undefined) p.set(k, v) })
    return this.get(`/finance/expenses/?${p}`)
  }
  financeExpenseCreate = (data) => this.post('/finance/expenses/', data)
  financeExpenseDelete = (id)   => this.del('/finance/expenses/', { id })


  /* ══════════════════════════════════════════
     NOTIFICATIONS (REST fallback — WebSocket yo'q bo'lganda)
     GET    /api/notifications/
     POST   /api/notifications/read/  body:{id: int|'all'}
     DELETE /api/notifications/clear/
  ══════════════════════════════════════════ */
  notifications     = ()         => this.get('/notifications/')
  notifMarkRead     = (id)       => this.post('/notifications/read/', { id })
  notifMarkAllRead  = ()         => this.post('/notifications/read/', { id: 'all' })
  notifClear        = ()         => this.del('/notifications/clear/')


  /* ══════════════════════════════════════════
     AI ASSISTANT
     POST /api/ai/
     body: { message, mode: 'chat'|'report'|'advice', history: [{role,content}] }
     Response: { answer, alerts:[...], context:{...} }
  ══════════════════════════════════════════ */
  ai = (data) => this.post('/ai/', data)
}

export const api = new ApiClient()
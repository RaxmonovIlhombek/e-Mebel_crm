# e-Mebel CRM — React Frontend

## Texnologiyalar
- **React 18** + **Vite 5**
- **React Router DOM v6** — sahifalar routing
- **Recharts** — dashboard grafiklari
- **Lucide React** — ikonlar
- **Outfit** + **JetBrains Mono** — fontlar

## Ishga tushirish

```bash
# 1. O'rnatish
npm install

# 2. Dev server (Django backend port 8000 da ishlashi kerak)
npm run dev

# 3. Build (production)
npm run build
```

## Struktura

```
src/
├── api/
│   └── client.js          ← API chaqiruvlari
├── components/
│   ├── UI.jsx             ← Barcha UI komponentlar
│   └── Layout.jsx         ← Sidebar + Shell
├── context/
│   └── AppContext.jsx     ← Auth + Toast state
├── hooks/
│   └── useFetch.js        ← Data fetching hooklar
├── pages/
│   ├── Login.jsx          ← Kirish sahifasi
│   ├── Dashboard.jsx      ← Statistika & grafiklar
│   ├── Orders.jsx         ← Buyurtmalar CRUD
│   ├── Clients.jsx        ← Mijozlar CRUD
│   ├── Products.jsx       ← Mahsulotlar CRUD
│   ├── Warehouse.jsx      ← Ombor boshqaruvi
│   └── Messages.jsx       ← Xabar almashish
├── App.jsx                ← Router
├── main.jsx               ← Entry point
└── index.css              ← Global CSS o'zgaruvchilari
```

## Backend bilan ulash

`vite.config.js` da proxy sozlangan:
```js
proxy: { '/api': { target: 'http://:8000', changeOrigin: true } }
```

Django backend **localhost:8000** da ishlashi kerak. API endpointlari:
- `POST /api/auth/login/` — Token authentication
- `GET  /api/dashboard/`
- `GET/POST /api/orders/`
- `GET/POST /api/clients/`
- `GET/POST /api/products/`
- `GET/POST /api/stock/`
- va boshqalar...

## Django uchun kerakli paketlar

```bash
pip install djangorestframework django-cors-headers
python manage.py migrate
```

`requirements.txt` ga qo'shing:
```
djangorestframework==3.15.2
django-cors-headers==4.4.0
```

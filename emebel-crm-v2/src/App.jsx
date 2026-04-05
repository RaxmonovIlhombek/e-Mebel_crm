import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '@/hooks/useApp'
import { AppProvider } from '@/context/AppContext'
import { Shell } from '@/components/Layout'
import { ToastContainer } from '@/components/UI'
import LoginPage        from '@/pages/Login'
import RegisterPage     from '@/pages/Register'
import ForgotPasswordPage from '@/pages/ForgotPassword'
import Dashboard  from '@/pages/Dashboard'
import Orders     from '@/pages/Orders'
import Clients    from '@/pages/Clients'
import Products   from '@/pages/Products'
import Warehouse  from '@/pages/Warehouse'
import Messages   from '@/pages/Messages'
import Finance    from '@/pages/Finance'
import AI         from '@/pages/AI'
import Staff      from '@/pages/Staff'
import Profile    from '@/pages/Profile'
import Landing    from '@/pages/Landing'
import Analytics   from '@/pages/Analytics'
import Categories  from '@/pages/Categories'
import Barcode    from '@/pages/Barcode'
import { KeyboardShortcutsModal, useKeyboardShortcuts } from '@/components/KeyboardShortcuts'

const ROLE_ROUTES = {
  admin:      ['/', '/orders', '/clients', '/products', '/categories', '/warehouse', '/barcode', '/finance', '/analytics', '/ai', '/messages', '/staff'],
  manager:    ['/', '/orders', '/clients', '/products', '/categories', '/warehouse', '/barcode', '/analytics', '/ai', '/messages', '/staff'],
  accountant: ['/', '/orders', '/clients', '/products', '/categories', '/warehouse', '/barcode', '/finance', '/analytics', '/ai', '/messages'],
  worker:     ['/', '/orders', '/products', '/categories', '/warehouse', '/barcode', '/messages'],
  client:     ['/orders', '/products', '/messages'],
}

function RoleRoute({ path, element, user }) {
  const allowed = ROLE_ROUTES[user?.role] || []
  if (!allowed.includes(path)) return <Navigate to={user?.role === 'client' ? "/products" : "/"} replace />
  return element
}

function ProtectedRoutes() {
  const { user } = useApp()
  const { showHelp, setShowHelp } = useKeyboardShortcuts()
  if (!user) return <Navigate to="/login" replace />
  return (
    <Shell>
      <KeyboardShortcutsModal open={showHelp} onClose={() => setShowHelp(false)}/>
      <Routes>
        <Route path="/"          element={user?.role === 'client' ? <Navigate to="/products" replace /> : <Dashboard />} />
        <Route path="/orders"    element={<RoleRoute path="/orders"    element={<Orders />}    user={user} />} />
        <Route path="/clients"   element={<RoleRoute path="/clients"   element={<Clients />}   user={user} />} />
        <Route path="/products"  element={<RoleRoute path="/products"  element={<Products />}  user={user} />} />
        <Route path="/warehouse" element={<RoleRoute path="/warehouse" element={<Warehouse />} user={user} />} />
        <Route path="/barcode"   element={<RoleRoute path="/barcode"   element={<Barcode />}   user={user} />} />
        <Route path="/finance"   element={<RoleRoute path="/finance"   element={<Finance />}   user={user} />} />
        <Route path="/ai"        element={<RoleRoute path="/ai"        element={<AI />}        user={user} />} />
        <Route path="/messages"  element={<RoleRoute path="/messages"  element={<Messages />}  user={user} />} />
        <Route path="/staff"     element={<RoleRoute path="/staff"     element={<Staff />}     user={user} />} />
        <Route path="/analytics"  element={<RoleRoute path="/analytics"  element={<Analytics />}  user={user} />} />
        <Route path="/categories" element={<RoleRoute path="/categories" element={<Categories />} user={user} />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="*"          element={<Navigate to={user?.role === 'client' ? "/products" : "/"} replace />} />
      </Routes>
    </Shell>
  )
}

function AppRoutes() {
  const { user, toasts } = useApp()
  return (
    <>
      <Routes>
        {/* Autentifikatsiya sahifalari */}
        <Route path="/landing"         element={!user ? <Landing />           : <Navigate to={user?.role === 'client' ? "/products" : "/"} replace />} />
        <Route path="/login"           element={!user ? <LoginPage />         : <Navigate to={user?.role === 'client' ? "/products" : "/"} replace />} />
        <Route path="/register"        element={!user ? <RegisterPage />      : <Navigate to={user?.role === 'client' ? "/products" : "/"} replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage />: <Navigate to={user?.role === 'client' ? "/products" : "/"} replace />} />

        <Route path="/" element={!user ? <Landing /> : <ProtectedRoutes />} />
        <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
        <Route path="/*" element={user ? <ProtectedRoutes /> : <Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
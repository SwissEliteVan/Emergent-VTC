import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Accueil from './pages/Accueil'
import Clients from './pages/Clients'
import Devis from './pages/Devis'
import Factures from './pages/Factures'
import Comptabilite from './pages/Comptabilite'
import Login from './pages/Login'
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/devis" element={<Devis />} />
                  <Route path="/factures" element={<Factures />} />
                  <Route path="/comptabilite" element={<Comptabilite />} />
                </Routes>
              </DashboardLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </HashRouter>
  )
}

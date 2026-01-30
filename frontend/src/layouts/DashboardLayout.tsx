import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Home,
  Users,
  FileText,
  Receipt,
  PieChart,
  LogOut,
  Settings
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/devis', icon: FileText, label: 'Devis' },
    { path: '/factures', icon: Receipt, label: 'Factures' },
    { path: '/comptabilite', icon: PieChart, label: 'Comptabilite' }
  ]

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <a href="#/" className="sidebar-logo">
            <span>CRM</span> Clicom
          </a>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu Principal</div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                end={item.path === '/'}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Parametres</div>
            <NavLink to="/settings" className="nav-link">
              <Settings />
              <span>Configuration</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h4>{user?.name || 'Utilisateur'}</h4>
              <p>{user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ width: '100%', marginTop: '12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut />
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

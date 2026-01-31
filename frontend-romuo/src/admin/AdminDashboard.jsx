import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  MapPin,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { adminApi, formatPrice } from '../utils/api';
import DispatchBoard from './DispatchBoard';
import CalendarView from './CalendarView';
import DriversManagement from './DriversManagement';
import VehiclesManagement from './VehiclesManagement';
import ZonesManagement from './ZonesManagement';

// Dashboard Overview Component
function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Impossible de charger les statistiques
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-sm text-navy-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-CH')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="stat-card-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gold-700 font-medium">Revenu Total</p>
              <p className="text-2xl font-bold text-navy-900 mt-1">
                {formatPrice(stats.revenue.total)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gold-400/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gold-600" />
            </div>
          </div>
          <p className="text-xs text-gold-600 mt-2">
            Aujourd'hui: {formatPrice(stats.revenue.today)}
          </p>
        </div>

        {/* Rides Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Courses</p>
              <p className="text-2xl font-bold text-navy-900 mt-1">
                {stats.rides.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-navy-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Aujourd'hui: {stats.rides.today}
          </p>
        </div>

        {/* Drivers Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Chauffeurs</p>
              <p className="text-2xl font-bold text-navy-900 mt-1">
                {stats.drivers.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="text-success-600">
              {stats.drivers.available} disponibles
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              {stats.drivers.busy} en course
            </span>
          </div>
        </div>

        {/* Pending Rides Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">En attente</p>
              <p className="text-2xl font-bold text-navy-900 mt-1">
                {stats.rides.pending}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.rides.active} courses actives
          </p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card">
          <h3 className="font-semibold text-navy-900 mb-4">Statuts des courses</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning-500" />
                <span className="text-sm text-gray-600">En attente</span>
              </div>
              <span className="font-medium text-navy-900">{stats.rides.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-navy-500" />
                <span className="text-sm text-gray-600">En cours</span>
              </div>
              <span className="font-medium text-navy-900">{stats.rides.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-sm text-gray-600">Terminées</span>
              </div>
              <span className="font-medium text-navy-900">{stats.rides.completed}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="font-semibold text-navy-900 mb-4">Flotte</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Véhicules total</span>
              <span className="font-medium text-navy-900">{stats.vehicles.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Disponibles</span>
              <span className="font-medium text-success-600">{stats.vehicles.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Utilisateurs</span>
              <span className="font-medium text-navy-900">{stats.users.total}</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="font-semibold text-navy-900 mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Courses aujourd'hui</span>
              <span className="font-medium text-navy-900">{stats.rides.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Complétées aujourd'hui</span>
              <span className="font-medium text-success-600">{stats.rides.today_completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenu moyen</span>
              <span className="font-medium text-gold-600">
                {stats.rides.completed > 0
                  ? formatPrice(stats.revenue.total / stats.rides.completed)
                  : '-- CHF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/dispatch', icon: MapPin, label: 'Dispatch' },
    { to: '/admin/calendar', icon: Calendar, label: 'Planning' },
    { to: '/admin/drivers', icon: Users, label: 'Chauffeurs' },
    { to: '/admin/vehicles', icon: Car, label: 'Véhicules' },
    { to: '/admin/zones', icon: Settings, label: 'Zones' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-navy-900 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <span className="text-gold-400 font-bold text-xl">Romuo</span>
          <span className="text-white text-sm">Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 bottom-0 w-64 bg-navy-900 z-40
        transform transition-transform duration-300
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <span className="text-gold-400 font-bold text-2xl">Romuo</span>
            <span className="text-white/60 text-sm">.ch</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-swiss
                transition-colors duration-200
                ${isActive
                  ? 'bg-gold-400/20 text-gold-400'
                  : 'text-navy-200 hover:text-white hover:bg-navy-800'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Back to Site */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-navy-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 w-full text-navy-300 hover:text-white hover:bg-navy-800 rounded-swiss transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Retour au site</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="dispatch" element={<DispatchBoard />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="drivers" element={<DriversManagement />} />
            <Route path="vehicles" element={<VehiclesManagement />} />
            <Route path="zones" element={<ZonesManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

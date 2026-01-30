import {
  Users,
  FileText,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const revenueData = [
  { month: 'Jan', montant: 12400 },
  { month: 'Fev', montant: 15600 },
  { month: 'Mar', montant: 14200 },
  { month: 'Avr', montant: 18900 },
  { month: 'Mai', montant: 21300 },
  { month: 'Juin', montant: 19800 },
  { month: 'Juil', montant: 24500 }
]

const recentActivities = [
  { id: 1, type: 'facture', desc: 'Facture #2024-089 payee', client: 'Dupont SA', time: 'Il y a 2h' },
  { id: 2, type: 'devis', desc: 'Nouveau devis #D-456 cree', client: 'Martin & Co', time: 'Il y a 3h' },
  { id: 3, type: 'client', desc: 'Nouveau client ajoute', client: 'Tech Solutions', time: 'Il y a 5h' },
  { id: 4, type: 'facture', desc: 'Facture #2024-088 envoyee', client: 'ABC Services', time: 'Hier' }
]

export default function Accueil() {
  return (
    <>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de votre activite commerciale</p>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>156</h3>
              <p>Clients actifs</p>
              <div className="stat-trend up">
                <ArrowUpRight size={14} /> +12% ce mois
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <Receipt size={24} />
            </div>
            <div className="stat-content">
              <h3>CHF 89'450</h3>
              <p>Chiffre d'affaires</p>
              <div className="stat-trend up">
                <ArrowUpRight size={14} /> +8.2% ce mois
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <h3>23</h3>
              <p>Devis en attente</p>
              <div className="stat-trend down">
                <ArrowDownRight size={14} /> -3 cette semaine
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>67%</h3>
              <p>Taux de conversion</p>
              <div className="stat-trend up">
                <ArrowUpRight size={14} /> +5.4% ce mois
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Evolution du chiffre d'affaires</h3>
              <span className="badge info">2024</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`CHF ${value.toLocaleString()}`, 'Montant']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Activite recente</h3>
            </div>
            <div>
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '4px' }}>
                      {activity.desc}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {activity.client}
                    </p>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

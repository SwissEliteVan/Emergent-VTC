import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

const monthlyData = [
  { mois: 'Jan', revenus: 45000, depenses: 12000 },
  { mois: 'Fev', revenus: 52000, depenses: 14500 },
  { mois: 'Mar', revenus: 48000, depenses: 11800 },
  { mois: 'Avr', revenus: 61000, depenses: 16200 },
  { mois: 'Mai', revenus: 55000, depenses: 13900 },
  { mois: 'Juin', revenus: 67000, depenses: 18500 }
]

const repartitionData = [
  { name: 'Prestations IT', value: 45, color: '#3b82f6' },
  { name: 'Consulting', value: 25, color: '#22c55e' },
  { name: 'Formation', value: 18, color: '#f59e0b' },
  { name: 'Maintenance', value: 12, color: '#8b5cf6' }
]

const recentTransactions = [
  { id: 1, desc: 'Facture F-2024-089 - Dupont SA', montant: 12500, type: 'credit', date: '2024-01-28' },
  { id: 2, desc: 'Achat licences logiciels', montant: -2400, type: 'debit', date: '2024-01-27' },
  { id: 3, desc: 'Facture F-2024-093 - Weber Consulting', montant: 21300, type: 'credit', date: '2024-01-26' },
  { id: 4, desc: 'Frais bancaires', montant: -45, type: 'debit', date: '2024-01-25' },
  { id: 5, desc: 'Abonnement cloud', montant: -890, type: 'debit', date: '2024-01-24' }
]

export default function Comptabilite() {
  const totalRevenus = monthlyData.reduce((sum, m) => sum + m.revenus, 0)
  const totalDepenses = monthlyData.reduce((sum, m) => sum + m.depenses, 0)
  const beneficeNet = totalRevenus - totalDepenses
  const margeNette = ((beneficeNet / totalRevenus) * 100).toFixed(1)

  return (
    <>
      <div className="page-header">
        <h1>Comptabilite</h1>
        <p>Suivi financier et analyse de rentabilite</p>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>CHF {totalRevenus.toLocaleString()}</h3>
              <p>Revenus (6 mois)</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <TrendingDown size={24} />
            </div>
            <div className="stat-content">
              <h3>CHF {totalDepenses.toLocaleString()}</h3>
              <p>Depenses (6 mois)</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <h3>CHF {beneficeNet.toLocaleString()}</h3>
              <p>Benefice net</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <h3>{margeNette}%</h3>
              <p>Marge nette</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Revenus vs Depenses</h3>
              <span className="badge info">6 derniers mois</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mois" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`CHF ${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="revenus" fill="#22c55e" name="Revenus" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" fill="#f59e0b" name="Depenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Repartition du CA</h3>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={repartitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {repartitionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transactions recentes</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.desc}</td>
                    <td>{new Date(t.date).toLocaleDateString('fr-CH')}</td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: t.type === 'credit' ? '#22c55e' : '#ef4444'
                    }}>
                      {t.type === 'credit' ? '+' : ''}CHF {t.montant.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

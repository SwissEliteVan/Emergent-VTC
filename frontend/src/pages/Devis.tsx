import { useState } from 'react'
import { Plus, Search, Eye, Send, CheckCircle, XCircle } from 'lucide-react'

interface Devis {
  id: number
  numero: string
  client: string
  date: string
  validite: string
  montant: number
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
}

const devisData: Devis[] = [
  { id: 1, numero: 'D-2024-089', client: 'Dupont SA', date: '2024-01-15', validite: '2024-02-15', montant: 12500, statut: 'accepte' },
  { id: 2, numero: 'D-2024-090', client: 'Martin & Co', date: '2024-01-18', validite: '2024-02-18', montant: 8900, statut: 'envoye' },
  { id: 3, numero: 'D-2024-091', client: 'Tech Solutions', date: '2024-01-20', validite: '2024-02-20', montant: 15600, statut: 'brouillon' },
  { id: 4, numero: 'D-2024-092', client: 'ABC Services', date: '2024-01-22', validite: '2024-02-22', montant: 6800, statut: 'refuse' },
  { id: 5, numero: 'D-2024-093', client: 'Weber Consulting', date: '2024-01-25', validite: '2024-02-25', montant: 21300, statut: 'envoye' }
]

export default function Devis() {
  const [search, setSearch] = useState('')
  const [devis] = useState<Devis[]>(devisData)
  const [filter, setFilter] = useState<Devis['statut'] | 'tous'>('tous')

  const filteredDevis = devis.filter(d => {
    const matchSearch = d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.client.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'tous' || d.statut === filter
    return matchSearch && matchFilter
  })

  const getStatusBadge = (statut: Devis['statut']) => {
    const config: Record<typeof statut, { class: string; label: string }> = {
      brouillon: { class: 'info', label: 'Brouillon' },
      envoye: { class: 'warning', label: 'Envoye' },
      accepte: { class: 'success', label: 'Accepte' },
      refuse: { class: 'danger', label: 'Refuse' },
      expire: { class: 'danger', label: 'Expire' }
    }
    return <span className={`badge ${config[statut].class}`}>{config[statut].label}</span>
  }

  const totalEnAttente = devis
    .filter(d => d.statut === 'envoye')
    .reduce((sum, d) => sum + d.montant, 0)

  const totalAccepte = devis
    .filter(d => d.statut === 'accepte')
    .reduce((sum, d) => sum + d.montant, 0)

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Devis</h1>
        <p>Creez et suivez vos propositions commerciales</p>
      </div>

      <div className="page-content">
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{devis.filter(d => d.statut === 'envoye').length}</h3>
              <p>Devis en attente</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>CHF {totalEnAttente.toLocaleString()}</h3>
              <p>Montant en attente</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>CHF {totalAccepte.toLocaleString()}</h3>
              <p>Montant accepte</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '200px' }}
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Devis['statut'] | 'tous')}
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="tous">Tous</option>
                <option value="brouillon">Brouillons</option>
                <option value="envoye">Envoyes</option>
                <option value="accepte">Acceptes</option>
                <option value="refuse">Refuses</option>
              </select>
            </div>
            <button className="btn btn-primary">
              <Plus size={18} />
              Nouveau devis
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Validite</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.numero}</td>
                    <td>{d.client}</td>
                    <td>{new Date(d.date).toLocaleDateString('fr-CH')}</td>
                    <td>{new Date(d.validite).toLocaleDateString('fr-CH')}</td>
                    <td style={{ fontWeight: 600 }}>CHF {d.montant.toLocaleString()}</td>
                    <td>{getStatusBadge(d.statut)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '8px' }} title="Voir">
                          <Eye size={16} />
                        </button>
                        {d.statut === 'brouillon' && (
                          <button className="btn btn-secondary" style={{ padding: '8px' }} title="Envoyer">
                            <Send size={16} />
                          </button>
                        )}
                        {d.statut === 'envoye' && (
                          <>
                            <button className="btn btn-secondary" style={{ padding: '8px', color: '#22c55e' }} title="Accepter">
                              <CheckCircle size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '8px', color: '#ef4444' }} title="Refuser">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
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

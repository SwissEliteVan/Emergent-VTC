import { useState } from 'react'
import { Plus, Search, Eye, Download, Send, AlertCircle } from 'lucide-react'

interface Facture {
  id: number
  numero: string
  client: string
  date: string
  echeance: string
  montant: number
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee'
}

const facturesData: Facture[] = [
  { id: 1, numero: 'F-2024-089', client: 'Dupont SA', date: '2024-01-15', echeance: '2024-02-15', montant: 12500, statut: 'payee' },
  { id: 2, numero: 'F-2024-090', client: 'Martin & Co', date: '2024-01-18', echeance: '2024-02-18', montant: 8900, statut: 'envoyee' },
  { id: 3, numero: 'F-2024-091', client: 'Tech Solutions', date: '2024-01-05', echeance: '2024-01-20', montant: 15600, statut: 'en_retard' },
  { id: 4, numero: 'F-2024-092', client: 'ABC Services', date: '2024-01-22', echeance: '2024-02-22', montant: 6800, statut: 'brouillon' },
  { id: 5, numero: 'F-2024-093', client: 'Weber Consulting', date: '2024-01-10', echeance: '2024-02-10', montant: 21300, statut: 'payee' }
]

export default function Factures() {
  const [search, setSearch] = useState('')
  const [factures] = useState<Facture[]>(facturesData)
  const [filter, setFilter] = useState<Facture['statut'] | 'tous'>('tous')

  const filteredFactures = factures.filter(f => {
    const matchSearch = f.numero.toLowerCase().includes(search.toLowerCase()) ||
      f.client.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'tous' || f.statut === filter
    return matchSearch && matchFilter
  })

  const getStatusBadge = (statut: Facture['statut']) => {
    const config: Record<typeof statut, { class: string; label: string }> = {
      brouillon: { class: 'info', label: 'Brouillon' },
      envoyee: { class: 'warning', label: 'Envoyee' },
      payee: { class: 'success', label: 'Payee' },
      en_retard: { class: 'danger', label: 'En retard' },
      annulee: { class: 'danger', label: 'Annulee' }
    }
    return <span className={`badge ${config[statut].class}`}>{config[statut].label}</span>
  }

  const totalPayees = factures
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + f.montant, 0)

  const totalEnAttente = factures
    .filter(f => f.statut === 'envoyee')
    .reduce((sum, f) => sum + f.montant, 0)

  const totalEnRetard = factures
    .filter(f => f.statut === 'en_retard')
    .reduce((sum, f) => sum + f.montant, 0)

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Factures</h1>
        <p>Suivez vos factures et encaissements</p>
      </div>

      <div className="page-content">
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-content">
              <h3>CHF {totalPayees.toLocaleString()}</h3>
              <p>Total encaisse</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>CHF {totalEnAttente.toLocaleString()}</h3>
              <p>En attente</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content" style={{ color: totalEnRetard > 0 ? '#ef4444' : 'inherit' }}>
              <h3>CHF {totalEnRetard.toLocaleString()}</h3>
              <p>En retard</p>
            </div>
          </div>
        </div>

        {totalEnRetard > 0 && (
          <div className="card" style={{ background: 'rgba(239,68,68,0.05)', borderColor: '#fca5a5', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
              <AlertCircle size={24} />
              <div>
                <strong>Attention :</strong> Vous avez {factures.filter(f => f.statut === 'en_retard').length} facture(s) en retard de paiement pour un total de CHF {totalEnRetard.toLocaleString()}
              </div>
            </div>
          </div>
        )}

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
                onChange={(e) => setFilter(e.target.value as Facture['statut'] | 'tous')}
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="tous">Toutes</option>
                <option value="brouillon">Brouillons</option>
                <option value="envoyee">Envoyees</option>
                <option value="payee">Payees</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
            <button className="btn btn-primary">
              <Plus size={18} />
              Nouvelle facture
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Echeance</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFactures.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.numero}</td>
                    <td>{f.client}</td>
                    <td>{new Date(f.date).toLocaleDateString('fr-CH')}</td>
                    <td>{new Date(f.echeance).toLocaleDateString('fr-CH')}</td>
                    <td style={{ fontWeight: 600 }}>CHF {f.montant.toLocaleString()}</td>
                    <td>{getStatusBadge(f.statut)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '8px' }} title="Voir">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '8px' }} title="Telecharger PDF">
                          <Download size={16} />
                        </button>
                        {(f.statut === 'brouillon' || f.statut === 'en_retard') && (
                          <button className="btn btn-secondary" style={{ padding: '8px' }} title="Envoyer">
                            <Send size={16} />
                          </button>
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

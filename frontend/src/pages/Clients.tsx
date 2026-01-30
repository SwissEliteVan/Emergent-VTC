import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react'

interface Client {
  id: number
  nom: string
  entreprise: string
  email: string
  telephone: string
  statut: 'actif' | 'inactif' | 'prospect'
  ca: number
}

const clientsData: Client[] = [
  { id: 1, nom: 'Jean Dupont', entreprise: 'Dupont SA', email: 'j.dupont@dupont.ch', telephone: '+41 79 123 45 67', statut: 'actif', ca: 45600 },
  { id: 2, nom: 'Marie Martin', entreprise: 'Martin & Co', email: 'm.martin@martin.ch', telephone: '+41 79 234 56 78', statut: 'actif', ca: 32400 },
  { id: 3, nom: 'Pierre Bernard', entreprise: 'Tech Solutions', email: 'p.bernard@techsol.ch', telephone: '+41 79 345 67 89', statut: 'prospect', ca: 0 },
  { id: 4, nom: 'Sophie Laurent', entreprise: 'ABC Services', email: 's.laurent@abc.ch', telephone: '+41 79 456 78 90', statut: 'actif', ca: 28900 },
  { id: 5, nom: 'Marc Weber', entreprise: 'Weber Consulting', email: 'm.weber@weber.ch', telephone: '+41 79 567 89 01', statut: 'inactif', ca: 15200 }
]

export default function Clients() {
  const [search, setSearch] = useState('')
  const [clients] = useState<Client[]>(clientsData)

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(search.toLowerCase()) ||
    client.entreprise.toLowerCase().includes(search.toLowerCase()) ||
    client.email.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (statut: Client['statut']) => {
    const classes: Record<typeof statut, string> = {
      actif: 'success',
      inactif: 'danger',
      prospect: 'warning'
    }
    const labels: Record<typeof statut, string> = {
      actif: 'Actif',
      inactif: 'Inactif',
      prospect: 'Prospect'
    }
    return <span className={`badge ${classes[statut]}`}>{labels[statut]}</span>
  }

  return (
    <>
      <div className="page-header">
        <h1>Gestion des Clients</h1>
        <p>Gerez votre portefeuille clients et prospects</p>
      </div>

      <div className="page-content">
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
                  placeholder="Rechercher un client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '300px' }}
                />
              </div>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {filteredClients.length} client(s)
              </span>
            </div>
            <button className="btn btn-primary">
              <Plus size={18} />
              Nouveau client
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Statut</th>
                  <th>CA Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{client.nom}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{client.entreprise}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                          <Mail size={14} color="#64748b" /> {client.email}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                          <Phone size={14} color="#64748b" /> {client.telephone}
                        </span>
                      </div>
                    </td>
                    <td>{getStatusBadge(client.statut)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {client.ca > 0 ? `CHF ${client.ca.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px' }}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px', color: '#ef4444' }}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
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

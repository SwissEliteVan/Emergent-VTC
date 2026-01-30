import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  User,
  Phone,
  Mail,
  Star,
  Car,
} from 'lucide-react';
import { adminApi, getDriverStatusLabel } from '../utils/api';

export default function DriversManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    photo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await adminApi.getDrivers();
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingDriver) {
        await adminApi.updateDriver(editingDriver.driver_id, formData);
      } else {
        await adminApi.createDriver(formData);
      }
      await loadDrivers();
      closeModal();
    } catch (error) {
      console.error('Failed to save driver:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driverId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) return;

    try {
      await adminApi.deleteDriver(driverId);
      await loadDrivers();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleStatusChange = async (driverId, status) => {
    try {
      await adminApi.updateDriverStatus(driverId, status);
      await loadDrivers();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const openCreateModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      photo: '',
    });
    setShowModal(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      photo: driver.photo || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDriver(null);
  };

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-sm text-navy-900">Chauffeurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {drivers.length} chauffeurs enregistrés
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary btn-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un chauffeur
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un chauffeur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-12"
        />
      </div>

      {/* Drivers Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="admin-card text-center py-12 text-gray-500">
          Aucun chauffeur trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <div key={driver.driver_id} className="admin-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center overflow-hidden">
                      {driver.photo ? (
                        <img
                          src={driver.photo}
                          alt={driver.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-navy-600" />
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        driver.status === 'available'
                          ? 'bg-success-500'
                          : driver.status === 'busy'
                          ? 'bg-danger-500'
                          : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{driver.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                      {driver.rating?.toFixed(1) || '5.0'} • {driver.total_trips || 0} courses
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(driver)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(driver.driver_id)}
                    className="p-2 hover:bg-danger-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-danger-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{driver.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="w-4 h-4 text-gray-400" />
                  <span>Permis: {driver.license_number}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <select
                  value={driver.status}
                  onChange={(e) => handleStatusChange(driver.driver_id, e.target.value)}
                  className="form-select text-sm py-2"
                >
                  <option value="available">Disponible</option>
                  <option value="busy">En course</option>
                  <option value="offline">Hors ligne</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-navy-900">
                {editingDriver ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="jean@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="+41 79 123 45 67"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">N° Permis *</label>
                  <input
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="form-input"
                    placeholder="ABC123456"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiration permis *</label>
                  <input
                    type="date"
                    required
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">URL Photo (optionnel)</label>
                <input
                  type="url"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Enregistrement...' : editingDriver ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

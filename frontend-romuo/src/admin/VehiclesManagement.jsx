import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Car,
  Calendar,
  Settings,
} from 'lucide-react';
import { adminApi, getVehicleCategory } from '../utils/api';

const VEHICLE_CATEGORIES = [
  { id: 'eco', name: 'Eco', description: 'Véhicule économique' },
  { id: 'berline', name: 'Berline Luxe', description: 'Mercedes Classe E ou équivalent' },
  { id: 'van', name: 'Van Premium', description: 'Mercedes V-Class' },
  { id: 'bus', name: 'Bus', description: 'Minibus/Sprinter' },
];

export default function VehiclesManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    color: '',
    category: 'berline',
    capacity: 4,
    insurance_expiry: '',
    features: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await adminApi.getVehicles();
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingVehicle) {
        await adminApi.updateVehicle(editingVehicle.vehicle_id, formData);
      } else {
        await adminApi.createVehicle(formData);
      }
      await loadVehicles();
      closeModal();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
      alert(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;

    try {
      await adminApi.deleteVehicle(vehicleId);
      await loadVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      color: '',
      category: 'berline',
      capacity: 4,
      insurance_expiry: '',
      features: [],
    });
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.license_plate,
      color: vehicle.color,
      category: vehicle.category,
      capacity: vehicle.capacity,
      insurance_expiry: vehicle.insurance_expiry,
      features: vehicle.features || [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-success">Disponible</span>;
      case 'in_use':
        return <span className="badge badge-navy">En utilisation</span>;
      case 'maintenance':
        return <span className="badge badge-warning">Maintenance</span>;
      default:
        return <span className="badge badge-navy">{status}</span>;
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || vehicle.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-heading-sm text-navy-900">Véhicules</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vehicles.length} véhicules dans la flotte
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary btn-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un véhicule
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un véhicule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-12"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="form-select sm:w-48"
        >
          <option value="">Toutes catégories</option>
          {VEHICLE_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Vehicles Table */}
      {filteredVehicles.length === 0 ? (
        <div className="admin-card text-center py-12 text-gray-500">
          Aucun véhicule trouvé
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-swiss">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Immatriculation</th>
                  <th>Catégorie</th>
                  <th>Capacité</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-swiss bg-navy-100 flex items-center justify-center">
                          <Car className="w-5 h-5 text-navy-600" />
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.color} • {vehicle.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="swiss-plate">{vehicle.license_plate}</span>
                    </td>
                    <td>
                      <span className="badge badge-navy">
                        {getVehicleCategory(vehicle.category)}
                      </span>
                    </td>
                    <td>{vehicle.capacity} places</td>
                    <td>{getStatusBadge(vehicle.status)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.vehicle_id)}
                          className="p-2 hover:bg-danger-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-danger-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-navy-900">
                {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="form-input"
                    placeholder="Mercedes"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Modèle *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="form-input"
                    placeholder="Classe E"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Année *</label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Couleur *</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="form-input"
                    placeholder="Noir"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Immatriculation *</label>
                  <input
                    type="text"
                    required
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                    className="form-input"
                    placeholder="VD 123 456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Catégorie *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} - {cat.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Capacité *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiration assurance *</label>
                <input
                  type="date"
                  required
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Enregistrement...' : editingVehicle ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

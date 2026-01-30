import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  MapPin,
  Navigation,
  DollarSign,
  ArrowLeftRight,
} from 'lucide-react';
import { adminApi, formatPrice } from '../utils/api';
import { zoneApi } from '../utils/api';

export default function ZonesManagement() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    origin: { name: '', lat: '', lon: '', radius_km: 2 },
    destination: { name: '', lat: '', lon: '', radius_km: 2 },
    prices: { eco: '', berline: '', van: '', bus: '' },
    bidirectional: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await zoneApi.getAll();
      setZones(response.data.zones);
    } catch (error) {
      console.error('Failed to load zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Convert price strings to numbers
    const processedData = {
      ...formData,
      origin: {
        ...formData.origin,
        lat: parseFloat(formData.origin.lat),
        lon: parseFloat(formData.origin.lon),
        radius_km: parseFloat(formData.origin.radius_km),
      },
      destination: {
        ...formData.destination,
        lat: parseFloat(formData.destination.lat),
        lon: parseFloat(formData.destination.lon),
        radius_km: parseFloat(formData.destination.radius_km),
      },
      prices: {
        eco: parseFloat(formData.prices.eco) || 0,
        berline: parseFloat(formData.prices.berline) || 0,
        van: parseFloat(formData.prices.van) || 0,
        bus: parseFloat(formData.prices.bus) || 0,
      },
    };

    try {
      if (editingZone) {
        await adminApi.updateZone(editingZone.zone_id, processedData);
      } else {
        await adminApi.createZone(processedData);
      }
      await loadZones();
      closeModal();
    } catch (error) {
      console.error('Failed to save zone:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;

    try {
      await adminApi.deleteZone(zoneId);
      await loadZones();
    } catch (error) {
      console.error('Failed to delete zone:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const openCreateModal = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      origin: { name: '', lat: '', lon: '', radius_km: 2 },
      destination: { name: '', lat: '', lon: '', radius_km: 2 },
      prices: { eco: '', berline: '', van: '', bus: '' },
      bidirectional: true,
    });
    setShowModal(true);
  };

  const openEditModal = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      origin: { ...zone.origin },
      destination: { ...zone.destination },
      prices: { ...zone.prices },
      bidirectional: zone.bidirectional,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingZone(null);
  };

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
          <h1 className="text-heading-sm text-navy-900">Zones Tarifaires</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les tarifs fixes pour les trajets fréquents
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary btn-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une zone
        </button>
      </div>

      {/* Info Card */}
      <div className="admin-card bg-gold-50 border-gold-200">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-gold-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-navy-900">Prix forfaitaires</h3>
            <p className="text-sm text-gray-600 mt-1">
              Les zones tarifaires permettent de définir des prix fixes pour les trajets fréquents
              (ex: Aéroport → Centre-ville). Si un trajet correspond à une zone, le prix
              forfaitaire est appliqué au lieu du calcul standard.
            </p>
          </div>
        </div>
      </div>

      {/* Zones List */}
      {zones.length === 0 ? (
        <div className="admin-card text-center py-12 text-gray-500">
          Aucune zone tarifaire configurée
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <div key={zone.zone_id} className="admin-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-navy-900">{zone.name}</h3>
                  {zone.bidirectional && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <ArrowLeftRight className="w-3 h-3" />
                      Bidirectionnel
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(zone)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.zone_id)}
                    className="p-2 hover:bg-danger-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-danger-500" />
                  </button>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-navy-900">{zone.origin.name}</p>
                    <p className="text-xs text-gray-500">
                      Rayon: {zone.origin.radius_km} km
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-navy-900">{zone.destination.name}</p>
                    <p className="text-xs text-gray-500">
                      Rayon: {zone.destination.radius_km} km
                    </p>
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-swiss">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Eco</p>
                  <p className="font-semibold text-navy-900">
                    {formatPrice(zone.prices.eco)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Berline</p>
                  <p className="font-semibold text-navy-900">
                    {formatPrice(zone.prices.berline)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Van</p>
                  <p className="font-semibold text-navy-900">
                    {formatPrice(zone.prices.van)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Bus</p>
                  <p className="font-semibold text-navy-900">
                    {formatPrice(zone.prices.bus)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-navy-900">
                {editingZone ? 'Modifier la zone' : 'Nouvelle zone tarifaire'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Zone Name */}
              <div className="form-group">
                <label className="form-label">Nom de la zone *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Aéroport Genève ↔ Lausanne"
                />
              </div>

              {/* Origin */}
              <div className="p-4 bg-success-50 rounded-swiss-lg">
                <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-success-500" />
                  Point de départ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 form-group">
                    <label className="form-label">Nom du lieu *</label>
                    <input
                      type="text"
                      required
                      value={formData.origin.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origin: { ...formData.origin, name: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="Aéroport de Genève"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.origin.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origin: { ...formData.origin, lat: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="46.2381"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.origin.lon}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origin: { ...formData.origin, lon: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="6.1089"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rayon (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={formData.origin.radius_km}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origin: { ...formData.origin, radius_km: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="p-4 bg-danger-50 rounded-swiss-lg">
                <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-danger-500" />
                  Point d'arrivée
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 form-group">
                    <label className="form-label">Nom du lieu *</label>
                    <input
                      type="text"
                      required
                      value={formData.destination.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destination: { ...formData.destination, name: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="Lausanne Centre"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.destination.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destination: { ...formData.destination, lat: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="46.5197"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.destination.lon}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destination: { ...formData.destination, lon: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="6.6323"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rayon (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={formData.destination.radius_km}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destination: { ...formData.destination, radius_km: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="p-4 bg-gold-50 rounded-swiss-lg">
                <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold-600" />
                  Prix forfaitaires (CHF)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="form-group">
                    <label className="form-label">Eco *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.prices.eco}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prices: { ...formData.prices, eco: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="95"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Berline *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.prices.berline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prices: { ...formData.prices, berline: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="130"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Van *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.prices.van}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prices: { ...formData.prices, van: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="180"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bus *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.prices.bus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prices: { ...formData.prices, bus: e.target.value },
                        })
                      }
                      className="form-input"
                      placeholder="280"
                    />
                  </div>
                </div>
              </div>

              {/* Bidirectional */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bidirectional"
                  checked={formData.bidirectional}
                  onChange={(e) =>
                    setFormData({ ...formData, bidirectional: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-navy-900 focus:ring-navy-900"
                />
                <label htmlFor="bidirectional" className="text-sm text-gray-700">
                  Zone bidirectionnelle (le tarif s'applique dans les deux sens)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Enregistrement...' : editingZone ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

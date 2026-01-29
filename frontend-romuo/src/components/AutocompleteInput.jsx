import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, X, Loader2, Building2, Home, MapPinned, Train } from 'lucide-react';

// Configuration API - Photon (Komoot) est plus rapide que Nominatim pour l'autocomplete
const PHOTON_API = 'https://photon.komoot.io/api/';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// Centre de la Suisse romande pour les resultats priorises
const SWISS_ROMANDE_CENTER = { lat: 46.52, lon: 6.63 }; // Lausanne

// Types d'icones selon le type de lieu
const getPlaceIcon = (type, osmValue) => {
  if (osmValue === 'station' || osmValue === 'halt') return Train;
  if (type === 'house' || osmValue === 'residential') return Home;
  if (type === 'city' || type === 'town' || type === 'village') return Building2;
  if (type === 'street') return MapPinned;
  return MapPin;
};

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  icon: Icon = MapPin,
  label
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const searchTimeout = useRef(null);
  const abortControllerRef = useRef(null);

  // Fermer le dropdown si clic a l'exterieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec Photon API (plus rapide pour l'autocomplete)
  const searchWithPhoton = async (query, signal) => {
    const params = new URLSearchParams({
      q: query,
      limit: 10,
      lang: 'fr',
      lat: SWISS_ROMANDE_CENTER.lat,
      lon: SWISS_ROMANDE_CENTER.lon,
      location_bias_scale: 0.5, // Biais vers la Suisse romande
    });

    const response = await fetch(`${PHOTON_API}?${params}`, {
      signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error('Photon API error');

    const data = await response.json();

    return data.features
      .filter(f => {
        // Filtrer pour garder principalement la Suisse
        const country = f.properties.country;
        return country === 'Switzerland' || country === 'Suisse' || country === 'Schweiz';
      })
      .map(f => {
        const p = f.properties;
        const coords = f.geometry.coordinates;

        // Construire le nom d'affichage
        let displayName = '';
        if (p.housenumber && p.street) {
          displayName = `${p.street} ${p.housenumber}`;
        } else if (p.street) {
          displayName = p.street;
        } else if (p.name) {
          displayName = p.name;
        }

        // Construire l'adresse secondaire
        let secondaryInfo = '';
        const parts = [];
        if (p.postcode) parts.push(p.postcode);
        if (p.city || p.town || p.village) parts.push(p.city || p.town || p.village);
        if (p.state) parts.push(p.state);
        secondaryInfo = parts.join(' ');

        // Type de lieu
        const type = p.osm_value || p.type || 'place';
        const PlaceIcon = getPlaceIcon(type, p.osm_value);

        return {
          id: `${coords[0]}-${coords[1]}`,
          name: displayName || p.name || secondaryInfo,
          city: p.city || p.town || p.village || '',
          postcode: p.postcode || '',
          state: p.state || '',
          country: p.country || 'Suisse',
          lat: coords[1],
          lon: coords[0],
          type: type,
          icon: PlaceIcon,
          hasStreet: !!(p.street || p.housenumber),
          fullAddress: [displayName, secondaryInfo].filter(Boolean).join(', '),
          priority: p.street ? 1 : (p.city ? 2 : 3)
        };
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 8);
  };

  // Fallback vers Nominatim si Photon echoue
  const searchWithNominatim = async (query, signal) => {
    const params = new URLSearchParams({
      format: 'json',
      q: `${query}, Suisse`,
      countrycodes: 'ch',
      limit: 10,
      addressdetails: 1
    });

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      signal,
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'RomuoVTC/1.0'
      }
    });

    if (!response.ok) throw new Error('Nominatim API error');

    const data = await response.json();

    return data
      .filter(p => p.class !== 'boundary' && p.type !== 'administrative')
      .map(place => {
        const hasRoad = place.address?.road;
        const hasHouseNumber = place.address?.house_number;
        const city = place.address?.town || place.address?.city || place.address?.village;

        let displayName = '';
        if (hasRoad) {
          displayName = hasHouseNumber
            ? `${place.address.road} ${hasHouseNumber}`
            : place.address.road;
        } else if (city) {
          displayName = city;
        } else {
          displayName = place.name || place.display_name.split(',')[0];
        }

        return {
          id: `${place.lat}-${place.lon}`,
          name: displayName,
          city: city || '',
          postcode: place.address?.postcode || '',
          state: place.address?.state || '',
          country: 'Suisse',
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
          type: place.type,
          icon: hasRoad ? Home : Building2,
          hasStreet: !!hasRoad,
          fullAddress: place.display_name.split(',').slice(0, 3).join(','),
          priority: hasRoad ? 1 : 2
        };
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 8);
  };

  // Fonction principale de recherche
  const searchAddresses = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Annuler la requete precedente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      // Essayer Photon d'abord (plus rapide)
      let results = await searchWithPhoton(query, abortControllerRef.current.signal);

      // Fallback vers Nominatim si pas de resultats
      if (results.length === 0) {
        results = await searchWithNominatim(query, abortControllerRef.current.signal);
      }

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name === 'AbortError') return; // Requete annulee, ignorer

      console.error('Erreur de recherche d\'adresse:', error);

      // Essayer Nominatim en backup
      try {
        const results = await searchWithNominatim(query, abortControllerRef.current.signal);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler de changement avec debounce reduit (300ms)
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Annuler le timeout precedent
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (inputValue.length >= 2) {
      // Debounce de 300ms pour une meilleure reactivite
      searchTimeout.current = setTimeout(() => {
        searchAddresses(inputValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Selection d'une suggestion
  const handleSelectSuggestion = (place) => {
    const formattedAddress = place.fullAddress || `${place.name}, ${place.postcode} ${place.city}`;
    onChange(formattedAddress);

    // Notifier le parent avec les coordonnees si callback fourni
    if (onSelect) {
      onSelect({
        address: formattedAddress,
        lat: place.lat,
        lon: place.lon,
        city: place.city,
        postcode: place.postcode
      });
    }

    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Effacer le champ
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onSelect) onSelect(null);
    inputRef.current?.focus();
  };

  // Navigation clavier
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="input-dark pl-12 pr-10"
          autoComplete="off"
          spellCheck="false"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-[9999] w-full mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-luxury overflow-hidden animate-slide-up"
          style={{ maxHeight: '320px', overflowY: 'auto' }}
        >
          {suggestions.map((place, index) => {
            const PlaceIcon = place.icon || MapPin;
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectSuggestion(place)}
                className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3
                  ${index === selectedIndex
                    ? 'bg-primary/20 border-l-2 border-primary'
                    : 'hover:bg-dark-700 border-l-2 border-transparent'
                  }
                `}
              >
                <PlaceIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {place.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {place.postcode && place.city
                      ? `${place.postcode} ${place.city}`
                      : place.city || place.state}
                  </p>
                  {place.hasStreet && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                      Adresse
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Message si pas de resultats */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-[9999] w-full mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-luxury p-4">
          <p className="text-gray-400 text-sm text-center">
            Aucune adresse trouvee en Suisse romande
          </p>
          <p className="text-gray-500 text-xs text-center mt-1">
            Essayez avec le nom de la ville ou le code postal
          </p>
        </div>
      )}
    </div>
  );
}

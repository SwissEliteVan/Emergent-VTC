import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';

export default function AutocompleteInput({
  value,
  onChange,
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche d'adresses via Nominatim OpenStreetMap
  const searchAddresses = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // API Nominatim - recherche en Suisse uniquement avec focus sur adresses
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&` +
        `countrycodes=ch&limit=10&addressdetails=1&` +
        `featuretype=settlement`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'Romuo-VTC-App'
          }
        }
      );

      const data = await response.json();

      // Formatter les résultats avec priorité aux rues
      const formatted = data
        .map(place => {
          const hasRoad = place.address?.road;
          const hasHouseNumber = place.address?.house_number;

          return {
            display_name: place.display_name,
            address: place.address,
            name: hasRoad
              ? (hasHouseNumber ? `${place.address.road} ${hasHouseNumber}` : place.address.road)
              : (place.address.town || place.address.city || place.name),
            city: place.address.city || place.address.town || place.address.village,
            postcode: place.address.postcode,
            lat: place.lat,
            lon: place.lon,
            type: place.type,
            hasStreet: hasRoad,
            priority: hasRoad ? 1 : 2 // Priorité aux rues
          };
        })
        // Trier: rues d'abord, puis villes
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 6);

      setSuggestions(formatted);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur de recherche d\'adresse:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Annuler la recherche précédente
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (inputValue.length >= 3) {
      // Attendre 500ms avant de lancer la recherche (debounce)
      searchTimeout.current = setTimeout(() => {
        searchAddresses(inputValue);
      }, 500);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (place) => {
    // Utiliser l'adresse complète formatée
    const formattedAddress = place.display_name.split(',').slice(0, 2).join(',');
    onChange(formattedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
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
          onFocus={() => value.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="input-dark pl-12 pr-10"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
        {value && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-luxury overflow-hidden animate-slide-up max-h-80 overflow-y-auto">
          {suggestions.map((place, index) => (
            <button
              key={`${place.lat}-${place.lon}`}
              onClick={() => handleSelectSuggestion(place)}
              className={`w-full px-4 py-3 text-left transition-colors
                ${index === selectedIndex
                  ? 'bg-primary/20 border-l-2 border-primary'
                  : 'hover:bg-dark-700'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">
                    {place.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {place.city && place.postcode ? `${place.postcode} ${place.city}` : place.city}
                  </p>
                  {place.hasStreet && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                      Adresse
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de résultats */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-luxury p-4">
          <p className="text-gray-400 text-sm text-center">
            Aucune adresse trouvée en Suisse
          </p>
        </div>
      )}
    </div>
  );
}

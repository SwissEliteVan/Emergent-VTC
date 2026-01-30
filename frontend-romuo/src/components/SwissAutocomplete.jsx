import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, X, Loader2, Navigation } from 'lucide-react';

// Photon API for geocoding
const PHOTON_API = 'https://photon.komoot.io/api/';

// Swiss center for pickup bias
const SWISS_CENTER = { lat: 46.8182, lon: 8.2275 };

// European center for destination (broader search)
const EUROPE_CENTER = { lat: 48.8566, lon: 2.3522 };

export default function SwissAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  type = 'pickup', // 'pickup' = Switzerland only, 'destination' = All Europe
  icon: Icon = MapPin,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const searchTimeout = useRef(null);
  const abortControllerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with Photon API
  const searchAddresses = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      const center = type === 'pickup' ? SWISS_CENTER : EUROPE_CENTER;
      const params = new URLSearchParams({
        q: query,
        limit: 8,
        lang: 'fr',
        lat: center.lat,
        lon: center.lon,
        location_bias_scale: type === 'pickup' ? 0.8 : 0.3,
      });

      const response = await fetch(`${PHOTON_API}?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();

      let results = data.features.map(f => {
        const p = f.properties;
        const coords = f.geometry.coordinates;

        // Build display name
        let displayName = '';
        if (p.housenumber && p.street) {
          displayName = `${p.street} ${p.housenumber}`;
        } else if (p.street) {
          displayName = p.street;
        } else if (p.name) {
          displayName = p.name;
        }

        // Build secondary info
        const parts = [];
        if (p.postcode) parts.push(p.postcode);
        if (p.city || p.town || p.village) parts.push(p.city || p.town || p.village);
        if (p.country) parts.push(p.country);
        const secondaryInfo = parts.join(', ');

        return {
          id: `${coords[0]}-${coords[1]}`,
          name: displayName || p.name || (p.city || p.town || p.village) || secondaryInfo,
          city: p.city || p.town || p.village || '',
          postcode: p.postcode || '',
          country: p.country || '',
          lat: coords[1],
          lon: coords[0],
          fullAddress: [displayName, secondaryInfo].filter(Boolean).join(', '),
          isSwiss: p.country === 'Switzerland' || p.country === 'Suisse' || p.country === 'Schweiz',
        };
      });

      // For pickup, filter to Switzerland only
      if (type === 'pickup') {
        results = results.filter(r => r.isSwiss);
      }

      setSuggestions(results.slice(0, 6));
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (inputValue.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        searchAddresses(inputValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const handleSelectSuggestion = (place) => {
    onChange(place.fullAddress || place.name);

    if (onSelect) {
      onSelect({
        address: place.fullAddress || place.name,
        lat: place.lat,
        lon: place.lon,
        city: place.city,
        postcode: place.postcode,
        country: place.country,
      });
    }

    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Clear input
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onSelect) onSelect(null);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
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
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="input-swiss pl-12 pr-10"
          autoComplete="off"
          spellCheck="false"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-swiss shadow-swiss-lg overflow-hidden animate-fade-in"
          style={{ maxHeight: '280px', overflowY: 'auto' }}
        >
          {suggestions.map((place, index) => (
            <button
              key={place.id}
              type="button"
              onClick={() => handleSelectSuggestion(place)}
              className={`suggestion-item w-full text-left flex items-start gap-3 ${
                index === selectedIndex ? 'selected' : ''
              }`}
            >
              <Navigation className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-black font-medium text-sm truncate">
                  {place.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {place.postcode && place.city
                    ? `${place.postcode} ${place.city}${place.country && !place.isSwiss ? `, ${place.country}` : ''}`
                    : place.city || place.country}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-swiss shadow-swiss-lg p-4">
          <p className="text-gray-500 text-sm text-center">
            {type === 'pickup'
              ? 'Aucune adresse trouvee en Suisse'
              : 'Aucune adresse trouvee'}
          </p>
          <p className="text-gray-400 text-xs text-center mt-1">
            Essayez avec le nom de la ville ou le code postal
          </p>
        </div>
      )}
    </div>
  );
}

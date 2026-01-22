import { useState, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import { CITY_SUGGESTIONS } from '../utils/vehicles';

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
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 0) {
      const filtered = CITY_SUGGESTIONS.filter(city =>
        city.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        city.region.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 6);

      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (city) => {
    onChange(city.name);
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
        {value && (
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
        <div className="absolute z-50 w-full mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-luxury overflow-hidden animate-slide-up">
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.region}`}
              onClick={() => handleSelectSuggestion(city)}
              className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between
                ${index === selectedIndex
                  ? 'bg-primary/20 border-l-2 border-primary'
                  : 'hover:bg-dark-700'
                }
              `}
            >
              <div>
                <p className="text-white font-medium">{city.name}</p>
                <p className="text-xs text-gray-400">{city.region}</p>
              </div>
              {city.distance > 0 && (
                <span className="text-xs text-gray-500">{city.distance} km</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

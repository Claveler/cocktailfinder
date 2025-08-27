"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationSearchProps {
  onLocationFound: (coordinates: [number, number], locationName: string) => void;
  autoFocus?: boolean;
  showButton?: boolean;
}

interface SearchSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

export default function LocationSearch({ onLocationFound, autoFocus = false, showButton = true }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const isSelectionUpdate = useRef(false);

  // Fetch suggestions as user types
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}&limit=5`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
      setActiveSuggestionIndex(-1);
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    
    // Skip fetching suggestions if this is a programmatic update from selection
    if (isSelectionUpdate.current) {
      isSelectionUpdate.current = false; // Reset the flag
      return;
    }
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLocation = (suggestion: SearchSuggestion) => {
    
    // Clear any pending debounced search 
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Use coordinates we already have from the suggestion
    const coordinates: [number, number] = [
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon)
    ];

    // Call the callback with the coordinates we already have
    onLocationFound(coordinates, suggestion.display_name);
    
    // Update UI - just set the display value and clear suggestions  
    
    // Set flag to prevent fetchSuggestions when we update the display value
    isSelectionUpdate.current = true;
    setSearchTerm(suggestion.display_name.split(',')[0]); // Show short version
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);
    
    // Blur input 
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const searchLocation = async (locationName: string) => {
    if (!locationName.trim()) {
      setError("Please enter a location");
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(locationName)}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Failed to search location");
      }

      const data = await response.json();

      if (data.length === 0) {
        setError("Location not found. Try a different search term.");
        return;
      }

      const result = data[0];
      const coordinates: [number, number] = [
        parseFloat(result.lat),
        parseFloat(result.lon)
      ];

      onLocationFound(coordinates, result.display_name);
      setSearchTerm("");

    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Unable to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      selectLocation(suggestions[activeSuggestionIndex]);
    } else {
      searchLocation(searchTerm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          selectLocation(suggestions[activeSuggestionIndex]);
        } else {
          handleSubmit(e);
        }
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && searchTerm.length >= 3) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={containerRef} className={`flex ${showButton ? 'flex-col sm:flex-row gap-3 md:gap-4' : 'flex-col gap-3'} max-w-lg relative`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        <Input 
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder="Enter your location..." 
          className={`pl-10 pr-10 text-foreground h-11 md:h-12 focus:border-primary focus:ring-1 focus:ring-primary ${showButton ? 'bg-white/95 backdrop-blur-sm border-white/20' : 'bg-white border-gray-300'}`} 
          disabled={isSearching}
          autoComplete="off"
          autoFocus={autoFocus}
          inputMode="search"
          type="text"
        />
        
        {/* Custom clear button */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setShowSuggestions(false);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Simple dropdown attached to input */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-[60]">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === activeSuggestionIndex 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-gray-50 text-gray-900'
                }`}
                onClick={() => {
                  selectLocation(suggestion);
                }}
              >
                <div className="font-medium text-sm">
                  {suggestion.display_name.split(',')[0]}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {suggestion.display_name.split(',').slice(1).join(',').trim()}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-400 bg-black/80 px-2 py-1 rounded z-50">
            {error}
          </div>
        )}
      </div>
      
      {showButton && (
        <Button 
          type="button"
          onClick={handleSubmit}
          size="lg" 
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 md:px-6 lg:px-8 h-11 md:h-12"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          {isSearching ? "Searching..." : "Find Venues"}
        </Button>
      )}
    </div>
  );
}
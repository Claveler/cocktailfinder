"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  
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
      updateDropdownPosition();
    }
  };

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position
  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Update position when showing suggestions
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
    }
  }, [showSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    const handleScroll = () => {
      if (showSuggestions) {
        updateDropdownPosition();
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [showSuggestions]);



  return (
    <div ref={containerRef} className={`flex ${showButton ? 'flex-col sm:flex-row gap-3 md:gap-4' : 'flex-col gap-3'} w-full relative`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input 
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder="London, New York, Madrid…" 
          className={`pl-10 pr-10 text-gray-900 h-11 md:h-12 text-sm md:text-base rounded-lg border border-gray-200 shadow-sm ${showButton ? 'bg-white' : 'bg-white border-gray-300'} focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200`} 
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
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 md:px-6 h-11 md:h-12 text-sm md:text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          {isSearching ? "Searching..." : "Take Me There"}
        </Button>
      )}
      
      {/* Portal dropdown to avoid container constraints */}
      {isMounted && showSuggestions && suggestions.length > 0 && createPortal(
        <div 
          className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto z-[9999]"
          style={{
            position: 'absolute',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
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
        </div>,
        document.body
      )}
    </div>
  );
}
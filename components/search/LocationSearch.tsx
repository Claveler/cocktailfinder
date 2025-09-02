"use client";

import { useState, useRef, useEffect } from "react";
import { useCombobox } from "downshift";
import {
  Search,
  MapPin,
  Loader2,
  Martini,
  Beer,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationSearchProps {
  onLocationFound: (
    coordinates: [number, number],
    locationName: string,
    venueId?: string
  ) => void;
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
  venue_id?: string;
  venue_type?: string;
}

export default function LocationSearch({
  onLocationFound,
  autoFocus = false,
  showButton = true,
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout>();
  const searchCacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());
  const buttonSearching = useRef(false);

  // Helper function to get venue type icon
  const getVenueTypeIcon = (venueType?: string) => {
    switch (venueType) {
      case "bar":
        return <Martini className="h-3 w-3" />;
      case "pub":
        return <Beer className="h-3 w-3" />;
      case "liquor_store":
        return <Store className="h-3 w-3" />;
      case "restaurant":
        return <UtensilsCrossed className="h-3 w-3" />;
      default:
        return <Martini className="h-3 w-3" />;
    }
  };

  // Fetch suggestions as user types
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    if (searchCacheRef.current.has(cacheKey)) {
      const cachedResults = searchCacheRef.current.get(cacheKey)!;
      setSuggestions(cachedResults);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}&limit=5`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();

      // Cache the results
      searchCacheRef.current.set(cacheKey, data);

      // Limit cache size to prevent memory issues
      if (searchCacheRef.current.size > 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        if (firstKey !== undefined) {
          searchCacheRef.current.delete(firstKey);
        }
      }

      setSuggestions(data);
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  const debouncedFetchSuggestions = (query: string | undefined) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!query) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);
  };

  const selectLocation = (suggestion: SearchSuggestion | null) => {
    if (!suggestion) return;

    // Clear any pending debounced search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Use coordinates we already have from the suggestion
    const coordinates: [number, number] = [
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon),
    ];

    // Call the callback with coordinates and venue ID if it's a venue
    onLocationFound(coordinates, suggestion.display_name, suggestion.venue_id);
    setError(null);
  };

  const searchLocation = async (locationName: string) => {
    if (!locationName.trim()) {
      setError("Please enter a location");
      return;
    }

    buttonSearching.current = true;
    setError(null);

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
        parseFloat(result.lon),
      ];

      onLocationFound(coordinates, result.display_name);
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Unable to search location. Please try again.");
    } finally {
      buttonSearching.current = false;
    }
  };

  // Downshift setup
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    inputValue,
    reset,
  } = useCombobox({
    items: suggestions,
    itemToString: (item) => (item ? item.display_name.split(",")[0] : ""),
    onInputValueChange: ({ inputValue }) => {
      if (inputValue !== undefined && inputValue !== null) {
        debouncedFetchSuggestions(inputValue);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        selectLocation(selectedItem);
        reset(); // Clear the input after selection
      }
    },
  });

  const handleButtonSearch = () => {
    if (inputValue) {
      searchLocation(inputValue);
    }
  };

  return (
    <div
      className={`flex ${showButton ? "flex-col sm:flex-row gap-3 md:gap-4" : "flex-col gap-3"} w-full relative`}
    >
      <div className="relative flex-1">
        {/* Search icon - hide when searching */}
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 transition-opacity ${isSearching ? "opacity-0" : "opacity-100"}`}
        />

        {/* Loading spinner - show when searching */}
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 transition-opacity ${isSearching ? "opacity-100" : "opacity-0"}`}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
        </div>

        <Input
          {...getInputProps()}
          placeholder="London, New York, Madrid…"
          className="pl-10 pr-10 text-gray-900 h-11 md:h-12 text-base rounded-lg border border-gray-200 shadow-sm bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
          autoComplete="off"
          autoFocus={autoFocus}
          inputMode="search"
          type="text"
        />

        {/* Custom clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={() => reset()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-400 bg-black/80 px-2 py-1 rounded z-50">
            {error}
          </div>
        )}

        {/* Downshift suggestions dropdown */}
        <div {...getMenuProps()} className="relative">
          {isOpen && suggestions.length > 0 && (
            <div className="absolute top-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto z-[300]">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.place_id}
                  {...getItemProps({ item: suggestion, index })}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                    highlightedIndex === index
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {suggestion.type === "venue" ? (
                      <div className="flex items-center gap-1">
                        {getVenueTypeIcon(suggestion.venue_type)}
                        <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Venue
                        </span>
                      </div>
                    ) : (
                      <MapPin className="h-3 w-3 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {suggestion.display_name.split(",")[0]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {suggestion.display_name
                          .split(",")
                          .slice(1)
                          .join(",")
                          .trim()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showButton && (
        <Button
          type="button"
          onClick={handleButtonSearch}
          size="lg"
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 md:px-6 h-11 md:h-12 text-sm md:text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={buttonSearching.current}
        >
          {buttonSearching.current ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          {buttonSearching.current ? "Searching..." : "Pisc-go!"}
        </Button>
      )}
    </div>
  );
}

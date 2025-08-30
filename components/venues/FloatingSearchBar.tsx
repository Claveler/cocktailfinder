"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCombobox } from "downshift";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  MapPin,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { VenueFilters } from "@/lib/venues";

interface SearchSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface FloatingSearchBarProps {
  defaultValues: VenueFilters;
  cities: string[]; // Will be removed - keeping for now to avoid breaking changes
  brands: string[];
  resultCount: number;
  onLocationFound?: (coordinates: [number, number], locationName: string) => void;
}

export default function FloatingSearchBar({
  defaultValues,
  cities,
  brands,
  resultCount,
  onLocationFound,
}: FloatingSearchBarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState(
    defaultValues.type || "all"
  );
  const [selectedBrand, setSelectedBrand] = useState(
    defaultValues.brand || "all"
  );

  // Location search state
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const searchCacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());

  // Location search functionality
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

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}&limit=5`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchSuggestion[] = await response.json();
      
      // Cache the results
      searchCacheRef.current.set(cacheKey, data);
      
      // Limit cache size to prevent memory issues
      if (searchCacheRef.current.size > 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        searchCacheRef.current.delete(firstKey);
      }
      
      setSuggestions(data);
    } catch (error) {
      console.error('Location search error:', error);
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
    debounceRef.current = setTimeout(() => {
      if (query && onLocationFound) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
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
      parseFloat(suggestion.lon)
    ];

    // Call the callback with the coordinates we already have
    if (onLocationFound) {
      onLocationFound(coordinates, suggestion.display_name);
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
    itemToString: (item) => item ? item.display_name.split(',')[0] : '',
    defaultInputValue: defaultValues.q || "",
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

  // Helper functions for filtering and navigation
  const hasActiveFilters =
    inputValue ||
    selectedType !== "all" ||
    selectedBrand !== "all";

  const getActiveFiltersCount = () => {
    let count = 0;
    if (inputValue) count++;
    if (selectedType !== "all") count++;
    if (selectedBrand !== "all") count++;
    return count;
  };

  const clearFilters = () => {
    reset(); // Clear search input via Downshift
    setSelectedType("all");
    setSelectedBrand("all");
    setSuggestions([]);
  };



  // Helper function to navigate with current filter state
  const navigateWithFilters = (overrides: Partial<VenueFilters> = {}) => {
    const params = new URLSearchParams();
    
    // Use current state values or overrides
    const query = overrides.q !== undefined ? overrides.q : inputValue;
    const type = overrides.type !== undefined ? overrides.type : selectedType;
    const brand = overrides.brand !== undefined ? overrides.brand : selectedBrand;

    if (query) params.set("q", query);
    if (type && type !== "all") params.set("type", type);
    if (brand && brand !== "all") params.set("brand", brand);

    router.push(`/?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();

    // Build query parameters
    const query = formData.get("q")?.toString();
    const type = formData.get("type")?.toString();
    const brand = formData.get("brand")?.toString();

    if (query) params.set("q", query);
    if (type && type !== "all") params.set("type", type);
    if (brand && brand !== "all") params.set("brand", brand);

    // Navigate to venues page with filters using client-side navigation
    router.push(`/?${params.toString()}`);
  };

  return (
    <>
      {/* Mobile: Bottom sticky search bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4">
        <Card className="shadow-lg border-2 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Main search row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {/* Search icon - hide when searching */}
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-opacity ${isSearching ? 'opacity-0' : 'opacity-100'}`} />
                  
                  {/* Loading spinner - show when searching */}
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-opacity ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  </div>
                  <Input
                    {...getInputProps()}
                    name="q"
                    placeholder="Search by location..."
                    className="pl-10 pr-4 bg-white"
                    autoComplete="off"
                  />
                  
                  {/* Downshift suggestions dropdown */}
                  <div {...getMenuProps()} className="relative">
                    {isOpen && suggestions.length > 0 && (
                      <div className="absolute top-1 left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.place_id}
                            {...getItemProps({ item: suggestion, index })}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              highlightedIndex === index 
                                ? 'bg-primary/10 text-primary' 
                                : 'hover:bg-gray-50 text-gray-900'
                            }`}
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
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
                <Button type="submit" size="icon" className="shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Expandable filters for mobile */}
              {isExpanded && (
                <div className="border-t pt-3 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <Select
                      name="type"
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="h-8 text-sm bg-white">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="pub">Pub</SelectItem>
                        <SelectItem value="liquor_store">Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Brand</Label>
                    <Select
                      name="brand"
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger className="h-8 text-sm bg-white">
                        <SelectValue placeholder="All brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All brands</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {resultCount} venues found
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Active filters display for mobile */}
              {hasActiveFilters && !isExpanded && (
                <div className="flex items-center gap-1 flex-wrap">
                  {inputValue && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {inputValue}
                    </Badge>
                  )}

                  {selectedType !== "all" && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {selectedType}
                    </Badge>
                  )}
                  {selectedBrand !== "all" && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {selectedBrand}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Search bar */}
      <div className="hidden lg:block">
        <Card className="shadow-lg border-2 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Main search row */}
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  {/* Search icon - hide when searching */}
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-opacity ${isSearching ? 'opacity-0' : 'opacity-100'}`} />
                  
                  {/* Loading spinner - show when searching */}
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-opacity ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  </div>
                  <Input
                    {...getInputProps()}
                    name="q"
                    placeholder="Search by location..."
                    className="pl-10 pr-4 bg-white"
                    autoComplete="off"
                  />
                  
                  {/* Downshift suggestions dropdown */}
                  <div {...getMenuProps()} className="relative">
                    {isOpen && suggestions.length > 0 && (
                      <div className="absolute top-1 left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.place_id}
                            {...getItemProps({ item: suggestion, index })}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              highlightedIndex === index 
                                ? 'bg-primary/10 text-primary' 
                                : 'hover:bg-gray-50 text-gray-900'
                            }`}
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
                  </div>
                </div>

                {/* Filter Toggle Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative"
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>

                {/* Search Button */}
                <Button type="submit" className="px-6">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Quick Brand Filters */}
              {brands.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Popular brands:</span>
                  {brands.slice(0, 6).map((brand) => (
                    <Button
                      key={brand}
                      type="button"
                      variant={selectedBrand === brand ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        const newBrand = selectedBrand === brand ? "all" : brand;
                        setSelectedBrand(newBrand);
                        // Navigate immediately with the new brand filter
                        navigateWithFilters({ brand: newBrand });
                      }}
                    >
                      {brand}
                    </Button>
                  ))}
                  {brands.length > 6 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground"
                      onClick={() => setIsExpanded(true)}
                    >
                      +{brands.length - 6} more
                    </Button>
                  )}
                </div>
              )}

              {/* Expandable filters */}
              {isExpanded && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Type Filter */}
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Venue Type
                      </Label>
                      <Select
                        name="type"
                        value={selectedType}
                        onValueChange={setSelectedType}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="bar">Cocktail Bar</SelectItem>
                          <SelectItem value="pub">Pub</SelectItem>
                          <SelectItem value="liquor_store">Liquor Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Brand
                      </Label>
                      <Select
                        name="brand"
                        value={selectedBrand}
                        onValueChange={setSelectedBrand}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="All brands" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All brands</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {resultCount} venues found
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Filters Display */}
              {hasActiveFilters && !isExpanded && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Filters:</span>
                  {inputValue && (
                    <Badge variant="secondary">Search: {inputValue}</Badge>
                  )}

                  {selectedType !== "all" && (
                    <Badge variant="secondary">Type: {selectedType}</Badge>
                  )}
                  {selectedBrand !== "all" && (
                    <Badge variant="secondary">Brand: {selectedBrand}</Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </form>

            {/* Results count */}
            {!isExpanded && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {resultCount} venues found
                </span>
                {hasActiveFilters && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/">View all venues</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
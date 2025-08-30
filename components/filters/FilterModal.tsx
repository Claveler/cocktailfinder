"use client";

import { useState, useEffect } from "react";
import {
  X,
  Martini,
  Beer,
  Store,
  UtensilsCrossed,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  initialFilters?: FilterState;
  availableBrands?: string[];
}

export interface FilterState {
  venueTypes: string[];
  brands: string[];
}

const VENUE_TYPES = [
  { value: "bar", label: "Cocktail Bar", icon: Martini },
  { value: "pub", label: "Pub", icon: Beer },
  { value: "liquor_store", label: "Liquor Store", icon: Store },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
];

export default function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters = { venueTypes: [], brands: [] },
  availableBrands = [],
}: FilterModalProps) {
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>(
    initialFilters.venueTypes
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialFilters.brands
  );
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [showAllBrands, setShowAllBrands] = useState<boolean>(false);

  // Reset state when modal opens with new initial filters
  useEffect(() => {
    if (isOpen) {
      setSelectedVenueTypes(initialFilters.venueTypes);
      setSelectedBrands(initialFilters.brands);
      setBrandSearch("");
      setShowAllBrands(false);
    }
  }, [isOpen, initialFilters]);

  // Popular brands (most commonly found in Chilean venues)
  const popularBrands = [
    "Pisco Capel",
    "Pisco Control C",
    "Pisco Tres Erres",
    "Pisco Mistral",
    "Alto del Carmen",
    "El Gobernador",
    "Pisco Alto del Carmen",
    "ABA",
  ];

  // Filter brands based on search and popularity
  const getFilteredBrands = () => {
    const searchTerm = brandSearch.toLowerCase().trim();

    // If searching, return all matches
    if (searchTerm) {
      return availableBrands.filter((brand) =>
        brand.toLowerCase().includes(searchTerm)
      );
    }

    // If not searching, return popular brands or all brands based on toggle
    if (showAllBrands) {
      return availableBrands;
    }

    // Show popular brands that exist in available brands, plus any selected brands not in popular list
    const popularAvailable = availableBrands.filter((brand) =>
      popularBrands.includes(brand)
    );
    const selectedNotPopular = selectedBrands.filter(
      (brand) =>
        !popularBrands.includes(brand) && availableBrands.includes(brand)
    );

    return [...popularAvailable, ...selectedNotPopular];
  };

  const filteredBrands = getFilteredBrands();
  const hasMoreBrands =
    !showAllBrands &&
    !brandSearch &&
    filteredBrands.length < availableBrands.length;

  const toggleVenueType = (type: string) => {
    setSelectedVenueTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      venueTypes: selectedVenueTypes,
      brands: selectedBrands,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedVenueTypes([]);
    setSelectedBrands([]);
  };

  const hasActiveFilters =
    selectedVenueTypes.length > 0 || selectedBrands.length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[80vh] overflow-hidden transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Filter Venues</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div
          className="px-6 py-4 overflow-y-auto"
          style={{ maxHeight: "calc(80vh - 140px)" }}
        >
          <div className="space-y-6">
            {/* Venue Types Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Venue Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedVenueTypes.includes(type.value);

                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleVenueType(type.value)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands Section */}
            {availableBrands.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Pisco Brands ({availableBrands.length})
                  </h3>
                  {brandSearch && (
                    <button
                      onClick={() => setBrandSearch("")}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pisco brands..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* Brands Grid */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {filteredBrands.map((brand) => {
                    const isSelected = selectedBrands.includes(brand);

                    return (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-200 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-medium">{brand}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Show All Brands Toggle */}
                {hasMoreBrands && (
                  <button
                    onClick={() => setShowAllBrands(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show all {availableBrands.length} brands
                  </button>
                )}

                {/* Collapse Toggle */}
                {showAllBrands && !brandSearch && (
                  <button
                    onClick={() => setShowAllBrands(false)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Show popular brands only
                  </button>
                )}

                {/* No Results Message */}
                {brandSearch && filteredBrands.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No brands found for "{brandSearch}"
                  </div>
                )}
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Active Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVenueTypes.map((type) => {
                    const typeData = VENUE_TYPES.find((t) => t.value === type);
                    return (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {typeData?.label}
                      </Badge>
                    );
                  })}
                  {selectedBrands.map((brand) => (
                    <Badge key={brand} variant="outline" className="text-xs">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            onClick={handleClear}
            disabled={!hasActiveFilters}
            className="text-gray-600 hover:text-gray-900"
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white/20 text-white"
                >
                  {selectedVenueTypes.length + selectedBrands.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

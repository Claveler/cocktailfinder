"use client";

import { useState, useEffect } from "react";
import { X, Martini, Beer, Store, UtensilsCrossed, Check } from "lucide-react";
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
  availableBrands = []
}: FilterModalProps) {
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>(initialFilters.venueTypes);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters.brands);

  // Reset state when modal opens with new initial filters
  useEffect(() => {
    if (isOpen) {
      setSelectedVenueTypes(initialFilters.venueTypes);
      setSelectedBrands(initialFilters.brands);
    }
  }, [isOpen, initialFilters]);

  const toggleVenueType = (type: string) => {
    setSelectedVenueTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      venueTypes: selectedVenueTypes,
      brands: selectedBrands
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedVenueTypes([]);
    setSelectedBrands([]);
  };

  const hasActiveFilters = selectedVenueTypes.length > 0 || selectedBrands.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          <div className="space-y-6">
            {/* Venue Types Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Venue Types</h3>
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
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Pisco Brands ({availableBrands.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableBrands.map((brand) => {
                    const isSelected = selectedBrands.includes(brand);
                    
                    return (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">{brand}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVenueTypes.map(type => {
                    const typeData = VENUE_TYPES.find(t => t.value === type);
                    return (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {typeData?.label}
                      </Badge>
                    );
                  })}
                  {selectedBrands.map(brand => (
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
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
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

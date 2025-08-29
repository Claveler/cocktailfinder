"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import LocationSearch from "@/components/search/LocationSearch";
import FilterModal, { FilterState } from "@/components/filters/FilterModal";

// Define a global event system for location search, search modal, and filters
declare global {
  interface Window {
    dispatchLocationSearch?: (coordinates: [number, number], locationName: string) => void;
    dispatchOpenSearch?: () => void;
    dispatchOpenFilter?: () => void;
    dispatchApplyFilters?: (filters: FilterState) => void;
    dispatchGetAvailableBrands?: () => string[];
  }
}

export default function GlobalBottomNavBar() {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({ venueTypes: [], brands: [] });
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  
  const isOnLandingPage = pathname === '/';

  // Set up global event handlers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchOpenSearch = () => {
        setShowSearch(true);
      };
      
      window.dispatchOpenFilter = () => {
        setShowFilter(true);
        // Also fetch brands when opening filter modal
        if (window.dispatchGetAvailableBrands) {
          const brands = window.dispatchGetAvailableBrands();
          setAvailableBrands(brands);
        }
      };
      
      window.dispatchGetAvailableBrands = () => {
        return availableBrands;
      };
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        delete window.dispatchOpenSearch;
        delete window.dispatchOpenFilter;
        delete window.dispatchGetAvailableBrands;
      }
    };
  }, [availableBrands]);

  const handleSearchClick = () => {
    if (isOnLandingPage) {
      // On landing page - toggle search modal and close filter modal
      if (!showSearch) {
        setShowFilter(false); // Close filter modal when opening search
      }
      setShowSearch(!showSearch);
    } else {
      // On other pages - navigate to landing page and signal to open search
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('openSearchOnLanding', 'true');
      }
      router.push('/');
    }
  };

  const handleLocationFound = (coordinates: [number, number], locationName: string) => {
    if (isOnLandingPage && typeof window !== 'undefined' && window.dispatchLocationSearch) {
      // We're on the landing page - dispatch the location search event
      window.dispatchLocationSearch(coordinates, locationName);
    } else {
      // Store the search data and navigate to landing page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingLocationSearch', JSON.stringify({
          coordinates,
          locationName
        }));
      }
      router.push('/');
    }
    setShowSearch(false); // Close search after selection
  };

  const handleFilterClick = () => {
    if (isOnLandingPage) {
      // On landing page - toggle filter modal and close search modal
      if (!showFilter) {
        setShowSearch(false); // Close search modal when opening filter
        if (typeof window !== 'undefined' && window.dispatchGetAvailableBrands) {
          // Only fetch brands when opening the modal
          const brands = window.dispatchGetAvailableBrands();
          setAvailableBrands(brands);
        }
      }
      setShowFilter(!showFilter);
    } else {
      // On other pages - navigate to landing page and signal to open filter
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('openFilterOnLanding', 'true');
      }
      router.push('/');
    }
  };

  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
    if (isOnLandingPage && typeof window !== 'undefined' && window.dispatchApplyFilters) {
      window.dispatchApplyFilters(filters);
    } else {
      // Store filters and navigate to landing page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingFilters', JSON.stringify(filters));
      }
      router.push('/');
    }
  };

  const handleAddVenueClick = () => {
    // Close any open modals (mutual exclusivity)
    setShowSearch(false);
    setShowFilter(false);
    
    // Navigate to add venue page
    router.push('/venues/new');
  };

  return (
    <>
      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSearch(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '80vh' }}
          >
            {/* Compact Header with Close Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl">
              <h3 className="text-base font-semibold text-gray-900">Search Location</h3>
              <button 
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Streamlined Content */}
            <div className="p-5 pb-8 rounded-b-2xl">
              <LocationSearch onLocationFound={handleLocationFound} autoFocus={true} showButton={false} />
              <p className="text-xs text-gray-500 mt-3 text-center">
                Type to search or press Enter to find venues
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={currentFilters}
        availableBrands={availableBrands}
      />

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:bottom-6 md:left-1/2 md:transform md:-translate-x-1/2 md:w-[425px]">
        <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t md:border border-gray-200 shadow-lg md:shadow-xl md:rounded-full md:border-gray-300 md:bg-white/90">
          <div className="grid grid-cols-3 h-16 md:h-14">
            {/* Search Button */}
            <Button
              variant="ghost"
              className="h-full rounded-none md:rounded-l-full flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50 md:hover:bg-gray-100/80"
              onClick={handleSearchClick}
            >
              <Search className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-xs font-medium">Search</span>
            </Button>

            {/* Filter Button */}
            <Button
              variant="ghost"
              className={`h-full rounded-none flex flex-col items-center justify-center gap-1 hover:bg-gray-50 md:hover:bg-gray-100/80 ${
                currentFilters.venueTypes.length > 0 || currentFilters.brands.length > 0
                  ? 'text-primary bg-primary/5'
                  : 'text-gray-600 hover:text-primary'
              }`}
              onClick={handleFilterClick}
            >
              <Filter className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-xs font-medium">
                Filter
                {(currentFilters.venueTypes.length > 0 || currentFilters.brands.length > 0) && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-primary rounded-full">
                    {currentFilters.venueTypes.length + currentFilters.brands.length}
                  </span>
                )}
              </span>
            </Button>

            {/* Add Venue Button */}
            <Button
              variant="ghost"
              className="h-full rounded-none md:rounded-r-full flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50 md:hover:bg-gray-100/80"
              onClick={handleAddVenueClick}
            >
              <Plus className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-xs font-medium">Add Venue</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

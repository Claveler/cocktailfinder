"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import LocationSearch from "@/components/search/LocationSearch";

// Define a global event system for location search and search modal
declare global {
  interface Window {
    dispatchLocationSearch?: (coordinates: [number, number], locationName: string) => void;
    dispatchOpenSearch?: () => void;
  }
}

export default function GlobalBottomNavBar() {
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const isOnLandingPage = pathname === '/';

  // Set up global search modal trigger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchOpenSearch = () => {
        setShowSearch(true);
      };
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        delete window.dispatchOpenSearch;
      }
    };
  }, []);

  const handleSearchClick = () => {
    if (isOnLandingPage) {
      // On landing page - just show the search modal
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

  return (
    <>
      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden flex items-center justify-center p-4" onClick={() => setShowSearch(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '80vh' }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Search Location</h3>
              <p className="text-sm text-gray-500 mt-1">Find venues near any location</p>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <LocationSearch onLocationFound={handleLocationFound} autoFocus={true} />
            </div>
            
            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setShowSearch(false)}
                className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-3 h-16">
            {/* Search Button */}
            <Button
              variant="ghost"
              className="h-full rounded-none flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50"
              onClick={handleSearchClick}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium">Search</span>
            </Button>

            {/* Filter Button */}
            <Button
              variant="ghost"
              className="h-full rounded-none flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50"
              disabled
            >
              <Filter className="h-5 w-5" />
              <span className="text-xs font-medium">Filter</span>
            </Button>

            {/* Add Venue Button */}
            <Button
              asChild
              variant="ghost"
              className="h-full rounded-none flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50"
            >
              <Link href="/venues/new">
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Add Venue</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

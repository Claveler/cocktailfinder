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
    dispatchLocationSearch?: (
      coordinates: [number, number],
      locationName: string
    ) => void;
    dispatchOpenSearch?: () => void;
  }
}

export default function GlobalBottomNavBar() {
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isOnLandingPage = pathname === "/";

  // Set up global search modal trigger
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchOpenSearch = () => {
        setShowSearch(true);
      };
    }

    // Cleanup
    return () => {
      if (typeof window !== "undefined") {
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem("openSearchOnLanding", "true");
      }
      router.push("/");
    }
  };

  const handleLocationFound = (
    coordinates: [number, number],
    locationName: string
  ) => {
    if (
      isOnLandingPage &&
      typeof window !== "undefined" &&
      window.dispatchLocationSearch
    ) {
      // We're on the landing page - dispatch the location search event
      window.dispatchLocationSearch(coordinates, locationName);
    } else {
      // Store the search data and navigate to landing page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "pendingLocationSearch",
          JSON.stringify({
            coordinates,
            locationName,
          })
        );
      }
      router.push("/");
    }
    setShowSearch(false); // Close search after selection
  };

  return (
    <>
      {/* Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "80vh" }}
          >
            {/* Compact Header with Close Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl">
              <h3 className="text-base font-semibold text-gray-900">
                Search Location
              </h3>
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
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
            </div>

            {/* Streamlined Content */}
            <div className="p-5 pb-8 rounded-b-2xl">
              <LocationSearch
                onLocationFound={handleLocationFound}
                autoFocus={true}
                showButton={false}
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                Type to search or press Enter to find venues
              </p>
            </div>
          </div>
        </div>
      )}

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
              className="h-full rounded-none flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50 md:hover:bg-gray-100/80"
              disabled
            >
              <Filter className="h-5 w-5 md:h-4 md:w-4" />
              <span className="text-xs font-medium">Filter</span>
            </Button>

            {/* Add Venue Button */}
            <Button
              asChild
              variant="ghost"
              className="h-full rounded-none md:rounded-r-full flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-50 md:hover:bg-gray-100/80"
            >
              <Link href="/venues/new">
                <Plus className="h-5 w-5 md:h-4 md:w-4" />
                <span className="text-xs font-medium">Add Venue</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

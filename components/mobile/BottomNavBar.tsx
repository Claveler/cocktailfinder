"use client";

import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import LocationSearch from "@/components/search/LocationSearch";

interface BottomNavBarProps {
  onLocationFound: (coordinates: [number, number], locationName: string) => void;
}

export default function BottomNavBar({ onLocationFound }: BottomNavBarProps) {
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
  };

  const handleLocationFound = (coordinates: [number, number], locationName: string) => {
    onLocationFound(coordinates, locationName);
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
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Search Location</h3>
              <p className="text-sm text-gray-500 mt-1">Find venues near any location</p>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <LocationSearch onLocationFound={handleLocationFound} />
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

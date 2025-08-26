"use client";

import { useState } from "react";
import FloatingSearchBar from "@/components/venues/FloatingSearchBar";
import VenuesPageClient from "./VenuesPageClient";
import type { VenueFilters, Venue } from "@/lib/venues";

interface VenuesWrapperProps {
  venueData: {
    venues: Venue[];
    totalCount: number;
  };
  allVenuesForMap: Venue[]; // ALL venues for map pins
  cities: string[];
  brands: string[];
  filters: VenueFilters;
  initialCenter: [number, number];
}

export default function VenuesWrapper({
  venueData,
  allVenuesForMap,
  cities,
  brands,
  filters,
  initialCenter,
}: VenuesWrapperProps) {
  const [searchLocation, setSearchLocation] = useState<[number, number] | null>(null);

  const handleLocationFound = (coordinates: [number, number], locationName: string) => {
    setSearchLocation(coordinates);
  };

  return (
    <>
      {/* Desktop: Sticky Search Bar */}
      <div className="hidden lg:block">
        <div className="sticky top-20 z-50 p-4">
          <FloatingSearchBar
            defaultValues={filters}
            cities={cities}
            brands={brands}
            resultCount={venueData.totalCount}
            onLocationFound={handleLocationFound}
          />
        </div>
      </div>

      {/* Desktop: Interactive Venues and Map */}
      <div className="hidden lg:block">
        <div style={{ paddingTop: 'calc(2rem)' }}>
          {venueData.venues.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
            </div>
          ) : (
            <VenuesPageClient
              venues={venueData.venues} // Filtered venues for left sidebar
              allVenuesForMap={allVenuesForMap} // ALL venues for map pins
              initialCenter={initialCenter}
              searchLocation={searchLocation}
            />
          )}
        </div>
      </div>

      {/* Mobile: Floating Search Bar */}
      <div className="lg:hidden">
        <FloatingSearchBar
          defaultValues={filters}
          cities={cities}
          brands={brands}
          resultCount={venueData.totalCount}
          onLocationFound={handleLocationFound}
        />
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";
import Image from "next/image";
import LocationSearch from "@/components/search/LocationSearch";
import InteractiveVenueExplorer from "@/components/venues/InteractiveVenueExplorer";
import HomePageClient from "@/app/HomePageClient";
import type { Venue as VenueType } from "@/lib/venues";
import type { FilterState } from "@/components/filters/FilterModal";

interface LandingPageClientProps {
  allVenues: VenueType[];
  maxDistanceKm: number;
}

export default function LandingPageClient({
  allVenues,
  maxDistanceKm,
}: LandingPageClientProps) {
  const searchParams = useSearchParams();
  const [searchLocation, setSearchLocation] = useState<[number, number] | null>(null);
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number] | null>(null);
  const [initialFocusedVenueId, setInitialFocusedVenueId] = useState<string | null>(null);
  const [initialZoom, setInitialZoom] = useState<number | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({ venueTypes: [], brands: [] });

  const handleLocationFound = (coordinates: [number, number], locationName: string) => {
    setSearchLocation(coordinates);
  };

  // Parse query parameters for initial map state
  useEffect(() => {
    const venueId = searchParams.get('venueId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');

    // Handle venue ID parameter
    if (venueId && allVenues.length > 0) {
      const targetVenue = allVenues.find(venue => venue.id === venueId);
      
      if (targetVenue && targetVenue.location) {
        setInitialMapCenter([targetVenue.location.lat, targetVenue.location.lng]);
        setInitialFocusedVenueId(venueId);
        if (zoom) {
          const zoomNum = parseFloat(zoom);
          if (!isNaN(zoomNum) && zoomNum >= 1 && zoomNum <= 20) {
            setInitialZoom(zoomNum);
          }
        }
        return;
      }
    }

    // Handle direct lat/lng parameters
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setInitialMapCenter([latNum, lngNum]);
        
        // Handle zoom parameter for direct coordinates
        if (zoom) {
          const zoomNum = parseFloat(zoom);
          if (!isNaN(zoomNum) && zoomNum >= 1 && zoomNum <= 20) {
            setInitialZoom(zoomNum);
          }
        }
      }
    }
  }, [searchParams, allVenues]);

  // Filter handler
  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);
  };

  // Get available brands
  const getAvailableBrands = (): string[] => {
    const brandsSet = new Set<string>();
    allVenues.forEach(venue => {
      venue.brands.forEach(brand => brandsSet.add(brand));
    });
    return Array.from(brandsSet).sort();
  };

  // Set up global event system
  useEffect(() => {
    // Set up the global event handlers
    if (typeof window !== 'undefined') {
      window.dispatchLocationSearch = handleLocationFound;
      window.dispatchApplyFilters = handleApplyFilters;
      window.dispatchGetAvailableBrands = getAvailableBrands;
      
      // Check for pending location search from other pages
      const pendingSearch = sessionStorage.getItem('pendingLocationSearch');
      if (pendingSearch) {
        try {
          const { coordinates, locationName } = JSON.parse(pendingSearch);
          handleLocationFound(coordinates, locationName);
          sessionStorage.removeItem('pendingLocationSearch');
        } catch (error) {
          console.error('Error parsing pending location search:', error);
          sessionStorage.removeItem('pendingLocationSearch');
        }
      }

      // Check for pending filters from other pages
      const pendingFilters = sessionStorage.getItem('pendingFilters');
      if (pendingFilters) {
        try {
          const filters = JSON.parse(pendingFilters);
          handleApplyFilters(filters);
          sessionStorage.removeItem('pendingFilters');
        } catch (error) {
          console.error('Error parsing pending filters:', error);
          sessionStorage.removeItem('pendingFilters');
        }
      }

      // Check if search should be opened automatically (from other pages)
      const shouldOpenSearch = sessionStorage.getItem('openSearchOnLanding');
      if (shouldOpenSearch === 'true') {
        // Trigger search modal opening on the global bottom navbar
        window.dispatchOpenSearch?.();
        sessionStorage.removeItem('openSearchOnLanding');
      }
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        delete window.dispatchLocationSearch;
        delete window.dispatchApplyFilters;
        delete window.dispatchGetAvailableBrands;
      }
    };
  }, [allVenues]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Hidden on Mobile */}
      <section className="hidden md:flex relative w-full min-h-[360px] items-center" style={{ overflow: 'visible' }}>
        {/* Full Viewport Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/assets/piscolahero.png"
            alt="Piscola - Chilean cocktail"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Enhanced gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-6 lg:px-8 py-8 lg:py-12">
          <div className="container mx-auto">
            <div className="max-w-xl lg:max-w-3xl">
              <HomePageClient delay={0}>
                <div className="space-y-6 lg:space-y-8">
                  <div className="space-y-4 lg:space-y-6">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      A Taste of Chile,
                      <br />
                      <span className="text-white/90">Wherever You Are</span>
                    </h1>
                    <p className="text-base lg:text-lg text-white/90 max-w-xl leading-relaxed">
                    Search, explore, and taste Chile's most iconic cocktail. One glass at a time.
                    </p>
                  </div>

                  {/* Enhanced Search CTA */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 lg:p-6 shadow-xl max-w-xl border border-white/20 relative">
                    <div className="space-y-3">
                      <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Start Your Discovery</h2>
                      <LocationSearch onLocationFound={handleLocationFound} />
                    </div>
                  </div>
                </div>
              </HomePageClient>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map and Venues Section */}
      <section className="py-0 md:py-8 px-0 md:px-4 bg-transparent md:bg-muted/30 min-h-screen md:h-auto">
        <div className="md:container mx-auto w-full">
          {/* Interactive Venue Explorer with Map */}
          <InteractiveVenueExplorer 
            allVenues={allVenues}
            maxDistanceKm={maxDistanceKm}
            fallbackCenter={initialMapCenter || [51.5261617, -0.1633234]} // Use query param center or London Business School as fallback (LBS easter egg! 🎓)
            fallbackZoom={initialZoom || undefined}
            searchLocation={searchLocation}
            initialFocusedVenueId={initialFocusedVenueId}
            hasQueryParams={!!(initialMapCenter || initialFocusedVenueId)}
            currentFilters={currentFilters}
          />
        </div>
      </section>

    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import VenueCard from "@/components/venues/VenueCard";
import InteractiveMapWrapper from "@/components/maps/InteractiveMapWrapper";
import { Card, CardContent } from "@/components/ui/card";
import type { Venue } from "@/lib/venues";
import { filterVenuesByBounds, calculateApproximateBounds } from "@/lib/distance";
import type { MapBounds } from "@/lib/distance";

interface VenuesPageClientProps {
  venues: Venue[]; // Filtered venues for left sidebar
  allVenuesForMap: Venue[]; // ALL venues for map pins
  initialCenter: [number, number];
  searchLocation?: [number, number] | null;
}

export default function VenuesPageClient({ 
  venues, 
  allVenuesForMap,
  initialCenter, 
  searchLocation = null 
}: VenuesPageClientProps) {
  // Environment variables (same as landing page)
  const fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL) || 13;
  const searchZoomLevel = Number(process.env.NEXT_PUBLIC_SEARCH_ZOOM_LEVEL) || 15;
  const venuesLimit = Number(process.env.NEXT_PUBLIC_VENUES_LIMIT) || 20;

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>(searchLocation || initialCenter);
  const [mapZoom, setMapZoom] = useState(fallbackZoom);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Filtered venues based on map bounds
  const [visibleVenues, setVisibleVenues] = useState<(Venue & { distance: number })[]>([]);
  const [isUpdatingVenues, setIsUpdatingVenues] = useState(false);

  // Bounds-based venue filtering with limit
  const updateVenuesForBounds = useCallback((bounds: MapBounds, center: [number, number]) => {
    const venuesWithLocation = allVenuesForMap.filter(venue => venue.location !== null);
    const centerLocation = { lat: center[0], lng: center[1] };
    const visibleVenues = filterVenuesByBounds(venuesWithLocation, bounds, centerLocation);

    // Apply venue limit from environment variable
    const limitedVenues = visibleVenues.slice(0, venuesLimit);
    setVisibleVenues(limitedVenues);
  }, [allVenuesForMap, venuesLimit]);

  // Initial setup: Set initial venues using bounds-based filtering (exact copy from landing page)
  useEffect(() => {
    // Set initial venues using bounds-based filtering
    const initialBounds = calculateApproximateBounds(initialCenter, fallbackZoom);
    updateVenuesForBounds(initialBounds, initialCenter);
  }, [updateVenuesForBounds, initialCenter, fallbackZoom]);

  // Handle search location updates (exact copy from landing page)
  useEffect(() => {
    if (searchLocation) {
      // Update map center to search location with higher zoom
      setMapCenter(searchLocation);
      setMapZoom(searchZoomLevel);
      
      // Update venues for the search location using the search zoom level
      const searchBounds = calculateApproximateBounds(searchLocation, searchZoomLevel);
      updateVenuesForBounds(searchBounds, searchLocation);
    }
  }, [searchLocation, updateVenuesForBounds, searchZoomLevel]);

  // Get user location on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(location);
        
        // Only update map center and venues if no search location is provided
        if (!searchLocation) {
          setMapCenter(location);
          // Update venues using bounds-based filtering (same as landing page)
          const newBounds = calculateApproximateBounds(location, fallbackZoom);
          updateVenuesForBounds(newBounds, location);
        }
      },
      (error) => {
        console.warn("Geolocation error on venues page:", error);
        // Silently fail - user location is optional
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [searchLocation, fallbackZoom, updateVenuesForBounds]);

  // Map movement handler - EXACT COPY from landing page
  const handleMapMovement = useCallback((center: [number, number], zoom: number, bounds: MapBounds) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Configurable debouncing delay from environment variable
    const debounceDelayMs = Number(process.env.NEXT_PUBLIC_MAP_UPDATE_DELAY_MS) || 1500;
    
    setIsUpdatingVenues(true);
    
    debounceTimeoutRef.current = setTimeout(() => {
      // Update venue cards based on what's visible in the map using REAL bounds
      updateVenuesForBounds(bounds, center);
      setIsUpdatingVenues(false);
    }, debounceDelayMs);
  }, [updateVenuesForBounds]); // Use same function for consistency

  // Refs for debouncing (same as landing page)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const handleVenueCardClick = (venue: Venue) => {
    if (venue.location) {
      const newCenter: [number, number] = [venue.location.lat, venue.location.lng];
      setMapCenter(newCenter);
      setMapZoom(15); // Zoom in when focusing on a specific venue
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left Column: Scrollable Venue List */}
      <div className="w-1/3">
        <div className="space-y-4">

          {visibleVenues.length === 0 && !isUpdatingVenues ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No venues visible in this area. Try zooming out or moving the map.
                </p>
              </CardContent>
            </Card>
          ) : (
            visibleVenues.map((venue, index) => (
              <VenueCard 
                key={`${venue.id}-${venue.distance.toFixed(2)}`}
                venue={venue} 
                showDistance={true}
                distance={venue.distance}
                onCardClick={handleVenueCardClick}
                isSelected={index === 0} // Highlight the first card (closest to map center)
              />
            ))
          )}
        </div>
      </div>

      {/* Right Column: Interactive Map */}
      <div className="w-2/3">
        <Card 
          className="sticky" 
          style={{ 
            top: 'calc(17rem)', // Position below navbar + search bar
            height: 'calc(100vh - 17rem - 2rem)' // Fill available space with small bottom margin
          }}
        >
          <CardContent className="p-0 h-full">
            <InteractiveMapWrapper
              venues={allVenuesForMap
                .filter((venue: any) => venue.location)
                .map((venue: any) => ({
                  id: venue.id,
                  name: venue.name,
                  type: venue.type,
                  address: venue.address,
                  city: venue.city,
                  country: venue.country,
                  brands: venue.brands,
                  photos: venue.photos,
                  google_maps_url: venue.google_maps_url,
                  location: venue.location!,
                  status: venue.status as "pending" | "approved" | "rejected",
                }))}
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              userLocation={userLocation}
              onBoundsChange={handleMapMovement}
              searchLocation={searchLocation}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle, X } from "lucide-react";
import VenueCard from "@/components/venues/VenueCard";
import InteractiveMapWrapper from "@/components/maps/InteractiveMapWrapper";
import Link from "next/link";
import type { Venue as VenueType } from "@/lib/venues";
import { filterVenuesByDistance, filterVenuesByBounds, calculateApproximateBounds } from "@/lib/distance";
import type { MapBounds } from "@/lib/distance";

interface InteractiveVenueExplorerProps {
  allVenues: VenueType[];
  maxDistanceKm?: number;
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
  searchLocation?: [number, number] | null;
}

export default function InteractiveVenueExplorer({ 
  allVenues, 
  maxDistanceKm = 15,
  fallbackCenter = [51.5261617, -0.1633234], // London Business School default (LBS easter egg! 🎓)
  fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL) || 13,
  searchLocation = null,
}: InteractiveVenueExplorerProps) {
  
  // Environment variables for zoom levels
  const searchZoomLevel = Number(process.env.NEXT_PUBLIC_SEARCH_ZOOM_LEVEL) || 15;
  

  // Map loading state
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  
  // Track if user has explicitly searched for a location (takes precedence over geolocation)
  const [hasSearchedLocation, setHasSearchedLocation] = useState(false);
  
  // Track venue to focus on map (for card clicks)
  const [focusedVenueId, setFocusedVenueId] = useState<string | null>(null);
  
  // Venue state
  const [filteredVenues, setFilteredVenues] = useState<(VenueType & { distance: number })[]>([]);
  
  // Map display props - STATIC after initial user location (never updated to prevent re-renders)
  const [staticMapCenter, setStaticMapCenter] = useState<[number, number]>(fallbackCenter);
  const [staticMapZoom, setStaticMapZoom] = useState<number>(fallbackZoom);
  const [staticUserLocation, setStaticUserLocation] = useState<[number, number] | null>(null);
  

  
  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);
  const lastDistanceSignatureRef = useRef<string>('');

  // Request user location (internal - for automatic geolocation on load)
  const requestUserLocation = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationError(null);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationError("Unable to get your location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  // Request user location explicitly (when user clicks location button - overrides search)
  const requestUserLocationExplicit = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    // Reset search location flag - user explicitly wants their actual location
    setHasSearchedLocation(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationError(null);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationError("Unable to get your location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  // Get user location on mount
  useEffect(() => {
    setIsMapLoading(false);
    requestUserLocation();
  }, [requestUserLocation]);

  // Filter venues based on current map center
  const updateVenuesForLocation = useCallback((center: [number, number]) => {
    const venuesWithLocation = allVenues.filter(venue => venue.location !== null);
    const centerLocation = { lat: center[0], lng: center[1] };
    const nearby = filterVenuesByDistance(venuesWithLocation, centerLocation, maxDistanceKm);

    // Take only the first 3 venues
    const newVenues = nearby.slice(0, 3);
    
    // Create signature that includes both venues and their distances
    const newDistanceSignature = newVenues.map(v => `${v.id}:${v.distance.toFixed(2)}`).join('|');
    
    // Force update if venues OR distances changed
    if (newDistanceSignature !== lastDistanceSignatureRef.current) {
      lastDistanceSignatureRef.current = newDistanceSignature;
      setFilteredVenues([...newVenues]); // Force new array reference
    }
  }, [allVenues, maxDistanceKm]);

  // Bounds-based venue filtering (for venues visible in map)
  const updateVenuesForBounds = useCallback((bounds: MapBounds, center: [number, number]) => {
    const venuesWithLocation = allVenues.filter(venue => venue.location !== null);
    const centerLocation = { lat: center[0], lng: center[1] };
    const visibleVenues = filterVenuesByBounds(venuesWithLocation, bounds, centerLocation);

    // Take only the first 3 venues (closest to center within bounds)
    const newVenues = visibleVenues.slice(0, 3);
    
    // Create signature that includes both venues and their distances
    const newDistanceSignature = newVenues.map(v => `${v.id}:${v.distance.toFixed(2)}`).join('|');
    
    // Force update if venues OR distances changed
    if (newDistanceSignature !== lastDistanceSignatureRef.current) {
      lastDistanceSignatureRef.current = newDistanceSignature;
      setFilteredVenues([...newVenues]); // Force new array reference
    }
  }, [allVenues]);

  // Stable reference to venue update function
  const updateVenuesRef = useRef(updateVenuesForBounds);
  updateVenuesRef.current = updateVenuesForBounds;

  // Map movement handler - ONLY updates venue cards, NEVER updates map state
  const handleMapMovement = useCallback((center: [number, number], zoom: number, bounds: MapBounds) => {
    const now = Date.now();
    
    // Prevent rapid successive calls
    if (now - lastUpdateRef.current < 100) {
      return;
    }
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Configurable debouncing delay from environment variable
    const debounceDelayMs = Number(process.env.NEXT_PUBLIC_MAP_UPDATE_DELAY_MS) || 1500;
    
    debounceTimeoutRef.current = setTimeout(() => {
      lastUpdateRef.current = Date.now();
      
      console.log('🗺️ Using real bounds from getBounds():', bounds);
      
      // Update venue cards based on what's visible in the map using REAL bounds
      updateVenuesRef.current(bounds, center);
    }, debounceDelayMs);
  }, []); // EMPTY DEPENDENCIES - completely stable

  // Initial setup: Request user location and set initial venues using bounds
  useEffect(() => {
    setIsMapLoading(false);
    requestUserLocation();
    
    // Set initial venues using bounds-based filtering
    const initialBounds = calculateApproximateBounds(fallbackCenter, fallbackZoom);
    updateVenuesForBounds(initialBounds, fallbackCenter);
  }, [requestUserLocation, updateVenuesForBounds, fallbackCenter, fallbackZoom]);
  
  // Update map center ONLY ONCE when user location is obtained (but only if user hasn't searched)
  useEffect(() => {
    if (userLocation && !hasSearchedLocation) {
      const newCenter: [number, number] = [userLocation.lat, userLocation.lng];
      
      // Set static map center AND user location ONCE - these will never change again to prevent re-renders
      setStaticMapCenter(newCenter);
      setStaticUserLocation(newCenter);
      
      // Update venues using bounds-based filtering
      const newBounds = calculateApproximateBounds(newCenter, fallbackZoom);
      updateVenuesForBounds(newBounds, newCenter);
    }
  }, [userLocation, updateVenuesForBounds, fallbackZoom, hasSearchedLocation]);

  // Handle search location updates
  useEffect(() => {
    if (searchLocation) {
      // Mark that user has explicitly searched for a location (takes precedence over geolocation)
      setHasSearchedLocation(true);
      
      // Update map center to search location with higher zoom
      setStaticMapCenter(searchLocation);
      setStaticMapZoom(searchZoomLevel);
      
      // Update venues for the search location using the search zoom level
      const searchBounds = calculateApproximateBounds(searchLocation, searchZoomLevel);
      updateVenuesForBounds(searchBounds, searchLocation);
    }
  }, [searchLocation, updateVenuesForBounds, searchZoomLevel]);

  // Handle window resize to update venue filtering for responsive viewport changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Debounce resize events to avoid excessive updates
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        // Recalculate bounds with new viewport size and update venues
        const currentCenter = staticMapCenter;
        const currentZoom = staticMapZoom;
        const newBounds = calculateApproximateBounds(currentCenter, currentZoom);
        updateVenuesForBounds(newBounds, currentCenter);
      }, 300); // 300ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [staticMapCenter, staticMapZoom, updateVenuesForBounds]);

  // Handle venue card click - focus map on venue
  const handleVenueCardClick = useCallback((venue: VenueType) => {
    if (venue.location) {
      // Only change focusedVenueId if it's different from current
      // This prevents unnecessary re-renders that cause popup blinking
      setFocusedVenueId(prevId => prevId === venue.id ? prevId : venue.id);
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Create venues array with user location marker for map display
  // STATIC venues for map - NEVER changes to prevent popup redraws
  const staticVenuesForMap = useMemo(() => {
    // Only include actual venues, no user location to prevent re-renders
    return allVenues.filter(venue => venue.location !== null).map(venue => ({
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
    }));
  }, [allVenues]); // ONLY depends on allVenues, NOT userLocation

  if (isMapLoading) {
    return (
      <div className="space-y-8">
        {/* Map Loading */}
        <Card className="w-full overflow-hidden" style={{ height: "400px" }}>
          <CardContent className="p-0 h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-3 animate-pulse" />
              <div className="text-sm">Finding your location...</div>
            </div>
          </CardContent>
        </Card>

        {/* Venues Loading */}
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-80 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Interactive Map */}
      <div className="relative">
        <Card className="w-full overflow-hidden" style={{ height: "400px" }}>
          <CardContent className="p-0 h-full">
            <InteractiveMapWrapper
              venues={staticVenuesForMap}
              height="100%"
              center={staticMapCenter}
              zoom={staticMapZoom}
              onBoundsChange={handleMapMovement}
              userLocation={staticUserLocation}
              onLocationRequest={requestUserLocationExplicit}
              maxDistanceKm={maxDistanceKm}
              focusedVenueId={focusedVenueId}
            />
          </CardContent>
        </Card>
        
        {/* Location Error Banner */}
        {locationError && !isErrorDismissed && (
          <div className="absolute top-3 left-3 right-3 z-[1000]">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-medium">Using default location</p>
                <p className="text-blue-700 text-xs mt-1">Enable location access to see venues near you. Move the map to explore different areas.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                onClick={() => setIsErrorDismissed(true)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Explanation Text - Mobile Only */}
      <div className="text-center block md:hidden">
        <p className="text-sm text-muted-foreground">
          Showing venues visible in the current map view • Move the map to explore different areas
        </p>
      </div>

      {/* Dynamic Venues Based on Map Position */}
      {filteredVenues.length > 0 ? (
        <div className="space-y-6">
          {/* Venues Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <VenueCard 
                key={`${venue.id}-${venue.distance.toFixed(2)}`}
                venue={venue} 
                showDistance={true}
                distance={venue.distance}
                onCardClick={handleVenueCardClick}
              />
            ))}
          </div>

          {/* Explanation Text - Desktop Only */}
          <div className="text-center hidden md:block">
            <p className="text-sm text-muted-foreground mb-4">
              Showing venues visible in the current map view • Move the map to explore different areas
            </p>
          </div>

          {/* See More Button */}
          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/venues">
                See More Venues
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        /* No Venues Found */
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No venues visible in the current map view.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Try moving the map to explore different locations, or browse all venues.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/venues">View All Venues</Link>
            </Button>
            <Button asChild>
              <Link href="/venues/new">Add a Venue</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

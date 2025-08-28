"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";

import { MapPin, AlertCircle, X } from "lucide-react";
import VenueCard from "@/components/venues/VenueCard";
import InteractiveMapWrapper from "@/components/maps/InteractiveMapWrapper";
import MobileFooter from "@/components/mobile/MobileFooter";
import Link from "next/link";
import type { Venue as VenueType } from "@/lib/venues";
import { filterVenuesByDistance, filterVenuesByBounds, calculateApproximateBounds } from "@/lib/distance";
import type { MapBounds } from "@/lib/distance";
import type { FilterState } from "@/components/filters/FilterModal";

interface InteractiveVenueExplorerProps {
  allVenues: VenueType[];
  maxDistanceKm?: number;
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
  searchLocation?: [number, number] | null;
  initialFocusedVenueId?: string | null;
  hasQueryParams?: boolean;
  currentFilters?: FilterState;
}

export default function InteractiveVenueExplorer({ 
  allVenues, 
  maxDistanceKm = 15,
  fallbackCenter = [51.5261617, -0.1633234], // London Business School default (LBS easter egg! 🎓)
  fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL) || 13,
  searchLocation = null,
  initialFocusedVenueId = null,
  hasQueryParams = false,
  currentFilters = { venueTypes: [], brands: [] },
}: InteractiveVenueExplorerProps) {
  
  // Environment variables for zoom levels
  const searchZoomLevel = Number(process.env.NEXT_PUBLIC_SEARCH_ZOOM_LEVEL) || 15;
  


  
  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  
  // Track if user has explicitly searched for a location (takes precedence over geolocation)
  const [hasSearchedLocation, setHasSearchedLocation] = useState(false);
  
  // Track if user has manually requested their location (overrides query params)
  const [isManualLocationRequest, setIsManualLocationRequest] = useState(false);
  
  // Track venue to focus on map (for card clicks)
  const [focusedVenueId, setFocusedVenueId] = useState<string | null>(initialFocusedVenueId);
  
  // Venue state
  const [filteredVenues, setFilteredVenues] = useState<(VenueType & { distance: number })[]>([]);
  const [visibleVenueCount, setVisibleVenueCount] = useState(3);
  
  // Ref for venue cards container to handle scrolling
  const venueCardsContainerRef = useRef<HTMLDivElement>(null);
  
  // Track previous map center to detect significant movement
  const previousMapCenterRef = useRef<[number, number] | null>(null);
  
  // Calculate distance between two coordinates in meters
  const calculateDistance = useCallback((coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1[0] * Math.PI) / 180;
    const φ2 = (coord2[0] * Math.PI) / 180;
    const Δφ = ((coord2[0] - coord1[0]) * Math.PI) / 180;
    const Δλ = ((coord2[1] - coord1[1]) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);


  
  // Map display props - STATIC after initial user location (never updated to prevent re-renders)
  const [staticMapCenter, setStaticMapCenter] = useState<[number, number]>(fallbackCenter);
  const [staticMapZoom, setStaticMapZoom] = useState<number>(fallbackZoom);
  const [staticUserLocation, setStaticUserLocation] = useState<[number, number] | null>(null);

  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);
  const lastDistanceSignatureRef = useRef<string>('');
  
  // Track if we've already updated the map center from fallback changes
  const hasUpdatedFromFallbackRef = useRef<boolean>(false);

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
    
    // Mark this as a manual location request (should override query params)
    setIsManualLocationRequest(true);

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

  // Create venues array with filters applied for map display
  // Apply filters to determine which venues show on map
  const staticVenuesForMap = useMemo(() => {
    // Start with venues that have location
    const venuesWithLocation = allVenues.filter(venue => venue.location !== null);
    
    // Apply filters first
    let filteredVenues = venuesWithLocation;
    
    if (currentFilters && (currentFilters.venueTypes.length > 0 || currentFilters.brands.length > 0)) {
      filteredVenues = venuesWithLocation.filter(venue => {
        // Check venue type filter
        const typeMatch = currentFilters.venueTypes.length === 0 || 
                         currentFilters.venueTypes.includes(venue.type);

        // Check brand filter
        const brandMatch = currentFilters.brands.length === 0 || 
                          currentFilters.brands.some(filterBrand => 
                            venue.brands.includes(filterBrand)
                          );

        return typeMatch && brandMatch;
      });
    }
    
    // Return filtered venues for map (include all properties to match Venue type)
    return filteredVenues;
  }, [allVenues, currentFilters]); // Depends on allVenues AND currentFilters

  // Get user location on mount
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Filter venues based on current map center
  const updateVenuesForLocation = useCallback((center: [number, number]) => {
    // Use the filtered venues from the map instead of all venues
    const centerLocation = { lat: center[0], lng: center[1] };
    const nearby = filterVenuesByDistance(staticVenuesForMap, centerLocation, maxDistanceKm);

    // Take only the first 3 venues (no need to apply filters since staticVenuesForMap is already filtered)
    const newVenues = nearby.slice(0, 3);
    
    // Create signature that includes both venues and their distances
    const newDistanceSignature = newVenues.map(v => `${v.id}:${v.distance.toFixed(2)}`).join('|');
    
    // Force update if venues OR distances changed
    if (newDistanceSignature !== lastDistanceSignatureRef.current) {
      lastDistanceSignatureRef.current = newDistanceSignature;
      setFilteredVenues([...newVenues]); // Force new array reference
    }
  }, [staticVenuesForMap, maxDistanceKm]);

  // Bounds-based venue filtering (for venues visible in map)
  // NOTE: Filters are now applied at map level via staticVenuesForMap
  const updateVenuesForBounds = useCallback((bounds: MapBounds, center: [number, number]) => {
    // Use the filtered venues from the map instead of all venues
    const centerLocation = { lat: center[0], lng: center[1] };
    const visibleVenues = filterVenuesByBounds(staticVenuesForMap, bounds, centerLocation);

    // Store all visible venues (sorted by distance from center)
    // No need to apply filters here since staticVenuesForMap is already filtered
    setFilteredVenues(visibleVenues);
    
    // Reset visible count to 3 when map bounds change
    setVisibleVenueCount(3);
    
    // Scroll to top of page on mobile when map moves significantly
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const currentCenter = center;
      const previousCenter = previousMapCenterRef.current;
      
      // Only scroll if this is a significant movement (>50 meters) or first load
      let shouldScroll = false;
      if (previousCenter === null) {
        // First load - don't scroll
        shouldScroll = false;
      } else {
        const distanceMoved = calculateDistance(previousCenter, currentCenter);
        // Threshold: 50 meters - enough to filter out browser UI changes
        shouldScroll = distanceMoved > 50;
      }
      
      if (shouldScroll) {
        // Small delay to ensure venues have rendered
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }, 100);
      }
      
      // Update previous center for next comparison
      previousMapCenterRef.current = currentCenter;
    }
    
    // Create signature that includes all venues and their distances
    const newDistanceSignature = visibleVenues.map(v => `${v.id}:${v.distance.toFixed(2)}`).join('|');
    lastDistanceSignatureRef.current = newDistanceSignature;
  }, [staticVenuesForMap, calculateDistance]);

  // Update map center when fallbackCenter changes (for query params)
  useEffect(() => {
    // Only update if we have query params and haven't already updated from fallback
    if (hasQueryParams && !hasUpdatedFromFallbackRef.current && !userLocation) {
      // Check if fallbackCenter is different from current staticMapCenter
      const [currentLat, currentLng] = staticMapCenter;
      const [newLat, newLng] = fallbackCenter;
      
      // Only update if the center actually changed (to avoid unnecessary updates)
      if (Math.abs(currentLat - newLat) > 0.001 || Math.abs(currentLng - newLng) > 0.001) {
        setStaticMapCenter(fallbackCenter);
        setStaticMapZoom(fallbackZoom); // Also update zoom!
        
        // Update venues for the new center
        const newBounds = calculateApproximateBounds(fallbackCenter, fallbackZoom);
        updateVenuesForBounds(newBounds, fallbackCenter);
        
        // Mark that we've updated from fallback
        hasUpdatedFromFallbackRef.current = true;
      }
    }
  }, [fallbackCenter, hasQueryParams, userLocation, staticMapCenter, fallbackZoom, updateVenuesForBounds]);

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
      
      // Update venue cards based on what's visible in the map using REAL bounds
      updateVenuesRef.current(bounds, center);
    }, debounceDelayMs);
  }, []); // EMPTY DEPENDENCIES - completely stable

  // Initial setup: Request user location and set initial venues using bounds
  useEffect(() => {
    // Only request user location if we don't have query parameters
    if (!hasQueryParams) {
      requestUserLocation();
    }
    
    // Set initial venues using bounds-based filtering
    const initialBounds = calculateApproximateBounds(fallbackCenter, fallbackZoom);
    updateVenuesForBounds(initialBounds, fallbackCenter);
  }, [requestUserLocation, updateVenuesForBounds, fallbackCenter, fallbackZoom, hasQueryParams]);
  
  // Update map center ONLY ONCE when user location is obtained
  useEffect(() => {
    
    // Allow user location updates if:
    // 1. No search location has been set AND no query params (automatic behavior)
    // 2. OR this is a manual location request (crosshair button - overrides everything)
    const shouldUpdateLocation = userLocation && (
      (!hasSearchedLocation && !hasQueryParams) || // Automatic: only if no search and no query params
      isManualLocationRequest // Manual: always allow (user clicked crosshair)
    );
    
    if (shouldUpdateLocation) {
      const newCenter: [number, number] = [userLocation.lat, userLocation.lng];
      
      // Set static map center AND user location ONCE - these will never change again to prevent re-renders
      setStaticMapCenter(newCenter);
      setStaticUserLocation(newCenter);
      
      // Update venues using bounds-based filtering
      const newBounds = calculateApproximateBounds(newCenter, fallbackZoom);
      updateVenuesForBounds(newBounds, newCenter);
      
      // Reset manual location request flag and clear focused venue (user wants their location, not query param venue)
      if (isManualLocationRequest) {
        setIsManualLocationRequest(false);
        setFocusedVenueId(null); // Clear focused venue when user manually requests their location
      }
    }
  }, [userLocation, updateVenuesForBounds, fallbackZoom, hasSearchedLocation, hasQueryParams, isManualLocationRequest]);

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

  // Handle see more venues click - show 3 more venues
  const handleSeeMoreVenues = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setVisibleVenueCount(prev => prev + 3);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);





  // Get map height from environment variable (default to 3/7 of viewport = 42.86%)
  const mapHeightVh = Number(process.env.NEXT_PUBLIC_MAP_HEIGHT_VH) || 42.86;

  return (
    <div className="md:space-y-8">
      {/* Interactive Map - Sticky on Mobile */}
      <div 
        className="sticky top-16 md:relative md:top-auto z-30 md:h-auto"
        style={{ height: `calc(${mapHeightVh}vh - 4rem)` }}
      >
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



      {/* Dynamic Venues Based on Map Position */}
      {filteredVenues.length > 0 ? (
        <div ref={venueCardsContainerRef} className="p-4 md:p-0 pb-4 space-y-6">
          {/* Venues Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredVenues.slice(0, visibleVenueCount).map((venue, index) => (
              <VenueCard 
                key={`${venue.id}-${venue.distance.toFixed(2)}`}
                venue={venue} 
                showDistance={true}
                distance={venue.distance}
                onCardClick={handleVenueCardClick}
                isSelected={index === 0} // Highlight the first card (closest to map center)
              />
            ))}
          </div>

          {/* Explanation Text - Desktop Only */}
          <div className="text-center hidden md:block">
            <p className="text-sm text-muted-foreground mb-4">
              Showing venues closest to map center • The "Closest" indicator matches the green pin • Move the map to explore different areas
            </p>
          </div>

          {/* See More Button - Only show if more venues available */}
          {filteredVenues.length > visibleVenueCount && (
            <div className="text-center">
              <Button 
                onClick={handleSeeMoreVenues}
                size="lg" 
                variant="outline" 
                className="px-8 md:hidden"
              >
                See More Venues ({Math.min(3, filteredVenues.length - visibleVenueCount)} more)
              </Button>
            </div>
          )}
          
          {/* Desktop See All Venues Button */}
          <div className="text-center hidden md:block">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/">
                See All Venues
              </Link>
            </Button>
          </div>
          
          {/* Mobile Footer */}
          <MobileFooter />
        </div>
      ) : (
        /* No Venues Found */
        <div className="h-[50%] md:h-auto flex flex-col shrink-0 p-4 md:p-0 pb-4 space-y-6">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No venues visible in the current map view.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Try moving the map to explore different locations, or browse all venues.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/">View All Venues</Link>
                </Button>
                <Button asChild>
                  <Link href="/venues/new">Add a Venue</Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Footer */}
          <MobileFooter />
        </div>
      )}
    </div>
  );
}

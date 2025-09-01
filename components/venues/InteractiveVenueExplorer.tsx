"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";

import { AlertCircle, X, Loader2 } from "lucide-react";
import VenueCard from "@/components/venues/VenueCard";
import InteractiveMapWrapper from "@/components/maps/InteractiveMapWrapper";
import MobileFooter from "@/components/mobile/MobileFooter";
import Link from "next/link";
import type { Venue as VenueType } from "@/lib/venues";
import { calculateApproximateBounds } from "@/lib/distance";
import type { MapBounds } from "@/lib/distance";

import { useVenuesByBounds } from "@/lib/hooks/useVenuesByBounds";
import { useVenuePins } from "@/lib/hooks/useVenuePins";

interface InteractiveVenueExplorerProps {
  maxDistanceKm?: number;
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
  searchLocation?: [number, number] | null;
  initialFocusedVenueId?: string | null;
  hasQueryParams?: boolean;
}

export default function InteractiveVenueExplorer({
  maxDistanceKm = 15,
  fallbackCenter = [51.5261617, -0.1633234], // London Business School default (LBS easter egg! 🎓)
  fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL) || 13,
  searchLocation = null,
  initialFocusedVenueId = null,
  hasQueryParams = false,
}: InteractiveVenueExplorerProps) {
  // Environment variables for zoom levels
  const searchZoomLevel =
    Number(process.env.NEXT_PUBLIC_SEARCH_ZOOM_LEVEL) || 15;

  // User location state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  // Track if user has explicitly searched for a location (takes precedence over geolocation)
  const [hasSearchedLocation, setHasSearchedLocation] = useState(false);

  // Track if user has manually requested their location (overrides query params)
  const [isManualLocationRequest, setIsManualLocationRequest] = useState(false);

  // Track venue to focus on map (for card clicks)
  const [focusedVenueId, setFocusedVenueId] = useState<string | null>(
    initialFocusedVenueId
  );

  // Venue state
  const [filteredVenues, setFilteredVenues] = useState<
    (VenueType & { distance: number })[]
  >([]);
  const [visibleVenueCount, setVisibleVenueCount] = useState(3);

  // Two-tier venue loading:
  // 1. Load all venue pins for map (lightweight, fast)
  const {
    pins: venuePins,
    loading: pinsLoading,
    error: pinsError,
  } = useVenuePins();

  // 2. Load detailed venue data for current map bounds (on-demand)
  const {
    venues: detailedVenues,
    loading: venuesLoading,
    error: venuesError,
    refetch: refetchVenues,
  } = useVenuesByBounds(null, {
    enabled: true, // Enable the hook so refetch works
    debounceMs: 200, // Reduced internal debouncing since we handle it smartly above
    limit: 50,
  });

  // Ref for venue cards container to handle scrolling
  const venueCardsContainerRef = useRef<HTMLDivElement>(null);

  // Fixed viewport height for mobile to prevent browser bar resize issues
  const [fixedMobileHeight, setFixedMobileHeight] = useState<number | null>(
    null
  );

  // Track if initial positioning is complete to avoid showing default location venue cards
  const [isInitialPositioningComplete, setIsInitialPositioningComplete] =
    useState(false);

  // Calculate distance between two coordinates in meters
  const calculateDistance = useCallback(
    (coord1: [number, number], coord2: [number, number]): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (coord1[0] * Math.PI) / 180;
      const φ2 = (coord2[0] * Math.PI) / 180;
      const Δφ = ((coord2[0] - coord1[0]) * Math.PI) / 180;
      const Δλ = ((coord2[1] - coord1[1]) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    []
  );

  // Map display props - STATIC after initial user location (never updated to prevent re-renders)
  const [staticMapCenter, setStaticMapCenter] =
    useState<[number, number]>(fallbackCenter);
  const [staticMapZoom, setStaticMapZoom] = useState<number>(fallbackZoom);
  const [staticUserLocation, setStaticUserLocation] = useState<
    [number, number] | null
  >(null);

  // Refs for smart debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);
  const lastBoundsRef = useRef<string>("");
  const lastMapCenterRef = useRef<[number, number]>(fallbackCenter);
  const movementVelocityRef = useRef<number>(0);

  // Track current map center for distance calculations (updates on map movement)
  const [currentMapCenter, setCurrentMapCenter] =
    useState<[number, number]>(fallbackCenter);



  // Track if we've already updated the map center from fallback changes
  const hasUpdatedFromFallbackRef = useRef<boolean>(false);

  // Request user location (internal - for automatic geolocation on load)
  const requestUserLocation = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      // Mark positioning as complete when geolocation not supported
      setIsInitialPositioningComplete(true);
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
        // Mark positioning as complete even on error to show venue cards for fallback location
        setIsInitialPositioningComplete(true);
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
    if (typeof window === "undefined") return;

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

  // Transform venue pins to format expected by map component
  // Map ALWAYS shows ALL venues globally for discovery
  const venuesForMap = useMemo(() => {

    return venuePins.map((pin) => ({
      id: pin.id,
      location: pin.location,
      // Add minimal required properties for map component
      name: "",
      status: "approved" as const,
      type: "bar" as const,
    }));
  }, [venuePins, pinsLoading, pinsError]);

  // Get user location on mount
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Old location-based filtering removed - now using two-tier loading

  // Old bounds-based filtering removed - now using two-tier loading

  // Update map center when fallbackCenter changes (for query params)
  useEffect(() => {
    // Only update if we have query params and haven't already updated from fallback
    if (hasQueryParams && !hasUpdatedFromFallbackRef.current && !userLocation) {
      // Check if fallbackCenter is different from current staticMapCenter
      const [currentLat, currentLng] = staticMapCenter;
      const [newLat, newLng] = fallbackCenter;

      // Only update if the center actually changed (to avoid unnecessary updates)
      if (
        Math.abs(currentLat - newLat) > 0.001 ||
        Math.abs(currentLng - newLng) > 0.001
      ) {
        setStaticMapCenter(fallbackCenter);
        setStaticMapZoom(fallbackZoom); // Also update zoom!

        // Mark that we've updated from fallback
        hasUpdatedFromFallbackRef.current = true;
      }
    }
  }, [
    fallbackCenter,
    hasQueryParams,
    userLocation,
    staticMapCenter,
    fallbackZoom,
  ]);

  // Old venue update function reference removed - now using two-tier loading

  // Calculate movement distance for smart debouncing
  const calculateMovementDistance = useCallback(
    (oldCenter: [number, number], newCenter: [number, number]): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (oldCenter[0] * Math.PI) / 180;
      const φ2 = (newCenter[0] * Math.PI) / 180;
      const Δφ = ((newCenter[0] - oldCenter[0]) * Math.PI) / 180;
      const Δλ = ((newCenter[1] - oldCenter[1]) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    },
    []
  );

  // Smart debouncing: adapts delay based on movement pattern
  const getSmartDebounceDelay = useCallback(
    (movementDistance: number): number => {
      // Base delay - much more responsive than 1000ms
      const baseDelay =
        Number(process.env.NEXT_PUBLIC_MAP_UPDATE_DELAY_MS) || 400;

      // Quick movements (< 100m) = shorter delay for responsiveness
      if (movementDistance < 100) {
        return Math.max(200, baseDelay * 0.4);
      }

      // Medium movements (100m - 1km) = base delay
      if (movementDistance < 1000) {
        return baseDelay;
      }

      // Large movements (> 1km) = longer delay to avoid spam during rapid panning
      return Math.min(800, baseDelay * 1.5);
    },
    []
  );

  // Map movement handler with smart debouncing and immediate cache response
  const handleMapMovement = useCallback(
    (center: [number, number], zoom: number, bounds: MapBounds) => {
      const now = Date.now();
      const timeSinceLastMove = now - lastUpdateRef.current;

      // Prevent excessive rapid calls
      if (timeSinceLastMove < 50) {
        return;
      }

      // Calculate movement distance for smart debouncing
      const movementDistance = calculateMovementDistance(
        lastMapCenterRef.current,
        center
      );
      lastMapCenterRef.current = center;

      // Update current map center for distance calculations
      setCurrentMapCenter(center);

      // Update movement velocity for future decisions
      movementVelocityRef.current =
        movementDistance / Math.max(timeSinceLastMove, 1);

      // Create bounds signature for cache checking
      const boundsSignature = `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`;

      // If bounds haven't changed significantly, no need to refetch
      if (lastBoundsRef.current === boundsSignature) {
        return;
      }

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Smart debouncing based on movement pattern
      const smartDelay = getSmartDebounceDelay(movementDistance);



      debounceTimeoutRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        lastBoundsRef.current = boundsSignature;

        // Fetch detailed venue data for current bounds
        const apiBounds = {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
        };


        refetchVenues(apiBounds);
      }, smartDelay);
    },
    [refetchVenues, calculateMovementDistance, getSmartDebounceDelay]
  );

  // Update venue cards when detailed venues arrive
  useEffect(() => {


    if (detailedVenues.length > 0) {
      // Calculate distance from current map center (updates as user moves map)
      const venuesWithDistance = detailedVenues.map((venue) => ({
        ...venue,
        distance: venue.location
          ? calculateDistance(
              [currentMapCenter[0], currentMapCenter[1]],
              [venue.location.lat, venue.location.lng]
            ) / 1000
          : 0, // Convert meters to kilometers
      }));

      // Sort venues by distance (closest first)
      const sortedVenues = venuesWithDistance.sort(
        (a, b) => a.distance - b.distance
      );


      setFilteredVenues(sortedVenues);
    } else {

      setFilteredVenues([]);
    }
  }, [
    detailedVenues,
    venuesLoading,
    venuesError,
    currentMapCenter,
    calculateDistance,
  ]);

  // Scroll to top when focused venue changes (after venue card click) - mobile only
  useEffect(() => {
    if (focusedVenueId) {
      // Small delay to ensure venues have been reordered
      setTimeout(() => {
        // Only scroll to top on mobile (768px and below)
        if (window.innerWidth <= 768) {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [focusedVenueId]);

  // Initial setup: Request user location and trigger initial venue fetch
  useEffect(() => {
    // Only request user location if we don't have query parameters
    if (!hasQueryParams) {
      requestUserLocation();
      // Add timeout to mark positioning complete if location takes too long
      const locationTimeout = setTimeout(() => {
        setIsInitialPositioningComplete(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(locationTimeout);
    } else {
      // If we have query params, we're not doing location detection, so mark as complete
      setIsInitialPositioningComplete(true);
    }

    // Trigger initial detailed venue fetch for current view
    const initialBounds = calculateApproximateBounds(
      fallbackCenter,
      fallbackZoom
    );
    const apiBounds = {
      north: initialBounds.north,
      south: initialBounds.south,
      east: initialBounds.east,
      west: initialBounds.west,
    };


    refetchVenues(apiBounds);
  }, [
    requestUserLocation,
    refetchVenues,
    fallbackCenter,
    fallbackZoom,
    hasQueryParams,
  ]);

  // Update map center ONLY ONCE when user location is obtained
  useEffect(() => {
    // Allow user location updates if:
    // 1. No search location has been set AND no query params (automatic behavior)
    // 2. OR this is a manual location request (crosshair button - overrides everything)
    const shouldUpdateLocation =
      userLocation &&
      ((!hasSearchedLocation && !hasQueryParams) || // Automatic: only if no search and no query params
        isManualLocationRequest); // Manual: always allow (user clicked crosshair)

    if (shouldUpdateLocation) {
      const newCenter: [number, number] = [userLocation.lat, userLocation.lng];

      // Set static map center AND user location ONCE - these will never change again to prevent re-renders
      setStaticMapCenter(newCenter);
      setStaticUserLocation(newCenter);

      // Mark initial positioning as complete
      setIsInitialPositioningComplete(true);

      // Note: Venue filtering now handled by two-tier loading system

      // Reset manual location request flag and clear focused venue (user wants their location, not query param venue)
      if (isManualLocationRequest) {
        setIsManualLocationRequest(false);
        setFocusedVenueId(null); // Clear focused venue when user manually requests their location
      }
    }
  }, [
    userLocation,
    fallbackZoom,
    hasSearchedLocation,
    hasQueryParams,
    isManualLocationRequest,
  ]);

  // Handle search location updates
  useEffect(() => {
    if (searchLocation) {
      // Mark that user has explicitly searched for a location (takes precedence over geolocation)
      setHasSearchedLocation(true);

      // Update map center to search location with higher zoom
      setStaticMapCenter(searchLocation);
      setStaticMapZoom(searchZoomLevel);

      // Mark initial positioning as complete
      setIsInitialPositioningComplete(true);

      // Note: Venue filtering now handled by two-tier loading system
    }
  }, [searchLocation, searchZoomLevel]);

  // Handle window resize to update venue filtering for responsive viewport changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      // Debounce resize events to avoid excessive updates
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        // Recalculate bounds with new viewport size and update venues
        const currentCenter = staticMapCenter;
        // Note: Venue filtering now handled by two-tier loading system
      }, 300); // 300ms debounce
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [staticMapCenter, staticMapZoom]);

  // Handle venue card click - focus map on venue
  const handleVenueCardClick = useCallback((venue: VenueType) => {
    if (venue.location) {
      // Only change focusedVenueId if it's different from current
      // This prevents unnecessary re-renders that cause popup blinking
      setFocusedVenueId((prevId) => (prevId === venue.id ? prevId : venue.id));
    }
  }, []);

  // Handle see more venues click - show 3 more venues
  const handleSeeMoreVenues = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setVisibleVenueCount((prev) => prev + 3);
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

  // Capture initial viewport height on mobile to prevent browser bar resize issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;

      if (isMobile && fixedMobileHeight === null) {
        // Calculate the initial height based on current viewport
        const calculatedHeight = (window.innerHeight * mapHeightVh) / 100 - 64; // 64px = 4rem
        setFixedMobileHeight(calculatedHeight);
      }
    }
  }, [mapHeightVh, fixedMobileHeight]);

  // Calculate map height: fixed on mobile, dynamic on desktop
  const getMapHeight = () => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth <= 768 &&
      fixedMobileHeight !== null
    ) {
      return `${fixedMobileHeight}px`;
    }
    return `calc(${mapHeightVh}vh - 4rem)`;
  };

  return (
    <div className="md:space-y-8">
      {/* Interactive Map - Sticky on Mobile */}
      <div
        className="sticky top-16 md:relative md:top-auto z-30 md:h-auto"
        style={{ height: getMapHeight() }}
      >
        <InteractiveMapWrapper
          venues={venuesForMap}
          height="100%"
          center={staticMapCenter}
          zoom={staticMapZoom}
          onBoundsChange={handleMapMovement}
          userLocation={staticUserLocation}
          onLocationRequest={requestUserLocationExplicit}
          maxDistanceKm={maxDistanceKm}
          focusedVenueId={focusedVenueId}
          venueCountOverride={filteredVenues.length}
        />

        {/* Location Error Banner */}
        {locationError && !isErrorDismissed && (
          <div className="absolute top-3 left-3 right-3 z-[1000]">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-medium">Using default location</p>
                <p className="text-blue-700 text-xs mt-1">
                  Enable location access to see venues near you. Move the map to
                  explore different areas.
                </p>
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
      {/* Loading State - Only show when no venue cards are available */}
      {(pinsLoading || (venuesLoading && filteredVenues.length === 0)) && (
        <div className="p-4 md:p-0 pb-4 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">
            {pinsLoading ? "Loading map..." : "Finding venues in this area..."}
          </p>
        </div>
      )}

      {/* Error State */}
      {(pinsError || venuesError) && (
        <div className="p-4 md:p-0 pb-4 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive text-sm text-center">
            {pinsError || venuesError}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Retry by refreshing the page for now
              window.location.reload();
            }}
            className="mt-2"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Initial positioning loading state */}
      {!isInitialPositioningComplete && !hasQueryParams && (
        <div className="p-4 md:p-0 flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Finding your location...</p>
          </div>
        </div>
      )}

      {/* Venue Cards - Show existing cards while loading new ones */}
      {!pinsLoading &&
      !pinsError &&
      !venuesError &&
      filteredVenues.length > 0 &&
      isInitialPositioningComplete ? (
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
              Showing venues closest to map center • Move the map to explore
              different areas
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
                See More Venues (
                {Math.min(3, filteredVenues.length - visibleVenueCount)} more)
              </Button>
            </div>
          )}

          {/* Mobile Footer */}
          <MobileFooter />
        </div>
      ) : (
        /* No Venues Found */
        <div className="h-[50%] md:h-auto flex flex-col shrink-0 p-4 md:p-0 pb-4 space-y-6">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {venuesLoading
                  ? "Loading venues..."
                  : "No venues visible in the current map view."}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {venuesLoading
                  ? "Please wait while we find venues in this area."
                  : "Try moving the map to explore different locations."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* <Button asChild variant="outline">
                  <Link href="/">View All Venues</Link>
                </Button> */}
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

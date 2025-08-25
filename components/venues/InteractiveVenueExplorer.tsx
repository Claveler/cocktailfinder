"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle, X } from "lucide-react";
import VenueCard from "@/components/venues/VenueCard";
import HomePageClient from "@/app/HomePageClient";
import InteractiveMapWrapper from "@/components/maps/InteractiveMapWrapper";
import Link from "next/link";
import type { Venue as VenueType } from "@/lib/venues";
import { filterVenuesByDistance } from "@/lib/distance";

interface InteractiveVenueExplorerProps {
  allVenues: VenueType[];
  maxDistanceKm?: number;
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
}

export default function InteractiveVenueExplorer({ 
  allVenues, 
  maxDistanceKm = 15,
  fallbackCenter = [51.5261617, -0.1633234], // London Business School default (LBS easter egg! 🎓)
  fallbackZoom = 13,
}: InteractiveVenueExplorerProps) {
  // Map loading state
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  
  // Venue state
  const [filteredVenues, setFilteredVenues] = useState<(VenueType & { distance: number })[]>([]);
  
  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);
  const lastDistanceSignatureRef = useRef<string>('');

  // Request user location
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

  // Get user location on mount
  useEffect(() => {
    setIsMapLoading(false);
    requestUserLocation();
  }, [requestUserLocation]);

  // Filter venues based on current map center
  const updateVenuesForLocation = useCallback((center: [number, number]) => {
    console.log('🎯 VENUE CARDS: Using map center:', center);
    
    const venuesWithLocation = allVenues.filter(venue => venue.location !== null);
    const centerLocation = { lat: center[0], lng: center[1] };
    const nearby = filterVenuesByDistance(venuesWithLocation, centerLocation, maxDistanceKm);
    
    // Take only the first 3 venues
    const newVenues = nearby.slice(0, 3);
    
    // Debug: Show ONLY the venues that will appear in the cards
    console.log('🏷️ VENUE CARDS will show:');
    newVenues.forEach(venue => {
      console.log(`   📋 "${venue.name}": ${venue.distance}km from [${center[0].toFixed(4)}, ${center[1].toFixed(4)}]`);
    });
    
    // Create signature that includes both venues and their distances
    const newDistanceSignature = newVenues.map(v => `${v.id}:${v.distance.toFixed(2)}`).join('|');
    
    // Force update if venues OR distances changed
    if (newDistanceSignature !== lastDistanceSignatureRef.current) {
      console.log('🔄 FORCING venue cards update - venues or distances changed');
      console.log('   Previous:', lastDistanceSignatureRef.current);
      console.log('   New:     ', newDistanceSignature);
      lastDistanceSignatureRef.current = newDistanceSignature;
      setFilteredVenues([...newVenues]); // Force new array reference
    }
  }, [allVenues, maxDistanceKm]);

  // Map center change handler - only updates venue cards, not map position
  const handleMapCenterChange = useCallback((center: [number, number], zoom: number) => {
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
      console.log('🚀 Map moved, updating venue cards for new center:', center);
      // Only update venue cards - map manages its own position
      updateVenuesForLocation(center);
    }, debounceDelayMs);
  }, [updateVenuesForLocation]);

  // Initial venue filtering on component mount only
  useEffect(() => {
    updateVenuesForLocation(fallbackCenter);
  }, [updateVenuesForLocation, fallbackCenter]);
  
  // Update venues when user location is obtained
  useEffect(() => {
    if (userLocation) {
      const newCenter: [number, number] = [userLocation.lat, userLocation.lng];
      updateVenuesForLocation(newCenter);
    }
  }, [userLocation, updateVenuesForLocation]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Create venues array with user location marker for map display
  const venuesForMap = useMemo(() => {
    const mapVenues = allVenues.filter(venue => venue.location !== null).map(venue => ({
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

    if (userLocation) {
      mapVenues.push({
        id: "user-location",
        name: "Your Location",
        location: { lat: userLocation.lat, lng: userLocation.lng },
        status: "approved" as const,
      });
    }

    return mapVenues;
  }, [allVenues, userLocation]);

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
              venues={venuesForMap}
              height="100%"
              center={fallbackCenter}
              zoom={fallbackZoom}
              onCenterChange={handleMapCenterChange}
              userLocation={userLocation ? [userLocation.lat, userLocation.lng] : null}
              onLocationRequest={requestUserLocation}
              maxDistanceKm={maxDistanceKm}
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

      {/* Dynamic Venues Based on Map Position */}
      {filteredVenues.length > 0 ? (
        <div className="space-y-6">
          {/* Venues Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredVenues.map((venue, index) => (
              <HomePageClient key={`${venue.id}-${venue.distance.toFixed(2)}`} delay={index * 0.1}>
                <VenueCard 
                  venue={venue} 
                  showDistance={true}
                  distance={venue.distance}
                />
              </HomePageClient>
            ))}
          </div>

          {/* See More Button */}
          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/venues">
                See More Venues
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Showing venues within {maxDistanceKm}km of the map center • Move the map to explore different areas
            </p>
          </div>
        </div>
      ) : (
        /* No Venues Found */
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No venues found within {maxDistanceKm}km of this area.
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

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import VenueCard from "@/components/venues/VenueCard";
import HomePageClient from "@/app/HomePageClient";
import Link from "next/link";
import type { Venue as VenueType } from "@/lib/venues";
import { filterVenuesByDistance } from "@/lib/distance";

interface LocationAwareVenuesProps {
  allVenues: VenueType[];
  maxDistanceKm?: number;
}

export default function LocationAwareVenues({ 
  allVenues, 
  maxDistanceKm = 10 
}: LocationAwareVenuesProps) {
  // Debug: Log the received radius value
  console.log('🔧 LocationAwareVenues received maxDistanceKm:', maxDistanceKm);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filteredVenues, setFilteredVenues] = useState<(VenueType & { distance: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);

        // Filter venues by distance
        const venuesWithLocation = allVenues.filter(venue => venue.location !== null);
        const nearby = filterVenuesByDistance(venuesWithLocation, location, maxDistanceKm);
        
        // Take only the first 3 venues
        setFilteredVenues(nearby.slice(0, 3));
        setIsLoading(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationError("Unable to get your location");
        
        // Fallback: show random venues without location filtering
        const randomVenues = allVenues
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(venue => ({ ...venue, distance: 0 }));
        
        setFilteredVenues(randomVenues);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [allVenues, maxDistanceKm]);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-80 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredVenues.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {locationError 
            ? "No venues available yet. Be the first to add one!"
            : `No venues found within ${maxDistanceKm}km of your location.`
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/venues">View All Venues</Link>
          </Button>
          <Button asChild>
            <Link href="/venues/new">Add First Venue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Venues Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {filteredVenues.map((venue, index) => (
          <HomePageClient key={venue.id} delay={index * 0.1}>
            <VenueCard 
              venue={venue} 
              showDistance={userLocation !== null}
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
        {userLocation && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing venues within {maxDistanceKm}km of your location
          </p>
        )}
      </div>
    </div>
  );
}

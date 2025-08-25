"use client";

import { useState, useCallback, useEffect } from "react";
import VenueCard from "@/components/venues/VenueCard";
import BasicMapWrapper from "@/components/maps/BasicMapWrapper";
import { Card, CardContent } from "@/components/ui/card";
import type { Venue } from "@/lib/venues";

interface VenuesClientProps {
  venues: any[];
  initialCenter: [number, number];
  pagination?: React.ReactNode;
}

export default function VenuesClient({ venues, initialCenter, pagination }: VenuesClientProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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
      },
      (error) => {
        console.warn("Geolocation error on venues page:", error);
        // Silently fail - user location is optional on venues page
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  const handleVenueCardClick = useCallback((venue: Venue) => {
    if (venue.location) {
      const newCenter: [number, number] = [venue.location.lat, venue.location.lng];
      setMapCenter(newCenter);
      setMapZoom(15); // Zoom in when focusing on a specific venue
    }
  }, []);

  return (
    <div className="flex gap-6">
      {/* Left Column: Scrollable Venue List */}
      <div className="w-1/3">
        <div className="space-y-4">
          {venues.map((venue) => (
            <VenueCard 
              key={venue.id} 
              venue={venue} 
              onCardClick={handleVenueCardClick}
            />
          ))}
        </div>
        {pagination && (
          <div className="mt-8 mb-8">
            {pagination}
          </div>
        )}
      </div>

      {/* Right Column: Responsive Sticky Map */}
      <div className="w-2/3">
        <Card 
          className="sticky" 
          style={{ 
            top: 'calc(17rem)', // Position below navbar + search bar
            height: 'calc(100vh - 17rem - 2rem)' // Fill available space with small bottom margin
          }}
        >
          <CardContent className="p-0 h-full">
            <BasicMapWrapper
              venues={venues
                .filter((venue: any) => venue.location)
                .map((venue: any) => ({
                  id: venue.id,
                  name: venue.name,
                  location: venue.location!,
                  status: venue.status as "approved",
                }))}
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              userLocation={userLocation}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

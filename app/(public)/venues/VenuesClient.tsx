"use client";

import { useState, useCallback } from "react";
import VenueCard from "@/components/venues/VenueCard";
import BasicMap from "@/components/maps/BasicMap";
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

  const handleVenueCardClick = useCallback((venue: Venue) => {
    console.log("Venue card clicked:", venue.name, venue.location);
    if (venue.location) {
      const newCenter: [number, number] = [venue.location.lat, venue.location.lng];
      console.log("Setting map center to:", newCenter);
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
            <BasicMap
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
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface VenueCountOverlayProps {
  venueCount: number;
}

const VenueCountOverlay = memo(function VenueCountOverlay({
  venueCount,
}: VenueCountOverlayProps) {
  return (
    <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
      <Badge
        variant="secondary"
        className="bg-background/90 backdrop-blur-sm border shadow-lg pointer-events-auto"
      >
        <MapPin className="h-3 w-3 mr-1" />
        <span className="font-medium">
          {venueCount} venue{venueCount !== 1 ? "s" : ""} in view
        </span>
      </Badge>
    </div>
  );
});

export default VenueCountOverlay;

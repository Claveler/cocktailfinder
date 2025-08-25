"use client";

import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";

interface MapCenterTrackerProps {
  onCenterChange: (center: [number, number], zoom: number) => void;
  debounceMs?: number;
}

export default function MapCenterTracker({ 
  onCenterChange, 
  debounceMs = 500 
}: MapCenterTrackerProps) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onCenterChange([center.lat, center.lng], zoom);
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onCenterChange([center.lat, center.lng], zoom);
    },
  });

  return null; // This component doesn't render anything
}

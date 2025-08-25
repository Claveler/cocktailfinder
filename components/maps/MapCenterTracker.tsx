"use client";

import { useMapEvents } from "react-leaflet";

interface MapCenterTrackerProps {
  onCenterChange: (center: [number, number], zoom: number) => void;
}

export default function MapCenterTracker({ 
  onCenterChange
}: MapCenterTrackerProps) {
  // Simple event handler - no state, no effects, no re-renders
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      onCenterChange([center.lat, center.lng], zoom);
    },
    zoomend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      onCenterChange([center.lat, center.lng], zoom);
    },
  });

  return null; // This component doesn't render anything
}

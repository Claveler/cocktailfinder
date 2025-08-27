"use client";

import { useMapEvents } from "react-leaflet";
import { MapBounds } from "@/lib/distance";

interface MapBoundsTrackerProps {
  onBoundsChange: (center: [number, number], zoom: number, bounds: MapBounds) => void;
}

export default function MapBoundsTracker({ 
  onBoundsChange
}: MapBoundsTrackerProps) {
  // Convert Leaflet LatLngBounds to our MapBounds interface
  const convertBounds = (leafletBounds: L.LatLngBounds): MapBounds => {
    return {
      north: leafletBounds.getNorth(),
      south: leafletBounds.getSouth(),
      east: leafletBounds.getEast(),
      west: leafletBounds.getWest(),
    };
  };

  // Simple event handler - no state, no effects, no re-renders
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      const bounds = convertBounds(e.target.getBounds());
      onBoundsChange([center.lat, center.lng], zoom, bounds);
    },
    zoomend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      const bounds = convertBounds(e.target.getBounds());
      onBoundsChange([center.lat, center.lng], zoom, bounds);
    },
  });

  return null; // This component doesn't render anything
}

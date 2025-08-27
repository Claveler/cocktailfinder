"use client";

import { useMemo, useEffect, memo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./venue-popup.css";

import MapBoundsTracker from "./MapCenterTracker"; // Renamed to MapBoundsTracker
import LocationControl from "./LocationControl";
import VenueCountOverlay from "./VenueCountOverlay";
import { getThemeColorAsHex } from "@/lib/utils";
import { MapBounds, filterVenuesByBounds, calculateApproximateBounds, calculateDistance } from "@/lib/distance";
// import { createRoot } from "react-dom/client"; // Unused

// Enhanced venue type definition
export interface Venue {
  id: string;
  name: string;
  type?: string;
  address?: string;
  city?: string;
  country?: string;
  brands?: string[];
  photos?: string[];
  google_maps_url?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  status: "pending" | "approved" | "rejected";
}

// Component to update map view when props change
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    const flyToDuration = Number(process.env.NEXT_PUBLIC_FLYTO_DURATION) || 1.5;
    map.flyTo(center, zoom, {
      animate: true,
      duration: flyToDuration
    });
  }, [map, center, zoom]);
  
  return null;
}

interface InteractiveMapProps {
  venues: Venue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onBoundsChange?: (center: [number, number], zoom: number, bounds: MapBounds) => void;
  userLocation?: [number, number] | null;
  onLocationRequest?: () => void;
  maxDistanceKm?: number;
  focusedVenueId?: string | null;
}

// Helper function to check if location is the fallback location (LBS)
function isLocationFallback(location: [number, number]): boolean {
  const fallbackLocation: [number, number] = [51.5261617, -0.1633234]; // London Business School
  const tolerance = 0.0001; // Small tolerance for floating point comparison
  
  return (
    Math.abs(location[0] - fallbackLocation[0]) < tolerance &&
    Math.abs(location[1] - fallbackLocation[1]) < tolerance
  );
}

// Component to debug zoom levels
function ZoomDebugger() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const logZoom = () => {
      const currentZoom = map.getZoom();
      const clusteringDisableZoom = Number(process.env.NEXT_PUBLIC_CLUSTERING_DISABLE_ZOOM) || 14;
      console.log(`🔍 Current zoom level: ${currentZoom} ${currentZoom >= clusteringDisableZoom ? '(clustering disabled)' : '(clustering enabled)'}`);
    };

    // Log initial zoom
    logZoom();

    // Log zoom changes
    map.on('zoomend', logZoom);

    return () => {
      map.off('zoomend', logZoom);
    };
  }, [map]);

  return null;
}

// Component to handle venue focusing from card clicks
function VenueFocuser({ 
  focusedVenueId, 
  venues 
}: { 
  focusedVenueId: string | null; 
  venues: Venue[] 
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusedVenueId || !map) return;

    // Find the venue to focus on
    const venue = venues.find(v => v.id === focusedVenueId);
    if (!venue || !venue.location) return;

    // Get search zoom level from environment variable
    const searchZoomLevel = Number(process.env.NEXT_PUBLIC_SEARCH_ZOOM_LEVEL) || 15;

    // Use setView to center the map on the venue location
    map.setView([venue.location.lat, venue.location.lng], searchZoomLevel);
  }, [focusedVenueId, venues, map]);

  return null;
}

// Component to handle pin click functionality
function PinClickHandler() {
  const map = useMap();

  useEffect(() => {
    // Store the pin click handler globally so markers can access it
    (window as any).handlePinClick = (venue: Venue) => {
      if (!venue.location || !map) return;
      
      const searchZoomLevel = Number(process.env.NEXT_PUBLIC_SEARCH_ZOOM_LEVEL) || 15;
      map.setView([venue.location.lat, venue.location.lng], searchZoomLevel);
    };

    return () => {
      // Cleanup
      delete (window as any).handlePinClick;
    };
  }, [map]);

  return null;
}

const LeafletMapComponent = memo(function LeafletMapComponent({
  venues,
  center,
  zoom,
  onBoundsChange,
  userLocation,
  onLocationRequest,
  maxDistanceKm,
  focusedVenueId,
  closestVenueId,
}: {
  venues: Venue[];
  center: [number, number];
  zoom: number;
  onBoundsChange?: (center: [number, number], zoom: number, bounds: MapBounds) => void;
  userLocation?: [number, number] | null;
  onLocationRequest?: () => void;
  maxDistanceKm?: number;
  focusedVenueId?: string | null;
  closestVenueId?: string | null;
}) {
  useEffect(() => {
    // Ensure this only runs on the client side
    if (typeof window === 'undefined') return;
    
    // Setup marker icons using CDN URLs (more reliable in Next.js)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []); // Run only once on mount

  // Create custom marker icon for venues using theme primary color (red)
  const venueMarkerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    // Get the primary color from theme
    const primaryColor = getThemeColorAsHex('primary', '#DC2626');
    
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" fill="none">
          <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 21.875 12.5 41 12.5 41S25 21.875 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="${primaryColor}"/>
          <circle cx="12.5" cy="12.5" r="5" fill="white"/>
        </svg>
      `),
      iconSize: [25, 41],
      iconAnchor: [12.5, 41],
      popupAnchor: [0, -41],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });
  }, []);

  // Create custom marker icon for closest venue (green)
  const closestVenueMarkerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" fill="none">
          <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 21.875 12.5 41 12.5 41S25 21.875 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="#22C55E"/>
          <circle cx="12.5" cy="12.5" r="5" fill="white"/>
        </svg>
      `),
      iconSize: [25, 41],
      iconAnchor: [12.5, 41],
      popupAnchor: [0, -41],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });
  }, []);

  // Create custom "you are here" icon for user location
  const userLocationIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    // Get theme primary color for consistency
    const primaryColor = getThemeColorAsHex('primary', '#DC2626');
    
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
          <!-- Outer pulse ring -->
          <circle cx="16" cy="16" r="14" fill="${primaryColor}" fill-opacity="0.2" stroke="${primaryColor}" stroke-width="1"/>
          <!-- Inner solid circle -->
          <circle cx="16" cy="16" r="8" fill="${primaryColor}" stroke="white" stroke-width="3"/>
          <!-- Center dot -->
          <circle cx="16" cy="16" r="3" fill="white"/>
        </svg>
      `),
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
      zoomControl={false}
    >
      <MapUpdater center={center} zoom={zoom} />
      
      {/* Map bounds tracking - ISOLATED component for venue cards only */}
      {onBoundsChange && <MapBoundsTracker onBoundsChange={onBoundsChange} />}

      {/* Add location control */}
      <LocationControl 
        userLocation={userLocation ?? null} 
        onLocationRequest={onLocationRequest}
        zoom={zoom}
      />

      {/* Venue focusing for card clicks */}
      <VenueFocuser focusedVenueId={focusedVenueId ?? null} venues={venues} />
      
      {/* Pin click handling */}
      <PinClickHandler />

      {/* Debug zoom levels */}
      <ZoomDebugger />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker - "You are here" indicator */}
      {userLocationIcon && userLocation && !isLocationFallback(userLocation) && (
        <Marker
          position={userLocation}
          icon={userLocationIcon}
          zIndexOffset={1000} // Ensure it appears above venue markers
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-sm text-primary">📍 You are here</h3>
              <p className="text-xs text-gray-600 mt-1">
                Your current location
              </p>
              <p className="text-xs text-gray-500">
                {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Regular venue markers (in cluster group) */}
      <MarkerClusterGroup
        chunkedLoading
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        disableClusteringAtZoom={Number(process.env.NEXT_PUBLIC_CLUSTERING_DISABLE_ZOOM) || 14}
        iconCreateFunction={(cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          let className = 'marker-cluster-small';
          
          if (count < 10) {
            size = 'small';
            className = 'marker-cluster-small';
          } else if (count < 100) {
            size = 'medium';
            className = 'marker-cluster-medium';
          } else {
            size = 'large';
            className = 'marker-cluster-large';
          }
          
          return new L.DivIcon({
            html: `<div class="cluster-inner">${count}</div>`,
            className: `marker-cluster ${className}`,
            iconSize: new L.Point(40, 40),
          });
        }}
      >
        {venues
          .filter((venue) => venue.id !== "user-location")
          .map((venue) => {
            // Use green icon for closest venue, red for all others
            const isClosest = venue.id === closestVenueId;
            const markerIcon = isClosest ? closestVenueMarkerIcon : venueMarkerIcon;
            
            return (
              <Marker
                key={venue.id}
                position={[venue.location.lat, venue.location.lng]}
                icon={markerIcon || undefined}
                eventHandlers={{
                  click: () => {
                    if ((window as any).handlePinClick) {
                      (window as any).handlePinClick(venue);
                    }
                  }
                }}
              />
            );
          })}
      </MarkerClusterGroup>
    </MapContainer>
  );
});

const InteractiveMap = memo(function InteractiveMap({
  venues,
  height = "400px",
  center = [51.5261617, -0.1633234], // Default to London Business School (LBS easter egg! 🎓)
  zoom = Number(process.env.NEXT_PUBLIC_MAP_ZOOM_LEVEL) || 13,
  onBoundsChange,
  userLocation,
  onLocationRequest,
  maxDistanceKm,
  focusedVenueId,
}: InteractiveMapProps) {
  // State to track venues visible in current map bounds
  const [visibleVenueCount, setVisibleVenueCount] = useState(0);
  
  // State to track current map center for determining closest venue
  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>(center);

  // Filter to only show approved venues
  const approvedVenues = useMemo(
    () => venues.filter((venue) => venue.status === "approved"),
    [venues]
  );

  // Find the closest venue to the map center
  const closestVenueId = useMemo(() => {
    if (approvedVenues.length === 0) return null;
    
    const venuesWithLocation = approvedVenues.filter(venue => venue.location !== null);
    if (venuesWithLocation.length === 0) return null;
    
    let closestVenue = venuesWithLocation[0];
    let minDistance = calculateDistance(
      currentMapCenter[0], 
      currentMapCenter[1], 
      closestVenue.location!.lat, 
      closestVenue.location!.lng
    );
    
    for (const venue of venuesWithLocation) {
      const distance = calculateDistance(
        currentMapCenter[0], 
        currentMapCenter[1], 
        venue.location!.lat, 
        venue.location!.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestVenue = venue;
      }
    }
    
    return closestVenue.id;
  }, [approvedVenues, currentMapCenter]);

  // Internal bounds change handler for venue count overlay and map center tracking
  const handleInternalBoundsChange = useCallback((mapCenter: [number, number], mapZoom: number, bounds: MapBounds) => {
    // Update current map center state
    setCurrentMapCenter(mapCenter);
    
    // Filter venues by current bounds to get count of visible venues
    const venuesWithLocation = approvedVenues.filter(venue => venue.location !== null);
    const centerLocation = { lat: mapCenter[0], lng: mapCenter[1] };
    const visibleVenues = filterVenuesByBounds(venuesWithLocation, bounds, centerLocation);
    
    // Update visible venue count
    setVisibleVenueCount(visibleVenues.length);
    
    // Call the external onBoundsChange if provided
    if (onBoundsChange) {
      onBoundsChange(mapCenter, mapZoom, bounds);
    }
  }, [approvedVenues, onBoundsChange]);

  // Initialize venue count on mount and when venues change
  useEffect(() => {
    if (approvedVenues.length > 0) {
      const initialBounds = calculateApproximateBounds(center, zoom);
      const venuesWithLocation = approvedVenues.filter(venue => venue.location !== null);
      const centerLocation = { lat: center[0], lng: center[1] };
      const visibleVenues = filterVenuesByBounds(venuesWithLocation, initialBounds, centerLocation);
      setVisibleVenueCount(visibleVenues.length);
    }
  }, [approvedVenues, center, zoom]);

  return (
    <div style={{ height }} className="w-full !rounded-none md:!rounded-lg overflow-hidden relative">
      <LeafletMapComponent 
        venues={approvedVenues} 
        center={center} 
        zoom={zoom}
        onBoundsChange={handleInternalBoundsChange}
        userLocation={userLocation}
        onLocationRequest={onLocationRequest}
        maxDistanceKm={maxDistanceKm}
        focusedVenueId={focusedVenueId}
        closestVenueId={closestVenueId}
      />
      
      {/* Venue count overlay - shows venues visible in current map bounds */}
      <VenueCountOverlay venueCount={visibleVenueCount} />
    </div>
  );
});

export default InteractiveMap;

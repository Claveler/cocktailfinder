"use client";

import { useMemo, useEffect, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./venue-popup.css";

import MapCenterTracker from "./MapCenterTracker";
import LocationControl from "./LocationControl";
import VenuePopup from "./VenuePopup";
import { getThemeColorAsHex } from "@/lib/utils";
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
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

interface InteractiveMapProps {
  venues: Venue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onCenterChange?: (center: [number, number], zoom: number) => void;
  userLocation?: [number, number] | null;
  onLocationRequest?: () => void;
  maxDistanceKm?: number;
}

const LeafletMapComponent = memo(function LeafletMapComponent({
  venues,
  center,
  zoom,
  onCenterChange,
  userLocation,
  onLocationRequest,
  maxDistanceKm,
}: {
  venues: Venue[];
  center: [number, number];
  zoom: number;
  onCenterChange?: (center: [number, number], zoom: number) => void;
  userLocation?: [number, number] | null;
  onLocationRequest?: () => void;
  maxDistanceKm?: number;
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

  // Create custom marker icon for venues using theme primary color
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

  // Create custom icon for user location (client-side only)
  const userLocationIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="30" height="30">
          <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>
      `),
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <MapUpdater center={center} zoom={zoom} />
      
      {/* Map center tracking - ISOLATED component for venue cards only */}
      {onCenterChange && <MapCenterTracker onCenterChange={onCenterChange} />}

      {/* Add location control */}
      <LocationControl 
        userLocation={userLocation ?? null} 
        onLocationRequest={onLocationRequest}
        zoom={zoom}
      />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker (outside cluster group) */}
      {userLocationIcon && venues
        .filter((venue) => venue.id === "user-location")
        .map((venue) => (
          <Marker
            key={venue.id}
            position={[venue.location.lat, venue.location.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm text-blue-600">📍 {venue.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {venue.location.lat.toFixed(4)},{" "}
                  {venue.location.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Regular venue markers (in cluster group) */}
      <MarkerClusterGroup
        chunkedLoading
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
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
            return (
              <Marker
                key={venue.id}
                position={[venue.location.lat, venue.location.lng]}
                icon={venueMarkerIcon || undefined}
              >
                <Popup
                  maxWidth={320}
                  className="venue-popup-container"
                >
                  <VenuePopup venue={venue} />
                </Popup>
              </Marker>
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
  onCenterChange,
  userLocation,
  onLocationRequest,
  maxDistanceKm,
}: InteractiveMapProps) {
  

  // Filter to only show approved venues
  const approvedVenues = useMemo(
    () => venues.filter((venue) => venue.status === "approved"),
    [venues]
  );

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden">
      <LeafletMapComponent 
        venues={approvedVenues} 
        center={center} 
        zoom={zoom}
        onCenterChange={onCenterChange}
        userLocation={userLocation}
        onLocationRequest={onLocationRequest}
        maxDistanceKm={maxDistanceKm}
      />
    </div>
  );
});

export default InteractiveMap;

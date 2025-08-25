"use client";

import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./venue-popup.css";

// Leaflet marker icons will be imported dynamically in useEffect

// Venue type definition
export interface Venue {
  id: string;
  name: string;
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

interface BasicMapProps {
  venues: Venue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
}

function LeafletMapComponent({
  venues,
  center,
  zoom,
}: {
  venues: Venue[];
  center: [number, number];
  zoom: number;
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

  // Create custom red marker icon for venues (theme primary color)
  const venueMarkerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" fill="none">
          <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 21.875 12.5 41 12.5 41S25 21.875 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="#DC2626"/>
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
          .map((venue) => (
            <Marker
              key={venue.id}
              position={[venue.location.lat, venue.location.lng]}
              icon={venueMarkerIcon || undefined}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm">{venue.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {venue.location.lat.toFixed(4)},{" "}
                    {venue.location.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

export default function BasicMap({
  venues,
  height = "400px",
  center = [40.7128, -74.006], // Default to NYC
  zoom = 10,
}: BasicMapProps) {
  // Filter to only show approved venues
  const approvedVenues = useMemo(
    () => venues.filter((venue) => venue.status === "approved"),
    [venues]
  );

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden">
      <LeafletMapComponent venues={approvedVenues} center={center} zoom={zoom} />
    </div>
  );
}

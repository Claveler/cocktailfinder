"use client";

import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
    // Fix for default markers not showing in production builds
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon.src,
      iconRetinaUrl: markerIcon2x.src,
      shadowUrl: markerShadow.src,
    });
  }, []);

  // Create custom icon for user location
  const userLocationIcon = new L.Icon({
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
      {venues
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
      >
        {venues
          .filter((venue) => venue.id !== "user-location")
          .map((venue) => (
            <Marker
              key={venue.id}
              position={[venue.location.lat, venue.location.lng]}
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

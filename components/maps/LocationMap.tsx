"use client";

import { useState, useEffect } from "react";
import BasicMap, { type Venue } from "./BasicMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, X } from "lucide-react";

interface LocationMapProps {
  venues: Venue[];
  height?: string;
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
}

export default function LocationMap({
  venues,
  height = "400px",
  fallbackCenter = [40.7589, -73.9851], // NYC default
  fallbackZoom = 13,
}: LocationMapProps) {
  const [center, setCenter] = useState<[number, number]>(fallbackCenter);
  const [zoom, setZoom] = useState<number>(fallbackZoom);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoading(false);
      return;
    }

    // Check if we're on HTTPS or localhost
    const isSecureContext = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      setLocationError("Geolocation requires a secure connection (HTTPS)");
      setIsLoading(false);
      return;
    }

    // Detect browser for debugging
    const isEdge = /Edg/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);

    // Request user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const userCoords: [number, number] = [userLat, userLng];
        
        setUserLocation(userCoords);
        setCenter(userCoords);
        setZoom(12); // Zoom in a bit more for user's location
        setIsLoading(false);
        setLocationError(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        console.error("Error code:", error.code, "Message:", error.message);
        let errorMessage = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = isEdge 
              ? "Location access denied. In Edge, go to Settings > Site permissions > Location to allow location access for this site."
              : "Location access denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = isEdge
              ? "Location information is unavailable. Make sure location services are enabled in your system settings and Edge has permission to access them."
              : "Location information is unavailable. Please try again later.";
            break;
          case error.TIMEOUT:
            errorMessage = isEdge
              ? "Location request timed out. Edge may need more time - try refreshing and clicking 'Allow' quickly when prompted."
              : "Location request timed out. Please try refreshing the page.";
            break;
          default:
            errorMessage = `Location error: ${error.message} (Browser: ${isEdge ? 'Edge' : isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Unknown'})`;
        }
        
        setLocationError(errorMessage);
        setIsLoading(false);
        // Keep fallback center and zoom
      },
      {
        enableHighAccuracy: isEdge ? true : false, // Edge might need high accuracy enabled
        timeout: isEdge ? 10000 : 5000, // Give Edge more time
        maximumAge: isEdge ? 60000 : 300000, // Shorter cache for Edge
      }
    );
  }, []);

  // Create venues array with user location marker
  const venuesWithUser = userLocation
    ? [
        ...venues,
        {
          id: "user-location",
          name: "Your Location",
          location: { lat: userLocation[0], lng: userLocation[1] },
          status: "approved" as const,
        },
      ]
    : venues;

  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden" style={{ height }}>
        <CardContent className="p-0 h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <MapPin className="w-8 h-8 mx-auto mb-3 animate-pulse" />
            <div className="text-sm">Finding your location...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card className="w-full overflow-hidden" style={{ height }}>
        <CardContent className="p-0 h-full">
          <BasicMap
            venues={venuesWithUser}
            height="100%"
            center={center}
            zoom={zoom}
          />
        </CardContent>
      </Card>
      
      {locationError && !isErrorDismissed && (
        <div className="absolute top-3 left-3 right-3 z-[1000]">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-medium">Using default location</p>
              <p className="text-blue-700 text-xs mt-1">Enable location access to see venues near you.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
              onClick={() => setIsErrorDismissed(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

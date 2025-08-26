import L from "leaflet";

// Map bounds interface
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calculate the distance between two geographic points using Leaflet's built-in distanceTo method
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Use Leaflet's built-in distanceTo method for accurate distance calculation
  const point1 = L.latLng(lat1, lng1);
  const point2 = L.latLng(lat2, lng2);
  
  // distanceTo returns distance in meters, convert to kilometers
  const distanceInMeters = point1.distanceTo(point2);
  const distanceInKm = distanceInMeters / 1000;
  
  console.log(`📏 Using Leaflet's distanceTo: ${distanceInKm.toFixed(2)}km between [${lat1.toFixed(4)}, ${lng1.toFixed(4)}] and [${lat2.toFixed(4)}, ${lng2.toFixed(4)}]`);
  
  return Math.round(distanceInKm * 100) / 100; // Round to 2 decimal places
}

/**
 * Filter venues by distance from a given location
 * @param venues Array of venues with location data
 * @param userLocation User's current location
 * @param maxDistanceKm Maximum distance in kilometers
 * @returns Venues within the specified radius with distance added
 */
export function filterVenuesByDistance<T extends { location: { lat: number; lng: number } | null }>(
  venues: T[],
  userLocation: { lat: number; lng: number },
  maxDistanceKm: number
): (T & { distance: number })[] {
  return venues
    .filter((venue) => venue.location !== null)
    .map((venue) => ({
      ...venue,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        venue.location!.lat,
        venue.location!.lng
      ),
    }))
    .filter((venue) => venue.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)
}

/**
 * Convert our MapBounds interface to Leaflet's LatLngBounds
 * @param bounds Map bounds object with north, south, east, west properties
 * @returns Leaflet LatLngBounds object
 */
function createLatLngBounds(bounds: MapBounds): L.LatLngBounds {
  // Create bounds from southwest and northeast corners
  const southWest = L.latLng(bounds.south, bounds.west);
  const northEast = L.latLng(bounds.north, bounds.east);
  return L.latLngBounds(southWest, northEast);
}

/**
 * Check if a point is within the given map bounds using Leaflet's built-in contains method
 * @param lat Latitude of the point
 * @param lng Longitude of the point  
 * @param bounds Map bounds object
 * @returns True if the point is within bounds
 */
export function isPointInBounds(
  lat: number,
  lng: number,
  bounds: MapBounds
): boolean {
  // Use Leaflet's built-in bounds checking for accuracy
  const leafletBounds = createLatLngBounds(bounds);
  const point = L.latLng(lat, lng);
  
  const isInBounds = leafletBounds.contains(point);
  
  console.log(`📍 Using Leaflet's bounds.contains(): ${isInBounds} for point [${lat.toFixed(4)}, ${lng.toFixed(4)}] in bounds [S:${bounds.south.toFixed(4)}, N:${bounds.north.toFixed(4)}, W:${bounds.west.toFixed(4)}, E:${bounds.east.toFixed(4)}]`);
  
  return isInBounds;
}

/**
 * Filter venues that are visible within the current map bounds
 * @param venues Array of venues with location data
 * @param bounds Current map bounds
 * @param mapCenter Center of the map for distance calculation
 * @returns Venues within the map bounds with distance from center
 */
export function filterVenuesByBounds<T extends { location: { lat: number; lng: number } | null }>(
  venues: T[],
  bounds: MapBounds,
  mapCenter: { lat: number; lng: number }
): (T & { distance: number })[] {
  const venuesWithLocation = venues.filter((venue) => venue.location !== null);
  const venuesInBounds = venuesWithLocation.filter((venue) => 
    isPointInBounds(venue.location!.lat, venue.location!.lng, bounds)
  );
  

  
  return venuesInBounds
    .map((venue) => ({
      ...venue,
      distance: calculateDistance(
        mapCenter.lat,
        mapCenter.lng,
        venue.location!.lat,
        venue.location!.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance); // Sort by distance from center (closest first)
}

/**
 * Get responsive viewport dimensions based on screen size
 * @returns Object with width and height in pixels
 */
function getResponsiveViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return { width: 800, height: 400 };
  }
  
  const screenWidth = window.innerWidth;
  
  // Mobile: < 768px
  if (screenWidth < 768) {
    return { 
      width: Math.min(screenWidth - 32, 350), // Account for padding, max 350px
      height: Math.min(screenWidth * 0.6, 250) // Aspect ratio friendly, max 250px
    };
  }
  
  // Tablet: 768px - 1024px  
  if (screenWidth < 1024) {
    return { 
      width: Math.min(screenWidth * 0.7, 600), 
      height: Math.min(screenWidth * 0.35, 350) 
    };
  }
  
  // Desktop: >= 1024px
  return { 
    width: Math.min(screenWidth * 0.6, 800), 
    height: Math.min(screenWidth * 0.3, 400) 
  };
}

/**
 * Calculate approximate map bounds based on center and zoom level
 * This is an approximation based on Leaflet's tile system with responsive viewport
 * @param center Map center coordinates
 * @param zoom Map zoom level
 * @param customViewport Optional custom viewport dimensions
 * @returns Approximate map bounds
 */
export function calculateApproximateBounds(
  center: [number, number], 
  zoom: number,
  customViewport?: { width: number; height: number }
): MapBounds {
  // Calculate degrees per pixel at this zoom level
  // This is an approximation based on Web Mercator projection
  const degreesPerPixel = 360 / (256 * Math.pow(2, zoom));
  
  // Get responsive viewport size or use custom dimensions
  const viewport = customViewport || getResponsiveViewportSize();
  

  
  // Calculate half the viewport in degrees
  const halfWidthDegrees = (viewport.width / 2) * degreesPerPixel;
  const halfHeightDegrees = (viewport.height / 2) * degreesPerPixel;
  
  // Adjust for latitude (Mercator projection distortion)
  const latAdjustment = Math.cos(center[0] * Math.PI / 180);
  const adjustedHalfWidth = halfWidthDegrees / latAdjustment;
  
  return {
    north: center[0] + halfHeightDegrees,
    south: center[0] - halfHeightDegrees,
    east: center[1] + adjustedHalfWidth,
    west: center[1] - adjustedHalfWidth,
  };
}

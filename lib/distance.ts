// Map bounds interface
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
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
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
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
 * Check if a point is within the given map bounds
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
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
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
  return venues
    .filter((venue) => venue.location !== null)
    .filter((venue) => 
      isPointInBounds(venue.location!.lat, venue.location!.lng, bounds)
    )
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
 * Calculate approximate map bounds based on center and zoom level
 * This is an approximation based on Leaflet's tile system
 * @param center Map center coordinates
 * @param zoom Map zoom level
 * @returns Approximate map bounds
 */
export function calculateApproximateBounds(
  center: [number, number], 
  zoom: number
): MapBounds {
  // Calculate degrees per pixel at this zoom level
  // This is an approximation based on Web Mercator projection
  const degreesPerPixel = 360 / (256 * Math.pow(2, zoom));
  
  // Assume a typical map viewport size (can be adjusted)
  const viewportWidth = 800;  // pixels
  const viewportHeight = 400; // pixels
  
  // Calculate half the viewport in degrees
  const halfWidthDegrees = (viewportWidth / 2) * degreesPerPixel;
  const halfHeightDegrees = (viewportHeight / 2) * degreesPerPixel;
  
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

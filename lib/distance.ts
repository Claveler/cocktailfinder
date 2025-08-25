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

/**
 * Utility functions for parsing Google Maps URLs and extracting coordinates
 */

// Shared validation patterns for Google Maps URLs
export const GOOGLE_MAPS_URL_PATTERNS = [
  /^https?:\/\/(www\.)?google\.com\/maps/,
  /^https?:\/\/maps\.google\.com/,
  /^https?:\/\/maps\.app\.goo\.gl/,
  /^https?:\/\/goo\.gl\/maps/,
];

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface VenueInfo {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface ParseResult {
  success: boolean;
  coordinates?: Coordinates;
  venueInfo?: VenueInfo;
  error?: string;
}

/**
 * Parse coordinates and venue information from various Google Maps URL formats
 */
export async function parseGoogleMapsUrl(url: string): Promise<ParseResult> {
  try {
    // Clean and normalize the URL
    const cleanUrl = url.trim();

    // Validate it's a Google Maps URL
    if (!isGoogleMapsUrl(cleanUrl)) {
      return {
        success: false,
        error: "Invalid Google Maps URL format",
      };
    }

    // Handle different Google Maps URL formats

    // 1. Short URLs (e.g., https://maps.app.goo.gl/xyz)
    if (cleanUrl.includes("maps.app.goo.gl") || cleanUrl.includes("goo.gl")) {
      return await parseShortUrl(cleanUrl);
    }

    // 2. Parse coordinates and venue info directly from URL
    return await parseGoogleMapsUrlDirect(cleanUrl);
  } catch {
    return {
      success: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Parse coordinates and venue info from Google Maps URL without handling short URLs
 * (used internally to prevent infinite recursion)
 */
async function parseGoogleMapsUrlDirect(url: string): Promise<ParseResult> {
  try {
    let coordinates: Coordinates | undefined;
    let venueName: string | undefined;

    // 1. Full URLs with coordinates in path
    // Format: https://www.google.com/maps/place/Name/@lat,lng,zoom
    const coordinateMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
    if (coordinateMatch) {
      const lat = parseFloat(coordinateMatch[1]);
      const lng = parseFloat(coordinateMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        coordinates = { lat, lng };
        
        // Try to extract venue name from place URLs
        const placeMatch = url.match(/\/place\/([^/@]+)/);
        if (placeMatch) {
          venueName = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
        }
      }
    }

    // 2. URLs with query parameters
    if (!coordinates) {
      const urlObj = new URL(url);
      const qParam = urlObj.searchParams.get("q");
      if (qParam) {
        const coords = qParam.split(",");
        if (coords.length >= 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);

          if (isValidCoordinate(lat, lng)) {
            coordinates = { lat, lng };
          }
        } else {
          // q parameter might contain venue name
          venueName = qParam;
        }
      }

      // 3. URLs with ll parameter
      if (!coordinates) {
        const llParam = urlObj.searchParams.get("ll");
        if (llParam) {
          const coords = llParam.split(",");
          if (coords.length >= 2) {
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);

            if (isValidCoordinate(lat, lng)) {
              coordinates = { lat, lng };
            }
          }
        }
      }
    }

    if (!coordinates) {
      return {
        success: false,
        error: "Could not extract coordinates from this Google Maps URL",
      };
    }

    // Get address information using reverse geocoding
    const addressInfo = await reverseGeocode(coordinates);

    return {
      success: true,
      coordinates,
      venueInfo: {
        name: venueName,
        address: addressInfo.address,
        city: addressInfo.city,
        country: addressInfo.country,
      },
    };
  } catch {
    return {
      success: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Handle short URLs by expanding them through our API endpoint
 */
async function parseShortUrl(shortUrl: string): Promise<ParseResult> {
  try {
    const response = await fetch("/api/maps/expand-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: shortUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Could not expand short URL",
      };
    }

    if (data.success && data.expandedUrl) {
      // Now parse the expanded URL (but prevent infinite recursion)
      return await parseGoogleMapsUrlDirect(data.expandedUrl);
    }

    return {
      success: false,
      error: "Could not expand short URL",
    };
  } catch {
    return {
      success: false,
      error: "Network error while expanding URL. Please try again.",
    };
  }
}

/**
 * Reverse geocode coordinates to get address information using Nominatim (free)
 */
async function reverseGeocode(coordinates: Coordinates): Promise<{
  address?: string;
  city?: string;
  country?: string;
}> {
  try {
    const { lat, lng } = coordinates;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
      {
        headers: {
          'User-Agent': 'Piscola.net venue submission',
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    
    if (data.address) {
      const addr = data.address;
      
      // Build address string from components
      const addressParts = [];
      
      // Add house number and road
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) addressParts.push(addr.road);
      
      // Add neighbourhood or suburb if no road
      if (!addr.road && (addr.neighbourhood || addr.suburb)) {
        addressParts.push(addr.neighbourhood || addr.suburb);
      }
      
      const address = addressParts.join(' ') || data.display_name?.split(',')[0];
      
      // Determine city
      const city = addr.city || 
                   addr.town || 
                   addr.municipality || 
                   addr.village || 
                   addr.hamlet || 
                   addr.county;
      
      // Determine country
      const country = addr.country;
      
      return {
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
      };
    }
    
    return {};
  } catch {
    // Silent fail for geocoding - it's supplementary information
    return {};
  }
}

/**
 * Validate that coordinates are within valid ranges
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: Coordinates): string {
  return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
}

/**
 * Validate Google Maps URL format
 */
export function isGoogleMapsUrl(url: string): boolean {
  return GOOGLE_MAPS_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Get the best Google Maps URL for a venue
 * Prefers the original stored URL, falls back to coordinates
 */
export function getVenueGoogleMapsUrl(venue: {
  google_maps_url?: string | null;
  location?: { lat: number; lng: number } | null;
}): string {
  // Use stored Google Maps URL if available
  if (venue.google_maps_url) {
    return venue.google_maps_url;
  }

  // Fall back to coordinate-based URL
  if (venue.location) {
    return `https://www.google.com/maps?q=${venue.location.lat},${venue.location.lng}`;
  }

  // Default fallback (shouldn't happen in practice)
  return "https://www.google.com/maps";
}

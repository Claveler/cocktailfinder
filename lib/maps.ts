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

export interface ParseResult {
  success: boolean;
  coordinates?: Coordinates;
  error?: string;
}

/**
 * Parse coordinates from various Google Maps URL formats
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

    // 2. Parse coordinates directly from URL
    return parseGoogleMapsUrlDirect(cleanUrl);
  } catch {
    return {
      success: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Parse coordinates from Google Maps URL without handling short URLs
 * (used internally to prevent infinite recursion)
 */
function parseGoogleMapsUrlDirect(url: string): ParseResult {
  try {
    // 1. Full URLs with coordinates in path
    // Format: https://www.google.com/maps/place/Name/@lat,lng,zoom
    const coordinateMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
    if (coordinateMatch) {
      const lat = parseFloat(coordinateMatch[1]);
      const lng = parseFloat(coordinateMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return {
          success: true,
          coordinates: { lat, lng },
        };
      }
    }

    // 2. URLs with query parameters
    // Format: https://www.google.com/maps?q=lat,lng
    const urlObj = new URL(url);
    const qParam = urlObj.searchParams.get("q");
    if (qParam) {
      const coords = qParam.split(",");
      if (coords.length >= 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);

        if (isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { lat, lng },
          };
        }
      }
    }

    // 3. URLs with ll parameter
    const llParam = urlObj.searchParams.get("ll");
    if (llParam) {
      const coords = llParam.split(",");
      if (coords.length >= 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);

        if (isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { lat, lng },
          };
        }
      }
    }

    return {
      success: false,
      error: "Could not extract coordinates from this Google Maps URL",
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
      return parseGoogleMapsUrlDirect(data.expandedUrl);
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

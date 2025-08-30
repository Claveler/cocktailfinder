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

    // Extract Place ID first (most accurate method)
    const placeId = extractPlaceId(url);
    if (placeId) {
      // TODO: Could use Google Places API here for exact coordinates
      // For now, continue with other methods but prioritize place-specific patterns
    }

    let extractionMethod = "unknown";

    // Extract venue name from place URLs first (independent of coordinates)
    if (url.includes("/place/")) {
      const placeMatch = url.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        venueName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
      }
    }

    // 1. HIGHEST PRIORITY: Search for !3d!4d precise coordinate patterns
    coordinates = extractPreciseCoordinates(url);
    if (coordinates) {
      extractionMethod = "precise_patterns(!3d!4d)";
    }

    // 2. MEDIUM PRIORITY: Extract place-specific @ coordinates (more reliable than general @)
    if (!coordinates && url.includes("/place/")) {
      const placeCoordinateMatch = url.match(
        /\/place\/[^/@]*\/@(-?\d+\.?\d*),(-?\d+\.?\d*),/
      );
      if (placeCoordinateMatch) {
        const lat = parseFloat(placeCoordinateMatch[1]);
        const lng = parseFloat(placeCoordinateMatch[2]);

        if (isValidCoordinate(lat, lng)) {
          coordinates = { lat, lng };
          extractionMethod = "place_url_coords(@pattern)";
        }
      }
    }

    // 3. LOWEST PRIORITY: Fallback to general @ coordinate extraction
    if (!coordinates) {
      const coordinateMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
      if (coordinateMatch) {
        const lat = parseFloat(coordinateMatch[1]);
        const lng = parseFloat(coordinateMatch[2]);

        if (isValidCoordinate(lat, lng)) {
          coordinates = { lat, lng };
          extractionMethod = "general_at_pattern(fallback)";
        }
      }
    }

    // Log extraction method for debugging
    if (coordinates) {
      console.log(
        `[Maps] Coordinates extracted using method: ${extractionMethod}`,
        {
          coordinates,
          precision: coordinates.lat.toString().split(".")[1]?.length || 0,
          url: url.substring(0, 100) + "...",
        }
      );
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

    // First try to extract venue info directly from the URL
    const urlVenueInfo = extractVenueInfoFromUrl(url);

    // Then get additional address information using reverse geocoding
    const geocodedInfo = await reverseGeocode(coordinates);

    // Combine URL info with geocoded info, preferring URL info when available
    const finalVenueInfo = {
      name: cleanVenueName(venueName || urlVenueInfo.name),
      address: urlVenueInfo.address || geocodedInfo.address,
      city: urlVenueInfo.city || geocodedInfo.city,
      country: urlVenueInfo.country || geocodedInfo.country,
    };

    return {
      success: true,
      coordinates,
      venueInfo: finalVenueInfo,
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
 * Extract Google Place ID from URL (most accurate for getting exact venue coordinates)
 */
function extractPlaceId(url: string): string | undefined {
  try {
    // Extract place_id from query parameters
    const urlObj = new URL(url);
    const placeId = urlObj.searchParams.get("place_id");
    if (placeId) {
      return placeId;
    }

    // Extract place_id from data parameter (often in shared URLs)
    const dataParam = urlObj.searchParams.get("data");
    if (dataParam) {
      const placeIdMatch = dataParam.match(/!3m1!1s([A-Za-z0-9_-]+)/);
      if (placeIdMatch) {
        return placeIdMatch[1];
      }
    }

    // Look for place_id in URL fragments
    const fragmentPlaceId = url.match(/place_id:([A-Za-z0-9_-]+)/);
    if (fragmentPlaceId) {
      return fragmentPlaceId[1];
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract more precise coordinates using advanced patterns
 */
function extractPreciseCoordinates(url: string): Coordinates | undefined {
  try {
    // 1. Look for coordinates in data parameter (very precise)
    const urlObj = new URL(url);
    const dataParam = urlObj.searchParams.get("data");
    if (dataParam) {
      // Data parameter format: !4d[lng]!3d[lat] (very precise coordinates)
      const preciseCoordMatch = dataParam.match(
        /!3d(-?\d+\.?\d*).*?!4d(-?\d+\.?\d*)/
      );
      if (preciseCoordMatch) {
        const lat = parseFloat(preciseCoordMatch[1]);
        const lng = parseFloat(preciseCoordMatch[2]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }

    // 2. Look for coordinates in ftid parameter (Feature ID coordinates)
    const ftidParam = urlObj.searchParams.get("ftid");
    if (ftidParam) {
      const ftidCoordMatch = ftidParam.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (ftidCoordMatch) {
        const lat = parseFloat(ftidCoordMatch[1]);
        const lng = parseFloat(ftidCoordMatch[2]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }

    // 3. Look for coordinates in specific venue-related URL patterns
    // Pattern: /data=!3m1!4b1!4m6!3m5!1s[place_id]!8m2!3d[lat]!4d[lng]
    const venueCoordMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (venueCoordMatch) {
      const lat = parseFloat(venueCoordMatch[1]);
      const lng = parseFloat(venueCoordMatch[2]);
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // 4. Look for coordinates in embedded map URLs
    const embedCoordMatch = url.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
    if (embedCoordMatch) {
      const lng = parseFloat(embedCoordMatch[1]); // Note: 2d is longitude
      const lat = parseFloat(embedCoordMatch[2]); // Note: 3d is latitude
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // 5. Check for coordinates in query parameters with high precision
    const qParam = urlObj.searchParams.get("q");
    if (qParam) {
      // Look for high-precision coordinates (more decimal places = more precise)
      const preciseQMatch = qParam.match(/(-?\d+\.\d{6,}),(-?\d+\.\d{6,})/);
      if (preciseQMatch) {
        const lat = parseFloat(preciseQMatch[1]);
        const lng = parseFloat(preciseQMatch[2]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract venue information directly from Google Maps URL before reverse geocoding
 */
function extractVenueInfoFromUrl(url: string): {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
} {
  try {
    // 1. Extract venue name from place URLs
    // Format: /place/Venue+Name/or/Venue%20Name
    const placeMatch = url.match(/\/place\/([^/@?]+)/);
    let venueName: string | undefined;

    if (placeMatch) {
      venueName = decodeURIComponent(placeMatch[1])
        .replace(/\+/g, " ")
        .replace(/%20/g, " ")
        .trim();
    }

    // 2. Extract address info from query parameters
    const urlObj = new URL(url);
    const qParam = urlObj.searchParams.get("q");

    if (qParam && !qParam.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
      // q parameter contains address/venue info, not just coordinates
      const addressInfo = parseAddressFromQuery(qParam);
      if (addressInfo.name && !venueName) {
        venueName = addressInfo.name;
      }

      return {
        name: cleanVenueName(venueName),
        address: addressInfo.address,
        city: addressInfo.city,
        country: addressInfo.country,
      };
    }

    // 4. Handle place_id or data parameters (share URLs)
    const placeId = urlObj.searchParams.get("place_id");
    const dataParam = urlObj.searchParams.get("data");

    if (dataParam) {
      // Data parameter often contains venue information
      try {
        const decodedData = decodeURIComponent(dataParam);
        const addressInfo = parseAddressFromQuery(decodedData);
        if (addressInfo.name && !venueName) {
          venueName = addressInfo.name;
        }
        if (addressInfo.address || addressInfo.city || addressInfo.country) {
          return {
            name: cleanVenueName(venueName),
            address: addressInfo.address,
            city: addressInfo.city,
            country: addressInfo.country,
          };
        }
      } catch {
        // Continue with other extraction methods
      }
    }

    // 3. Extract from search queries in the URL
    const searchMatch = url.match(/\/search\/([^/@?]+)/);
    if (searchMatch) {
      const searchQuery = decodeURIComponent(searchMatch[1]).replace(
        /\+/g,
        " "
      );
      const addressInfo = parseAddressFromQuery(searchQuery);

      return {
        name: cleanVenueName(venueName || addressInfo.name),
        address: addressInfo.address,
        city: addressInfo.city,
        country: addressInfo.country,
      };
    }

    return { name: cleanVenueName(venueName) };
  } catch {
    return {};
  }
}

/**
 * Clean and normalize venue names extracted from URLs
 */
function cleanVenueName(name?: string): string | undefined {
  if (!name) return undefined;

  // Remove common suffixes and prefixes that Google Maps adds
  const cleanedName = name
    .replace(/\s*-\s*Google\s*Maps?$/i, "")
    .replace(/^Google\s*Maps?\s*-\s*/i, "")
    .replace(/\s*\|\s*Google\s*Maps?$/i, "")
    .replace(/\s*·\s*Google\s*Maps?$/i, "")
    .replace(/\s*@\s*Google\s*Maps?$/i, "")
    .replace(/\s*\([^)]*reviews?\)[^)]*$/i, "") // Remove review counts like "(123 reviews)"
    .replace(/\s*\d+\.\d+\s*★[^★]*$/i, "") // Remove ratings like "4.5 ★★★★☆"
    .replace(/\s*\d+\.\d+\/5\s*$/i, "") // Remove ratings like "4.5/5"
    .replace(/\s*\d+\s*reviews?\s*$/i, "") // Remove review counts
    .replace(/\s*·.*$/, "") // Remove everything after middle dot
    .replace(/\s*\|.*$/, "") // Remove everything after pipe
    .replace(/\s*-\s*.*$/, "") // Remove everything after dash (if it looks like suffix)
    .trim();

  return cleanedName || undefined;
}

/**
 * Parse address components from a query string
 */
function parseAddressFromQuery(query: string): {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
} {
  const parts = query.split(",").map((part) => part.trim());

  if (parts.length === 1) {
    // Single part could be venue name
    return { name: parts[0] };
  }

  if (parts.length >= 2) {
    // Multiple parts likely represent: [venue/address], [city], [country]
    const lastPart = parts[parts.length - 1];
    const secondLastPart =
      parts.length > 2 ? parts[parts.length - 2] : undefined;

    // Detect common country names
    const commonCountries = [
      "Chile",
      "Spain",
      "UK",
      "USA",
      "United States",
      "Argentina",
      "Peru",
      "Bolivia",
    ];
    const isCountry = commonCountries.some((country) =>
      lastPart.toLowerCase().includes(country.toLowerCase())
    );

    if (isCountry) {
      return {
        name: parts.length > 2 ? parts[0] : undefined,
        address: parts.length > 3 ? parts[1] : undefined,
        city: secondLastPart,
        country: lastPart,
      };
    } else {
      // Assume format: [venue/address], [city]
      return {
        name: parts.length > 2 ? parts[0] : undefined,
        address: parts.length > 2 ? parts[1] : parts[0],
        city: parts[parts.length - 1],
      };
    }
  }

  return {};
}

/**
 * Reverse geocode coordinates to get address information using multiple sources
 */
async function reverseGeocode(coordinates: Coordinates): Promise<{
  address?: string;
  city?: string;
  country?: string;
}> {
  // Try Nominatim first (OpenStreetMap)
  const nominatimResult = await tryNominatimGeocoding(coordinates);
  if (nominatimResult.address) {
    return nominatimResult;
  }

  // Try alternative free geocoding service as fallback
  const alternativeResult = await tryAlternativeGeocoding(coordinates);
  return alternativeResult;
}

/**
 * Try Nominatim (OpenStreetMap) reverse geocoding
 */
async function tryNominatimGeocoding(coordinates: Coordinates): Promise<{
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
          "User-Agent": "Piscola.net venue submission",
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    if (data.address) {
      const addr = data.address;

      // Build address string from components with improved logic
      const addressParts = [];

      // Add house number and road (most specific first)
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) {
        addressParts.push(addr.road);
      } else if (addr.pedestrian) {
        addressParts.push(addr.pedestrian);
      } else if (addr.footway) {
        addressParts.push(addr.footway);
      }

      // If no road, try other location indicators
      if (addressParts.length === 0 || addressParts.length === 1) {
        if (addr.amenity) addressParts.push(addr.amenity);
        if (addr.building) addressParts.push(addr.building);
        if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
        if (addr.suburb) addressParts.push(addr.suburb);
        if (addr.commercial) addressParts.push(addr.commercial);
      }

      const address =
        addressParts.join(" ") || data.display_name?.split(",")[0];

      // Determine city with improved priority
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.borough ||
        addr.district ||
        addr.village ||
        addr.hamlet ||
        addr.county ||
        addr.state_district;

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
    return {};
  }
}

/**
 * Try alternative free geocoding service (BigDataCloud)
 */
async function tryAlternativeGeocoding(coordinates: Coordinates): Promise<{
  address?: string;
  city?: string;
  country?: string;
}> {
  try {
    const { lat, lng } = coordinates;
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      {
        headers: {
          "User-Agent": "Piscola.net venue submission",
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    // Build address from components
    const addressParts = [];
    if (data.streetNumber) addressParts.push(data.streetNumber);
    if (data.streetName) addressParts.push(data.streetName);

    const address = addressParts.join(" ") || data.locality;

    return {
      address: address || undefined,
      city: data.city || data.locality || undefined,
      country: data.countryName || undefined,
    };
  } catch {
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

/**
 * Utility functions for parsing Google Maps URLs and extracting coordinates
 */

// ISO country code to standardized country name mapping
const ISO_COUNTRY_MAPPINGS: Record<string, string> = {
  // Common countries
  US: "United States",
  GB: "United Kingdom",
  CL: "Chile",
  AR: "Argentina",
  PE: "Peru",
  BO: "Bolivia",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  MX: "Mexico",
  JP: "Japan",
  CN: "China",
  IN: "India",
  RU: "Russia",
  KR: "South Korea",
  KP: "North Korea",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  PT: "Portugal",
  GR: "Greece",
  TR: "Turkey",
  EG: "Egypt",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  MA: "Morocco",
  TN: "Tunisia",
  SG: "Singapore",
  TH: "Thailand",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  NZ: "New Zealand",
  IE: "Ireland",
  IS: "Iceland",
  IL: "Israel",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  QA: "Qatar",
  KW: "Kuwait",
  OM: "Oman",
  BH: "Bahrain",
  JO: "Jordan",
  LB: "Lebanon",
  SY: "Syria",
  IQ: "Iraq",
  IR: "Iran",
  AF: "Afghanistan",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  NP: "Nepal",
  BT: "Bhutan",
  MM: "Myanmar",
  LA: "Laos",
  KH: "Cambodia",
  TW: "Taiwan",
  HK: "China", // Hong Kong -> China for our purposes
  MO: "China", // Macau -> China for our purposes
};

/**
 * Normalize country using ISO code (preferred) or country name fallback
 */
function normalizeCountryName(
  country?: string,
  countryCode?: string
): string | undefined {
  // Prefer ISO country code if available
  if (countryCode) {
    const normalizedFromCode = ISO_COUNTRY_MAPPINGS[countryCode.toUpperCase()];
    if (normalizedFromCode) return normalizedFromCode;
  }

  // Fallback to country name if no ISO code or code not found
  if (!country) return undefined;

  // Return the country name as-is (it might already match our standardized list)
  return country;
}

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
  requiresManualReview?: boolean; // Indicates coordinates are placeholders and need admin verification
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

    // 3. SMART FALLBACK: If pattern matching worked but gives no house number, try HTML extraction
    if (coordinates) {
      try {
        console.log(
          "[Maps] Checking if pattern matching gives a house number..."
        );

        // Quick reverse geocode to check if we got a house number
        const geocodeResponse = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coordinates.lat,
            lng: coordinates.lng,
          }),
        });

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          const hasHouseNumber = geocodeData?.data?.address?.house_number;

          if (!hasHouseNumber) {
            console.log(
              "[Maps] Pattern matching gave no house number, trying HTML extraction..."
            );
            const htmlCoordinates = await extractCoordinatesFromHTML(url);
            if (htmlCoordinates) {
              coordinates = htmlCoordinates;
              extractionMethod =
                "html_content_extraction(house_number_upgrade)";
              console.log(
                `[Maps] Coordinates extracted using method: ${extractionMethod}`,
                {
                  coordinates,
                  upgradedFrom: "pattern_matching_no_house_number",
                  url: url.substring(0, 100) + "...",
                }
              );
            }
          } else {
            console.log(
              `[Maps] Pattern matching has house number: ${hasHouseNumber}, keeping pattern matching coordinates`
            );
          }
        }
      } catch (error) {
        console.log(
          "[Maps] House number check failed, keeping pattern matching coordinates:",
          error
        );
        // Continue with original coordinates
      }
    }

    // 4. EMERGENCY FALLBACK: Only try HTML extraction if pattern matching completely failed
    if (!coordinates) {
      try {
        const htmlCoordinates = await extractCoordinatesFromHTML(url);
        if (htmlCoordinates) {
          coordinates = htmlCoordinates;
          extractionMethod = "html_content_extraction(emergency_fallback)";
          console.log(
            `[Maps] Coordinates extracted using method: ${extractionMethod}`,
            {
              coordinates,
              precision:
                htmlCoordinates.lat.toString().split(".")[1]?.length || 0,
              url: url.substring(0, 100) + "...",
            }
          );
        }
      } catch (error) {
        console.log("[Maps] HTML coordinate extraction failed:", error);
        // Continue to other fallback methods
      }
    }

    // 5. LOWEST PRIORITY: Fallback to general @ coordinate extraction
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
      // For URLs that contain venue info but no coordinates (like mobile app links),
      // provide placeholder coordinates and let the user know they'll need manual review
      const urlVenueInfo = extractVenueInfoFromUrl(url);

      if (urlVenueInfo.name || urlVenueInfo.address || urlVenueInfo.city) {
        // We found venue information but no coordinates
        // Use placeholder coordinates (center of London as a neutral default)
        const placeholderCoordinates = { lat: 51.5074, lng: -0.1278 };

        return {
          success: true,
          coordinates: placeholderCoordinates,
          venueInfo: {
            ...urlVenueInfo,
            // Add a note that coordinates need manual verification
            address: urlVenueInfo.address
              ? `${urlVenueInfo.address} (coordinates need verification)`
              : undefined,
          },
          requiresManualReview: true,
        };
      }

      return {
        success: false,
        error:
          "Could not extract coordinates or venue information from this Google Maps URL",
      };
    }

    // First try to extract venue info directly from the URL
    const urlVenueInfo = extractVenueInfoFromUrl(url);

    // Then get additional address information using reverse geocoding
    const geocodedInfo = await reverseGeocode(coordinates);

    // Combine URL info with geocoded info, preferring GEOCODED address over URL address
    // URL extraction can be unreliable for addresses, geocoding is more accurate
    const finalVenueInfo = {
      name: cleanVenueName(venueName || urlVenueInfo.name),
      address: geocodedInfo.address || urlVenueInfo.address, // Prefer geocoded address
      city: urlVenueInfo.city || geocodedInfo.city,
      country: normalizeCountryName(
        urlVenueInfo.country || geocodedInfo.country,
        geocodedInfo.countryCode
      ),
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
      const rawPlaceName = decodeURIComponent(placeMatch[1])
        .replace(/\+/g, " ")
        .replace(/%20/g, " ")
        .trim();

      // Check if the place name contains full address info (like Android URLs)
      if (rawPlaceName.includes(",")) {
        const addressInfo = parseAddressFromQuery(rawPlaceName);
        return {
          name: cleanVenueName(addressInfo.name),
          address: addressInfo.address,
          city: addressInfo.city,
          country: addressInfo.country,
        };
      }

      venueName = rawPlaceName;
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
 * Extract coordinates from HTML content using server-side parsing
 */
async function extractCoordinatesFromHTML(
  url: string
): Promise<Coordinates | null> {
  try {
    const response = await fetch("/api/maps/parse-coordinates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (result.success && result.coordinates) {
      const { lat, lng } = result.coordinates;
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    return null;
  } catch (error) {
    console.log("[Maps] Error calling HTML coordinate extraction API:", error);
    return null;
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
  countryCode?: string;
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
 * Try Nominatim (OpenStreetMap) reverse geocoding via our API proxy
 */
async function tryNominatimGeocoding(coordinates: Coordinates): Promise<{
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
}> {
  try {
    const { lat, lng } = coordinates;

    // Use our API endpoint to avoid CORS issues
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng }),
    });

    if (!response.ok) {
      return {};
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return {};
    }

    const data = result.data;

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

      // Only add building/amenity if we have NO street-level address
      if (addressParts.length === 0) {
        if (addr.amenity) addressParts.push(addr.amenity);
        if (addr.building) addressParts.push(addr.building);
      }

      // Create final address - prefer our built address, fallback to first part of display_name
      let address;
      if (addressParts.length > 0) {
        // Join with comma for clarity: "3, Spring Street" instead of "3 Spring Street"
        address = addressParts.join(", ");
      } else {
        // Fallback to first part of display_name, but avoid administrative areas
        const displayParts = data.display_name?.split(",") || [];
        address = displayParts[0]?.trim();

        // Skip if the first part looks like an administrative area
        if (
          address &&
          (address.includes("City of") ||
            address.includes("Borough of") ||
            address.includes("District") ||
            address.includes("County"))
        ) {
          address = displayParts[1]?.trim() || address;
        }
      }

      // Determine city with improved priority (avoid administrative districts)
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.hamlet ||
        // Only use borough/district if no proper city found and not overly administrative
        (addr.borough && !addr.borough.includes("City of")
          ? addr.borough
          : undefined) ||
        (addr.district && !addr.district.includes("City of")
          ? addr.district
          : undefined) ||
        addr.county;

      // Determine country and country code
      const country = addr.country;
      const countryCode = addr.country_code; // ISO code from Nominatim

      return {
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        countryCode: countryCode?.toUpperCase() || undefined,
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
  countryCode?: string;
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

    // Build address from components - only use street-level data
    const addressParts = [];
    if (data.streetNumber) addressParts.push(data.streetNumber);
    if (data.streetName) addressParts.push(data.streetName);

    // Only return an address if we have actual street-level data
    // Don't fall back to administrative areas like "City of Westminster"
    const address =
      addressParts.length > 0 ? addressParts.join(" ") : undefined;

    return {
      address: address || undefined,
      city: data.city || data.locality || undefined,
      country: data.countryName || undefined,
      countryCode: data.countryCode?.toUpperCase() || undefined,
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Geocoding API endpoint - proxies Nominatim to avoid CORS issues and includes venue search
 * GET: Forward geocoding (search locations AND venues by text)
 * POST: Reverse geocoding (get location from coordinates)
 */

/**
 * Forward geocoding - search venues in database AND locations by query text
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required (minimum 2 characters)" },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    const results: any[] = [];

    // 1. Search for venues in the database first (higher priority)
    try {
      const supabase = createClient();

      const { data: venues, error: venueError } = await supabase
        .from("venues")
        .select("id, name, address, city, country, type, latitude, longitude")
        .eq("status", "approved")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .or(
          `name.ilike.%${trimmedQuery}%, address.ilike.%${trimmedQuery}%, city.ilike.%${trimmedQuery}%`
        )
        .limit(3); // Limit venue results to avoid overwhelming

      if (!venueError && venues && venues.length > 0) {
        const venueResults = venues.map((venue) => ({
          place_id: `venue_${venue.id}`,
          display_name: `${venue.name}, ${venue.address || venue.city}, ${venue.country}`,
          lat: venue.latitude.toString(),
          lon: venue.longitude.toString(),
          type: "venue",
          class: "venue",
          venue_id: venue.id,
          venue_type: venue.type,
        }));

        results.push(...venueResults);
      }
    } catch (venueError) {
      console.warn("Venue search error:", venueError);
      // Continue with location search even if venue search fails
    }

    // 2. Search for locations using Nominatim (if we need more results)
    const remainingLimit = Math.max(1, limit - results.length);
    if (remainingLimit > 0) {
      try {
        // Fetch more results than needed so we can sort by importance
        const fetchLimit = Math.max(15, remainingLimit * 3);

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmedQuery
        )}&limit=${fetchLimit}&addressdetails=1&extratags=1&accept-language=en`;

        const response = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "Piscola.net location search",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Sort results by importance (higher importance = more significant places)
          const sortedData = data.sort((a: any, b: any) => {
            const importanceA = parseFloat(a.importance || "0");
            const importanceB = parseFloat(b.importance || "0");

            // Add bonus for national capitals
            const bonusA = a.extratags?.capital === "yes" ? 0.1 : 0;
            const bonusB = b.extratags?.capital === "yes" ? 0.1 : 0;

            return importanceB + bonusB - (importanceA + bonusA);
          });

          const limitedLocationData = sortedData.slice(0, remainingLimit);
          const locationResults = limitedLocationData.map((item: any) => ({
            place_id: item.place_id,
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            type: "location",
            class: item.class,
          }));

          results.push(...locationResults);
        }
      } catch (locationError) {
        console.warn("Location search error:", locationError);
        // If location search fails, we'll just return venue results (if any)
      }
    }

    // Return combined results (venues first, then locations)
    return NextResponse.json(results.slice(0, limit));
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Reverse geocoding - get location from coordinates
 */
export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Call Nominatim API from server (no CORS issues)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=en`,
      {
        headers: {
          "User-Agent": "Piscola.net venue submission",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 503 }
      );
    }

    const data = await response.json();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

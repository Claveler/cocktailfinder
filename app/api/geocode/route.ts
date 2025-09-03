import { NextRequest, NextResponse } from "next/server";

/**
 * Geocoding API endpoint - proxies Nominatim to avoid CORS issues
 * GET: Forward geocoding (search locations by text)
 * POST: Reverse geocoding (get location from coordinates)
 */

/**
 * Forward geocoding - search locations by query text
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    // Fetch more results than needed so we can sort by importance
    const fetchLimit = Math.max(15, limit * 3);

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required (minimum 2 characters)" },
        { status: 400 }
      );
    }

    // Call Nominatim search API from server (no CORS issues)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&limit=${fetchLimit}&addressdetails=1&extratags=1&accept-language=en`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Piscola.net location search",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Search service unavailable" },
        { status: 503 }
      );
    }

    const data = await response.json();

    // Sort results by importance (higher importance = more significant places)
    // This prioritizes major cities like Athens, Greece over smaller towns
    const sortedData = data.sort((a: any, b: any) => {
      const importanceA = parseFloat(a.importance || "0");
      const importanceB = parseFloat(b.importance || "0");

      // Add bonus for national capitals
      const bonusA = a.extratags?.capital === "yes" ? 0.1 : 0;
      const bonusB = b.extratags?.capital === "yes" ? 0.1 : 0;

      return importanceB + bonusB - (importanceA + bonusA);
    });

    // Return only the requested number of results, transformed to expected format
    const limitedData = sortedData.slice(0, limit);
    const transformedData = limitedData.map((item: any) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      type: "location",
      class: item.class,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Forward geocoding error:", error);
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

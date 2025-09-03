import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface VenueResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: "venue";
  class: "venue";
  venue_id: string;
  venue_type: string;
}

interface LocationResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Search venues in parallel with location search
    const [venueResults, locationResults] = await Promise.all([
      searchVenues(query, Math.ceil(limit / 2)), // Allocate half the results to venues
      searchLocations(query, limit),
    ]);

    // Combine results with venues first (they're more specific to the app)
    const combinedResults = [...venueResults, ...locationResults].slice(
      0,
      limit
    );

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch search results" },
      { status: 500 }
    );
  }
}

async function searchVenues(
  query: string,
  limit: number
): Promise<VenueResult[]> {
  const supabase = createClient();

  try {
    // Search venues by name (case-insensitive, fuzzy search)
    const { data: venues, error } = await supabase
      .from("venues")
      .select("id, name, type, address, city, country, latitude, longitude")
      .eq("status", "approved") // Only include approved venues
      .ilike("name", `%${query}%`) // Case-insensitive partial match
      .limit(limit);

    if (error) {
      console.error("Venue search error:", error);
      return [];
    }

    // Transform venue results to match the expected format
    return (venues || [])
      .filter((venue) => venue.latitude && venue.longitude) // Only venues with coordinates
      .map((venue) => ({
        place_id: `venue_${venue.id}`,
        display_name: `${venue.name}, ${venue.address}, ${venue.city}, ${venue.country}`,
        lat: venue.latitude.toString(),
        lon: venue.longitude.toString(),
        type: "venue",
        class: "venue",
        venue_id: venue.id,
        venue_type: venue.type,
      }));
  } catch (error) {
    console.error("Error searching venues:", error);
    return [];
  }
}

async function searchLocations(
  query: string,
  limit: number
): Promise<LocationResult[]> {
  try {
    // Fetch more results than needed so we can sort by importance
    const fetchLimit = Math.max(15, limit * 3);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${fetchLimit}&addressdetails=1&accept-language=en&extratags=1`,
      {
        method: "GET",
        headers: {
          "User-Agent": "PiscolaApp/1.0 (contact@piscola.net)",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();

    // Sort results by importance (higher importance = more significant places)
    // This prioritizes major cities like Athens, Greece over smaller towns
    const sortedData = data.sort((a: LocationResult, b: LocationResult) => {
      const importanceA = parseFloat((a as any).importance || "0");
      const importanceB = parseFloat((b as any).importance || "0");

      // Add bonus for national capitals
      const bonusA = (a as any).extratags?.capital === "yes" ? 0.1 : 0;
      const bonusB = (b as any).extratags?.capital === "yes" ? 0.1 : 0;

      return importanceB + bonusB - (importanceA + bonusA);
    });

    // Return only the requested number of results
    return sortedData.slice(0, limit);
  } catch (error) {
    console.error("Nominatim search error:", error);
    return [];
  }
}

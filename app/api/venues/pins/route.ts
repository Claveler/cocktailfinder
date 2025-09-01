import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lightweight endpoint for map pins - only returns coordinates and IDs
 * This allows the map to show ALL venues quickly without performance issues
 */
export async function GET() {
  try {
    const supabase = createClient();

    // Fetch only the minimal data needed for map pins
    const { data: venues, error: venuesError } = await supabase
      .from("venues")
      .select(
        `
        id,
        latitude,
        longitude
      `
      )
      .eq("status", "approved")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false });

    if (venuesError) {
      console.error("Error fetching venue pins:", venuesError);
      return NextResponse.json(
        { error: "Failed to fetch venue pins" },
        { status: 500 }
      );
    }

    // Transform to simple pin format
    const pins =
      venues?.map((venue) => ({
        id: venue.id,
        location: {
          lat: venue.latitude,
          lng: venue.longitude,
        },
      })) || [];

    // Cache for 10 minutes since pins don't change often
    return NextResponse.json(
      { pins, count: pins.length },
      {
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=120", // 10 min cache
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error in venues/pins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

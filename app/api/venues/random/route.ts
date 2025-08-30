import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queryVenues } from "@/lib/venues/core";
import type { Venue } from "@/lib/venues";

export async function GET() {
  try {
    // Use the consolidated function to get venues with all stats and featured verifications
    const result = await queryVenues({
      limit: 50, // Get a larger sample to pick randomly from
      includeVerificationStats: true,
      includeFeaturedVerifications: true,
    });

    if (result.error) {
      console.error("🚨 Error fetching venues:", result.error);
      return NextResponse.json(
        { error: "Failed to fetch venues" },
        { status: 500 }
      );
    }

    const venues = result.data?.venues || [];

    if (venues.length === 0) {
      return NextResponse.json(
        { error: "No venues available" },
        { status: 404 }
      );
    }

    // Pick a random venue from the results
    const randomIndex = Math.floor(Math.random() * venues.length);
    const randomVenue = venues[randomIndex];

    return NextResponse.json(randomVenue);
  } catch (error) {
    console.error("Error in random venue API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

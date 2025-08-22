import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Venue } from "@/lib/venues";

export async function GET() {
  try {
    const supabase = createClient();

    // Get a random approved venue
    const { data: venues, error } = await supabase
      .from("venues")
      .select("*, latitude, longitude")
      .eq("status", "approved")
      .limit(50); // Get a larger sample to pick randomly from

    if (error) {
      console.error("🚨 Error fetching venues:", error);
      return NextResponse.json(
        { error: "Failed to fetch venues" },
        { status: 500 }
      );
    }

    if (!venues || venues.length === 0) {
      return NextResponse.json(
        { error: "No venues available" },
        { status: 404 }
      );
    }

    // Pick a random venue from the results
    const randomIndex = Math.floor(Math.random() * venues.length);
    const randomVenue = venues[randomIndex];

    // Transform the data to match our interface
    const transformedVenue: Venue = {
      ...randomVenue,
      location: randomVenue.latitude && randomVenue.longitude 
        ? { lat: randomVenue.latitude, lng: randomVenue.longitude }
        : null,
    };

    return NextResponse.json(transformedVenue);
  } catch (error) {
    console.error("Error in random venue API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

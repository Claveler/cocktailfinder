import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Venue } from "@/lib/venues";

// Helper function to fetch verification stats for venues
async function fetchVerificationStats(venueIds: string[]) {
  if (venueIds.length === 0) return {};

  const supabase = createClient();
  
  const { data: stats, error } = await supabase
    .from('venue_verification_stats')
    .select('venue_id, total_verifications, positive_verifications, unique_verifiers')
    .in('venue_id', venueIds);

  if (error) {
    console.error('Error fetching verification stats:', error);
    return {};
  }

  return stats.reduce((acc, stat) => {
    acc[stat.venue_id] = stat;
    return acc;
  }, {} as Record<string, any>);
}

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

    // Fetch verification stats for this venue
    const verificationStats = await fetchVerificationStats([randomVenue.id]);
    const stats = verificationStats[randomVenue.id] || {
      total_verifications: 0,
      positive_verifications: 0,
      unique_verifiers: 0
    };

    // Transform the data to match our interface
    const transformedVenue: Venue = {
      ...randomVenue,
      location:
        randomVenue.latitude && randomVenue.longitude
          ? { lat: randomVenue.latitude, lng: randomVenue.longitude }
          : null,
      // Add verification statistics
      total_verifications: stats.total_verifications,
      positive_verifications: stats.positive_verifications,
      unique_verifiers: stats.unique_verifiers,
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

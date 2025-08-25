import { createClient } from "@/lib/supabase/server";
import type { Venue as VenueType } from "@/lib/venues";
import LandingPageClient from "./LandingPageClient";

// Configuration for location-based venue filtering
const VENUE_SEARCH_RADIUS_KM = Number(process.env.NEXT_PUBLIC_VENUE_SEARCH_RADIUS_KM) || 10; // Default radius in kilometers
const VENUE_POOL_SIZE = 100; // Fetch more venues for better location filtering

// Function to fetch venues for location-aware homepage
async function getVenuesForLocationFiltering(): Promise<VenueType[]> {
  try {
    const supabase = createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*, latitude, longitude")
      .eq("status", "approved")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(VENUE_POOL_SIZE); // Fetch more venues for location filtering

    if (error) {
      console.error("Error fetching venues:", error);
      return [];
    }

    if (!venues || venues.length === 0) {
      return [];
    }

    // Transform to match our interface
    return venues.map((venue: any) => ({
      ...venue,
      location:
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null,
    }));
  } catch (error) {
    console.error("Unexpected error fetching venues:", error);
    return [];
  }
}

export default async function Home() {
  // Fetch venues for interactive filtering
  const availableVenues = await getVenuesForLocationFiltering();

  return (
    <LandingPageClient 
      allVenues={availableVenues}
      maxDistanceKm={VENUE_SEARCH_RADIUS_KM}
    />
  );
}

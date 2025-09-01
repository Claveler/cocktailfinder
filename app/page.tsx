import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import type { Venue as VenueType } from "@/lib/venues";
import { getVenuesForMap } from "@/lib/venues/core";
import LandingPageClient from "./LandingPageClient";

// Configuration for location-based venue filtering
const VENUE_SEARCH_RADIUS_KM =
  Number(process.env.NEXT_PUBLIC_VENUE_SEARCH_RADIUS_KM) || 10; // Default radius in kilometers
const VENUE_POOL_SIZE = 20; // Reduced for faster initial load - dynamic loading will fetch more as needed

// Function to fetch venues for location-aware homepage
async function getVenuesForLocationFiltering(): Promise<VenueType[]> {
  // Use the new consolidated function
  return await getVenuesForMap(VENUE_POOL_SIZE);
}

export default async function Home() {
  // Fetch venues for interactive filtering
  const availableVenues = await getVenuesForLocationFiltering();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <LandingPageClient
        allVenues={availableVenues}
        maxDistanceKm={VENUE_SEARCH_RADIUS_KM}
      />
    </Suspense>
  );
}

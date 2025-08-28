import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import type { Venue as VenueType } from "@/lib/venues";
import LandingPageClient from "./LandingPageClient";

// Helper function to fetch verification stats for venues - copied from lib/venues.ts
async function fetchVerificationStats(venueIds: string[]) {
  if (venueIds.length === 0) return {};
  
  const supabase = createClient();
  
  try {
    const { data: verifications } = await supabase
      .from("pisco_verifications")
      .select("venue_id, pisco_status, user_id")
      .in("venue_id", venueIds);

    if (!verifications) return {};

    // Calculate stats for each venue
    const stats: Record<string, { positive_verifications: number; total_verifications: number; unique_verifiers: number }> = {};
    
    verifications.forEach(verification => {
      if (!stats[verification.venue_id]) {
        stats[verification.venue_id] = {
          positive_verifications: 0,
          total_verifications: 0,
          unique_verifiers: 0
        };
      }
      
      stats[verification.venue_id].total_verifications++;
      if (verification.pisco_status === 'available') {
        stats[verification.venue_id].positive_verifications++;
      }
    });

    // Count unique verifiers
    Object.keys(stats).forEach(venueId => {
      const uniqueUsers = new Set(
        verifications
          .filter(v => v.venue_id === venueId)
          .map(v => v.user_id)
      );
      stats[venueId].unique_verifiers = uniqueUsers.size;
    });

    return stats;
  } catch (error) {
    console.warn("Error fetching verification stats:", error);
    return {};
  }
}

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

    // Fetch verification stats for all venues
    const verificationStats = await fetchVerificationStats(venues.map(v => v.id));

    // Transform to match our interface with verification stats
    return venues.map((venue: any) => {
      const stats = verificationStats[venue.id] || {
        positive_verifications: 0,
        total_verifications: 0,
        unique_verifiers: 0
      };

      return {
        ...venue,
        location:
          venue.latitude && venue.longitude
            ? { lat: venue.latitude, lng: venue.longitude }
            : null,
        ...stats
      };
    });
  } catch (error) {
    console.error("Unexpected error fetching venues:", error);
    return [];
  }
}

export default async function Home() {
  // Fetch venues for interactive filtering
  const availableVenues = await getVenuesForLocationFiltering();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandingPageClient 
        allVenues={availableVenues}
        maxDistanceKm={VENUE_SEARCH_RADIUS_KM}
      />
    </Suspense>
  );
}

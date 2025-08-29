import { Suspense } from "react";
import {
  listVenues,
  getCities,
  getBrands,
  type VenueFilters,
} from "@/lib/venues";
import { createClient } from "@/lib/supabase/server";
import VenueCard from "@/components/venues/VenueCard";
import FloatingSearchBar from "@/components/venues/FloatingSearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Map as MapIcon,
  List,
} from "lucide-react";
import Link from "next/link";
import VenuesWrapper from "./VenuesWrapper";

function getServerFallbackCenter(): [number, number] {
  return [51.5261617, -0.1633234]; // London Business School as fallback (LBS easter egg! 🎓)
}

interface VenuesPageProps {
  searchParams: {
    q?: string;
    city?: string;
    brand?: string;
    type?: "bar" | "pub" | "liquor_store" | "all";
    view?: "list" | "map";
  };
}

// Loading component for the venue list
function VenueListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse overflow-hidden">
          <div className="aspect-video w-full bg-gray-200"></div>
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



// Get all venues for map display (same as landing page)
async function getVenuesForLocationFiltering() {
  const VENUE_POOL_SIZE = 1000; // Maximum venues to load for location filtering

  // Helper to fetch verification stats
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

  try {
    const supabase = createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*, latitude, longitude, featured_verification_id")
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

    // Fetch featured verifications for venues that have them
    const venuesWithFeatured = venues.filter((venue: any) => venue.featured_verification_id);
    const featuredVerificationIds = venuesWithFeatured.map((venue: any) => venue.featured_verification_id);
    
    let featuredVerifications: { [key: string]: any } = {};
    if (featuredVerificationIds.length > 0) {
      const { data: featured, error: featuredError } = await supabase
        .from("pisco_verifications")
        .select("*")
        .in("id", featuredVerificationIds);
      
      if (!featuredError && featured) {
        featuredVerifications = featured.reduce((acc: any, verification: any) => {
          acc[verification.id] = verification;
          return acc;
        }, {});
      }
    }

    // Transform to match our interface with verification stats and featured verifications
    return venues.map((venue: any) => {
      const stats = verificationStats[venue.id] || {
        positive_verifications: 0,
        total_verifications: 0,
        unique_verifiers: 0
      };

      const featuredVerification = venue.featured_verification_id 
        ? featuredVerifications[venue.featured_verification_id] || null
        : null;

      return {
        ...venue,
        location:
          venue.latitude && venue.longitude
            ? { lat: venue.latitude, lng: venue.longitude }
            : null,
        ...stats,
        featured_verification: featuredVerification
      };
    });
  } catch (error) {
    console.error("Unexpected error fetching venues:", error);
    return [];
  }
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  // Parse search parameters (no pagination - always show first 20 venues)
  const filters: VenueFilters = {
    q: searchParams.q,
    city: searchParams.city === "all" ? undefined : searchParams.city,
    brand: searchParams.brand === "all" ? undefined : searchParams.brand,
    type: !searchParams.type || searchParams.type === "all" ? undefined : (searchParams.type as "bar" | "pub" | "liquor_store"),
    page: 1, // Always fetch first page (max 20 venues)
  };

  // Fetch data
  const [venuesResult, citiesResult, brandsResult, allVenuesForMap] = await Promise.all([
    listVenues(filters),
    getCities(),
    getBrands(),
    getVenuesForLocationFiltering(), // Get ALL venues for map
  ]);

  // Handle errors
  if (venuesResult.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">
            Failed to load venues: {venuesResult.error.message}
          </p>
        </div>
      </div>
    );
  }

  const venueData = venuesResult.data!;
  const cities = citiesResult.data || [];
  const brands = brandsResult.data || [];

  // Create URLSearchParams (no pagination needed)
  const urlParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      urlParams.set(key, value);
    }
  });

  // Current view - for mobile toggle
  const isMobileMapView = searchParams.view === "map";

  // Toggle view URLs for mobile
  const mapViewUrl = new URLSearchParams(urlParams);
  mapViewUrl.set("view", "map");

  const listViewUrl = new URLSearchParams(urlParams);
  listViewUrl.delete("view");

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Map/List Toggle */}
      <div className="lg:hidden bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            <Button asChild variant="outline">
              <Link
                href={
                  isMobileMapView
                    ? `/venues?${listViewUrl.toString()}`
                    : `/venues?${mapViewUrl.toString()}`
                }
              >
                {isMobileMapView ? (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    List View
                  </>
                ) : (
                  <>
                    <MapIcon className="mr-2 h-4 w-4" />
                    Map View
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-32 lg:pb-8">
        {/* Mobile: Show either list or map */}
        <div className="lg:hidden mb-6">
          {isMobileMapView ? (
            /* Mobile Map View */
            <div className="space-y-6">
              {venueData.venues.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No venues found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/">View all venues</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card 
                  style={{ 
                    height: 'calc(100vh - 12rem)' // Fill available space: viewport minus header, toggle bar, and padding
                  }}
                >
                  <CardContent className="p-0 h-full">
                    {/* Enhanced Interactive Map for Mobile */}
                    <VenuesWrapper
                      venueData={venueData}
                      allVenuesForMap={allVenuesForMap}
                      cities={cities}
                      brands={brands}
                      filters={filters}
                      initialCenter={getServerFallbackCenter()}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Mobile List View */
            <Suspense fallback={<VenueListSkeleton />}>
              {venueData.venues.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No venues found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/">View all venues</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {venueData.venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              )}
            </Suspense>
          )}
        </div>

        {/* Desktop and Mobile: Enhanced Interactive Map */}
        <VenuesWrapper
          venueData={venueData}
          allVenuesForMap={allVenuesForMap} // ALL venues for map pins
          cities={cities}
          brands={brands}
          filters={filters}
          initialCenter={getServerFallbackCenter()}
        />
      </div>
    </div>
  );
}
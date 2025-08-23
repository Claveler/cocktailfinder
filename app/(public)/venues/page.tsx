import { Suspense } from "react";
import {
  listVenues,
  getCities,
  getBrands,
  type VenueFilters,
} from "@/lib/venues";
import VenueCard from "@/components/venues/VenueCard";
import FloatingSearchBar from "@/components/venues/FloatingSearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import Link from "next/link";
import Map from "@/components/maps/Map";
import VenuesClient from "./VenuesClient";

// Helper function to calculate map center based on venue locations
function calculateMapCenter(venues: any[]): [number, number] {
  const venuesWithLocation = venues.filter((venue) => venue.location);

  if (venuesWithLocation.length === 0) {
    // Default to London if no venues have coordinates
    return [51.5074, -0.1278];
  }

  const avgLat =
    venuesWithLocation.reduce((sum, venue) => sum + venue.location.lat, 0) /
    venuesWithLocation.length;
  const avgLng =
    venuesWithLocation.reduce((sum, venue) => sum + venue.location.lng, 0) /
    venuesWithLocation.length;

  return [avgLat, avgLng];
}

interface VenuesPageProps {
  searchParams: {
    q?: string;
    city?: string;
    brand?: string;
    type?: "bar" | "pub" | "liquor_store" | "all";
    page?: string;
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

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  searchParams: URLSearchParams;
}) {
  const getPaginationUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/venues?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        {hasPrevPage && (
          <Button asChild variant="outline" size="sm">
            <Link href={getPaginationUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          </Button>
        )}
        {hasNextPage && (
          <Button asChild variant="outline" size="sm">
            <Link href={getPaginationUrl(currentPage + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  // Parse search parameters
  const filters: VenueFilters = {
    q: searchParams.q,
    city: searchParams.city === "all" ? undefined : searchParams.city,
    brand: searchParams.brand === "all" ? undefined : searchParams.brand,
    type: !searchParams.type || searchParams.type === "all" ? undefined : (searchParams.type as "bar" | "pub" | "liquor_store"),
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  };

  // Fetch data
  const [venuesResult, citiesResult, brandsResult] = await Promise.all([
    listVenues(filters),
    getCities(),
    getBrands(),
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

  // Create URLSearchParams for pagination
  const urlParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "page") {
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
                      <Link href="/venues">View all venues</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Map
                      venues={venueData.venues
                        .filter((venue) => venue.location)
                        .map((venue) => ({
                          id: venue.id,
                          name: venue.name,
                          location: venue.location!,
                          status: venue.status as "approved",
                        }))}
                      height="70vh"
                      center={calculateMapCenter(venueData.venues)}
                      zoom={11}
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
                      <Link href="/venues">View all venues</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {venueData.venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}

                  {/* Mobile Pagination */}
                  {venueData.totalPages > 1 && (
                    <Pagination
                      currentPage={venueData.currentPage}
                      totalPages={venueData.totalPages}
                      hasNextPage={venueData.hasNextPage}
                      hasPrevPage={venueData.hasPrevPage}
                      searchParams={urlParams}
                    />
                  )}
                </div>
              )}
            </Suspense>
          )}
        </div>

        {/* Desktop: Side-by-side Layout */}
        <div className="hidden lg:block">
          {/* Sticky Search Bar */}
          <div className="sticky top-20 z-50 p-4">
            <FloatingSearchBar
              defaultValues={filters}
              cities={cities}
              brands={brands}
              resultCount={venueData.totalCount}
            />
          </div>

          {/* Content starts close to search bar */}
          <div style={{ paddingTop: 'calc(2rem)' }}>
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
                      <Link href="/venues">View all venues</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Interactive Venues and Map */}
                  <VenuesClient 
                    venues={venueData.venues}
                    initialCenter={calculateMapCenter(venueData.venues)}
                    pagination={venueData.totalPages > 1 ? (
                      <Pagination
                        currentPage={venueData.currentPage}
                        totalPages={venueData.totalPages}
                        hasNextPage={venueData.hasNextPage}
                        hasPrevPage={venueData.hasPrevPage}
                        searchParams={urlParams}
                      />
                    ) : undefined}
                  />
                </>
              )}
            </Suspense>
          </div>
        </div>

        {/* Mobile Floating Search Bar */}
        <div className="lg:hidden">
          <FloatingSearchBar
            defaultValues={filters}
            cities={cities}
            brands={brands}
            resultCount={venueData.totalCount}
          />
        </div>
      </div>
    </div>
  );
}
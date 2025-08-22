import { Suspense } from "react";
import {
  listVenues,
  getCities,
  getBrands,
  type VenueFilters,
} from "@/lib/venues";
import VenueCard from "@/components/venues/VenueCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Filter,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import Link from "next/link";
import Map from "@/components/maps/Map";
import type { Venue as MapVenue } from "@/components/maps/Map";

// Helper function to calculate map center based on venue locations
function calculateMapCenter(venues: any[]): [number, number] {
  const venuesWithLocation = venues.filter(venue => venue.location);
  
  if (venuesWithLocation.length === 0) {
    // Default to London if no venues have coordinates
    return [51.5074, -0.1278];
  }
  
  const avgLat = venuesWithLocation.reduce((sum, venue) => sum + venue.location.lat, 0) / venuesWithLocation.length;
  const avgLng = venuesWithLocation.reduce((sum, venue) => sum + venue.location.lng, 0) / venuesWithLocation.length;
  
  return [avgLat, avgLng];
}

interface VenuesPageProps {
  searchParams: {
    q?: string;
    city?: string;
    brand?: string;
    type?: "bar" | "pub" | "liquor_store";
    page?: string;
    view?: "list" | "map";
  };
}

// Loading component for the venue list
function VenueListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
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

// Client component for search form
function SearchForm({
  defaultValues,
  cities,
  brands,
}: {
  defaultValues: VenueFilters;
  cities: string[];
  brands: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search & Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action="/venues" method="get" className="space-y-4">
          {/* Search Query */}
          <div>
            <Label htmlFor="q">Search Venues</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="q"
                name="q"
                placeholder="Enter venue name..."
                defaultValue={defaultValues.q || ""}
                className="pl-10"
              />
            </div>
          </div>

          {/* City Filter */}
          <div>
            <Label htmlFor="city">City</Label>
            <Select name="city" defaultValue={defaultValues.city || "all"}>
              <SelectTrigger>
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <Label htmlFor="type">Venue Type</Label>
            <Select name="type" defaultValue={defaultValues.type || "all"}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="bar">Cocktail Bar</SelectItem>
                <SelectItem value="pub">Pub</SelectItem>
                <SelectItem value="liquor_store">Liquor Store</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Select name="brand" defaultValue={defaultValues.brand || "all"}>
              <SelectTrigger>
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Search Venues
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <div className="flex items-center justify-between">
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
    type: searchParams.type === "all" ? undefined : (searchParams.type as any),
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

  // Current view
  const isMapView = searchParams.view === "map";
  
  // Toggle view URLs
  const mapViewUrl = new URLSearchParams(urlParams);
  mapViewUrl.set("view", "map");
  
  const listViewUrl = new URLSearchParams(urlParams);
  listViewUrl.delete("view");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Piscola Venues</h1>
          <p className="text-muted-foreground">
            Discover the best venues to enjoy Piscola near you
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={isMapView ? `/venues?${listViewUrl.toString()}` : `/venues?${mapViewUrl.toString()}`}>
            {isMapView ? (
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

      {/* Results summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {venueData.totalCount} venues found
            </span>
            {(filters.q || filters.city || filters.brand || filters.type) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {filters.q && (
                  <Badge variant="secondary">Search: {filters.q}</Badge>
                )}
                {filters.city && (
                  <Badge variant="secondary">City: {filters.city}</Badge>
                )}
                {filters.brand && (
                  <Badge variant="secondary">Brand: {filters.brand}</Badge>
                )}
                {filters.type && (
                  <Badge variant="secondary">Type: {filters.type}</Badge>
                )}
                <Button asChild variant="ghost" size="sm">
                  <Link href="/venues">Clear all</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <SearchForm defaultValues={filters} cities={cities} brands={brands} />
        </div>

        {/* Content area - Map or List */}
        <div className="lg:col-span-3">
          {isMapView ? (
            /* Map View */
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
                        .filter(venue => venue.location)
                        .map(venue => ({
                          id: venue.id,
                          name: venue.name,
                          location: venue.location!,
                          status: venue.status as "approved"
                        }))}
                      height="600px"
                      center={calculateMapCenter(venueData.venues)}
                      zoom={11}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* List View */
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
                  <div className="space-y-4 mb-8">
                    {venueData.venues.map((venue) => (
                      <VenueCard key={venue.id} venue={venue} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {venueData.totalPages > 1 && (
                    <Pagination
                      currentPage={venueData.currentPage}
                      totalPages={venueData.totalPages}
                      hasNextPage={venueData.hasNextPage}
                      hasPrevPage={venueData.hasPrevPage}
                      searchParams={urlParams}
                    />
                  )}
                </>
              )}
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

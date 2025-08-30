import { createClient } from "@/lib/supabase/server";
import type { Venue, VenueFilters, PiscoVerification } from "@/lib/venues";

export interface VenueQueryOptions {
  // Filtering
  filters?: VenueFilters;

  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
  };

  // Limits (for map/location filtering)
  limit?: number;

  // Data inclusion options
  includeVerificationStats?: boolean;
  includeFeaturedVerifications?: boolean;

  // Coordinate requirements
  requireCoordinates?: boolean;

  // Status filtering
  status?: "approved" | "pending" | "rejected";

  // Sorting
  orderBy?: {
    field: string;
    ascending?: boolean;
  };
}

export interface VenueQueryResult {
  venues: Venue[];
  totalCount?: number;
  totalPages?: number;
}

/**
 * Consolidated function to fetch verification stats for venues
 * Replaces all the duplicated fetchVerificationStats functions
 */
export async function fetchVerificationStats(venueIds: string[]): Promise<
  Record<
    string,
    {
      positive_verifications: number;
      total_verifications: number;
      unique_verifiers: number;
    }
  >
> {
  if (venueIds.length === 0) return {};

  const supabase = createClient();

  try {
    const { data: verifications } = await supabase
      .from("pisco_verifications")
      .select("venue_id, pisco_status, user_id")
      .in("venue_id", venueIds);

    if (!verifications) return {};

    // Calculate stats for each venue
    const stats: Record<
      string,
      {
        positive_verifications: number;
        total_verifications: number;
        unique_verifiers: number;
      }
    > = {};

    verifications.forEach((verification) => {
      if (!stats[verification.venue_id]) {
        stats[verification.venue_id] = {
          positive_verifications: 0,
          total_verifications: 0,
          unique_verifiers: 0,
        };
      }

      stats[verification.venue_id].total_verifications++;
      if (verification.pisco_status === "available") {
        stats[verification.venue_id].positive_verifications++;
      }
    });

    // Count unique verifiers
    Object.keys(stats).forEach((venueId) => {
      const uniqueUsers = new Set(
        verifications
          .filter((v) => v.venue_id === venueId)
          .map((v) => v.user_id)
      );
      stats[venueId].unique_verifiers = uniqueUsers.size;
    });

    return stats;
  } catch (error) {
    console.warn("Error fetching verification stats:", error);
    return {};
  }
}

/**
 * Consolidated function to fetch featured verifications for venues
 * Replaces all the duplicated featured verification fetching logic
 */
async function fetchFeaturedVerifications(
  featuredVerificationIds: string[]
): Promise<Record<string, PiscoVerification>> {
  if (featuredVerificationIds.length === 0) return {};

  const supabase = createClient();

  try {
    const { data: featured, error: featuredError } = await supabase
      .from("pisco_verifications")
      .select("*")
      .in("id", featuredVerificationIds);

    if (featuredError || !featured) {
      console.warn("Error fetching featured verifications:", featuredError);
      return {};
    }

    return featured.reduce(
      (acc: Record<string, PiscoVerification>, verification: any) => {
        acc[verification.id] = verification;
        return acc;
      },
      {}
    );
  } catch (error) {
    console.warn("Error fetching featured verifications:", error);
    return {};
  }
}

/**
 * Main consolidated venue fetching function
 * Replaces all duplicated venue fetching logic across the app
 */
export async function queryVenues(
  options: VenueQueryOptions = {}
): Promise<{ data: VenueQueryResult | null; error: Error | null }> {
  try {
    const supabase = createClient();

    const {
      filters = {},
      pagination,
      limit,
      includeVerificationStats = true,
      includeFeaturedVerifications = true,
      requireCoordinates = false,
      status = "approved",
      orderBy = { field: "created_at", ascending: false },
    } = options;

    // Build base query
    let query = supabase
      .from("venues")
      .select(
        "*, latitude, longitude, google_maps_url, featured_verification_id",
        {
          count: pagination ? "exact" : undefined,
        }
      )
      .eq("status", status);

    // Apply coordinate requirements
    if (requireCoordinates) {
      query = query.not("latitude", "is", null).not("longitude", "is", null);
    }

    // Apply filters
    if (filters.q) {
      query = query.ilike("name", `%${filters.q}%`);
    }
    if (filters.city) {
      query = query.ilike("city", `%${filters.city}%`);
    }
    if (filters.brand) {
      query = query.contains("brands", [filters.brand]);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    // Apply ordering
    query = query.order(orderBy.field, { ascending: orderBy.ascending });

    // Apply pagination or limit
    if (pagination) {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);
    } else if (limit) {
      query = query.limit(limit);
    }

    // Execute query
    const { data: venues, error, count } = await query;

    if (error) {
      console.error("Error fetching venues:", error);
      return { data: null, error: new Error(error.message) };
    }

    if (!venues || venues.length === 0) {
      return {
        data: {
          venues: [],
          totalCount: count || 0,
          totalPages: pagination
            ? Math.ceil((count || 0) / pagination.pageSize)
            : undefined,
        },
        error: null,
      };
    }

    // Fetch additional data if requested
    let verificationStats: Record<string, any> = {};
    let featuredVerifications: Record<string, PiscoVerification> = {};

    const venueIds = venues.map((v) => v.id);

    // Fetch verification stats
    if (includeVerificationStats) {
      verificationStats = await fetchVerificationStats(venueIds);
    }

    // Fetch featured verifications
    if (includeFeaturedVerifications) {
      const featuredIds = venues
        .filter((v) => v.featured_verification_id)
        .map((v) => v.featured_verification_id);

      if (featuredIds.length > 0) {
        featuredVerifications = await fetchFeaturedVerifications(featuredIds);
      }
    }

    // Transform venues
    const transformedVenues: Venue[] = venues.map((venue: any) => {
      const stats = verificationStats[venue.id] || {
        positive_verifications: 0,
        total_verifications: 0,
        unique_verifiers: 0,
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
        featured_verification: featuredVerification,
      };
    });

    const result: VenueQueryResult = {
      venues: transformedVenues,
      totalCount: count || undefined,
      totalPages: pagination
        ? Math.ceil((count || 0) / pagination.pageSize)
        : undefined,
    };

    return { data: result, error: null };
  } catch (error) {
    console.error("Unexpected error querying venues:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Convenience function for landing page / map venue fetching
 * Replaces getVenuesForLocationFiltering() functions
 */
export async function getVenuesForMap(
  poolSize: number = 100
): Promise<Venue[]> {
  const result = await queryVenues({
    limit: poolSize,
    requireCoordinates: true,
    includeVerificationStats: true,
    includeFeaturedVerifications: true,
  });

  return result.data?.venues || [];
}

/**
 * Convenience function for paginated venue listing
 * Replaces listVenues() function
 */
export async function getVenuesList(
  filters: VenueFilters = {},
  page: number = 1,
  pageSize: number = 20
) {
  const result = await queryVenues({
    filters,
    pagination: { page, pageSize },
    includeVerificationStats: true,
    includeFeaturedVerifications: true,
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      venues: result.data!.venues,
      totalCount: result.data!.totalCount!,
      totalPages: result.data!.totalPages!,
      currentPage: page,
      hasNextPage: page < result.data!.totalPages!,
      hasPreviousPage: page > 1,
    },
    error: null,
  };
}

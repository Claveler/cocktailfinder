import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Helper function to fetch verification stats for venues
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



export interface Venue {
  id: string;
  name: string;
  type: "bar" | "pub" | "liquor_store";
  address: string;
  city: string;
  country: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  brands: string[];
  price_range: string | null;
  ambiance: string[];
  photos: string[];
  status: "pending" | "approved" | "rejected";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  google_maps_url: string | null;
  // Pisco-specific fields
  pisco_status: "available" | "unavailable" | "unverified" | "temporarily_out";
  last_verified: string | null;
  verified_by: string | null;
  pisco_notes: string | null;
  featured_verification_id?: string | null;
  // Verification stats from community
  positive_verifications?: number;
  total_verifications?: number;
  unique_verifiers?: number;
  // Featured verification for display
  featured_verification?: PiscoVerification | null;
}

export interface VenueFilters {
  q?: string; // Search query for name
  city?: string; // City filter
  brand?: string; // Brand filter
  type?: "bar" | "pub" | "liquor_store"; // Venue type
  page?: number; // Page number for pagination
}

export interface VenueListResult {
  venues: Venue[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Comment {
  id: string;
  venue_id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

export interface PiscoVerification {
  id: string;
  venue_id: string;
  user_id: string;
  verified_by: string;
  pisco_status: string;
  pisco_notes: string | null;
  created_at: string;
}

export interface VenueWithComments extends Venue {
  comments: Comment[];
  averageRating: number | null;
  totalComments: number;
  verifications: PiscoVerification[];
  featured_verification?: PiscoVerification | null;
  profile?: {
    full_name: string | null;
  } | null;
}

const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_VENUES_LIMIT) || 20;

export async function listVenues(
  filters: VenueFilters = {}
): Promise<{ data: VenueListResult | null; error: Error | null }> {
  try {
    const supabase = createClient();
    const { q, city, brand, type, page = 1 } = filters;

    // Use database view that handles coordinate extraction
    logger.debug("Starting venue query", { q, city, brand, type, page });

    let query = supabase
      .from("venues")
      .select("*, latitude, longitude, google_maps_url, featured_verification_id", { count: "exact" })
      .eq("status", "approved");

    // Apply filters
    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    if (brand) {
      query = query.contains("brands", [brand]);
    }

    if (type) {
      query = query.eq("type", type);
    }

    // Apply pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Execute query with pagination
    const {
      data: venues,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) {
      logger.error("Supabase query error", { error, filters: { q, city, brand, type, page } });
      return { data: null, error: new Error(error.message) };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    logger.debug("Query completed", { venueCount: venues?.length, totalCount });

    // Fetch verification stats for all venues
    const venueIds = (venues || []).map((venue: any) => venue.id);
    const verificationStats = await fetchVerificationStats(venueIds);

    // Fetch featured verifications for venues that have them
    const venuesWithFeatured = (venues || []).filter((venue: any) => venue.featured_verification_id);
    const featuredVerificationIds = venuesWithFeatured.map((venue: any) => venue.featured_verification_id);
    
    let featuredVerifications: { [key: string]: PiscoVerification } = {};
    if (featuredVerificationIds.length > 0) {
      const { data: featured, error: featuredError } = await supabase
        .from("pisco_verifications")
        .select("*")
        .in("id", featuredVerificationIds);
      
      if (featured) {
        featuredVerifications = featured.reduce((acc: any, verification: any) => {
          acc[verification.id] = verification;
          return acc;
        }, {});
      }
    }

    // Transform the data to match our interface (now with direct coordinate columns!)
    const transformedVenues: Venue[] = (venues || []).map((venue: any) => {
      const location =
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null;

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
      location,
      ...stats,
      featured_verification: featuredVerification
    };
    });

    const result: VenueListResult = {
      venues: transformedVenues,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return { data: result, error: null };
  } catch (error) {
    logger.error("Error listing venues", { error });
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Helper function to get unique cities for filter dropdown
export async function getCities(): Promise<{
  data: string[] | null;
  error: Error | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("venues")
      .select("city")
      .eq("status", "approved")
      .not("city", "is", null);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Get unique cities
    const cities = Array.from(
      new Set(data?.map((item) => item.city) || [])
    ).sort();

    return { data: cities, error: null };
  } catch (error) {
    console.error("Error getting cities:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Helper function to get unique brands for filter dropdown
export async function getBrands(): Promise<{
  data: string[] | null;
  error: Error | null;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("venues")
      .select("brands")
      .eq("status", "approved")
      .not("brands", "is", null);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    // Flatten and get unique brands
    const allBrands = data?.flatMap((item) => item.brands || []) || [];
    const uniqueBrands = Array.from(new Set(allBrands)).sort();

    return { data: uniqueBrands, error: null };
  } catch (error) {
    console.error("Error getting brands:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Get venue by ID with access control
export async function getVenueById(
  id: string,
  userId?: string
): Promise<{ data: VenueWithComments | null; error: Error | null }> {
  try {
  
    const supabase = createClient();

    // Fetch venue with profile information
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select(
        `
        *,
        latitude,
        longitude,
        google_maps_url,
        featured_verification_id,
        profile:created_by(full_name)
      `
      )
      .eq("id", id)
      .single();

    if (venueError) {
      console.error("🚨 Error fetching venue:", venueError);
      return { data: null, error: new Error(venueError.message) };
    }

    if (!venue) {
      return { data: null, error: new Error("Venue not found") };
    }

    // Access control: only show approved venues unless user owns it
    const canAccess =
      venue.status === "approved" || (userId && venue.created_by === userId);

    if (!canAccess) {
      return { data: null, error: new Error("Venue not found") };
    }

    // Fetch verification stats for this venue
    const verificationStats = await fetchVerificationStats([venue.id]);
    const stats = verificationStats[venue.id] || {
      positive_verifications: 0,
      total_verifications: 0,
      unique_verifiers: 0
    };

    // Transform venue data
    const transformedVenue: Venue = {
      ...venue,
      location:
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null,
      ...stats
    };

    // Fetch comments for this venue
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        *,
        profile:user_id(full_name)
      `
      )
      .eq("venue_id", id)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("🚨 Error fetching comments:", commentsError);
      // Don't fail the whole request for comments error
    }

    // Fetch pisco verifications for this venue
    const { data: verifications, error: verificationsError } = await supabase
      .from("pisco_verifications")
      .select("*")
      .eq("venue_id", id)
      .order("created_at", { ascending: false });

    if (verificationsError) {
      console.error("🚨 Error fetching pisco verifications:", verificationsError);
      // Don't fail the whole request for verifications error
    }

    // Fetch featured verification if it exists
    let featuredVerification: PiscoVerification | null = null;
    if (venue.featured_verification_id) {
      const { data: featured, error: featuredError } = await supabase
        .from("pisco_verifications")
        .select("*")
        .eq("id", venue.featured_verification_id)
        .single();
      
      if (!featuredError && featured) {
        featuredVerification = featured;
      }
    }

    const transformedComments: Comment[] = (comments || []).map(
      (comment: any) => ({
        ...comment,
        profile: comment.profile,
      })
    );

    // Calculate average rating
    const ratings = transformedComments.map((c) => c.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;

    const result: VenueWithComments = {
      ...transformedVenue,
      comments: transformedComments,
      averageRating,
      totalComments: transformedComments.length,
      verifications: verifications || [],
      featured_verification: featuredVerification,
    };

    return { data: result, error: null };
  } catch (error) {
    console.error("Error getting venue by ID:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Add a comment to a venue
export async function addComment(
  venueId: string,
  userId: string,
  content: string,
  rating: number
): Promise<{ data: Comment | null; error: Error | null }> {
  try {
  
    const supabase = createClient();

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        venue_id: venueId,
        user_id: userId,
        content: content.trim(),
        rating: Math.max(1, Math.min(5, rating)), // Ensure rating is between 1-5
      })
      .select(
        `
        *,
        profile:user_id(full_name)
      `
      )
      .single();

    if (error) {
      console.error("🚨 Error adding comment:", error);
      return { data: null, error: new Error(error.message) };
    }

    const transformedComment: Comment = {
      ...comment,
      profile: comment.profile,
    };

    return { data: transformedComment, error: null };
  } catch (error) {
    console.error("Error adding comment:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

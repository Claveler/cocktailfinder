import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

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

export interface VenueWithComments extends Venue {
  comments: Comment[];
  averageRating: number | null;
  totalComments: number;
  profile?: {
    full_name: string | null;
  } | null;
}

const PAGE_SIZE = 20;

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
      .select("*, latitude, longitude, google_maps_url", { count: "exact" })
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

    // Transform the data to match our interface (now with direct coordinate columns!)
    const transformedVenues: Venue[] = (venues || []).map((venue: any) => {
      const location =
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null;



      return {
        ...venue,
        location,
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

    // Transform venue data
    const transformedVenue: Venue = {
      ...venue,
      location:
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null,
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

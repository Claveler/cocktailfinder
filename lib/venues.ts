import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getVenuesList, fetchVerificationStats } from "@/lib/venues/core";





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
  verifications?: PiscoVerification[]; // Optional - fetched separately via pagination
  featured_verification?: PiscoVerification | null;
  profile?: {
    full_name: string | null;
  } | null;
}

const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_VENUES_LIMIT) || 20;

export async function listVenues(
  filters: VenueFilters = {}
): Promise<{ data: VenueListResult | null; error: Error | null }> {
  const { page = 1 } = filters;
  
  logger.debug("Starting venue query", filters);
  
  // Use the new consolidated function
  const result = await getVenuesList(filters, page, PAGE_SIZE);
  
  if (result.error) {
    logger.error("Error listing venues", { error: result.error, filters });
  } else {
    logger.debug("Query completed", { 
      venueCount: result.data?.venues.length, 
      totalCount: result.data?.totalCount 
    });
  }
  
  // Transform to match the old interface (hasPrevPage vs hasPreviousPage)
  if (result.data) {
    const transformedResult: VenueListResult = {
      venues: result.data.venues,
      totalCount: result.data.totalCount,
      currentPage: result.data.currentPage,
      totalPages: result.data.totalPages,
      hasNextPage: result.data.hasNextPage,
      hasPrevPage: result.data.hasPreviousPage, // Note: mapping hasPreviousPage to hasPrevPage
    };
    
    return { data: transformedResult, error: null };
  }
  
  return result;
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

    // Note: Verifications are now fetched separately via pagination
    // Only fetch the featured verification here

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

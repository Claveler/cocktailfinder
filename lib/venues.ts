import { createClient } from "@/lib/supabase/server";

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

const PAGE_SIZE = 20;

export async function listVenues(
  filters: VenueFilters = {}
): Promise<{ data: VenueListResult | null; error: Error | null }> {
  try {
    const supabase = createClient();
    const { q, city, brand, type, page = 1 } = filters;

    // Use database view that handles coordinate extraction
    console.log("🔍 Starting venue query with filters:", {
      q,
      city,
      brand,
      type,
      page,
    });

    let query = supabase
      .from("venues")
      .select("*", { count: "exact" })
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
    console.log("🔍 Executing query...");
    const {
      data: venues,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(from, to);

    console.log("🔍 Query result:", { venues: venues?.length, error, count });

    if (error) {
      console.error("🚨 Supabase query error:", error);
      return { data: null, error: new Error(error.message) };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Add debugging to see what we're getting from Supabase
    console.log("🔍 Raw venue data sample:", venues?.[0]);
    console.log("🔍 Total venues found:", venues?.length);

    // Get coordinates separately using RPC call
    const venueIds = venues?.map(v => v.id) || [];
    const coordinatesMap = await getVenueCoordinates(venueIds);
    
    // Transform the data to match our interface with coordinates
    const transformedVenues: Venue[] = (venues || []).map((venue: any) => {
      const coordinates = coordinatesMap[venue.id];
      console.log("🔍 Processing venue:", venue.name, "coordinates:", coordinates);

      return {
        ...venue,
        location: coordinates || null,
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
    console.error("Error listing venues:", error);
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
    const cities = [...new Set(data?.map((item) => item.city) || [])].sort();

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
    const uniqueBrands = [...new Set(allBrands)].sort();

    return { data: uniqueBrands, error: null };
  } catch (error) {
    console.error("Error getting brands:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// Helper function to get coordinates for venue IDs
async function getVenueCoordinates(venueIds: string[]): Promise<Record<string, { lat: number; lng: number }>> {
  if (venueIds.length === 0) return {};
  
  try {
    const supabase = createClient();
    
    // Use RPC call to get coordinates - this avoids the query builder issues
    const { data, error } = await supabase.rpc('get_venue_coordinates', {
      venue_ids: venueIds
    });
    
    if (error) {
      console.error("🚨 Error getting coordinates:", error);
      return {};
    }
    
    // Convert array to map for easy lookup
    const coordinatesMap: Record<string, { lat: number; lng: number }> = {};
    data?.forEach((item: any) => {
      if (item.id && item.latitude && item.longitude) {
        coordinatesMap[item.id] = {
          lat: item.latitude,
          lng: item.longitude,
        };
      }
    });
    
    console.log("🔍 Retrieved coordinates for", Object.keys(coordinatesMap).length, "venues");
    return coordinatesMap;
  } catch (error) {
    console.error("🚨 Error in getVenueCoordinates:", error);
    return {};
  }
}

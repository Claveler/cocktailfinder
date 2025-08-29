import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PiscoVerification } from "@/lib/venues";

const COMMENTS_PER_PAGE = 10; // Configurable page size

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || COMMENTS_PER_PAGE.toString());
    
    if (page < 1 || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const venueId = params.id;

    // First, verify the venue exists
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id, featured_verification_id")
      .eq("id", venueId)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // Calculate pagination offset
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch paginated verifications that have pisco_notes
    // Exclude the featured verification as it's shown separately
    let query = supabase
      .from("pisco_verifications")
      .select("*", { count: "exact" })
      .eq("venue_id", venueId)
      .not("pisco_notes", "is", null) // Only verifications with comments
      .order("created_at", { ascending: false })
      .range(from, to);

    // Exclude featured verification if it exists
    if (venue.featured_verification_id) {
      query = query.neq("id", venue.featured_verification_id);
    }

    const { data: verifications, error: verificationsError, count } = await query;

    if (verificationsError) {
      console.error("Error fetching paginated verifications:", verificationsError);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    const totalComments = count || 0;
    const totalPages = Math.ceil(totalComments / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      verifications: verifications || [],
      pagination: {
        currentPage: page,
        pageSize,
        totalComments,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (error) {
    console.error("Error in paginated comments API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

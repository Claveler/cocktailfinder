import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface VenueBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse bounds from query parameters
    const north = parseFloat(searchParams.get("north") || "");
    const south = parseFloat(searchParams.get("south") || "");
    const east = parseFloat(searchParams.get("east") || "");
    const west = parseFloat(searchParams.get("west") || "");

    // Validate bounds
    if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
      return NextResponse.json(
        { error: "Invalid bounds parameters" },
        { status: 400 }
      );
    }

    // Optional limit parameter (default to 50 for performance)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const supabase = createClient();

    // Query venues within bounds using efficient geographic filtering
    const { data: venues, error: venuesError } = await supabase
      .from("venues")
      .select(
        `
          id,
          name,
          address,
          city,
          country,
          type,
          latitude,
          longitude,
          google_maps_url,
          featured_verification_id,
          status,
          created_at,
          updated_at,
          created_by,
          brands,
          price_range,
          ambiance,
          photos,
          pisco_status,
          last_verified,
          verified_by,
          pisco_notes
        `
      )
      .eq("status", "approved")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .gte("latitude", south)
      .lte("latitude", north)
      .gte("longitude", west)
      .lte("longitude", east)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (venuesError) {
      console.error("Error fetching venues by bounds:", venuesError);
      return NextResponse.json(
        { error: "Failed to fetch venues" },
        { status: 500 }
      );
    }

    // Get venue IDs for verification stats from pisco_verifications table
    const venueIds = venues?.map((v) => v.id) || [];

    // Fetch verification stats from pisco_verifications table
    let verificationStats: Record<string, any> = {};
    if (venueIds.length > 0) {
      const { data: stats, error: statsError } = await supabase
        .from("pisco_verifications")
        .select("*")
        .in("venue_id", venueIds);

      if (stats && !statsError) {
        // Aggregate verification stats per venue
        verificationStats = stats.reduce((acc: any, verification: any) => {
          const venueId = verification.venue_id;
          if (!acc[venueId]) {
            acc[venueId] = {
              positive_verifications: 0,
              total_verifications: 0,
              unique_verifiers: new Set(),
              last_verified: null,
              verifications: [],
            };
          }

          acc[venueId].total_verifications++;
          if (verification.pisco_status === "available") {
            acc[venueId].positive_verifications++;
          }

          // Track unique verifiers
          if (verification.verified_by) {
            acc[venueId].unique_verifiers.add(verification.verified_by);
          }

          // Track most recent verification
          if (verification.created_at) {
            if (
              !acc[venueId].last_verified ||
              new Date(verification.created_at) >
                new Date(acc[venueId].last_verified)
            ) {
              acc[venueId].last_verified = verification.created_at;
            }
          }

          // Store all verifications for comments
          acc[venueId].verifications.push(verification);

          return acc;
        }, {});

        // Convert Sets to counts and sort verifications by date
        Object.keys(verificationStats).forEach((venueId) => {
          verificationStats[venueId].unique_verifiers =
            verificationStats[venueId].unique_verifiers.size;
          verificationStats[venueId].verifications.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        });
      }
    }

    // Fetch featured verifications for venues that have them
    const featuredVerificationIds =
      venues
        ?.filter((v) => v.featured_verification_id)
        .map((v) => v.featured_verification_id) || [];

    let featuredVerifications: Record<string, any> = {};
    if (featuredVerificationIds.length > 0) {
      const { data: featured, error: featuredError } = await supabase
        .from("pisco_verifications")
        .select("*")
        .in("id", featuredVerificationIds);

      if (featured && !featuredError) {
        featuredVerifications = featured.reduce(
          (acc: any, verification: any) => {
            acc[verification.id] = verification;
            return acc;
          },
          {}
        );
      }
    }

    // Transform venues to match expected format
    const transformedVenues =
      venues?.map((venue) => {
        const stats = verificationStats[venue.id] || {
          positive_verifications: 0,
          total_verifications: 0,
          unique_verifiers: 0,
          last_verified: null,
          verifications: [],
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
          // Include verification stats
          positive_verifications: stats.positive_verifications,
          total_verifications: stats.total_verifications,
          unique_verifiers: stats.unique_verifiers,
          last_verified: stats.last_verified,
          // Include featured verification
          featured_verification: featuredVerification,
          // Include recent verifications with comments
          recent_verifications: stats.verifications.slice(0, 3), // Latest 3 verifications
        };
      }) || [];

    // Add cache headers for performance
    return NextResponse.json(
      { venues: transformedVenues, count: transformedVenues.length },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60", // 5 min cache
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error in venues/by-bounds:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

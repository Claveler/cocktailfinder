"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface CreateVenueData {
  name: string;
  type: "bar" | "pub" | "liquor_store";
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  brands: string[];
  price_range?: string;
  ambiance: string[];
  photos: File[];
}

export async function updateVenuePhotos(venueId: string, photoUrls: string[]) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be logged in to update photos");
    }

    // Update venue with photo URLs
    const { error: updateError } = await supabase
      .from("venues")
      .update({ photos: photoUrls })
      .eq("id", venueId);

    if (updateError) {
      logger.error("Error updating venue photos", { error: updateError });
      throw new Error(`Failed to update photos: ${updateError.message}`);
    }

    logger.debug(`Updated venue with ${photoUrls.length} photo URLs`);

    return {
      success: true,
      message: "Photos updated successfully",
    };
  } catch (error) {
    logger.error("Error in updateVenuePhotos", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update photos",
    };
  }
}

export async function createVenue(formData: FormData) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be logged in to submit a venue");
    }

    logger.debug(`Creating venue for user: ${user.id}`);

    // Extract and validate form data
    const name = formData.get("name") as string;
    const type = formData.get("type") as "bar" | "pub" | "liquor_store";
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const price_range = formData.get("price_range") as string;
    const google_maps_url = formData.get("google_maps_url") as string;

    // Parse arrays from JSON strings
    const brands = JSON.parse((formData.get("brands") as string) || "[]");
    const ambiance = JSON.parse((formData.get("ambiance") as string) || "[]");

    // Photos are now handled client-side, no need to process them here

    // Validate required fields
    if (!name || !type || !address || !city || !country) {
      throw new Error("Please fill in all required fields");
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Please provide valid coordinates");
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(
        "Please provide valid latitude (-90 to 90) and longitude (-180 to 180)"
      );
    }

    // Create venue in database first (without photos)
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .insert({
        name: name.trim(),
        type,
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        // Convert lat/lng to PostGIS geography point
        location: `POINT(${longitude} ${latitude})`,
        brands: brands,
        price_range: price_range || null,
        ambiance: ambiance,
        photos: [], // Will update after photo upload
        status: "pending",
        created_by: user.id,
        google_maps_url: google_maps_url?.trim() || null,
      })
      .select()
      .single();

    if (venueError) {
      logger.error("Error creating venue", { error: venueError });
      throw new Error(`Failed to create venue: ${venueError.message}`);
    }

    logger.debug("Venue creation completed successfully");

    // Revalidate relevant pages
    revalidatePath("/venues");

    return {
      success: true,
      venueId: venue.id,
      message:
        "Venue submitted successfully! It will be reviewed before appearing publicly.",
    };
  } catch (error) {
    logger.error("Error in createVenue", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create venue",
    };
  }
}

export async function updateVenuePiscoInfo(venueId: string, formData: FormData) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be logged in to update pisco information");
    }

    // Get current user profile for verification tracking
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Extract form data
    const piscoStatus = formData.get("pisco_status") as string;
    const piscoNotes = (formData.get("pisco_notes") as string)?.trim();

    // Validate pisco status
    const validStatuses = ["available", "unavailable", "unverified", "temporarily_out"];
    if (!validStatuses.includes(piscoStatus)) {
      throw new Error("Invalid pisco status");
    }



    // Insert new verification record into history
    const { error: insertError } = await supabase
      .from("pisco_verifications")
      .insert({
        venue_id: venueId,
        user_id: user.id,
        verified_by: profile?.full_name || "Anonymous User",
        pisco_status: piscoStatus,
        pisco_notes: piscoNotes || null
      });

    if (insertError) {
      console.error("Error inserting verification:", insertError);
      throw new Error("Failed to record verification");
    }

    // Update venue with latest verification info (for backward compatibility)
    const updateData: any = {
      pisco_status: piscoStatus,
      pisco_notes: piscoNotes || null,
      last_verified: new Date().toISOString(),
      verified_by: profile?.full_name || "Anonymous User"
    };

    // Update venue pisco information
    const { error: updateError } = await supabase
      .from("venues")
      .update(updateData)
      .eq("id", venueId);

    if (updateError) {
      logger.error("Error updating venue pisco info", { error: updateError });
      throw new Error(`Failed to update pisco information: ${updateError.message}`);
    }

    logger.debug(`Updated pisco info for venue ${venueId} by user ${user.id}`);

    // Revalidate venue page
    revalidatePath(`/venues/${venueId}`);
    revalidatePath("/venues");
    revalidatePath("/");

    return {
      success: true,
      message: "Pisco information updated successfully!"
    };

  } catch (error) {
    logger.error("Error in updateVenuePiscoInfo", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update pisco information",
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkAdminRole(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
}

export async function deleteVenue(venueId: string) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();

    // Delete in order to handle foreign key constraints
    // 1. Delete comments first
    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .eq("venue_id", venueId);

    if (commentsError) {
      console.error("Error deleting venue comments:", commentsError);
      return { success: false, error: "Failed to delete venue comments" };
    }

    // 2. Delete pisco verifications
    const { error: verificationsError } = await supabase
      .from("pisco_verifications")
      .delete()
      .eq("venue_id", venueId);

    if (verificationsError) {
      console.error("Error deleting venue verifications:", verificationsError);
      return { success: false, error: "Failed to delete venue verifications" };
    }

    // 3. Finally delete the venue itself
    const { error: venueError } = await supabase
      .from("venues")
      .delete()
      .eq("id", venueId);

    if (venueError) {
      console.error("Error deleting venue:", venueError);
      return { success: false, error: "Failed to delete venue" };
    }

    // Revalidate relevant paths
    revalidatePath("/admin/venues");
    revalidatePath("/venues");
    revalidatePath("/");

    return {
      success: true,
      message: "Venue and all related data deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting venue:", error);
    return { success: false, error: "Failed to delete venue" };
  }
}

export async function approveVenue(venueId: string) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("venues")
      .update({ status: "approved" })
      .eq("id", venueId);

    if (error) {
      console.error("Error approving venue:", error);
      return { success: false, error: "Failed to approve venue" };
    }

    revalidatePath("/admin/venues");
    revalidatePath("/venues");

    return { success: true, message: "Venue approved successfully" };
  } catch (error) {
    console.error("Error in approveVenue:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function rejectVenue(venueId: string) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("venues")
      .update({ status: "rejected" })
      .eq("id", venueId);

    if (error) {
      console.error("Error rejecting venue:", error);
      return { success: false, error: "Failed to reject venue" };
    }

    revalidatePath("/admin/venues");

    return { success: true, message: "Venue rejected successfully" };
  } catch (error) {
    console.error("Error in rejectVenue:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateVenue(
  venueId: string,
  updates: {
    name?: string;
    type?: "bar" | "pub" | "liquor_store";
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    brands?: string[];
    price_range?: string;
    ambiance?: string[];
  }
) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();

    // Store coordinates in both formats for compatibility
    const venueUpdates: any = { ...updates };
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      venueUpdates.latitude = updates.latitude;
      venueUpdates.longitude = updates.longitude;
      venueUpdates.location = `POINT(${updates.longitude} ${updates.latitude})`;
    }

    const { error } = await supabase
      .from("venues")
      .update(venueUpdates)
      .eq("id", venueId);

    if (error) {
      console.error("Error updating venue:", error);
      return { success: false, error: "Failed to update venue" };
    }

    revalidatePath("/admin/venues");
    revalidatePath("/venues");

    return { success: true, message: "Venue updated successfully" };
  } catch (error) {
    console.error("Error in updateVenue:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Admin venue update action with full edit capabilities including status
export async function updateVenueAction(
  venueId: string,
  formData: {
    name: string;
    type: "bar" | "pub" | "liquor_store" | "restaurant";
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    brands: string[];
    price_range: string;
    ambiance: string[];
    status: "pending" | "approved" | "rejected";
    photos?: string[];
    google_maps_url?: string;
    featured_verification_id?: string | null;
  }
) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    // Get user context first
    const regularSupabase = createClient();
    const {
      data: { user },
    } = await regularSupabase.auth.getUser();
    console.log("🔧 Admin operation by user:", user?.email, "at", new Date().toISOString());

    // Debug environment variables
    console.log("🔍 Environment check:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    });

    // Use service role client for the actual update to bypass RLS issues
    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    );
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("✅ Service role client created successfully");

    // Prepare the update object
    const venueUpdates: any = {
      name: formData.name,
      type: formData.type,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      brands: formData.brands,
      price_range: formData.price_range || null,
      ambiance: formData.ambiance,
      status: formData.status,
      updated_at: new Date().toISOString(),
      google_maps_url: formData.google_maps_url?.trim() || null,
      featured_verification_id: formData.featured_verification_id || null,
    };

    // Include photos if provided
    if (formData.photos !== undefined) {
      venueUpdates.photos = formData.photos;
    }

    // Store coordinates in both formats for compatibility
    if (formData.latitude && formData.longitude) {
      venueUpdates.latitude = formData.latitude;
      venueUpdates.longitude = formData.longitude;
      venueUpdates.location = `POINT(${formData.longitude} ${formData.latitude})`;
    }

    const { error } = await supabase
      .from("venues")
      .update(venueUpdates)
      .eq("id", venueId);

    if (error) {
      console.error("Error updating venue:", error);
      return { success: false, error: "Failed to update venue" };
    }

    // Revalidate relevant paths
    revalidatePath("/admin/venues");
    revalidatePath("/venues");
    revalidatePath(`/venues/${venueId}`);
    revalidatePath(`/admin/venues/${venueId}/edit`);

    return { success: true, message: "Venue updated successfully" };
  } catch (error) {
    console.error("Error in updateVenueAction:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPendingVenues() {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { data: null, error: "Admin privileges required" };
    }

    const supabase = createClient();

    const { data: venues, error } = await supabase
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
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending venues:", error);
      return { data: null, error: "Failed to fetch venues" };
    }

    // Transform data to include coordinates
    const transformedVenues =
      venues?.map((venue) => ({
        ...venue,
        location:
          venue.latitude && venue.longitude
            ? { lat: venue.latitude, lng: venue.longitude }
            : null,
      })) || [];

    return { data: transformedVenues, error: null };
  } catch (error) {
    console.error("Error in getPendingVenues:", error);
    return { data: null, error: "An unexpected error occurred" };
  }
}

export async function getSuggestedEdits() {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { data: null, error: "Admin privileges required" };
    }

    const supabase = createClient();

    const { data: edits, error } = await supabase
      .from("suggested_edits")
      .select(
        `
        *,
        venue:venue_id(name),
        profile:user_id(full_name)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suggested edits:", error);
      return { data: null, error: "Failed to fetch suggested edits" };
    }

    return { data: edits || [], error: null };
  } catch (error) {
    console.error("Error in getSuggestedEdits:", error);
    return { data: null, error: "An unexpected error occurred" };
  }
}

export async function acceptSuggestedEdit(editId: string) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();

    // Get the suggested edit
    const { data: edit, error: editError } = await supabase
      .from("suggested_edits")
      .select("*")
      .eq("id", editId)
      .single();

    if (editError || !edit) {
      return { success: false, error: "Suggested edit not found" };
    }

    // Apply the changes to the venue
    const { error: venueError } = await supabase
      .from("venues")
      .update(edit.suggested_json)
      .eq("id", edit.venue_id);

    if (venueError) {
      console.error("Error applying suggested edit:", venueError);
      return { success: false, error: "Failed to apply changes to venue" };
    }

    // Mark the edit as accepted
    const { error: statusError } = await supabase
      .from("suggested_edits")
      .update({ status: "accepted" })
      .eq("id", editId);

    if (statusError) {
      console.error("Error updating edit status:", statusError);
      // Don't fail the operation for this
    }

    revalidatePath("/admin/edits");
    revalidatePath("/venues");

    return { success: true, message: "Suggested edit accepted and applied" };
  } catch (error) {
    console.error("Error in acceptSuggestedEdit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function rejectSuggestedEdit(editId: string) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("suggested_edits")
      .update({ status: "rejected" })
      .eq("id", editId);

    if (error) {
      console.error("Error rejecting suggested edit:", error);
      return { success: false, error: "Failed to reject suggested edit" };
    }

    revalidatePath("/admin/edits");

    return { success: true, message: "Suggested edit rejected" };
  } catch (error) {
    console.error("Error in rejectSuggestedEdit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Note: Photo upload/delete functionality uses client-side storage functions
// to avoid server/client boundary issues with File objects

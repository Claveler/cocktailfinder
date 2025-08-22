"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkAdminRole(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    console.log("✅ Venue approved:", venueId);
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

    console.log("❌ Venue rejected:", venueId);
    revalidatePath("/admin/venues");
    
    return { success: true, message: "Venue rejected successfully" };
  } catch (error) {
    console.error("Error in rejectVenue:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateVenue(venueId: string, updates: {
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
}) {
  try {
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
      return { success: false, error: "Admin privileges required" };
    }

    const supabase = createClient();
    
    // Convert coordinates to PostGIS if provided
    const venueUpdates: any = { ...updates };
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      venueUpdates.location = `POINT(${updates.longitude} ${updates.latitude})`;
      // Remove the separate lat/lng fields since we're using location
      delete venueUpdates.latitude;
      delete venueUpdates.longitude;
    }

    const { error } = await supabase
      .from("venues")
      .update(venueUpdates)
      .eq("id", venueId);

    if (error) {
      console.error("Error updating venue:", error);
      return { success: false, error: "Failed to update venue" };
    }

    console.log("📝 Venue updated:", venueId);
    revalidatePath("/admin/venues");
    revalidatePath("/venues");
    
    return { success: true, message: "Venue updated successfully" };
  } catch (error) {
    console.error("Error in updateVenue:", error);
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
      .select(`
        *,
        latitude,
        longitude,
        profile:created_by(full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending venues:", error);
      return { data: null, error: "Failed to fetch venues" };
    }

    // Transform data to include coordinates
    const transformedVenues = venues?.map(venue => ({
      ...venue,
      location: venue.latitude && venue.longitude 
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
      .select(`
        *,
        venue:venue_id(name),
        profile:user_id(full_name)
      `)
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

    console.log("✅ Suggested edit accepted:", editId);
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

    console.log("❌ Suggested edit rejected:", editId);
    revalidatePath("/admin/edits");
    
    return { success: true, message: "Suggested edit rejected" };
  } catch (error) {
    console.error("Error in rejectSuggestedEdit:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

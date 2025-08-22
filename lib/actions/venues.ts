"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadPhoto } from "@/lib/storage";

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

export async function createVenue(formData: FormData) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("You must be logged in to submit a venue");
    }

    console.log("🏗️ Creating venue for user:", user.id);

    // Extract and validate form data
    const name = formData.get("name") as string;
    const type = formData.get("type") as "bar" | "pub" | "liquor_store";
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const price_range = formData.get("price_range") as string;
    
    // Parse arrays from JSON strings
    const brands = JSON.parse(formData.get("brands") as string || "[]");
    const ambiance = JSON.parse(formData.get("ambiance") as string || "[]");
    
    // Get uploaded files
    const photoFiles = formData.getAll("photos") as File[];
    const validPhotoFiles = photoFiles.filter(file => file.size > 0);

    // Validate required fields
    if (!name || !type || !address || !city || !country) {
      throw new Error("Please fill in all required fields");
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Please provide valid coordinates");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error("Please provide valid latitude (-90 to 90) and longitude (-180 to 180)");
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
      })
      .select()
      .single();

    if (venueError) {
      console.error("🚨 Error creating venue:", venueError);
      throw new Error(`Failed to create venue: ${venueError.message}`);
    }

    console.log("🏗️ Venue created with ID:", venue.id);

    // Upload photos if any
    let photoUrls: string[] = [];
    if (validPhotoFiles.length > 0) {
      console.log("📸 Uploading", validPhotoFiles.length, "photos...");
      
      for (let i = 0; i < validPhotoFiles.length; i++) {
        const file = validPhotoFiles[i];
        try {
          const { data: uploadResult, error: uploadError } = await uploadPhoto(file, venue.id);
          
          if (uploadError) {
            console.error("🚨 Error uploading photo", i + 1, ":", uploadError);
            // Continue with other photos instead of failing completely
            continue;
          }
          
          if (uploadResult?.publicUrl) {
            photoUrls.push(uploadResult.publicUrl);
            console.log("📸 Photo", i + 1, "uploaded successfully");
          }
        } catch (error) {
          console.error("🚨 Error uploading photo", i + 1, ":", error);
          // Continue with other photos
        }
      }
    }

    // Update venue with photo URLs
    if (photoUrls.length > 0) {
      const { error: updateError } = await supabase
        .from("venues")
        .update({ photos: photoUrls })
        .eq("id", venue.id);

      if (updateError) {
        console.error("🚨 Error updating venue photos:", updateError);
        // Don't fail the whole operation for photo update error
      } else {
        console.log("📸 Updated venue with", photoUrls.length, "photo URLs");
      }
    }

    console.log("✅ Venue creation completed successfully");
    
    // Revalidate relevant pages
    revalidatePath("/venues");
    
    return { 
      success: true, 
      venueId: venue.id,
      message: "Venue submitted successfully! It will be reviewed before appearing publicly."
    };

  } catch (error) {
    console.error("🚨 Error in createVenue:", error);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create venue" 
    };
  }
}

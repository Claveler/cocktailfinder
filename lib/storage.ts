import { createClient } from "@/lib/supabase/client";

/**
 * Get the public URL for a file in the venue-photos bucket
 * @param path - The file path in the bucket (e.g., "user-id/venue-id/filename.jpg")
 * @returns Public URL string
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from("venue-photos").getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Upload a photo to the venue-photos bucket
 * @param file - The file to upload
 * @param venueId - The venue ID this photo belongs to
 * @param fileName - Optional custom filename (will use file.name if not provided)
 * @returns Promise with upload result
 */
export async function uploadPhoto(
  file: File,
  venueId: string,
  fileName?: string
): Promise<{
  data: { path: string; fullPath: string; publicUrl: string } | null;
  error: Error | null;
}> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: new Error("User must be authenticated to upload photos"),
    };
  }

  // Generate file path: userId/venueId/filename
  const fileExtension = file.name.split(".").pop();
  const finalFileName = fileName || `${Date.now()}.${fileExtension}`;
  const filePath = `${user.id}/${venueId}/${finalFileName}`;

  try {
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("venue-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      return { data: null, error };
    }

    // Get public URL for the uploaded file
    const publicUrl = getPublicUrl(data.path);

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * Delete a photo from the venue-photos bucket
 * @param path - The file path to delete
 * @returns Promise with deletion result
 */
export async function deletePhoto(path: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from("venue-photos")
      .remove([path]);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * List all photos for a specific venue
 * @param venueId - The venue ID
 * @param userId - Optional user ID to filter by specific user's photos
 * @returns Promise with list of photo paths and URLs
 */
export async function listVenuePhotos(
  venueId: string,
  userId?: string
): Promise<{
  data: Array<{ path: string; publicUrl: string; name: string }> | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    // If no userId provided, get current user ID
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          data: null,
          error: new Error("User must be authenticated to list photos"),
        };
      }
      targetUserId = user.id;
    }

    // Search in the specific user's folder for this venue
    const searchPath = `${targetUserId}/${venueId}`;

    const { data, error } = await supabase.storage
      .from("venue-photos")
      .list(searchPath, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      return { data: null, error };
    }

    // Transform the data to include public URLs
    const photosWithUrls =
      data
        ?.filter((file) => file.name !== ".emptyFolderPlaceholder") // Filter out folder placeholders
        ?.map((file) => {
          const fullPath = `${targetUserId}/${venueId}/${file.name}`;
          return {
            path: fullPath,
            publicUrl: getPublicUrl(fullPath),
            name: file.name,
          };
        }) || [];

    return { data: photosWithUrls, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Server-side helper to get storage client (for use in API routes)
 * Import this function only in server components or API routes
 *
 * Example usage in API route:
 * import { getServerStorageClient } from '@/lib/storage';
 * const storage = getServerStorageClient();
 */
export async function getServerStorageClient() {
  // Dynamic import to avoid client-side issues
  const { createClient: createServerClient } = await import(
    "@/lib/supabase/server"
  );
  return createServerClient().storage;
}

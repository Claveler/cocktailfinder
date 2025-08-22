"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addComment } from "@/lib/venues";

export async function addCommentAction(
  venueId: string,
  formData: FormData
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("You must be logged in to add a comment");
    }

    // Extract form data
    const content = formData.get("content") as string;
    const rating = parseInt(formData.get("rating") as string);

    // Validate inputs
    if (!content || content.trim().length === 0) {
      throw new Error("Comment content is required");
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Add the comment
    const result = await addComment(venueId, user.id, content, rating);
    
    if (result.error) {
      throw result.error;
    }

    console.log("💬 Comment added via server action");
    
    // Revalidate the venue page to show the new comment
    revalidatePath(`/venues/${venueId}`);
    
    return { success: true, comment: result.data };
  } catch (error) {
    console.error("Error in addCommentAction:", error);
    
    // Return error to be displayed to user
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to add comment" 
    };
  }
}

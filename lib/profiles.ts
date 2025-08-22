import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

/**
 * Upsert user profile on first sign-in or when user data changes
 */
export async function upsertUserProfile(user: User): Promise<{
  data: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    // Extract full name from user metadata (Google OAuth provides this)
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      null;

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          // Don't update role if it already exists (keep existing role)
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error upserting profile:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in upsertUserProfile:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get user profile by ID (client-side)
 */
export async function getUserProfile(userId: string): Promise<{
  data: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get current user's profile (client-side)
 */
export async function getCurrentUserProfile(): Promise<{
  data: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: userError || new Error("Not authenticated") };
    }

    return await getUserProfile(user.id);
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, "full_name">>
): Promise<{
  data: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: userError || new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

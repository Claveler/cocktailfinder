"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { upsertUserProfile, getCurrentUserProfile } from "@/lib/profiles";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/profiles";

export default function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Add timeout to prevent infinite loading (backup safety)
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log(
          "⚠️ AuthButton timeout - setting to unauthenticated (backup safety)"
        );
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }, 10000); // 10 second timeout (longer backup)

    // Get initial session
    const getSession = async () => {
      try {
        console.log("AuthButton: Getting session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("🔍 AuthButton: Session result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          userMetadata: session?.user?.user_metadata,
          sessionId: session?.access_token?.slice(0, 20) + "...",
        });

        if (mounted) {
          // Clear timeout immediately
          clearTimeout(timeout);

          if (session?.user) {
            setUser(session.user);
            setLoading(false); // Show user immediately
            // Handle profile in background
            handleUserProfile(session.user).catch((error) => {
              console.error("Profile handling error (non-blocking):", error);
            });
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("AuthButton error:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthButton: Auth state change:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString(),
      });

      if (mounted) {
        // Clear timeout immediately when we get any auth state change
        clearTimeout(timeout);

        if (session?.user) {
          setUser(session.user);
          setLoading(false); // Set loading false immediately for user
          // Handle profile creation in background without blocking UI
          handleUserProfile(session.user).catch((error) => {
            console.error("Profile handling error (non-blocking):", error);
          });
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserProfile = async (user: SupabaseUser) => {
    try {
      console.log("📄 handleUserProfile started for:", user.email);

      // First, try to get existing profile
      console.log("🔍 Checking for existing profile...");
      const { data: existingProfile, error: profileError } =
        await getCurrentUserProfile();

      console.log("📄 Profile check result:", {
        hasProfile: !!existingProfile,
        profileError: profileError?.message,
        profile: existingProfile,
      });

      if (existingProfile) {
        console.log("✅ Using existing profile:", existingProfile);
        setProfile(existingProfile);
      } else {
        // If no profile exists, create one (first-time sign-in)
        console.log("🆕 Creating new user profile for:", {
          email: user.email,
          metadata: user.user_metadata,
        });

        const { data: newProfile, error } = await upsertUserProfile(user);

        console.log("📄 Profile creation result:", {
          success: !!newProfile,
          error: error?.message,
          profile: newProfile,
        });

        if (newProfile) {
          console.log("✅ Profile created successfully:", newProfile);
          setProfile(newProfile);
        } else {
          console.error("❌ Error creating profile:", error);
          // Create a fallback profile so auth doesn't fail
          const fallbackProfile = {
            id: user.id,
            full_name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              null,
            role: "user",
            created_at: new Date().toISOString(),
          };
          console.log("🛡️ Using fallback profile:", fallbackProfile);
          setProfile(fallbackProfile);
        }
      }
    } catch (error) {
      console.error("❌ Error in handleUserProfile:", error);
      // Create a fallback profile so auth doesn't completely fail
      const fallbackProfile = {
        id: user.id,
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        role: "user",
        created_at: new Date().toISOString(),
      };
      console.log("🛡️ Using fallback profile due to error:", fallbackProfile);
      setProfile(fallbackProfile);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <Button size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // Get display name from profile or user metadata
  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(" ")
      .map((word: string) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (user) {
    const isAdmin = profile?.role === "admin";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="relative">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {getInitials()}
              </div>
              <span className="hidden sm:inline text-sm">
                {getDisplayName()}
              </span>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs px-1">
                  Admin
                </Badge>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs w-fit">
                  Administrator
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button size="sm" asChild>
      <Link href="/login">
        <User className="h-4 w-4 mr-2" />
        Sign In
      </Link>
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User, LogOut } from "lucide-react";
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
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await handleUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, !!session);

      if (session?.user) {
        setUser(session.user);
        await handleUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleUserProfile = async (user: SupabaseUser) => {
    try {
      // First, try to get existing profile
      const { data: existingProfile } = await getCurrentUserProfile();

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        // If no profile exists, create one (first-time sign-in)
        console.log("Creating new user profile...");
        const { data: newProfile, error } = await upsertUserProfile(user);
        if (newProfile) {
          setProfile(newProfile);
        } else {
          console.error("Error creating profile:", error);
        }
      }
    } catch (error) {
      console.error("Error handling user profile:", error);
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

  if (user) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" variant="outline">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden sm:inline text-sm">
                {user.email?.split("@")[0] || "User"}
              </span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {profile && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">{profile.role}</p>
              </div>
            )}
            {user.user_metadata?.full_name && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {user.user_metadata.full_name}
                </p>
              </div>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
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

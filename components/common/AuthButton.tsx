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
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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

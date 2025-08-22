import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Edit, Home, Palette } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and admin role
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("🔍 Admin Layout Debug:");
  console.log("- User:", user?.email);
  console.log("- Auth Error:", authError);

  if (!user) {
    console.log("❌ No user found, redirecting to login");
    redirect("/login?message=Please sign in to access admin panel");
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  console.log("👤 Profile Debug:");
  console.log("- Profile Data:", profile);
  console.log("- Profile Error:", profileError);
  console.log("- User ID:", user.id);
  console.log("- Role:", profile?.role);

  if (profileError) {
    console.log("❌ Profile error:", profileError);
    redirect(
      "/?message=Profile not found - Please complete your profile first"
    );
  }

  if (!profile || profile.role !== "admin") {
    console.log(`❌ Access denied. Role: ${profile?.role}, Expected: admin`);
    redirect("/?message=Access denied - Admin privileges required");
  }

  console.log("✅ Admin access granted");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Admin Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Content moderation and management
              </p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Link>
          </Button>
        </div>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <nav className="flex gap-4 flex-wrap">
              <Button asChild variant="ghost">
                <Link href="/admin/venues" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Pending Venues
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/admin/edits" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Suggested Edits
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/admin/theme" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Theme Colors
                </Link>
              </Button>
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Admin Content */}
      {children}
    </div>
  );
}

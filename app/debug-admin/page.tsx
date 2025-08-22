import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DebugAdminPage() {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Get all users and profiles for debugging
  const { data: allUsers, error: usersError } =
    await supabase.auth.admin.listUsers();

  // Get profile if user exists
  let profile = null;
  let profileError = null;

  if (user) {
    const result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = result.data;
    profileError = result.error;
  }

  // Get all profiles
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>

      {/* Current User */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          {authError ? (
            <div className="text-red-600">
              <strong>Auth Error:</strong> {authError.message}
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>ID:</strong> {user.id}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(user.created_at || "").toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-yellow-600">No user logged in</div>
          )}
        </CardContent>
      </Card>

      {/* Current User Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {profileError ? (
            <div className="text-red-600">
              <strong>Profile Error:</strong> {profileError.message}
            </div>
          ) : profile ? (
            <div className="space-y-2">
              <div>
                <strong>Full Name:</strong> {profile.full_name || "Not set"}
              </div>
              <div>
                <strong>Role:</strong>
                <Badge
                  className={
                    profile.role === "admin" ? "bg-green-600" : "bg-gray-600"
                  }
                >
                  {profile.role || "Not set"}
                </Badge>
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(profile.created_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-yellow-600">
              No profile found for current user
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Profiles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Profiles in Database</CardTitle>
        </CardHeader>
        <CardContent>
          {allProfilesError ? (
            <div className="text-red-600">
              <strong>Error:</strong> {allProfilesError.message}
            </div>
          ) : allProfiles && allProfiles.length > 0 ? (
            <div className="space-y-4">
              {allProfiles.map((p) => (
                <div key={p.id} className="border p-3 rounded">
                  <div className="flex items-center gap-3 mb-2">
                    <strong>Profile ID:</strong> {p.id.slice(0, 8)}...
                    <Badge
                      className={
                        p.role === "admin" ? "bg-green-600" : "bg-gray-600"
                      }
                    >
                      {p.role || "user"}
                    </Badge>
                  </div>
                  <div>
                    <strong>Name:</strong> {p.full_name || "Not set"}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-yellow-600">No profiles found</div>
          )}
        </CardContent>
      </Card>

      {/* SQL Query for Manual Check */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Check SQL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Run this in Supabase SQL Editor to check your admin status:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
            {`-- Check if claveler@hotmail.com is admin
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'claveler@hotmail.com';

-- If no profile exists, create it:
INSERT INTO public.profiles (id, full_name, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'claveler@hotmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

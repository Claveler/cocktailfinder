import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVenueById } from "@/lib/venues";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VenueEditForm from "./VenueEditForm";

interface EditVenuePageProps {
  params: {
    id: string;
  };
}

// Loading component
function EditVenueLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default async function EditVenuePage({ params }: EditVenuePageProps) {
  const supabase = createClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/venues");
  }

  // Fetch venue data
  const { data: venue, error } = await getVenueById(params.id, user.id);

  if (error || !venue) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/venues/${venue.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Venue
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">|</div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/venues">Admin Dashboard</Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Edit Venue</h1>
          <p className="text-muted-foreground">
            Editing: <span className="font-medium">{venue.name}</span>
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<EditVenueLoading />}>
            <VenueEditForm venue={venue} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

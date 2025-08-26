import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getVenueById } from "@/lib/venues";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Star,
  ExternalLink,
  Calendar,
  User,
  MessageCircle,
  ArrowLeft,
  StarIcon,
  Edit,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import PiscoVerificationForm from "./PiscoVerificationForm";
import PhotoGallery from "./PhotoGallery";
import { getVenueGoogleMapsUrl } from "@/lib/maps";

interface VenuePageProps {
  params: {
    id: string;
  };
}

// Loading component
function VenueDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Star rating display component
function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <StarIcon
        key={i}
        className={`${starSize} fill-yellow-400 text-yellow-400`}
      />
    );
  }

  if (hasHalfStar) {
    stars.push(
      <div key="half" className={`${starSize} relative`}>
        <StarIcon className={`${starSize} text-gray-300`} />
        <div className="absolute inset-0 overflow-hidden w-1/2">
          <StarIcon className={`${starSize} fill-yellow-400 text-yellow-400`} />
        </div>
      </div>
    );
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <StarIcon key={`empty-${i}`} className={`${starSize} text-gray-300`} />
    );
  }

  return <div className="flex items-center gap-1">{stars}</div>;
}

// Pisco status helper functions
function getPiscoStatusIcon(status: string) {
  switch (status) {
    case "available":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "unavailable":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "temporarily_out":
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    default: // unverified
      return <HelpCircle className="h-5 w-5 text-gray-400" />;
  }
}

function getPiscoStatusText(status: string) {
  switch (status) {
    case "available":
      return "Pisco Available";
    case "unavailable":
      return "No Pisco";
    case "temporarily_out":
      return "Temporarily Out";
    default: // unverified
      return "Pisco Status Unknown";
  }
}



export default async function VenuePage({ params }: VenuePageProps) {
  // Get current user for access control
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin";
  }

  // Fetch venue data
  const { data: venue, error } = await getVenueById(params.id, user?.id);

  if (error || !venue) {
    notFound();
  }

  // Generate Google Maps URL (prefers stored URL, falls back to coordinates)
  const googleMapsUrl = getVenueGoogleMapsUrl(venue);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/venues">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Venues
          </Link>
        </Button>
      </div>

      {/* Hero Section - Gallery for multiple photos, single image for one photo */}
      {venue.photos && venue.photos.length > 0 && (
        <div className="mb-8">
          {venue.photos.length === 1 ? (
            /* Single Hero Image */
            <div className="relative aspect-[3/1] w-full bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={venue.photos[0]}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            /* Multiple Photos - Show Gallery as Hero */
            <div className="relative aspect-[3/1] w-full bg-gray-50 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center">
                <PhotoGallery
                  photos={venue.photos}
                  venueName={venue.name}
                  showTitle={false}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Venue Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{venue.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Badge variant="secondary" className="capitalize">
                {venue.type.replace("_", " ")}
              </Badge>
              {venue.price_range && (
                <span className="font-medium">{venue.price_range}</span>
              )}
              {venue.averageRating && (
                <div className="flex items-center gap-2">
                  <StarRating rating={venue.averageRating} />
                  <span className="text-sm">
                    {venue.averageRating.toFixed(1)} ({venue.totalComments}{" "}
                    reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Edit Button */}
          {isAdmin && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/venues/${venue.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Venue
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Address with Google Maps link */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{venue.address}</span>
          <Button asChild variant="link" size="sm" className="p-0 h-auto">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 ml-1" />
              Open in Google Maps
            </a>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Venue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Brands */}
              {venue.brands.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Featured Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {venue.brands.map((brand) => (
                      <Badge key={brand} variant="outline">
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ambiance */}
              {venue.ambiance.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Ambiance</h4>
                  <div className="flex flex-wrap gap-2">
                    {venue.ambiance.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Added by */}
              {venue.profile?.full_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                  <User className="h-4 w-4" />
                  <span>Added by {venue.profile.full_name}</span>
                  <Calendar className="h-4 w-4 ml-2" />
                  <span>{new Date(venue.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pisco Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPiscoStatusIcon(venue.pisco_status)}
                Pisco Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Current Pisco Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPiscoStatusIcon(venue.pisco_status)}
                    <div>
                      <h3 className="font-semibold">{getPiscoStatusText(venue.pisco_status)}</h3>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {venue.last_verified ? (
                      <>
                        <div>Verified {new Date(venue.last_verified).toLocaleDateString()}</div>
                        {venue.verified_by && <div>by {venue.verified_by}</div>}
                      </>
                    ) : (
                      <div>Never verified</div>
                    )}
                  </div>
                </div>

                {/* Pisco Notes */}
                {venue.pisco_notes && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Community Notes:</h4>
                    <p className="text-blue-800 text-sm italic">"{venue.pisco_notes}"</p>
                  </div>
                )}

                {/* No information available */}
                {venue.pisco_status === "unverified" && !venue.pisco_notes && (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pisco information available yet. Help the community by verifying!</p>
                  </div>
                )}
              </div>

              {/* Verification Form */}
              {user ? (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-semibold mb-4">Update Pisco Information</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Help fellow pisco lovers by sharing what you know about this venue's pisco availability.
                    </p>
                    <Suspense fallback={<div>Loading verification form...</div>}>
                                            <PiscoVerificationForm
                        venueId={venue.id}
                        currentStatus={venue.pisco_status}
                        currentNotes={venue.pisco_notes}
                      />
                    </Suspense>
                  </div>
                </>
              ) : (
                <>
                  <Separator className="my-6" />
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Sign in to help verify pisco information
                    </p>
                    <Button asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">
                  {venue.type.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City</span>
                <span>{venue.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span>{venue.country}</span>
              </div>
              {venue.price_range && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Range</span>
                  <span>{venue.price_range}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    venue.status === "approved" ? "default" : "secondary"
                  }
                  className="capitalize"
                >
                  {venue.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    View on Map
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/venues?city=${encodeURIComponent(venue.city)}`}>
                    More in {venue.city}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

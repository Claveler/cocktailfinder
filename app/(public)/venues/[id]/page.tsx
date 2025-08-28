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
  Calendar,
  User,
  MessageCircle,
  Edit,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  Users,
  Shield,
  Share2,
  MessageCircleMore,
} from "lucide-react";
import PiscoVerificationForm from "./PiscoVerificationForm";
import PhotoGallery from "./PhotoGallery";
import ShareButton from "./ShareButton";
import VenueHero from "./VenueHero";

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
        <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-48 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
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
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
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

function formatDate(date: string) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
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



  return (
    <div className="min-h-screen bg-muted/30 md:bg-background">
      {/* Container matching landing page */}
      <div className="container mx-auto px-4">
        {/* Enhanced Hero Component with Extension Table */}
        <VenueHero 
          venue={{
            id: venue.id,
            name: venue.name,
            type: venue.type,
            price_range: venue.price_range || undefined,
            photos: venue.photos,
            address: venue.address,
            city: venue.city,
            country: venue.country,
            brands: venue.brands,
            ambiance: venue.ambiance,
            averageRating: venue.averageRating || undefined,
            totalComments: venue.totalComments || undefined
          }}
          isAdmin={isAdmin}
        />

        <div className="px-4 md:px-6 lg:px-0 pb-4 md:pb-8 pt-4 md:pt-0">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              
              {/* Community Pisco Insights - Now Primary */}
              <Card className="relative z-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircleMore className="h-5 w-5" />
                    Piscoleros Say...
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Real information from fellow pisco enthusiasts who've visited this venue
                  </p>
                </CardHeader>
                <CardContent>
              {/* Current Pisco Status */}
              <div className="space-y-4">
                {/* Pisco Status & Community Trust - Same Line */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  {/* Pisco Status */}
                  <div className="flex items-center gap-3">
                    {getPiscoStatusIcon(venue.pisco_status)}
                    <h3 className="font-semibold">{getPiscoStatusText(venue.pisco_status)}</h3>
                  </div>

                  {/* Community Trust Score */}
                  {/* <div className="text-sm">
                    {(venue.total_verifications ?? 0) > 0 ? (
                      <span className="font-medium text-emerald-600">
                        {Math.round(((venue.positive_verifications || 0) / (venue.total_verifications || 1)) * 100)}% verified
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not verified yet</span>
                    )}
                  </div> */}
                </div>

                {/* Verification Details - Enhanced with icons and explanations */}
                {(venue.unique_verifiers ?? 0) > 0 && venue.last_verified && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    {/* Mobile: Three rows layout */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {/* Community Verifiers */}
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">
                            {venue.unique_verifiers} {venue.unique_verifiers === 1 ? 'Verifier' : 'Verifiers'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Community members who verified
                          </div>
                        </div>
                      </div>
                      
                      {/* Verification Success Rate */}
                      <div className="flex items-center gap-3 text-sm">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <div>
                          <div className="font-medium text-emerald-600">
                            {(venue.total_verifications ?? 0) > 0 ? 
                              `${Math.round(((venue.positive_verifications || 0) / (venue.total_verifications || 1)) * 100)}% Verified` : 
                              '0% Verified'
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Confirmation rate for pisco availability
                          </div>
                        </div>
                      </div>
                      
                      {/* Last Verification Date */}
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">
                            {formatDate(venue.last_verified)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last verification date
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Three columns layout with better spacing */}
                    <div className="hidden md:grid grid-cols-3 gap-8 text-center">
                      {/* Community Verifiers */}
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold text-sm text-foreground">
                            {venue.unique_verifiers} {venue.unique_verifiers === 1 ? 'Verifier' : 'Verifiers'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Community members who verified
                          </div>
                        </div>
                      </div>
                      
                      {/* Verification Success Rate */}
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-semibold text-sm text-emerald-600">
                            {(venue.total_verifications ?? 0) > 0 ? 
                              `${Math.round(((venue.positive_verifications || 0) / (venue.total_verifications || 1)) * 100)}% Verified` : 
                              '0% Verified'
                            }
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Confirmation rate for pisco availability
                          </div>
                        </div>
                      </div>
                      
                      {/* Last Verification Date */}
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold text-sm text-foreground">
                            {formatDate(venue.last_verified)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last verification date
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Community Notes - Quote Style with Theme Colors */}
                {venue.pisco_notes && venue.verified_by && (
                  <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4 mt-4">
                    <div className="text-sm text-foreground/80 italic">
                      "{venue.pisco_notes}" — {venue.verified_by}
                    </div>
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
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize text-foreground">
                      {venue.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">City</span>
                    <span className="text-foreground">{venue.city}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Country</span>
                    <span className="text-foreground">{venue.country}</span>
                  </div>
                  {venue.price_range && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price Range</span>
                      <span className="text-foreground">{venue.price_range}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
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

              {/* Venue History */}
              {venue.profile?.full_name && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Venue History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">Added by {venue.profile.full_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(venue.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent([venue.address, venue.city, venue.country].filter(Boolean).join(', '))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        View on Map
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/?venueId=${venue.id}&zoom=12`}>
                        More in {venue.city}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

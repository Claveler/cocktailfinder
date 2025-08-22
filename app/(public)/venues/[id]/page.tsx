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
} from "lucide-react";
import CommentForm from "./CommentForm";
import PhotoGallery from "./PhotoGallery";

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
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <StarIcon key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
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

// Comment component
function CommentItem({ comment }: { comment: any }) {
  return (
    <div className="space-y-3 p-4 border-b last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">
              {comment.profile?.full_name || "Anonymous"}
            </span>
          </div>
          <StarRating rating={comment.rating} />
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
    </div>
  );
}

export default async function VenuePage({ params }: VenuePageProps) {
  // Get current user for access control
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    isAdmin = profile?.role === 'admin';
  }

  // Fetch venue data
  const { data: venue, error } = await getVenueById(params.id, user?.id);

  if (error || !venue) {
    notFound();
  }

  // Generate Google Maps URL
  const googleMapsUrl = venue.location
    ? `https://www.google.com/maps?q=${venue.location.lat},${venue.location.lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(venue.address)}`;

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

      {/* Hero Image */}
      {venue.photos && venue.photos.length > 0 && (
        <div className="mb-8">
          <div className="relative aspect-[3/1] w-full bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={venue.photos[0]}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
            {venue.photos.length > 1 && (
              <div className="absolute bottom-4 right-4">
                <Badge variant="secondary" className="bg-black/70 text-white">
                  +{venue.photos.length - 1} more photos
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Venue Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{venue.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Badge variant="secondary" className="capitalize">
                {venue.type.replace('_', ' ')}
              </Badge>
              {venue.price_range && (
                <span className="font-medium">{venue.price_range}</span>
              )}
              {venue.averageRating && (
                <div className="flex items-center gap-2">
                  <StarRating rating={venue.averageRating} />
                  <span className="text-sm">
                    {venue.averageRating.toFixed(1)} ({venue.totalComments} reviews)
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

              {/* Photo Gallery */}
              <PhotoGallery photos={venue.photos} venueName={venue.name} />

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

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Reviews & Comments ({venue.totalComments})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {venue.comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {venue.comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              )}

              {/* Comment Form */}
              {user ? (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-semibold mb-4">Add Your Review</h4>
                    <Suspense fallback={<div>Loading comment form...</div>}>
                      <CommentForm venueId={venue.id} />
                    </Suspense>
                  </div>
                </>
              ) : (
                <>
                  <Separator className="my-6" />
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      Sign in to leave a review
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
                <span className="capitalize">{venue.type.replace('_', ' ')}</span>
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
                  variant={venue.status === 'approved' ? 'default' : 'secondary'}
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
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
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

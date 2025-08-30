"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Martini, Beer, Store, UtensilsCrossed, Star, ExternalLink } from "lucide-react";
import PhotoGallery from "./PhotoGallery";
import ShareButton from "./ShareButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";

interface VenueHeroProps {
  venue: {
    id: string;
    name: string;
    type: string;
    price_range?: string;
    photos?: string[];
    address: string;
    city?: string;
    country?: string;
    brands: string[];
    ambiance: string[];
    averageRating?: number;
    totalComments?: number;
    google_maps_url?: string | null;
  };
  isAdmin?: boolean;
  className?: string;
}

// Helper function for type icons
const getTypeIcon = (type: string) => {
  switch (type) {
    case "bar":
      return <Martini className="h-4 w-4" />;
    case "pub":
      return <Beer className="h-4 w-4" />;
    case "liquor_store":
      return <Store className="h-4 w-4" />;
    case "restaurant":
      return <UtensilsCrossed className="h-4 w-4" />;
    default:
      return <Martini className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "bar":
      return "Cocktail Bar";
    case "pub":
      return "Pub";
    case "liquor_store":
      return "Liquor Store";
    case "restaurant":
      return "Restaurant";
    default:
      return type;
  }
};

const getPriceRangeDisplay = (priceRange: string | null) => {
  if (!priceRange) return null;

  const ranges: Record<string, string> = {
    $: "$",
    $$: "$$",
    $$$: "$$$",
    $$$$: "$$$$",
    budget: "$",
    moderate: "$$",
    upscale: "$$$",
    luxury: "$$$$",
  };

  return ranges[priceRange.toLowerCase()] || priceRange;
};

// Simple star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function VenueHero({ venue, isAdmin = false, className = "" }: VenueHeroProps) {
  return (
    <div className={`${className} -mx-4 md:mx-0`}>
      {/* Unified Hero Layout - Similar on mobile and desktop */}
      <div className="relative mb-0">
        {/* Photo Container */}
        <div className="relative aspect-[4/3] md:aspect-[3/1] w-full bg-muted overflow-hidden">
          {venue.photos && venue.photos.length > 0 ? (
            venue.photos.length === 1 ? (
              <img
                src={venue.photos[0]}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <PhotoGallery
                photos={venue.photos}
                venueName={venue.name}
                showTitle={false}
              />
            )
          ) : (
            /* Placeholder when no photos - same as venue cards */
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <Martini className="w-16 h-16 md:w-24 md:h-24 text-white opacity-40" />
            </div>
          )}
          
          {/* Enhanced Gradient Overlay for better readability - Matches VenueCard */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          
          {/* Overlay Container - Non-interfering with gallery */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Bottom Overlay - Like venue cards */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 text-white">
              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0">
                  {/* Venue Name */}
                  <h1 className="text-xl md:text-4xl font-bold mb-2 md:mb-4 leading-tight">{venue.name}</h1>
                  
                  {/* Venue Meta - Like venue card badges */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full md:hidden">
                      {getTypeIcon(venue.type)}
                      <span className="text-xs text-white/90 font-medium">{getTypeLabel(venue.type)}</span>
                      {venue.price_range && (
                        <>
                          <span className="text-xs text-white/70">•</span>
                          <span className="text-xs font-semibold text-green-300">
                            {getPriceRangeDisplay(venue.price_range)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {venue.averageRating && (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full">
                        <StarRating rating={venue.averageRating} />
                        <span className="text-xs md:text-sm text-white/90 font-medium">
                          {venue.averageRating.toFixed(1)} ({venue.totalComments} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons - Interactive elements */}
                <div className="flex gap-2 md:gap-3 ml-3 md:ml-6 pointer-events-auto">
                  <ShareButton 
                    venue={{
                      id: venue.id,
                      name: venue.name,
                      address: venue.address
                    }}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  />
                  {isAdmin && (
                    <Button asChild variant="outline" size="sm" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                      <Link href={`/admin/venues/${venue.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3 md:mr-2 md:h-4 md:w-4" />
                        <span className="hidden md:inline">Edit Venue</span>
                        <span className="md:hidden">Edit</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Top Right Corner - Additional info like venue cards */}
            <div className="absolute top-4 right-4 pointer-events-none">
              <div className="flex flex-col gap-2 items-end">
                {/* Could add additional badges here if needed */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Extension Table - Attached to hero */}
      <div className="bg-background md:bg-muted/30 shadow-sm md:rounded-b-lg border-0 md:border md:border-t-0 overflow-hidden mb-4 md:mb-8 relative z-10">
        {/* Row 1: Address + Google Maps */}
        <div className="px-4 py-4 md:px-6 border-b border-border bg-muted/30">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{venue.address}</div>
              <div>{venue.city}, {venue.country}</div>
            </div>
            <a
              href={
                venue.google_maps_url || 
                `https://maps.google.com/?q=${encodeURIComponent([venue.address, venue.city, venue.country].filter(Boolean).join(', '))}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors mt-0.5 shrink-0 text-xs font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Google Maps</span>
            </a>
          </div>
        </div>

        {/* Row 2: Brands & Ambiance in two columns */}
        {(venue.brands.length > 0 || venue.ambiance.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-px bg-border">
            {/* Brands Column */}
            <div className="px-4 py-4 md:px-6 bg-background">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-fit">Brands:</span>
                <div className="flex flex-wrap gap-1.5">
                  {venue.brands.length > 0 ? (
                    venue.brands.map((brand) => (
                      <Badge key={brand} className="text-sm bg-primary/15 text-primary border-primary/20 hover:bg-primary/25 px-3 py-1">
                        {brand}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">None listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ambiance Column */}
            <div className="px-4 py-4 md:px-6 bg-background border-t md:border-t-0 border-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-fit">Ambiance:</span>
                <div className="flex flex-wrap gap-1.5">
                  {venue.ambiance.length > 0 ? (
                    venue.ambiance.map((tag) => (
                      <Badge key={tag} className="text-sm bg-secondary/50 text-secondary-foreground border-secondary/30 hover:bg-secondary/60 px-3 py-1">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">None listed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

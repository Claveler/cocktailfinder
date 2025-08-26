"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Wine, DollarSign, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Venue } from "@/lib/venues";

interface VenueCardProps {
  venue: Venue;
  showDistance?: boolean;
  distance?: number; // in km
  onCardClick?: (venue: Venue) => void; // Optional click handler for map focus
  isSelected?: boolean; // Highlight when corresponding map pin is selected
}

export default function VenueCard({
  venue,
  showDistance = false,
  distance,
  onCardClick,
  isSelected = false,
}: VenueCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <Wine className="h-4 w-4" />;
      case "pub":
        return <Wine className="h-4 w-4" />;
      case "liquor_store":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Wine className="h-4 w-4" />;
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

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(venue);
    }
  };

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking navigation icon
  };

  // Generate card classes with optional selection highlighting
  const getCardClasses = () => {
    const baseClasses = "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden";
    const selectedClasses = isSelected ? "ring-2 ring-primary border-primary shadow-lg" : "";
    return `${baseClasses} ${selectedClasses}`.trim();
  };

  const cardContent = (
    <div className="overflow-hidden">
      {/* Photo Section with Overlay Info */}
      <div className="relative h-48 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {venue.photos && venue.photos.length > 0 ? (
            <img
              src={venue.photos[0]}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <Wine className="w-12 h-12 text-white opacity-40" />
            </div>
          )}
          
          {/* Enhanced Gradient Overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Navigation Icon - Only show when onCardClick is present */}
        {onCardClick && (
          <Link 
            href={`/venues/${venue.id}`}
            onClick={handleNavigateClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all duration-200 rounded-full p-2.5 group"
          >
            <ChevronRight className="h-4 w-4 text-white group-hover:text-white/90 group-hover:translate-x-0.5 transition-all duration-200" />
          </Link>
        )}

        {/* Overlaid Content */}
        <div className="relative h-full p-4 flex flex-col justify-between text-white">
          {/* Top Row - Status badges */}
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              {showDistance && distance !== undefined && (
                <Badge className="text-xs bg-black/60 backdrop-blur-sm text-white border-white/20 hover:bg-black/70">
                  {distance.toFixed(1)} km
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {venue.photos && venue.photos.length > 1 && (
                <Badge className="text-xs bg-black/60 backdrop-blur-sm text-white border-white/20">
                  +{venue.photos.length - 1} photos
                </Badge>
              )}
              <Badge className="text-xs bg-black/60 backdrop-blur-sm text-white border-white/20">
                <Clock className="h-3 w-3 mr-1" />
                Open Now
              </Badge>
            </div>
          </div>

          {/* Bottom Row - Venue Name & Type */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg mb-1 line-clamp-2 text-white drop-shadow-lg">
              {venue.name}
            </h3>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                {getTypeIcon(venue.type)}
                <span className="text-white/90">{getTypeLabel(venue.type)}</span>
                {venue.price_range && (
                  <>
                    <span className="text-white/70">•</span>
                    <span className="font-medium text-green-300">
                      {getPriceRangeDisplay(venue.price_range)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solid Background Section - Detailed Info */}
      <CardContent className="p-4 bg-card">
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{venue.address}</div>
            <div>{venue.city}, {venue.country}</div>
          </div>
        </div>

        {/* Brands */}
        {venue.brands && venue.brands.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {venue.brands.slice(0, 3).map((brand, index) => (
                <Badge key={index} className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {brand}
                </Badge>
              ))}
              {venue.brands.length > 3 && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  +{venue.brands.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Rating & Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">4.5</span>
            <span className="text-xs text-muted-foreground ml-1">(24 reviews)</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Added {new Date(venue.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </div>
  );

  // If no onCardClick handler, wrap entire card with Link (original behavior)
  if (!onCardClick) {
    return (
      <Link href={`/venues/${venue.id}`} className="block">
        <Card className={getCardClasses()}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  // If onCardClick handler exists, use new interactive behavior
  return (
    <Card 
      className={getCardClasses()} 
      onClick={handleCardClick}
    >
      {cardContent}
    </Card>
  );
}

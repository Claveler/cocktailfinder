"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wine, DollarSign, ChevronRight, CheckCircle, XCircle, HelpCircle, AlertCircle, Users, ExternalLink, Shield, Calendar } from "lucide-react";
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

  const getPiscoStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "unavailable":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "temporarily_out":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: // unverified
        return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPiscoStatusText = (status: string) => {
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
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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
    return baseClasses;
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
          {/* Top Row - Location indicators */}
          <div className="flex items-start justify-between">
            {showDistance && distance !== undefined && (
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-black/60 backdrop-blur-sm text-white border-white/20 hover:bg-black/70">
                  {distance.toFixed(1)} km
                </Badge>
                {isSelected && (
                  <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-medium">Closest</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Pisco Status moved to top for prominence */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {getPiscoStatusIcon(venue.pisco_status)}
              <span className="text-xs text-white font-medium">
                {venue.pisco_status === "available" ? "Pisco Available" : 
                 venue.pisco_status === "unavailable" ? "No Pisco" :
                 venue.pisco_status === "temporarily_out" ? "Temporarily Out" : "Status Unknown"}
              </span>
            </div>
          </div>

          {/* Bottom Row - Venue Name & Type with more space */}
          <div className="space-y-3">
            <h3 className="font-bold text-xl leading-tight line-clamp-2 text-white drop-shadow-lg">
              {venue.name}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
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
            </div>
          </div>
        </div>
      </div>

      {/* Solid Background Section - Detailed Info */}
      <CardContent className="p-4 bg-card">
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{venue.address}</div>
            <div>{venue.city}, {venue.country}</div>
          </div>
          {venue.google_maps_url && (
            <Link 
              href={venue.google_maps_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors mt-0.5 shrink-0 text-xs font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Google Maps</span>
            </Link>
          )}
        </div>

        {/* Brands */}
        {venue.brands && venue.brands.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {venue.brands.slice(0, 4).map((brand, index) => (
                <Badge key={index} className="text-sm bg-primary/15 text-primary border-primary/20 hover:bg-primary/25 px-3 py-1">
                  {brand}
                </Badge>
              ))}
              {venue.brands.length > 4 && (
                <Badge className="text-sm bg-muted text-muted-foreground px-3 py-1">
                  +{venue.brands.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Verification Details - Three Column Layout */}
        {(venue.unique_verifiers ?? 0) > 0 && venue.last_verified && (
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-xs mb-3">
              {/* Column 1: Verifiers - Left Aligned */}
              <div className="flex items-center justify-start gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {venue.unique_verifiers}
                </span>
              </div>
              
              {/* Column 2: Verification Rate - Center Aligned */}
              <div className="flex items-center justify-center gap-1.5 text-green-600">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-semibold">
                  {(venue.total_verifications ?? 0) > 0 ? 
                    `${Math.round(((venue.positive_verifications || 0) / (venue.total_verifications || 1)) * 100)}%` : 
                    '0%'
                  }
                </span>
              </div>
              
              {/* Column 3: Last Verification Date - Right Aligned */}
              <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {formatDate(venue.last_verified)}
                </span>
              </div>
            </div>
            
            {/* Community Notes - More prominent */}
            {venue.pisco_notes && venue.verified_by && (
              <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3 mt-2">
                <div className="text-xs text-foreground/90 italic">
                  "{venue.pisco_notes}"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  — {venue.verified_by}
                </div>
              </div>
            )}
          </div>
        )}
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

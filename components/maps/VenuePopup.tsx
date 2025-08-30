"use client";

import { memo } from "react";
import { Martini, Beer, Store, UtensilsCrossed, MapPin, ExternalLink, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getVenueGoogleMapsUrl } from "@/lib/maps";
import Link from "next/link";

interface VenuePopupProps {
  venue: {
    id: string;
    name: string;
    type?: string;
    address?: string;
    city?: string;
    country?: string;
    brands?: string[];
    photos?: string[];
    google_maps_url?: string | null;
    location: {
      lat: number;
      lng: number;
    };
  };

}

const VenuePopup = memo(function VenuePopup({ venue }: VenuePopupProps) {
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "bar":
        return <Martini className="h-3 w-3" />;
      case "pub":
        return <Beer className="h-3 w-3" />;
      case "liquor_store":
        return <Store className="h-3 w-3" />;
      case "restaurant":
        return <UtensilsCrossed className="h-3 w-3" />;
      default:
        return <Martini className="h-3 w-3" />;
    }
  };

  const getTypeLabel = (type?: string) => {
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
        return type || "Venue";
    }
  };

  // Use the utility function for Google Maps URL
  const googleMapsUrl = getVenueGoogleMapsUrl(venue);

  return (
    <div className="venue-popup max-w-xs" data-venue-id={venue.id}>
      {/* Venue Info */}
      <div className="space-y-3">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-sm leading-tight text-gray-900">
            {venue.name}
          </h3>
          
          <div className="flex items-center gap-1 mt-1">
            {getTypeIcon(venue.type)}
            <span className="text-xs text-gray-600">{getTypeLabel(venue.type)}</span>
          </div>
        </div>

        {/* Address */}
        {venue.address && (
          <div className="flex items-start gap-1">
            <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-600 leading-tight">
              <div>{venue.address}</div>
              {venue.city && venue.country && (
                <div>{venue.city}, {venue.country}</div>
              )}
            </div>
          </div>
        )}

        {/* Brands */}
        {venue.brands && venue.brands.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {venue.brands.slice(0, 2).map((brand, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                {brand}
              </Badge>
            ))}
            {venue.brands.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                +{venue.brands.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 px-1.5 py-0.5 h-auto">
            <Clock className="h-2.5 w-2.5 mr-1" />
            Open Now
          </Badge>
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">4.5</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 pb-1">
          <Button asChild size="sm" className="h-8 text-xs flex-1 venue-popup-primary-btn">
            <Link href={`/venues/${venue.id}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs flex-1 venue-popup-outline-btn"
          >
            <a 
              href={googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Maps
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default VenuePopup;

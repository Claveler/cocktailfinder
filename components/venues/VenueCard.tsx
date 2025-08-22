import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Wine, DollarSign } from "lucide-react";
import Link from "next/link";
import type { Venue } from "@/lib/venues";

interface VenueCardProps {
  venue: Venue;
  showDistance?: boolean;
  distance?: number; // in km
}

export default function VenueCard({
  venue,
  showDistance = false,
  distance,
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

  return (
    <Link href={`/venues/${venue.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
              {venue.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getTypeIcon(venue.type)}
              <span>{getTypeLabel(venue.type)}</span>
              {venue.price_range && (
                <>
                  <span>•</span>
                  <span className="font-medium text-green-600">
                    {getPriceRangeDisplay(venue.price_range)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-col gap-1">
            {showDistance && distance !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {distance.toFixed(1)} km
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Open Now
            </Badge>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <div>{venue.address}</div>
            <div>
              {venue.city}, {venue.country}
            </div>
          </div>
        </div>

        {/* Brands */}
        {venue.brands && venue.brands.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">
              Featured Brands:
            </div>
            <div className="flex flex-wrap gap-1">
              {venue.brands.slice(0, 3).map((brand, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {brand}
                </Badge>
              ))}
              {venue.brands.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{venue.brands.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Ambiance */}
        {venue.ambiance && venue.ambiance.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">Ambiance:</div>
            <div className="flex flex-wrap gap-1">
              {venue.ambiance.slice(0, 2).map((amb, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amb}
                </Badge>
              ))}
              {venue.ambiance.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{venue.ambiance.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Photo count */}
        {venue.photos && venue.photos.length > 0 && (
          <div className="text-xs text-muted-foreground">
            📸 {venue.photos.length} photo{venue.photos.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Rating placeholder */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="text-sm font-medium">4.5</span>
            <span className="text-xs text-muted-foreground ml-1">
              (24 reviews)
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Added {new Date(venue.created_at).toLocaleDateString()}
          </div>
        </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import Image from "next/image";
import InteractiveVenueExplorer from "@/components/venues/InteractiveVenueExplorer";
import HomePageClient from "@/app/HomePageClient";
import { createClient } from "@/lib/supabase/server";
import type { Venue as VenueType } from "@/lib/venues";

// Configuration for location-based venue filtering
const VENUE_SEARCH_RADIUS_KM = Number(process.env.NEXT_PUBLIC_VENUE_SEARCH_RADIUS_KM) || 10; // Default radius in kilometers
const VENUE_POOL_SIZE = 100; // Fetch more venues for better location filtering

// Function to fetch venues for location-aware homepage
async function getVenuesForLocationFiltering(): Promise<VenueType[]> {
  try {
    const supabase = createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*, latitude, longitude")
      .eq("status", "approved")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(VENUE_POOL_SIZE); // Fetch more venues for location filtering

    if (error) {
      console.error("Error fetching venues:", error);
      return [];
    }

    if (!venues || venues.length === 0) {
      return [];
    }

    // Transform to match our interface
    return venues.map((venue: any) => ({
      ...venue,
      location:
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null,
    }));
  } catch (error) {
    console.error("Unexpected error fetching venues:", error);
    return [];
  }
}

export default async function Home() {
  // Fetch venues for interactive filtering
  const availableVenues = await getVenuesForLocationFiltering();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[320px] md:h-[380px] lg:h-[400px] flex items-center overflow-hidden">
        {/* Full Viewport Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/piscolahero.png"
            alt="Piscola - Chilean cocktail"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Simple dark overlay for text legibility */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="container mx-auto">
            <div className="max-w-xl md:max-w-2xl lg:max-w-3xl">
              <HomePageClient delay={0}>
                <h1 className="text-4xl lg:text-6xl font-bold mb-4 md:mb-6 text-white leading-tight">
                  A Taste of Chile,
                  <br />
                  <span className="text-white/90">Wherever You Are</span>
                </h1>
                <p className="text-sm text-white/90 mb-6 md:mb-8 max-w-xl leading-relaxed">
                  Discover the best venues to enjoy pisco in your city. From
                  speakeasies to rooftop bars, find your perfect drink destination.
                </p>

                {/* Search CTA */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter your location..." 
                      className="pl-10 bg-white/95 backdrop-blur-sm border-white/20 text-foreground h-11 md:h-12" 
                    />
                  </div>
                  <Button size="lg" className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 md:px-6 lg:px-8 h-11 md:h-12">
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Venues
                  </Button>
                </div>
              </HomePageClient>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map and Venues Section */}
      <section className="py-8 md:py-12 lg:py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 md:mb-12">
            Explore Venues Near You
          </h2>

          {/* Interactive Venue Explorer with Map */}
          <InteractiveVenueExplorer 
            allVenues={availableVenues}
            maxDistanceKm={VENUE_SEARCH_RADIUS_KM}
            fallbackCenter={[51.5261617, -0.1633234]} // London Business School as fallback (LBS easter egg! 🎓)
            fallbackZoom={13}
          />
        </div>
      </section>
    </div>
  );
}

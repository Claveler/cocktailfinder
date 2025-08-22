import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import Image from "next/image";
import Map, { type Venue } from "@/components/maps/Map";
import VenueCard from "@/components/venues/VenueCard";
import HomePageClient from "@/app/HomePageClient";
import { createClient } from "@/lib/supabase/server";
import type { Venue as VenueType } from "@/lib/venues";

// Function to fetch random venues for homepage
async function getRandomVenues(count: number = 3): Promise<VenueType[]> {
  try {
    const supabase = createClient();

    const { data: venues, error } = await supabase
      .from("venues")
      .select("*, latitude, longitude")
      .eq("status", "approved")
      .limit(50); // Fetch more to have a good selection

    if (error) {
      console.error("Error fetching random venues:", error);
      return [];
    }

    if (!venues || venues.length === 0) {
      return [];
    }

    // Shuffle and pick random venues
    const shuffled = venues.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // Transform to match our interface
    return selected.map((venue: any) => ({
      ...venue,
      location:
        venue.latitude && venue.longitude
          ? { lat: venue.latitude, lng: venue.longitude }
          : null,
    }));
  } catch (error) {
    console.error("Unexpected error fetching random venues:", error);
    return [];
  }
}

export default async function Home() {
  // Fetch random venues for featured section
  const featuredVenues = await getRandomVenues(3);

  // Sample venue data for map preview
  const sampleVenues: Venue[] = [
    {
      id: "1",
      name: "The Speakeasy",
      location: { lat: 40.7589, lng: -73.9851 }, // Times Square area
      status: "approved",
    },
    {
      id: "2",
      name: "Rooftop Cocktail Lounge",
      location: { lat: 40.7505, lng: -73.9934 }, // Herald Square area
      status: "approved",
    },
    {
      id: "3",
      name: "Classic Martini Bar",
      location: { lat: 40.7614, lng: -73.9776 }, // Midtown East
      status: "approved",
    },
    {
      id: "4",
      name: "Modern Mixology",
      location: { lat: 40.7549, lng: -73.984 }, // Near Bryant Park
      status: "approved",
    },
    {
      id: "5",
      name: "Pending Venue", // This shouldn't show on map
      location: { lat: 40.748, lng: -73.9857 },
      status: "pending",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full aspect-[4/3] md:aspect-[5/2] lg:aspect-[16/5] flex items-center overflow-hidden">
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
            <div className="max-w-2xl">
              <HomePageClient delay={0}>
                <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 text-white leading-tight">
                  A Taste of Chile,
                  <br />
                  <span className="text-white/90">Wherever You Are</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 max-w-xl leading-relaxed">
                  Discover the best venues to enjoy pisco in your city. From
                  speakeasies to rooftop bars, find your perfect drink destination.
                </p>

                {/* Search CTA */}
                <div className="flex flex-col md:flex-row gap-4 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter your location..." 
                      className="pl-10 bg-white/95 backdrop-blur-sm border-white/20 text-foreground h-12" 
                    />
                  </div>
                  <Button size="lg" className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 lg:px-8 h-12">
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Venues
                  </Button>
                </div>
              </HomePageClient>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section Placeholder */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Explore Venues Near You
          </h2>

          {/* Interactive Map */}
          <Card className="w-full h-96 mb-8 overflow-hidden">
            <CardContent className="p-0 h-full">
              <Map
                venues={sampleVenues}
                height="100%"
                center={[40.7589, -73.9851]} // NYC center
                zoom={13}
              />
            </CardContent>
          </Card>

          {/* Featured Venues Preview */}
          <div className="grid md:grid-cols-3 gap-6">
            {featuredVenues.length > 0 ? (
              featuredVenues.map((venue, index) => (
                <HomePageClient key={venue.id} delay={index * 0.1}>
                  <VenueCard venue={venue} />
                </HomePageClient>
              ))
            ) : (
              // Fallback content if no venues found
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">
                  No venues available yet. Be the first to add one!
                </p>
                <Button asChild className="mt-4">
                  <a href="/venues/new">Add First Venue</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

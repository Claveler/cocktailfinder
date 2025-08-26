"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";
import Image from "next/image";
import LocationSearch from "@/components/search/LocationSearch";
import InteractiveVenueExplorer from "@/components/venues/InteractiveVenueExplorer";
import HomePageClient from "@/app/HomePageClient";
import BottomNavBar from "@/components/mobile/BottomNavBar";
import type { Venue as VenueType } from "@/lib/venues";

interface LandingPageClientProps {
  allVenues: VenueType[];
  maxDistanceKm: number;
}

export default function LandingPageClient({
  allVenues,
  maxDistanceKm,
}: LandingPageClientProps) {
  const [searchLocation, setSearchLocation] = useState<[number, number] | null>(null);

  const handleLocationFound = (coordinates: [number, number], locationName: string) => {
    setSearchLocation(coordinates);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Hidden on Mobile */}
      <section className="hidden md:flex relative w-full h-[320px] md:h-[380px] lg:h-[400px] items-center" style={{ overflow: 'visible' }}>
        {/* Full Viewport Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
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
                <LocationSearch onLocationFound={handleLocationFound} />
              </HomePageClient>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map and Venues Section */}
      <section className="py-0 md:py-8 px-0 md:px-4 bg-transparent md:bg-muted/30 min-h-screen md:h-auto">
        <div className="md:container mx-auto w-full">
          {/* Interactive Venue Explorer with Map */}
          <InteractiveVenueExplorer 
            allVenues={allVenues}
            maxDistanceKm={maxDistanceKm}
            fallbackCenter={[51.5261617, -0.1633234]} // London Business School as fallback (LBS easter egg! 🎓)
            searchLocation={searchLocation}
          />
        </div>
      </section>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar onLocationFound={handleLocationFound} />
    </div>
  );
}

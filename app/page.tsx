"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Map, { type Venue } from "@/components/maps/Map";

export default function Home() {
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
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Find Amazing Piscola Venues
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the best venues to enjoy Piscola in your city. From
              speakeasies to rooftop bars, find your perfect drink destination.
            </p>

            {/* Search CTA */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Enter your location..." className="pl-10" />
              </div>
              <Button size="lg" className="shrink-0">
                <MapPin className="mr-2 h-4 w-4" />
                Find Venues
              </Button>
            </div>
          </motion.div>
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
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold">
                        Example Cocktail Bar {i}
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground ml-1">
                          4.{5 + i}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Experience crafted cocktails in a sophisticated atmosphere
                      with expert mixologists.
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        Downtown District
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        Open Now
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

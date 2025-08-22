"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
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
              Find Amazing Cocktail Venues
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the best cocktail bars and lounges in your city. From
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

          {/* Map Placeholder */}
          <Card className="w-full h-96 mb-8">
            <CardContent className="h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Interactive Map Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  Browse cocktail venues on an interactive map
                </p>
              </div>
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

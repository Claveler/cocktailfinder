"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wine,
  Users,
  MapPin,
  Clock,
  Star,
  Martini,
  Flag,
  Droplets,
  Sparkles,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WhatIsPiscola() {
  // Fixed viewport height for mobile to prevent browser bar resize issues
  const [fixedMobileHeight, setFixedMobileHeight] = useState<number | null>(
    null
  );

  // Capture initial viewport height on mobile to prevent browser bar resize issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;

      if (isMobile && fixedMobileHeight === null) {
        // Capture the full viewport height for the hero section
        const calculatedHeight = window.innerHeight;
        setFixedMobileHeight(calculatedHeight);
      }
    }
  }, [fixedMobileHeight]);

  // Calculate hero height: fixed on mobile, dynamic on desktop
  const getHeroHeight = () => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth <= 768 &&
      fixedMobileHeight !== null
    ) {
      return `${fixedMobileHeight}px`;
    }
    return "100vh"; // Dynamic on desktop
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{ height: getHeroHeight() }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/piscoscientist.png"
            alt="Pisco Scientist - Expert in Chilean piscola culture"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/90 text-gray-900 border-0"
          >
            Chilean Culture
          </Badge>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 drop-shadow-2xl">
            What is <span className="text-primary">Piscola</span>?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Discover Chile's most beloved cocktail - a perfect blend of
            tradition, simplicity, and social connection that has captivated a
            nation.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-12">
          {/* The Basics */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Wine className="h-8 w-8 text-primary" />
                The Perfect Mix
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-8 leading-relaxed text-center">
                <strong className="text-foreground">Piscola</strong> is Chile's
                national cocktail - a wonderfully simple yet profound
                combination of just two ingredients:
              </p>

              <div className="grid md:grid-cols-2 gap-8 items-start mb-8">
                <div className="bg-secondary p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-foreground mb-4 text-lg">
                    The Recipe
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold text-foreground">
                          Chilean Pisco
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          - A grape brandy with protected origin
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <span className="font-semibold text-foreground">
                          Coca-Cola
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          - The perfect sweet, effervescent partner
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary p-8 rounded-2xl text-center border border-border">
                  <Martini className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold text-foreground mb-2">
                    Pisco + Cola
                  </p>
                  <p className="text-muted-foreground">
                    Simple. Perfect. Chilean.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed text-center">
                Served over ice with a slice of lemon, this humble drink
                represents the essence of Chilean hospitality and social life.
              </p>
            </CardContent>
          </Card>

          {/* Cultural Significance */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-8 w-8 text-primary" />
                More Than Just a Drink
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-secondary rounded-lg border border-border">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    National Identity
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Piscola is deeply woven into Chilean culture, representing
                    unity across social classes and generations.
                  </p>
                </div>

                <div className="text-center p-6 bg-secondary rounded-lg border border-border">
                  <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    Social Moments
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    From family gatherings to celebrations, piscola marks
                    Chile's most important social occasions.
                  </p>
                </div>

                <div className="text-center p-6 bg-secondary rounded-lg border border-border">
                  <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    Cultural Pride
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    This drink represents Chilean ingenuity - taking something
                    traditional and making it uniquely their own.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pisco Heritage */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">The Heart of Pisco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground mb-6">
                  Pisco isn't just any spirit - it's Chile's national drink with
                  centuries of heritage. Made from specific grape varieties
                  grown in Chile's northern valleys, pisco carries the essence
                  of Chilean terroir in every bottle.
                </p>

                <div className="bg-secondary p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-lg mb-3 text-foreground">
                    Did You Know?
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      • Pisco production in Chile dates back to the 16th century
                    </li>
                    <li>
                      • Chilean pisco is made from 8 specific grape varieties
                    </li>
                    <li>
                      • The Atacama and Coquimbo regions produce the finest
                      pisco
                    </li>
                    <li>
                      • Piscola became popular in the 1970s and never looked
                      back
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection to Our Mission */}
          <Card
            id="why-piscola-net"
            className="shadow-lg bg-secondary border border-border scroll-mt-20"
          >
            <CardHeader>
              <CardTitle className="text-2xl text-center text-foreground">
                Why We Celebrate Piscola
              </CardTitle>
            </CardHeader>
            <CardContent className="text-left">
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Piscola.net was born from a very simple yet personal need:
                  finding pisco outside of Chile is far more difficult than it
                  should be. My journey abroad made this reality clear to me. As
                  an exchange student in the United States, I often looked for
                  ways to share Chilean culture with friends but quickly
                  realized that pisco was nearly impossible to find. Later,
                  during my work and holiday visa in Australia, I experienced
                  the same frustration. The pattern repeated itself while
                  studying for my MBA in the UK, and continues today as I live
                  in Spain. Each place reinforced the same truth: pisco, one of
                  Chile's most emblematic spirits, was missing when I needed it
                  most.
                </p>

                <p>
                  My connection to pisco started much earlier, during my youth.
                  In Chile, and especially during my formative years studying at
                  university in Valparaíso, the piscola was more than just a
                  drink. It was a social bridge, a way to connect, to make new
                  friends, and to celebrate life's milestones. Sharing a piscola
                  was part of the typical Chilean experience—something familiar,
                  unpretentious, and deeply tied to our sense of belonging. It
                  carried with it not just a taste, but the feeling of home.
                </p>

                <p>
                  Piscola.net exists to bring that feeling closer to Chileans
                  abroad and to anyone curious about discovering our culture. It
                  is more than just a directory—it's a way to make sure that no
                  matter where you are in the world, you can find pisco and
                  enjoy a taste of Chile when you need it most.
                </p>
                <p>
                  At its heart, Piscola.net is about connection: to our roots,
                  to our traditions, and to the people we share them with.{" "}
                  <b>A Piscola Network.</b>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button asChild size="lg">
                  <Link href="/">Find Piscola Near You</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/venues/new">Add a Venue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fun Facts */}
      <section className="py-16 px-4 bg-secondary">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Fun Piscola Facts
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-md text-center border border-border">
              <Flag className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2 text-foreground">National Drink</h3>
              <p className="text-sm text-muted-foreground">
                Piscola is considered Chile's unofficial national cocktail
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md text-center border border-border">
              <Wine className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2 text-foreground">
                Simple Perfection
              </h3>
              <p className="text-sm text-muted-foreground">
                Just 2 ingredients, but endless variations in preparation
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md text-center border border-border">
              <Droplets className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2 text-foreground">
                Lemon Essential
              </h3>
              <p className="text-sm text-muted-foreground">
                A slice of lemon adds the perfect acidic balance
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md text-center border border-border">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2 text-foreground">Party Starter</h3>
              <p className="text-sm text-muted-foreground">
                No Chilean celebration is complete without piscola
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md text-center border border-border">
              <Users className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2 text-foreground">Social Glue</h3>
              <p className="text-sm text-muted-foreground">
                Brings people together across all social boundaries
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md text-center border border-border">
              <Globe className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-2 text-foreground">
                Global Recognition
              </h3>
              <p className="text-sm text-muted-foreground">
                Chilean bars worldwide proudly serve authentic piscola
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

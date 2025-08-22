"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wine, MapPin, Plus, Globe } from "lucide-react";
import AuthButton from "./AuthButton";

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Wine className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">CocktailFinder</span>
        </Link>

        {/* Main Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/venues"
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <MapPin className="h-4 w-4" />
            <span>Venues</span>
          </Link>
          <Link
            href="/add-venue"
            className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Add venue</span>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Language Toggle Placeholder */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Globe className="h-4 w-4 mr-2" />
            <span>EN</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              Soon
            </Badge>
          </Button>

          {/* Auth Button */}
          <AuthButton />
        </div>

        {/* Mobile menu button (placeholder) */}
        <div className="md:hidden">
          <Button variant="ghost" size="sm">
            <span className="sr-only">Open menu</span>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>
      </div>
    </nav>
  );
}

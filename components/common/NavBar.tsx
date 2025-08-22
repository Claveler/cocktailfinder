"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Globe, Menu, X } from "lucide-react";
import AuthButton from "./AuthButton";
import { useState, useEffect } from "react";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    const handleResize = () => {
      // Close mobile menu on desktop breakpoint
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-16 px-4">
        {/* Desktop Layout - Three Section Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:items-center h-full">
          {/* Left Section - Logo */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/Piscola SVG.svg"
                alt="Piscola Logo"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Center Section - Main Navigation */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-6">
              <Link
                href="/venues"
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <MapPin className="h-4 w-4" />
                <span>Venues</span>
              </Link>
              <Link
                href="/venues/new"
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                <span>Add venue</span>
              </Link>
            </div>
          </div>

          {/* Right Section - i18n + Auth */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-4">
              {/* Language Toggle Placeholder */}
              <Button variant="ghost" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                <span>EN</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Soon
                </Badge>
              </Button>

              {/* Auth Button */}
              <AuthButton />
            </div>
          </div>
        </div>

        {/* Mobile Layout - Traditional Flex */}
        <div className="flex lg:hidden h-full items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/Piscola SVG.svg"
              alt="Piscola Logo"
              width={150}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Mobile Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Language Toggle - Hidden on very small screens */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Globe className="h-4 w-4 mr-1" />
              <span className="text-xs">EN</span>
            </Button>

            {/* Auth Button */}
            <AuthButton />

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
              <span className="sr-only">
                {isMobileMenuOpen ? "Close menu" : "Open menu"}
              </span>
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              {/* Navigation Links */}
              <Link
                href="/venues"
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={closeMobileMenu}
              >
                <MapPin className="h-4 w-4" />
                <span>Venues</span>
              </Link>
              <Link
                href="/venues/new"
                className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={closeMobileMenu}
              >
                <Plus className="h-4 w-4" />
                <span>Add venue</span>
              </Link>

              {/* Language Toggle - Mobile */}
              <div className="pt-4 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>EN</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Soon
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

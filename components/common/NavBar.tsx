"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Menu, X } from "lucide-react";
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

  // Close menu on escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";

      document.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", handleResize);

      return () => {
        // Restore body scroll when menu closes
        document.body.style.overflow = "unset";

        document.removeEventListener("keydown", handleEscape);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-[100] w-full border-b bg-card md:bg-card/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto h-16 px-4">
        {/* Desktop Layout - Three Section Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:items-center h-full">
          {/* Left Section - Logo */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center">
              <img
                src="/assets/piscola-logo.svg"
                alt="Piscola Logo"
                style={{ height: "2.5rem", width: "auto" }}
                className="shadow-sm"
              />
            </Link>
          </div>

          {/* Center Section - Main Navigation */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-6">
              <Link
                href="/about/what-is-piscola"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                What is piscola?
              </Link>
              <Link
                href="/about/what-is-piscola#why-piscola-net"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Why Piscola.net?
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
            <img
              src="/assets/piscola-logo.svg"
              alt="Piscola Logo"
              style={{ height: "2rem", width: "auto" }}
              className="shadow-sm max-w-[50vw]"
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-[90]"
            onClick={closeMobileMenu}
          />

          {/* Mobile Menu Panel */}
          <div className="lg:hidden fixed top-16 left-0 right-0 bg-card border-t shadow-lg z-[95] animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {/* Navigation Links */}
                <Link
                  href="/about/what-is-piscola"
                  className="text-sm font-medium transition-colors hover:text-primary py-2 block"
                  onClick={closeMobileMenu}
                >
                  What is piscola?
                </Link>
                <Link
                  href="/about/what-is-piscola#why-piscola-net"
                  className="text-sm font-medium transition-colors hover:text-primary py-2 block"
                  onClick={closeMobileMenu}
                >
                  Why Piscola.net?
                </Link>

                {/* Language Toggle - Mobile */}
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
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
        </>
      )}
    </nav>
  );
}

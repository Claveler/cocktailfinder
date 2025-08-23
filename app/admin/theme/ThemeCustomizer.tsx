"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Palette, RotateCcw, Save, Shuffle } from "lucide-react";
import VenueCard from "@/components/venues/VenueCard";
import type { Venue } from "@/lib/venues";

interface ColorConfig {
  primary: string;
  foreground: string;
  background: string;
  card: string;
  textAccent: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
}

const DEFAULT_COLORS: ColorConfig = {
  primary: "#d32117", // Logo red
  foreground: "#301718", // Logo brown
  background: "#f4f5f7", // Light gray page background
  card: "#ffffff", // White card background
  textAccent: "#ffffff", // White text for dark backgrounds
  secondary: "#f5f2f2", // Light brown tint
  accent: "#d32117", // Logo red
  muted: "#faf9f9", // Very light brown
  border: "#e5dede", // Light brown border
};

export default function ThemeCustomizer() {
  const [colors, setColors] = useState<ColorConfig>(DEFAULT_COLORS);
  const [isApplying, setIsApplying] = useState(false);
  const [sampleVenue, setSampleVenue] = useState<Venue | null>(null);
  const [isLoadingVenue, setIsLoadingVenue] = useState(true);

  // Fetch random venue for preview
  const fetchRandomVenue = async () => {
    setIsLoadingVenue(true);
    try {
      const response = await fetch("/api/venues/random");
      if (response.ok) {
        const venue = await response.json();
        setSampleVenue(venue);
      } else {
        console.error("Failed to fetch random venue");
      }
    } catch (error) {
      console.error("Error fetching random venue:", error);
    } finally {
      setIsLoadingVenue(false);
    }
  };

  // Load saved colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem("piscola-theme-colors");
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        
        // Handle backward compatibility for new color properties
        const colorsWithDefaults = {
          ...DEFAULT_COLORS,
          ...parsed,
          // If card color doesn't exist, use background (old behavior)
          card: parsed.card || parsed.background || DEFAULT_COLORS.card,
          // If textAccent doesn't exist, use default white
          textAccent: parsed.textAccent || DEFAULT_COLORS.textAccent,
        };
        
        setColors(colorsWithDefaults);
        applyColors(colorsWithDefaults);
      } catch (error) {
        console.error("Error loading saved colors:", error);
      }
    } else {
      // Apply default colors on first load
      applyColors(DEFAULT_COLORS);
    }
  }, []);

  // Load random venue on mount
  useEffect(() => {
    fetchRandomVenue();
  }, []);

  // Convert hex to HSL
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Apply colors to CSS custom properties
  const applyColors = (colorConfig: ColorConfig) => {
    const root = document.documentElement;

    // Core colors
    root.style.setProperty("--primary", hexToHsl(colorConfig.primary));
    root.style.setProperty("--foreground", hexToHsl(colorConfig.foreground));
    root.style.setProperty("--background", hexToHsl(colorConfig.background));
    root.style.setProperty("--secondary", hexToHsl(colorConfig.secondary));
    root.style.setProperty("--accent", hexToHsl(colorConfig.accent));
    root.style.setProperty("--muted", hexToHsl(colorConfig.muted));
    root.style.setProperty("--border", hexToHsl(colorConfig.border));
    root.style.setProperty("--input", hexToHsl(colorConfig.muted));
    root.style.setProperty("--ring", hexToHsl(colorConfig.primary));

    // Card colors (now separate from background)
    root.style.setProperty("--card", hexToHsl(colorConfig.card));
    root.style.setProperty(
      "--card-foreground",
      hexToHsl(colorConfig.foreground)
    );

    // Popover colors (use card color for consistency)
    root.style.setProperty("--popover", hexToHsl(colorConfig.card));
    root.style.setProperty(
      "--popover-foreground",
      hexToHsl(colorConfig.foreground)
    );

    // Foreground colors for UI elements (use textAccent for stability)
    root.style.setProperty(
      "--primary-foreground",
      hexToHsl(colorConfig.textAccent)
    );
    root.style.setProperty(
      "--secondary-foreground",
      hexToHsl(colorConfig.foreground)
    );
    root.style.setProperty(
      "--accent-foreground",
      hexToHsl(colorConfig.textAccent)
    );
    root.style.setProperty(
      "--muted-foreground",
      hexToHsl(colorConfig.foreground)
    );
  };

  const handleColorChange = (colorKey: keyof ColorConfig, value: string) => {
    const newColors = { ...colors, [colorKey]: value };
    setColors(newColors);

    // Apply colors immediately for live preview (now safe!)
    applyColors(newColors);
  };

  const saveColors = () => {
    setIsApplying(true);

    // Save colors to localStorage (colors already applied for live preview)
    localStorage.setItem("piscola-theme-colors", JSON.stringify(colors));

    // Simulate API call delay
    setTimeout(() => {
      setIsApplying(false);
    }, 500);
  };

  const resetToDefault = () => {
    setColors(DEFAULT_COLORS);
    applyColors(DEFAULT_COLORS);
    localStorage.removeItem("piscola-theme-colors");
  };

  // Helper function to create working color picker (inline version)
  const createColorPicker = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    description?: string
  ) => {
    const colorInputId = `color-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const textInputId = `text-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="space-y-2" key={label}>
        <Label htmlFor={colorInputId} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="flex items-center space-x-3">
          <input
            id={colorInputId}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: "64px", height: "40px" }}
            className="border border-border rounded cursor-pointer"
            title={`Select ${label.toLowerCase()}`}
          />

          <Input
            id={textInputId}
            type="text"
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                onChange(newValue);
              }
            }}
            onKeyDown={(e) => {
              const allowedKeys = [
                "Backspace",
                "Delete",
                "Tab",
                "Escape",
                "Enter",
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
              ];
              const isHexChar = /[0-9A-Fa-f#]/.test(e.key);

              if (!allowedKeys.includes(e.key) && !isHexChar) {
                e.preventDefault();
              }
            }}
            placeholder="#000000"
            className="font-mono text-sm flex-1"
            maxLength={7}
          />

          <div
            className="w-10 h-10 rounded-md border border-border shadow-sm flex-shrink-0"
            style={{ backgroundColor: value }}
            title={`Preview: ${value}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your colors affect real components from your site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Real Venue Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Real Venue Card (from /venues)
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchRandomVenue}
                disabled={isLoadingVenue}
                className="text-xs"
              >
                <Shuffle className="h-3 w-3 mr-1" />
                {isLoadingVenue ? "Loading..." : "Another Example"}
              </Button>
            </div>

            {isLoadingVenue ? (
              <Card className="w-full max-w-none">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </Card>
            ) : sampleVenue ? (
              <div className="max-w-sm">
                <VenueCard venue={sampleVenue} />
              </div>
            ) : (
              <Card className="w-full max-w-none p-8 text-center text-muted-foreground">
                <Shuffle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sample venue available</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchRandomVenue}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </Card>
            )}
          </div>

          {/* Mock Navigation & Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Navigation & Actions
            </h4>
            <div className="flex flex-wrap gap-3">
              <Button>Add Venue</Button>
              <Button variant="outline">View on Map</Button>
              <Button variant="secondary">Filter</Button>
              <Button variant="ghost">Reset</Button>
            </div>
          </div>

          {/* Mock Content Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Content Areas
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h5 className="font-medium mb-2">Venue Details</h5>
                <p className="text-sm text-muted-foreground">
                  This shows how text appears on cards and content areas
                  throughout the site.
                </p>
              </Card>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>Status: Active</Badge>
                  <Badge variant="secondary">Rating: 4.5</Badge>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    Background and muted areas use these colors for subtle
                    emphasis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle>Color Configuration</CardTitle>
          <CardDescription>
            Customize the main colors of your application with live preview.
            Click "Save Changes" to persist your selections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {createColorPicker(
              "Primary Color",
              colors.primary,
              (value) => handleColorChange("primary", value),
              "Main brand color (buttons, links, highlights)"
            )}

            {createColorPicker(
              "Foreground Color",
              colors.foreground,
              (value) => handleColorChange("foreground", value),
              "Main text color"
            )}

            {createColorPicker(
              "Background Color",
              colors.background,
              (value) => handleColorChange("background", value),
              "Main page background color"
            )}

            {createColorPicker(
              "Card Color",
              colors.card,
              (value) => handleColorChange("card", value),
              "Card and content area background color"
            )}

            {createColorPicker(
              "Text Accent Color",
              colors.textAccent,
              (value) => handleColorChange("textAccent", value),
              "Text color for buttons and dark backgrounds"
            )}

            {createColorPicker(
              "Secondary Color",
              colors.secondary,
              (value) => handleColorChange("secondary", value),
              "Secondary elements and surfaces"
            )}

            {createColorPicker(
              "Accent Color",
              colors.accent,
              (value) => handleColorChange("accent", value),
              "Accent elements and highlights"
            )}

            {createColorPicker(
              "Muted Color",
              colors.muted,
              (value) => handleColorChange("muted", value),
              "Subtle backgrounds and muted elements"
            )}
          </div>

          <Separator />

          {createColorPicker(
            "Border Color",
            colors.border,
            (value) => handleColorChange("border", value),
            "Borders, dividers, and input outlines"
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={saveColors} disabled={isApplying}>
          <Save className="h-4 w-4 mr-2" />
          {isApplying ? "Saving..." : "Save Changes"}
        </Button>

        <Button variant="outline" onClick={resetToDefault}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Logo Colors
        </Button>
      </div>

      {/* Current Colors Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm font-mono">
            <div>
              Primary: <span className="text-primary">{colors.primary}</span>
            </div>
            <div>
              Foreground:{" "}
              <span style={{ color: colors.foreground }}>
                {colors.foreground}
              </span>
            </div>
            <div>Background: {colors.background}</div>
            <div>Card: {colors.card}</div>
            <div>
              Text Accent:{" "}
              <span style={{ color: colors.textAccent, backgroundColor: colors.primary, padding: '2px 4px', borderRadius: '2px' }}>
                {colors.textAccent}
              </span>
            </div>
            <div>
              Secondary:{" "}
              <span style={{ color: colors.secondary }}>
                {colors.secondary}
              </span>
            </div>
            <div>
              Accent:{" "}
              <span style={{ color: colors.accent }}>{colors.accent}</span>
            </div>
            <div>
              Muted: <span style={{ color: colors.muted }}>{colors.muted}</span>
            </div>
            <div>
              Border:{" "}
              <span style={{ color: colors.border }}>{colors.border}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

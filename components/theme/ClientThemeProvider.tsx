"use client";

import { useEffect } from "react";

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

export default function ClientThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const applyThemeColors = (colors: ColorConfig) => {
      const root = document.documentElement;

      // Apply core colors
      root.style.setProperty("--primary", hexToHsl(colors.primary));
      root.style.setProperty("--foreground", hexToHsl(colors.foreground));
      root.style.setProperty("--background", hexToHsl(colors.background));
      root.style.setProperty("--secondary", hexToHsl(colors.secondary));
      root.style.setProperty("--accent", hexToHsl(colors.accent));
      root.style.setProperty("--muted", hexToHsl(colors.muted));
      root.style.setProperty("--border", hexToHsl(colors.border));
      root.style.setProperty("--input", hexToHsl(colors.muted));
      root.style.setProperty("--ring", hexToHsl(colors.primary));

      // Card colors (now separate from background)
      root.style.setProperty("--card", hexToHsl(colors.card));
      root.style.setProperty(
        "--card-foreground",
        hexToHsl(colors.foreground)
      );

      // Popover colors (use card color for consistency)
      root.style.setProperty("--popover", hexToHsl(colors.card));
      root.style.setProperty(
        "--popover-foreground",
        hexToHsl(colors.foreground)
      );

      // Foreground colors for UI elements (use textAccent for stability)
      root.style.setProperty(
        "--primary-foreground",
        hexToHsl(colors.textAccent)
      );
      root.style.setProperty(
        "--secondary-foreground",
        hexToHsl(colors.foreground)
      );
      root.style.setProperty(
        "--accent-foreground",
        hexToHsl(colors.textAccent)
      );
      root.style.setProperty(
        "--muted-foreground",
        hexToHsl(colors.foreground)
      );
    };

    // Load saved colors on app start
    const savedColors = localStorage.getItem("piscola-theme-colors");
    
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        
        // Handle backward compatibility for new color properties
        const colors: ColorConfig = {
          ...DEFAULT_COLORS,
          ...parsed,
          // If card color doesn't exist, use background (old behavior)
          card: parsed.card || parsed.background || DEFAULT_COLORS.card,
          // If textAccent doesn't exist, use default white
          textAccent: parsed.textAccent || DEFAULT_COLORS.textAccent,
        };
        
        applyThemeColors(colors);
      } catch (error) {
        console.error("Error loading saved theme colors:", error);
        // Fallback to default colors if parsing fails
        applyThemeColors(DEFAULT_COLORS);
      }
    } else {
      // No saved colors - apply default Piscola theme for first-time visitors
      applyThemeColors(DEFAULT_COLORS);
    }
  }, []);

  return <>{children}</>;
}

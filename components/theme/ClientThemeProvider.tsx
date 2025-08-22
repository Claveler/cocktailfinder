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
  secondary: string;
  accent: string;
  muted: string;
  border: string;
}

export default function ClientThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Load saved colors on app start
    const savedColors = localStorage.getItem("piscola-theme-colors");
    if (savedColors) {
      try {
        const colors: ColorConfig = JSON.parse(savedColors);
        const root = document.documentElement;

        // Apply saved colors
        root.style.setProperty("--primary", hexToHsl(colors.primary));
        root.style.setProperty("--foreground", hexToHsl(colors.foreground));
        root.style.setProperty("--background", hexToHsl(colors.background));
        root.style.setProperty("--secondary", hexToHsl(colors.secondary));
        root.style.setProperty("--accent", hexToHsl(colors.accent));
        root.style.setProperty("--muted", hexToHsl(colors.muted));
        root.style.setProperty("--border", hexToHsl(colors.border));
        root.style.setProperty("--input", hexToHsl(colors.muted));
        root.style.setProperty("--ring", hexToHsl(colors.primary));

        // Update related colors
        root.style.setProperty("--card", hexToHsl(colors.background));
        root.style.setProperty(
          "--card-foreground",
          hexToHsl(colors.foreground)
        );
        root.style.setProperty("--popover", hexToHsl(colors.background));
        root.style.setProperty(
          "--popover-foreground",
          hexToHsl(colors.foreground)
        );
        root.style.setProperty(
          "--primary-foreground",
          hexToHsl(colors.background)
        );
        root.style.setProperty(
          "--secondary-foreground",
          hexToHsl(colors.foreground)
        );
        root.style.setProperty(
          "--accent-foreground",
          hexToHsl(colors.background)
        );
        root.style.setProperty(
          "--muted-foreground",
          hexToHsl(colors.foreground)
        );
      } catch (error) {
        console.error("Error loading saved theme colors:", error);
      }
    }
  }, []);

  return <>{children}</>;
}

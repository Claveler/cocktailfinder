import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert HSL to hex for SVG usage
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Get theme color as hex from CSS custom property
export function getThemeColorAsHex(colorName: string, fallback: string = '#DC2626'): string {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${colorName}`)
      .trim();
    
    if (!cssValue) return fallback;
    
    // Parse HSL values (format: "h s% l%" or "h, s%, l%")
    const hslMatch = cssValue.match(/(\d+\.?\d*)\s*,?\s*(\d+\.?\d*)%?\s*,?\s*(\d+\.?\d*)%?/);
    
    if (hslMatch) {
      const h = parseFloat(hslMatch[1]);
      const s = parseFloat(hslMatch[2]);
      const l = parseFloat(hslMatch[3]);
      return hslToHex(h, s, l);
    }
    
    // If it's already a hex color, return it
    if (cssValue.startsWith('#')) {
      return cssValue;
    }
    
    return fallback;
  } catch (error) {
    console.warn('Failed to get theme color:', error);
    return fallback;
  }
}

// Get a darker version of a theme color for hover states
export function getThemeColorAsHexDarker(colorName: string, amount: number = 10, fallback: string = '#B91C1C'): string {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${colorName}`)
      .trim();
    
    if (!cssValue) return fallback;
    
    // Parse HSL values (format: "h s% l%" or "h, s%, l%")
    const hslMatch = cssValue.match(/(\d+\.?\d*)\s*,?\s*(\d+\.?\d*)%?\s*,?\s*(\d+\.?\d*)%?/);
    
    if (hslMatch) {
      const h = parseFloat(hslMatch[1]);
      const s = parseFloat(hslMatch[2]);
      const l = Math.max(0, parseFloat(hslMatch[3]) - amount); // Darken by reducing lightness
      return hslToHex(h, s, l);
    }
    
    return fallback;
  } catch (error) {
    console.warn('Failed to get darker theme color:', error);
    return fallback;
  }
}

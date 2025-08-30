import { createClient } from "@/lib/supabase/server";

// Server component to inject theme CSS variables
export default async function ServerThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch active theme from server
  let themeColors = {
    primary: "#d32117", // Default fallback
    foreground: "#301718",
    background: "#f4f5f7",
    card: "#ffffff",
    textAccent: "#ffffff",
    secondary: "#f5f2f2",
    accent: "#d32117",
    muted: "#faf9f9",
    border: "#e5dede",
  };

  try {
    const supabase = createClient();

    // Try RPC function first
    const { data: rpcData, error: rpcError } =
      await supabase.rpc("get_active_theme");

    if (!rpcError && rpcData?.[0]?.colors) {
      themeColors = { ...themeColors, ...rpcData[0].colors };
    } else {
      // Fallback to table query
      const { data: tableData, error: tableError } = await supabase
        .from("theme_settings")
        .select("colors")
        .eq("is_active", true)
        .single();

      if (!tableError && tableData?.colors) {
        themeColors = { ...themeColors, ...tableData.colors };
      }
    }
  } catch (error) {
    console.error("Failed to fetch server theme:", error);
    // Continue with default colors - this is fine for fallback
  }

  // Convert hex to HSL for CSS variables
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

  // Generate CSS variables from theme colors
  const cssVariables = `
    :root {
      --primary: ${hexToHsl(themeColors.primary)};
      --foreground: ${hexToHsl(themeColors.foreground)};
      --background: ${hexToHsl(themeColors.background)};
      --secondary: ${hexToHsl(themeColors.secondary)};
      --accent: ${hexToHsl(themeColors.accent)};
      --muted: ${hexToHsl(themeColors.muted)};
      --border: ${hexToHsl(themeColors.border)};
      --input: ${hexToHsl(themeColors.muted)};
      --ring: ${hexToHsl(themeColors.primary)};
      
      /* Card colors */
      --card: ${hexToHsl(themeColors.card)};
      --card-foreground: ${hexToHsl(themeColors.foreground)};
      
      /* Popover colors */
      --popover: ${hexToHsl(themeColors.card)};
      --popover-foreground: ${hexToHsl(themeColors.foreground)};
      
      /* Foreground colors for UI elements */
      --primary-foreground: ${hexToHsl(themeColors.textAccent)};
      --secondary-foreground: ${hexToHsl(themeColors.foreground)};
      --accent-foreground: ${hexToHsl(themeColors.textAccent)};
      --muted-foreground: ${hexToHsl(themeColors.foreground)};
    }
  `;

  return (
    <>
      {/* Inject theme CSS variables server-side to prevent FOUC */}
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      {children}
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Get active theme (public access)
export async function GET() {
  const supabase = createClient();

  try {
    // Try new method with RPC function first
    const { data: rpcData, error: rpcError } =
      await supabase.rpc("get_active_theme");

    if (!rpcError && rpcData?.[0]) {
      const activeTheme = rpcData[0];
      return NextResponse.json({
        id: activeTheme.id,
        name: activeTheme.name,
        colors: activeTheme.colors,
        updatedAt: activeTheme.updated_at,
      });
    }

    // Fallback: Try direct table query
    const { data: tableData, error: tableError } = await supabase
      .from("theme_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!tableError && tableData) {
      return NextResponse.json({
        id: tableData.id,
        name: tableData.name,
        colors: tableData.colors,
        updatedAt: tableData.updated_at,
      });
    }

    // Final fallback: Return default theme
    console.log(
      "No active theme found, returning defaults. RPC Error:",
      rpcError,
      "Table Error:",
      tableError
    );
    return NextResponse.json({
      colors: {
        primary: "#d32117",
        foreground: "#301718",
        background: "#f4f5f7",
        card: "#ffffff",
        textAccent: "#ffffff",
        secondary: "#f5f2f2",
        accent: "#d32117",
        muted: "#faf9f9",
        border: "#e5dede",
      },
    });
  } catch (error) {
    console.error("Unexpected error fetching theme:", error);

    // Return default theme on any error
    return NextResponse.json({
      colors: {
        primary: "#d32117",
        foreground: "#301718",
        background: "#f4f5f7",
        card: "#ffffff",
        textAccent: "#ffffff",
        secondary: "#f5f2f2",
        accent: "#d32117",
        muted: "#faf9f9",
        border: "#e5dede",
      },
    });
  }
}

// Update active theme (admin only)
export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { colors, name = "Custom Admin Theme" } = body;

    if (!colors || typeof colors !== "object") {
      return NextResponse.json(
        { error: "Invalid colors object" },
        { status: 400 }
      );
    }

    // Validate required color properties
    const requiredColors = [
      "primary",
      "foreground",
      "background",
      "card",
      "textAccent",
      "secondary",
      "accent",
      "muted",
      "border",
    ];
    for (const colorKey of requiredColors) {
      if (!colors[colorKey] || typeof colors[colorKey] !== "string") {
        return NextResponse.json(
          { error: `Missing or invalid color: ${colorKey}` },
          { status: 400 }
        );
      }
    }

    // First, set all existing themes to inactive
    await supabase
      .from("theme_settings")
      .update({ is_active: false })
      .neq("id", 0); // Update all rows

    // Then upsert the new active theme
    const { data, error } = await supabase
      .from("theme_settings")
      .upsert(
        {
          name,
          colors,
          is_active: true,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "name",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving theme:", error);

      // If table doesn't exist, return a more helpful error
      if (error.message?.includes('relation "theme_settings" does not exist')) {
        return NextResponse.json(
          {
            error:
              "Theme system not initialized. Please run database migrations first.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Failed to save theme: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      theme: {
        id: data.id,
        name: data.name,
        colors: data.colors,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error saving theme:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Reset to default theme (admin only)
export async function DELETE() {
  const supabase = createClient();

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Reset to default theme
    const defaultColors = {
      primary: "#d32117",
      foreground: "#301718",
      background: "#f4f5f7",
      card: "#ffffff",
      textAccent: "#ffffff",
      secondary: "#f5f2f2",
      accent: "#d32117",
      muted: "#faf9f9",
      border: "#e5dede",
    };

    // First, set all existing themes to inactive
    await supabase
      .from("theme_settings")
      .update({ is_active: false })
      .neq("id", 0); // Update all rows

    // Then upsert the default theme as active
    const { data, error } = await supabase
      .from("theme_settings")
      .upsert(
        {
          name: "Default Piscola Theme",
          colors: defaultColors,
          is_active: true,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "name",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error resetting theme:", error);
      return NextResponse.json(
        { error: `Failed to reset theme: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      theme: {
        id: data.id,
        name: data.name,
        colors: data.colors,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error resetting theme:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

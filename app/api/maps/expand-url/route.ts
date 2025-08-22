import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_MAPS_URL_PATTERNS } from "@/lib/maps";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate that it's a Google Maps URL
    const isGoogleMapsUrl = GOOGLE_MAPS_URL_PATTERNS.some((pattern) => pattern.test(url));

    if (!isGoogleMapsUrl) {
      return NextResponse.json(
        { error: "Only Google Maps URLs are supported" },
        { status: 400 }
      );
    }

    // For short URLs, follow redirects to get the final URL
    if (url.includes("maps.app.goo.gl") || url.includes("goo.gl")) {
      try {
        // Use fetch with redirect follow to get the final URL
        const response = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; PiscolaBot/1.0)",
          },
        });

        // The final URL after redirects
        const expandedUrl = response.url;

        return NextResponse.json({
          success: true,
          expandedUrl,
          originalUrl: url,
        });
      } catch (error) {
        logger.error("Error expanding URL", { url, error });
        return NextResponse.json(
          {
            error:
              "Could not expand short URL. Please try using the full Google Maps URL instead.",
          },
          { status: 500 }
        );
      }
    }

    // For already full URLs, just return them as-is
    return NextResponse.json({
      success: true,
      expandedUrl: url,
      originalUrl: url,
    });
  } catch (error) {
    logger.error("Error in expand-url API", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

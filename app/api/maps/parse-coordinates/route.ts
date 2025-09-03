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
    const isGoogleMapsUrl = GOOGLE_MAPS_URL_PATTERNS.some((pattern) =>
      pattern.test(url)
    );

    if (!isGoogleMapsUrl) {
      return NextResponse.json(
        { error: "Only Google Maps URLs are supported" },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PiscolaBot/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract coordinates from the HTML content
    const coordinates = extractCoordinatesFromHtml(html);

    if (coordinates) {
      return NextResponse.json({
        success: true,
        coordinates,
        source: "html_extraction",
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "No coordinates found in HTML content",
      });
    }
  } catch (error) {
    logger.error("Error in parse-coordinates API", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractCoordinatesFromHtml(
  html: string
): { lat: number; lng: number } | null {
  try {
    // Pattern 1: Look for coordinate arrays like [-71.54449177677758,-32.973640155577314]
    const coordPattern1 = /\[(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
    let match;

    // Collect all coordinate pairs
    const coordinatePairs: Array<{ lat: number; lng: number }> = [];

    while ((match = coordPattern1.exec(html)) !== null) {
      const [, first, second] = match;
      const firstNum = parseFloat(first);
      const secondNum = parseFloat(second);

      // Determine which is lat and which is lng based on typical ranges
      // Latitude: -90 to 90, Longitude: -180 to 180
      // For most practical purposes, if one number is clearly in lng range and other in lat range
      let lat: number, lng: number;

      if (Math.abs(firstNum) > Math.abs(secondNum) && Math.abs(firstNum) > 90) {
        // First number is likely longitude (larger absolute value, outside lat range)
        lng = firstNum;
        lat = secondNum;
      } else if (
        Math.abs(secondNum) > Math.abs(firstNum) &&
        Math.abs(secondNum) > 90
      ) {
        // Second number is likely longitude
        lng = secondNum;
        lat = firstNum;
      } else {
        // Try to determine based on context - look for surrounding context
        // For now, assume first is lng, second is lat (common in some formats)
        lng = firstNum;
        lat = secondNum;
      }

      // Validate coordinates are reasonable
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        coordinatePairs.push({ lat, lng });
      }
    }

    // Pattern 2: Look for more specific patterns like [3,-71.54449177677758,-32.973640155577314]
    const coordPattern2 = /\[3,(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
    while ((match = coordPattern2.exec(html)) !== null) {
      const [, first, second] = match;
      const lng = parseFloat(first);
      const lat = parseFloat(second);

      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        coordinatePairs.push({ lat, lng });
      }
    }

    // Pattern 3: Look for coordinate pairs in different formats
    const coordPattern3 = /null,null,(-?\d+\.\d+),(-?\d+\.\d+)/g;
    while ((match = coordPattern3.exec(html)) !== null) {
      const [, first, second] = match;
      const lat = parseFloat(first);
      const lng = parseFloat(second);

      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        coordinatePairs.push({ lat, lng });
      }
    }

    if (coordinatePairs.length === 0) {
      return null;
    }

    // If we have multiple coordinate pairs, try to find the most relevant one
    // Often the first valid pair is the main location
    const mainCoords = coordinatePairs[0];

    // Validate the coordinates make sense (not default/placeholder values)
    if (
      (mainCoords.lat === 0 && mainCoords.lng === 0) ||
      (mainCoords.lat === 51.5074 && mainCoords.lng === -0.1278) // London placeholder
    ) {
      // Try the next pair if available
      if (coordinatePairs.length > 1) {
        return coordinatePairs[1];
      }
      return null;
    }

    return mainCoords;
  } catch (error) {
    logger.error("Error extracting coordinates from HTML", { error });
    return null;
  }
}

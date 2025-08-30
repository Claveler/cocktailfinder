// Simulate the new extraction logic
function extractPreciseCoordinates(url) {
  // 1. Look for coordinates in specific venue-related URL patterns
  const venueCoordMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (venueCoordMatch) {
    const lat = parseFloat(venueCoordMatch[1]);
    const lng = parseFloat(venueCoordMatch[2]);
    return { lat, lng };
  }
  return undefined;
}

function isValidCoordinate(lat, lng) {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function simulateNewExtraction(url) {
  let coordinates;
  let venueName;
  let extractionMethod = "unknown";

  // Extract venue name from place URLs first
  if (url.includes("/place/")) {
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      venueName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
    }
  }

  // 1. HIGHEST PRIORITY: Search for !3d!4d precise coordinate patterns
  coordinates = extractPreciseCoordinates(url);
  if (coordinates) {
    extractionMethod = "precise_patterns(!3d!4d)";
  }

  // 2. MEDIUM PRIORITY: Extract place-specific @ coordinates
  if (!coordinates && url.includes("/place/")) {
    const placeCoordinateMatch = url.match(
      /\/place\/[^/@]*\/@(-?\d+\.?\d*),(-?\d+\.?\d*),/
    );
    if (placeCoordinateMatch) {
      const lat = parseFloat(placeCoordinateMatch[1]);
      const lng = parseFloat(placeCoordinateMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        coordinates = { lat, lng };
        extractionMethod = "place_url_coords(@pattern)";
      }
    }
  }

  // 3. LOWEST PRIORITY: Fallback to general @ coordinate extraction
  if (!coordinates) {
    const coordinateMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
    if (coordinateMatch) {
      const lat = parseFloat(coordinateMatch[1]);
      const lng = parseFloat(coordinateMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        coordinates = { lat, lng };
        extractionMethod = "general_at_pattern(fallback)";
      }
    }
  }

  return { coordinates, venueName, extractionMethod };
}

// Test with the actual URL
const url =
  "https://www.google.com/maps/place/Lafuente+Lorenzo+S.A./@40.4276243,-3.6897011,17z/data=!3m1!5s0xd4228915eeccabb:0x1cc80ad33bc1ca9b!4m6!3m5!1s0xd4228915b5bfd75:0x77dd0669a0f7e315!8m2!3d40.4280246!4d-3.6887462!16s%2Fg%2F11bzt503jg?entry=ttu&g_ep=EgoyMDI1MDgyNS4wIKXMDSoASAFQAw%3D%3D";

const result = simulateNewExtraction(url);

console.log("=== NEW EXTRACTION LOGIC TEST ===");
console.log("URL:", url.substring(0, 100) + "...");
console.log("");
console.log("Result:", result);
console.log("");
console.log("Expected precise coordinates: 40.4280246, -3.6887462");
console.log("Got coordinates:", result.coordinates);
console.log("Extraction method:", result.extractionMethod);
console.log("");

const expectedLat = 40.4280246;
const expectedLng = -3.6887462;
const gotCorrect =
  result.coordinates &&
  Math.abs(result.coordinates.lat - expectedLat) < 0.0001 &&
  Math.abs(result.coordinates.lng - expectedLng) < 0.0001;

console.log("✅ GOT CORRECT COORDINATES:", gotCorrect);

if (gotCorrect) {
  console.log(
    "🎯 SUCCESS: Now extracting precise venue coordinates instead of map center!"
  );
} else {
  console.log("❌ FAILED: Still getting wrong coordinates");
}

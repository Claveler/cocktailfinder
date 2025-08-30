import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
function loadEnvVars() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const envFile = readFileSync(envPath, "utf8");

    envFile.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.warn("Could not load .env.local file:", error.message);
  }
}

// Load environment variables
loadEnvVars();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

console.log("🔧 Supabase URL:", supabaseUrl);
console.log("🔧 Supabase Key:", supabaseKey ? "Set" : "Not set");

const supabase = createClient(supabaseUrl, supabaseKey);

// Venue data from the spreadsheet
const venueData = [
  // ON TRADE - LONDON
  {
    name: "Opium",
    category: "Cocktail Bar",
    address: "15-16 Gerrard St, London W1D 6JE",
    brands: "ABA",
  },
  {
    name: "Ronnie Scott's",
    category: "Jazz bar",
    address: "47 Frith St, London W1D 4HT",
    brands: "ABA",
  },
  {
    name: "Archer Street",
    category: "Cocktail Bar",
    address: "3-4 Archer Street, W1D 7AP",
    brands: "ABA",
  },
  {
    name: "Broadwick Soho",
    category: "Hotel & Cocktail Bar",
    address: "Broadwick St, London W1F 8HS",
    brands: "El Gobernador",
  },
  {
    name: "INKO NITO",
    category: "Restaurant",
    address: "55 Beak St, Carnaby, London W1F 9QS",
    brands: "El Gobernador",
  },
  {
    name: "NOPI",
    category: "Restaurant",
    address: "21-22 Warwick St, London W1B 5NE",
    brands: "El Gobernador",
  },
  {
    name: "El Camion",
    category: "Restaurant",
    address: "25-27 Brewer Street, London, W1F 0RR",
    brands: "Waqar",
  },
  {
    name: "Murder Inc",
    category: "Cocktail Bar",
    address: "36 Hanway St, London W1T 1UP",
    brands: "Waqar",
  },
  {
    name: "W London",
    category: "Hotel & Cocktail Bar",
    address: "10 Wardour St, London W1D 6QF",
    brands: "Waqar",
  },

  {
    name: "Seals",
    category: "Cocktail Bar",
    address: "25 Duke Street, W1U 1DJ, London",
    brands: "Waqar",
  },
  {
    name: "Beast",
    category: "Restaurant",
    address: "3 Chapel Pl, London W1G 0BG",
    brands: "Waqar",
  },
  {
    name: "FAM Bar & Kitchen",
    category: "Cocktail Bar",
    address: "Corner of Picton Place & 31 Duke St, London W1U 1LG",
    brands: "El Gobernador",
  },
  {
    name: "ROW",
    category: "Restaurant",
    address: "59 Wells St, London W1A 3AE",
    brands: "El Gobernador",
  },
  {
    name: "ROKA",
    category: "Restaurant",
    address: "37 Charlotte St., London W1T 1RR",
    brands: "El Gobernador",
  },
  {
    name: "The Black Horse",
    category: "Cocktail Bar",
    address: "6 Rathbone Place, London W1T 1HL",
    brands: "ABA",
  },

  {
    name: "Henrietta Hotel",
    category: "Hotel",
    address: "14, 15 Henrietta St, London WC2E 8QH",
    brands: "El Gobernador",
  },
  {
    name: "STEREO Covent Garden",
    category: "Cocktail Bar",
    address: "35 The Piazza, London WC2E 8BE",
    brands: "El Gobernador",
  },
  {
    name: "Crudō",
    category: "Restaurant",
    address: "36 Monmouth St, London WC2H 9HB",
    brands: "ABA",
  },
  {
    name: "Temper",
    category: "Restaurant",
    address: "5 Mercer Walk, London WC2H 9QA",
    brands: "ABA",
  },
  {
    name: "The Barbary",
    category: "Restaurant",
    address: "16 Neal's Yard, London WC2H 9DP",
    brands: "ABA",
  },

  {
    name: "Peninsula London",
    category: "Hotel",
    address: "1 Grosvenor Pl, London SW1X 7HJ",
    brands: "Waqar",
  },
  {
    name: "The Goring Hotel",
    category: "Hotel",
    address: "The Goring, 15 Beeston Place, London, SW1W 0JW",
    brands: "El Gobernador",
  },
  {
    name: "The Bluebird",
    category: "Restaurant",
    address: "350 King's Rd, London SW3 5UU",
    brands: "ABA",
  },
  {
    name: "The Botanist",
    category: "Restaurant",
    address: "No. 7 Sloane Square, SW1W 8EE",
    brands: "ABA",
  },
  {
    name: "Mezcalito Chelsea",
    category: "Restaurant & Cocktail Bar",
    address: "119 Sydney St, London SW3 6NR",
    brands: "ABA",
  },

  {
    name: "Caltoon Galley",
    category: "Cocktail Bar",
    address: "65 Rivington St, London EC2A 3AY",
    brands: "El Gobernador & ABA",
  },
  {
    name: "Som Saa",
    category: "Restaurant & Cocktail Bar",
    address: "43A Commercial St, London E1 6BD",
    brands: "Waqar",
  },
  {
    name: "Apothecary East",
    category: "Restaurant",
    address: "36 Charlotte Rd, London EC2A 3PG",
    brands: "El Gobernador",
  },
  {
    name: "Discount Suit Company",
    category: "Cocktail Bar",
    address: "29A Wentworth Street, London E1 7TB",
    brands: "El Gobernador",
  },
  {
    name: "Fazenda",
    category: "Restaurant & Cocktail Bar",
    address: "100 Bishopsgate, London EC2M 1GT",
    brands: "ABA",
  },
  {
    name: "Ottolenghi Spitalfields",
    category: "Restaurant",
    address: "50 Artillery Lane London E1 7LJ",
    brands: "El Gobernador",
  },
  {
    name: "The Light Bar & Dining",
    category: "Restaurant & Cocktail Bar",
    address: "233 Shoreditch High St, London E1 6PJ",
    brands: "ABA",
  },

  {
    name: "Brunswick House",
    category: "Restaurant & Cocktail Bar",
    address: "30 Wandsworth Road, Vauxhall, London SW8 2LG",
    brands: "Waqar & ABA",
  },
  {
    name: "Havana Coco",
    category: "Cocktail Bar",
    address: "10 Clapham Common South Side, London SW4 7AA",
    brands: "Waqar",
  },
  {
    name: "Jazuu Bar London",
    category: "Cocktail Bar",
    address: "Market Peckhama, 133A Rye Ln, London SE15 4BQ",
    brands: "El Gobernador",
  },
  {
    name: "Butlers Wharf Chop House",
    category: "Restaurant & Rooftop Bar",
    address: "36e Shad Thames, London, SE1 2YE",
    brands: "ABA",
  },
  {
    name: "Black & Blue",
    category: "Restaurant & Cocktail Bar",
    address: "Concert Hall Approach, London SE1 7NA",
    brands: "ABA",
  },

  // ON TRADE - Outside London
  {
    name: "Schofield's Bar",
    category: "Cocktail Bar",
    address: "3 Little Quay Street Sunlight House, Manchester M3 3JZ",
    brands: "El Gobernador",
  },
  {
    name: "Project Halcyon Distillery",
    category: "Cocktail Bar",
    address: "Unit 2 Bonded, Warehouse, St. Johns, Manchester M3 4AP",
    brands: "ABA",
  },
  {
    name: "Lucky Yu",
    category: "Restaurant",
    address: "53-55 Broughton St, Edinburgh EH1 3R",
    brands: "Waqar",
  },
  {
    name: "Superico",
    category: "Cocktail Bar",
    address: "99 Hanover St, Edinburgh EH2 1DJ",
    brands: "ABA",
  },
  {
    name: "Brazen Head",
    category: "Cocktail Bar",
    address: "2 St Nicholas St, Bristol BS1 1UQ",
    brands: "ABA",
  },
  {
    name: "The Ivy Clifton Brasserie",
    category: "Restaurant",
    address: "42-44 Caledonia Pl, Clifton, Bristol BS8 4DN",
    brands: "El Gobernador",
  },

  // OFF TRADE - PHYSICAL STORES
  {
    name: "Whisky Exchange",
    category: "Online and in-store",
    address: "London - 3 locations",
    brands: "ABA, El Gobernador, Waqar",
  },
  {
    name: "Amathus",
    category: "Online and in-store",
    address: "London and Bath",
    brands: "Waqar",
  },
  {
    name: "Harrisons Coffee",
    category: "In-store",
    address: "London",
    brands: "El Gobernador",
  },
  {
    name: "The Good Wine Shop",
    category: "Online and in-store",
    address: "London, Kew, Chiswick and 3 more",
    brands: "El Gobernador",
  },
  {
    name: "Best Wines London Ltd",
    category: "In-store",
    address: "London",
    brands: "ABA",
  },
  {
    name: "The Bottle Cocktail Shop",
    category: "Online and in-store",
    address: "London",
    brands: "ABA, El Gobernador",
  },
  {
    name: "Gerry's",
    category: "Online and in-store",
    address: "London",
    brands: "ABA, El Gobernador",
  },
  {
    name: "Aston's of Manchester",
    category: "Online and in-store",
    address: "Manchester",
    brands: "El Gobernador - check as it is not",
  },
  {
    name: "Tipples of Manchester",
    category: "Online and in-store",
    address: "Manchester",
    brands: "El Gobernador",
  },
  {
    name: "Brunswick Fine Wines",
    category: "Online and in-store",
    address: "Brighton",
    brands: "El Gobernador",
  },
  {
    name: "Stanmore Boss",
    category: "Online and in-store",
    address: "Sheffield",
    brands: "ABA",
  },
  {
    name: "Cambridge Wine Merchants",
    category: "In-store",
    address: "Cambridge",
    brands: "ABA",
  },
];

// Map categories to allowed venue types
function mapVenueType(category) {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes("bar") || categoryLower.includes("cocktail")) {
    return "bar";
  } else if (categoryLower.includes("pub")) {
    return "pub";
  } else if (
    categoryLower.includes("store") ||
    categoryLower.includes("online")
  ) {
    return "liquor_store";
  } else if (
    categoryLower.includes("restaurant") ||
    categoryLower.includes("hotel")
  ) {
    return "restaurant"; // Map restaurants and hotels to restaurant type
  } else {
    return "bar"; // Default fallback
  }
}

// Parse brands string into array
function parseBrands(brandsString) {
  if (!brandsString || brandsString.trim() === "") return [];

  // Split by common separators and clean up
  return brandsString
    .split(/[,&]/)
    .map((brand) => brand.trim())
    .filter(
      (brand) =>
        brand && brand !== "-" && !brand.toLowerCase().includes("check as")
    )
    .map((brand) => {
      // Clean up common variations
      if (brand.toLowerCase().includes("el gobernador")) return "El Gobernador";
      if (brand.toLowerCase().includes("aba")) return "ABA";
      if (brand.toLowerCase().includes("waqar")) return "Waqar";
      return brand;
    });
}

// Geocode an address using Nominatim (free OpenStreetMap service)
async function geocodeAddress(address) {
  try {
    // Add "London, UK" if not already present for better accuracy
    let searchAddress = address;
    if (
      !address.toLowerCase().includes("london") &&
      !address.toLowerCase().includes("uk")
    ) {
      searchAddress = `${address}, London, UK`;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&countrycodes=gb&limit=1`,
      {
        headers: {
          "User-Agent": "PiscolaVenueFinder/1.0",
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
      };
    }

    console.warn(`⚠️  Could not geocode address: ${address}`);
    return null;
  } catch (error) {
    console.error(`❌ Error geocoding ${address}:`, error);
    return null;
  }
}

// Add delay to respect rate limits
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main import function
async function importVenues() {
  console.log("🚀 Starting venue import...");

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const [index, venue] of venueData.entries()) {
    try {
      console.log(
        `\n📍 Processing ${index + 1}/${venueData.length}: ${venue.name}`
      );

      // Skip venues with missing essential data
      if (!venue.name || !venue.address || !venue.category) {
        console.log(`⏭️  Skipping ${venue.name} - missing essential data`);
        skippedCount++;
        continue;
      }

      // Skip vague addresses
      if (venue.address.includes("locations") || venue.address.length < 10) {
        console.log(
          `⏭️  Skipping ${venue.name} - address too vague: ${venue.address}`
        );
        skippedCount++;
        continue;
      }

      // Map venue type
      const venueType = mapVenueType(venue.category);

      // Parse brands
      const brands = parseBrands(venue.brands);

      // Geocode address
      console.log(`🌍 Geocoding: ${venue.address}`);
      const geocodeResult = await geocodeAddress(venue.address);

      if (!geocodeResult) {
        console.log(`⏭️  Skipping ${venue.name} - could not geocode address`);
        skippedCount++;
        continue;
      }

      // Extract city from address (assume London for now)
      const city = "London";
      const country = "United Kingdom";

      // Prepare venue data for database
      const venueRecord = {
        name: venue.name,
        type: venueType,
        address: venue.address,
        city: city,
        country: country,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        brands: brands,
        status: "approved",
        // Create PostGIS point from coordinates
        location: `POINT(${geocodeResult.longitude} ${geocodeResult.latitude})`,
      };

      // Insert into database
      console.log(`💾 Inserting venue: ${venue.name}`);
      const { data, error } = await supabase
        .from("venues")
        .insert([venueRecord])
        .select();

      if (error) {
        console.error(`❌ Database error for ${venue.name}:`, error);
        errorCount++;
      } else {
        console.log(`✅ Successfully added: ${venue.name}`);
        successCount++;
      }

      // Rate limiting - wait 1 second between requests
      await delay(1000);
    } catch (error) {
      console.error(`❌ Error processing ${venue.name}:`, error);
      errorCount++;
    }
  }

  console.log("\n🎉 Import complete!");
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(
    `📊 Total processed: ${successCount + skippedCount + errorCount}/${venueData.length}`
  );
}

// Run the import
importVenues().catch(console.error);

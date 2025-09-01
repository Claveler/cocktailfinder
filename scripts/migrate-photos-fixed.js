#!/usr/bin/env node

/**
 * FIXED Photo Migration Script: Piscola2 (dev) → piscola-prod (production)
 *
 * This version fixes the MIME type and download issues.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load configuration
const CONFIG = require("./migration-config.js");

// Initialize Supabase clients
const devSupabase = createClient(
  CONFIG.DEV.url,
  CONFIG.DEV.serviceRoleKey || CONFIG.DEV.anonKey
);
const prodSupabase = createClient(CONFIG.PROD.url, CONFIG.PROD.serviceRoleKey);

// Helper function to detect MIME type from file extension
function getMimeTypeFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".heic": "image/heic",
    ".gif": "image/gif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Helper function to download a file with better error handling
async function downloadFile(url) {
  console.log(`📥 Downloading: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Photo-Migration-Script/1.0)",
        Accept: "image/*,*/*",
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get("content-type")}`);
    console.log(`   Content-Length: ${response.headers.get("content-length")}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if we got HTML instead of an image
    const contentType = response.headers.get("content-type") || "";
    if (
      contentType.includes("text/html") ||
      contentType.includes("text/plain")
    ) {
      // Get a small sample of the response to see what we actually got
      const text = await response.text();
      const sample = text.substring(0, 200);
      throw new Error(
        `Got HTML/text response instead of image data. Sample: ${sample}`
      );
    }

    // Check if content type is an image
    if (!contentType.startsWith("image/")) {
      console.warn(
        `⚠️ Unexpected content type: ${contentType}, but proceeding...`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate we got some data
    if (buffer.length === 0) {
      throw new Error("Downloaded file is empty");
    }

    console.log(`✅ Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    throw error;
  }
}

// Helper function to upload a file with better MIME type handling
async function uploadFile(filePath, fileBuffer, originalUrl) {
  console.log(`📤 Uploading: ${filePath}`);

  try {
    // Detect MIME type from file extension
    const filename = path.basename(filePath);
    const mimeType = getMimeTypeFromExtension(filename);

    console.log(`   Detected MIME type: ${mimeType}`);
    console.log(`   File size: ${fileBuffer.length} bytes`);

    const { data, error } = await prodSupabase.storage
      .from("venue-photos")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: true, // Overwrite if exists
        contentType: mimeType,
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Uploaded: ${filePath}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    throw error;
  }
}

// Get list of venues with photos that need migration
async function getVenuesWithPhotos() {
  console.log("🔍 Getting venues with photos to migrate...");

  const { data: venues, error } = await prodSupabase
    .from("venues")
    .select("id, name, photos")
    .not("photos", "is", null);

  if (error) {
    throw new Error(`Failed to fetch venues: ${error.message}`);
  }

  // Filter venues that have photos pointing to dev environment
  const venuesNeedingMigration = venues.filter(
    (venue) =>
      venue.photos &&
      venue.photos.some((photoUrl) => photoUrl.includes("lnoaurqbnmxbsfaahnjw"))
  );

  console.log(
    `📊 Found ${venuesNeedingMigration.length} venues with photos to migrate`
  );
  return venuesNeedingMigration;
}

// Extract file path from URL
function extractFilePath(url) {
  const match = url.match(/\/venue-photos\/(.+)$/);
  return match ? match[1] : null;
}

// Main migration function
async function migratePhotos() {
  console.log(
    "🚀 Starting FIXED photo migration from Piscola2 to piscola-prod"
  );
  console.log("====================================================");

  try {
    // Test connections
    console.log("🔌 Testing Supabase connections...");
    const { data: devBuckets } = await devSupabase.storage.listBuckets();
    const { data: prodBuckets } = await prodSupabase.storage.listBuckets();

    if (!devBuckets?.find((b) => b.id === "venue-photos")) {
      throw new Error(
        "❌ venue-photos bucket not found in development project"
      );
    }
    if (!prodBuckets?.find((b) => b.id === "venue-photos")) {
      throw new Error("❌ venue-photos bucket not found in production project");
    }

    console.log("✅ Both Supabase projects connected successfully");

    // Get venues with photos to migrate
    const venues = await getVenuesWithPhotos();

    if (venues.length === 0) {
      console.log(
        "🎉 No photos need migration! All photos are already in production."
      );
      return;
    }

    let totalPhotos = 0;
    let successfulMigrations = 0;
    let failedMigrations = 0;
    const migrationMap = new Map(); // old_url -> new_url
    const failedUrls = [];

    // Process each venue
    for (const venue of venues) {
      console.log(`\n📍 Processing venue: ${venue.name} (${venue.id})`);

      for (const photoUrl of venue.photos) {
        if (!photoUrl.includes("lnoaurqbnmxbsfaahnjw")) {
          console.log(`⏭️  Skipping (already in prod): ${photoUrl}`);
          continue;
        }

        totalPhotos++;
        const filePath = extractFilePath(photoUrl);

        if (!filePath) {
          console.error(`❌ Could not extract file path from: ${photoUrl}`);
          failedMigrations++;
          failedUrls.push({ url: photoUrl, error: "Invalid URL format" });
          continue;
        }

        try {
          // Download from dev
          const fileBuffer = await downloadFile(photoUrl);

          // Upload to prod
          await uploadFile(filePath, fileBuffer, photoUrl);

          // Generate new URL
          const newUrl = `${CONFIG.PROD.url}/storage/v1/object/public/venue-photos/${filePath}`;
          migrationMap.set(photoUrl, newUrl);

          successfulMigrations++;

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to migrate ${photoUrl}:`, error.message);
          failedMigrations++;
          failedUrls.push({ url: photoUrl, error: error.message });
        }
      }
    }

    // Summary
    console.log("\n====================================================");
    console.log("📊 MIGRATION SUMMARY");
    console.log("====================================================");
    console.log(`📸 Total photos processed: ${totalPhotos}`);
    console.log(`✅ Successful migrations: ${successfulMigrations}`);
    console.log(`❌ Failed migrations: ${failedMigrations}`);

    if (failedMigrations > 0) {
      console.log("\n❌ Failed URLs:");
      failedUrls.forEach(({ url, error }) => {
        console.log(`   ${url}`);
        console.log(`   Error: ${error}\n`);
      });
    }

    if (successfulMigrations > 0) {
      console.log("\n🎉 Photo migration completed with some successes!");
      console.log(
        "📋 Next step: Run STEP4_UPDATE_URLS.sql to update database URLs"
      );

      // Save migration mapping for URL update script
      const mappingPath = path.join(
        __dirname,
        "../supabase/photo-url-mapping.json"
      );
      fs.writeFileSync(
        mappingPath,
        JSON.stringify(Object.fromEntries(migrationMap), null, 2)
      );
      console.log(`💾 URL mapping saved to: ${mappingPath}`);
    }
  } catch (error) {
    console.error("\n💥 Migration failed:", error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migratePhotos();
}

module.exports = { migratePhotos };

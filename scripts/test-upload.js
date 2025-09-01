#!/usr/bin/env node

/**
 * Test Upload Script - Debug production storage permissions
 */

const { createClient } = require("@supabase/supabase-js");
const CONFIG = require("./migration-config.js");

async function testUpload() {
  console.log("🧪 Testing production storage upload permissions...");

  try {
    // Initialize production client
    const prodSupabase = createClient(
      CONFIG.PROD.url,
      CONFIG.PROD.serviceRoleKey
    );

    // Test 1: Check bucket exists
    console.log("\n1️⃣ Checking if venue-photos bucket exists...");
    const { data: buckets, error: bucketsError } =
      await prodSupabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    const venueBucket = buckets.find((b) => b.id === "venue-photos");
    if (venueBucket) {
      console.log("✅ venue-photos bucket found");
      console.log("   Public:", venueBucket.public);
      console.log("   Created:", venueBucket.created_at);
    } else {
      console.log("❌ venue-photos bucket NOT found");
      console.log(
        "Available buckets:",
        buckets.map((b) => b.id)
      );
      return;
    }

    // Test 2: Try to upload a small test file
    console.log("\n2️⃣ Testing file upload...");
    const testContent = "This is a test file for photo migration";
    const testPath = "test-upload-delete-me.txt";

    const { data: uploadData, error: uploadError } = await prodSupabase.storage
      .from("venue-photos")
      .upload(testPath, testContent, {
        cacheControl: "3600",
        upsert: true,
        contentType: "text/plain",
      });

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError);
      console.error("   Message:", uploadError.message);
      console.error("   Details:", uploadError.details);
      return;
    }

    console.log("✅ Test upload successful!");
    console.log("   Path:", uploadData.path);
    console.log("   Full Path:", uploadData.fullPath);

    // Test 3: Try to download the test file
    console.log("\n3️⃣ Testing file download...");
    const { data: downloadData } = prodSupabase.storage
      .from("venue-photos")
      .getPublicUrl(testPath);

    console.log("✅ Public URL generated:", downloadData.publicUrl);

    // Test 4: Clean up test file
    console.log("\n4️⃣ Cleaning up test file...");
    const { error: deleteError } = await prodSupabase.storage
      .from("venue-photos")
      .remove([testPath]);

    if (deleteError) {
      console.warn("⚠️ Could not delete test file:", deleteError.message);
    } else {
      console.log("✅ Test file cleaned up");
    }

    // Test 5: Test image upload specifically
    console.log("\n5️⃣ Testing binary image upload...");

    // Create a small test image (1x1 pixel PNG)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0b, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const testImagePath = "test-image-delete-me.png";

    const { data: imageUploadData, error: imageUploadError } =
      await prodSupabase.storage
        .from("venue-photos")
        .upload(testImagePath, testImageData, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/png",
        });

    if (imageUploadError) {
      console.error("❌ Image upload test failed:", imageUploadError);
      console.error("   Message:", imageUploadError.message);
      return;
    }

    console.log("✅ Test image upload successful!");

    // Clean up test image
    await prodSupabase.storage.from("venue-photos").remove([testImagePath]);

    console.log(
      "\n🎉 All tests passed! Production storage is working correctly."
    );
    console.log(
      "   The issue might be with the file download or MIME type detection."
    );
  } catch (error) {
    console.error("\n💥 Test failed with error:", error);
  }
}

// Run the test
testUpload();

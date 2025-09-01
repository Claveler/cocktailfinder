#!/usr/bin/env node

/**
 * Photo Migration Script: Piscola2 (dev) → piscola-prod (production)
 * 
 * This script migrates all venue photos from the development project
 * to the production project, maintaining the same folder structure.
 * 
 * Prerequisites:
 * 1. Run STEP1_CREATE_BUCKET.sql in production first
 * 2. Have your Supabase credentials ready
 * 3. Install dependencies: npm install
 * 
 * Usage:
 * node scripts/migrate-photos.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load configuration from external file
let CONFIG;
try {
  CONFIG = require('./migration-config.js');
} catch (error) {
  console.error('❌ Configuration file not found!');
  console.error('📝 Please copy migration-config.example.js to migration-config.js and update with your credentials');
  console.error('💡 Run: cp scripts/migration-config.example.js scripts/migration-config.js');
  process.exit(1);
}

// Initialize Supabase clients
const devSupabase = createClient(CONFIG.DEV.url, CONFIG.DEV.serviceRoleKey || CONFIG.DEV.anonKey);
const prodSupabase = createClient(CONFIG.PROD.url, CONFIG.PROD.serviceRoleKey);

// Helper function to download a file
async function downloadFile(url) {
  console.log(`📥 Downloading: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    throw error;
  }
}

// Helper function to upload a file
async function uploadFile(filePath, fileBuffer) {
  console.log(`📤 Uploading: ${filePath}`);
  
  try {
    const { data, error } = await prodSupabase.storage
      .from('venue-photos')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: true // Overwrite if exists
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
  console.log('🔍 Getting venues with photos to migrate...');
  
  const { data: venues, error } = await prodSupabase
    .from('venues')
    .select('id, name, photos')
    .not('photos', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch venues: ${error.message}`);
  }

  // Filter venues that have photos pointing to dev environment
  const venuesNeedingMigration = venues.filter(venue => 
    venue.photos && 
    venue.photos.some(photoUrl => photoUrl.includes('lnoaurqbnmxbsfaahnjw'))
  );

  console.log(`📊 Found ${venuesNeedingMigration.length} venues with photos to migrate`);
  return venuesNeedingMigration;
}

// Extract file path from URL
function extractFilePath(url) {
  const match = url.match(/\/venue-photos\/(.+)$/);
  return match ? match[1] : null;
}

// Main migration function
async function migratePhotos() {
  console.log('🚀 Starting photo migration from Piscola2 to piscola-prod');
  console.log('====================================================');

  try {
    // Validate configuration
    if (!CONFIG.DEV.anonKey || !CONFIG.PROD.serviceRoleKey) {
      throw new Error('❌ Please update migration-config.js with your actual Supabase credentials');
    }

    // Test connections
    console.log('🔌 Testing Supabase connections...');
    const { data: devBuckets } = await devSupabase.storage.listBuckets();
    const { data: prodBuckets } = await prodSupabase.storage.listBuckets();
    
    if (!devBuckets?.find(b => b.id === 'venue-photos')) {
      throw new Error('❌ venue-photos bucket not found in development project');
    }
    if (!prodBuckets?.find(b => b.id === 'venue-photos')) {
      throw new Error('❌ venue-photos bucket not found in production project. Run STEP1_CREATE_BUCKET.sql first!');
    }
    
    console.log('✅ Both Supabase projects connected successfully');

    // Get venues with photos to migrate
    const venues = await getVenuesWithPhotos();
    
    if (venues.length === 0) {
      console.log('🎉 No photos need migration! All photos are already in production.');
      return;
    }

    let totalPhotos = 0;
    let successfulMigrations = 0;
    let failedMigrations = 0;
    const migrationMap = new Map(); // old_url -> new_url

    // Process each venue
    for (const venue of venues) {
      console.log(`\n📍 Processing venue: ${venue.name} (${venue.id})`);
      
      for (const photoUrl of venue.photos) {
        if (!photoUrl.includes('lnoaurqbnmxbsfaahnjw')) {
          console.log(`⏭️  Skipping (already in prod): ${photoUrl}`);
          continue;
        }

        totalPhotos++;
        const filePath = extractFilePath(photoUrl);
        
        if (!filePath) {
          console.error(`❌ Could not extract file path from: ${photoUrl}`);
          failedMigrations++;
          continue;
        }

        try {
          // Download from dev
          const fileBuffer = await downloadFile(photoUrl);
          
          // Upload to prod
          await uploadFile(filePath, fileBuffer);
          
          // Generate new URL
          const newUrl = `${CONFIG.PROD.url}/storage/v1/object/public/venue-photos/${filePath}`;
          migrationMap.set(photoUrl, newUrl);
          
          successfulMigrations++;
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Failed to migrate ${photoUrl}:`, error.message);
          failedMigrations++;
        }
      }
    }

    // Summary
    console.log('\n====================================================');
    console.log('📊 MIGRATION SUMMARY');
    console.log('====================================================');
    console.log(`📸 Total photos processed: ${totalPhotos}`);
    console.log(`✅ Successful migrations: ${successfulMigrations}`);
    console.log(`❌ Failed migrations: ${failedMigrations}`);
    
    if (successfulMigrations > 0) {
      console.log('\n🎉 Photo migration completed successfully!');
      console.log('📋 Next step: Run STEP4_UPDATE_URLS.sql to update database URLs');
      
      // Save migration mapping for URL update script
      const mappingPath = path.join(__dirname, '../supabase/photo-url-mapping.json');
      fs.writeFileSync(mappingPath, JSON.stringify(Object.fromEntries(migrationMap), null, 2));
      console.log(`💾 URL mapping saved to: ${mappingPath}`);
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migratePhotos();
}

module.exports = { migratePhotos };

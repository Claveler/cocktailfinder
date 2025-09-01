/**
 * Photo Migration Configuration
 *
 * Copy this file to `migration-config.js` and update with your actual Supabase credentials.
 *
 * How to find your credentials:
 *
 * For Piscola2 (Development):
 * 1. Go to: https://supabase.com/dashboard/project/lnoaurqbnmxbsfaahnjw
 * 2. Click Settings → API
 * 3. Copy the Project URL and anon/service_role keys
 *
 * For piscola-prod (Production):
 * 1. Go to: https://supabase.com/dashboard/project/udpygouyogrwvwjbzdul
 * 2. Click Settings → API
 * 3. Copy the Project URL and anon/service_role keys
 */

const CONFIG = {
  // Development project (source) - Piscola2
  DEV: {
    url: "https://lnoaurqbnmxbsfaahnjw.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Replace with your actual dev anon key
    serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Replace with your actual dev service role key (optional)
  },

  // Production project (destination) - piscola-prod
  PROD: {
    url: "https://udpygouyogrwvwjbzdul.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Replace with your actual prod anon key
    serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Replace with your actual prod service role key (REQUIRED)
  },
};

module.exports = CONFIG;

/*
 * Security Notes:
 * - Never commit this file to git if it contains real credentials
 * - Add migration-config.js to your .gitignore
 * - The service role key has admin privileges - keep it secure
 * - Only the production service role key is required for uploads
 */

-- =============================================================================
-- TABLE PERMISSIONS SETUP SCRIPT
-- Run this whenever you create new tables or migrate databases
-- =============================================================================

-- Grant permissions on all current tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant permissions on all current sequences (for auto-increment IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Set default permissions for future tables (important!)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- Set default permissions for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;

-- Verify current permissions (run this to check)
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND grantee IN ('service_role', 'anon', 'authenticated', 'PUBLIC')
ORDER BY table_name, grantee, privilege_type;


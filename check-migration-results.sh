#!/bin/bash

echo "🔍 Checking migration results..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Enter your PRODUCTION database password:"
read -s PROD_PASSWORD

PROD_DB_URL="postgresql://postgres.udpygouyogrwvwjbzdul:${PROD_PASSWORD}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

echo -e "${BLUE}Checking what data was successfully migrated...${NC}"

echo -e "${BLUE}=== TABLE RECORD COUNTS ===${NC}"
/opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
SELECT 
  'venues' as table_name, 
  COUNT(*) as records 
FROM venues 
UNION ALL 
SELECT 
  'profiles', 
  COUNT(*) 
FROM profiles 
UNION ALL 
SELECT 
  'comments', 
  COUNT(*) 
FROM comments;"

echo -e "${BLUE}=== VENUES SAMPLE ===${NC}"
/opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
SELECT 
  name, 
  city, 
  country,
  venue_type,
  created_at::date
FROM venues 
ORDER BY created_at DESC 
LIMIT 10;"

echo -e "${BLUE}=== TABLE STRUCTURE CHECK ===${NC}"
/opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('venues', 'profiles', 'comments')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;"

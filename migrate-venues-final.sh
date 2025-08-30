#!/bin/bash

echo "🚀 Migrating 49 venues with correct schema..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Enter your DEVELOPMENT database password:"
read -s DEV_PASSWORD

echo "Enter your PRODUCTION database password:"
read -s PROD_PASSWORD

DEV_DB_URL="postgresql://postgres.lnoaurqbnmxbsfaahnjw:${DEV_PASSWORD}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
PROD_DB_URL="postgresql://postgres.udpygouyogrwvwjbzdul:${PROD_PASSWORD}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

echo -e "${BLUE}Step 1: Adding remaining missing columns to production...${NC}"
/opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" << EOF
-- Add all missing columns based on development schema
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS verified_by text,
ADD COLUMN IF NOT EXISTS pisco_notes text,
ADD COLUMN IF NOT EXISTS pisco_price_range text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS phone text;

EOF

echo -e "${BLUE}Step 2: Exporting venues data with exact columns...${NC}"
/opt/homebrew/opt/postgresql@17/bin/psql "$DEV_DB_URL" -c "
COPY (
    SELECT 
        id, name, type, address, city, country,
        location::text as location_text, brands, price_range, ambiance, photos,
        status, pisco_status, last_verified, verified_by, pisco_notes,
        pisco_price_range, latitude, longitude, website_url, google_maps_url,
        phone, featured_verification_id, created_at, updated_at
    FROM venues 
    ORDER BY created_at
) TO STDOUT WITH CSV HEADER;
" > venues_export.csv

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Venues exported!${NC}"
    echo "Exported $(wc -l < venues_export.csv) lines (including header)"
    
    echo -e "${BLUE}Step 3: Importing venues to production...${NC}"
    /opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
    \copy venues (
        id, name, type, address, city, country,
        location, brands, price_range, ambiance, photos,
        status, pisco_status, last_verified, verified_by, pisco_notes,
        pisco_price_range, latitude, longitude, website_url, google_maps_url,
        phone, featured_verification_id, created_at, updated_at
    ) FROM 'venues_export.csv' WITH CSV HEADER;
    " 
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 SUCCESS! Venues imported!${NC}"
        
        echo -e "${BLUE}Step 4: Verifying import...${NC}"
        /opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
        SELECT COUNT(*) as total_venues FROM venues;
        SELECT name, city, country, pisco_status FROM venues ORDER BY created_at DESC LIMIT 5;
        "
        
        echo -e "${GREEN}🎉 MIGRATION COMPLETED SUCCESSFULLY!${NC}"
        echo -e "${GREEN}Your 49 venues are now in production!${NC}"
        
    else
        echo -e "${RED}❌ Import failed${NC}"
        echo "Let's check the CSV format:"
        head -3 venues_export.csv
    fi
else
    echo -e "${RED}❌ Export failed${NC}"
fi

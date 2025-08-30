#!/bin/bash

echo "🔧 Fixing schema differences and migrating venues data..."

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

echo -e "${BLUE}Step 1: Adding missing columns to production...${NC}"

# Add missing columns based on what we saw in development
/opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" << EOF
-- Add missing venue columns
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS venue_type text,
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS last_verified timestamp with time zone,
ADD COLUMN IF NOT EXISTS pisco_status text DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS featured_verification_id uuid;

-- Add missing comment columns  
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create missing tables
CREATE TABLE IF NOT EXISTS pisco_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES venues(id),
    user_id uuid,
    status text DEFAULT 'pending',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS theme_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_color text DEFAULT '#10B981',
    secondary_color text DEFAULT '#3B82F6',
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema updates completed!${NC}"
    
    echo -e "${BLUE}Step 2: Exporting venues data only (without auth constraints)...${NC}"
    /opt/homebrew/opt/postgresql@17/bin/psql "$DEV_DB_URL" -c "
    COPY (
        SELECT 
            id, name, type, address, city, country,
            location, brands, price_range, ambiance, photos,
            status, venue_type, google_maps_url, latitude, longitude,
            last_verified, pisco_status, featured_verification_id,
            created_at, updated_at
        FROM venues 
        WHERE created_by IS NOT NULL
    ) TO STDOUT WITH CSV HEADER;
    " > venues_data.csv
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Venues data exported!${NC}"
        wc -l venues_data.csv
        
        echo -e "${BLUE}Step 3: Importing venues to production...${NC}"
        /opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
        COPY venues (
            id, name, type, address, city, country,
            location, brands, price_range, ambiance, photos,
            status, venue_type, google_maps_url, latitude, longitude,
            last_verified, pisco_status, featured_verification_id,
            created_at, updated_at
        ) FROM STDIN WITH CSV HEADER;
        " < venues_data.csv
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Venues imported successfully!${NC}"
            
            echo -e "${BLUE}Step 4: Checking results...${NC}"
            /opt/homebrew/opt/postgresql@17/bin/psql "$PROD_DB_URL" -c "
            SELECT COUNT(*) as total_venues FROM venues;
            SELECT name, city, country, venue_type FROM venues ORDER BY created_at DESC LIMIT 5;
            "
        else
            echo -e "${RED}❌ Venues import failed${NC}"
        fi
    else
        echo -e "${RED}❌ Venues export failed${NC}"
    fi
else
    echo -e "${RED}❌ Schema updates failed${NC}"
fi

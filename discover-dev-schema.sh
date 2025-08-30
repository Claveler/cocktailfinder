#!/bin/bash

echo "🔍 Discovering development database schema..."

echo "Enter your DEVELOPMENT database password:"
read -s DEV_PASSWORD

DEV_DB_URL="postgresql://postgres.lnoaurqbnmxbsfaahnjw:${DEV_PASSWORD}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

echo "=== DEVELOPMENT VENUES TABLE COLUMNS ==="
/opt/homebrew/opt/postgresql@17/bin/psql "$DEV_DB_URL" -c "
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'venues' 
  AND table_schema = 'public'
ORDER BY ordinal_position;"

echo "=== SAMPLE VENUES DATA ==="
/opt/homebrew/opt/postgresql@17/bin/psql "$DEV_DB_URL" -c "
SELECT COUNT(*) as total_venues FROM venues;
"

echo "=== FIRST VENUE SAMPLE ==="
/opt/homebrew/opt/postgresql@17/bin/psql "$DEV_DB_URL" -c "
SELECT * FROM venues LIMIT 1;
"

# Database Backup Strategy for Piscola.net

## 1. **Manual SQL Export (Recommended - No Docker needed)**

### From Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/lnoaurqbnmxbsfaahnjw/sql
2. Run this query to export all data:

```sql
-- Full database backup query
-- Copy the results and save as backup_YYYYMMDD.sql

-- 1. Export all venues
SELECT 'INSERT INTO public.venues (id, name, type, address, city, country, location, brands, price_range, ambiance, photos, status, created_by, created_at, updated_at, pisco_status, last_verified, verified_by, pisco_notes, pisco_price_range) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L),',
  id, name, type, address, city, country,
  ST_AsText(location), brands, price_range, ambiance, photos, status,
  created_by, created_at, updated_at, pisco_status, last_verified,
  verified_by, pisco_notes, pisco_price_range
) FROM public.venues;

-- 2. Export all comments
SELECT 'INSERT INTO public.comments (id, venue_id, user_id, content, created_at, updated_at) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L),',
  id, venue_id, user_id, content, created_at, updated_at
) FROM public.comments;

-- 3. Export all pisco_verifications
SELECT 'INSERT INTO public.pisco_verifications (id, venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L, %L),',
  id, venue_id, user_id, verified_by, pisco_status, pisco_notes, created_at
) FROM public.pisco_verifications;

-- 4. Export auth users (optional - for test data)
SELECT 'INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role) VALUES'
UNION ALL
SELECT format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L),',
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) FROM auth.users WHERE email LIKE '%@example.com';
```

## 2. **Automated Backup Script (When Docker is available)**

Create a backup script:

```bash
#!/bin/bash
# backup_db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

echo "Creating database backup..."
npx supabase db dump --file "$BACKUP_DIR/backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_DIR/backup_$DATE.sql"

    # Keep only last 5 backups
    ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs rm -f
else
    echo "❌ Backup failed"
fi
```

## 3. **Quick Recovery Commands**

### To restore from backup:

```bash
# If using SQL file backup
npx supabase db reset --linked
psql -h your-host -U postgres -d postgres -f backup_YYYYMMDD.sql

# Or restore specific tables
psql -h your-host -U postgres -d postgres -c "\\i backup_YYYYMMDD.sql"
```

## 4. **Best Practices**

### Daily backup routine:

1. **Before major changes** - Always backup
2. **After successful deployments** - Create checkpoint
3. **Weekly full backups** - Store externally (Google Drive, etc.)

### File naming convention:

- `backup_YYYYMMDD_HHMM.sql` - Full backup
- `schema_only_YYYYMMDD.sql` - Schema without data
- `data_only_YYYYMMDD.sql` - Data without schema

## 5. **Emergency Recovery Plan**

If database gets wiped again:

1. Run `COMPLETE_DATABASE_REBUILD.sql` (schema)
2. Run latest backup file (data)
3. Verify with: `SELECT COUNT(*) FROM venues;`

## 6. **Current Backup Status**

✅ Schema: Complete (COMPLETE_DATABASE_REBUILD.sql)
✅ Mock Data: Complete (venues + verifications)
📝 TODO: Create first full backup right now

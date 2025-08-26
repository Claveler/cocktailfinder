# 🔧 Run Verification History Migration

## 📋 **What This Does:**
Creates a complete verification history tracking system to show community trust scores in venue cards.

## 🚀 **Steps to Run:**

### **1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard/project/lnoaurqbnmxbsfaahnjw
- Navigate to: **SQL Editor** (left sidebar)

### **2. Copy & Paste SQL**
Copy the entire content from: `supabase/migrations/0004_add_verification_history.sql`

### **3. Click "Run"**
This will create:
- ✅ `pisco_verifications` table for tracking all verification attempts
- ✅ `venue_verification_stats` view for aggregated counts  
- ✅ RLS policies for security
- ✅ Indexes for performance

## 🎯 **Expected Results:**

After running the migration, venue cards will show:

**Before:**
```
Verified 8/26/2025 by Andrés Clavel
Added 8/23/2025
```

**After:**
```
3/5 positive (2 verifiers)
Latest: 8/26/2025 by Andrés Clavel
Added 8/23/2025
```

## ⚠️ **Safe to Run:**
- Uses `IF NOT EXISTS` clauses - won't break if run multiple times
- All existing data is preserved
- Backward compatible with current pisco system

## 🔍 **Verification:**
After running, refresh the website and visit any venue page. You should see the new verification counts!

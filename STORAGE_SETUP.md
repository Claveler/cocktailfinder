# 📸 Storage Setup Guide

This guide will help you set up Supabase Storage for venue photos with proper security policies.

## 🗄️ Step 1: Create Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/lnoaurqbnmxbsfaahnjw
2. **Go to Storage**
   - Click on "Storage" in the left sidebar
3. **Create New Bucket**
   - Click "New bucket"
   - **Bucket name**: `venue-photos`
   - **Public bucket**: ✅ Enable (allows public read access)
   - **File size limit**: 50MB (recommended for photos)
   - **Allowed MIME types**: `image/*` (optional, for photos only)
   - Click "Create bucket"

### Option B: Using SQL (Alternative)

```sql
-- Run this in your Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true);
```

## 🔒 Step 2: Apply Storage Policies

### Method 1: Push Migration (Recommended)

```bash
# In your project directory
npx supabase db push
```

This will apply the `0002_storage_setup.sql` migration with all the storage policies.

### Method 2: Manual SQL Execution

If you prefer to run the SQL manually:

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste the contents of** `supabase/migrations/0002_storage_setup.sql`
3. **Click "Run"**

## 🧪 Step 3: Test the Setup

### Test 1: Upload a Photo

```typescript
import { uploadPhoto } from "@/lib/storage";

// In your component
const handleFileUpload = async (file: File, venueId: string) => {
  const { data, error } = await uploadPhoto(file, venueId);

  if (error) {
    console.error("Upload failed:", error);
  } else {
    console.log("Upload successful:", data);
    console.log("Public URL:", data.publicUrl);
  }
};
```

### Test 2: Get Public URL

```typescript
import { getPublicUrl } from "@/lib/storage";

// Get URL for an existing photo
const photoUrl = getPublicUrl("user-id/venue-id/photo.jpg");
```

## 📋 Security Policy Summary

The storage policies ensure:

✅ **Public Read**: Anyone can view photos (perfect for a public venue app)
✅ **Authenticated Upload**: Only logged-in users can upload photos
✅ **User Folder Security**: Users can only upload to `${their-user-id}/*` folders
✅ **Admin Override**: Users with `role = 'admin'` can manage all photos
✅ **Own Files Management**: Users can update/delete only their own photos

## 🔧 Usage Examples

### Upload venue photo:

```typescript
const { data, error } = await uploadPhoto(file, "venue-123");
// Uploads to: venue-photos/user-abc/venue-123/filename.jpg
```

### Get photo URL:

```typescript
const url = getPublicUrl("user-abc/venue-123/photo.jpg");
// Returns: https://your-project.supabase.co/storage/v1/object/public/venue-photos/user-abc/venue-123/photo.jpg
```

### List venue photos:

```typescript
const { data, error } = await listVenuePhotos("venue-123");
// Returns array of all photos for venue-123 from all users
```

## 🚨 Troubleshooting

### "Bucket does not exist" error

- Make sure you created the `venue-photos` bucket
- Check the bucket name is exactly `venue-photos`

### "Permission denied" errors

- Ensure the storage policies migration was applied
- Check that the user is authenticated
- Verify the file path follows the `user-id/venue-id/filename` pattern

### "File already exists" error

- The upload function uses `upsert: false` to prevent overwrites
- Use a unique filename or enable overwriting by changing `upsert: true`

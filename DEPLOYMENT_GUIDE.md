# 🚀 Piscola.net Production Deployment Guide

## Overview

This guide will help you deploy your Next.js cocktail finder app to production using Vercel + Supabase.

## 📋 Pre-Deployment Checklist

### Phase 1: Production Supabase Setup

1. **Create Production Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project (recommend US East or Europe region)
   - Choose a strong database password
   - Save your project URL and keys

2. **Get Your Production Credentials**
   ```
   Project URL: https://[your-project-id].supabase.co
   Anon Key: eyJ... (public key, safe for frontend)
   Service Role Key: eyJ... (secret key, for admin operations)
   ```

### Phase 2: Database Migration

3. **Run Database Migrations**
   - Use Supabase Dashboard → SQL Editor
   - Run your migration files in order:
     - `supabase/migrations/0001_init.sql`
     - `supabase/migrations/0002_add_pisco_fields.sql`
     - And other migration files in your `supabase/migrations/` directory

4. **Configure Storage Buckets**
   - Go to Supabase Dashboard → Storage
   - Create bucket named `venue-photos` (if you use photo uploads)
   - Set appropriate permissions

5. **Set up Authentication**
   - Go to Authentication → Settings
   - Add these URLs to "Site URL": `https://piscola.net`
   - Add to "Redirect URLs": `https://piscola.net/auth/callback`
   - Configure any OAuth providers you're using

### Phase 3: Update Code for Production

6. **Update next.config.js**
   - Add your production Supabase domain for images
   - Current config needs your production domain added

### Phase 4: Deploy to Vercel

7. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI if not installed
   npm i -g vercel

   # Deploy to production
   vercel --prod
   ```

8. **Set Environment Variables in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
     ```

### Phase 5: Configure Custom Domain

9. **Add Domain in Vercel**
   - Vercel Dashboard → Your Project → Settings → Domains
   - Add `piscola.net` and `www.piscola.net`

10. **Update Namecheap DNS**
    ```
    Type: CNAME    Name: @       Value: cname.vercel-dns.com
    Type: CNAME    Name: www     Value: cname.vercel-dns.com
    ```
    Note: Some providers require A records instead. Vercel will show you the exact DNS records to use.

### Phase 6: Final Testing

11. **Test All Functionality**
    - User registration/login
    - Venue creation and editing
    - Photo uploads
    - Maps functionality
    - Admin panel access

## 🔧 Alternative Deployment Options

### Option 2: Railway

- Good for full-stack apps with databases
- Built-in PostgreSQL if you want to self-host DB
- Easy environment variables management

### Option 3: Netlify

- Great for static sites, good Next.js support
- Free tier available
- Easy custom domain setup

## 🛡️ Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` files
   - Use `NEXT_PUBLIC_` prefix only for client-safe variables
   - Keep service role keys secure

2. **Supabase Security**
   - Enable Row Level Security (RLS) on all tables
   - Test your RLS policies thoroughly
   - Use proper authentication flows

3. **Domain Security**
   - Enable HTTPS (automatic with Vercel/Netlify)
   - Consider adding security headers
   - Set up proper CORS policies

## 📱 Post-Deployment Tasks

1. **SEO Setup**
   - Add sitemap.xml
   - Update meta descriptions
   - Set up Google Analytics/Search Console

2. **Performance Monitoring**
   - Enable Vercel Analytics
   - Monitor Core Web Vitals
   - Set up error tracking (Sentry)

3. **Backup Strategy**
   - Set up automated Supabase backups
   - Document your deployment process
   - Keep migration scripts versioned

## 🔄 CI/CD Setup (Optional)

For automatic deployments:

1. Connect GitHub repository to Vercel
2. Enable automatic deployments from main branch
3. Set up preview deployments for pull requests

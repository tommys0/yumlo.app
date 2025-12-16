# Yumlo App - Deployment Guide

## 1. Database Migration (REQUIRED - Do This First!)

Before deploying the new version, you **MUST** run the database migration to add the `photo_sessions` table:

1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/tnljfqdbptgwthapjltu/sql/new)
2. Copy and paste the content from `supabase-sessions-migration.sql`
3. Execute the migration
4. Verify the `photo_sessions` table was created

## 2. Production Environment Variables

Set these in your deployment platform (Vercel):

### Critical Fix
```
NEXT_PUBLIC_BASE_URL=https://www.yumlo.app
```
**Note:** This fixes the 404 errors in QR code URLs. Currently set to `localhost:3000` in development.

### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://tnljfqdbptgwthapjltu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
RESEND_API_KEY=your_resend_api_key
ALLOWED_DEVICES=your_production_device_tokens
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_1SU4aiQzCEmOXTX6mnfngIiz
NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID=price_1SU4bwQzCEmOXTX6YKLtsHLH
```

## 3. What Was Fixed

### Problem Analysis
- **404 errors** on `/api/session/[sessionId]/photos` endpoints
- **Root cause**: Sessions stored in server memory (Map) were lost on every deployment/restart
- **Additional issue**: Wrong base URL in production QR codes

### Solution Implemented
1. **Persistent Storage**: Migrated from in-memory storage to Supabase database
2. **Database Table**: Added `photo_sessions` table with proper indexing and RLS policies
3. **API Updates**: All session management now uses `PersistentSessionManager`
4. **Environment Fix**: Proper production URL configuration

### Files Changed
- ✅ `lib/persistent-session-manager.ts` - New persistent session manager
- ✅ `supabase-sessions-migration.sql` - Database migration
- ✅ `app/api/session/create/route.ts` - Updated to use persistent storage
- ✅ `app/api/session/[sessionId]/photos/route.ts` - Updated to use persistent storage
- ✅ `app/api/session/[sessionId]/complete/route.ts` - Updated to use persistent storage
- ✅ `.env.production` - Production environment template
- ✅ `DEPLOYMENT.md` - This deployment guide

## 4. How It Works Now

1. **Session Creation**: Sessions stored in `photo_sessions` table with 10-minute expiration
2. **Photo Upload**: Photos stored as base64 in JSONB column, survives server restarts
3. **Auto-Cleanup**: Expired sessions marked as expired, periodic cleanup via database function
4. **Persistence**: No data loss during deployments or restarts

## 5. Deployment Steps

1. ✅ **Run Database Migration** (see step 1)
2. ✅ **Set Environment Variables** (see step 2)
3. Deploy the updated code to production
4. Test QR workflow end-to-end
5. Monitor for any remaining issues

## 6. Testing the Fix

After deployment, test this workflow:
1. Go to AI Scanner page → click "Vygenerovat QR"
2. Scan QR code with mobile device
3. Upload photos from mobile
4. Verify photos appear on desktop without 404 errors
5. Complete the session

## 7. Monitoring

Check Supabase logs and Vercel function logs for any errors. The new system logs all database operations for debugging.

## 8. Future Improvements (Optional)

- Implement Redis for even better performance
- Add photo compression before database storage
- Implement photo cleanup after successful processing
- Add session usage analytics
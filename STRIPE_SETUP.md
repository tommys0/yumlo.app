# Stripe Subscription Setup Guide

This guide will help you complete the Stripe integration for Yumlo's subscription system.

## What's Been Implemented

Your Yumlo app now has a complete Stripe subscription system with:

- **3 Pricing Tiers:**
  - Free: 5 AI meal generations
  - Basic: $7/month - Unlimited generations
  - Ultra: $12/month - Unlimited generations + premium features

- **Pages:**
  - `/pricing` - Beautiful pricing page with all plans
  - `/settings` - User settings with subscription management
  - Updated `/dashboard` - Shows subscription status and generation limits
  - Updated `/` - Landing page with pricing links

- **API Routes:**
  - `/api/stripe/create-checkout-session` - Handles subscription checkout
  - `/api/stripe/create-portal-session` - Manages subscription updates/cancellations
  - `/api/stripe/webhook` - Processes Stripe events

## Setup Steps

### 1. Run Database Migration

Open your Supabase SQL Editor and run the migration:

1. Go to https://app.supabase.com/project/tnljfqdbptgwthapjltu/sql
2. Copy and paste the contents of `supabase-migration.sql`
3. Click "Run" to execute the migration

This creates the `users` table with subscription tracking columns.

### 2. Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Click "+ Add Product"

**Basic Plan:**
- Product name: `Yumlo Basic`
- Description: `Unlimited AI meal generations with advanced features`
- Pricing: `Recurring` → `$7 USD` → `Monthly`
- Click "Save product"
- **Copy the Price ID** (starts with `price_...`)

**Ultra Plan:**
- Product name: `Yumlo Ultra`
- Description: `Premium meal planning with all features`
- Pricing: `Recurring` → `$12 USD` → `Monthly`
- Click "Save product"
- **Copy the Price ID** (starts with `price_...`)

### 3. Update Environment Variables

Update `.env.local` with the Price IDs you just copied:

```bash
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID=price_xxxxxxxxxxxxx
```

Also add your Supabase Service Role Key (needed for webhooks):
1. Go to https://app.supabase.com/project/tnljfqdbptgwthapjltu/settings/api
2. Copy the "service_role" key (NOT the anon key)
3. Add to `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Set Up Stripe Webhook (For Production)

**For local development with Stripe CLI:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook signing secret. Add it to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**For production deployment:**

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
5. Click "Add endpoint"
6. Copy the "Signing secret" and add to your production environment variables

### 5. Test the Integration

1. Restart your dev server:
```bash
npm run dev
```

2. Register a new user account

3. Go to `/pricing` and try subscribing to a plan

4. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Any future expiry date, any CVC

5. Complete checkout and verify:
   - You're redirected to dashboard
   - Subscription status shows "Active"
   - Generations show "Unlimited"

6. Test subscription management:
   - Go to `/settings`
   - Click "Manage Subscription"
   - Try canceling the subscription
   - Verify status updates in dashboard

## How It Works

### User Flow

1. **New User:** Signs up → Gets 5 free generations
2. **Upgrade:** Clicks pricing → Selects plan → Stripe Checkout
3. **Active Sub:** Unlimited generations + premium features
4. **Manage:** Settings page → Stripe Customer Portal

### Generation Limits

- **Free tier:** 5 generations (tracked in `generation_count`)
- **Paid tiers:** Unlimited generations
- **Dashboard:** Shows remaining generations
- Button is disabled when limit is reached

### Subscription States

- `active` - Paying customer, full access
- `trialing` - Trial period, full access
- `canceled` - Subscription ended, back to free tier
- `null` - Never subscribed, free tier

## File Structure

```
├── lib/
│   └── stripe.ts              # Stripe client initialization
├── app/
│   ├── pricing/
│   │   └── page.tsx          # Pricing page
│   ├── settings/
│   │   └── page.tsx          # Settings & subscription management
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard with payment protection
│   └── api/
│       └── stripe/
│           ├── create-checkout-session/
│           │   └── route.ts  # Create subscription checkout
│           ├── create-portal-session/
│           │   └── route.ts  # Manage subscriptions
│           └── webhook/
│               └── route.ts  # Handle Stripe events
├── supabase-migration.sql    # Database schema
└── .env.local                # Environment variables
```

## Important Notes

### Security
- Never commit `.env.local` to git (already in .gitignore)
- Use test keys for development
- Switch to live keys only in production

### Webhooks
- Webhooks are critical for subscription updates
- Without webhooks, subscription status won't update automatically
- Always verify webhook signature for security

### Database
- User records are automatically created on signup via trigger
- Subscription data is stored in the `users` table
- Stripe webhook updates subscription status in real-time

## Troubleshooting

**Checkout not working?**
- Verify Price IDs are correct in `.env.local`
- Check browser console for errors
- Ensure user is logged in

**Subscription not updating?**
- Check webhook is configured correctly
- Look for webhook delivery in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check server logs for webhook errors

**Generation limit not enforcing?**
- Database migration must be run first
- Check `users` table has `generation_count` column
- Verify user record exists

## Next Steps

After setup is complete, you can:

1. Implement the actual meal generation feature
2. Increment `generation_count` when users generate meals
3. Add more subscription features (meal prep, shopping lists, etc.)
4. Customize the Stripe Customer Portal in your Stripe Dashboard
5. Set up production webhook endpoint when deploying
6. Switch to live Stripe keys for production

## Support

- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- Test your webhooks: https://dashboard.stripe.com/test/webhooks

---

All set! Your Stripe subscription system is ready to go. Just complete the setup steps above and you'll be accepting payments.

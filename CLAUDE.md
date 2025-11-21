# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Yumlo** is a B2C SaaS meal planning application that uses AI to generate personalized recipes based on user inventory, dietary restrictions, allergies, and macro goals.

**Tech Stack:**
- Next.js 16 (App Router)
- TypeScript
- React 19
- Supabase (authentication & database)
- Gemini API (planned for AI meal generation)
- Stripe (planned for payments)
- Tailwind CSS 4

**Timeline:** Oct 2025 - Mar 2026

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture

### Device Authorization System

The application uses a custom device-level authorization system in addition to user authentication:

- **middleware.ts**: Contains the `middleware()` function that implements device-level access control
- Reads `ALLOWED_DEVICES` from environment variable (comma-separated tokens)
- Checks for `device_auth` cookie in requests
- Displays custom 403 page for unauthorized devices
- Excludes static assets (`_next/static`, `_next/image`, fonts, images) from authorization checks
- **app/add-device/route.ts**: Route handler for authorizing new devices via `/add-device?token=YOUR_TOKEN`

**Important**: This device authorization runs as Next.js middleware and protects all routes except `/add-device`, `/waitlist`, API routes, and static assets.

### Authentication Flow

- **lib/supabase.ts**: Single Supabase client instance
  - Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in environment
- **app/login/page.tsx**: Client-side login form using `supabase.auth.signInWithPassword()`
- **app/register/page.tsx**: Client-side registration form using `supabase.auth.signUp()`
- **app/dashboard/page.tsx**: Protected route that checks for authenticated user via `supabase.auth.getUser()` and redirects to `/login` if unauthenticated

### App Structure

The app uses Next.js App Router with the following structure:

- **app/page.tsx**: Landing page with login/register links
- **app/layout.tsx**: Root layout with Geist font configuration
- **app/globals.css**: Global styles
- **app/login/**: Login page (client component)
- **app/register/**: Registration page (client component)
- **app/dashboard/**: Protected dashboard (client component with auth check)
- **app/add-device/**: Route handler for device authorization

### Path Aliases

The project uses `@/*` path alias mapping to the root directory (configured in tsconfig.json).

Example: `import { supabase } from '@/lib/supabase'`

## Environment Variables

Required environment variables (in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ALLOWED_DEVICES=token1,token2,token3
```

## Key Implementation Notes

- All auth-related pages are **client components** ('use client') as they use hooks and state
- The dashboard implements client-side route protection by checking auth status in `useEffect`
- Inline styles are currently used throughout (migration to Tailwind CSS classes is planned)
- Device authorization uses cookies with 1-year expiration
- The app is currently in development with limited device access

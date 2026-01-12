# AI Meal Planner

B2C SaaS for meal planning using what you have at home. AI generates personalized recipes based on your inventory, allergies, diet type, and macro goals.

**Tech:** Next.js, TypeScript, Supabase, Gemini API, Stripe
**Timeline:** Oct 2025 - Mar 2026

[/] - in progress
- [ ] - not done
- [x] - done

---

# AI Meal Planner - Kompletní To-Do List

## 📋 Core Features

### 🔐 Authentication & Onboarding
- [x] **Auth (email/password)** - Supabase
- [x] **Email verification** (Supabase auto)
- [x] **Onboarding flow (4 steps)**
  - [x] Step 1: Name
  - [x] Step 2: Dietary restrictions
  - [x] Step 3: Allergies & Macro targets
  - [x] Step 4: Cuisine preferences
- [x] **Password reset flow** (Supabase)
- [x] **Protected routes middleware** (Device Auth + Auth Check)

### 🏠 Dashboard
- [x] **Dashboard page layout**
- [x] **Quick stats component**
  - [ ] Active meal plan indicator
  - [ ] Inventory items count
  - [ ] Expiring items warning (top 3)
  - [x] Generations remaining (free tier)
- [ ] **Today's meals display** (if active plan)
- [x] **Quick action buttons**
  - [x] AI Scanner CTA (Photo upload workflow)
  - [ ] Manage Inventory CTA
  - [x] View Shopping List CTA

### 📸 Photo Upload Workflow (QR Scanner)
- [x] **QR Code Generation**
  - [x] Create temporary photo sessions in database
  - [x] Generate QR codes for mobile access
  - [x] Session expiration handling (10 minutes)
  - [x] URL generation for mobile upload page
- [x] **Mobile Photo Upload**
  - [x] Mobile upload page (/mobile/[sessionId])
  - [x] Camera capture functionality
  - [x] Gallery photo selection
  - [x] Multiple photo upload support
  - [x] Base64 image conversion
  - [x] Upload progress indicators
  - [x] Session completion handling
- [x] **Desktop Real-time Polling**
  - [x] Automatic photo detection via polling
  - [x] Real-time photo display
  - [x] Session status updates
  - [x] Error handling for expired sessions
- [x] **Persistent Session Storage**
  - [x] Hybrid session manager (database + fallback)
  - [x] photo_sessions database table
  - [x] Automatic session cleanup
  - [x] RLS policies for security
- [x] **AI Image Analysis (Mock)**
  - [x] Mock ingredient detection
  - [x] Confidence scores
  - [x] Quantity estimation simulation
  - [ ] Real AI integration (Google Vision/OpenAI)

### 🔧 Debug & Development Tools
- [x] **Comprehensive Debug System**
  - [x] Debug dashboard (/debug) - Real-time workflow monitoring
  - [x] Debug API routes (/api/debug/*) with detailed logging
  - [x] Step-by-step operation tracking
  - [x] Request/response cycle monitoring
  - [x] Error detection and reporting
  - [x] Performance metrics (timing, duration)
- [x] **Debug Mobile Upload**
  - [x] Debug mobile page (/debug/mobile/[sessionId])
  - [x] Real-time log display on mobile
  - [x] Base64 conversion monitoring
  - [x] Upload progress tracking
- [x] **Development Infrastructure**
  - [x] Device authorization system bypass for debug routes
  - [x] Environment-specific configurations
  - [x] Production vs development URL handling
  - [x] Automatic network IP detection for mobile testing

### 📦 Inventory Management
- [ ] **Inventory CRUD**
  - [ ] Add item form (name, quantity, unit, expiry)
  - [ ] Edit item modal
  - [ ] Delete item confirmation
  - [ ] View inventory list/table
- [ ] **Inventory filtering/search**
- [ ] **Expiry date tracking**
  - [ ] Visual indicators (expiring soon)
  - [ ] Sort by expiry date
- [ ] **Empty state design**
- [ ] **Bulk actions** (select multiple, delete)

### 🤖 AI Meal Generation
- [x] **AI meal generation (Gemini)**
  - [x] Build prompt function (user context + preferences)
  - [x] Gemini API integration (`lib/gemini.ts`)
  - [x] Response parsing (JSON validation)
  - [x] Error handling (retry logic, fallbacks)
- [x] **Generation form/page** (`/meal-planner`)
  - [x] Days selection (1-14 days)
  - [x] Meals per day selection (2-5)
  - [x] People/servings selection
  - [x] Target calories input
  - [x] Generate button
- [x] **Loading state**
  - [x] Progress indicator with elapsed time
  - [x] Dynamic loading messages
  - [x] Background job processing
- [x] **Generation success flow**
  - [x] Save to database (meal_plan_jobs table)
  - [x] Display meal plan in UI
  - [x] Shopping list generation

### ⚡ Quick Dinner
- [x] **Quick Dinner page** (`/quick-dinner`)
  - [x] Quick option cards (Super rychlé, Jednoduché, Zdravé, Comfort food)
  - [x] Single recipe generation
  - [x] Recipe display with full details
  - [x] Regenerate button
- [x] **Quick Dinner API** (`/api/quick-dinner`)
  - [x] Type-based prompt generation
  - [x] Gemini AI integration
  - [x] Response parsing

### 📅 Meal Plan Viewing
- [x] **Meal plan display** (in /meal-planner)
- [x] **Day-by-day view**
- [x] **Meal cards for each day**
  - [x] Recipe name
  - [x] Cooking time
  - [x] Difficulty badge
  - [x] Macro summary (P/C/F/Cal)
  - [x] Ingredients list (expandable)
  - [x] Instructions (expandable)
- [x] **Daily macro summary**
- [ ] **Mark as cooked functionality**
  - [ ] Button on meal card
  - [ ] Update meal status in DB
  - [ ] Visual indicator (checkmark/badge)
  - [ ] Toast confirmation
- [ ] **Regenerate actions**
  - [ ] Regenerate single meal
  - [ ] Regenerate entire day
  - [ ] Confirmation modal

### 🍳 Recipe Detail
- [x] **Recipe detail + macros** (inline in meal planner)
  - [x] Ingredients list (with quantities)
  - [x] Step-by-step instructions
  - [x] Nutrition breakdown (macros + calories)
  - [x] Cooking time, difficulty, servings
  - [x] Tips section
- [ ] **Recipe actions**
  - [ ] Mark as cooked button
  - [ ] Like/Dislike buttons
  - [ ] Add to favorites (nice-to-have)
  - [ ] Share recipe (nice-to-have)

### ⭐ Rating System
- [ ] **Rating system**
  - [ ] Like/Dislike buttons on recipe
  - [ ] Save rating to database (recipe_ratings table)
  - [ ] Visual feedback (button state change)
- [ ] **Rating feedback loop**
  - [ ] Include ratings in AI prompt context
  - [ ] "Liked recipes" section in prompt
  - [ ] "Disliked recipes" section in prompt
- [ ] **Ban/favorite system** (nice-to-have)

### 🛒 Shopping List
- [x] **Shopping list page** (`/shopping-list`)
  - [x] Display shopping list from latest meal plan
  - [x] Items grouped by category
  - [x] Item checkboxes (mark as purchased)
  - [x] Progress bar (items checked)
  - [x] Estimated costs display
  - [x] Empty state with CTA to meal planner
- [x] **Shopping list generation**
  - [x] Auto-generate from meal plan
  - [x] Quantities aggregation (same item across meals)
  - [x] Category-based sorting
  - [x] Cost estimation
- [ ] **Rohlik.cz integration**
  - [ ] Generate affiliate link
  - [ ] VIVnetworks tracking params
  - [ ] "Order on Rohlik" CTA button
- [ ] **Shopping list persistence**
  - [ ] Save checked state to database
  - [ ] Archive completed lists

### 💳 Freemium & Subscription
- [x] **Freemium (5 free gens)**
  - [x] Track generations_used in users table
  - [x] Increment counter after each generation
  - [x] Check tier before generation
  - [x] Block generation if limit reached
  - [x] Show remaining generations in UI
- [x] **Stripe integration**
  - [x] Pricing page
  - [x] Checkout session creation
  - [x] Success/cancel pages
  - [x] Webhook handling (subscription.created, subscription.updated, subscription.deleted)
  - [x] Update user tier in database
  - [x] Handle payment failures
- [x] **Subscription management**
  - [x] View current plan in settings
  - [x] Upgrade/downgrade flow
  - [x] Cancel subscription
  - [ ] Billing history (nice-to-have)

### ⚙️ Settings & Profile
- [x] **User profile page**
- [x] **Edit preferences**
  - [x] Dietary restrictions
  - [x] Allergies
  - [x] Macro targets
  - [x] Cooking skill level (Not seen in form, maybe missing?)
  - [x] Max cooking time (Not seen in form, maybe missing?)
  - [ ] Household size (for recipe scaling)
- [x] **Account settings**
  - [x] Email (view only)
  - [x] Change password
  - [ ] Delete account
- [ ] **Notification preferences** (nice-to-have)
- [ ] **Privacy settings**
  - [ ] Data export
  - [ ] GDPR compliance

## 🎨 UI/UX Components
### Layout & Navigation
- [x] **Main layout component**
- [x] **Header/navbar**
  - [x] Logo
  - [x] Navigation links
  - [x] User menu dropdown
  - [ ] Notifications badge (nice-to-have)
- [x] **Sidebar** (app navigation)
  - [x] Dashboard link
  - [x] AI Scanner link
  - [x] Meal Planner link
  - [x] Shopping List link
  - [x] Quick Dinner link
  - [x] Settings link
  - [x] Logout button
  - [x] Mobile responsive (hamburger menu)
- [ ] **Footer**
- [x] **Mobile responsive design**
- [x] **Loading skeletons**

### Design System
- [x] **Color palette** (Tailwind config)
- [x] **Typography scale**
- [x] **Button variants**
- [x] **Form components**
- [x] **Card components**
- [x] **Modal/dialog components**
- [ ] **Toast notifications** (Sonner)
- [x] **Badge components**
- [x] **Empty states** (shopping list, meal planner)
- [ ] **Error states**

### Pages
- [x] **Landing page (/)**
- [x] **Login page (/login)**
- [x] **Register page (/register)**
- [x] **Onboarding pages (/onboarding)**
- [x] **Dashboard (/dashboard)**
- [x] **AI Scanner page (/ai-scanner)** - Photo upload workflow
- [x] **Mobile upload page (/mobile/[sessionId])** - Mobile photo capture
- [x] **Debug dashboard (/debug)** - Development debugging
- [x] **Debug mobile page (/debug/mobile/[sessionId])** - Debug mobile workflow
- [ ] **Inventory page (/inventory)**
- [x] **Meal planner page (/meal-planner)** - Generate & view meal plans
- [x] **Quick Dinner page (/quick-dinner)** - Fast recipe suggestions
- [x] **Shopping list page (/shopping-list)** - View & check off items
- [x] **Settings page (/settings)**
- [x] **Pricing page (/pricing)**
- [x] **Success/cancel pages** (/success, /cancel) - handled in settings/pricing logic
- [ ] **404 page**
- [ ] **Error page**

## 🗄️ Database & Backend
### Database Schema
- [x] **Users table** (Supabase Auth)
- [x] **User preferences** (in users table)
- [x] **photo_sessions table** - Photo upload workflow
  - [x] Session ID, user ID, expiry, status
  - [x] Photos stored as JSONB array
  - [x] Auto-cleanup functionality
  - [x] RLS policies for security
- [x] **meal_plan_jobs table** - Background job processing
  - [x] Job ID, user ID, status, params
  - [x] Result stored as JSONB
  - [x] Error tracking
  - [x] Timestamps (created, processing_started, completed)
- [ ] **Inventory items table**
- [ ] **Recipe ratings table**
- [ ] **Shopping lists table** (for persistence)
- [x] **Row Level Security (RLS) policies** (for users + photo_sessions + meal_plan_jobs)
- [x] **Database indexes for performance** (users + photo_sessions)

### API Routes
- [x] **`/api/auth/*`** (Supabase)
- [x] **`/api/session/*`** (Photo upload workflow)
  - [x] `/api/session/create` - Create photo session
  - [x] `/api/session/[id]/photos` - Upload/get photos
  - [x] `/api/session/[id]/complete` - Mark session complete
- [x] **`/api/debug/*`** (Debug system)
  - [x] `/api/debug/session/create` - Debug session creation
  - [x] `/api/debug/session/[id]/photos` - Debug photo operations
- [x] **`/api/meal-plan`** (Meal plan generation)
  - [x] `POST /api/meal-plan` - Create meal plan job
  - [x] `GET /api/meal-plan/status/[jobId]` - Check job status
  - [x] `GET /api/meal-plan/recent` - Get recent completed plans
  - [x] `POST /api/meal-plan/process` - Manual job processing trigger
- [x] **`/api/quick-dinner`** - Quick recipe generation
- [ ] **`/api/inventory`**
- [ ] **`/api/recipes`**
- [x] **`/api/stripe/webhook`**
- [x] **`/api/stripe/create-checkout`**
- [x] **`/api/stripe/create-portal`**
- [x] **`/api/user`** (onboarding, update-preferences)

### Gemini AI Integration
- [x] **Gemini API client** (`lib/gemini.ts`)
- [x] **Prompt builder utilities**
  - [x] Complete meal plan prompt
  - [x] Quick dinner prompt
- [x] **Response parsing** (JSON extraction)
- [x] **Error handling** (API errors, parsing errors)
- [ ] **Token usage tracking**

## 🚀 Deployment & DevOps
- [ ] **Deploy to Vercel**
- [x] **Environment variables setup**
- [ ] **Domain setup**
- [ ] **SSL certificate**
- [x] **Production database** (Supabase)
- [ ] **Error monitoring**
- [ ] **Performance monitoring**

## 🧪 Testing & Quality
- [ ] **Unit tests**
- [ ] **Integration tests**
- [ ] **E2E tests**
- [ ] **Manual testing checklist**
- [ ] **Cross-browser testing**
- [ ] **Mobile responsiveness testing**
- [ ] **Accessibility audit**

## 📚 Documentation
- [x] **README.md**
- [ ] **API documentation**
- [ ] **Database schema diagram**
- [ ] **Architecture diagram**
- [ ] **Maturitní práce text**
- [ ] **User documentation**

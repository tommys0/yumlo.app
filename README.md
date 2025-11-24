# AI Meal Planner

B2C SaaS for meal planning using what you have at home. AI generates personalized recipes based on your inventory, allergies, diet type, and macro goals.

**Tech:** Next.js, TypeScript, Supabase, Gemini API, Stripe  
**Timeline:** Oct 2025 - Mar 2026

- [ ] - not done
  [/] - in progress
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
- [/] **Dashboard page layout**
- [/] **Quick stats component**
  - [ ] Active meal plan indicator
  - [ ] Inventory items count
  - [ ] Expiring items warning (top 3)
  - [x] Generations remaining (free tier)
- [ ] **Today's meals display** (if active plan)
- [/] **Quick action buttons**
  - [x] Generate Plan CTA (Button exists but no action)
  - [ ] Manage Inventory CTA
  - [ ] View Shopping List CTA

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
- [ ] **AI meal generation (Gemini)**
  - [ ] Build prompt function (user context + inventory)
  - [ ] Gemini API integration
  - [ ] Response parsing (JSON validation)
  - [ ] Error handling (retry logic, fallbacks)
- [ ] **Generation form/page**
  - [ ] Days selection (1/3/7)
  - [ ] Meal types checkboxes (breakfast/lunch/dinner/snack)
  - [ ] Special requests input
  - [ ] Generate button
- [ ] **Loading state**
  - [ ] Progress indicator
  - [ ] Estimated time display
  - [ ] Cancel generation option (nice-to-have)
- [ ] **Generation success flow**
  - [ ] Save to database (meal_plans + meals tables)
  - [ ] Redirect to meal plan view
  - [ ] Success toast notification

### 📅 Meal Plan Viewing
- [ ] **Meal plan list/calendar view**
- [ ] **Day navigation** (prev/next buttons)
- [ ] **Meal cards for each day**
  - [ ] Recipe name
  - [ ] Cooking time
  - [ ] Difficulty badge
  - [ ] Macro summary (P/C/F/Cal)
  - [ ] Thumbnail/placeholder image
- [ ] **Daily macro summary**
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
- [ ] **Recipe detail + macros**
  - [ ] Full recipe page/modal
  - [ ] Ingredients list (with quantities)
  - [ ] Step-by-step instructions
  - [ ] Nutrition breakdown (macros + calories)
  - [ ] Cooking time, difficulty, servings
  - [ ] Cuisine type & tags
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
- [ ] **Shopping list**
  - [ ] Generate from meal plan (compare plan vs inventory)
  - [ ] Missing ingredients calculation
  - [ ] Shopping list page/modal
  - [ ] Item checkboxes (mark as purchased)
  - [ ] Quantities aggregation (same item across meals)
- [ ] **Rohlik.cz integration**
  - [ ] Generate affiliate link
  - [ ] VIVnetworks tracking params
  - [ ] "Order on Rohlik" CTA button
- [ ] **Shopping list persistence**
  - [ ] Save to database (shopping_lists table)
  - [ ] Mark items as checked
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
- [ ] **Sidebar** (if needed)
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
- [ ] **Empty states**
- [ ] **Error states**

### Pages
- [x] **Landing page (/)**
- [x] **Login page (/login)**
- [x] **Register page (/register)**
- [x] **Onboarding pages (/onboarding)**
- [x] **Dashboard (/dashboard)**
- [ ] **Inventory page (/inventory)**
- [ ] **Generate plan page (/plans/new)**
- [ ] **Meal plan view (/plans/[id])**
- [ ] **Recipe detail (/recipes/[id] or modal)**
- [ ] **Shopping list (/shopping)**
- [x] **Settings page (/settings)**
- [x] **Pricing page (/pricing)**
- [x] **Success/cancel pages** (/success, /cancel) - handled in settings/pricing logic
- [ ] **404 page**
- [ ] **Error page**

## 🗄️ Database & Backend
### Database Schema
- [x] **Users table** (Supabase Auth)
- [x] **User preferences** (in users table)
- [ ] **Inventory items table**
- [ ] **Meal plans table**
- [ ] **Meals table**
- [ ] **Recipe ratings table**
- [ ] **Shopping lists table**
- [x] **Row Level Security (RLS) policies** (for users)
- [x] **Database indexes for performance** (users)

### API Routes
- [x] **`/api/auth/*`** (Supabase)
- [ ] **`/api/inventory`**
- [ ] **`/api/generation`**
- [ ] **`/api/plans`**
- [ ] **`/api/recipes`**
- [ ] **`/api/shopping`**
- [x] **`/api/stripe/webhook`**
- [x] **`/api/stripe/create-checkout`**
- [x] **`/api/stripe/create-portal`**
- [x] **`/api/user`** (onboarding, update-preferences)

### Gemini AI Integration
- [ ] **Prompt builder utility**
- [ ] **Gemini API client**
- [ ] **Response validator**
- [ ] **Error handling & retries**
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

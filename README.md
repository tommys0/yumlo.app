# 🍽️ AI Meal Planner

> AI-driven SaaS application for personalized meal planning based on your kitchen inventory, dietary preferences, and nutritional goals.

**Status:** 🚧 In Development  
**Timeline:** October 2025 - March 2026  
**Type:** Graduation Project (Maturitní práce)

---

## 📋 Project Overview

AI Meal Planner helps users eliminate food waste, save time on meal planning, and achieve their nutritional goals by:

- 🤖 Generating personalized meal plans using AI (Google Gemini)
- 🧊 Utilizing ingredients already in your fridge
- 📊 Tracking macronutrients (protein, carbs, fat) aligned with your goals
- 🛒 Creating smart shopping lists with Rohlik.cz integration
- ⏰ Prioritizing ingredients by expiration date

**Unique Value Proposition:** *"From inventory to ready meal in 30 seconds"*

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 14+](https://nextjs.org/docs) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts:** [Recharts](https://recharts.org/)

### Backend & Database
- **API:** Next.js API Routes
- **Database:** [Supabase](https://supabase.com/docs) (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **ORM:** Supabase JS Client

### External APIs
- **AI:** [Google Gemini API](https://ai.google.dev/docs) (`gemini-pro`)
- **Payments:** [Stripe](https://stripe.com/docs) (Checkout + Webhooks)
- **Affiliate:** Rohlik.cz via [VIVnetworks](https://www.vivnetworks.cz/)
- **Nutrition:** [Edamam API](https://developer.edamam.com/) *(optional, later)*

### Deployment
- **Hosting:** [Vercel](https://vercel.com/docs)
- **Domain:** TBD
- **Monitoring:** Vercel Analytics

---

## 🎯 Core Features (MVP)

### ✅ Implemented
- [ ] Email/Password Authentication
- [ ] 4-Step Onboarding Wizard
- [ ] Inventory Management
- [ ] AI Meal Plan Generation (1-7 days)
- [ ] Recipe Details with Macronutrients
- [ ] Recipe Rating System (👍/👎)
- [ ] Shopping List Generation
- [ ] Freemium Model (5 free generations)
- [ ] Stripe Payment Integration

### 🔜 Coming Later
- Smart rescheduling of uneaten meals
- Ban/Favorite recipe system
- Expiry tracking with priority alerts
- Receipt scanning (OCR)
- Rohlik.cz cart automation

---

## 📚 Important Links

### Documentation
- **Official Docs:** *(coming soon)*
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Stripe Docs](https://stripe.com/docs)

### Project Resources
- **Design Mockups:** *(coming soon)*
- **API Documentation:** *(coming soon)*
- **Database Schema:** See `docs/database-schema.md` *(to be added)*

### Development
- **Live Demo:** *(coming soon)*
- **Staging:** *(coming soon)*

---

## 🚀 Quick Start

> **Note:** Setup instructions will be added once development begins.

```bash
# Coming soon...
```

---

## 📖 Project Structure

> Directory structure will be documented as development progresses.

---

## 🤝 Contributing

This is a graduation project and not currently open for contributions. However, feedback and suggestions are welcome via Issues.

---

## 📄 License

> License TBD

---

## 📧 Contact

**Author:** [Your Name]  
**School:** [School Name]  
**Email:** [Your Email]

---

**Last Updated:** November 5, 2025

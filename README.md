# Birdie & Give

Next.js full-stack golf charity platform built for the Digital Heroes full-stack assignment.

## Stack

- Next.js 14 App Router
- Next.js Route Handlers for internal API
- Supabase for auth and database
- Polar for subscriptions
- Tailwind CSS for UI

## Core Features

- User signup/login with charity selection at signup
- Monthly/yearly subscriptions
- Rolling 5-score management with user editing
- Monthly draw engine with admin simulation and publish flow
- Charity directory, charity detail pages, upcoming events, and independent donations
- Winner proof submission, admin verification, and payout tracking
- User dashboard with participation summary and notifications
- Admin dashboard for users, subscriptions, draws, charities, winners, and reports

## Setup

Run the schema in [supabase_schema.sql](/C:/Users/mohan/OneDrive/Desktop/dev_main/Personal_SAAS/golf_project/supabase_schema.sql), then configure these environment variables for the Next.js app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_MONTHLY_PRODUCT_ID`
- `POLAR_YEARLY_PRODUCT_ID`
- `NEXT_PUBLIC_POLAR_MONTHLY_ID`
- `NEXT_PUBLIC_POLAR_YEARLY_ID`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` for email notifications

## Run

test_satya

From `frontend`:

```bash
npm install
npm run dev
```

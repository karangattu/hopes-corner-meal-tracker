# Meal Tracker App

A simple, fast Next.js application for quickly assigning meals to guests at Hope's Corner.

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Use the **same Supabase credentials** as the main hopes-corner-checkin-app, but keep them on the server:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Because the Next.js API routes proxy every Supabase request, these values never get bundled into the client-side code.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

This app uses the same Supabase database as the main check-in app. It reads from:

- `guests` table - for searching guests
- `meal_attendance` table - for recording and checking meals

### Key tables

- **guests**: Guest records with name, ID, housing status, etc.
- **meal_attendance**: Meal records with guest_id, quantity, served_on date

## Deployment

Build for production:

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
npx vercel
```

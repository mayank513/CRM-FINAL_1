# BrightPath Academy CRM

A production-grade, secure, multi-role Customer Relationship Management (CRM) application for coaching institutes, built strictly according to the **BrightPath CRM Master Specification**.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel ready

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Setup Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/001_initial_schema.sql` from this repository, copy its contents, and run it in the SQL Editor.
   - This creates tables: `profiles`, `leads`, `follow_ups`, `activities`.
   - Sets up triggers for auto profile creation on user signup.
   - Enables Row Level Security (RLS) with role policies.

### 4. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(Reference `.env.example` for details. Never put service-role keys in this file).*

### 5. Start Development Server
```bash
npm run dev
```

### 6. Production Build & Verification
```bash
npm run build
```

---

## 🔒 Security & RLS Model
- **Counsellor**: Can view, edit, and create leads assigned to or created by them.
- **Manager**: Team-level visibility, pipeline monitoring, and lead reassignment.
- **Admin**: Institute-wide control and audit logs.
- Role changes are protected against client-side elevation using strict RLS check policies.

## 📦 Vercel Deployment
1. Push repository to GitHub.
2. Import repository into Vercel (Preset: Vite).
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables.
4. Deploy.

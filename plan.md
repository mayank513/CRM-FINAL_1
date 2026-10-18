# BrightPath CRM — Master Phased Execution & Architecture Plan

> **Specification Reference**: Derived from `BrightPath_CRM_Full_Master_Build_Prompt.docx`
> **Target Architecture**: React 19 + TypeScript + Vite • Tailwind CSS • Supabase (PostgreSQL, Auth, RLS) • Git/GitHub • Vercel
> **Working Rules**: Build feature-by-feature; each phase is designed, implemented, tested, verified, and checked before moving forward.

---

## Overall Roadmap & Phase Breakdown

| Phase | Title | Focus & Scope | Deliverables & Acceptance |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Repository Foundation & Toolchain** | Workspace hygiene, Git setup, React 19 + TypeScript + Vite, Tailwind configuration, clean architecture skeleton. | `tsconfig.json`, `vite.config.ts`, `.gitignore`, baseline Git commit, zero build errors. |
| **Phase 2** | **Design System & Shell (Professional UI & Motion)** | Bespoke SaaS theme (Navy/Blue/Slate), responsive navigation, micro-interactions, layout shells, empty/loading states. | Non-generic custom theme, polished sidebar/navbar, motion cues, accessible responsive grid. |
| **Phase 3** | **Supabase Project, Relational Schema & RLS** | Supabase project creation, PostgreSQL migration, UUID PKs, constraints, indexes, triggers, Row Level Security policies. | `supabase/migrations/001_initial_schema.sql`, applied via SQL editor, role-based table policies verified. |
| **Phase 4** | **Environment Validation & Client Layer** | `.env` validation, typed Supabase client singleton, connection health checker, truthful fallback notices. | `src/lib/supabaseClient.ts`, graceful missing credentials banner, live connection ping. |
| **Phase 5** | **Authentication & Role Lifecycle** | Supabase Auth (Sign in / Sign up / Logout), session sync, `handle_new_user` profile trigger, role guards. | Multi-user session management, automatic profile creation, unprivileged default `counsellor` role. |
| **Phase 6** | **Lead Management Engine (Core CRUD)** | Inquiry intake modal, lead list with search & multi-filter, detail view, optimistic status changes, validation. | Complete enquiry-to-admission pipeline, field validation, persistent lead lifecycle. |
| **Phase 7** | **Follow-up Engine & Overdue Detection** | Due date/time scheduling, actionable pending/completed toggles, overdue date arithmetic (`pending && due_at < now`). | Follow-ups linked to leads, overdue alerts, completion timestamps. |
| **Phase 8** | **Activity History & Audit Trail** | Event logging for lead creation, status changes, counselor notes, follow-up completions. | Real-time audit timeline in lead detail view. |
| **Phase 9** | **Dashboard Metrics & Analytical Reports** | Live KPI calculation (Accessible Leads, New Inquiries, Overdue Tasks, Conversion %), pipeline distribution charts. | Reconciled data, zero division guard, role-scoped metrics. |
| **Phase 10** | **Quality Assurance, Production Build & Vercel Deployment** | Accessibility check, mobile responsiveness audit, `npm run build`, GitHub push, Vercel configuration & verification. | Deployed live URL, test log, student handover documentation. |

---

## Detailed Plans by Phase

### Phase 1: Repository Foundation & Toolchain
- **Goal**: Establish a rock-solid, clean workspace with TypeScript, bundler, and repository hygiene.
- **Approach**: Move away from OS-protected directories to `C:\Users\DAMON\Documents\brightpath-crm`, initialize Git, configure TypeScript compiler settings (`strict: true`), install baseline dependencies (`@supabase/supabase-js`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`).
- **Commands**:
  ```bash
  git init
  npm install @supabase/supabase-js lucide-react clsx tailwindcss @tailwindcss/vite
  npm install -D typescript @types/node
  git add .
  git commit -m "first commit"
  ```
- **Verification**: `npm run build` succeeds cleanly with 0 TypeScript/lint errors.

---

### Phase 2: Design System & Application Shell (Bespoke UI & Motion)
- **Goal**: Deliver a hand-crafted, professional SaaS experience that looks distinctly authentic, purposeful, and non-AI-generated.
- **UI Direction & Strategy**:
  - **Color Palette**: Deep slate/navy foundation (`#0f172a`, `#1e293b`), crisp crisp surface white (`#ffffff`), electric cobalt accents (`#2563eb`), with muted semantic badges (emerald for Converted, amber for New, blue for Contacted, violet for Qualified, slate for Lost).
  - **Typography & Spacing**: High-density executive layout with precise 4px/8px rhythm, subtle 1px border dividers (`border-slate-200/80`), and custom tabular numeric alignments for metrics.
  - **Micro-Interactions & Animation**: Fluid tab switches, hover elevation shifts, subtle badge transitions, modal zoom-in entry (`cubic-bezier(0.16, 1, 0.3, 1)`), slide-up toast notifications, and interactive status dropdowns.
  - **Components**:
    - `Sidebar`: Collapsible/responsive, brand header with icon badge, navigation items with active indicators, counselor user card.
    - `Header`: Breadcrumbs, quick search trigger, user status indicator.
    - `Shell Layout`: Fluid desktop sidebar + responsive drawer for mobile/tablet.

---

### Phase 3: Supabase Relational Schema, Triggers & Row-Level Security
- **Goal**: Define the exact PostgreSQL relational architecture with robust data integrity and strict role separation.
- **Tables**:
  1. `profiles`: `id` (references `auth.users`), `full_name`, `role` (`counsellor` default, `manager`, `admin`), timestamps.
  2. `leads`: `id` (UUID), `full_name`, `email`, `phone`, `course_interest`, `source`, `status`, `assigned_to`, `created_by`, `notes`, timestamps.
  3. `follow_ups`: `id` (UUID), `lead_id`, `assigned_to`, `due_at`, `note`, `status` (`pending`, `completed`, `cancelled`), `completed_at`, timestamps.
  4. `activities`: `id` (UUID), `lead_id`, `actor_id`, `activity_type`, `description`, `metadata` (JSONB), timestamps.
- **Triggers**:
  - `handle_new_user()` auto-inserts a profile row whenever a new user signs up in `auth.users`.
- **Security & RLS Policies**:
  - RLS enabled on all 4 tables.
  - Counsellors can only view/mutate leads where `assigned_to = auth.uid()` or `created_by = auth.uid()`.
  - Managers and Admins have team-wide query visibility.
  - Profile update policy prevents self-promotion to `admin` via client requests.
- **Setup Flow**:
  1. User creates free project in [supabase.com](https://supabase.com).
  2. Copy and run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
  3. Verify tables and triggers in Supabase Table Editor.

---

### Phase 4: Environment Configuration & Client Layer
- **Goal**: Validate environment parameters at runtime and provide dependable client connectivity.
- **Approach**:
  - Create `.env.example` with clear placeholders (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - Create `.env` locally with user's project credentials.
  - `supabaseClient.ts`: Validate that credentials are non-empty and non-placeholder.
  - Expose `isSupabaseConfigured` flag to render graceful notices instead of crashing the UI when unconfigured.
- **Verification**: Verify client initialization without runtime errors.

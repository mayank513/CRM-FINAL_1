-- BrightPath CRM Master Database Migration
-- Tables: profiles, leads, follow_ups, activities
-- Enables Row Level Security (RLS), triggers, constraints, indexes

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'counsellor' CHECK (role IN ('admin', 'manager', 'counsellor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for new user registration -> auto-insert into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'counsellor' -- Default to counsellor for least privilege
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  course_interest TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Website', 'Walk-in', 'Phone Call', 'Referral', 'Social Media', 'Other')),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Follow-ups Table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Activities History Table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'status_change', 'note_added', 'followup_created', 'followup_completed')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_at ON public.follow_ups(due_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);

-- Enable Row Level Security (RLS) on all CRM tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Helper function to inspect current user's role safely
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies: Profiles
CREATE POLICY "Users can read all profiles for assignment names"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own full_name but not change role"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies: Leads
-- Counsellors can see leads created by them OR assigned to them.
-- Managers and Admins can see all leads across the academy.
CREATE POLICY "Select leads based on role and assignment"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    public.get_current_role() IN ('admin', 'manager') OR
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update accessible leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.get_current_role() IN ('admin', 'manager') OR
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  )
  WITH CHECK (
    public.get_current_role() IN ('admin', 'manager') OR
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Delete leads restricted to admins"
  ON public.leads FOR DELETE
  TO authenticated
  USING (
    public.get_current_role() = 'admin'
  );

-- RLS Policies: Follow-ups
CREATE POLICY "Select follow_ups matching accessible leads"
  ON public.follow_ups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = follow_ups.lead_id AND (
        public.get_current_role() IN ('admin', 'manager') OR
        l.assigned_to = auth.uid() OR
        l.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Insert follow_ups on accessible leads"
  ON public.follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = follow_ups.lead_id AND (
        public.get_current_role() IN ('admin', 'manager') OR
        l.assigned_to = auth.uid() OR
        l.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Update follow_ups on accessible leads"
  ON public.follow_ups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = follow_ups.lead_id AND (
        public.get_current_role() IN ('admin', 'manager') OR
        l.assigned_to = auth.uid() OR
        l.created_by = auth.uid()
      )
    )
  );

-- RLS Policies: Activities
CREATE POLICY "Select activities matching accessible leads"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = activities.lead_id AND (
        public.get_current_role() IN ('admin', 'manager') OR
        l.assigned_to = auth.uid() OR
        l.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Insert activity logs"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

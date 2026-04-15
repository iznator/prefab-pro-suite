
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==================== PROFILES ====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== LEADS ====================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  lat DOUBLE PRECISION DEFAULT 0,
  lng DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'nouveau',
  tags TEXT[] DEFAULT '{}',
  assigned_to TEXT DEFAULT '',
  house_model TEXT DEFAULT '',
  budget NUMERIC DEFAULT 0,
  surface NUMERIC DEFAULT 0,
  source TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contact TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== LEAD NOTES ====================
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead notes" ON public.lead_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert lead notes" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lead notes" ON public.lead_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete lead notes" ON public.lead_notes FOR DELETE TO authenticated USING (true);

-- ==================== LEAD MESSAGES ====================
CREATE TABLE public.lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead messages" ON public.lead_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert lead messages" ON public.lead_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update lead messages" ON public.lead_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete lead messages" ON public.lead_messages FOR DELETE TO authenticated USING (true);

-- ==================== NETWORK MEMBERS ====================
CREATE TABLE public.network_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'commercial',
  zone TEXT DEFAULT '',
  manager_id UUID REFERENCES public.network_members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'actif',
  avatar TEXT DEFAULT '',
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.network_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view network members" ON public.network_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert network members" ON public.network_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update network members" ON public.network_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete network members" ON public.network_members FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_network_members_updated_at BEFORE UPDATE ON public.network_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== NETWORK ZONES ====================
CREATE TABLE public.network_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT DEFAULT '',
  department TEXT DEFAULT '',
  responsible_id UUID REFERENCES public.network_members(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.network_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view network zones" ON public.network_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert network zones" ON public.network_zones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update network zones" ON public.network_zones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete network zones" ON public.network_zones FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_network_zones_updated_at BEFORE UPDATE ON public.network_zones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

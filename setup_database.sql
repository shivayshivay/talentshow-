-- ============================================================
-- Izee Got Talent — Full Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('audience', 'participant')),
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies if re-running
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
DROP POLICY IF EXISTS "Service role can read all" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can verify by ID" ON public.registrations;

-- Step 4: Allow anyone to self-register
CREATE POLICY "Anyone can register"
  ON public.registrations
  FOR INSERT
  WITH CHECK (true);

-- Step 5: Allow the verify page to look up tickets by ID
CREATE POLICY "Anyone can verify by ID"
  ON public.registrations
  FOR SELECT
  USING (true);

-- Step 6: Profiles table for admin login
CREATE TABLE IF NOT EXISTS public.profiles (
  id     UUID REFERENCES auth.users(id) PRIMARY KEY,
  email  TEXT,
  role   TEXT DEFAULT 'user'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Step 7: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

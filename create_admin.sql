-- ============================================================
-- Default Admin Account Setup for Izee Got Talent
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Create the admin user in Supabase Auth
SELECT supabase_admin.create_user(
  '{"email": "adminizee@gmail.com", "password": "qaz123wsx", "email_confirm": true}'::jsonb
);

-- ⚠️ If the above doesn't work in your Supabase version, use this instead:
-- Go to Supabase Dashboard → Authentication → Users → Add User (manual)
-- Email: adminizee@gmail.com | Password: qaz123wsx | Check "Auto Confirm"

-- Step 2: Set the role to 'admin' in the profiles table
-- (Run this AFTER the user is created so the UUID exists)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'adminizee@gmail.com';

-- Step 3: If profiles row doesn't exist yet, insert it manually
-- First get the UUID from auth.users, then insert:
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'adminizee@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

-- Step 4: Verify the admin was created correctly
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'adminizee@gmail.com';

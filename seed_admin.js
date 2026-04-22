// ============================================================
// Default Admin Seed Script for Izee Got Talent
// Usage:
//   1. npm install @supabase/supabase-js dotenv
//   2. Make sure your .env file has VITE_SUPABASE_URL and
//      VITE_SUPABASE_SERVICE_ROLE_KEY  ← (service role key, NOT publishable)
//   3. node seed_admin.js
// ============================================================

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ⚠️ IMPORTANT: This script needs your SERVICE ROLE key (not the anon/publishable key)
// Get it from: Supabase Dashboard → Project Settings → API → service_role key
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables.");
  console.error("   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your .env file.");
  process.exit(1);
}

// Use service role client — bypasses RLS, required for admin user creation
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "adminizee@gmail.com";
const ADMIN_PASSWORD = "qaz123wsx";

async function seedAdmin() {
  console.log("🚀 Starting admin account creation...\n");

  // Step 1: Create the user in Supabase Auth
  console.log(`📧 Creating auth user: ${ADMIN_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Skip email verification
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.warn("⚠️  User already exists in auth. Skipping creation, proceeding to role update...");
    } else {
      console.error("❌ Failed to create auth user:", authError.message);
      process.exit(1);
    }
  } else {
    console.log("✅ Auth user created:", authData.user.id);
  }

  // Step 2: Fetch the user's UUID (in case they already existed)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Could not fetch users list:", listError.message);
    process.exit(1);
  }

  const adminUser = users.find((u) => u.email === ADMIN_EMAIL);
  if (!adminUser) {
    console.error("❌ Could not find admin user after creation.");
    process.exit(1);
  }

  console.log(`🔑 Admin UUID: ${adminUser.id}`);

  // Step 3: Upsert role in profiles table
  console.log("👤 Setting role to 'admin' in profiles table...");
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: adminUser.id,
        email: ADMIN_EMAIL,
        role: "admin",
      },
      { onConflict: "id" }
    );

  if (profileError) {
    // If profiles table doesn't exist or has different columns, log clearly
    console.warn("⚠️  Could not upsert profiles table:", profileError.message);
    console.warn("   You may need to adjust the column names to match your schema.");
  } else {
    console.log("✅ Profile role set to 'admin'.");
  }

  console.log("\n🎉 Admin account ready!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role    : admin`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

seedAdmin();

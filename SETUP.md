# Izee Got Talent — Self-Registration System

## How it works
1. Share `/register` link → Student fills form → Clicks Submit
2. Edge function saves to Supabase → Generates QR → Sends email
3. QR encodes `https://your-site.com/verify?id=UUID`
4. At the door: scan QR → browser opens verify page → ✅ or ❌

---

## Setup (one-time)

### Step 1 — Run Database SQL
Open **Supabase Dashboard → SQL Editor → New tab**
Paste & run the contents of `setup_database.sql`

### Step 2 — Add routes to App.tsx
```tsx
import Register from "./pages/Register";
import Verify from "./pages/Verify";

// Inside your <Routes>:
<Route path="/register" element={<Register />} />
<Route path="/verify" element={<Verify />} />
```

### Step 3 — Deploy the edge function
```bash
supabase functions deploy register
```

### Step 4 — Set secrets on Supabase
```bash
supabase secrets set RESEND_API_KEY=re_DDxCo5hL_...
supabase secrets set SITE_URL=https://your-deployed-site.netlify.app
```
> ⚠️ Replace the SITE_URL with your actual deployed URL. This is what gets encoded in QR codes.

### Step 5 — Deploy your site
```bash
npm run build
# Deploy the dist/ folder to Netlify / Vercel
```

### Step 6 — Share the registration link
```
https://your-site.netlify.app/register
```

---

## Testing locally
1. Set `SITE_URL=http://localhost:5173` in Supabase secrets
2. Run `supabase functions serve register --env-file supabase/functions/register/.env`
3. Run `npm run dev`
4. Open http://localhost:5173/register

---

## Files added
```
src/pages/Register.tsx          ← Public self-registration form
src/pages/Verify.tsx            ← QR scan destination (shows ✅/❌)
supabase/functions/register/    ← Edge function: saves + emails ticket
setup_database.sql              ← Updated DB schema with correct RLS
```

---

## Why QR was invalid before
| Before | Now |
|--------|-----|
| QR encoded raw JSON `{"id":"...","name":"..."}` | QR encodes `https://your-site/verify?id=UUID` |
| Scanners show garbled text → "invalid" | Scanners open verify page directly |
| Image loaded from external URL (blocked by Gmail) | Image loaded from api.qrserver.com (allowed) |
| No `/verify` page existed | `/verify?id=...` shows name, role, ✅ |

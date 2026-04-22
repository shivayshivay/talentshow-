# 🎟️ Izee Got Talent — QR Ticket Sender

Send personalized QR entry passes to all registered audience & participants via email.

---

## Event Details
- **Event:** Izee Got Talent + DJ Night
- **Date:** Friday, 24 April 2026 · 2:30 PM
- **Venue:** Main Auditorium, Izee College

---

## Option A — Run Locally (Node.js Script)

### 1. Add service role key to `.env`
```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
Get it from: Supabase Dashboard → Project Settings → API → `service_role`

### 2. Install dependencies
```bash
npm install @supabase/supabase-js dotenv
```

### 3. Run the script
```bash
# Send to ALL registrations
node scripts/send_tickets.js

# Send to audience only
node scripts/send_tickets.js audience

# Send to participants only
node scripts/send_tickets.js participant
```

---

## Option B — Supabase Edge Function (Serverless)

### 1. Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 2. Link your project
```bash
supabase link --project-ref dgdmvmjnjinyctjjvyyd
```

### 3. Set secrets
```bash
supabase secrets set RESEND_API_KEY=re_DDxCo5hL_9LiP34Cpnq5SzcNx3uNdxGit
```

### 4. Deploy the function
```bash
supabase functions deploy send-tickets
```

### 5. Invoke the function
```bash
# Send to ALL
curl -X POST https://dgdmvmjnjinyctjjvyyd.supabase.co/functions/v1/send-tickets \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Send to audience only
curl -X POST https://dgdmvmjnjinyctjjvyyd.supabase.co/functions/v1/send-tickets \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role": "audience"}'

# Send to participants only
curl -X POST https://dgdmvmjnjinyctjjvyyd.supabase.co/functions/v1/send-tickets \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role": "participant"}'
```

---

## Column Name Mapping

The scripts auto-detect these common column name patterns:

| Field    | Tries in order                          |
|----------|-----------------------------------------|
| Name     | `name` → `full_name` → `username`       |
| Email    | `email`                                 |
| Role     | `role` → `ticket_type`                  |
| ID       | `id`                                    |

If your columns are named differently, update the helper functions in:
- `scripts/send_tickets.js` → `buildQRPayload()` and `buildEmailHTML()`
- `supabase/functions/send-tickets/index.ts` → same functions

---

## Resend Free Tier Limits
- 3,000 emails/month
- 100 emails/day
- From address must use `onboarding@resend.dev` until you verify a domain

To use your own domain (e.g. `tickets@izee.com`):
1. Go to resend.com → Domains → Add Domain
2. Add DNS records to your domain
3. Update the `from` field in both scripts

// ============================================================
// Supabase Edge Function — Send QR Tickets via Resend
// Deploy: supabase functions deploy send-tickets
// Invoke:  POST /functions/v1/send-tickets
//   Body (optional): { "role": "audience" | "participant" }
//   Omit body to send to ALL registrations
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EVENT = {
  name: "Izee Got Talent + DJ Night",
  date: "Friday, 24 April 2026",
  time: "2:30 PM",
  venue: "Main Auditorium, Izee College",
};

// Generate QR code as a Google Charts URL (no extra lib needed)
function getQRUrl(data: string): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=ffffff&color=000000&margin=10`;
}

// Build the ticket payload embedded in the QR
function buildQRPayload(reg: any): string {
  return JSON.stringify({
    id: reg.id,
    name: reg.name || reg.full_name || reg.username || "Attendee",
    role: reg.role || reg.ticket_type || "audience",
    event: EVENT.name,
  });
}

// Beautiful HTML email template
function buildEmailHTML(reg: any): string {
  const name = reg.name || reg.full_name || reg.username || "Attendee";
  const role = (reg.role || reg.ticket_type || "audience").toLowerCase();
  const roleLabel = role === "participant" ? "🎤 Participant" : "🎟️ Audience";
  const roleColor = role === "participant" ? "#a855f7" : "#06b6d4";
  const qrUrl = getQRUrl(buildQRPayload(reg));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Ticket — ${EVENT.name}</title>
</head>
<body style="margin:0;padding:0;background:#0a0612;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0612;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#12091f;border-radius:16px;overflow:hidden;border:1px solid #2d1b4e;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0d0220 100%);padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2d1b4e;">
              <div style="font-size:11px;letter-spacing:4px;color:#a855f7;text-transform:uppercase;margin-bottom:10px;">Official Entry Pass</div>
              <div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;margin-bottom:6px;">${EVENT.name}</div>
              <div style="width:48px;height:3px;background:linear-gradient(90deg,#a855f7,#06b6d4);border-radius:2px;margin:14px auto 0;"></div>
            </td>
          </tr>

          <!-- Event Info -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 8px 0 0;width:50%;">
                    <div style="background:#1a0d2e;border-radius:10px;padding:14px 16px;border:1px solid #2d1b4e;">
                      <div style="font-size:10px;letter-spacing:2px;color:#7c3aed;text-transform:uppercase;margin-bottom:4px;">Date & Time</div>
                      <div style="color:#e2d9f3;font-size:13px;font-weight:600;">${EVENT.date}</div>
                      <div style="color:#a78bca;font-size:12px;margin-top:2px;">${EVENT.time}</div>
                    </div>
                  </td>
                  <td style="padding:0 0 0 8px;width:50%;">
                    <div style="background:#1a0d2e;border-radius:10px;padding:14px 16px;border:1px solid #2d1b4e;">
                      <div style="font-size:10px;letter-spacing:2px;color:#7c3aed;text-transform:uppercase;margin-bottom:4px;">Venue</div>
                      <div style="color:#e2d9f3;font-size:13px;font-weight:600;">${EVENT.venue}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attendee Info -->
          <tr>
            <td style="padding:20px 40px 0;">
              <div style="background:#1a0d2e;border-radius:10px;padding:16px 20px;border:1px solid #2d1b4e;display:flex;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size:10px;letter-spacing:2px;color:#7c3aed;text-transform:uppercase;margin-bottom:6px;">Attendee</div>
                      <div style="color:#ffffff;font-size:18px;font-weight:700;">${name}</div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="background:${roleColor}22;color:${roleColor};border:1px solid ${roleColor}55;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;">${roleLabel}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <div style="background:#ffffff;display:inline-block;border-radius:12px;padding:12px;box-shadow:0 0 40px #a855f733;">
                <img src="${qrUrl}" width="180" height="180" alt="Entry QR Code" style="display:block;border-radius:6px;"/>
              </div>
              <div style="color:#7c6a9a;font-size:11px;margin-top:12px;letter-spacing:1px;">Scan at entry · Valid for one person only</div>
              <div style="color:#4a3d6b;font-size:10px;margin-top:4px;font-family:monospace;">ID: ${reg.id}</div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px dashed #2d1b4e;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <div style="color:#4a3d6b;font-size:11px;line-height:1.6;">
                Please carry this ticket (digital or printed) to the event.<br/>
                This pass is non-transferable and unique to you.
              </div>
              <div style="margin-top:14px;font-size:10px;color:#2d1b4e;letter-spacing:2px;text-transform:uppercase;">Izee Got Talent · 2026</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optional: filter by role from request body
    let body: any = {};
    try { body = await req.json(); } catch (_) {}

    let query = supabase.from("registrations").select("*");
    if (body.role) query = query.eq("role", body.role);

    const { data: registrations, error: dbError } = await query;
    if (dbError) throw new Error(`DB error: ${dbError.message}`);
    if (!registrations || registrations.length === 0) {
      return new Response(JSON.stringify({ message: "No registrations found." }), { status: 200 });
    }

    const results = { sent: [] as string[], failed: [] as string[] };

    for (const reg of registrations) {
      const email = reg.email;
      if (!email) { results.failed.push(`ID ${reg.id} — no email`); continue; }

      const name = reg.name || reg.full_name || reg.username || "Attendee";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Izee Got Talent <onboarding@resend.dev>",
          to: [email],
          subject: `🎟️ Your Entry Pass — ${EVENT.name}`,
          html: buildEmailHTML(reg),
        }),
      });

      if (res.ok) {
        results.sent.push(email);
      } else {
        const err = await res.text();
        results.failed.push(`${email}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: registrations.length,
        sent: results.sent.length,
        failed: results.failed.length,
        details: results,
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

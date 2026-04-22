// ============================================================
// Supabase Edge Function — Self-Registration + QR Email
// Deploy: supabase functions deploy register
// POST /functions/v1/register
//   Body: { name, email, role, phone }
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Set this secret: supabase secrets set SITE_URL=https://your-site.netlify.app
const SITE_URL = Deno.env.get("SITE_URL") || "https://your-site.netlify.app";

const EVENT = {
  name: "Izee Got Talent + DJ Night",
  date: "Friday, 24 April 2026",
  time: "2:30 PM",
  venue: "Main Auditorium, Izee College",
};

// QR encodes a real URL — scanners open the verify page directly
function buildVerifyURL(id: string): string {
  return `${SITE_URL}/verify?id=${id}`;
}

// QR image via api.qrserver.com — reliable, no CORS issues in email
function getQRImageURL(verifyURL: string): string {
  const encoded = encodeURIComponent(verifyURL);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}&bgcolor=ffffff&color=000000&margin=10&ecc=M`;
}

function buildEmailHTML(reg: { id: string; name: string; role: string }): string {
  const roleLabel = reg.role === "participant" ? "🎤 Participant" : "🎟️ Audience";
  const roleColor = reg.role === "participant" ? "#a855f7" : "#06b6d4";
  const verifyURL = buildVerifyURL(reg.id);
  const qrImageURL = getQRImageURL(verifyURL);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
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
                      <div style="font-size:10px;letter-spacing:2px;color:#7c3aed;text-transform:uppercase;margin-bottom:4px;">Date &amp; Time</div>
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

          <!-- Attendee -->
          <tr>
            <td style="padding:20px 40px 0;">
              <div style="background:#1a0d2e;border-radius:10px;padding:16px 20px;border:1px solid #2d1b4e;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size:10px;letter-spacing:2px;color:#7c3aed;text-transform:uppercase;margin-bottom:6px;">Attendee</div>
                      <div style="color:#ffffff;font-size:18px;font-weight:700;">${reg.name}</div>
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
                <img src="${qrImageURL}" width="200" height="200" alt="Entry QR Code" style="display:block;border-radius:6px;"/>
              </div>
              <div style="color:#7c6a9a;font-size:11px;margin-top:12px;letter-spacing:1px;">Scan this QR at the entry gate</div>
              <div style="color:#4a3d6b;font-size:10px;margin-top:4px;font-family:monospace;">${reg.id}</div>
              <div style="margin-top:16px;">
                <a href="${verifyURL}" style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;display:inline-block;">
                  🔗 Open Ticket Verification Page
                </a>
              </div>
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, email, role, phone } = body;

    // Validate
    if (!name || !email || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "name, email, and role are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!["audience", "participant"].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "role must be 'audience' or 'participant'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for duplicate email
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, error: "This email is already registered." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert registration
    const { data: reg, error: insertError } = await supabase
      .from("registrations")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        phone: phone?.trim() || null,
      })
      .select()
      .single();

    if (insertError) throw new Error(`DB insert error: ${insertError.message}`);

    // Send email with QR ticket
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Izee Got Talent <onboarding@resend.dev>",
        to: [reg.email],
        subject: `🎟️ Your Entry Pass — ${EVENT.name}`,
        html: buildEmailHTML({ id: reg.id, name: reg.name, role: reg.role }),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      // Still return success — user is registered, email failed
      return new Response(
        JSON.stringify({
          success: true,
          id: reg.id,
          warning: "Registered successfully but email delivery failed. Contact support.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: reg.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

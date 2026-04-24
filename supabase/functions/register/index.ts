import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { name, email, phone, uucms, role, year, semester } = body;

    if (!name || !email || !role || !year || !semester || !uucms) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields",
      }), { status: 400, headers: corsHeaders });
    }

    // Prevent duplicate email
    const { data: existingEmail } = await supabase
      .from("registrations")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: "This email is already registered.",
      }), { status: 400, headers: corsHeaders });
    }

    // Prevent duplicate UUCMS ID
    const { data: existingUucms } = await supabase
      .from("registrations")
      .select("id")
      .eq("uucms", uucms)
      .maybeSingle();

    if (existingUucms) {
      return new Response(JSON.stringify({
        success: false,
        error: "This UUCMS ID is already registered.",
      }), { status: 400, headers: corsHeaders });
    }

    // Insert registration
    const { data, error } = await supabase
      .from("registrations")
      .insert([{
        name,
        email,
        phone: phone || null,
        uucms,
        role,
        year,
        semester,
        status: "pending",
        checked_in: false,
      }])
      .select()
      .single();

    if (error) throw error;

    const ticketId = data.id;
    const shortId = ticketId.slice(0, 8).toUpperCase();
    const siteUrl = Deno.env.get("SITE_URL") || "https://izee-three.vercel.app";
    const verifyUrl = `${siteUrl}/verify?id=${ticketId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(verifyUrl)}&color=000000&bgcolor=ffffff&margin=10`;

    const roleLabel = role === "participant" ? "🎭 Participant" : "👥 Audience";
    const yearLabel = `Year ${year}`;
    const semLabel = `Semester ${semester}`;

    // ── Send email via Brevo ──
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (BREVO_API_KEY) {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Izee Got Talent Ticket</title>
</head>
<body style="margin:0;padding:0;background:#050311;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050311;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:linear-gradient(135deg,#0f0820 0%,#12092a 100%);border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.4);" cellpadding="0" cellspacing="0">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%);padding:28px 32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🎤</div>
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;letter-spacing:1px;">Izee Got Talent</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">+ DJ Night Extravaganza</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 12px;">
              <h2 style="color:#e5e7eb;font-size:20px;margin:0 0 8px;">Hey ${name}! 🎉</h2>
              <p style="color:#9ca3af;font-size:14px;margin:0;line-height:1.6;">
                You're officially on the list. Show the QR code below at the entry gate to get in.
              </p>
            </td>
          </tr>

          <!-- Ticket Card -->
          <tr>
            <td style="padding:12px 32px 12px;">
              <table width="100%" style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.4);border-radius:16px;overflow:hidden;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 20px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:50%;padding-bottom:12px;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">NAME</div>
                          <div style="color:#e5e7eb;font-size:15px;font-weight:700;">${name}</div>
                        </td>
                        <td style="width:50%;padding-bottom:12px;text-align:right;">
                          <span style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;">${roleLabel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">EMAIL</div>
                          <div style="color:#9ca3af;font-size:13px;">${email}</div>
                        </td>
                        <td style="padding-bottom:12px;text-align:right;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">UUCMS ID</div>
                          <div style="color:#e5e7eb;font-size:13px;font-weight:600;">${uucms}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">YEAR & SEM</div>
                          <div style="color:#9ca3af;font-size:13px;">${yearLabel} — ${semLabel}</div>
                        </td>
                        <td style="padding-bottom:12px;text-align:right;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">TICKET ID</div>
                          <div style="color:#a78bfa;font-size:14px;font-weight:800;font-family:monospace;letter-spacing:1px;">#${shortId}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Dashed divider -->
                    <div style="border-top:1px dashed rgba(124,58,237,0.4);margin:4px 0 16px;"></div>

                    <!-- QR Code -->
                    <div style="text-align:center;">
                      <img src="${qrUrl}" width="180" height="180" alt="Entry QR Code"
                        style="border-radius:12px;border:4px solid rgba(124,58,237,0.4);display:block;margin:0 auto;" />
                      <p style="color:#6b7280;font-size:11px;margin:10px 0 4px;">Scan this QR at the entry gate</p>
                      <!-- UPDATE #4: Ticket ID shown clearly for manual entry if scanner fails -->
                      <div style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:8px;padding:8px 16px;display:inline-block;margin-top:6px;">
                        <div style="color:#6b7280;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">Manual Entry ID (if scanner fails)</div>
                        <div style="color:#a78bfa;font-size:16px;font-weight:900;font-family:monospace;letter-spacing:2px;">#${shortId}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:16px 32px 20px;text-align:center;">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">
                🎟️ View My Ticket Online
              </a>
            </td>
          </tr>

          <!-- Info -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#9ca3af;font-size:12px;">📍 <strong style="color:#e5e7eb;">Venue:</strong> College Auditorium</td></tr>
                <tr><td style="padding:6px 0;color:#9ca3af;font-size:12px;">📅 <strong style="color:#e5e7eb;">Date:</strong> As announced by organizers</td></tr>
                <tr><td style="padding:6px 0;color:#9ca3af;font-size:12px;">⏰ <strong style="color:#e5e7eb;">Tip:</strong> Arrive 15 mins early for smooth entry</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:16px 32px;text-align:center;">
              <p style="color:#4b5563;font-size:11px;margin:0;">This is an automated ticket confirmation. Do not reply to this email.</p>
              <p style="color:#4b5563;font-size:11px;margin:4px 0 0;">© 2025 Izee Got Talent — All rights reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "Izee Got Talent", email: "shivay3991@gmail.com" },
          to: [{ email, name }],
          subject: `🎟️ Your Entry Pass — Izee Got Talent | Ticket #${shortId}`,
          htmlContent,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Brevo email error:", errText);
        // Still return success — ticket is saved, just log the email failure
      }
    } else {
      console.warn("BREVO_API_KEY not set — skipping email");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Registered successfully! Check your email.",
      ticket: {
        id: ticketId,
        name,
        email,
        role,
        qrUrl,
        verifyUrl,
      },
    }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("Registration error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Internal server error",
    }), { status: 500, headers: corsHeaders });
  }
});
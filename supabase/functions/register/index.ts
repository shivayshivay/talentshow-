import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, role, phone } = await req.json();

    if (!name || !email || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "Name, email and role are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!["audience", "participant"].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid role selected" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ✅ Duplicate email check
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, error: "This email is already registered. Each email can only register once." }),
        { status: 409, headers: corsHeaders }
      );
    }

    // ✅ Insert into DB
    const { data, error } = await supabase
      .from("registrations")
      .insert([{
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        phone: phone?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const verifyUrl = `${SITE_URL}/verify?id=${data.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(verifyUrl)}&color=000000&bgcolor=ffffff&margin=10`;
    const ticketId = data.id.slice(0, 8).toUpperCase();
    const roleLabel = role === "participant" ? "🎭 Participant" : "👥 Audience";

    // ✅ Beautiful HTML email
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
                        <td style="width:50%;padding-bottom:14px;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">NAME</div>
                          <div style="color:#e5e7eb;font-size:15px;font-weight:700;">${name}</div>
                        </td>
                        <td style="width:50%;padding-bottom:14px;text-align:right;">
                          <span style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;">${roleLabel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:14px;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">EMAIL</div>
                          <div style="color:#9ca3af;font-size:13px;">${email}</div>
                        </td>
                        <td style="text-align:right;padding-bottom:14px;">
                          <div style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;">TICKET ID</div>
                          <div style="color:#a78bfa;font-size:13px;font-weight:700;">#${ticketId}</div>
                        </td>
                      </tr>
                    </table>
                    <!-- Dashed divider -->
                    <div style="border-top:1px dashed rgba(124,58,237,0.4);margin:4px 0 16px;"></div>
                    <!-- QR Code -->
                    <div style="text-align:center;">
                      <img src="${qrUrl}" width="180" height="180" alt="Entry QR Code" style="border-radius:12px;border:4px solid rgba(124,58,237,0.4);display:block;margin:0 auto;" />
                      <p style="color:#6b7280;font-size:11px;margin:10px 0 0;">Scan this QR at the entry gate</p>
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
                <tr>
                  <td style="padding:6px 0;color:#9ca3af;font-size:12px;">📍 <strong style="color:#e5e7eb;">Venue:</strong> College Auditorium</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#9ca3af;font-size:12px;">📅 <strong style="color:#e5e7eb;">Date:</strong> As announced by organizers</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#9ca3af;font-size:12px;">⏰ <strong style="color:#e5e7eb;">Tip:</strong> Arrive 15 mins early for smooth entry</td>
                </tr>
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

    // ✅ Send via Brevo
    const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "Izee Got Talent", email: "shivay3991@gmail.com" },
        to: [{ email, name }],
        subject: `🎟️ Your Entry Pass — Izee Got Talent #${ticketId}`,
        htmlContent,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Brevo error:", errText);
      // Still return success with ticket data even if email fails
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Registered but email failed to send. Check Brevo sender verification.",
          ticket: { id: data.id, name, email, role, qrUrl, verifyUrl },
        }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Registered successfully! Check your email.",
        ticket: { id: data.id, name, email, role, qrUrl, verifyUrl },
      }),
      { headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

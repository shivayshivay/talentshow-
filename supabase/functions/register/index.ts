import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { name, email, phone, role, year, semester } = body;

    if (!name || !email || !role || !year || !semester) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields"
      }), { status: 400 });
    }

    // 🚫 Prevent duplicate registrations
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: "You already registered with this email"
      }), { status: 400 });
    }

    // ✅ Insert
    const { data, error } = await supabase
      .from("registrations")
      .insert([{
        name,
        email,
        phone,
        role,
        year,
        semester,
        status: "confirmed", // 🔥 changed from pending → confirmed
      }])
      .select()
      .single();

    if (error) throw error;

    const ticketId = data.id;

    // 🎟 QR
    const qrUrl = await QRCode.toDataURL(ticketId);

    const verifyUrl = `${Deno.env.get("SITE_URL")}/verify?id=${ticketId}`;

    return new Response(JSON.stringify({
      success: true,
      ticket: {
        id: ticketId,
        name,
        email,
        role,
        qrUrl,
        verifyUrl,
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500 });
  }
});
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

    if (!name || !email || !role) {
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400 });
    }

    // insert into DB
    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          name,
          email,
          phone,
          role,
          year,
          semester,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const ticketId = data.id;

    // create QR (contains ID)
    const qrData = `${ticketId}`;
    const qrUrl = await QRCode.toDataURL(qrData);

    // optional verify link
    const verifyUrl = `${Deno.env.get("SITE_URL")}/verify?id=${ticketId}`;

    return new Response(
      JSON.stringify({
        success: true,
        ticket: {
          id: ticketId,
          name,
          email,
          role,
          qrUrl,
          verifyUrl,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
});
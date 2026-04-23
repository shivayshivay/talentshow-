import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Scanner() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const verify = async () => {
    const id = input.trim();

    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) {
      setResult("❌ Invalid Ticket");
      return;
    }

    if (data.status !== "approved") {
      setResult("⛔ Not Approved");
      return;
    }

    if (data.checked_in) {
      setResult("⚠️ Already Used");
      return;
    }

    await supabase
      .from("registrations")
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq("id", id);

    setResult("✅ Entry Allowed");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>QR Scanner (Manual)</h2>

      <input
        placeholder="Enter Ticket ID"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={verify}>Verify</button>

      <h3>{result}</h3>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export default function Verify() {
  const [status, setStatus] = useState("Checking...");
  const [params] = useSearchParams();

  useEffect(() => {
    const verify = async () => {
      const id = params.get("id");
      if (!id) return setStatus("Invalid QR ❌");

      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return setStatus("Invalid ❌");

      if (data.checked_in) {
        setStatus("Already Used ⚠️");
      } else {
        await supabase
          .from("registrations")
          .update({ checked_in: true })
          .eq("id", id);

        setStatus("Valid ✅ Entry Allowed");
      }
    };

    verify();
  }, []);

  return <h1>{status}</h1>;
}

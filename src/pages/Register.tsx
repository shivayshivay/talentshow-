```tsx
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Correct env variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const EVENT = {
  name: "Izee Got Talent + DJ Night",
  date: "Friday, 24 April 2026",
  time: "2:30 PM",
  venue: "Main Auditorium, Izee College",
};

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.role) {
      setStatus("error");
      setMessage("Please fill in all required fields.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const { error } = await supabase
        .from("registrations")
        .insert([form]);

      if (error) throw error;

      setStatus("success");
      setMessage("🎉 You're registered successfully!");
      setForm({ name: "", email: "", phone: "", role: "" });

    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0612",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        background: "#12091f",
        borderRadius: "16px",
        border: "1px solid #2d1b4e",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#1a0533 0%,#0d0220 100%)",
          padding: "32px",
          textAlign: "center",
          borderBottom: "1px solid #2d1b4e",
        }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
            {EVENT.name}
          </div>
          <div style={{ marginTop: "10px", color: "#a78bca", fontSize: "13px" }}>
            📅 {EVENT.date} · {EVENT.time}
          </div>
          <div style={{ color: "#7c6a9a", fontSize: "12px" }}>
            📍 {EVENT.venue}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "24px" }}>
          {status === "success" ? (
            <div style={{ textAlign: "center", color: "#22c55e" }}>
              <h3>✅ Registration Successful</h3>
              <p>{message}</p>
              <button onClick={() => setStatus("idle")}>
                Register another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>

              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
                style={inputStyle}
              />

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
                style={inputStyle}
              />

              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                style={inputStyle}
              />

              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                required
                style={inputStyle}
              >
                <option value="">Select role</option>
                <option value="audience">Audience</option>
                <option value="participant">Participant</option>
              </select>

              {status === "error" && (
                <p style={{ color: "red" }}>{message}</p>
              )}

              <button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Registering..." : "Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: "12px",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #444",
};
```

```tsx
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
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
      console.log("Submitting:", form);

      const { data, error } = await supabase
        .from("registrations")
        .insert([form])
        .select();

      console.log("Response:", data, error);

      if (error) throw error;

      setStatus("success");
      setMessage("🎉 You're registered successfully!");
      setForm({ name: "", email: "", phone: "", role: "" });

    } catch (err: any) {
      console.error("Error:", err);
      setStatus("error");
      setMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <div style={container}>
      <div style={card}>

        {/* Header */}
        <div style={header}>
          <h2 style={{ margin: 0 }}>{EVENT.name}</h2>
          <p style={subText}>📅 {EVENT.date} · {EVENT.time}</p>
          <p style={subText}>📍 {EVENT.venue}</p>
        </div>

        {/* Form */}
        <div style={{ padding: 24 }}>
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

              <button
                type="submit"
                disabled={status === "loading"}
                style={buttonStyle}
              >
                {status === "loading" ? "Registering..." : "Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// 🎨 Styles
const container: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0a0612",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 450,
  background: "#12091f",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid #2d1b4e",
};

const header: React.CSSProperties = {
  padding: 20,
  textAlign: "center",
  borderBottom: "1px solid #2d1b4e",
  color: "#fff",
};

const subText: React.CSSProperties = {
  fontSize: 12,
  color: "#a78bca",
  margin: "4px 0",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginBottom: 12,
  padding: 10,
  borderRadius: 6,
  border: "1px solid #444",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
```

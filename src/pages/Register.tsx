import { useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.role) {
      setStatus("error");
      setMessage("Please fill all required fields");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(form),
      });

      // ✅ SAFE RESPONSE HANDLING (fixes your JSON error)
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error or wrong API URL");
      }

      if (!data.success) throw new Error(data.error || "Registration failed");

      setStatus("success");
      setMessage("🎉 Check your email for your QR ticket!");
      setForm({ name: "", email: "", phone: "", role: "" });

    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={title}>🎤 Izee Got Talent</h2>

        {status === "success" ? (
          <div style={successBox}>
            <h3>✅ Registration Successful</h3>
            <p>{message}</p>
            <button onClick={() => setStatus("idle")} style={button}>
              Register Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              style={input}
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              style={input}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <input
              style={input}
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <select
              style={input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              <option value="audience">Audience</option>
              <option value="participant">Participant</option>
            </select>

            {status === "error" && (
              <p style={{ color: "#f87171" }}>{message}</p>
            )}

            <button type="submit" disabled={status === "loading"} style={button}>
              {status === "loading" ? "Registering..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* 🎨 STYLES */

const container: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0612",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  background: "#12091f",
  padding: "30px",
  borderRadius: "16px",
  border: "1px solid #2d1b4e",
  textAlign: "center",
};

const title: React.CSSProperties = {
  color: "#fff",
  marginBottom: "20px",
};

const input: React.CSSProperties = {
  width: "100%",
  marginBottom: "12px",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #2d1b4e",
  background: "#0f0820",
  color: "#fff",
};

const button: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const successBox: React.CSSProperties = {
  color: "#22c55e",
};
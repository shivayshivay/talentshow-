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

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

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
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setStatus("success");
      setMessage("🎉 Check your email for QR ticket!");
      setForm({ name: "", email: "", phone: "", role: "" });

    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Registration failed");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={{ color: "white" }}>🎤 Izee Got Talent</h2>

        {status === "success" ? (
          <>
            <p style={{ color: "#22c55e" }}>{message}</p>
            <button onClick={() => setStatus("idle")}>
              Register Again
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
              style={input}
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
              style={input}
            />

            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              style={input}
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
              required
              style={input}
            >
              <option value="">Select Role</option>
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
  );
}

const container: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0a0612",
};

const card: React.CSSProperties = {
  padding: 30,
  borderRadius: 12,
  background: "#12091f",
  width: 320,
  textAlign: "center",
};

const input: React.CSSProperties = {
  width: "100%",
  marginBottom: 12,
  padding: 10,
  borderRadius: 6,
  border: "1px solid #444",
};
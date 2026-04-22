import { useState } from "react";

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
    setMessage("");

    try {
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(
        "https://nqfuwwyqkrivempvixkm.supabase.co/functions/v1/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      setStatus("success");
      setMessage("🎉 Registered! Check your email for your QR ticket.");
      setForm({ name: "", email: "", phone: "", role: "" });

    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2>🎤 Izee Got Talent</h2>

        {status === "success" ? (
          <>
            <p>{message}</p>
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

            <button type="submit" style={button}>
              {status === "loading" ? "Loading..." : "Register"}
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
  alignItems: "center",
  justifyContent: "center",
};

const card: React.CSSProperties = {
  padding: 20,
  border: "1px solid #ccc",
  borderRadius: 10,
  width: 300,
  textAlign: "center",
};

const input: React.CSSProperties = {
  width: "100%",
  marginBottom: 10,
  padding: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const button: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 6,
  border: "none",
  background: "#7c3aed",
  color: "#fff",
  cursor: "pointer",
};
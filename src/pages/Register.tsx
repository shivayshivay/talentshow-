import { useState } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const EVENT = {
  name: "Izee Got Talent + DJ Night",
  date: "Friday, 24 April 2026",
  time: "2:30 PM",
  venue: "Main Auditorium, Izee College",
};

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("🎉 You're registered! Check your email for your QR ticket.");
        setForm({ name: "", email: "", phone: "", role: "" });
      } else {
        setStatus("error");
        setMessage(data.error || "Registration failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
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
          padding: "32px 32px 24px",
          textAlign: "center",
          borderBottom: "1px solid #2d1b4e",
        }}>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#a855f7", textTransform: "uppercase", marginBottom: "10px" }}>
            Register Now
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", lineHeight: 1.3 }}>
            {EVENT.name}
          </div>
          <div style={{ marginTop: "12px", color: "#a78bca", fontSize: "13px" }}>
            📅 {EVENT.date} · {EVENT.time}
          </div>
          <div style={{ color: "#7c6a9a", fontSize: "12px", marginTop: "4px" }}>
            📍 {EVENT.venue}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "28px 32px" }}>
          {status === "success" ? (
            <div style={{
              background: "#0d2b1a",
              border: "1px solid #22c55e55",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
              <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "17px", marginBottom: "8px" }}>
                Registration Successful!
              </div>
              <div style={{ color: "#86efac", fontSize: "14px", lineHeight: 1.6 }}>
                {message}
              </div>
              <button
                onClick={() => setStatus("idle")}
                style={{
                  marginTop: "20px",
                  background: "transparent",
                  border: "1px solid #2d1b4e",
                  color: "#a78bca",
                  borderRadius: "8px",
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Register another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#a78bca", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#a78bca", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                  style={inputStyle}
                />
                <div style={{ color: "#4a3d6b", fontSize: "11px", marginTop: "4px" }}>
                  QR ticket will be sent to this email
                </div>
              </div>

              {/* Phone */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "#a78bca", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  style={inputStyle}
                />
              </div>

              {/* Role */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", color: "#a78bca", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
                  Attending As *
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {[
                    { value: "audience", label: "🎟️ Audience", desc: "I'll be watching" },
                    { value: "participant", label: "🎤 Participant", desc: "I'm performing" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
                      style={{
                        flex: 1,
                        background: form.role === opt.value ? "#1a0d2e" : "#0f0820",
                        border: `1px solid ${form.role === opt.value ? "#7c3aed" : "#2d1b4e"}`,
                        borderRadius: "10px",
                        padding: "14px 12px",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: "18px", marginBottom: "4px" }}>{opt.label}</div>
                      <div style={{ color: "#7c6a9a", fontSize: "11px" }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {status === "error" && (
                <div style={{
                  background: "#2b0d0d",
                  border: "1px solid #ef444455",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}>
                  ⚠️ {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  background: status === "loading"
                    ? "#3b1a6b"
                    : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                {status === "loading" ? "⏳ Registering..." : "✨ Register & Get My Ticket"}
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
  background: "#0f0820",
  border: "1px solid #2d1b4e",
  borderRadius: "8px",
  padding: "12px 14px",
  color: "#e2d9f3",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

import { useState, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface TicketData {
  id: string;
  name: string;
  email: string;
  role: string;
  qrUrl: string;
  verifyUrl: string;
}

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) {
      setStatus("error");
      setMessage("⚠️ Please fill all required fields");
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

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error("Server error or invalid response"); }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      setTicket(data.ticket);
      setStatus("success");
      setMessage("🎉 Registration successful! Check your email for your QR ticket.");
      setForm({ name: "", email: "", phone: "", role: "" });
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong");
    }
  };

  const downloadPDF = async () => {
    if (!ticket) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const el = ticketRef.current;
    if (!el) return;
    html2pdf().set({
      margin: 0,
      filename: `izee-ticket-${ticket.name.replace(/\s+/g, "-")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "px", format: [420, 600], orientation: "portrait" },
    }).from(el).save();
  };

  return (
    <div style={styles.container}>
      {/* Decorative blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>🎤 LIVE EVENT</div>
          <h1 style={styles.title}>Izee Got Talent</h1>
          <p style={styles.subtitle}>+ DJ Night Extravaganza</p>
          <p style={styles.tagline}>Register now & get your secure QR pass</p>
        </div>

        {status === "success" && ticket ? (
          <div style={styles.successArea}>
            <div style={{ color: "#22c55e", fontSize: 40, marginBottom: 8 }}>✅</div>
            <h3 style={{ color: "#fff", marginBottom: 4 }}>You're In!</h3>
            <p style={{ color: "#a78bfa", marginBottom: 20, fontSize: 14 }}>{message}</p>

            {/* Ticket Preview */}
            <div ref={ticketRef} style={styles.ticket}>
              <div style={styles.ticketHeader}>
                <span style={{ fontSize: 24 }}>🎤</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Izee Got Talent</div>
                  <div style={{ fontSize: 12, color: "#a78bfa" }}>+ DJ Night</div>
                </div>
                <div style={styles.ticketBadge}>{ticket.role.toUpperCase()}</div>
              </div>
              <div style={styles.ticketBody}>
                <div style={styles.ticketInfo}>
                  <div style={styles.ticketLabel}>NAME</div>
                  <div style={styles.ticketValue}>{ticket.name}</div>
                </div>
                <div style={styles.ticketInfo}>
                  <div style={styles.ticketLabel}>EMAIL</div>
                  <div style={styles.ticketValue}>{ticket.email}</div>
                </div>
                <div style={styles.ticketQR}>
                  <img src={ticket.qrUrl} alt="QR Code" width={150} height={150} style={{ borderRadius: 8 }} />
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>Scan at entry gate</p>
                </div>
              </div>
              <div style={styles.ticketFooter}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            <div style={styles.actionRow}>
              <button onClick={downloadPDF} style={styles.downloadBtn}>⬇️ Download PDF Ticket</button>
              <button onClick={() => { setStatus("idle"); setTicket(null); }} style={styles.againBtn}>Register Another</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name *</label>
              <input
                style={styles.input}
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email Address *</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone Number</label>
              <input
                style={styles.input}
                placeholder="+91 00000 00000 (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Attending As *</label>
              <select
                style={styles.input}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              >
                <option value="">— Select your role —</option>
                <option value="audience">👥 Audience</option>
                <option value="participant">🎭 Participant</option>
              </select>
            </div>

            {status === "error" && (
              <div style={styles.errorBox}>{message}</div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{ ...styles.submitBtn, opacity: status === "loading" ? 0.7 : 1 }}
            >
              {status === "loading" ? "⏳ Registering..." : "🎟️ Get My Pass"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#050311",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Space Grotesk', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", top: -200, left: -200, width: 500, height: 500,
    background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: -200, right: -200, width: 500, height: 500,
    background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)",
    borderRadius: "50%", pointerEvents: "none",
  },
  card: {
    width: "100%", maxWidth: 460,
    background: "rgba(18,9,31,0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: 20, padding: "32px 28px",
    boxShadow: "0 25px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
    position: "relative", zIndex: 1,
  },
  header: { textAlign: "center", marginBottom: 28 },
  badge: {
    display: "inline-block", background: "rgba(124,58,237,0.2)",
    border: "1px solid rgba(124,58,237,0.5)", color: "#a78bfa",
    padding: "4px 14px", borderRadius: 20, fontSize: 11, letterSpacing: 2,
    fontWeight: 700, marginBottom: 12, textTransform: "uppercase",
  },
  title: {
    fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 900,
    color: "#fff", margin: "0 0 4px",
    background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: { color: "#06b6d4", fontSize: 14, fontWeight: 600, margin: "0 0 8px" },
  tagline: { color: "#6b7280", fontSize: 13, margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 0 },
  field: { marginBottom: 16 },
  label: { display: "block", color: "#a78bfa", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1px solid rgba(124,58,237,0.3)", background: "rgba(15,8,32,0.8)",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  errorBox: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
    color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16,
  },
  submitBtn: {
    width: "100%", padding: "14px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
    color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
    boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
    fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 0.5,
  },
  successArea: { textAlign: "center" },
  ticket: {
    background: "linear-gradient(135deg, #0f0820 0%, #1a0b2e 100%)",
    border: "1px solid rgba(124,58,237,0.5)",
    borderRadius: 16, overflow: "hidden", marginBottom: 20, textAlign: "left",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  ticketHeader: {
    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
  },
  ticketBadge: {
    marginLeft: "auto", background: "rgba(255,255,255,0.2)",
    color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
  },
  ticketBody: { padding: 16 },
  ticketInfo: { marginBottom: 12 },
  ticketLabel: { color: "#6b7280", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 },
  ticketValue: { color: "#fff", fontSize: 14, fontWeight: 600 },
  ticketQR: { textAlign: "center", marginTop: 16 },
  ticketFooter: {
    borderTop: "1px dashed rgba(124,58,237,0.3)",
    padding: "10px 16px", display: "flex", justifyContent: "center",
  },
  actionRow: { display: "flex", gap: 10, flexDirection: "column" },
  downloadBtn: {
    width: "100%", padding: "12px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  againBtn: {
    width: "100%", padding: "12px", borderRadius: 10,
    border: "1px solid rgba(124,58,237,0.4)", background: "transparent",
    color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 14,
    fontFamily: "'Space Grotesk', sans-serif",
  },
};

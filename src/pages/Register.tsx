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

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

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

    html2pdf()
      .set({
        margin: 0,
        filename: `izee-ticket-${ticket.name.replace(/\s+/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: [420, 600], orientation: "portrait" },
      })
      .from(el)
      .save();
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>🎤 LIVE EVENT</div>
          <h1 style={styles.title}>Izee Got Talent</h1>
          <p style={styles.subtitle}>+ DJ Night Extravaganza</p>
          <p style={styles.tagline}>Register now & get your secure QR pass</p>
        </div>

        {status === "success" && ticket ? (
          <div style={styles.successArea}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <h3 style={{ color: "#fff", marginBottom: 4 }}>You're In!</h3>
            <p style={{ color: "#a78bfa", marginBottom: 20, fontSize: 14 }}>{message}</p>

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
                  <img
                    src={ticket.qrUrl}
                    alt="QR Code"
                    width={150}
                    height={150}
                    style={{ borderRadius: 8 }}
                  />
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                    Scan at entry gate
                  </p>
                </div>
              </div>

              <div style={styles.ticketFooter}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>
                  Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            <div style={styles.actionRow}>
              <button onClick={downloadPDF} style={styles.downloadBtn}>
                ⬇️ Download PDF Ticket
              </button>

              <button
                onClick={() => {
                  setStatus("idle");
                  setTicket(null);
                }}
                style={styles.againBtn}
              >
                Register Another
              </button>
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

            {status === "error" && <div style={styles.errorBox}>{message}</div>}

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
    position: "absolute",
    top: -200,
    left: -200,
    width: 500,
    height: 500,
    background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
    borderRadius: "50%",
  },
  blob2: {
    position: "absolute",
    bottom: -200,
    right: -200,
    width: 500,
    height: 500,
    background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)",
    borderRadius: "50%",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    background: "rgba(18,9,31,0.95)",
    borderRadius: 20,
    padding: "32px 28px",
  },
  header: { textAlign: "center", marginBottom: 28 },
  badge: { color: "#a78bfa", marginBottom: 12 },
  title: { color: "#fff" },
  subtitle: { color: "#06b6d4" },
  tagline: { color: "#6b7280" },
  form: { display: "flex", flexDirection: "column" },
  field: { marginBottom: 16 },
  label: { color: "#a78bfa", fontSize: 11 },
  input: { padding: 12, borderRadius: 10 },
  errorBox: { color: "#f87171", marginBottom: 16 },
  submitBtn: { padding: 14, borderRadius: 10 },
  successArea: { textAlign: "center" },
  ticket: { marginBottom: 20 },
  ticketHeader: { display: "flex", gap: 12 },
  ticketBadge: { marginLeft: "auto" },
  ticketBody: { padding: 16 },
  ticketInfo: { marginBottom: 12 },
  ticketLabel: { fontSize: 10 },
  ticketValue: { fontSize: 14 },
  ticketQR: { textAlign: "center" },
  ticketFooter: { textAlign: "center" },
  actionRow: { display: "flex", flexDirection: "column", gap: 10 },
  downloadBtn: { padding: 12 },
  againBtn: { padding: 12 },
};

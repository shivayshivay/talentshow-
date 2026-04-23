import { useState, useRef, useEffect } from "react";

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

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Space+Grotesk:wght@300..700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes floatBlob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.05); }
    66%       { transform: translate(-20px, 15px) scale(0.97); }
  }
  @keyframes spinRing {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
    50%       { box-shadow: 0 0 0 16px rgba(124,58,237,0); }
  }
  @keyframes checkPop {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
    100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes ticketSlide {
    from { opacity: 0; transform: translateY(24px) rotateX(8deg); }
    to   { opacity: 1; transform: translateY(0)    rotateX(0deg); }
  }
  @keyframes starFloat {
    0%,100% { transform: translateY(0); opacity: 0.7; }
    50%      { transform: translateY(-8px); opacity: 1; }
  }

  .reg-container {
    min-height: 100vh;
    background: #050311;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 20px;
    font-family: 'Space Grotesk', sans-serif;
    position: relative; overflow: hidden;
  }

  .blob {
    position: absolute; border-radius: 50%; pointer-events: none;
    animation: floatBlob 8s ease-in-out infinite;
  }
  .blob-1 {
    top: -180px; left: -180px; width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%);
    animation-delay: 0s;
  }
  .blob-2 {
    bottom: -180px; right: -180px; width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%);
    animation-delay: -4s;
  }
  .blob-3 {
    top: 40%; left: 50%; width: 300px; height: 300px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%);
    animation-delay: -2s;
  }

  /* Floating particles */
  .particle {
    position: absolute; border-radius: 50%; pointer-events: none;
    background: rgba(124,58,237,0.5);
  }

  .card {
    width: 100%; max-width: 480px;
    background: rgba(12,6,22,0.92);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 24px;
    padding: 36px 32px;
    position: relative; z-index: 1;
    box-shadow:
      0 32px 80px rgba(0,0,0,0.7),
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 1px 0 rgba(255,255,255,0.08) inset;
    animation: scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  /* ── Header ── */
  .header { text-align: center; margin-bottom: 32px; animation: fadeUp 0.5s 0.1s both; }

  .live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(124,58,237,0.15);
    border: 1px solid rgba(124,58,237,0.4);
    color: #a78bfa; padding: 5px 14px; border-radius: 20px;
    font-size: 11px; letter-spacing: 2px; font-weight: 700;
    text-transform: uppercase; margin-bottom: 14px;
    animation: pulse 2.5s ease-in-out infinite;
  }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #a78bfa;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .event-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 32px; font-weight: 900; margin: 0 0 4px;
    background: linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #67e8f9 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% auto;
    animation: shimmer 4s linear infinite;
  }
  .event-sub { color: #06b6d4; font-size: 14px; font-weight: 600; margin: 0 0 6px; }
  .event-tagline { color: #4b5563; font-size: 13px; margin: 0; }

  /* ── Form ── */
  .field { margin-bottom: 18px; animation: fadeUp 0.5s both; }
  .field:nth-child(1) { animation-delay: 0.15s; }
  .field:nth-child(2) { animation-delay: 0.2s; }
  .field:nth-child(3) { animation-delay: 0.25s; }
  .field:nth-child(4) { animation-delay: 0.3s; }
  .field:nth-child(5) { animation-delay: 0.35s; }

  .label {
    display: block; color: #7c6fa0; font-size: 11px; font-weight: 700;
    letter-spacing: 1.5px; margin-bottom: 7px; text-transform: uppercase;
  }

  .input {
    width: 100%; padding: 13px 16px; border-radius: 12px;
    border: 1px solid rgba(124,58,237,0.2);
    background: rgba(8,4,18,0.8);
    color: #fff; font-size: 14px; outline: none;
    box-sizing: border-box;
    font-family: 'Space Grotesk', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .input:focus {
    border-color: rgba(124,58,237,0.6);
    background: rgba(12,6,28,0.9);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  .input option { background: #0d0720; }

  .row-2 { display: flex; gap: 12px; }
  .row-2 .field { flex: 1; }

  .error-box {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.35);
    color: #fca5a5; padding: 11px 14px; border-radius: 10px;
    font-size: 13px; margin-bottom: 18px;
    animation: fadeIn 0.3s both;
  }

  .submit-btn {
    width: 100%; padding: 15px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%);
    background-size: 200% auto;
    color: #fff; font-weight: 700; font-size: 16px; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.3px;
    transition: background-position 0.4s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 8px 32px rgba(124,58,237,0.5);
    animation: fadeUp 0.5s 0.4s both;
  }
  .submit-btn:hover {
    background-position: right center;
    box-shadow: 0 12px 40px rgba(124,58,237,0.65);
    transform: translateY(-1px);
  }
  .submit-btn:active { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

  /* ── Loading spinner ── */
  .spinner-ring {
    display: inline-block; width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: spinRing 0.7s linear infinite;
    vertical-align: middle; margin-right: 8px;
  }

  /* ── Success screen ── */
  .success-area { animation: fadeIn 0.4s both; }

  .success-banner {
    background: linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(6,182,212,0.06) 100%);
    border: 1px solid rgba(34,197,94,0.25);
    border-radius: 20px; padding: 28px 20px; text-align: center; margin-bottom: 24px;
    animation: scaleIn 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) both;
    position: relative; overflow: hidden;
  }
  .success-banner::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(34,197,94,0.04), transparent);
    pointer-events: none;
  }

  .check-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    font-size: 32px;
    margin-bottom: 16px;
    box-shadow: 0 8px 32px rgba(34,197,94,0.4);
    animation: checkPop 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .success-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 20px; font-weight: 900; color: #22c55e;
    margin: 0 0 10px; letter-spacing: 1px;
  }
  .success-sub {
    color: #9ca3af; font-size: 14px; line-height: 1.8; margin: 0;
  }

  /* Floating stars on success */
  .star { position: absolute; font-size: 16px; pointer-events: none; }
  .star-1 { top: 12px; left: 16px; animation: starFloat 2s 0s ease-in-out infinite; }
  .star-2 { top: 8px; right: 20px; animation: starFloat 2s 0.4s ease-in-out infinite; }
  .star-3 { bottom: 12px; left: 24px; animation: starFloat 2s 0.8s ease-in-out infinite; }
  .star-4 { bottom: 8px; right: 16px; animation: starFloat 2s 1.2s ease-in-out infinite; }

  /* ── Ticket ── */
  .ticket {
    border-radius: 20px; overflow: hidden;
    border: 1px solid rgba(124,58,237,0.4);
    background: linear-gradient(160deg, #0d0820 0%, #0a1628 100%);
    margin-bottom: 20px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    animation: ticketSlide 0.6s 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
    perspective: 1000px;
  }

  .ticket-header {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%);
    padding: 16px 20px;
    display: flex; align-items: center; gap: 14px;
    position: relative; overflow: hidden;
  }
  .ticket-header::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .ticket-event-name { font-weight: 800; font-size: 17px; color: #fff; line-height: 1.2; }
  .ticket-event-sub  { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 1px; }

  .ticket-role-badge {
    margin-left: auto;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(8px);
    color: #fff; padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 800; letter-spacing: 1px;
    text-transform: uppercase; white-space: nowrap;
  }

  /* Perforated divider */
  .ticket-perforation {
    height: 0;
    border-top: 2px dashed rgba(124,58,237,0.25);
    margin: 0 20px;
    position: relative;
  }
  .ticket-perforation::before {
    content: '';
    position: absolute; left: -28px; top: -10px;
    width: 20px; height: 20px; border-radius: 50%;
    background: #050311;
  }
  .ticket-perforation::after {
    content: '';
    position: absolute; right: -28px; top: -10px;
    width: 20px; height: 20px; border-radius: 50%;
    background: #050311;
  }

  .ticket-body { padding: 20px; }

  .ticket-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .ticket-row:last-child { border-bottom: none; }
  .ticket-key { color: #6b7280; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding-top: 1px; }
  .ticket-val { color: #f3f4f6; font-size: 13px; font-weight: 600; text-align: right; max-width: 65%; }

  .ticket-qr-section {
    text-align: center; padding: 20px 20px 24px;
    background: rgba(255,255,255,0.02);
    border-top: 1px solid rgba(124,58,237,0.15);
  }
  .ticket-qr-wrap {
    display: inline-block;
    padding: 10px; border-radius: 14px;
    background: #fff;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .ticket-qr-label { color: #6b7280; font-size: 11px; margin-top: 10px; letter-spacing: 0.5px; }
  .ticket-id-label { color: #a78bfa; font-size: 10px; font-family: monospace; margin-top: 4px; letter-spacing: 1px; }

  /* ── Actions ── */
  .action-row { display: flex; flex-direction: column; gap: 10px; }

  .download-btn {
    width: 100%; padding: 14px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #7c3aed, #06b6d4);
    color: #fff; font-weight: 700; cursor: pointer; font-size: 14px;
    font-family: 'Space Grotesk', sans-serif;
    transition: transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 6px 24px rgba(124,58,237,0.4);
  }
  .download-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(124,58,237,0.5); }

  .again-btn {
    width: 100%; padding: 13px; border-radius: 12px;
    border: 1px solid rgba(124,58,237,0.35);
    background: transparent; color: #a78bfa;
    font-weight: 600; cursor: pointer; font-size: 14px;
    font-family: 'Space Grotesk', sans-serif;
    transition: background 0.2s, border-color 0.2s;
  }
  .again-btn:hover { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.5); }
`;

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    year: "",
    semester: "",
    uucms: "", // ✅ added
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role || !form.year || !form.semester || !form.uucms) {
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
      try { data = JSON.parse(text); } catch { throw new Error("Server error — invalid response"); }
      if (!res.ok || !data.success) throw new Error(data.error || "Registration failed");
      setTicket(data.ticket);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", role: "", year: "", semester: "" });
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  const downloadPDF = async () => {
    if (!ticket || !ticketRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf().set({
      margin: 0,
      filename: `izee-ticket-${ticket.name.replace(/\s+/g, "-")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "px", format: [480, 680], orientation: "portrait" },
    }).from(ticketRef.current).save();
  };

  // Tiny random particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: 2 + (i % 3),
    top: `${10 + (i * 37) % 80}%`,
    left: `${5 + (i * 53) % 90}%`,
    delay: `${(i * 0.4) % 3}s`,
    duration: `${4 + (i % 3)}s`,
    opacity: 0.15 + (i % 4) * 0.08,
  }));

  return (
    <>
      <style>{STYLE}</style>
      <div className="reg-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        {/* Floating particles */}
        {mounted && particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: p.size, height: p.size,
              top: p.top, left: p.left,
              opacity: p.opacity,
              animation: `starFloat ${p.duration} ${p.delay} ease-in-out infinite`,
            }}
          />
        ))}

        <div className="card">
          {/* Header */}
          <div className="header">
            <div className="live-badge">
              <span className="live-dot" />
              🎤 Live Event
            </div>
            <h1 className="event-title">Izee Got Talent</h1>
            <p className="event-sub">+ DJ Night Extravaganza</p>
            <p className="event-tagline">Register now &amp; get your secure QR pass</p>
          </div>

          {/* ── Success Screen ── */}
          {status === "success" && ticket ? (
            <div className="success-area">
              <div className="success-banner">
                <span className="star star-1">✨</span>
                <span className="star star-2">🌟</span>
                <span className="star star-3">✨</span>
                <span className="star star-4">🌟</span>
                <div className="check-icon">✓</div>
                <h2 className="success-title">You're In!</h2>
                <p className="success-sub">
                  Welcome, <strong style={{ color: "#c4b5fd" }}>{ticket.name}</strong>!<br />
                  Your QR pass has been sent to<br />
                  <strong style={{ color: "#67e8f9" }}>{ticket.email}</strong>
                </p>
              </div>

              {/* Ticket */}
              <div ref={ticketRef} className="ticket">
                <div className="ticket-header">
                  <span style={{ fontSize: 26 }}>🎤</span>
                  <div>
                    <div className="ticket-event-name">Izee Got Talent</div>
                    <div className="ticket-event-sub">+ DJ Night Extravaganza</div>
                  </div>
                  <div className="ticket-role-badge">{ticket.role}</div>
                </div>

                <div className="ticket-body">
                  <div className="ticket-row">
                    <span className="ticket-key">Name</span>
                    <span className="ticket-val">{ticket.name}</span>
                  </div>
                  <div className="ticket-row">
                    <span className="ticket-key">Email</span>
                    <span className="ticket-val" style={{ fontSize: 12 }}>{ticket.email}</span>
                  </div>
                  <div className="ticket-row">
                    <span className="ticket-key">Ticket ID</span>
                    <span className="ticket-val" style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: 12 }}>
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="ticket-perforation" />

                <div className="ticket-qr-section">
                  <div className="ticket-qr-wrap">
                    <img
                      src={ticket.qrUrl}
                      alt="QR Code"
                      width={160}
                      height={160}
                      style={{ display: "block", borderRadius: 6 }}
                    />
                  </div>
                  <div className="ticket-qr-label">Scan this QR at the entry gate</div>
                  <div className="ticket-id-label">ID: {ticket.id.slice(0, 16).toUpperCase()}…</div>
                </div>
              </div>

              <div className="action-row">
                <button onClick={downloadPDF} className="download-btn">
                  ⬇️ Download PDF Ticket
                </button>
                <button
                  onClick={() => { setStatus("idle"); setTicket(null); }}
                  className="again-btn"
                >
                  Register Another Person
                </button>
              </div>
            </div>

          ) : (
            /* ── Registration Form ── */
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="label">Email Address *</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  placeholder="+91 00000 00000 (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="row-2">
                <div className="field">
                  <label className="label">Year *</label>
                  <select
                    className="input"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    required
                  >
                    <option value="">— Year —</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Semester *</label>
                  <select
                    className="input"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    required
                  >
                    <option value="">— Sem —</option>
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={String(n)}>Sem {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="label">Attending As *</label>
                <select
                  className="input"
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
                <div className="error-box">{message}</div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="submit-btn"
              >
                {status === "loading" ? (
                  <><span className="spinner-ring" />Registering...</>
                ) : (
                  "🎟️ Get My Pass"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
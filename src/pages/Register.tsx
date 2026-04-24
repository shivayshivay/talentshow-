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

// Injected into <head> so keyframes exist before React paints anything
const STYLE_ID = "reg-styles";
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Space+Grotesk:wght@300..700&display=swap');

@keyframes pageFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cardEntrance {
  0%   { opacity: 0; transform: scale(0.8) translateY(60px); filter: blur(12px); }
  60%  { opacity: 1; filter: blur(0); }
  80%  { transform: scale(1.02) translateY(-4px); }
  100% { transform: scale(1) translateY(0); }
}
@keyframes headerSlide {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fieldFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes btnReveal {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes blobFloat1 {
  0%,100% { transform: translate(0,0) scale(1); }
  40%     { transform: translate(24px,-16px) scale(1.04); }
  70%     { transform: translate(-12px,10px) scale(0.97); }
}
@keyframes blobFloat2 {
  0%,100% { transform: translate(0,0) scale(1); }
  35%     { transform: translate(-20px,18px) scale(1.03); }
  65%     { transform: translate(14px,-10px) scale(0.98); }
}
@keyframes spinRing {
  to { transform: rotate(360deg); }
}
@keyframes toastSlide {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes toastFadeOut {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(110%); opacity: 0; }
}
@keyframes successPop {
  0%   { opacity: 0; transform: scale(0.7) rotate(-8deg); }
  65%  { transform: scale(1.1) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes ticketDrop {
  from { opacity: 0; transform: translateY(28px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.reg-page {
  min-height: 100vh;
  background: #050311;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Space Grotesk', sans-serif;
  position: relative;
  overflow: hidden;
  animation: pageFadeIn 0.3s ease both;
}

.reg-blob1 {
  position: absolute; top: -200px; left: -200px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%);
  pointer-events: none;
  animation: blobFloat1 9s ease-in-out infinite;
}
.reg-blob2 {
  position: absolute; bottom: -200px; right: -200px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(6,182,212,0.20) 0%, transparent 70%);
  pointer-events: none;
  animation: blobFloat2 11s ease-in-out infinite;
}

.reg-card {
  width: 100%;
  max-width: 460px;
  background: rgba(18,9,31,0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(124,58,237,0.3);
  border-radius: 20px;
  padding: 32px 28px;
  position: relative;
  z-index: 1;
  box-shadow: 0 25px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
  animation: cardEntrance 0.75s cubic-bezier(0.16,1,0.3,1) both;
}

.reg-header {
  text-align: center;
  margin-bottom: 28px;
  animation: headerSlide 0.5s 0.35s both;
}
.reg-badge {
  display: inline-block;
  background: rgba(124,58,237,0.2);
  border: 1px solid rgba(124,58,237,0.5);
  color: #a78bfa;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 700;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.reg-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 4px;
  background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.reg-subtitle { color: #06b6d4; font-size: 14px; font-weight: 600; margin: 0 0 8px; }
.reg-tagline  { color: #6b7280; font-size: 13px; margin: 0; }

.reg-field { margin-bottom: 16px; }
.reg-field.f1 { animation: fieldFadeUp 0.45s 0.40s both; }
.reg-field.f2 { animation: fieldFadeUp 0.45s 0.47s both; }
.reg-field.f3 { animation: fieldFadeUp 0.45s 0.54s both; }
.reg-field.f4 { animation: fieldFadeUp 0.45s 0.61s both; }
.reg-field.f5 { animation: fieldFadeUp 0.45s 0.68s both; }
.reg-field.f6 { animation: fieldFadeUp 0.45s 0.75s both; }
.reg-field.f7 { animation: fieldFadeUp 0.45s 0.82s both; }

.reg-label {
  display: block;
  color: #a78bfa;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.reg-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(124,58,237,0.3);
  background: rgba(15,8,32,0.8);
  color: #fff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  font-family: 'Space Grotesk', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.reg-input:focus {
  border-color: rgba(124,58,237,0.7);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
}
.reg-input option { background: #0d0720; }
.reg-input:disabled { opacity: 0.45; cursor: not-allowed; }

.reg-row2 { display: flex; gap: 12px; }
.reg-row2 .reg-field { flex: 1; }

.reg-error {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.4);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.reg-submit {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  font-family: 'Space Grotesk', sans-serif;
  box-shadow: 0 8px 32px rgba(124,58,237,0.4);
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: btnReveal 0.45s 0.88s both;
}
.reg-submit:hover:not(:disabled) {
  box-shadow: 0 12px 40px rgba(124,58,237,0.6);
  transform: translateY(-1px);
}
.reg-submit:disabled { opacity: 0.65; cursor: not-allowed; }

.reg-spin {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  animation: spinRing 0.7s linear infinite;
  flex-shrink: 0;
}

.reg-toast {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  background: rgba(18,9,31,0.98);
  border: 1px solid rgba(34,197,94,0.5);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 0 32px rgba(34,197,94,0.2), 0 8px 32px rgba(0,0,0,0.5);
  max-width: 300px;
  animation: toastSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}
.reg-toast.hiding { animation: toastFadeOut 0.35s ease-in both; }
.reg-toast-ico { font-size: 20px; line-height: 1; flex-shrink: 0; margin-top: 1px; }
.reg-toast-ttl { font-size: 12px; font-weight: 700; color: #22c55e; letter-spacing: 0.5px; margin-bottom: 3px; }
.reg-toast-msg { font-size: 13px; color: #d1d5db; line-height: 1.4; }

.reg-success-area { text-align: center; }
.reg-success-banner {
  background: rgba(34,197,94,0.07);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 16px;
  padding: 24px 18px;
  margin-bottom: 22px;
  animation: successPop 0.55s 0.05s cubic-bezier(0.34,1.56,0.64,1) both;
}
.reg-success-check { font-size: 44px; margin-bottom: 10px; display: block; }
.reg-success-title {
  font-family: 'Orbitron', sans-serif;
  color: #22c55e;
  font-size: 18px;
  font-weight: 900;
  margin: 0 0 8px;
  letter-spacing: 1px;
}
.reg-success-sub { color: #9ca3af; font-size: 13px; line-height: 1.75; margin: 0; }

.reg-ticket {
  background: linear-gradient(135deg, #0f0820 0%, #1a0b2e 100%);
  border: 1px solid rgba(124,58,237,0.5);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  text-align: left;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  animation: ticketDrop 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both;
}
.reg-ticket-hd {
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.reg-ticket-hd-name { font-weight: 700; font-size: 18px; color: #fff; }
.reg-ticket-hd-sub  { font-size: 12px; color: rgba(255,255,255,0.7); }
.reg-ticket-role {
  margin-left: auto;
  background: rgba(255,255,255,0.2);
  color: #fff;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.reg-ticket-body { padding: 16px; }
.reg-ticket-row  { margin-bottom: 12px; }
.reg-ticket-lbl  { color: #6b7280; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }
.reg-ticket-val  { color: #fff; font-size: 14px; font-weight: 600; }
.reg-ticket-qr   { text-align: center; margin-top: 16px; }
.reg-ticket-qr-wrap {
  display: inline-block;
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.reg-ticket-qr-hint { font-size: 11px; color: #9ca3af; margin-top: 8px; }
.reg-ticket-qr-id   { font-size: 10px; color: #a78bfa; font-family: monospace; margin-top: 3px; letter-spacing: 1px; }
.reg-ticket-ft {
  border-top: 1px dashed rgba(124,58,237,0.3);
  padding: 10px 16px;
  display: flex;
  justify-content: center;
}
.reg-ticket-ft-id { font-size: 11px; color: #6b7280; font-family: monospace; }

.reg-actions { display: flex; flex-direction: column; gap: 10px; }
.reg-dl-btn {
  width: 100%; padding: 13px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: #fff; font-weight: 700; cursor: pointer; font-size: 14px;
  font-family: 'Space Grotesk', sans-serif;
  transition: transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 6px 24px rgba(124,58,237,0.4);
}
.reg-dl-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(124,58,237,0.55); }
.reg-again-btn {
  width: 100%; padding: 12px; border-radius: 10px;
  border: 1px solid rgba(124,58,237,0.35);
  background: transparent; color: #a78bfa;
  font-weight: 600; cursor: pointer; font-size: 14px;
  font-family: 'Space Grotesk', sans-serif;
  transition: background 0.2s, border-color 0.2s;
}
.reg-again-btn:hover { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.55); }
`;

// Inject CSS into <head> before first render so keyframes exist when elements mount
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.insertBefore(el, document.head.firstChild);
}
injectStyles();

function Toast({
  show, hiding, name, email,
}: {
  show: boolean; hiding: boolean; name: string; email: string;
}) {
  if (!show) return null;
  return (
    <div className={`reg-toast${hiding ? " hiding" : ""}`}>
      <div className="reg-toast-ico">✅</div>
      <div>
        <div className="reg-toast-ttl">Registration Confirmed!</div>
        <div className="reg-toast-msg">
          <strong style={{ color: "#fff" }}>{name}</strong> is registered.<br />
          <span style={{ fontSize: 12, color: "#6b7280" }}>{email}</span>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", uucms: "", role: "", year: "", semester: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [toast, setToast] = useState(false);
  const [toastHiding, setToastHiding] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const semsByYear: Record<string, number[]> = { "1": [1, 2], "2": [3, 4], "3": [5, 6] };
  const availableSems = form.year ? (semsByYear[form.year] || []) : [];

  useEffect(() => {
    if (form.year && !semsByYear[form.year]?.includes(Number(form.semester))) {
      setForm((f) => ({ ...f, semester: "" }));
    }
  }, [form.year]);

  const showToast = () => {
    setToast(true);
    setToastHiding(false);
    setTimeout(() => setToastHiding(true), 3500);
    setTimeout(() => setToast(false), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role || !form.year || !form.semester || !form.uucms) {
      setStatus("error");
      setMessage("⚠️ Please fill all required fields.");
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
      showToast();
      setForm({ name: "", email: "", phone: "", uucms: "", role: "", year: "", semester: "" });
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  const downloadPDF = async () => {
    if (!ticket || !ticketRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf()
      .set({
        margin: 0,
        filename: `izee-ticket-${ticket.name.replace(/\s+/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: [420, 600], orientation: "portrait" },
      })
      .from(ticketRef.current)
      .save();
  };

  return (
    <>
      <Toast
        show={toast}
        hiding={toastHiding}
        name={ticket?.name || form.name}
        email={ticket?.email || form.email}
      />

      <div className="reg-page">
        <div className="reg-blob1" />
        <div className="reg-blob2" />

        <div className="reg-card">
          {/* ── Header ── */}
          <div className="reg-header">
            <div className="reg-badge">🎤 LIVE EVENT</div>
            <h1 className="reg-title">Izee Got Talent</h1>
            <p className="reg-subtitle">+ DJ Night Extravaganza</p>
            <p className="reg-tagline">Register now &amp; get your secure QR pass</p>
          </div>

          {/* ── Success screen ── */}
          {status === "success" && ticket ? (
            <div className="reg-success-area">
              <div className="reg-success-banner">
                <span className="reg-success-check">✅</span>
                <h2 className="reg-success-title">You're In!</h2>
                <p className="reg-success-sub">
                  Welcome, <strong style={{ color: "#c4b5fd" }}>{ticket.name}</strong>!<br />
                  Your QR pass is ready below.
                </p>
              </div>

              <div ref={ticketRef} className="reg-ticket">
                <div className="reg-ticket-hd">
                  <span style={{ fontSize: 24 }}>🎤</span>
                  <div>
                    <div className="reg-ticket-hd-name">Izee Got Talent</div>
                    <div className="reg-ticket-hd-sub">+ DJ Night</div>
                  </div>
                  <div className="reg-ticket-role">{ticket.role.toUpperCase()}</div>
                </div>

                <div className="reg-ticket-body">
                  <div className="reg-ticket-row">
                    <div className="reg-ticket-lbl">Name</div>
                    <div className="reg-ticket-val">{ticket.name}</div>
                  </div>
                  <div className="reg-ticket-row">
                    <div className="reg-ticket-lbl">Email</div>
                    <div className="reg-ticket-val" style={{ fontSize: 13 }}>{ticket.email}</div>
                  </div>
                  <div className="reg-ticket-row">
                    <div className="reg-ticket-lbl">Ticket ID</div>
                    <div className="reg-ticket-val" style={{ color: "#a78bfa", fontFamily: "monospace" }}>
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div className="reg-ticket-qr">
                    <div className="reg-ticket-qr-wrap">
                      <img
                        src={ticket.qrUrl}
                        alt="QR Code"
                        width={150}
                        height={150}
                        style={{ display: "block", borderRadius: 6 }}
                      />
                    </div>
                    <div className="reg-ticket-qr-hint">Scan at entry gate</div>
                    <div className="reg-ticket-qr-id">#{ticket.id.slice(0, 16).toUpperCase()}…</div>
                  </div>
                </div>

                <div className="reg-ticket-ft">
                  <span className="reg-ticket-ft-id">
                    Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="reg-actions">
                <button onClick={downloadPDF} className="reg-dl-btn">
                  ⬇️ Download PDF Ticket
                </button>
                <button
                  onClick={() => { setStatus("idle"); setTicket(null); }}
                  className="reg-again-btn"
                >
                  Register Another Person
                </button>
              </div>
            </div>

          ) : (
            /* ── Registration form ── */
            <form onSubmit={handleSubmit}>
              <div className="reg-field f1">
                <label className="reg-label">Full Name *</label>
                <input
                  className="reg-input"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="reg-field f2">
                <label className="reg-label">Email Address *</label>
                <input
                  className="reg-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="reg-field f3">
                <label className="reg-label">UUCMS ID *</label>
                <input
                  className="reg-input"
                  placeholder="Enter your UUCMS ID"
                  value={form.uucms}
                  onChange={(e) => setForm({ ...form, uucms: e.target.value })}
                  required
                />
              </div>

              <div className="reg-field f4">
                <label className="reg-label">Phone Number</label>
                <input
                  className="reg-input"
                  placeholder="+91 00000 00000 (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="reg-row2">
                <div className="reg-field f5">
                  <label className="reg-label">Year *</label>
                  <select
                    className="reg-input"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value, semester: "" })}
                    required
                  >
                    <option value="">— Year —</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                  </select>
                </div>
                <div className="reg-field f6">
                  <label className="reg-label">Semester *</label>
                  <select
                    className="reg-input"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    required
                    disabled={!form.year}
                  >
                    <option value="">— Sem —</option>
                    {availableSems.map((n) => (
                      <option key={n} value={String(n)}>Sem {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="reg-field f7">
                <label className="reg-label">Attending As *</label>
                <select
                  className="reg-input"
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
                <div className="reg-error">{message}</div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="reg-submit"
              >
                {status === "loading" ? (
                  <><div className="reg-spin" />Registering...</>
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
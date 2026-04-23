import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Registration {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

type VerifyState = "loading" | "found" | "invalid";

export default function Verify() {
  const [params] = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [registration, setRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      const id = params.get("id");
      if (!id) {
        setState("invalid");
        return;
      }

      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setState("invalid");
        return;
      }

      setRegistration(data);
      setState("found");
    };

    fetchTicket();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div style={styles.container}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.card}>
          <div style={styles.eventHeader}>
            <div style={styles.eventName}>🎤 Izee Got Talent</div>
            <div style={styles.eventSub}>Entry Verification</div>
          </div>
          <div style={{ ...styles.statusBox, background: "rgba(124,58,237,0.15)", border: "2px solid rgba(124,58,237,0.4)" }}>
            <div style={styles.statusIcon}>⏳</div>
            <div style={{ ...styles.statusTitle, color: "#a78bfa" }}>Loading...</div>
            <div style={styles.statusSub}>Fetching ticket details</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid ──────────────────────────────────────────────────────────────
  if (state === "invalid" || !registration) {
    return (
      <div style={styles.container}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.card}>
          <div style={styles.eventHeader}>
            <div style={styles.eventName}>🎤 Izee Got Talent</div>
            <div style={styles.eventSub}>Entry Verification</div>
          </div>
          <div style={{ ...styles.statusBox, background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.5)" }}>
            <div style={styles.statusIcon}>❌</div>
            <div style={{ ...styles.statusTitle, color: "#f87171" }}>INVALID TICKET</div>
            <div style={styles.statusSub}>This QR code is not recognized.</div>
          </div>
          <a href="/" style={styles.backBtn}>← Back to Registration</a>
        </div>
      </div>
    );
  }

  // ── Found — show ticket info only, NEVER auto check-in ──────────────────
  const isCheckedIn = registration.checked_in;

  return (
    <div style={styles.container}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.eventHeader}>
          <div style={styles.eventName}>🎤 Izee Got Talent</div>
          <div style={styles.eventSub}>Entry Verification</div>
        </div>

        {/* Status — DISPLAY ONLY, no check-in logic here */}
        <div style={{
          ...styles.statusBox,
          background: isCheckedIn ? "rgba(234,179,8,0.15)" : "rgba(124,58,237,0.15)",
          border: `2px solid ${isCheckedIn ? "rgba(234,179,8,0.5)" : "rgba(124,58,237,0.4)"}`,
        }}>
          <div style={styles.statusIcon}>{isCheckedIn ? "✅" : "🎟️"}</div>
          <div style={{
            ...styles.statusTitle,
            color: isCheckedIn ? "#eab308" : "#a78bfa",
          }}>
            {isCheckedIn ? "ALREADY CHECKED IN" : "VALID TICKET"}
          </div>
          <div style={styles.statusSub}>
            {isCheckedIn
              ? "This ticket has already been used at the gate."
              : "Present this QR code at the entry gate to check in."}
          </div>
        </div>

        {/* Registration details */}
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>NAME</span>
            <span style={styles.detailValue}>{registration.name}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>EMAIL</span>
            <span style={styles.detailValue}>{registration.email}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>ROLE</span>
            <span style={styles.detailValue}>{registration.role.toUpperCase()}</span>
          </div>
          {registration.phone && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>PHONE</span>
              <span style={styles.detailValue}>{registration.phone}</span>
            </div>
          )}
          <div style={{ ...styles.detailRow, borderBottom: "none" }}>
            <span style={styles.detailLabel}>STATUS</span>
            <span style={{
              ...styles.detailValue,
              color: isCheckedIn ? "#eab308" : "#22c55e",
              fontWeight: 700,
            }}>
              {isCheckedIn ? "✅ Checked In" : "🟢 Ready for Entry"}
            </span>
          </div>
          {isCheckedIn && registration.checked_in_at && (
            <div style={{ ...styles.detailRow, borderBottom: "none" }}>
              <span style={styles.detailLabel}>CHECKED IN AT</span>
              <span style={{ ...styles.detailValue, color: "#6b7280", fontSize: 11 }}>
                {new Date(registration.checked_in_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <a href="/" style={styles.backBtn}>← Back to Registration</a>
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
    padding: 20,
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
    width: "100%", maxWidth: 420,
    background: "rgba(18,9,31,0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: 20, padding: "32px 28px",
    position: "relative", zIndex: 1,
    boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
  },
  eventHeader: { textAlign: "center", marginBottom: 24 },
  eventName: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4,
  },
  eventSub: { color: "#6b7280", fontSize: 13 },
  statusBox: {
    borderRadius: 16, padding: "24px 20px",
    textAlign: "center", marginBottom: 24,
  },
  statusIcon: { fontSize: 56, marginBottom: 12 },
  statusTitle: { fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 6 },
  statusSub: { color: "#9ca3af", fontSize: 14 },
  details: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12, padding: "16px", marginBottom: 24,
  },
  detailRow: {
    display: "flex", justifyContent: "space-between",
    padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  detailLabel: {
    color: "#6b7280", fontSize: 11, fontWeight: 700,
    letterSpacing: 1, textTransform: "uppercase",
  },
  detailValue: {
    color: "#e5e7eb", fontSize: 13, fontWeight: 600,
    textAlign: "right", maxWidth: "60%",
  },
  backBtn: {
    display: "block", textAlign: "center", color: "#7c3aed",
    fontSize: 13, textDecoration: "none", padding: "10px",
    borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)",
  },
};
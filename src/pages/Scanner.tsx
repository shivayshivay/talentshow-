import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ScanResult {
  status: "valid" | "already_used" | "invalid" | "rejected" | "pending";
  name?: string;
  email?: string;
  role?: string;
  message: string;
}

export default function Scanner() {
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyId = async (id: string): Promise<ScanResult> => {
    const cleanId = id.trim();

    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", cleanId)
      .single();

    if (error || !data) {
      console.error("Supabase lookup error:", error, "ID:", cleanId);
      return { status: "invalid", message: "❌ Ticket not found in database." };
    }

    const approvalStatus = data.status || "pending";

    if (approvalStatus === "rejected") {
      return {
        status: "rejected",
        name: data.name, email: data.email, role: data.role,
        message: "🚫 This ticket has been rejected by admin.",
      };
    }

    if (approvalStatus === "pending") {
      return {
        status: "pending",
        name: data.name, email: data.email, role: data.role,
        message: "⏳ This ticket is pending admin approval.",
      };
    }

    if (data.checked_in) {
      return {
        status: "already_used",
        name: data.name, email: data.email, role: data.role,
        message: "⚠️ This ticket was already used.",
      };
    }

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", cleanId);

    if (updateError) {
      console.error("Check-in update error:", updateError);
      return { status: "invalid", message: "❌ Failed to check in. Try again." };
    }

    return {
      status: "valid",
      name: data.name, email: data.email, role: data.role,
      message: "✅ Entry granted!",
    };
  };

  const handleScan = async (decodedText: string) => {
    if (loading) return;
    let id = decodedText.trim();
    try {
      const url = new URL(decodedText.trim());
      const extracted = url.searchParams.get("id");
      if (extracted) id = extracted;
    } catch {}
    setLoading(true);
    stopScanner();
    const res = await verifyId(id);
    setResult(res);
    setLoading(false);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        }).catch(() => { scannerRef.current = null; });
      } catch { scannerRef.current = null; }
    }
    setScanning(false);
  };

  const startScanner = () => { setResult(null); setScanning(true); };

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const initScanner = async () => {
      let Html5QrcodeScanner: any;
      if ((window as any).Html5QrcodeScanner) {
        Html5QrcodeScanner = (window as any).Html5QrcodeScanner;
      } else {
        try {
          const mod = await import("html5-qrcode");
          Html5QrcodeScanner = mod.Html5QrcodeScanner;
        } catch (e) {
          console.error("Failed to load html5-qrcode:", e);
          setScanning(false);
          return;
        }
      }
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 }, false);
      scanner.render((text: string) => handleScan(text), () => {});
      scannerRef.current = scanner;
    };
    initScanner();
    return () => { cancelled = true; stopScanner(); };
  }, [scanning]);

  const handleManualVerify = async () => {
    const raw = manualId.trim();
    if (!raw) return;
    let id = raw;
    try {
      const url = new URL(raw);
      const extracted = url.searchParams.get("id");
      if (extracted) id = extracted;
    } catch {}
    setLoading(true);
    const res = await verifyId(id);
    setResult(res);
    setLoading(false);
    setManualId("");
  };

  const resultConfig: Record<string, { bg: string; border: string; color: string; icon: string; label: string }> = {
    valid:        { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.5)",  color: "#22c55e", icon: "✅", label: "ENTRY GRANTED" },
    already_used: { bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.5)",  color: "#eab308", icon: "⚠️", label: "ALREADY CHECKED IN" },
    invalid:      { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.5)",  color: "#f87171", icon: "❌", label: "INVALID TICKET" },
    rejected:     { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.5)",  color: "#f87171", icon: "🚫", label: "ENTRY DENIED" },
    pending:      { bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.5)",  color: "#eab308", icon: "⏳", label: "PENDING APPROVAL" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1} /><div style={styles.blob2} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>📷 SCANNER MODE</div>
          <h1 style={styles.title}>QR Entry Scanner</h1>
          <p style={styles.sub}>Izee Got Talent — Gate Verification</p>
        </div>

        {scanning ? (
          <div>
            <div id="qr-reader" style={styles.scannerBox} />
            <button onClick={stopScanner} style={styles.stopBtn}>⛔ Stop Scanner</button>
          </div>
        ) : (!result && !loading && (
          <button onClick={startScanner} style={styles.startBtn}>📸 Start Camera Scanner</button>
        ))}

        {loading && (
          <div style={styles.loadingBox}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
            <div style={{ color: "#a78bfa" }}>Verifying ticket...</div>
          </div>
        )}

        {result && (() => {
          const cfg = resultConfig[result.status];
          return (
            <div style={{ ...styles.resultBox, background: cfg.bg, border: `2px solid ${cfg.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{cfg.icon}</div>
              <div style={{ ...styles.resultStatus, color: cfg.color }}>{cfg.label}</div>
              {result.name && (
                <div style={styles.resultDetails}>
                  <div><b style={{ color: "#a78bfa" }}>{result.name}</b></div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{result.email}</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(124,58,237,0.3)", color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>
                      {result.role?.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>{result.message}</div>
            </div>
          );
        })()}

        {result && (
          <button onClick={() => { setResult(null); startScanner(); }} style={styles.nextBtn}>
            📸 Scan Next Ticket
          </button>
        )}

        <div style={styles.divider}><span style={styles.dividerText}>or verify manually</span></div>

        <div style={styles.manualRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Paste ticket ID or full verify URL..."
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
          />
          <button onClick={handleManualVerify} disabled={loading} style={styles.verifyBtn}>
            {loading ? "⏳" : "Verify"}
          </button>
        </div>

        <a href="/admin" style={styles.adminLink}>← Back to Admin Panel</a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#050311", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden" },
  blob1: { position: "absolute", top: -200, left: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -200, right: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  card: { width: "100%", maxWidth: 460, background: "rgba(18,9,31,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: "32px 28px", position: "relative", zIndex: 1, boxShadow: "0 25px 80px rgba(0,0,0,0.6)" },
  header: { textAlign: "center", marginBottom: 24 },
  badge: { display: "inline-block", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.5)", color: "#a78bfa", padding: "4px 14px", borderRadius: 20, fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" },
  title: { fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px" },
  sub: { color: "#6b7280", fontSize: 13, margin: 0 },
  scannerBox: { borderRadius: 16, overflow: "hidden", marginBottom: 16, background: "#000" },
  startBtn: { width: "100%", padding: "16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 16, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16, boxShadow: "0 8px 32px rgba(124,58,237,0.4)" },
  stopBtn: { width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "transparent", color: "#f87171", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, marginBottom: 16 },
  loadingBox: { textAlign: "center", padding: "24px 0" },
  resultBox: { borderRadius: 16, padding: "24px 20px", textAlign: "center", marginBottom: 16 },
  resultStatus: { fontSize: 20, fontWeight: 800, letterSpacing: 1, marginBottom: 12 },
  resultDetails: { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px", marginTop: 8, marginBottom: 4 },
  nextBtn: { width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, marginBottom: 20 },
  divider: { borderTop: "1px solid rgba(255,255,255,0.08)", position: "relative", textAlign: "center", margin: "20px 0" },
  dividerText: { position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "rgba(18,9,31,1)", padding: "0 12px", color: "#6b7280", fontSize: 12 },
  manualRow: { display: "flex", gap: 8, marginBottom: 20 },
  input: { padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(15,8,32,0.8)", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'Space Grotesk', sans-serif" },
  verifyBtn: { padding: "11px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", whiteSpace: "nowrap" },
  adminLink: { display: "block", textAlign: "center", color: "#7c3aed", fontSize: 13, textDecoration: "none" },
};
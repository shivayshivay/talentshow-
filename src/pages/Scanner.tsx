import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ScanResult {
  status: "valid" | "already_used" | "invalid";
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
  const containerRef = useRef<HTMLDivElement>(null);

  const verifyId = async (id: string): Promise<ScanResult> => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return { status: "invalid", message: "❌ Ticket not found in database." };

    if (data.checked_in) {
      return {
        status: "already_used",
        name: data.name, email: data.email, role: data.role,
        message: "⚠️ This ticket was already used.",
      };
    }

    await supabase
      .from("registrations")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", id);

    return {
      status: "valid",
      name: data.name, email: data.email, role: data.role,
      message: "✅ Entry granted!",
    };
  };

  const handleScan = async (decodedText: string) => {
    if (loading) return;

    // Extract id from URL like https://yoursite.com/verify?id=UUID
    let id = decodedText;
    try {
      const url = new URL(decodedText);
      id = url.searchParams.get("id") || decodedText;
    } catch {}

    setLoading(true);
    stopScanner();
    const res = await verifyId(id);
    setResult(res);
    setLoading(false);
  };

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
          scannerRef.current = null;
        });
      } catch {}
    }
    setScanning(false);
  };

  useEffect(() => {
    if (!scanning) return;
    const initScanner = async () => {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        false
      );
      scanner.render(
        (text: string) => handleScan(text),
        () => {}
      );
      scannerRef.current = scanner;
    };
    initScanner();
    return () => stopScanner();
  }, [scanning]);

  const handleManualVerify = async () => {
    if (!manualId.trim()) return;
    setLoading(true);
    const res = await verifyId(manualId.trim());
    setResult(res);
    setLoading(false);
    setManualId("");
  };

  const resultColors = {
    valid: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.5)", color: "#22c55e" },
    already_used: { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.5)", color: "#eab308" },
    invalid: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.5)", color: "#f87171" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1} /><div style={styles.blob2} />
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>📷 SCANNER MODE</div>
          <h1 style={styles.title}>QR Entry Scanner</h1>
          <p style={styles.sub}>Izee Got Talent — Gate Verification</p>
        </div>

        {/* Scanner area */}
        {scanning ? (
          <div>
            <div ref={containerRef} id="qr-reader" style={styles.scannerBox} />
            <button onClick={stopScanner} style={styles.stopBtn}>⛔ Stop Scanner</button>
          </div>
        ) : (
          <div>
            {!result && !loading && (
              <button onClick={startScanner} style={styles.startBtn}>
                📸 Start Camera Scanner
              </button>
            )}
          </div>
        )}

        {loading && (
          <div style={styles.loadingBox}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
            <div style={{ color: "#a78bfa" }}>Verifying ticket...</div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ ...styles.resultBox, background: resultColors[result.status].bg, border: `2px solid ${resultColors[result.status].border}` }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {result.status === "valid" ? "✅" : result.status === "already_used" ? "⚠️" : "❌"}
            </div>
            <div style={{ ...styles.resultStatus, color: resultColors[result.status].color }}>
              {result.status === "valid" ? "ENTRY GRANTED" : result.status === "already_used" ? "ALREADY CHECKED IN" : "INVALID TICKET"}
            </div>
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
        )}

        {result && (
          <button
            onClick={() => { setResult(null); startScanner(); }}
            style={styles.nextBtn}
          >
            📸 Scan Next Ticket
          </button>
        )}

        {/* Divider */}
        <div style={styles.divider}><span style={styles.dividerText}>or verify manually</span></div>

        {/* Manual entry */}
        <div style={styles.manualRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Paste ticket ID or verify URL..."
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

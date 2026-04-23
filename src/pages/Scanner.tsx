import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type ScanStatus = "idle" | "scanning" | "success" | "error";

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("");
  const [lastScan, setLastScan] = useState<string | null>(null);

  const scanLockRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      async (result) => {
        if (scanLockRef.current) return;

        scanLockRef.current = true;
        setStatus("scanning");

        const scannedText = result.data;

        // جلوگیری از اسکن تکراری
        if (scannedText === lastScan) {
          resetScan();
          return;
        }

        setLastScan(scannedText);

        try {
          const id = extractId(scannedText);
          if (!id) throw new Error("Invalid QR");

          const { data, error } = await supabase
            .from("registrations")
            .select("*")
            .eq("id", id)
            .single();

          if (error || !data) throw new Error("Invalid Ticket");

          // 🚫 Not approved
          if (data.status !== "approved") {
            setStatus("error");
            setMessage(`❌ Access Denied\n${data.name}`);
            return;
          }

          // ⚠️ Already checked in
          if (data.checked_in) {
            setStatus("error");
            setMessage(`⚠️ Already Checked In\n${data.name}`);
            return;
          }

          // ✅ Valid entry
          await supabase
            .from("registrations")
            .update({
              checked_in: true,
              checked_in_at: new Date().toISOString(),
            })
            .eq("id", id);

          setStatus("success");
          setMessage(`✅ Entry Allowed\n${data.name}`);

        } catch (err: any) {
          setStatus("error");
          setMessage(err.message || "Invalid QR");
        }

        resetScan();
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scanner.start();
    scannerRef.current = scanner;

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, []);

  const extractId = (text: string) => {
    try {
      if (text.includes("http")) {
        const url = new URL(text);
        return url.searchParams.get("id");
      }
      return text;
    } catch {
      return text;
    }
  };

  const resetScan = () => {
    setTimeout(() => {
      scanLockRef.current = false;
      setStatus("idle");
      setMessage("");
    }, 3500); // ⏳ better visibility
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎟️ Entry Scanner</h1>

        <div style={styles.cameraWrapper}>
          <video ref={videoRef} style={styles.video} />
        </div>

        {/* Status */}
        {status === "idle" && <p style={styles.idle}>Ready to scan</p>}
        {status === "scanning" && <p style={styles.scan}>Scanning...</p>}

        {/* Result Popup */}
        {(status === "success" || status === "error") && (
          <div
            style={{
              ...styles.popup,
              background:
                status === "success"
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "linear-gradient(135deg, #ef4444, #dc2626)",
            }}
          >
            <p style={styles.popupText}>{message}</p>
          </div>
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
    fontFamily: "Space Grotesk, sans-serif",
    padding: "16px",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    padding: 20,
    borderRadius: 20,
    background: "rgba(12,6,22,0.9)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,0.3)",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },

  title: {
    marginBottom: 16,
    fontSize: "clamp(18px, 5vw, 24px)",
    fontWeight: 700,
  },

  cameraWrapper: {
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
    aspectRatio: "1/1",
    borderRadius: 18,
    overflow: "hidden",
    border: "3px solid #7c3aed",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  idle: {
    color: "#cbd5f5",
    fontSize: "clamp(14px, 4vw, 18px)",
    marginTop: 14,
  },

  scan: {
    color: "#facc15",
    fontSize: "clamp(14px, 4vw, 18px)",
    marginTop: 14,
    fontWeight: 600,
  },

  popup: {
    marginTop: 18,
    padding: "18px 16px",
    borderRadius: 16,
    color: "#fff",
    fontWeight: 800,
    fontSize: "clamp(16px, 5vw, 20px)",
    lineHeight: 1.5,
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
  },

  popupText: {
    whiteSpace: "pre-line",
  },
};
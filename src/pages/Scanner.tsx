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
          // 🚫 Reject if not approved
          if (data.status !== "approved") {
            setStatus("error");
            setMessage(`❌ Entry Denied\n${data.name}`);
          }
          // ⚠️ Already used
          else if (data.checked_in) {
            setStatus("error");
            setMessage(`⚠️ Already Checked In\n${data.name}`);
          }
          // ✅ Valid entry
          else {
            await supabase
            .from("registrations")
            .update({
              checked_in: true,
              checked_in_at: new Date().toISOString(),
            })
            .eq("id", id);
            setStatus("success");
            setMessage(`✅ Entry Allowed\n${data.name}`);
          }
          
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
    }, 2500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎟️ Entry Scanner</h1>

        <div style={styles.cameraWrapper}>
          <video ref={videoRef} style={styles.video} />
        </div>

        {/* STATUS TEXT */}
        {status === "idle" && <p style={styles.idle}>Ready to scan</p>}
        {status === "scanning" && <p style={styles.scan}>Scanning...</p>}

        {/* POPUP */}
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
  },
  card: {
    width: "90%",
    maxWidth: 500,
    padding: 24,
    borderRadius: 20,
    background: "rgba(12,6,22,0.9)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,0.3)",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },
  title: {
    marginBottom: 20,
    fontSize: 22,
  },
  cameraWrapper: {
    width: "100%",
    aspectRatio: "1/1",
    borderRadius: 16,
    overflow: "hidden",
    border: "2px solid #7c3aed",
    marginBottom: 16,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  idle: { color: "#9ca3af" },
  scan: { color: "#eab308" },

  popup: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    color: "#fff",
    fontWeight: 700,
    animation: "fadeIn 0.3s ease",
  },
  popupText: {
    whiteSpace: "pre-line",
  },
};
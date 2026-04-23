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

          if (data.status !== "approved") {
            setStatus("error");
            setMessage(`❌ ENTRY DENIED\n${data.name}`);
          } else if (data.checked_in) {
            setStatus("error");
            setMessage(`⚠️ ALREADY USED\n${data.name}`);
          } else {
            await supabase
              .from("registrations")
              .update({
                checked_in: true,
                checked_in_at: new Date().toISOString(),
              })
              .eq("id", id);

            setStatus("success");
            setMessage(`✅ ENTRY ALLOWED\n${data.name}`);
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
      <h1 style={styles.title}>🎟️ ENTRY SCANNER</h1>

      {/* 🔥 BIG FULL SCREEN SCANNER */}
      <div style={styles.cameraWrapper}>
        <video ref={videoRef} style={styles.video} />
      </div>

      {/* STATUS */}
      {status === "idle" && <p style={styles.idle}>Ready to scan</p>}
      {status === "scanning" && <p style={styles.scan}>Scanning...</p>}

      {/* 🔥 BIG RESULT POPUP */}
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#050311",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "10px",
    fontFamily: "Space Grotesk, sans-serif",
  },

  title: {
    fontSize: "20px",
    marginBottom: 10,
    fontWeight: 700,
  },

  /* 🔥 THIS IS THE MAIN FIX */
  cameraWrapper: {
    width: "95vw",          // almost full screen
    maxWidth: "600px",      // limit for desktop only
    aspectRatio: "1/1",
    borderRadius: 20,
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
    fontSize: "18px",
    marginTop: 12,
  },

  scan: {
    color: "#facc15",
    fontSize: "18px",
    marginTop: 12,
    fontWeight: 600,
  },

  /* 🔥 BIG READABLE POPUP */
  popup: {
    marginTop: 16,
    padding: "20px",
    borderRadius: 16,
    color: "#fff",
    fontWeight: 900,
    fontSize: "22px",  // BIG
    textAlign: "center",
    width: "95%",
    maxWidth: 500,
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },

  popupText: {
    whiteSpace: "pre-line",
  },
};
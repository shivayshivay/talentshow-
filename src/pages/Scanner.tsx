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

  // 🚫 prevents rapid multiple scans
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

        // prevent same QR spam
        if (scannedText === lastScan) {
          resetScan();
          return;
        }

        setLastScan(scannedText);

        try {
          // assume QR contains ID or URL with ID
          const id = extractId(scannedText);

          if (!id) throw new Error("Invalid QR");

          const { data, error } = await supabase
            .from("registrations")
            .select("*")
            .eq("id", id)
            .single();

          if (error || !data) throw new Error("Invalid Ticket");

          if (data.checked_in) {
            setStatus("error");
            setMessage(`⚠️ Already checked in\n${data.name}`);
          } else {
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
      <h1 style={styles.title}>📷 QR Scanner</h1>

      <div style={styles.cameraBox}>
        <video ref={videoRef} style={styles.video} />
      </div>

      <div style={styles.resultBox}>
        {status === "idle" && <p style={styles.idle}>Ready to scan...</p>}
        {status === "scanning" && <p style={styles.scan}>Scanning...</p>}
        {status === "success" && <p style={styles.success}>{message}</p>}
        {status === "error" && <p style={styles.error}>{message}</p>}
      </div>
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
    justifyContent: "center",
    color: "#fff",
    fontFamily: "sans-serif",
  },
  title: {
    marginBottom: 20,
  },
  cameraBox: {
    width: 320,
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    border: "2px solid #7c3aed",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  resultBox: {
    marginTop: 20,
    textAlign: "center",
    minHeight: 40,
  },
  idle: { color: "#9ca3af" },
  scan: { color: "#eab308" },
  success: { color: "#22c55e", fontWeight: 700 },
  error: { color: "#f87171", fontWeight: 700 },
};
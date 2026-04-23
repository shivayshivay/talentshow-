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
          if (!id) throw new Error("INVALID QR");

          const { data, error } = await supabase
            .from("registrations")
            .select("*")
            .eq("id", id)
            .single();

          if (error || !data) throw new Error("INVALID TICKET");

          if (data.status !== "approved") {
            setStatus("error");
            setMessage(`ENTRY DENIED\n${data.name}`);
          } else if (data.checked_in) {
            setStatus("error");
            setMessage(`ALREADY USED\n${data.name}`);
          } else {
            await supabase
              .from("registrations")
              .update({
                checked_in: true,
                checked_in_at: new Date().toISOString(),
              })
              .eq("id", id);

            setStatus("success");
            setMessage(`ENTRY ALLOWED\n${data.name}`);
          }
        } catch (err: any) {
          setStatus("error");
          setMessage(err.message || "ERROR");
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
      {/* TOP STATUS BAR */}
      <div
        style={{
          ...styles.statusBar,
          background:
            status === "success"
              ? "#16a34a"
              : status === "error"
              ? "#dc2626"
              : "#111827",
        }}
      >
        {status === "idle" && "READY TO SCAN"}
        {status === "scanning" && "SCANNING..."}
        {status === "success" && "ENTRY ALLOWED"}
        {status === "error" && "ENTRY DENIED"}
      </div>

      {/* CAMERA */}
      <div style={styles.cameraWrapper}>
        <video ref={videoRef} style={styles.video} />
      </div>

      {/* RESULT TEXT */}
      {(status === "success" || status === "error") && (
        <div style={styles.resultBox}>
          <p style={styles.resultText}>{message}</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#000", // 🔥 pure black for max contrast
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "system-ui",
  },

  statusBar: {
    width: "100%",
    textAlign: "center",
    padding: "14px",
    fontSize: "20px",
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "1px",
  },

  cameraWrapper: {
    width: "100vw",
    maxWidth: "600px",
    aspectRatio: "1/1",
    marginTop: 10,
    borderRadius: 0, // 🔥 full edge look
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  resultBox: {
    width: "100%",
    padding: "20px",
    textAlign: "center",
  },

  resultText: {
    fontSize: "24px", // 🔥 BIG TEXT
    fontWeight: 900,
    color: "#fff",
    whiteSpace: "pre-line",
  },
};
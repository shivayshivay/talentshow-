import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "izeeadmin2025";

interface Registration {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  checked_in: boolean;
  created_at: string;
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "audience" | "participant">("all");
  const [checkedFilter, setCheckedFilter] = useState<"all" | "checked" | "not_checked">("all");

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
    } else {
      setPwError("❌ Wrong password. Try again.");
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRegistrations(data);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchRegistrations();
  }, [authed]);

  const filtered = registrations.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filter === "all" || r.role === filter;
    const matchChecked =
      checkedFilter === "all" ||
      (checkedFilter === "checked" && r.checked_in) ||
      (checkedFilter === "not_checked" && !r.checked_in);
    return matchSearch && matchRole && matchChecked;
  });

  const stats = {
    total: registrations.length,
    audience: registrations.filter((r) => r.role === "audience").length,
    participants: registrations.filter((r) => r.role === "participant").length,
    checkedIn: registrations.filter((r) => r.checked_in).length,
  };

  const downloadCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Role", "Checked In", "Registered At"],
      ...registrations.map((r) => [
        r.name, r.email, r.phone || "", r.role,
        r.checked_in ? "Yes" : "No",
        new Date(r.created_at).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "registrations.csv"; a.click();
  };

  if (!authed) {
    return (
      <div style={styles.container}>
        <div style={styles.blob1} /><div style={styles.blob2} />
        <div style={styles.loginCard}>
          <div style={styles.lockIcon}>🔐</div>
          <h2 style={styles.loginTitle}>Admin Access</h2>
          <p style={styles.loginSub}>Izee Got Talent Dashboard</p>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {pwError && <div style={styles.errorBox}>{pwError}</div>}
          <button onClick={login} style={styles.loginBtn}>Enter Dashboard</button>
          <a href="/" style={styles.backLink}>← Back to Registration</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>🎤 Izee Admin</div>
        <nav style={styles.nav}>
          <a href="/admin" style={styles.navItem}>📊 Dashboard</a>
          <a href="/scanner" style={styles.navItem}>📷 QR Scanner</a>
          <a href="/" style={styles.navItem}>🏠 Registration</a>
        </nav>
        <button onClick={() => setAuthed(false)} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      <div style={styles.main}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total Registrations", value: stats.total, icon: "👥", color: "#7c3aed" },
            { label: "Audience", value: stats.audience, icon: "🪑", color: "#06b6d4" },
            { label: "Participants", value: stats.participants, icon: "🎭", color: "#f59e0b" },
            { label: "Checked In", value: stats.checkedIn, icon: "✅", color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.statCard, borderColor: s.color + "44" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ ...styles.statNum, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <input
            style={{ ...styles.input, flex: 1, maxWidth: 260 }}
            placeholder="🔍 Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...styles.input, width: 140 }} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All Roles</option>
            <option value="audience">Audience</option>
            <option value="participant">Participant</option>
          </select>
          <select style={{ ...styles.input, width: 160 }} value={checkedFilter} onChange={(e) => setCheckedFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="checked">✅ Checked In</option>
            <option value="not_checked">⏳ Not Checked</option>
          </select>
          <button onClick={downloadCSV} style={styles.csvBtn}>⬇️ Export CSV</button>
          <button onClick={fetchRegistrations} style={styles.refreshBtn}>🔄</button>
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.loading}>Loading registrations...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Name", "Email", "Phone", "Role", "Check-In", "Registered"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={styles.emptyCell}>No registrations found</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#e5e7eb" }}>{r.name}</td>
                    <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>{r.email}</td>
                    <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>{r.phone || "—"}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: r.role === "participant" ? "rgba(245,158,11,0.2)" : "rgba(6,182,212,0.2)",
                        color: r.role === "participant" ? "#f59e0b" : "#06b6d4",
                      }}>
                        {r.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: r.checked_in ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: r.checked_in ? "#22c55e" : "#9ca3af",
                      }}>
                        {r.checked_in ? "✅ Yes" : "⏳ No"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#6b7280", fontSize: 11 }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#050311", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden" },
  blob1: { position: "absolute", top: -200, left: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: -200, right: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" },
  loginCard: { width: "100%", maxWidth: 380, background: "rgba(18,9,31,0.95)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: "40px 32px", textAlign: "center", zIndex: 1, position: "relative" },
  lockIcon: { fontSize: 48, marginBottom: 12 },
  loginTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px" },
  loginSub: { color: "#6b7280", fontSize: 13, marginBottom: 24 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(15,8,32,0.8)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 },
  errorBox: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12, textAlign: "left" },
  loginBtn: { width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16 },
  backLink: { color: "#7c3aed", fontSize: 13, textDecoration: "none" },
  pageContainer: { display: "flex", minHeight: "100vh", background: "#050311", fontFamily: "'Space Grotesk', sans-serif", color: "#fff" },
  sidebar: { width: 220, background: "rgba(18,9,31,0.95)", borderRight: "1px solid rgba(124,58,237,0.2)", padding: "28px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" },
  sidebarTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900, color: "#a78bfa", marginBottom: 28, letterSpacing: 1 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { color: "#9ca3af", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500 },
  logoutBtn: { background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px", borderRadius: 8, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 },
  main: { flex: 1, padding: "28px 24px", overflow: "auto" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "rgba(18,9,31,0.8)", border: "1px solid", borderRadius: 16, padding: "20px 16px", textAlign: "center" },
  statNum: { fontSize: 36, fontWeight: 900, marginBottom: 4 },
  statLabel: { color: "#9ca3af", fontSize: 12, fontWeight: 600 },
  controls: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  csvBtn: { padding: "11px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 },
  refreshBtn: { padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.3)", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 16 },
  tableWrapper: { background: "rgba(18,9,31,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, overflow: "hidden" },
  loading: { padding: 40, textAlign: "center", color: "#9ca3af" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "12px 16px", color: "#6b7280", fontWeight: 700, textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(124,58,237,0.08)" },
  td: { padding: "12px 16px", color: "#d1d5db", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" },
  emptyCell: { padding: "40px 16px", textAlign: "center", color: "#9ca3af" },
};

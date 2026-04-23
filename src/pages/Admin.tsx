import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── UPDATE #3: 5 admins can login simultaneously with different passwords ──
// Each entry is { password, label } — label shown in dashboard header
const ADMIN_PASSWORDS: Record<string, string> = {
  [import.meta.env.VITE_ADMIN_PASSWORD || "izeeadmin2025"]: "Admin",
  [import.meta.env.VITE_ADMIN_PASSWORD_2 || "izeeadmin2"]:   "Admin 2",
  [import.meta.env.VITE_ADMIN_PASSWORD_3 || "izeeadmin3"]:   "Admin 3",
  [import.meta.env.VITE_ADMIN_PASSWORD_4 || "izeeadmin4"]:   "Admin 4",
  [import.meta.env.VITE_ADMIN_PASSWORD_5 || "izeeadmin5"]:   "Admin 5",
};

const SESSION_KEY = "izee_admin_authed";
const SESSION_LABEL_KEY = "izee_admin_label";

interface Registration {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  year?: string;
  semester?: string;
  checked_in: boolean;
  checked_in_at: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  // Store which admin label is logged in for display
  const [adminLabel, setAdminLabel] = useState(() => sessionStorage.getItem(SESSION_LABEL_KEY) || "Admin");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "audience" | "participant">("all");
  const [checkedFilter, setCheckedFilter] = useState<"all" | "checked" | "not_checked">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const channelRef = useRef<any>(null);

  const login = () => {
    // ── UPDATE #3: Check against all 5 admin passwords ──
    const matchedLabel = ADMIN_PASSWORDS[password];
    if (matchedLabel) {
      setAuthed(true);
      setAdminLabel(matchedLabel);
      sessionStorage.setItem(SESSION_KEY, "true");
      sessionStorage.setItem(SESSION_LABEL_KEY, matchedLabel);
      setPwError("");
    } else {
      setPwError("❌ Wrong password. Try again.");
    }
  };

  const logout = () => {
    setAuthed(false);
    setAdminLabel("Admin");
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_LABEL_KEY);
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
    if (!authed) return;

    fetchRegistrations();

    const channel = supabase
      .channel("registrations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        (payload) => {
          setLiveIndicator(true);
          setTimeout(() => setLiveIndicator(false), 1200);

          if (payload.eventType === "INSERT") {
            setRegistrations((prev) => [payload.new as Registration, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRegistrations((prev) =>
              prev.map((r) => (r.id === (payload.new as Registration).id ? (payload.new as Registration) : r))
            );
          } else if (payload.eventType === "DELETE") {
            setRegistrations((prev) =>
              prev.filter((r) => r.id !== (payload.old as Registration).id)
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [authed]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id + status);
    const { error } = await supabase
      .from("registrations")
      .update({ status })
      .eq("id", id);
    if (error) {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
    setActionLoading(null);
  };

  const deleteRegistration = async (id: string) => {
    setActionLoading(id + "delete");
    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);
    if (error) {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    }
    setConfirmDelete(null);
    setActionLoading(null);
  };

  const filtered = registrations.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filter === "all" || r.role === filter;
    const matchChecked =
      checkedFilter === "all" ||
      (checkedFilter === "checked" && r.checked_in) ||
      (checkedFilter === "not_checked" && !r.checked_in);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchRole && matchChecked && matchStatus;
  });

  const stats = {
    total: registrations.length,
    audience: registrations.filter((r) => r.role === "audience").length,
    participants: registrations.filter((r) => r.role === "participant").length,
    checkedIn: registrations.filter((r) => r.checked_in).length,
    approved: registrations.filter((r) => r.status === "approved").length,
    pending: registrations.filter((r) => r.status === "pending").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  const downloadCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Year", "Semester", "Role", "Status", "Checked In", "Registered At"],
      ...registrations.map((r) => [
        r.name, r.email, r.phone || "", r.year || "", r.semester || "", r.role,
        r.status || "pending",
        r.checked_in ? "Yes" : "No",
        new Date(r.created_at).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registrations.csv";
    a.click();
  };

  const statusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; label: string }> = {
      approved: { bg: "rgba(34,197,94,0.18)", color: "#22c55e", label: "✅ Approved" },
      rejected: { bg: "rgba(239,68,68,0.18)", color: "#f87171", label: "❌ Rejected" },
      pending:  { bg: "rgba(234,179,8,0.18)",  color: "#eab308", label: "⏳ Pending"  },
    };
    const c = cfg[status] ?? cfg.pending;
    return (
      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  // ── Login ────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={styles.container}>
        <div style={styles.blob1} /><div style={styles.blob2} />
        <div style={styles.loginCard}>
          <div style={styles.lockIcon}>🔐</div>
          <h2 style={styles.loginTitle}>Admin Access</h2>
          <p style={styles.loginSub}>Izee Got Talent Dashboard</p>
          {/* UPDATE #3: Subtle hint that multiple admins are supported */}
          <p style={{ color: "#4b5563", fontSize: 11, marginBottom: 16, margin: "0 0 16px" }}>
            Up to 5 admins can be logged in simultaneously
          </p>
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

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div style={styles.pageContainer}>
      {confirmDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              Delete Registration?
            </div>
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>
              This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => deleteRegistration(confirmDelete)}
                disabled={actionLoading === confirmDelete + "delete"}
                style={{ ...styles.actionBtn, background: "rgba(239,68,68,0.8)", flex: 1 }}
              >
                {actionLoading === confirmDelete + "delete" ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ ...styles.actionBtn, background: "rgba(107,114,128,0.3)", flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>🎤 Izee Admin</div>
        {/* UPDATE #3: Show which admin is logged in */}
        <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 20, padding: "0 12px" }}>
          Logged in as <span style={{ color: "#a78bfa", fontWeight: 700 }}>{adminLabel}</span>
        </div>
        <nav style={styles.nav}>
          <a href="/admin" style={styles.navItemActive}>📊 Dashboard</a>
          <a href="/scanner" style={styles.navItem}>📷 QR Scanner</a>
          <a href="/" style={styles.navItem}>🏠 Registration</a>
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>🚪 Logout</button>
      </div>

      <div style={styles.main}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total", value: stats.total, icon: "👥", color: "#7c3aed" },
            { label: "Approved", value: stats.approved, icon: "✅", color: "#22c55e" },
            { label: "Pending", value: stats.pending, icon: "⏳", color: "#eab308" },
            { label: "Rejected", value: stats.rejected, icon: "❌", color: "#f87171" },
            { label: "Audience", value: stats.audience, icon: "🪑", color: "#06b6d4" },
            { label: "Participants", value: stats.participants, icon: "🎭", color: "#f59e0b" },
            { label: "Checked In", value: stats.checkedIn, icon: "🎟️", color: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} style={{ ...styles.statCard, borderColor: s.color + "44" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ ...styles.statNum, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <input
            style={{ ...styles.input, flex: 1, maxWidth: 240, marginBottom: 0 }}
            placeholder="🔍 Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...styles.input, width: 130, marginBottom: 0 }} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All Roles</option>
            <option value="audience">Audience</option>
            <option value="participant">Participant</option>
          </select>
          <select style={{ ...styles.input, width: 150, marginBottom: 0 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
          <select style={{ ...styles.input, width: 150, marginBottom: 0 }} value={checkedFilter} onChange={(e) => setCheckedFilter(e.target.value as any)}>
            <option value="all">All Check-in</option>
            <option value="checked">✅ Checked In</option>
            <option value="not_checked">⏳ Not Checked</option>
          </select>
          <button onClick={downloadCSV} style={styles.csvBtn}>⬇️ CSV</button>
          <button onClick={fetchRegistrations} style={styles.refreshBtn} title="Manual refresh">🔄</button>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: liveIndicator ? "#22c55e" : "#374151",
              boxShadow: liveIndicator ? "0 0 8px #22c55e" : "none",
              transition: "all 0.3s ease",
            }} />
            <span style={{ color: "#6b7280", fontSize: 11 }}>LIVE</span>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.loadingCell}>Loading registrations...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Name", "Email", "Phone", "Year", "Sem", "Role", "Approval", "Check-In", "Registered", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={styles.emptyCell}>No registrations found</td></tr>
                ) : filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      opacity: r.status === "rejected" ? 0.6 : 1,
                    }}
                  >
                    <td style={{ ...styles.td, color: "#6b7280" }}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#e5e7eb", whiteSpace: "nowrap" }}>{r.name}</td>
                    <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>{r.email}</td>
                    <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>{r.phone || "—"}</td>
                    {/* UPDATE #2: Year & Semester columns */}
                    <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>{r.year ? `Y${r.year}` : "—"}</td>
                    <td style={{ ...styles.td, color: "#9ca3af", fontSize: 12 }}>{r.semester ? `S${r.semester}` : "—"}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: r.role === "participant" ? "rgba(245,158,11,0.2)" : "rgba(6,182,212,0.2)",
                        color: r.role === "participant" ? "#f59e0b" : "#06b6d4",
                        whiteSpace: "nowrap",
                      }}>
                        {r.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>{statusBadge(r.status || "pending")}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: r.checked_in ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                        color: r.checked_in ? "#22c55e" : "#9ca3af",
                        whiteSpace: "nowrap",
                      }}>
                        {r.checked_in ? "✅ Yes" : "⏳ No"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#6b7280", fontSize: 11, whiteSpace: "nowrap" }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(r.id, "approved")}
                            disabled={actionLoading === r.id + "approved"}
                            style={{ ...styles.actionBtn, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)" }}
                            title="Approve"
                          >
                            {actionLoading === r.id + "approved" ? "..." : "✅"}
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(r.id, "rejected")}
                            disabled={actionLoading === r.id + "rejected"}
                            style={{ ...styles.actionBtn, background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}
                            title="Reject"
                          >
                            {actionLoading === r.id + "rejected" ? "..." : "❌"}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(r.id)}
                          style={{ ...styles.actionBtn, background: "rgba(107,114,128,0.2)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.3)" }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
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
  loginSub: { color: "#6b7280", fontSize: 13, marginBottom: 8 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(15,8,32,0.8)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 },
  errorBox: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12, textAlign: "left" },
  loginBtn: { width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 16 },
  backLink: { color: "#7c3aed", fontSize: 13, textDecoration: "none" },
  pageContainer: { display: "flex", minHeight: "100vh", background: "#050311", fontFamily: "'Space Grotesk', sans-serif", color: "#fff" },
  sidebar: { width: 210, background: "rgba(18,9,31,0.98)", borderRight: "1px solid rgba(124,58,237,0.2)", padding: "28px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" },
  sidebarTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color: "#a78bfa", marginBottom: 8, letterSpacing: 1 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navItem: { color: "#9ca3af", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500 },
  navItemActive: { color: "#a78bfa", textDecoration: "none", padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700, background: "rgba(124,58,237,0.15)" },
  logoutBtn: { background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px", borderRadius: 8, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 },
  main: { flex: 1, padding: "28px 24px", overflow: "auto" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 },
  statCard: { background: "rgba(18,9,31,0.8)", border: "1px solid", borderRadius: 14, padding: "16px 12px", textAlign: "center" },
  statNum: { fontSize: 30, fontWeight: 900, marginBottom: 2 },
  statLabel: { color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  controls: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  csvBtn: { padding: "11px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, whiteSpace: "nowrap" },
  refreshBtn: { padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.3)", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 15 },
  tableWrapper: { background: "rgba(18,9,31,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, overflow: "auto" },
  loadingCell: { padding: 40, textAlign: "center", color: "#9ca3af" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "12px 14px", color: "#6b7280", fontWeight: 700, textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(124,58,237,0.08)", whiteSpace: "nowrap" },
  td: { padding: "11px 14px", color: "#d1d5db", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" },
  emptyCell: { padding: "40px 16px", textAlign: "center", color: "#9ca3af" },
  actionBtn: { padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "rgba(18,9,31,0.98)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: "32px 28px", maxWidth: 340, width: "100%", textAlign: "center" },
};
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "izeeadmin2025";
const SESSION_KEY = "izee_admin_authed";

interface Registration {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [password, setPassword] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    } else alert("Wrong password");
  };

  const logout = () => {
    setAuthed(false);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setRegistrations(
        data.map((r: any) => ({
          ...r,
          status: r.status || "pending",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;

    fetchRegistrations();

    const channel = supabase
      .channel("realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRegistrations((prev) => [payload.new as Registration, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRegistrations((prev) =>
              prev.map((r) =>
                r.id === (payload.new as Registration).id ? (payload.new as Registration) : r
              )
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
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [authed]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("registrations").update({ status }).eq("id", id);
  };

  if (!authed) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Admin Login</h2>
        <input
          type="password"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>
      <button onClick={logout}>Logout</button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.role}</td>
                <td>{r.status}</td>
                <td>{r.checked_in ? "✅" : "❌"}</td>
                <td>
                  <button onClick={() => updateStatus(r.id, "approved")}>Approve</button>
                  <button onClick={() => updateStatus(r.id, "rejected")}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
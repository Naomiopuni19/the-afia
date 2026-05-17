import React, { useState, useEffect } from 'react';
import { Bath, Utensils, Clock, Wind, Wifi, ShoppingBag, Phone, Star } from 'lucide-react';

const animations = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes progressFill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(30px); }
  }
`;

const ICONS = {
  Towels:         { icon: Bath,       color: "#3b82f6" },
  Breakfast:      { icon: Utensils,   color: "#f59e0b" },
  "Late Checkout":{ icon: Clock,      color: "#a78bfa" },
  "AC / Heating": { icon: Wind,       color: "#22d3ee" },
  "Wi-Fi Issue":  { icon: Wifi,       color: "#10b981" },
  "Room Service": { icon: ShoppingBag,color: "#f97316" },
  "Wake-Up Call": { icon: Phone,      color: "#ec4899" },
  "VIP Amenity":  { icon: Star,       color: "#fbbf24" },
};

const STATUS_CONFIG = {
  Pending:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",     border: "rgba(239,68,68,0.35)",    label: "PENDING"     },
  "In Progress":{ color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.35)",   label: "IN PROGRESS" },
  Completed:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.35)",   label: "COMPLETED"   },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position: "fixed", top: "30px", right: "30px", zIndex: 999, display: "flex", flexDirection: "column", gap: "10px" }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding: "14px 22px", borderRadius: "16px", fontSize: "13px", fontWeight: "700",
        backdropFilter: "blur(20px)", whiteSpace: "nowrap",
        animation: t.leaving ? "toastOut 0.3s ease forwards" : "toastIn 0.3s ease forwards",
        background: t.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
        border: t.type === "success" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(245,158,11,0.4)",
        color: t.type === "success" ? "#10b981" : "#f59e0b",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <span>{t.type === "success" ? "✓" : "●"}</span>{t.message}
      </div>
    ))}
  </div>
);

// ── New Request Modal ─────────────────────────────────────────────────────────
const NewRequestModal = ({ onClose, onAdd }) => {
  const [room, setRoom] = useState("");
  const [type, setType] = useState("Towels");
  const [priority, setPriority] = useState("Normal");
  const [note, setNote] = useState("");

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: "12px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(51,65,85,0.5)",
    color: "white", fontSize: "14px", fontWeight: "600", outline: "none",
    boxSizing: "border-box", transition: "border 0.2s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(2,6,23,0.85)",
      backdropFilter: "blur(12px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "rgba(15,23,42,0.98)", border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: "32px", padding: "44px", width: "100%", maxWidth: "460px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        animation: "slideIn 0.3s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" }}>New Request</h3>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "13px" }}>Log a guest service request</p>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(51,65,85,0.4)",
            color: "#64748b", borderRadius: "10px", padding: "8px 14px",
            cursor: "pointer", fontSize: "12px", fontWeight: "800",
          }}>✕ ESC</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: "800", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>
              SUITE NUMBER
            </label>
            <input
              value={room} onChange={e => setRoom(e.target.value)}
              placeholder="e.g. 305" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(51,65,85,0.5)"}
            />
          </div>

          <div>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: "800", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>
              REQUEST TYPE
            </label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: "800", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>
              PRIORITY
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {["Normal", "High", "VIP"].map(p => (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: "10px", borderRadius: "12px", cursor: "pointer",
                  fontWeight: "800", fontSize: "12px", transition: "0.2s",
                  background: priority === p ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)",
                  border: priority === p ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(51,65,85,0.3)",
                  color: priority === p ? "#3b82f6" : "#64748b",
                }}>
                  {p === "VIP" ? "⭐ VIP" : p === "High" ? "🔴 High" : "Normal"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: "800", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>
              NOTES (OPTIONAL)
            </label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(51,65,85,0.5)"}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "14px", borderRadius: "14px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(51,65,85,0.4)",
            color: "#64748b", cursor: "pointer", fontWeight: "800", fontSize: "13px",
          }}>Cancel</button>
          <button
            onClick={() => {
              if (!room.trim()) return;
              onAdd({ room: room.trim(), type, priority, note });
              onClose();
            }}
            style={{
              flex: 2, padding: "14px", borderRadius: "14px",
              background: "linear-gradient(90deg, #3b82f6, #2563eb)",
              border: "none", color: "white", cursor: "pointer",
              fontWeight: "900", fontSize: "13px",
              boxShadow: "0 8px 20px rgba(59,130,246,0.3)",
            }}
          >
            + Log Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Request Card ──────────────────────────────────────────────────────────────
const RequestCard = ({ req, onUpdateStatus, onDelete, index }) => {
  const cfg = STATUS_CONFIG[req.status];
  const iconCfg = ICONS[req.type] || { icon: Clock, color: "#94a3b8" };
  const IconComp = iconCfg.icon;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))",
      borderRadius: "28px",
      border: `1px solid ${cfg.border}`,
      padding: "28px",
      position: "relative",
      backdropFilter: "blur(20px)",
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      animation: `slideIn 0.4s ease ${index * 0.07}s both`,
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`;
      }}
    >
      {/* Ambient color bleed */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "120px", height: "120px", borderRadius: "50%",
        background: `radial-gradient(circle, ${iconCfg.color}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Priority ribbon */}
      {req.priority === "VIP" && (
        <div style={{
          position: "absolute", top: "16px", right: "16px",
          background: "linear-gradient(45deg, #f59e0b, #fbbf24)",
          color: "#000", fontSize: "9px", fontWeight: "900",
          padding: "3px 10px", borderRadius: "6px", letterSpacing: "1px",
        }}>⭐ VIP</div>
      )}
      {req.priority === "High" && (
        <div style={{
          position: "absolute", top: "16px", right: "16px",
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          color: "#ef4444", fontSize: "9px", fontWeight: "900",
          padding: "3px 10px", borderRadius: "6px", letterSpacing: "1px",
          animation: req.status === "Pending" ? "pulseRing 2s infinite" : "none",
        }}>🔴 HIGH</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "16px", flexShrink: 0,
          background: `${iconCfg.color}18`,
          border: `1px solid ${iconCfg.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: iconCfg.color,
        }}>
          <IconComp size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <span style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "-0.5px" }}>Suite {req.room}</span>
          </div>
          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "700" }}>
            {req.type} · {req.time}
          </span>
        </div>
      </div>

      {/* Note if any */}
      {req.note && (
        <div style={{
          fontSize: "13px", color: "#94a3b8", background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(51,65,85,0.3)", borderRadius: "12px",
          padding: "12px 14px", marginBottom: "18px", lineHeight: 1.6,
        }}>
          {req.note}
        </div>
      )}

      {/* Status bar */}
      <div style={{
        height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.05)",
        marginBottom: "20px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: "2px",
          background: cfg.color,
          width: req.status === "Completed" ? "100%" : req.status === "In Progress" ? "55%" : "15%",
          transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${cfg.color}`,
        }} />
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {/* Status badge */}
        <div style={{
          padding: "7px 14px", borderRadius: "10px",
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          color: cfg.color, fontSize: "10px", fontWeight: "900", letterSpacing: "1px",
        }}>
          {cfg.label}
        </div>

        <div style={{ flex: 1 }} />

        {/* Delete */}
        <button
          onClick={() => onDelete(req.id)}
          style={{
            padding: "8px 12px", borderRadius: "10px", cursor: "pointer",
            background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)",
            color: "#ef444466", fontSize: "12px", fontWeight: "900", transition: "0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.04)"; e.currentTarget.style.color = "#ef444466"; }}
          title="Dismiss"
        >✕</button>

        {/* Action button */}
        {req.status === "Pending" && (
          <button
            onClick={() => onUpdateStatus(req.id, "In Progress")}
            style={{
              padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
              background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)",
              color: "#3b82f6", fontSize: "12px", fontWeight: "900", transition: "0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.12)"}
          >Accept →</button>
        )}
        {req.status === "In Progress" && (
          <button
            onClick={() => onUpdateStatus(req.id, "Completed")}
            style={{
              padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)",
              color: "#10b981", fontSize: "12px", fontWeight: "900", transition: "0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.12)"}
          >Done ✓</button>
        )}
        {req.status === "Completed" && (
          <div style={{
            padding: "8px 18px", borderRadius: "10px",
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
            color: "#10b981", fontSize: "12px", fontWeight: "900",
          }}>Resolved ✓</div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ServiceRequests = () => {
  const [requests, setRequests] = useState([
    { id: 1, room: "305", type: "Towels",       time: "2 mins ago",  status: "Pending",     priority: "Normal", note: "" },
    { id: 2, room: "102", type: "Breakfast",    time: "10 mins ago", status: "In Progress",  priority: "VIP",    note: "Guest requested eggs Benedict and fresh OJ." },
    { id: 3, room: "404", type: "Late Checkout",time: "15 mins ago", status: "Pending",     priority: "High",   note: "" },
    { id: 4, room: "210", type: "Wi-Fi Issue",  time: "22 mins ago", status: "In Progress",  priority: "Normal", note: "" },
    { id: 5, room: "501", type: "VIP Amenity",  time: "35 mins ago", status: "Completed",   priority: "VIP",    note: "Champagne and flowers arranged." },
  ]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, 2800);
  };

  const updateStatus = (id, newStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    const req = requests.find(r => r.id === id);
    if (req) addToast(`Suite ${req.room} → ${newStatus}`, newStatus === "Completed" ? "success" : "info");
  };

  const deleteRequest = (id) => {
    const req = requests.find(r => r.id === id);
    setRequests(prev => prev.filter(r => r.id !== id));
    if (req) addToast(`Request for Suite ${req.room} dismissed`, "info");
  };

  const addRequest = ({ room, type, priority, note }) => {
    const newReq = {
      id: Date.now(), room, type, priority, note,
      time: "just now", status: "Pending",
    };
    setRequests(prev => [newReq, ...prev]);
    addToast(`New request logged for Suite ${room}`, "info");
  };

  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === "Pending").length,
    "In Progress": requests.filter(r => r.status === "In Progress").length,
    Completed: requests.filter(r => r.status === "Completed").length,
  };

  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

  const FILTERS = [
    { key: "All",         color: "#3b82f6" },
    { key: "Pending",     color: "#ef4444" },
    { key: "In Progress", color: "#f59e0b" },
    { key: "Completed",   color: "#10b981" },
  ];

  return (
    <div style={{
      background: "radial-gradient(circle at top right, #0f172a, #020617)",
      minHeight: "100vh", color: "white",
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      padding: "40px 50px",
    }}>
      <style>{animations}</style>
      <Toast toasts={toasts} />
      {showModal && <NewRequestModal onClose={() => setShowModal(false)} onAdd={addRequest} />}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#3b82f6", fontWeight: "800", letterSpacing: "2px" }}>
            STAYPILOT OS v1.2
          </p>
          <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "900", letterSpacing: "-1.5px" }}>
            Service Requests
          </h1>
          <p style={{ margin: "6px 0 0", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
            Live operations feed ·{" "}
            <span style={{ color: "#3b82f6" }}>{currentTime}</span>
            <span style={{
              display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
              background: "#10b981", boxShadow: "0 0 8px #10b981",
              marginLeft: "10px", verticalAlign: "middle",
            }} />
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {counts.Pending > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
              color: "#ef4444", padding: "10px 20px", borderRadius: "50px",
              fontSize: "12px", fontWeight: "900", letterSpacing: "1px",
              animation: "pulseRing 2s infinite",
            }}>
              {counts.Pending} URGENT
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "12px 24px", borderRadius: "16px", cursor: "pointer",
              background: "linear-gradient(90deg, #3b82f6, #2563eb)",
              border: "none", color: "white", fontWeight: "900", fontSize: "13px",
              boxShadow: "0 8px 24px rgba(59,130,246,0.35)", transition: "0.2s",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >+ New Request</button>
        </div>
      </div>

      {/* ── Summary stat strip ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "30px" }}>
        {[
          { label: "TOTAL",       value: requests.length,                                        color: "#3b82f6" },
          { label: "PENDING",     value: counts.Pending,                                         color: "#ef4444" },
          { label: "IN PROGRESS", value: counts["In Progress"],                                  color: "#f59e0b" },
          { label: "COMPLETED",   value: counts.Completed,                                       color: "#10b981" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,42,0.4))",
            border: "1px solid rgba(51,65,85,0.3)", borderRadius: "22px", padding: "22px 24px",
            backdropFilter: "blur(10px)",
          }}>
            <small style={{ color: "#475569", fontSize: "9px", fontWeight: "800", letterSpacing: "1.5px" }}>{label}</small>
            <div style={{ fontSize: "34px", fontWeight: "900", color, marginTop: "6px", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
        {FILTERS.map(({ key, color }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: "9px 20px", borderRadius: "50px", cursor: "pointer",
            fontWeight: "800", fontSize: "12px", transition: "0.2s", letterSpacing: "0.5px",
            background: filter === key ? `${color}18` : "rgba(255,255,255,0.02)",
            border: filter === key ? `1px solid ${color}55` : "1px solid rgba(51,65,85,0.3)",
            color: filter === key ? color : "#475569",
          }}>
            {key} <span style={{
              background: filter === key ? `${color}25` : "rgba(255,255,255,0.04)",
              padding: "1px 8px", borderRadius: "10px", marginLeft: "6px", fontSize: "10px",
            }}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* ── Cards grid ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 0", color: "#334155",
          background: "rgba(255,255,255,0.01)", borderRadius: "28px",
          border: "1px dashed rgba(51,65,85,0.3)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>✓</div>
          <p style={{ fontSize: "15px", fontWeight: "700" }}>No requests in this category</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filtered.map((req, i) => (
            <RequestCard
              key={req.id}
              req={req}
              index={i}
              onUpdateStatus={updateStatus}
              onDelete={deleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceRequests;
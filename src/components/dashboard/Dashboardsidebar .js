import React from "react";

export default function DashboardSidebar({
  isMobile, sidebarOpen, setSidebarOpen,
  activeTab, setActiveTab,
  navItems, isAdmin, isStaff, userName,
  totalRevenue, occupancyRate, activeOrders,
  rooms, serviceRequestCount, requestsBlink,
  navigate, supabase,
}) {
  const accent = "#3b82f6";

  const sidebarStyle = {
    width: 260,
    background: "rgba(2,6,23,0.97)",
    borderRight: "1px solid rgba(59,130,246,0.08)",
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(20px)",
    overflowY: "auto",
    overflowX: "hidden",
    ...(isMobile ? {
      position: "fixed", top: 0, left: 0, bottom: 0, height: "100vh",
      transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 500,
      boxShadow: sidebarOpen ? "8px 0 40px rgba(0,0,0,0.6)" : "none",
    } : {
      position: "fixed", height: "100vh",
    }),
  };

  const navBtn = (active, blink) => ({
    width: "100%", padding: "11px 16px", marginBottom: 2,
    borderRadius: 12, border: "none",
    background: active ? "rgba(59,130,246,0.12)" : "transparent",
    color: active ? "#fff" : "#475569",
    fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: "pointer", textAlign: "left",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    transition: "all 0.2s", fontFamily: "inherit",
    borderLeft: active ? `3px solid ${accent}` : "3px solid transparent",
    paddingLeft: active ? 13 : 16,
    ...(blink ? { animation: "navBlink 0.8s ease-in-out infinite" } : {}),
  });

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(59,130,246,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✦</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>The Afia</div>
            <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, letterSpacing: 1.5 }}>{isAdmin ? "ADMIN" : "STAFF"} PORTAL</div>
          </div>
        </div>
      </div>

      {/* Live stats strip */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,0.06)", display: "flex", gap: 8 }}>
        {[
          { label: "OCC", value: `${occupancyRate}%`, color: "#10b981" },
          { label: "ORDERS", value: activeOrders.length, color: "#f59e0b" },
          { label: "REVENUE", value: `₵${(totalRevenue/1000).toFixed(1)}k`, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mini room grid */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(59,130,246,0.06)" }}>
        <div style={{ fontSize: 9, color: "#334155", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>SUITE STATUS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 4 }}>
          {rooms.slice(0, 10).map(r => (
            <div key={r.id} title={`Suite ${r.id}`} style={{ height: 8, borderRadius: 2, background: r.color || "#3b82f6" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          {[["#3b82f6","Vacant"],["#10b981","Occupied"],["#f59e0b","Cleaning"],["#ef4444","Maint."]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#475569", fontWeight: 600 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: "#334155", fontWeight: 700, letterSpacing: 2, padding: "0 6px", marginBottom: 6 }}>OPERATIONS</div>
        {navItems.map(n => (
          <button key={n.key} onClick={() => { setActiveTab(n.key); if (isMobile) setSidebarOpen(false); }} style={navBtn(activeTab === n.key, n.blink)}>
            <span>{n.label}</span>
            {n.count > 0 && (
              <span style={{ background: n.blink ? "#f59e0b" : "rgba(59,130,246,0.15)", color: n.blink ? "#000" : accent, borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px", animation: n.blink ? "badgePulse 0.8s ease-in-out infinite" : "none" }}>
                {n.count}
              </span>
            )}
          </button>
        ))}
        <button onClick={() => { setActiveTab("requests"); if (isMobile) setSidebarOpen(false); }} style={navBtn(activeTab === "requests", requestsBlink)}>
          <span>Service Requests</span>
          {serviceRequestCount > 0 && (
            <span style={{ background: requestsBlink ? "#f59e0b" : "rgba(59,130,246,0.15)", color: requestsBlink ? "#000" : accent, borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px" }}>{serviceRequestCount}</span>
          )}
        </button>
        {isAdmin && (
          <>
            <div style={{ fontSize: 9, color: "#334155", fontWeight: 700, letterSpacing: 2, padding: "12px 6px 6px" }}>MANAGEMENT</div>
            <button onClick={() => { setActiveTab("analytics"); if (isMobile) setSidebarOpen(false); }} style={navBtn(activeTab === "analytics", false)}>Analytics Overview</button>
            <button onClick={() => { setActiveTab("reports"); if (isMobile) setSidebarOpen(false); }} style={navBtn(activeTab === "reports", false)}>Daily Reports</button>
            <button onClick={() => { setActiveTab("billing"); if (isMobile) setSidebarOpen(false); }} style={navBtn(activeTab === "billing", false)}>Guest Billing</button>
            <button onClick={() => { setActiveTab("catalog"); if (isMobile) setSidebarOpen(false); }} style={navBtn(activeTab === "catalog", false)}>Menu Catalog</button>
            <button onClick={() => navigate("/book")} style={{ ...navBtn(false, false), color: "#3b82f6", marginTop: 4 }}>+ New Reservation</button>
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(59,130,246,0.06)" }}>
        {isStaff && (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.1)" }}>
            <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, letterSpacing: 1.5 }}>SIGNED IN AS</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }}>{userName}</div>
          </div>
        )}
        <button onClick={async () => { await supabase.auth.signOut(); navigate("/staff-portal"); }}
          style={{ width: "100%", padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

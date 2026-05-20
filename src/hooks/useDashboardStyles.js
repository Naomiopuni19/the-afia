import { useState, useEffect } from "react";

// ── Responsive hook ──────────────────────────────────────────────────────────
export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

export function useIsMobile() {
  return useWindowWidth() < 768;
}

// ── Responsive grid helper ───────────────────────────────────────────────────
// Usage: cols(isMobile, "1fr", "repeat(3,1fr)")
export const cols = (isMobile, mobile, desktop) =>
  isMobile ? mobile : desktop;

// ── Responsive styles ────────────────────────────────────────────────────────
export function useDashboardStyles(isMobile) {
  return {
    // ── Layout ──
    page: {
      background: "radial-gradient(circle at top right,#0f172a,#020617)",
      minHeight: "100vh",
      color: "white",
      display: "flex",
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      overflowX: "hidden",
    },
    sidebar: {
      width: 280,
      background: "rgba(15,23,42,0.98)",
      padding: "40px 20px",
      borderRight: "1px solid rgba(51,65,85,0.5)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backdropFilter: "blur(20px)",
      overflowY: "auto",
      // Mobile: fixed + slide
      ...(isMobile ? {} : { position: "fixed", height: "100vh" }),
    },
    sidebarMobile: (sidebarOpen) => ({
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      height: "100vh",
      transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 500,
      boxShadow: sidebarOpen ? "4px 0 30px rgba(0,0,0,0.5)" : "none",
    }),
    main: {
      flex: 1,
      marginLeft: isMobile ? 0 : 280,
      padding: isMobile ? "70px 16px 24px" : "40px 48px",
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 16 : 30,
      overflowY: "auto",
      minHeight: "100vh",
    },

    // ── Components ──
    navBtn: (active, blink) => ({
      width: "100%",
      padding: "14px 20px",
      marginBottom: 10,
      borderRadius: 16,
      border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
      background: active ? "linear-gradient(90deg,rgba(59,130,246,0.15),transparent)" : "transparent",
      color: active ? "#3b82f6" : "#64748b",
      fontSize: 14, fontWeight: 700, cursor: "pointer",
      transition: "all 0.3s", textAlign: "left",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      ...(blink ? { animation: "navBlink 0.8s ease-in-out infinite" } : {}),
    }),
    statCard: {
      background: "linear-gradient(135deg,rgba(30,41,59,0.4),rgba(15,23,42,0.4))",
      padding: isMobile ? 16 : 25,
      borderRadius: 28,
      border: "1px solid rgba(51,65,85,0.3)",
      backdropFilter: "blur(10px)",
    },
    glass: {
      background: "rgba(15,23,42,0.3)",
      borderRadius: isMobile ? 20 : 32,
      border: "1px solid rgba(51,65,85,0.3)",
      padding: isMobile ? 16 : 30,
      backdropFilter: "blur(40px)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    },
    input: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(51,65,85,0.5)",
      borderRadius: 12, padding: "12px 16px",
      color: "white", fontSize: 13, fontWeight: 600,
      outline: "none", width: "100%",
      boxSizing: "border-box", fontFamily: "inherit",
    },
    label: {
      fontSize: 10, fontWeight: 800,
      letterSpacing: "1.5px", color: "#64748b",
      marginBottom: 6, display: "block",
    },
    btnPrimary: {
      padding: "12px 24px",
      background: "linear-gradient(90deg,#3b82f6,#2563eb)",
      border: "none", borderRadius: 12,
      color: "white", fontWeight: 900, fontSize: 13, cursor: "pointer",
    },
    btnDanger: {
      padding: "8px 16px",
      background: "rgba(239,68,68,0.05)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#ef4444", borderRadius: 10,
      cursor: "pointer", fontSize: 10, fontWeight: 900,
    },
    btnSuccess: {
      padding: "8px 16px",
      background: "rgba(16,185,129,0.05)",
      border: "1px solid rgba(16,185,129,0.3)",
      color: "#10b981", borderRadius: 10,
      cursor: "pointer", fontSize: 10, fontWeight: 900,
    },
    chip: (active, color = "#3b82f6") => ({
      padding: "6px 16px", borderRadius: 20,
      border: `1px solid ${active ? color : "rgba(51,65,85,0.4)"}`,
      background: active ? color + "22" : "transparent",
      color: active ? color : "#64748b",
      fontSize: 12, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
    }),

    // ── Mobile hamburger ──
    mobileHamburger: {
      position: "fixed", top: 16, left: 16, zIndex: 600,
      width: 42, height: 42, borderRadius: 12,
      background: "rgba(15,23,42,0.95)",
      border: "1px solid rgba(59,130,246,0.25)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 5, cursor: "pointer", backdropFilter: "blur(12px)",
    },

    // ── Responsive grid columns ──
    // Analytics stat cards
    analyticsStats: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 12 : 20 },
    // Analytics main 2-col
    analyticsMain: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.8fr 1.2fr", gap: isMobile ? 16 : 30 },
    // Analytics charts row
    analyticsCharts: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 0.8fr", gap: isMobile ? 16 : 30 },
    // Kitchen 4-stage board
    kitchenGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 14 },
    // Billing stats
    billingStats: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 20 },
    // Reports stats
    reportsStats: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 16, marginBottom: 24 },
    // Housekeeping rooms
    hkGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 },
    // Calendar + detail side by side
    calendarGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 24, alignItems: "flex-start" },
    // Chats: thread list + conversation
    chatsGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: 20, minHeight: 500 },
    // Menu catalog form
    menuForm: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 },
  };
}
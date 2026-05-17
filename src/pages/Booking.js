import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// ═══════════════════════════════════════════════════════════════════════════
//  THE AFIA — Reservation Wizard
//  Step 1: Dates + guests
//  Step 2: Pick a room type (only available ones shown)
//  Step 3: Confirm + pay
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  accent: '#3b82f6', accent2: '#60a5fa', accentDeep: '#2563eb',
  dark: '#020617', card: '#0f172a', card2: '#1e293b',
  border: 'rgba(59,130,246,0.15)', text: '#f1f5f9',
  muted: '#94a3b8', subtle: '#64748b', gold: '#f59e0b',
  green: '#10b981', red: '#ef4444',
};

const Icon = ({ d, size = 18, color = 'currentColor', stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  arrow:    "M5 12h14 M12 5l7 7-7 7",
  arrowL:   "M19 12H5 M12 19l-7-7 7-7",
  calendar: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4 M8 2v4 M3 10h18",
  users:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  check:    "M20 6L9 17l-5-5",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  bed:      "M2 4v16 M22 4v16 M2 8h20 M2 16h20 M6 8v8",
  wifi:     "M5 12.55a11 11 0 0114 0 M1.42 9a16 16 0 0121.16 0 M8.53 16.11a6 6 0 016.95 0 M12 20h.01",
  cancel:   "M18 6L6 18 M6 6l12 12",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const tomorrow = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
};
const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const ms = new Date(b) - new Date(a);
  return Math.max(0, Math.round(ms / 86400000));
};
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};
const generateToken = () => String(Math.floor(1000 + Math.random() * 9000));

// ─── Step indicator ──────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ["Dates", "Suite", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 44 }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                border: `1.5px solid ${active || done ? C.accent : C.border}`,
                background: done ? C.accent : active ? "rgba(59,130,246,0.12)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                color: done ? "#fff" : active ? C.accent : C.subtle,
                transition: "all 0.3s",
              }}>
                {done ? <Icon d={I.check} size={14} color="#fff" /> : num}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, letterSpacing: 1,
                color: active ? C.accent : done ? C.text : C.subtle,
                textTransform: "uppercase",
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 40, height: 1, background: done ? C.accent : C.border }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Photo carousel ──────────────────────────────────────────────────────────
function PhotoCarousel({ photos, height = 240 }) {
  const [idx, setIdx] = useState(0);
  if (!photos || photos.length === 0) {
    return (
      <div style={{
        height, background: C.card2, borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: C.muted, fontSize: 12,
      }}>No photos available</div>
    );
  }
  return (
    <div style={{ position: "relative", height, borderRadius: 16, overflow: "hidden" }}>
      <img src={photos[idx]} alt={`photo ${idx + 1}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }}
        onError={e => { e.target.style.opacity = 0.3; }} />
      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); }}
            style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(2,6,23,0.7)", backdropFilter: "blur(10px)",
              border: `1px solid ${C.border}`, color: C.text, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <Icon d={I.arrowL} size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); }}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(2,6,23,0.7)", backdropFilter: "blur(10px)",
              border: `1px solid ${C.border}`, color: C.text, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <Icon d={I.arrow} size={14} />
          </button>
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 6,
          }}>
            {photos.map((_, i) => (
              <div key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                style={{
                  width: i === idx ? 22 : 6, height: 6, borderRadius: 3,
                  background: i === idx ? C.accent : "rgba(255,255,255,0.5)",
                  cursor: "pointer", transition: "all 0.3s",
                }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Booking() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);

  // Step 1 — search params
  const [checkIn,  setCheckIn]  = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [guests,   setGuests]   = useState(2);

  // Step 2 — results & selection
  const [searching, setSearching] = useState(false);
  const [availableByType, setAvailableByType] = useState({}); // { typeId: { type, rooms[], photos } }
  const [selectedTypeId, setSelectedTypeId] = useState(null);

  // Step 3 — confirm
  const [guestNotes, setGuestNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("at_hotel");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load user on mount (booking can be done without login, but we attach user_id if available)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    })();
  }, []);

  // ── Derived: nights and total ──
  const nights = useMemo(() => daysBetween(checkIn, checkOut), [checkIn, checkOut]);
  const selectedType = availableByType[selectedTypeId]?.type;
  const totalAmount = selectedType ? Number(selectedType.price_per_night) * nights : 0;

  // ── Validation ──
  const dateValid = checkIn && checkOut && nights > 0;
  const guestsValid = guests >= 1 && guests <= 8;

  // ── SEARCH AVAILABILITY ──
  async function searchAvailability() {
    setError("");
    if (!dateValid) { setError("Please pick valid check-in and check-out dates."); return; }
    if (!guestsValid) { setError("Guest count must be between 1 and 8."); return; }
    if (new Date(checkIn) < new Date(today())) {
      setError("Check-in cannot be in the past.");
      return;
    }
    setSearching(true);

    try {
      // 1. Fetch all room types that can fit guest count
      const { data: types } = await supabase
        .from("room_types")
        .select("*")
        .gte("capacity", guests)
        .order("price_per_night", { ascending: true });

      if (!types || types.length === 0) {
        setAvailableByType({});
        setSearching(false);
        setError(`No room types fit ${guests} guest${guests === 1 ? "" : "s"}.`);
        return;
      }

      // 2. Fetch all rooms with those types
      const typeIds = types.map(t => t.id);
      const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .in("type_id", typeIds);

      // 3. Fetch existing ACTIVE bookings that overlap the requested range
      // Overlap rule: booking.check_in_date < requested.check_out_date AND booking.check_out_date > requested.check_in_date
      const { data: conflicts } = await supabase
        .from("bookings")
        .select("room_number, check_in_date, check_out_date, status")
        .eq("status", "ACTIVE")
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn);

      const blockedRooms = new Set((conflicts || []).map(b => b.room_number));

      // 4. Build available-by-type map
      const map = {};
      for (const t of types) {
        const free = (rooms || []).filter(r =>
          r.type_id === t.id &&
          !blockedRooms.has(r.room_number) &&
          r.status !== "MAINTENANCE"
        );
        if (free.length > 0) {
          // Fetch photos for the first available room as the gallery (one carousel per type)
          const firstRoom = free[0];
          const { data: photos } = await supabase
            .from("room_photos")
            .select("photo_url")
            .eq("room_number", firstRoom.room_number)
            .order("sort_order", { ascending: true });

          map[t.id] = {
            type: t,
            rooms: free,
            photos: (photos || []).map(p => p.photo_url),
          };
        }
      }

      setAvailableByType(map);
      setSelectedTypeId(null);
      setSearching(false);

      if (Object.keys(map).length === 0) {
        setError("No suites available for those dates. Try different dates.");
      } else {
        setStep(2);
      }
    } catch (e) {
      console.error(e);
      setError(`Search failed: ${e.message}`);
      setSearching(false);
    }
  }

  // ── CONFIRM & CREATE BOOKING ──
  async function confirmBooking() {
    setError("");
    setSubmitting(true);

    try {
      const bundle = availableByType[selectedTypeId];
      if (!bundle || bundle.rooms.length === 0) {
        setError("That suite is no longer available. Please search again.");
        setSubmitting(false);
        return;
      }

      // Pick the first free room of the chosen type
      const assignedRoom = bundle.rooms[0];

      // Build the booking
      const accessToken = generateToken();
      const guestName =
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Guest";

      const checkInAt  = new Date(checkIn + "T15:00:00").toISOString();  // 3pm
      const checkOutAt = new Date(checkOut + "T12:00:00").toISOString(); // 12pm

      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          guest_name: guestName,
          room_number: assignedRoom.room_number,
          access_token: accessToken,
          is_vip: bundle.type.slug === "penthouse",
          guest_notes: guestNotes || null,
          stay_date: checkIn,
          guest_count: guests,
          check_in_at: checkInAt,
          check_out_at: checkOutAt,
          check_in_date: checkIn,
          check_out_date: checkOut,
          nights,
          total_amount: totalAmount,
          checkout_notified: false,
          status: "ACTIVE",
          user_id: user?.id || null,
          guest_email: user?.email || null,
          stay_duration_hours: nights * 24,
        })
        .select()
        .single();

      if (bookErr) {
        console.error(bookErr);
        setError(`Booking failed: ${bookErr.message}`);
        setSubmitting(false);
        return;
      }

      // Mark the room occupied
      await supabase
        .from("rooms")
        .update({ status: "OCCUPIED" })
        .eq("room_number", assignedRoom.room_number);

      // Add the room charge to the guest ledger
      await supabase.from("guest_ledger").insert({
        room_number: assignedRoom.room_number.toString(),
        description: `${bundle.type.name} · ${nights} ${nights === 1 ? "night" : "nights"}`,
        amount: totalAmount,
        status: paymentMethod === "paystack" ? "paid" : "pending",
      });

      // Done — route to welcome (which will pick up the new active booking)
      if (user) {
        navigate("/welcome");
      } else {
        // Not logged in — send to login with a flag
        navigate("/login");
      }
    } catch (e) {
      console.error(e);
      setError(`Booking failed: ${e.message}`);
      setSubmitting(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{
      minHeight: "100vh", background: C.dark, color: C.text,
      fontFamily: "'DM Sans', 'Inter', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        * { box-sizing: border-box; }

        @media (max-width: 768px) {
          .step1-grid { grid-template-columns: 1fr !important; }
          .summary-grid { grid-template-columns: 1fr !important; }
          .container-pad { padding: 24px !important; }
          .hero-title { font-size: 32px !important; }
        }
      `}</style>

      {/* Background */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070")',
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.18, zIndex: 0,
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: "linear-gradient(180deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.95) 100%)",
      }} />
      <div style={{
        position: "fixed", top: "-15%", right: "-10%", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)",
        filter: "blur(80px)", zIndex: 1, pointerEvents: "none",
      }} />

      {/* Top bar */}
      <nav style={{
        position: "relative", zIndex: 10,
        padding: "22px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`, background: "rgba(2,6,23,0.6)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#fff",
            boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
          }}>✦</div>
          <div style={{ fontFamily: "'Georgia', serif", fontWeight: 300, fontSize: 20, letterSpacing: 2 }}>The Afia</div>
        </div>
        <button onClick={() => navigate("/")}
          style={{
            background: "transparent", border: `1px solid ${C.border}`, color: C.muted,
            padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
          }}>
          <Icon d={I.cancel} size={12} color={C.muted} /> Cancel
        </button>
      </nav>

      {/* Main */}
      <main style={{
        position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto",
        padding: "60px 40px", animation: "fadeIn 0.6s ease-out",
      }} className="container-pad">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{
            fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700,
            textTransform: "uppercase", marginBottom: 14,
          }}>
            ✦ Reserve Your Stay
          </div>
          <h1 className="hero-title" style={{
            fontFamily: "'Georgia', serif", fontWeight: 300,
            fontSize: 44, letterSpacing: "-1px", margin: "0 0 14px", color: "#fff",
          }}>
            {step === 1 && "When would you like to stay?"}
            {step === 2 && "Choose your suite"}
            {step === 3 && "Confirm your reservation"}
          </h1>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            {step === 1 && "Pick your dates and number of guests. We'll show you what's available."}
            {step === 2 && `${Object.keys(availableByType).length} suite${Object.keys(availableByType).length === 1 ? "" : "s"} available for your dates`}
            {step === 3 && "Review the details and complete your reservation."}
          </p>
        </div>

        <Stepper step={step} />

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "14px 20px", borderRadius: 14, marginBottom: 24,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            color: C.red, fontSize: 13, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* ─── STEP 1: DATES + GUESTS ─── */}
        {step === 1 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.88), rgba(15,23,42,0.7))",
            backdropFilter: "blur(24px)", border: `1px solid ${C.border}`,
            borderRadius: 24, padding: 40,
            boxShadow: "0 30px 70px -15px rgba(0,0,0,0.6)",
            animation: "fadeIn 0.6s ease-out",
          }}>
            <div className="step1-grid" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 30,
            }}>
              <div>
                <label style={{
                  fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700,
                  textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                }}>
                  <Icon d={I.calendar} size={12} color={C.accent} /> Check-In
                </label>
                <input type="date" value={checkIn} min={today()}
                  onChange={e => setCheckIn(e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{
                  fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700,
                  textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                }}>
                  <Icon d={I.calendar} size={12} color={C.accent} /> Check-Out
                </label>
                <input type="date" value={checkOut} min={checkIn || today()}
                  onChange={e => setCheckOut(e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{
                  fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700,
                  textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                }}>
                  <Icon d={I.users} size={12} color={C.accent} /> Guests
                </label>
                <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={inputStyle}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n} style={{ background: C.dark }}>
                      {n} {n === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live preview of nights */}
            <div style={{
              padding: "16px 20px", borderRadius: 14, marginBottom: 28,
              background: "rgba(59,130,246,0.05)", border: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: C.subtle, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
                  Your Stay
                </div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>
                  {dateValid ? `${nights} ${nights === 1 ? "night" : "nights"} · ${fmtDate(checkIn)} → ${fmtDate(checkOut)}` : "Pick valid dates above"}
                </div>
              </div>
              <div style={{
                fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              }}>
                {guests} {guests === 1 ? "Guest" : "Guests"}
              </div>
            </div>

            <button onClick={searchAvailability} disabled={searching}
              style={{
                width: "100%", padding: 18, borderRadius: 14, border: "none",
                background: searching ? C.card2 : `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                color: "#fff", fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
                cursor: searching ? "not-allowed" : "pointer", fontFamily: "inherit",
                boxShadow: searching ? "none" : "0 10px 30px rgba(59,130,246,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.3s",
              }}>
              {searching ? "Searching..." : <>Check Availability <Icon d={I.arrow} size={14} color="#fff" /></>}
            </button>
          </div>
        )}

        {/* ─── STEP 2: PICK SUITE ─── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.6s ease-out" }}>
            {Object.values(availableByType).map(({ type, rooms, photos }) => {
              const isSelected = selectedTypeId === type.id;
              const total = Number(type.price_per_night) * nights;
              return (
                <div key={type.id}
                  onClick={() => setSelectedTypeId(type.id)}
                  style={{
                    background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.75))",
                    backdropFilter: "blur(24px)",
                    border: `1.5px solid ${isSelected ? C.accent : C.border}`,
                    borderRadius: 24, overflow: "hidden", cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow: isSelected ? "0 20px 60px rgba(59,130,246,0.25)" : "0 10px 30px rgba(0,0,0,0.4)",
                  }}>
                  <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0 }} className="suite-grid">
                    <PhotoCarousel photos={photos} height={260} />
                    <div style={{ padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{
                          fontSize: 10, letterSpacing: 3, color: C.accent, fontWeight: 700,
                          textTransform: "uppercase", marginBottom: 8,
                        }}>
                          {rooms.length} available · fits up to {type.capacity}
                        </div>
                        <h3 style={{
                          fontFamily: "'Georgia', serif", fontWeight: 400,
                          fontSize: 26, margin: "0 0 10px", color: "#fff",
                        }}>
                          {type.name}
                        </h3>
                        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
                          {type.description}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                          {(type.amenities || []).slice(0, 5).map(a => (
                            <span key={a} style={{
                              fontSize: 10, padding: "4px 10px", borderRadius: 16,
                              background: "rgba(59,130,246,0.08)", border: `1px solid ${C.border}`,
                              color: C.accent2, fontWeight: 600, letterSpacing: 0.5,
                            }}>{a}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <div style={{ fontSize: 11, color: C.subtle, marginBottom: 2 }}>
                            ₵{Number(type.price_per_night).toLocaleString()} × {nights} {nights === 1 ? "night" : "nights"}
                          </div>
                          <div style={{
                            fontFamily: "'Georgia', serif", fontWeight: 300,
                            fontSize: 28, color: "#fff", letterSpacing: -0.5,
                          }}>
                            ₵{total.toLocaleString()}
                          </div>
                        </div>
                        <div style={{
                          padding: "12px 22px", borderRadius: 12,
                          background: isSelected ? C.accent : "rgba(59,130,246,0.08)",
                          border: `1px solid ${isSelected ? C.accent : C.border}`,
                          color: isSelected ? "#fff" : C.accent,
                          fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          {isSelected && <Icon d={I.check} size={12} color="#fff" />}
                          {isSelected ? "Selected" : "Select"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: 16, borderRadius: 14,
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <Icon d={I.arrowL} size={12} /> Back
              </button>
              <button onClick={() => setStep(3)} disabled={!selectedTypeId}
                style={{
                  flex: 2, padding: 16, borderRadius: 14, border: "none",
                  background: selectedTypeId ? `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})` : C.card2,
                  color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
                  cursor: selectedTypeId ? "pointer" : "not-allowed", fontFamily: "inherit",
                  opacity: selectedTypeId ? 1 : 0.5,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: selectedTypeId ? "0 10px 30px rgba(59,130,246,0.4)" : "none",
                }}>
                Continue <Icon d={I.arrow} size={14} color="#fff" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: CONFIRM ─── */}
        {step === 3 && selectedType && (
          <div style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.75))",
            backdropFilter: "blur(24px)", border: `1px solid ${C.border}`,
            borderRadius: 24, padding: 40,
            boxShadow: "0 30px 70px -15px rgba(0,0,0,0.6)", animation: "fadeIn 0.6s ease-out",
          }}>
            {/* Summary header */}
            <div style={{
              padding: 24, borderRadius: 18, marginBottom: 30,
              background: "rgba(59,130,246,0.05)", border: `1px solid ${C.border}`,
            }}>
              <div style={{
                fontSize: 10, letterSpacing: 3, color: C.accent, fontWeight: 700,
                textTransform: "uppercase", marginBottom: 12,
              }}>
                Your Reservation
              </div>
              <div className="summary-grid" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: C.subtle, marginBottom: 4, letterSpacing: 1 }}>SUITE</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{selectedType.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.subtle, marginBottom: 4, letterSpacing: 1 }}>DATES</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    {fmtDate(checkIn)} → {fmtDate(checkOut)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.subtle, marginBottom: 4, letterSpacing: 1 }}>GUESTS · NIGHTS</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    {guests} {guests === 1 ? "guest" : "guests"} · {nights} {nights === 1 ? "night" : "nights"}
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div style={{
              padding: 24, borderRadius: 18, marginBottom: 24,
              background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.05))",
              border: `1.5px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: C.subtle, marginBottom: 4, letterSpacing: 1 }}>TOTAL</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  ₵{Number(selectedType.price_per_night).toLocaleString()} × {nights} {nights === 1 ? "night" : "nights"}
                </div>
              </div>
              <div style={{
                fontFamily: "'Georgia', serif", fontWeight: 300,
                fontSize: 38, color: "#fff", letterSpacing: -1,
              }}>
                ₵{totalAmount.toLocaleString()}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700,
                textTransform: "uppercase", display: "block", marginBottom: 10,
              }}>
                Special Requests (optional)
              </label>
              <textarea value={guestNotes} onChange={e => setGuestNotes(e.target.value)} rows={3}
                placeholder="Late arrival, dietary preferences, anniversary surprises..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: "12px 16px", color: C.text, fontSize: 13,
                  fontFamily: "inherit", outline: "none", resize: "none",
                }} />
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 30 }}>
              <label style={{
                fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700,
                textTransform: "uppercase", display: "block", marginBottom: 10,
              }}>
                Payment
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div onClick={() => setPaymentMethod("at_hotel")}
                  style={{
                    padding: 18, borderRadius: 14, cursor: "pointer",
                    background: paymentMethod === "at_hotel" ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${paymentMethod === "at_hotel" ? C.accent : C.border}`,
                    transition: "all 0.2s",
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Pay at Hotel</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Settle on arrival or via your folio</div>
                </div>
                <div onClick={() => setPaymentMethod("paystack")}
                  style={{
                    padding: 18, borderRadius: 14, cursor: "pointer",
                    background: paymentMethod === "paystack" ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${paymentMethod === "paystack" ? C.accent : C.border}`,
                    transition: "all 0.2s", opacity: 0.6,
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Pay Now (Card/MoMo)</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Available in My Folio after booking</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)}
                style={{
                  flex: 1, padding: 16, borderRadius: 14,
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <Icon d={I.arrowL} size={12} /> Back
              </button>
              <button onClick={confirmBooking} disabled={submitting}
                style={{
                  flex: 2, padding: 16, borderRadius: 14, border: "none",
                  background: submitting ? C.card2 : `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                  color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: submitting ? "none" : "0 10px 30px rgba(59,130,246,0.4)",
                }}>
                {submitting ? "Confirming..." : <>Confirm Booking <Icon d={I.check} size={14} color="#fff" /></>}
              </button>
            </div>

            {/* Login hint if not logged in */}
            {!user && (
              <div style={{
                marginTop: 20, padding: "12px 16px", borderRadius: 12,
                background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
                fontSize: 12, color: C.gold, textAlign: "center",
              }}>
                You'll be asked to sign in after confirming so your booking is saved to your account.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: "12px 14px",
  color: C.text,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};
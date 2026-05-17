import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════════════════
//  THE AFIA — Boutique Luxury Landing Page
//  Built to match the blue-black tech-forward aesthetic of the rest of the app
// ═══════════════════════════════════════════════════════════════════════════

const C = {
  accent: '#3b82f6', accent2: '#60a5fa', accentDeep: '#2563eb',
  dark: '#020617', card: '#0f172a', card2: '#1e293b',
  border: 'rgba(59,130,246,0.15)', text: '#f1f5f9',
  muted: '#94a3b8', subtle: '#64748b', gold: '#f59e0b',
};

// ── INLINE SVG ICONS (no external deps) ──────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor', stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  arrow:   "M5 12h14 M12 5l7 7-7 7",
  star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  wifi:    "M5 12.55a11 11 0 0114 0 M1.42 9a16 16 0 0121.16 0 M8.53 16.11a6 6 0 016.95 0 M12 20h.01",
  pool:    "M2 12h20 M2 18h20 M4 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2",
  spa:     "M12 2C9 6 7 10 12 16 17 10 15 6 12 2zM6 12c0 5 3 8 6 8s6-3 6-8",
  utensils:"M3 2v7c0 1.1.9 2 2 2h0a2 2 0 002-2V2 M7 2v20 M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  car:     "M5 17H3v-3l2-7h14l2 7v3h-2M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0z",
  dumbbell:"M6 5v14 M18 5v14 M6 12h12 M3 9v6 M21 9v6",
  pin:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z",
  phone:   "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  clock:   "M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z M12 6v6l4 2",
  user:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
};

// ── HOTEL ROOMS (placeholder data — easy to update later) ────────────────────
const ROOMS = [
  {
    name: "Atelier Suite",
    blurb: "Open-plan workspace, king bed, city skyline through floor-to-ceiling windows.",
    price: 850,
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200",
  },
  {
    name: "Noir Loft",
    blurb: "Two levels of design-led living. Private terrace, dual rainfall showers, smart everything.",
    price: 1450,
    img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200",
  },
  {
    name: "The Penthouse",
    blurb: "Top-floor private residence. Three bedrooms, butler service, panoramic 360° views.",
    price: 3200,
    img: "https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200",
  },
];

const AMENITIES = [
  { icon: I.pool,    name: "Sky Pool",        desc: "Heated infinity edge, Floor 14" },
  { icon: I.spa,     name: "Zen Spa",         desc: "Full-service wellness retreat" },
  { icon: I.utensils,name: "24/7 Dining",     desc: "Chef-led room service, any hour" },
  { icon: I.wifi,    name: "1Gbps Fibre",     desc: "Encrypted, hotel-wide coverage" },
  { icon: I.dumbbell,name: "Fitness Center",  desc: "Technogym, personal trainers" },
  { icon: I.car,     name: "Chauffeur",       desc: "Airport transfer & city rides" },
];

const REVIEWS = [
  { name: "Adwoa M.",     role: "Returning guest",      text: "The AI concierge actually works. I asked for late check-out at 11 PM and someone replied within seconds. This is what hospitality should feel like." },
  { name: "James R.",     role: "Business traveler",    text: "Stayed at hundreds of hotels. None of them let me settle my folio from the room without speaking to anyone. Tiny detail, massive difference." },
  { name: "Priya K.",     role: "Anniversary stay",     text: "The Noir Loft was unreal. The digital key, the in-room ordering, the spa booking — every single touchpoint felt thought through." },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1200",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1200",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?q=80&w=1200",
];

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ background: C.dark, color: C.text, fontFamily: "'DM Sans', 'Inter', sans-serif", minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes kenBurns { 0%{transform:scale(1.0)} 50%{transform:scale(1.06)} 100%{transform:scale(1.0)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes glow     { 0%,100%{box-shadow:0 10px 40px rgba(59,130,246,0.4)} 50%{box-shadow:0 10px 50px rgba(59,130,246,0.6)} }
        * { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        .serif { font-family: 'Georgia', 'Times New Roman', serif; font-weight: 300; }
        .reveal { animation: fadeUp 0.8s ease-out both; }
        .room-card:hover .room-img { transform: scale(1.05); }
        .gallery-tile:hover { transform: scale(1.03); }
        .amenity-card:hover { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.05); }
        .nav-link:hover { color: ${C.accent}; }

        /* Tablet */
        @media (max-width: 1024px) {
          .nav-links-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
          .hero-title { font-size: 56px !important; }
          .rooms-grid { grid-template-columns: 1fr !important; }
          .amenities-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .reviews-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
          .section-padding { padding: 80px 24px !important; }
        }
        /* Mobile */
        @media (max-width: 640px) {
          .hero-title { font-size: 38px !important; line-height: 1.05 !important; }
          .hero-sub { font-size: 14px !important; }
          .quick-book-bar { flex-direction: column !important; gap: 12px !important; padding: 20px !important; }
          .quick-book-bar > * { width: 100% !important; }
          .amenities-grid { grid-template-columns: 1fr !important; }
          .gallery-grid { grid-template-columns: 1fr !important; }
          .section-title { font-size: 28px !important; }
          .top-nav { padding: 14px 20px !important; }
          .footer-grid { padding: 50px 20px !important; }
        }
      `}</style>

      {/* ─── TOP NAV ─── */}
      <nav className="top-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? '14px 60px' : '22px 60px',
        background: scrolled ? 'rgba(2,6,23,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          }}>✦</div>
          <div className="serif" style={{ fontSize: 22, letterSpacing: 2, color: '#fff' }}>The Afia</div>
        </div>

        {/* Desktop nav links */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Suites', 'Amenities', 'Gallery', 'Reviews', 'Contact'].map(label => (
            <div key={label} className="nav-link" onClick={() => scrollToId(label.toLowerCase())}
              style={{ fontSize: 13, fontWeight: 500, color: C.muted, cursor: 'pointer', transition: 'color 0.2s', letterSpacing: 0.5 }}>
              {label}
            </div>
          ))}
          <div style={{ height: 20, width: 1, background: C.border }} />
          <button onClick={() => navigate('/login')}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`, color: C.text,
              padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', letterSpacing: 0.5, fontFamily: 'inherit',
            }}>
            Sign In
          </button>
          <button onClick={() => navigate('/book')}
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              border: 'none', color: '#fff',
              padding: '10px 22px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}>
            Book Now
          </button>
          <button onClick={() => navigate('/staff-portal')}
            title="Staff Portal"
            style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: C.gold, padding: 10, borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Icon d={I.shield} size={14} color={C.gold} />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="nav-mobile-toggle" onClick={() => setMobileMenuOpen(o => !o)}
          style={{
            display: 'none', background: 'transparent', border: `1px solid ${C.border}`,
            color: C.text, padding: 10, borderRadius: 10, cursor: 'pointer',
            flexDirection: 'column', gap: 4,
          }}>
          <span style={{ width: 18, height: 1.5, background: C.text, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translate(4px,4px)' : 'none' }} />
          <span style={{ width: 18, height: 1.5, background: C.text, transition: 'all 0.2s', opacity: mobileMenuOpen ? 0 : 1 }} />
          <span style={{ width: 18, height: 1.5, background: C.text, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(4px,-4px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'rgba(2,6,23,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.border}`, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {['Suites', 'Amenities', 'Gallery', 'Reviews', 'Contact'].map(label => (
            <div key={label} onClick={() => scrollToId(label.toLowerCase())}
              style={{ padding: '10px 0', fontSize: 14, fontWeight: 500, color: C.text, cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
              {label}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
              style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign In
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/book'); }}
              style={{ flex: 1, padding: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                border: 'none', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'inherit' }}>
              Book Now
            </button>
          </div>
          <button onClick={() => { setMobileMenuOpen(false); navigate('/staff-portal'); }}
            style={{ padding: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: C.gold, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
            <Icon d={I.shield} size={14} color={C.gold} /> Staff Portal
          </button>
        </div>
      )}

      {/* ─── HERO ─── */}
      <section style={{
        height: '100vh', minHeight: 600, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070")',
          backgroundSize: 'cover', backgroundPosition: 'center',
          animation: 'kenBurns 32s ease-in-out infinite', zIndex: 1,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(180deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.55) 40%, rgba(2,6,23,0.95) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '-10%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)',
          filter: 'blur(80px)', zIndex: 2, pointerEvents: 'none',
        }} />

        <div className="reveal" style={{ position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: 900, padding: '0 24px' }}>
          <div style={{
            display: 'inline-block', padding: '6px 18px', marginBottom: 30,
            border: `1px solid ${C.border}`, borderRadius: 30,
            fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700, textTransform: 'uppercase',
            background: 'rgba(59,130,246,0.08)',
          }}>
            ✦ Boutique Luxury · In the heart of the city
          </div>
          <h1 className="serif hero-title" style={{
            fontSize: 88, lineHeight: 1, margin: '0 0 24px', letterSpacing: '-3px',
            background: 'linear-gradient(to bottom, #fff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Designed for<br/>those who notice.
          </h1>
          <p className="hero-sub" style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px' }}>
            A modern boutique hotel where every detail is intentional —
            from your encrypted digital key to your 24/7 AI concierge.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/book')}
              style={{
                padding: '15px 32px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 10,
                animation: 'glow 3s ease-in-out infinite',
              }}>
              Reserve Your Stay <Icon d={I.arrow} size={14} color="#fff" />
            </button>
            <button onClick={() => scrollToId('suites')}
              style={{
                padding: '15px 32px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                color: C.text, fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(10px)',
              }}>
              Explore Suites
            </button>
          </div>

          {/* Small trust row */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 50, flexWrap: 'wrap' }}>
            {[
              { icon: I.star,   label: '4.9 · 800+ stays' },
              { icon: I.shield, label: 'Encrypted access' },
              { icon: I.clock,  label: '24/7 concierge' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 12, fontWeight: 600 }}>
                <Icon d={t.icon} size={14} color={C.accent} />
                {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUICK BOOK BAR ─── */}
      <section style={{ padding: '0 24px', marginTop: -40, position: 'relative', zIndex: 10 }}>
        <div className="quick-book-bar" style={{
          maxWidth: 1100, margin: '0 auto', padding: 28,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))',
          backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
          borderRadius: 24, display: 'flex', gap: 20, alignItems: 'flex-end',
          boxShadow: '0 30px 70px -15px rgba(0,0,0,0.6)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Check In</div>
            <input type="date"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: 12, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Check Out</div>
            <input type="date"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: 12, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Guests</div>
            <select
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`, borderRadius: 10,
                padding: 12, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}>
              <option style={{ background: C.dark }}>1 Guest</option>
              <option style={{ background: C.dark }}>2 Guests</option>
              <option style={{ background: C.dark }}>3 Guests</option>
              <option style={{ background: C.dark }}>4+ Guests</option>
            </select>
          </div>
          <button onClick={() => navigate('/book')}
            style={{
              padding: '14px 32px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
            Check Availability
          </button>
        </div>
      </section>

      {/* ─── SUITES ─── */}
      <section id="suites" className="section-padding" style={{ padding: '120px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
              ✦ The Suites
            </div>
            <h2 className="serif section-title" style={{ fontSize: 48, margin: '0 0 14px', color: '#fff', letterSpacing: '-1.5px' }}>
              Three ways to stay
            </h2>
            <p style={{ color: C.muted, fontSize: 15, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              Every suite is curated, not decorated. Bespoke linens, smart climate, sound-isolated walls.
            </p>
          </div>

          <div className="rooms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {ROOMS.map(r => (
              <div key={r.name} className="room-card" style={{
                background: C.card, borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${C.border}`, transition: 'all 0.4s',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/book')}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ height: 240, overflow: 'hidden', position: 'relative' }}>
                  <img src={r.img} alt={r.name} className="room-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} />
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(10px)',
                    border: `1px solid ${C.border}`, borderRadius: 30,
                    padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1,
                  }}>FROM ₵{r.price.toLocaleString()}/NIGHT</div>
                </div>
                <div style={{ padding: 24 }}>
                  <h3 className="serif" style={{ fontSize: 24, color: '#fff', margin: '0 0 10px', fontWeight: 400 }}>{r.name}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '0 0 18px' }}>{r.blurb}</p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                  }}>
                    View Suite <Icon d={I.arrow} size={12} color={C.accent} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AMENITIES ─── */}
      <section id="amenities" className="section-padding" style={{ padding: '120px 60px', background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.03), transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
              ✦ Amenities
            </div>
            <h2 className="serif section-title" style={{ fontSize: 48, margin: '0 0 14px', color: '#fff', letterSpacing: '-1.5px' }}>
              Everything, on demand
            </h2>
            <p style={{ color: C.muted, fontSize: 15, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              Request anything from your phone. Our AI concierge handles it, or hands off to a real person in seconds.
            </p>
          </div>

          <div className="amenities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {AMENITIES.map(a => (
              <div key={a.name} className="amenity-card" style={{
                padding: 28, borderRadius: 18,
                background: C.card, border: `1px solid ${C.border}`,
                transition: 'all 0.3s', cursor: 'default',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(59,130,246,0.1)', border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                }}>
                  <Icon d={a.icon} size={22} color={C.accent} />
                </div>
                <h4 style={{ fontSize: 16, color: '#fff', margin: '0 0 6px', fontWeight: 600 }}>{a.name}</h4>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section id="gallery" className="section-padding" style={{ padding: '120px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
              ✦ The Property
            </div>
            <h2 className="serif section-title" style={{ fontSize: 48, margin: '0 0 14px', color: '#fff', letterSpacing: '-1.5px' }}>
              A closer look
            </h2>
          </div>

          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {GALLERY.map((src, i) => (
              <div key={i} className="gallery-tile" style={{
                position: 'relative', overflow: 'hidden', borderRadius: 18,
                aspectRatio: i % 5 === 0 ? '4/5' : '1/1',
                gridRow: i % 5 === 0 ? 'span 2' : 'auto',
                transition: 'transform 0.4s', cursor: 'pointer',
              }}>
                <img src={src} alt={`Gallery ${i+1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 60%, rgba(2,6,23,0.6))',
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section id="reviews" className="section-padding" style={{ padding: '120px 60px', background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.04), transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 14 }}>
              ✦ Guest Voices
            </div>
            <h2 className="serif section-title" style={{ fontSize: 48, margin: '0 0 14px', color: '#fff', letterSpacing: '-1.5px' }}>
              Loved by quiet people
            </h2>
          </div>

          <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {REVIEWS.map((r, i) => (
              <div key={i} style={{
                padding: 30, borderRadius: 20,
                background: C.card, border: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                  {Array(5).fill(0).map((_, idx) => (
                    <Icon key={idx} d={I.star} size={14} color={C.gold} stroke={1.2} />
                  ))}
                </div>
                <p className="serif" style={{ fontSize: 17, color: '#fff', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 24px' }}>
                  "{r.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>{r.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: C.subtle }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT / CTA ─── */}
      <section id="contact" className="section-padding" style={{ padding: '120px 60px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '80px 60px', borderRadius: 28, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))',
          backdropFilter: 'blur(24px)', border: `1px solid ${C.border}`,
        }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)',
            filter: 'blur(60px)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>
              ✦ Reserve Your Stay
            </div>
            <h2 className="serif section-title" style={{ fontSize: 44, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
              Your suite is waiting.
            </h2>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
              Book direct for the best rate and the full Afia experience —
              your AI concierge, digital key, and 24/7 dining included.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/book')}
                style={{
                  padding: '15px 32px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                  color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 10px 40px rgba(59,130,246,0.4)',
                }}>
                Book Now
              </button>
              <a href="tel:+233543662896"
                style={{
                  padding: '15px 32px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 13, fontWeight: 600, letterSpacing: 1.5,
                  display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
                }}>
                <Icon d={I.phone} size={14} color={C.text} /> +233 54 366 2896
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        padding: '60px 60px 30px', borderTop: `1px solid ${C.border}`,
        background: 'rgba(2,6,23,0.95)',
      }}>
        <div className="footer-grid" style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>✦</div>
              <div className="serif" style={{ fontSize: 22, letterSpacing: 2, color: '#fff' }}>The Afia</div>
            </div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, maxWidth: 320 }}>
              A modern boutique hotel where every detail is intentional.
              In the heart of the city.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 18 }}>Explore</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Suites', 'Amenities', 'Gallery', 'Reviews'].map(l => (
                <div key={l} onClick={() => scrollToId(l.toLowerCase())}
                  style={{ fontSize: 13, color: C.muted, cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 18 }}>Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div onClick={() => navigate('/login')} style={{ fontSize: 13, color: C.muted, cursor: 'pointer' }}>Sign In</div>
              <div onClick={() => navigate('/register')} style={{ fontSize: 13, color: C.muted, cursor: 'pointer' }}>Create Account</div>
              <div onClick={() => navigate('/book')} style={{ fontSize: 13, color: C.muted, cursor: 'pointer' }}>Book a Suite</div>
              <div onClick={() => navigate('/staff-portal')} style={{ fontSize: 13, color: C.gold, cursor: 'pointer' }}>Staff Portal</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.accent, fontWeight: 700, textTransform: 'uppercase', marginBottom: 18 }}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.muted }}>
                <Icon d={I.phone} size={13} color={C.muted} /> +233 54 366 2896
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.muted }}>
                <Icon d={I.mail} size={13} color={C.muted} /> [email protected]
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.muted }}>
                <Icon d={I.pin} size={13} color={C.muted} />
                <span>In the heart of the city</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: 1200, margin: '50px auto 0', paddingTop: 30,
          borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ fontSize: 11, color: C.subtle, letterSpacing: 1 }}>
            © {new Date().getFullYear()} The Afia. All rights reserved.
          </div>
          <div style={{ fontSize: 9, color: C.subtle, letterSpacing: 3, textTransform: 'uppercase' }}>
            Powered by StayPilot · Encrypted End-to-End
          </div>
        </div>
      </footer>
    </div>
  );
}
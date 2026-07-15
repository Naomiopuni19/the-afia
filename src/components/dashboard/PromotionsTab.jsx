import React, { useState } from "react";
import { sendPromoEmail } from "../../lib/sendEmail";

const PROMO_TEMPLATES = [
  { emoji:"🏊", title:"Sky Pool — Open Tonight", category:"Amenities", body:"The Sky Pool on Floor 14 is heated to 28°C and open until 11 PM tonight. Cabanas are available from ₵120. Come unwind above the city.", cta:"Reserve a Cabana" },
  { emoji:"🍸", title:"Happy Hour at Sky Bar", category:"Dining", body:"Join us at Sky Bar on Floor 15 from 5 PM to 7 PM for our signature happy hour. Handcrafted cocktails from ₵80, with panoramic city views.", cta:"Reserve a Table" },
  { emoji:"💆", title:"Zen Spa — Limited Slots", category:"Wellness", body:"Only a few treatment slots remain today at our Zen Spa on Floor 2. Massages, facials, and body treatments from ₵180. Book before they're gone.", cta:"Book a Treatment" },
  { emoji:"🍽", title:"Chef's Special Tonight", category:"Dining", body:"Our head chef has prepared a limited tasting menu available this evening only. Five courses, locally sourced, beautifully plated. Available from 7 PM.", cta:"Order Now" },
  { emoji:"🏋", title:"Personal Training Available", category:"Wellness", body:"Our certified personal trainers are available for one-on-one sessions in the Fitness Center on Floor 4. Sessions from ₵150 per hour.", cta:"Book a Session" },
  { emoji:"🚗", title:"Complimentary Shuttle Service", category:"Transport", body:"A complimentary hotel shuttle is available to the city centre and nearby attractions today. Departs every two hours from the main lobby.", cta:"Reserve Your Seat" },
];

export default function PromotionsTab({ isMobile, bookings, supabase }) {
  const [promoEmoji, setPromoEmoji] = useState("✦");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoBody, setPromoBody] = useState("");
  const [promoCategory, setPromoCategory] = useState("Amenities");
  const [ctaText, setCtaText] = useState("Claim Your Offer");
  const [validUntil, setValidUntil] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [preview, setPreview] = useState(false);
  const [promoHistory, setPromoHistory] = useState([]);

  const CATEGORIES = ["Amenities", "Dining", "Wellness", "Transport", "Special Offer", "Event"];
  const EMOJIS = ["✦","🏊","🍸","💆","🍽","🏋","🚗","🌿","🎉","🎁","⭐","🔥"];

  const filteredGuests = () => {
    if (audience === "vip") return bookings.filter(b => b.is_vip);
    return bookings;
  };

  const handleSend = async () => {
    if (!promoTitle || !promoBody) return;
    const guests = filteredGuests();
    if (guests.length === 0) return;

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const booking of guests) {
      if (!booking.guest_email) { failCount++; continue; }
      const result = await sendPromoEmail({
        to: booking.guest_email,
        guestName: booking.guest_name,
        roomNumber: booking.room_number,
        promoTitle,
        promoBody,
        promoEmoji,
        promoCategory,
        ctaText,
        validUntil,
      });
      if (result.ok) successCount++;
      else failCount++;
    }

    setSending(false);
    setSent({ successCount, failCount, total: guests.length, title: promoTitle, emoji: promoEmoji, time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) });
    setPromoHistory(prev => [{ title: promoTitle, emoji: promoEmoji, category: promoCategory, audience, sent: successCount, time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) }, ...prev.slice(0, 9)]);

    // Reset
    setPromoTitle(""); setPromoBody(""); setCtaText("Claim Your Offer"); setValidUntil("");
  };

  const applyTemplate = (t) => {
    setPromoEmoji(t.emoji);
    setPromoTitle(t.title);
    setPromoBody(t.body);
    setPromoCategory(t.category);
    setCtaText(t.cta);
    setPreview(false);
    setSent(null);
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(59,130,246,0.15)", borderRadius:10,
    padding:"10px 14px", color:"#fff", fontSize:13,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  const labelStyle = {
    fontSize:10, color:"#475569", fontWeight:700,
    letterSpacing:1.5, textTransform:"uppercase",
    display:"block", marginBottom:6,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Promotions</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>
          Send exclusive offers to {bookings.length} active guest{bookings.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Success banner */}
      {sent && (
        <div style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:16, padding:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:"#10b981", marginBottom:2 }}>
              {sent.emoji} Promo sent!
            </div>
            <div style={{ fontSize:13, color:"#475569" }}>
              {sent.successCount} email{sent.successCount !== 1 ? "s" : ""} delivered · {sent.failCount} failed
            </div>
          </div>
          <button onClick={() => setSent(null)} style={{ padding:"7px 16px", borderRadius:10, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", color:"#10b981", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Send Another
          </button>
        </div>
      )}

      {/* No active guests warning */}
      {bookings.length === 0 && (
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:16, padding:20 }}>
          <div style={{ fontSize:13, color:"#f59e0b", fontWeight:700 }}>No active guests right now</div>
          <div style={{ fontSize:12, color:"#475569", marginTop:4 }}>Promotions can only be sent to guests with active bookings.</div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 340px", gap:16, alignItems:"flex-start" }}>

        {/* Compose panel */}
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?16:24, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>Compose Promo</div>

          {/* Emoji picker */}
          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setPromoEmoji(e)} style={{ width:38, height:38, borderRadius:10, fontSize:18, cursor:"pointer", border:`1px solid ${promoEmoji===e?"rgba(59,130,246,0.5)":"rgba(59,130,246,0.1)"}`, background:promoEmoji===e?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)", transition:"all 0.15s" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setPromoCategory(c)} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${promoCategory===c?"#3b82f6":"rgba(59,130,246,0.1)"}`, background:promoCategory===c?"rgba(59,130,246,0.15)":"transparent", color:promoCategory===c?"#3b82f6":"#475569", transition:"all 0.15s" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Promo Title *</label>
            <input value={promoTitle} onChange={e => setPromoTitle(e.target.value)} placeholder="e.g. Happy Hour at Sky Bar" style={inputStyle} />
          </div>

          {/* Body */}
          <div>
            <label style={labelStyle}>Message *</label>
            <textarea value={promoBody} onChange={e => setPromoBody(e.target.value)} rows={4} placeholder="Describe the offer, details, pricing..." style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} />
          </div>

          {/* CTA + Valid Until */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Button Text</label>
              <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Claim Your Offer" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Valid Until</label>
              <input value={validUntil} onChange={e => setValidUntil(e.target.value)} placeholder="e.g. Tonight 11 PM" style={inputStyle} />
            </div>
          </div>

          {/* Audience */}
          <div>
            <label style={labelStyle}>Send To</label>
            <div style={{ display:"flex", gap:8 }}>
              {[["all",`All Guests (${bookings.length})`],["vip",`VIP Only (${bookings.filter(b=>b.is_vip).length})`]].map(([k,l]) => (
                <button key={k} onClick={() => setAudience(k)} style={{ flex:1, padding:"10px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1px solid ${audience===k?"#3b82f6":"rgba(59,130,246,0.1)"}`, background:audience===k?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.03)", color:audience===k?"#3b82f6":"#475569", transition:"all 0.15s" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Preview toggle */}
          {promoTitle && promoBody && (
            <button onClick={() => setPreview(p => !p)} style={{ padding:"10px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.1)", color:"#94a3b8", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {preview ? "Hide Preview" : "Preview Email"}
            </button>
          )}

          {/* Send button */}
          <button onClick={handleSend} disabled={sending || !promoTitle || !promoBody || bookings.length === 0} style={{ padding:"14px", borderRadius:12, background: (!promoTitle||!promoBody||sending||bookings.length===0)?"rgba(51,65,85,0.5)":"linear-gradient(135deg,#3b82f6,#2563eb)", border:"none", color:"#fff", fontSize:13, fontWeight:800, cursor:(!promoTitle||!promoBody||sending||bookings.length===0)?"not-allowed":"pointer", fontFamily:"inherit", letterSpacing:1, opacity:sending?0.7:1 }}>
            {sending ? "Sending..." : `Send to ${filteredGuests().length} Guest${filteredGuests().length !== 1 ? "s" : ""} 📧`}
          </button>
        </div>

        {/* Right panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Preview */}
          {preview && promoTitle && promoBody && (
            <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:20 }}>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, letterSpacing:1.5, marginBottom:14 }}>EMAIL PREVIEW</div>
              <div style={{ background:"rgba(2,6,23,0.8)", borderRadius:14, padding:20, border:"1px solid rgba(59,130,246,0.1)" }}>
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>{promoEmoji}</div>
                  <div style={{ fontSize:9, color:"#3b82f6", letterSpacing:3, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{promoCategory}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#fff", fontFamily:"Georgia, serif" }}>{promoTitle}</div>
                </div>
                <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, margin:"0 0 14px" }}>{promoBody}</p>
                {validUntil && <div style={{ fontSize:11, color:"#f59e0b", marginBottom:12 }}>⏳ Valid until {validUntil}</div>}
                <div style={{ textAlign:"center" }}>
                  <span style={{ display:"inline-block", padding:"8px 20px", borderRadius:8, background:"#3b82f6", color:"#fff", fontSize:11, fontWeight:700 }}>{ctaText} →</span>
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:20 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:14 }}>Quick Templates</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {PROMO_TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => applyTemplate(t)} style={{ padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(59,130,246,0.08)", cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(59,130,246,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="rgba(59,130,246,0.08)"}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>{t.emoji}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{t.title}</div>
                      <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>{t.category}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {promoHistory.length > 0 && (
            <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:20 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:14 }}>Recent Promos</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {promoHistory.map((p, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(59,130,246,0.06)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{p.emoji}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{p.title}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{p.time} · {p.sent} sent</div>
                      </div>
                    </div>
                    <span style={{ fontSize:10, color:"#10b981", fontWeight:700 }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
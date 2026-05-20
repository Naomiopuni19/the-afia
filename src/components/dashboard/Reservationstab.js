import React from "react";

export default function ReservationsTab({
  isMobile, allBookings, calMonth, setCalMonth,
  calSelectedDay, setCalSelectedDay, monthStats,
}) {
  const calYear = calMonth.getFullYear();
  const calMon = calMonth.getMonth();
  const firstDay = new Date(calYear, calMon, 1).getDay();
  const lastDate = new Date(calYear, calMon + 1, 0).getDate();
  const todayISO = new Date().toISOString().split("T")[0];
  const monthLabel = calMonth.toLocaleDateString("en-GB", { month:"long", year:"numeric" });

  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= lastDate; d++) calCells.push(d);

  const bookingsByDay = (day) => {
    if (!day) return [];
    const dayISO = new Date(calYear, calMon, day, 12).toISOString().split("T")[0];
    return allBookings.filter(b => {
      if (!b.check_in_date || !b.check_out_date || b.status === "CANCELLED") return false;
      return b.check_in_date <= dayISO && b.check_out_date > dayISO;
    });
  };

  const selectedDayBookings = bookingsByDay(calSelectedDay);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Reservations</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>{monthStats.count} bookings · ₵{monthStats.revenue.toLocaleString()} revenue</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setCalMonth(new Date(calYear, calMon-1, 1))} style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.1)", color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>‹</button>
          <span style={{ fontSize:14, fontWeight:700, color:"#fff", minWidth:140, textAlign:"center" }}>{monthLabel}</span>
          <button onClick={() => setCalMonth(new Date(calYear, calMon+1, 1))} style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.1)", color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>›</button>
          <button onClick={() => { setCalMonth(new Date()); setCalSelectedDay(null); }} style={{ padding:"7px 14px", borderRadius:10, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#3b82f6", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Today</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 340px", gap:16 }}>
        {/* Calendar */}
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?12:20 }}>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
            {["S","M","T","W","T","F","S"].map((d,i) => (
              <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#334155", padding:"6px 0" }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap: isMobile?3:4 }}>
            {calCells.map((day, idx) => {
              if (!day) return <div key={idx} style={{ height: isMobile?44:72 }} />;
              const dayBookings = bookingsByDay(day);
              const count = dayBookings.length;
              const dayISO = new Date(calYear, calMon, day, 12).toISOString().split("T")[0];
              const isToday = dayISO === todayISO;
              const isSelected = calSelectedDay === day;
              return (
                <div key={idx} onClick={() => setCalSelectedDay(day)}
                  style={{ height: isMobile?44:72, padding: isMobile?"4px":"6px 8px", borderRadius:12, cursor:"pointer", background: isSelected?"rgba(59,130,246,0.2)":count>0?"rgba(59,130,246,0.06)":"rgba(255,255,255,0.01)", border:`1px solid ${isSelected?"rgba(59,130,246,0.5)":isToday?"rgba(245,158,11,0.4)":"rgba(59,130,246,0.05)"}`, transition:"all 0.15s", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
                  <div style={{ fontSize: isMobile?11:12, fontWeight:isToday?800:500, color:isToday?"#f59e0b":isSelected?"#fff":"#94a3b8" }}>{day}</div>
                  {count > 0 && !isMobile && (
                    <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:2 }}>
                      {dayBookings.slice(0,2).map(b => (
                        <div key={b.id} style={{ fontSize:9, color:"#3b82f6", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>#{b.room_number} {b.guest_name?.split(" ")[0]}</div>
                      ))}
                      {count > 2 && <div style={{ fontSize:9, color:"#475569" }}>+{count-2}</div>}
                    </div>
                  )}
                  {count > 0 && isMobile && <div style={{ width:5, height:5, borderRadius:"50%", background:"#3b82f6", margin:"auto" }} />}
                  {count > 0 && <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:"#3b82f6", opacity:0.4, transform:`scaleX(${Math.min(count/10,1)})`, transformOrigin:"left" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:20 }}>
          {!calSelectedDay ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#334155" }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>📅</div>
              <p style={{ fontSize:13, fontWeight:600 }}>Tap any day to see bookings</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#3b82f6", fontWeight:700, letterSpacing:1, marginBottom:4 }}>SELECTED</div>
                <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{new Date(calYear, calMon, calSelectedDay).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
                <div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{selectedDayBookings.length} guests in residence</div>
              </div>
              {selectedDayBookings.length === 0 ? (
                <div style={{ textAlign:"center", padding:"30px 0", color:"#334155", fontSize:13 }}>No bookings on this day</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:400, overflowY:"auto" }}>
                  {selectedDayBookings.map(b => (
                    <div key={b.id} style={{ padding:14, borderRadius:14, background:"rgba(59,130,246,0.04)", border:"1px solid rgba(59,130,246,0.08)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:"rgba(59,130,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#3b82f6" }}>{b.guest_name?.charAt(0)||"G"}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{b.guest_name}</div>
                            <div style={{ fontSize:11, color:"#3b82f6" }}>Suite {b.room_number}</div>
                          </div>
                        </div>
                        {b.is_vip && <span style={{ fontSize:9, color:"#f59e0b", fontWeight:800, background:"rgba(245,158,11,0.1)", padding:"2px 8px", borderRadius:20, border:"1px solid rgba(245,158,11,0.2)" }}>VIP</span>}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#475569" }}>
                        <span>{b.check_in_date} → {b.check_out_date}</span>
                        <span style={{ color:"#10b981", fontWeight:700 }}>₵{Number(b.total_amount||0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

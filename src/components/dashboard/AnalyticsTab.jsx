import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const ORDER_COLORS = { pending:"#f59e0b", accepted:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", delivered:"#10b981", completed:"#475569" };
const ORDER_LABELS = { pending:"Pending", accepted:"Accepted", preparing:"Preparing", ready:"Ready", delivered:"Delivered", completed:"Completed" };
const tooltipStyle = { background:"rgba(2,6,23,0.95)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:12, color:"white", fontSize:12, backdropFilter:"blur(10px)" };

const StatusBadge = ({ status }) => (
  <span style={{ padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:800, background:ORDER_COLORS[status]+"22", border:`1px solid ${ORDER_COLORS[status]}55`, color:ORDER_COLORS[status] }}>{ORDER_LABELS[status]||status}</span>
);

export default function AnalyticsTab({
  isMobile, occupancyRate, vipCount, activeOrders, totalRevenue,
  bookings, orders, rooms, filteredBookings, guestFilter, setGuestFilter,
  setSelectedGuest, setConfirmDialog, handleCheckOut, lineData, donutData, S,
}) {
  const statusCounts = {
    VACANT: rooms.filter(r=>r.status==="VACANT").length,
    OCCUPIED: rooms.filter(r=>r.status==="OCCUPIED").length,
    CLEANING: rooms.filter(r=>r.status==="CLEANING").length,
    MAINTENANCE: rooms.filter(r=>r.status==="MAINTENANCE").length,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: isMobile?16:24 }}>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(4,1fr)", gap: isMobile?12:16 }}>
        {[
          { label:"Occupancy", value:`${occupancyRate}%`, sub:`${statusCounts.OCCUPIED} of ${rooms.length} suites`, color:"#10b981", icon:"🏨" },
          { label:"Active Orders", value:activeOrders.length, sub:"currently in kitchen", color:"#f59e0b", icon:"🍽" },
          { label:"VIP Guests", value:vipCount, sub:"elite members", color:"#f59e0b", icon:"✦" },
          { label:"Revenue", value:`₵${totalRevenue.toLocaleString()}`, sub:"paid this period", color:"#3b82f6", icon:"₵" },
        ].map(card => (
          <div key={card.label} style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, padding: isMobile?"16px":"20px 24px", border:"1px solid rgba(59,130,246,0.08)", backdropFilter:"blur(20px)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, color:"#475569", fontWeight:700, letterSpacing:1, marginBottom:8 }}>{card.label.toUpperCase()}</div>
                <div style={{ fontSize: isMobile?24:32, fontWeight:800, color:card.color, lineHeight:1 }}>{card.value}</div>
                {!isMobile && <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>{card.sub}</div>}
              </div>
              <div style={{ fontSize:20, opacity:0.4 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Guest manifest */}
      <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", overflow:"hidden" }}>
        <div style={{ padding: isMobile?"16px":"20px 24px", borderBottom:"1px solid rgba(59,130,246,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Active Guests</div>
            <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{filteredBookings.length} guests in residence</div>
          </div>
          <input
            type="text" value={guestFilter} onChange={e=>setGuestFilter(e.target.value)}
            placeholder="Search guests..."
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit", width: isMobile?"100%":200 }}
          />
        </div>
        <div style={{ overflowX:"auto" }}>
          {filteredBookings.length === 0 ? (
            <div style={{ padding:"40px", textAlign:"center", color:"#334155", fontSize:14 }}>No active guests</div>
          ) : filteredBookings.map(b => {
            const guestOrders = orders.filter(o=>o.room_number?.toString()===b.room_number?.toString()&&!["completed","cancelled"].includes(o.status));
            return (
              <div key={b.id} onClick={()=>setSelectedGuest(b)}
                style={{ display:"flex", alignItems:"center", padding: isMobile?"12px 16px":"14px 24px", borderBottom:"1px solid rgba(59,130,246,0.04)", cursor:"pointer", transition:"background 0.2s", gap:12 }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {/* Avatar */}
                <div style={{ width:36, height:36, borderRadius:10, background:"rgba(59,130,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#3b82f6", flexShrink:0 }}>
                  {b.guest_name?.charAt(0)||"G"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:b.is_vip?"#f59e0b":"#fff" }}>{b.guest_name}</span>
                    {b.is_vip && <span style={{ background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)", padding:"1px 8px", borderRadius:20, fontSize:9, fontWeight:800 }}>VIP</span>}
                  </div>
                  <div style={{ fontSize:12, color:"#475569" }}>Suite {b.room_number} · {guestOrders.length>0?<span style={{ color:"#f59e0b" }}>{guestOrders.length} active orders</span>:"No active orders"}</div>
                </div>
                <button
                  onClick={e=>{e.stopPropagation();setConfirmDialog({title:"Authorize Check-Out",message:`Check-out ${b.guest_name} from Suite ${b.room_number}?`,onConfirm:()=>handleCheckOut(b.id,b.room_number)});}}
                  style={{ padding:"7px 14px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  Check Out
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts — hidden on mobile, shown on desktop */}
      {!isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 0.7fr", gap:16 }}>
          <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"20px 24px" }}>
            <div style={{ fontSize:12, color:"#475569", fontWeight:700, letterSpacing:1, marginBottom:20 }}>BOOKINGS & ORDERS — 7 DAYS</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={lineData}>
                <XAxis dataKey="day" tick={{fill:"#334155",fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#334155",fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} dot={{fill:"#3b82f6",r:3}} name="Bookings" />
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={{fill:"#f59e0b",r:3}} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"20px 24px" }}>
            <div style={{ fontSize:12, color:"#475569", fontWeight:700, letterSpacing:1, marginBottom:20 }}>ORDER STATUS BREAKDOWN</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={Object.entries(ORDER_LABELS).map(([k,v])=>({name:v,count:orders.filter(o=>o.status===k).length}))} barSize={20}>
                <XAxis dataKey="name" tick={{fill:"#334155",fontSize:9}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#334155",fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"20px 24px" }}>
            <div style={{ fontSize:12, color:"#475569", fontWeight:700, letterSpacing:1, marginBottom:16 }}>SUITE ALLOCATION</div>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={56} dataKey="value" strokeWidth={0} paddingAngle={4}>
                  {donutData.map((entry,i)=><Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10 }}>
              {donutData.map((d,i)=><div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#475569", fontWeight:700 }}><div style={{ width:6, height:6, borderRadius:"50%", background:d.color }} />{d.name} <span style={{ color:"#fff" }}>{d.value}</span></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

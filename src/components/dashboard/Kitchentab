import React from "react";

const ORDER_COLORS = { pending:"#f59e0b", accepted:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", delivered:"#10b981", completed:"#475569" };
const ORDER_LABELS = { pending:"Pending", accepted:"Accepted", preparing:"Preparing", ready:"Ready", delivered:"Delivered", completed:"Completed" };
const ORDER_STATUS = ["pending","accepted","preparing","ready","delivered","completed"];

const nextStatus = (current) => {
  const idx = ORDER_STATUS.indexOf(current);
  return idx < ORDER_STATUS.length - 1 ? ORDER_STATUS[idx+1] : null;
};

export default function KitchenTab({ isMobile, orders, activeOrders, kitchenFilter, setKitchenFilter, updateOrderStatus, isAdmin, S }) {
  const displayedOrders = orders.filter(o => {
    if (kitchenFilter === "active") return !["completed","cancelled"].includes(o.status);
    if (kitchenFilter === "completed") return o.status === "completed";
    return true;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Kitchen</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>{activeOrders.length} active · {orders.filter(o=>o.status==="completed").length} completed</div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["all","All"],["active","Active"],["completed","Done"]].map(([k,l])=>(
            <button key={k} onClick={()=>setKitchenFilter(k)} style={{ padding:"7px 16px", borderRadius:20, border:`1px solid ${kitchenFilter===k?"#3b82f6":"rgba(51,65,85,0.4)"}`, background:kitchenFilter===k?"rgba(59,130,246,0.15)":"transparent", color:kitchenFilter===k?"#3b82f6":"#475569", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Active orders board */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(4,1fr)", gap:12 }}>
        {["pending","accepted","preparing","ready"].map(stage => {
          const stageOrders = displayedOrders.filter(o=>o.status===stage);
          return (
            <div key={stage}>
              {/* Stage header */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, padding:"0 4px" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:ORDER_COLORS[stage] }} />
                <span style={{ fontSize:11, fontWeight:800, color:ORDER_COLORS[stage], letterSpacing:1 }}>{ORDER_LABELS[stage].toUpperCase()}</span>
                <span style={{ fontSize:11, color:"#334155", marginLeft:"auto", background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:20 }}>{stageOrders.length}</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {stageOrders.map(order => (
                  <div key={order.id} style={{ background:"rgba(15,23,42,0.8)", border:`1px solid ${ORDER_COLORS[order.status]}22`, borderRadius:16, padding:16, backdropFilter:"blur(10px)" }}>
                    {/* Order header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:10, color:"#334155", fontWeight:700, marginBottom:2 }}>ORDER #{order.id}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Suite {order.room_number}</div>
                        <div style={{ fontSize:12, color:"#475569", marginTop:1 }}>{order.guest_name}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        {isAdmin && <div style={{ fontSize:15, fontWeight:800, color:"#10b981" }}>₵{order.total_amount?.toFixed(2)}</div>}
                        <div style={{ fontSize:10, color:"#334155", marginTop:2 }}>{new Date(order.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.04)", paddingTop:10, marginBottom:12 }}>
                      {(Array.isArray(order.items)?order.items:JSON.parse(order.items||"[]")).map((item,i)=>(
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:3 }}>
                          <span>{item.qty}× {item.name}</span>
                          {isAdmin && <span style={{ color:"#334155" }}>₵{(item.price*item.qty).toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Action button */}
                    {order.status==="pending" && (
                      <button onClick={()=>updateOrderStatus(order.id,"accepted",order.room_number)} style={{ width:"100%", padding:"9px", borderRadius:10, background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.3)", color:"#3b82f6", fontSize:11, fontWeight:800, cursor:"pointer" }}>✓ Accept Order</button>
                    )}
                    {order.status==="accepted" && (
                      <button onClick={()=>updateOrderStatus(order.id,"preparing",order.room_number)} style={{ width:"100%", padding:"9px", borderRadius:10, background:"rgba(139,92,246,0.12)", border:"1px solid rgba(139,92,246,0.3)", color:"#8b5cf6", fontSize:11, fontWeight:800, cursor:"pointer" }}>→ Start Preparing</button>
                    )}
                    {order.status==="preparing" && (
                      <button onClick={()=>updateOrderStatus(order.id,"ready",order.room_number)} style={{ width:"100%", padding:"9px", borderRadius:10, background:"rgba(6,182,212,0.12)", border:"1px solid rgba(6,182,212,0.3)", color:"#06b6d4", fontSize:11, fontWeight:800, cursor:"pointer" }}>→ Mark Ready</button>
                    )}
                    {order.status==="ready" && (
                      <button onClick={()=>updateOrderStatus(order.id,"delivered",order.room_number)} style={{ width:"100%", padding:"9px", borderRadius:10, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", fontSize:11, fontWeight:800, cursor:"pointer" }}>✓ Mark Delivered</button>
                    )}
                  </div>
                ))}
                {!stageOrders.length && (
                  <div style={{ textAlign:"center", padding:"24px 16px", color:"#1e293b", fontSize:13, border:"1px dashed rgba(51,65,85,0.2)", borderRadius:16 }}>
                    No {ORDER_LABELS[stage].toLowerCase()} orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed orders */}
      <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(59,130,246,0.06)" }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>Delivered & Completed</div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth: isMobile?400:"auto" }}>
            <thead>
              <tr style={{ fontSize:10, color:"#334155", borderBottom:"1px solid rgba(59,130,246,0.06)" }}>
                {["ORDER","SUITE","GUEST","STATUS","TIME"].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:700, letterSpacing:1 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.filter(o=>["delivered","completed"].includes(o.status)).map(o=>(
                <tr key={o.id} style={{ borderBottom:"1px solid rgba(59,130,246,0.04)", fontSize:13 }}>
                  <td style={{ padding:"12px 16px", fontWeight:800, color:"#fff" }}>#{o.id}</td>
                  <td style={{ padding:"12px 16px", color:"#3b82f6", fontWeight:700 }}>Suite {o.room_number}</td>
                  <td style={{ padding:"12px 16px", color:"#475569" }}>{o.guest_name}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:800, background:ORDER_COLORS[o.status]+"22", border:`1px solid ${ORDER_COLORS[o.status]}55`, color:ORDER_COLORS[o.status] }}>{ORDER_LABELS[o.status]}</span>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#334155", fontSize:11 }}>{new Date(o.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</td>
                </tr>
              ))}
              {!orders.filter(o=>["delivered","completed"].includes(o.status)).length && (
                <tr><td colSpan="5" style={{ padding:"30px", textAlign:"center", color:"#334155" }}>No completed orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

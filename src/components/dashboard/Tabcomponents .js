// ─────────────────────────────────────────────────────────────
//  ChatsTab.jsx
// ─────────────────────────────────────────────────────────────
import React from "react";

export function ChatsTab({ isMobile, chats, activeChatRoom, setActiveChatRoom, chatReplyInput, setChatReplyInput, sendChatReply, closeChatThread }) {
  const openChatRooms = [...new Set(chats.map(c => c.room_number))];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Guest Chats</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>{openChatRooms.length} active threads</div>
      </div>

      {openChatRooms.length === 0 ? (
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>💬</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>All clear</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:4 }}>No active guest chats</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"300px 1fr", gap:16, minHeight:500 }}>
          {/* Thread list */}
          <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:12, overflowY:"auto", maxHeight:600 }}>
            {openChatRooms.map(room => {
              const msgs = chats.filter(c => c.room_number === room);
              const last = msgs[msgs.length-1];
              const gName = msgs.find(m => m.guest_name)?.guest_name || "Guest";
              const isActive = activeChatRoom === room;
              const hasUnread = last?.sender === "guest";
              return (
                <div key={room} onClick={() => setActiveChatRoom(room)}
                  style={{ padding:14, marginBottom:6, borderRadius:14, cursor:"pointer", background:isActive?"rgba(59,130,246,0.12)":"rgba(255,255,255,0.02)", border:`1px solid ${isActive?"rgba(59,130,246,0.3)":"rgba(59,130,246,0.05)"}`, transition:"all 0.2s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"rgba(59,130,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#3b82f6" }}>{gName.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{gName}</div>
                        <div style={{ fontSize:10, color:"#3b82f6", fontWeight:700 }}>Suite {room}</div>
                      </div>
                    </div>
                    {hasUnread && <div style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b", flexShrink:0 }} />}
                  </div>
                  <div style={{ fontSize:11, color:"#334155", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {last?.sender==="staff"?"You: ":""}{last?.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation */}
          <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", display:"flex", flexDirection:"column", maxHeight:600 }}>
            {!activeChatRoom ? (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#334155", fontSize:13 }}>Select a conversation</div>
            ) : (
              <>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(59,130,246,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>{chats.find(c=>c.room_number===activeChatRoom&&c.guest_name)?.guest_name||"Guest"}</div>
                    <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700 }}>Suite {activeChatRoom}</div>
                  </div>
                  <button onClick={() => closeChatThread(activeChatRoom)} style={{ padding:"6px 14px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", color:"#ef4444", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Close Thread</button>
                </div>
                <div style={{ flex:1, padding:14, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
                  {chats.filter(c=>c.room_number===activeChatRoom).map(m=>(
                    <div key={m.id} style={{ display:"flex", justifyContent:m.sender==="staff"?"flex-end":"flex-start" }}>
                      <div style={{ maxWidth:"75%", padding:"10px 14px", fontSize:13, lineHeight:1.5, borderRadius:m.sender==="staff"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.sender==="staff"?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${m.sender==="staff"?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.06)"}` }}>
                        <div style={{ fontSize:9, fontWeight:700, marginBottom:3, color:m.sender==="staff"?"#3b82f6":"#475569", letterSpacing:1, textTransform:"uppercase" }}>{m.sender==="staff"?"You · Staff":m.guest_name||"Guest"}</div>
                        {m.message}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:12, borderTop:"1px solid rgba(59,130,246,0.06)", display:"flex", gap:10 }}>
                  <input value={chatReplyInput} onChange={e=>setChatReplyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChatReply()} placeholder="Type your reply..." style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none" }} />
                  <button onClick={sendChatReply} style={{ padding:"10px 18px", borderRadius:10, background:"#3b82f6", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CallsTab.jsx
// ─────────────────────────────────────────────────────────────
export function CallsTab({ isMobile, callRequests, markCallResolved }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Call Requests</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>{callRequests.length} pending callbacks</div>
      </div>
      {callRequests.length === 0 ? (
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>📞</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>No call requests</div>
        </div>
      ) : callRequests.map(req => (
        <div key={req.id} style={{ background:"rgba(15,23,42,0.6)", borderRadius:16, border:"1px solid rgba(245,158,11,0.1)", padding:isMobile?16:20, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(245,158,11,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📞</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{req.guest_name}</div>
                <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700 }}>Suite {req.room_number}</div>
              </div>
            </div>
            <div style={{ fontSize:13, color:"#94a3b8", marginBottom:8 }}>{req.reason||"Guest requested a callback"}</div>
            {req.phone && <a href={`tel:${req.phone.replace(/\s/g,"")}`} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10, background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.15)", color:"#3b82f6", fontSize:12, fontWeight:700, textDecoration:"none" }}>📞 {req.phone}</a>}
          </div>
          <button onClick={() => markCallResolved(req.id, req.room_number)} style={{ padding:"10px 20px", borderRadius:12, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", color:"#10b981", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>✓ Mark Called</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  RequestsTab.jsx
// ─────────────────────────────────────────────────────────────
export function RequestsTab({ isMobile, serviceRequests, handleResolveRequest }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Service Requests</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>{serviceRequests.length} pending requests</div>
      </div>
      {serviceRequests.length === 0 ? (
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>✓</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>All clear</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:4 }}>No pending requests</div>
        </div>
      ) : serviceRequests.map(req => (
        <div key={req.id} style={{ background:"rgba(15,23,42,0.6)", borderRadius:16, border:"1px solid rgba(245,158,11,0.08)", padding:isMobile?16:20, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, fontSize:11, fontWeight:700, padding:"3px 10px" }}>Suite {req.room_number||"—"}</span>
              {req.request_type && <span style={{ fontSize:11, color:"#475569", fontWeight:600 }}>{req.request_type}</span>}
              <span style={{ fontSize:10, color:"#334155", marginLeft:"auto" }}>{req.created_at?new Date(req.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):""}</span>
            </div>
            <div style={{ fontSize:13, color:"#94a3b8" }}>{req.notes||req.description||"No details provided."}</div>
          </div>
          <button onClick={() => handleResolveRequest(req.id)} style={{ padding:"10px 20px", borderRadius:12, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", color:"#10b981", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>Resolve ✓</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ReportsTab.jsx
// ─────────────────────────────────────────────────────────────
export function ReportsTab({ isMobile, reportDate, setReportDate, reportData, reportLoading, generateReport, copyReport }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Daily Report</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>Auto-generated from live data</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"8px 12px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none" }} />
          <button onClick={() => generateReport(reportDate)} style={{ padding:"9px 18px", borderRadius:10, background:"#3b82f6", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Generate</button>
          {reportData && <button onClick={copyReport} style={{ padding:"9px 18px", borderRadius:10, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", color:"#10b981", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>📋 Copy</button>}
        </div>
      </div>

      {reportLoading && <div style={{ textAlign:"center", padding:"40px", color:"#475569" }}>Generating report...</div>}
      {!reportLoading && !reportData && (
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>📊</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>Pick a date and click Generate</div>
        </div>
      )}

      {!reportLoading && reportData && (
        <>
          <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(3,1fr)", gap:isMobile?10:14 }}>
            {[
              { label:"Occupancy", val:`${reportData.occupied}/${reportData.totalRooms} (${reportData.occupancyPct}%)`, color:"#3b82f6" },
              { label:"Check-ins", val:reportData.checkIns.length, color:"#10b981" },
              { label:"Check-outs", val:reportData.checkOuts.length, color:"#94a3b8" },
              { label:"Orders", val:reportData.orders.length, color:"#f59e0b" },
              { label:"F&B Revenue", val:`₵${reportData.orderRevenue.toLocaleString()}`, color:"#10b981" },
              { label:"Booking Revenue", val:`₵${reportData.bookingRevenue.toLocaleString()}`, color:"#10b981" },
              { label:"Requests Pending", val:reportData.requestsPending, color:"#ef4444" },
              { label:"Requests Resolved", val:reportData.requestsResolved, color:"#10b981" },
              { label:"Guest Chats", val:reportData.chats.length, color:"#3b82f6" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(15,23,42,0.6)", border:"1px solid rgba(59,130,246,0.06)", borderRadius:16, padding:isMobile?12:16, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1, marginBottom:6 }}>{s.label.toUpperCase()}</div>
                <div style={{ fontSize: isMobile?18:24, fontWeight:800, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {reportData.checkIns.length > 0 && (
            <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:16, border:"1px solid rgba(59,130,246,0.08)", padding:16 }}>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, letterSpacing:1.5, marginBottom:12 }}>TODAY'S CHECK-INS</div>
              {reportData.checkIns.map(b => (
                <div key={b.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(59,130,246,0.04)", fontSize:13, flexWrap:"wrap", gap:8 }}>
                  <span style={{ color:"#fff", fontWeight:600 }}>{b.guest_name}</span>
                  <span style={{ color:"#3b82f6" }}>Suite {b.room_number}</span>
                  <span style={{ color:"#10b981", fontWeight:700 }}>₵{Number(b.total_amount||0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  BillingTab.jsx
// ─────────────────────────────────────────────────────────────
export function BillingTab({ isMobile, orders, totalRevenue, statusCounts, bookings, ledgerRoom, setLedgerRoom, ledgerData, ledgerLoading, fetchLedger, handleSettleLedger, setConfirmDialog }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Guest Billing</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>View balances and process payments</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Total Unpaid", value:`₵${orders.filter(o=>o.payment_status==="unpaid"&&["delivered","completed"].includes(o.status)).reduce((s,o)=>s+(o.total_amount||0),0).toFixed(2)}`, color:"#ef4444" },
          { label:"Total Paid", value:`₵${totalRevenue.toFixed(2)}`, color:"#10b981" },
          { label:"Active Suites", value:statusCounts.OCCUPIED, color:"#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(15,23,42,0.6)", borderRadius:16, border:"1px solid rgba(59,130,246,0.06)", padding: isMobile?16:20 }}>
            <div style={{ fontSize:11, color:"#334155", fontWeight:700, letterSpacing:1 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: isMobile?24:30, fontWeight:800, color:s.color, marginTop:8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?16:20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:16 }}>Room Ledger Lookup</div>
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <input value={ledgerRoom} onChange={e=>setLedgerRoom(e.target.value)} placeholder="Enter suite number..." style={{ flex:1, minWidth:160, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none" }} />
          <button onClick={()=>fetchLedger(ledgerRoom)} style={{ padding:"10px 18px", borderRadius:10, background:"#3b82f6", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Fetch</button>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          {bookings.map(b => (
            <button key={b.id} onClick={()=>{setLedgerRoom(b.room_number?.toString());fetchLedger(b.room_number?.toString());}} style={{ padding:"6px 14px", borderRadius:10, border:"1px solid rgba(59,130,246,0.2)", background:"rgba(59,130,246,0.06)", color:"#3b82f6", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Suite {b.room_number} — {b.guest_name}</button>
          ))}
        </div>
        {ledgerLoading && <div style={{ textAlign:"center", padding:20, color:"#334155" }}>Loading...</div>}
        {!ledgerLoading && ledgerData.length > 0 && (
          <>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:16, minWidth:400 }}>
                <thead><tr style={{ fontSize:10, color:"#334155", borderBottom:"1px solid rgba(59,130,246,0.06)" }}>{["Description","Order #","Amount","Status","Date"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700 }}>{h}</th>)}</tr></thead>
                <tbody>{ledgerData.map(e=><tr key={e.id} style={{ borderBottom:"1px solid rgba(59,130,246,0.04)", fontSize:13 }}><td style={{ padding:"12px 12px", color:"#94a3b8" }}>{e.description}</td><td style={{ padding:"12px 12px", color:"#3b82f6" }}>{e.order_id?`#${e.order_id}`:"—"}</td><td style={{ padding:"12px 12px", color:"#10b981", fontWeight:700 }}>₵{e.amount?.toFixed(2)}</td><td style={{ padding:"12px 12px" }}><span style={{ fontSize:10, fontWeight:800, color:e.status==="paid"?"#10b981":"#f59e0b" }}>{e.status==="paid"?"✓ PAID":"PENDING"}</span></td><td style={{ padding:"12px 12px", color:"#334155", fontSize:11 }}>{new Date(e.created_at).toLocaleDateString()}</td></tr>)}</tbody>
              </table>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"rgba(16,185,129,0.05)", borderRadius:14, border:"1px solid rgba(16,185,129,0.1)", flexWrap:"wrap", gap:12 }}>
              <div><div style={{ fontSize:12, color:"#334155", fontWeight:700 }}>TOTAL — Suite {ledgerRoom}</div><div style={{ fontSize:26, fontWeight:800, color:"#fff" }}>₵{ledgerData.reduce((s,e)=>s+e.amount,0).toFixed(2)}</div></div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{["cash","card","room_charge"].map(m=><button key={m} onClick={()=>setConfirmDialog({title:"Settle Bill",message:`Mark Suite ${ledgerRoom} as paid via ${m}?`,onConfirm:()=>handleSettleLedger(ledgerRoom,m)})} style={{ padding:"9px 16px", borderRadius:10, border:"1px solid rgba(16,185,129,0.2)", background:"rgba(16,185,129,0.06)", color:"#10b981", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{m==="room_charge"?"Room Charge":m.charAt(0).toUpperCase()+m.slice(1)}</button>)}</div>
            </div>
          </>
        )}
        {!ledgerLoading && ledgerData.length === 0 && ledgerRoom && <div style={{ textAlign:"center", padding:24, color:"#334155" }}>No outstanding charges for Suite {ledgerRoom}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  RoomsTab.jsx
// ─────────────────────────────────────────────────────────────
export function RoomsTab({ isMobile, rooms, roomSearch, setRoomSearch, bookings, updateRoomStatus, startCleaning }) {
  const searchResult = rooms.find(r => r.id === roomSearch);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Suite Status</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>Search or tap a suite to manage it</div>
      </div>
      <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?16:24 }}>
        <input type="text" value={roomSearch} placeholder="Enter suite number (e.g. 101)" style={{ width:"100%", padding:"14px 18px", borderRadius:14, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.2)", color:"#fff", fontSize: isMobile?16:18, fontWeight:700, outline:"none", boxSizing:"border-box", fontFamily:"inherit", marginBottom:16 }} onChange={e=>setRoomSearch(e.target.value)} />
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {rooms.map(r=>(
            <button key={r.id} onClick={()=>setRoomSearch(r.id)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:r.color+"12", border:`1px solid ${r.color}30`, color:r.color, fontSize:12, fontWeight:700, fontFamily:"inherit" }}>Suite {r.id}</button>
          ))}
        </div>
      </div>
      {searchResult && (
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:`1px solid ${searchResult.color}20`, padding: isMobile?16:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
            <div style={{ fontSize: isMobile?48:64, fontWeight:800, color:searchResult.color, lineHeight:1 }}>{searchResult.id}</div>
            <div>
              <div style={{ fontSize:11, color:"#475569", fontWeight:700, letterSpacing:1, marginBottom:4 }}>CURRENT STATUS</div>
              <div style={{ padding:"5px 14px", background:searchResult.color+"18", border:`1px solid ${searchResult.color}40`, color:searchResult.color, borderRadius:20, fontSize:12, fontWeight:800, display:"inline-block" }}>{searchResult.status}</div>
            </div>
          </div>
          {searchResult.status==="OCCUPIED" && (() => {
            const guest = bookings.find(b=>b.room_number?.toString()===searchResult.id);
            return guest ? <div style={{ padding:"10px 14px", borderRadius:12, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", fontSize:13, color:"#10b981", fontWeight:600, marginBottom:16 }}>👤 {guest.guest_name}{guest.is_vip?" · VIP":""}</div> : null;
          })()}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["Mark Vacant","VACANT","#3b82f6"],["Mark Occupied","OCCUPIED","#10b981"],["Cleaning Required","CLEANING","#f59e0b"],["Maintenance","MAINTENANCE","#ef4444"]].map(([label,status,color])=>(
              <button key={status} onClick={()=>updateRoomStatus(searchResult.id,status)} disabled={searchResult.status===status} style={{ padding:14, background:`${color}${searchResult.status===status?"18":"0a"}`, border:`1px solid ${searchResult.status===status?color+"50":color+"20"}`, borderRadius:14, color:searchResult.status===status?color:"#475569", cursor:searchResult.status===status?"default":"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit" }}>{searchResult.status===status?`✓ ${label}`:label}</button>
            ))}
          </div>
          {searchResult.status==="CLEANING" && <button onClick={()=>startCleaning(searchResult.id)} style={{ marginTop:12, width:"100%", padding:14, borderRadius:14, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", color:"#f59e0b", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>🧹 Open Cleaning Checklist</button>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  CatalogTab.jsx
// ─────────────────────────────────────────────────────────────
export function CatalogTab({ isMobile, menuItems, menuForm, setMenuForm, editingMenu, setEditingMenu, menuUploading, menuImageFile, setMenuImageFile, handleMenuSave, handleMenuEdit, handleMenuToggle }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Menu Catalog</div>
        <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>Items appear live on the guest ordering page</div>
      </div>

      <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?16:20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:16 }}>{editingMenu?"✏ Edit Item":"+ Add New Item"}</div>
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:14 }}>
          <div><label style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1.5, display:"block", marginBottom:6 }}>ITEM NAME *</label><input value={menuForm.name} onChange={e=>setMenuForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Grilled Wagyu Beef" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} /></div>
          <div><label style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1.5, display:"block", marginBottom:6 }}>PRICE (₵) *</label><input type="number" value={menuForm.price} onChange={e=>setMenuForm(f=>({...f,price:e.target.value}))} placeholder="0.00" style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} /></div>
          <div><label style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1.5, display:"block", marginBottom:6 }}>CATEGORY</label><select value={menuForm.category} onChange={e=>setMenuForm(f=>({...f,category:e.target.value}))} style={{ width:"100%", background:"rgba(15,23,42,0.9)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none" }}>{["Starter","Main","Dessert","Drinks","Special"].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1.5, display:"block", marginBottom:6 }}>IMAGE URL</label><input value={menuForm.image_url} onChange={e=>setMenuForm(f=>({...f,image_url:e.target.value}))} placeholder="https://..." style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1.5, display:"block", marginBottom:6 }}>DESCRIPTION</label><textarea value={menuForm.description} onChange={e=>setMenuForm(f=>({...f,description:e.target.value}))} rows={2} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }} /></div>
          <div><label style={{ fontSize:10, color:"#334155", fontWeight:700, letterSpacing:1.5, display:"block", marginBottom:6 }}>UPLOAD IMAGE</label><input type="file" accept="image/*" onChange={e=>setMenuImageFile(e.target.files[0])} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", cursor:"pointer", boxSizing:"border-box" }} />{menuImageFile&&<div style={{ fontSize:11, color:"#10b981", marginTop:6 }}>✓ {menuImageFile.name}</div>}</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div onClick={()=>setMenuForm(f=>({...f,is_available:!f.is_available}))} style={{ width:48, height:26, borderRadius:13, background:menuForm.is_available?"#10b981":"rgba(51,65,85,0.5)", cursor:"pointer", position:"relative", transition:"all 0.3s" }}><div style={{ position:"absolute", top:3, left:menuForm.is_available?27:3, width:18, height:18, borderRadius:"50%", background:"white", transition:"all 0.3s" }} /></div>
            <span style={{ fontSize:12, color:menuForm.is_available?"#10b981":"#475569", fontWeight:700 }}>{menuForm.is_available?"Active on menu":"Hidden"}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={handleMenuSave} disabled={menuUploading} style={{ padding:"11px 22px", background:"#3b82f6", border:"none", borderRadius:12, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", opacity:menuUploading?0.6:1, fontFamily:"inherit" }}>{menuUploading?"Uploading...":editingMenu?"Save Changes":"Add to Menu"}</button>
          {editingMenu && <button onClick={()=>{setEditingMenu(null);setMenuForm({name:"",description:"",price:"",category:"Main",image_url:"",is_available:true});setMenuImageFile(null);}} style={{ padding:"11px 22px", background:"transparent", border:"1px solid rgba(51,65,85,0.4)", borderRadius:12, color:"#475569", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>}
        </div>
      </div>

      {["Starter","Main","Dessert","Drinks","Special"].map(cat => {
        const items = menuItems.filter(m=>m.category===cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?16:20 }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:14 }}>{cat} <span style={{ fontSize:12, color:"#334155", fontWeight:500 }}>({items.length})</span></div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
              {items.map(item=>(
                <div key={item.id} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${item.is_available?"rgba(59,130,246,0.08)":"rgba(239,68,68,0.1)"}`, borderRadius:14, overflow:"hidden" }}>
                  {item.image_url&&<img src={item.image_url} alt={item.name} style={{ width:"100%", height:120, objectFit:"cover" }} onError={e=>e.target.style.display="none"} />}
                  <div style={{ padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{item.name}</div>
                      <div style={{ fontSize:16, fontWeight:800, color:"#10b981", marginLeft:8 }}>₵{item.price}</div>
                    </div>
                    <div style={{ fontSize:11, color:"#334155", marginBottom:10 }}>{item.description}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:9, fontWeight:800, color:item.is_available?"#10b981":"#ef4444", padding:"2px 8px", borderRadius:20, background:item.is_available?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)" }}>{item.is_available?"ACTIVE":"HIDDEN"}</span>
                      <button onClick={()=>handleMenuEdit(item)} style={{ padding:"4px 12px", borderRadius:8, background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.15)", color:"#3b82f6", fontSize:11, fontWeight:700, cursor:"pointer", marginLeft:"auto", fontFamily:"inherit" }}>Edit</button>
                      <button onClick={()=>handleMenuToggle(item.id,item.is_available)} style={{ padding:"4px 12px", borderRadius:8, background:"transparent", border:"1px solid rgba(51,65,85,0.3)", color:"#475569", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{item.is_available?"Hide":"Show"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

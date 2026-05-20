import React from "react";

export default function HousekeepingTab({
  isMobile, rooms, hkTasks, shiftNotes,
  newNote, setNewNote, savingNote, saveShiftNote,
  startCleaning,
}) {
  const cleaningRooms = rooms.filter(r => r.status === "CLEANING");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#fff" }}>Housekeeping</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:2 }}>{cleaningRooms.length} rooms need attention</div>
        </div>
        <div style={{ padding:"7px 16px", borderRadius:20, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", color:"#f59e0b", fontSize:11, fontWeight:800 }}>
          {cleaningRooms.length} CLEANING
        </div>
      </div>

      {/* Cleaning rooms */}
      {cleaningRooms.length === 0 ? (
        <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>✨</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>All rooms clean</div>
          <div style={{ fontSize:13, color:"#475569", marginTop:4 }}>Great work team!</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(3,1fr)", gap:12 }}>
          {cleaningRooms.map(r => {
            const roomNum = r.room_number || r.id;
            const tasks = hkTasks[roomNum] || [];
            const done = tasks.filter(t => t.completed).length;
            const total = tasks.length;
            const pct = total > 0 ? Math.round((done/total)*100) : 0;
            return (
              <div key={roomNum} style={{ background:"rgba(15,23,42,0.6)", border:"1px solid rgba(245,158,11,0.12)", borderRadius:20, padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700, letterSpacing:1, marginBottom:3 }}>SUITE {roomNum}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>Cleaning in Progress</div>
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, color:pct===100?"#10b981":"#f59e0b" }}>{pct}%</div>
                </div>
                {total > 0 && (
                  <>
                    <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:10 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#10b981":"#f59e0b", borderRadius:2, transition:"width 0.4s" }} />
                    </div>
                    <div style={{ fontSize:12, color:"#475569", marginBottom:14 }}>{done} of {total} tasks done</div>
                  </>
                )}
                <button onClick={() => startCleaning(roomNum)} style={{ width:"100%", padding:"10px", borderRadius:12, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", color:"#f59e0b", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  🧹 {total===0?"Start Cleaning":"View Checklist"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Shift handover notes */}
      <div style={{ background:"rgba(15,23,42,0.6)", borderRadius:20, border:"1px solid rgba(59,130,246,0.08)", padding: isMobile?16:20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:4 }}>Shift Handover</div>
        <div style={{ fontSize:13, color:"#475569", marginBottom:16 }}>Leave notes for the next shift</div>
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <input
            value={newNote} onChange={e=>setNewNote(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&saveShiftNote()}
            placeholder="e.g. Suite 5 wants late checkout..."
            style={{ flex:1, minWidth:200, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none" }}
          />
          <button onClick={saveShiftNote} disabled={savingNote} style={{ padding:"10px 20px", borderRadius:10, background:"#3b82f6", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:savingNote?0.6:1 }}>
            {savingNote?"Saving...":"Save Note"}
          </button>
        </div>
        {shiftNotes.length === 0 ? (
          <div style={{ fontSize:13, color:"#334155", textAlign:"center", padding:"16px 0" }}>No handover notes yet</div>
        ) : shiftNotes.map(n => (
          <div key={n.id} style={{ padding:"12px 14px", borderRadius:12, background:"rgba(59,130,246,0.04)", border:"1px solid rgba(59,130,246,0.08)", marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:11, color:"#3b82f6", fontWeight:700 }}>{n.staff_name}</span>
              <span style={{ fontSize:10, color:"#334155" }}>{new Date(n.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · {new Date(n.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.5 }}>{n.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

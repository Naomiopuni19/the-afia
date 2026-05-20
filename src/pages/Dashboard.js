import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useDashboardStyles";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import AnalyticsTab from "../components/dashboard/AnalyticsTab";
import KitchenTab from "../components/dashboard/KitchenTab";
import ReservationsTab from "../components/dashboard/ReservationsTab";
import HousekeepingTab from "../components/dashboard/HousekeepingTab";
import {
  ChatsTab, CallsTab, RequestsTab,
  ReportsTab, BillingTab, RoomsTab, CatalogTab,
} from "../components/dashboard/TabComponents";

// ── Keyframes ────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes navBlink {
    0%,100%{opacity:1} 50%{opacity:0.4}
  }
  @keyframes badgePulse {
    0%,100%{transform:scale(1)} 50%{transform:scale(1.15)}
  }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes toastIn {
    from{opacity:0;transform:translateY(16px) scale(0.95)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes toastOut {
    from{opacity:1;transform:translateY(0)}
    to{opacity:0;transform:translateY(-8px)}
  }
`;

// ── Toast ────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position:"fixed", bottom:24, right:24, display:"flex", flexDirection:"column", gap:10, zIndex:9999 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding:"12px 20px", borderRadius:14, fontSize:13, fontWeight:700,
        backdropFilter:"blur(20px)",
        animation: t.leaving ? "toastOut 0.3s ease forwards" : "toastIn 0.3s ease forwards",
        background: t.type==="success" ? "rgba(16,185,129,0.15)" : t.type==="error" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
        border: t.type==="success" ? "1px solid rgba(16,185,129,0.3)" : t.type==="error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(59,130,246,0.3)",
        color: t.type==="success" ? "#10b981" : t.type==="error" ? "#ef4444" : "#3b82f6",
        display:"flex", alignItems:"center", gap:10,
      }}>
        {t.type==="success" ? "✓" : t.type==="error" ? "✕" : "•"} {t.message}
      </div>
    ))}
  </div>
);

// ── Confirm Dialog ───────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(2,6,23,0.85)", backdropFilter:"blur(10px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#0f172a", border:"1px solid rgba(239,68,68,0.2)", borderRadius:24, padding:36, maxWidth:380, width:"100%", boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>
        <h3 style={{ margin:"0 0 10px", fontSize:18, fontWeight:800, color:"#fff" }}>{title}</h3>
        <p style={{ color:"#475569", fontSize:14, margin:"0 0 28px", lineHeight:1.6 }}>{message}</p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:13, borderRadius:12, background:"transparent", border:"1px solid rgba(51,65,85,0.4)", color:"#475569", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:13, borderRadius:12, background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", color:"white", cursor:"pointer", fontWeight:800, fontSize:13, fontFamily:"inherit" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ── HK Checklist Modal ───────────────────────────────────────
const HkModal = ({ hkModal, setHkModal, hkTasks, HK_ITEMS, toggleTask, markRoomVacant, startCleaning }) => {
  if (!hkModal) return null;
  const tasks = hkTasks[hkModal] || [];
  const done = tasks.filter(t => t.completed).length;
  const allDone = tasks.length > 0 && done === tasks.length;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)", padding:20 }} onClick={() => setHkModal(null)}>
      <div style={{ background:"#0f172a", border:"1px solid rgba(245,158,11,0.2)", borderRadius:24, padding:28, maxWidth:460, width:"100%", position:"relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={() => setHkModal(null)} style={{ position:"absolute", top:16, right:16, width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"none", color:"#475569", cursor:"pointer", fontSize:16 }}>✕</button>
        <div style={{ fontSize:10, color:"#f59e0b", fontWeight:800, letterSpacing:2, marginBottom:4 }}>SUITE {hkModal}</div>
        <h3 style={{ fontSize:20, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>Cleaning Checklist</h3>
        <p style={{ color:"#334155", fontSize:13, marginBottom:20 }}>{done} of {tasks.length} tasks completed</p>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:20, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.round((done/tasks.length)*100)}%`, background:allDone?"#10b981":"#f59e0b", borderRadius:2, transition:"width 0.4s" }} />
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {(tasks.length > 0 ? tasks : HK_ITEMS.map((name,i) => ({ id:i, task_name:name, completed:false }))).map(task => (
            <div key={task.id} onClick={() => typeof task.id === "string" ? toggleTask(task) : null}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", borderRadius:12, background:task.completed?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${task.completed?"rgba(16,185,129,0.2)":"rgba(51,65,85,0.2)"}`, cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ width:22, height:22, borderRadius:6, background:task.completed?"#10b981":"transparent", border:`2px solid ${task.completed?"#10b981":"#334155"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {task.completed && <span style={{ color:"#fff", fontSize:12, fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ fontSize:14, color:task.completed?"#10b981":"#94a3b8", fontWeight:600, textDecoration:task.completed?"line-through":"none" }}>{task.task_name}</span>
            </div>
          ))}
        </div>

        {allDone && (
          <button onClick={() => markRoomVacant(hkModal)} style={{ width:"100%", padding:15, borderRadius:14, background:"linear-gradient(135deg,#10b981,#059669)", border:"none", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
            ✓ All Done — Mark Suite {hkModal} VACANT
          </button>
        )}
        {!allDone && tasks.length === 0 && (
          <button onClick={() => startCleaning(hkModal)} style={{ width:"100%", padding:15, borderRadius:14, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", color:"#f59e0b", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
            🧹 Start — Create Checklist
          </button>
        )}
      </div>
    </div>
  );
};

// ── Guest Slide-Over ─────────────────────────────────────────
const GuestSlideOver = ({ selectedGuest, setSelectedGuest, orders, setConfirmDialog, handleCheckOut, isMobile }) => {
  const ORDER_COLORS = { pending:"#f59e0b", accepted:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", delivered:"#10b981", completed:"#475569" };
  const ORDER_LABELS = { pending:"Pending", accepted:"Accepted", preparing:"Preparing", ready:"Ready", delivered:"Delivered", completed:"Completed" };
  if (!selectedGuest) return null;
  const guestOrders = orders.filter(o => o.room_number?.toString()===selectedGuest.room_number?.toString() && !["cancelled"].includes(o.status));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300, backdropFilter:"blur(4px)" }} onClick={() => setSelectedGuest(null)}>
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width: isMobile?"100%":420, background:"rgba(2,6,23,0.98)", borderLeft:"1px solid rgba(59,130,246,0.1)", padding: isMobile?"20px":"40px", display:"flex", flexDirection:"column", overflowY:"auto", backdropFilter:"blur(30px)" }} onClick={e => e.stopPropagation()}>
        <button onClick={() => setSelectedGuest(null)} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(51,65,85,0.3)", padding:"9px 18px", borderRadius:10, color:"#475569", cursor:"pointer", marginBottom:32, fontWeight:700, fontSize:11, width:"fit-content", fontFamily:"inherit" }}>← Close</button>

        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(59,130,246,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#3b82f6", flexShrink:0 }}>{selectedGuest.guest_name?.charAt(0)||"G"}</div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#fff" }}>{selectedGuest.guest_name}</h2>
                {selectedGuest.is_vip && <span style={{ background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)", padding:"2px 8px", borderRadius:20, fontSize:9, fontWeight:800 }}>VIP</span>}
              </div>
              <div style={{ fontSize:13, color:"#3b82f6", fontWeight:700, marginTop:2 }}>Suite {selectedGuest.room_number}</div>
            </div>
          </div>
        </div>

        <div style={{ padding:"14px 16px", borderRadius:14, background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.12)", marginBottom:20 }}>
          <div style={{ fontSize:9, color:"#334155", fontWeight:700, letterSpacing:2, marginBottom:6 }}>ACCESS TOKEN</div>
          <div style={{ fontSize:22, letterSpacing:6, color:"#10b981", fontWeight:800, fontFamily:"monospace" }}>{selectedGuest.access_token||"UNASSIGNED"}</div>
        </div>

        {guestOrders.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#334155", fontWeight:700, letterSpacing:2, marginBottom:12 }}>ACTIVE ORDERS</div>
            {guestOrders.map(o => (
              <div key={o.id} style={{ padding:"12px 14px", borderRadius:12, background:"rgba(245,158,11,0.04)", border:"1px solid rgba(245,158,11,0.1)", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:"#fff" }}>Order #{o.id}</span>
                  <span style={{ padding:"2px 10px", borderRadius:8, fontSize:10, fontWeight:800, background:ORDER_COLORS[o.status]+"22", color:ORDER_COLORS[o.status] }}>{ORDER_LABELS[o.status]||o.status}</span>
                </div>
                <div style={{ color:"#475569", fontSize:11 }}>{Array.isArray(o.items)?o.items.map(i=>`${i.qty}× ${i.name}`).join(", "):""}</div>
                <div style={{ color:"#10b981", fontWeight:800, marginTop:4, fontSize:13 }}>₵{o.total_amount?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {selectedGuest.guest_notes && (
          <div style={{ flex:1, marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#334155", fontWeight:700, letterSpacing:2, marginBottom:8 }}>NOTES</div>
            <div style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7, padding:"14px 16px", background:"rgba(255,255,255,0.02)", borderRadius:12, border:"1px solid rgba(51,65,85,0.2)" }}>{selectedGuest.guest_notes}</div>
          </div>
        )}

        <button onClick={() => setConfirmDialog({ title:"Authorize Check-Out", message:`Check-out ${selectedGuest.guest_name} from Suite ${selectedGuest.room_number}?`, onConfirm:()=>handleCheckOut(selectedGuest.id, selectedGuest.room_number) })}
          style={{ width:"100%", padding:16, background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"white", border:"none", borderRadius:16, fontWeight:800, cursor:"pointer", fontSize:14, marginTop:"auto", fontFamily:"inherit" }}>
          Authorize Check-Out
        </button>
      </div>
    </div>
  );
};

// ── ORDER CONSTANTS ──────────────────────────────────────────
const ORDER_STATUS = ["pending","accepted","preparing","ready","delivered","completed"];
const STATUS_COLORS = { VACANT:"#3b82f6", OCCUPIED:"#10b981", CLEANING:"#f59e0b", MAINTENANCE:"#ef4444" };
const HK_ITEMS = ["Linens Changed","Bathroom Cleaned","Towels Replaced","Minibar Restocked","Vacuumed","Windows Wiped","Trash Removed"];

// ── DASHBOARD ────────────────────────────────────────────────
export default function Dashboard() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // ── Auth ──
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";

  // ── UI ──
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("kitchen");
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // ── Data ──
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestCount, setServiceRequestCount] = useState(0);
  const [chats, setChats] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [hkTasks, setHkTasks] = useState({});
  const [shiftNotes, setShiftNotes] = useState([]);

  // ── Kitchen ──
  const [kitchenFilter, setKitchenFilter] = useState("all");
  const [ordersBlink, setOrdersBlink] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  // ── Alerts ──
  const [requestsBlink, setRequestsBlink] = useState(false);
  const [chatsBlink, setChatsBlink] = useState(false);
  const [callsBlink, setCallsBlink] = useState(false);

  // ── Chat ──
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatReplyInput, setChatReplyInput] = useState("");

  // ── HK ──
  const [hkModal, setHkModal] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // ── Reports ──
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ── Billing ──
  const [ledgerRoom, setLedgerRoom] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // ── Rooms ──
  const [roomSearch, setRoomSearch] = useState("");

  // ── Menu ──
  const [menuForm, setMenuForm] = useState({ name:"", description:"", price:"", category:"Main", image_url:"", is_available:true });
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuUploading, setMenuUploading] = useState(false);
  const [menuImageFile, setMenuImageFile] = useState(null);

  // ── Calendar ──
  const [calMonth, setCalMonth] = useState(new Date());
  const [calSelectedDay, setCalSelectedDay] = useState(null);

  // ── Analytics ──
  const [guestFilter, setGuestFilter] = useState("");

  // ── Toast helper ──────────────────────────────────────────
  const addToast = useCallback((message, type="info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type, leaving:false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id===id ? {...t, leaving:true} : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id!==id)), 350);
    }, 3500);
  }, []);

  // ── Role load ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role || null;
      const name = session?.user?.user_metadata?.full_name || session?.user?.email || "Operator";
      setUserRole(role);
      setUserName(name);
      setActiveTab(role === "admin" ? "analytics" : "kitchen");
    })();
  }, []);

  // ── Fetchers ──────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    const { data } = await supabase.from("rooms").select("*").order("room_number", { ascending:true });
    if (data) setRooms(data.map(r => ({ ...r, id:r.room_number.toString(), color:STATUS_COLORS[r.status]||"#3b82f6" })));
  }, []);

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase.from("bookings").select("*").eq("status","ACTIVE");
    if (data) setBookings(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending:false });
    if (data) setOrders(data);
  }, []);

  const fetchMenuItems = useCallback(async () => {
    const { data } = await supabase.from("menu_items").select("*").order("category").order("name");
    if (data) setMenuItems(data);
  }, []);

  const fetchServiceRequests = useCallback(async () => {
    const { data, count } = await supabase.from("service_requests").select("*", { count:"exact" }).eq("status","pending").order("created_at", { ascending:false });
    setServiceRequests(data || []);
    setServiceRequestCount(count || 0);
  }, []);

  const fetchChats = useCallback(async () => {
    const { data } = await supabase.from("staff_chats").select("*").eq("thread_status","open").order("created_at", { ascending:true });
    setChats(data || []);
  }, []);

  const fetchCallRequests = useCallback(async () => {
    const { data } = await supabase.from("call_requests").select("*").eq("status","pending").order("created_at", { ascending:false });
    setCallRequests(data || []);
  }, []);

  const fetchAllBookings = useCallback(async () => {
    const { data } = await supabase.from("bookings").select("*").order("check_in_date", { ascending:true });
    setAllBookings(data || []);
  }, []);

  const fetchHkTasks = useCallback(async () => {
    const { data } = await supabase.from("housekeeping_tasks").select("*").order("created_at", { ascending:true });
    const grouped = {};
    (data || []).forEach(t => {
      if (!grouped[t.room_number]) grouped[t.room_number] = [];
      grouped[t.room_number].push(t);
    });
    setHkTasks(grouped);
  }, []);

  const fetchShiftNotes = useCallback(async () => {
    const { data } = await supabase.from("shift_notes").select("*").order("created_at", { ascending:false }).limit(5);
    setShiftNotes(data || []);
  }, []);

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([fetchRooms(), fetchBookings(), fetchOrders(), fetchMenuItems(), fetchServiceRequests(), fetchChats(), fetchCallRequests(), fetchAllBookings(), fetchShiftNotes(), fetchHkTasks()]);
      setIsLoading(false);
    })();
  }, [fetchRooms, fetchBookings, fetchOrders, fetchMenuItems, fetchServiceRequests, fetchChats, fetchCallRequests, fetchAllBookings, fetchShiftNotes, fetchHkTasks]);

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel("hotel-ops")
      .on("postgres_changes", { event:"*", schema:"public", table:"rooms" }, () => { fetchRooms(); fetchHkTasks(); })
      .on("postgres_changes", { event:"*", schema:"public", table:"bookings" }, () => { fetchBookings(); fetchAllBookings(); })
      .on("postgres_changes", { event:"*", schema:"public", table:"menu_items" }, fetchMenuItems)
      .on("postgres_changes", { event:"*", schema:"public", table:"orders" }, (p) => {
        fetchOrders();
        if (p.eventType==="INSERT") { setNewOrderCount(n=>n+1); setOrdersBlink(true); setTimeout(()=>setOrdersBlink(false),8000); addToast(`🍽 New order from Suite ${p.new.room_number}`, "info"); }
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"service_requests" }, (p) => {
        fetchServiceRequests(); setRequestsBlink(true); setTimeout(()=>setRequestsBlink(false),6000);
        addToast(`New request: Suite ${p.new.room_number||"?"}`, "info");
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"staff_chats" }, (p) => {
        fetchChats();
        if (p.eventType==="INSERT" && p.new.sender==="guest") { setChatsBlink(true); setTimeout(()=>setChatsBlink(false),8000); addToast(`💬 Suite ${p.new.room_number}: ${p.new.message.slice(0,40)}`, "info"); }
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"housekeeping_tasks" }, fetchHkTasks)
      .on("postgres_changes", { event:"*", schema:"public", table:"shift_notes" }, fetchShiftNotes)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"call_requests" }, (p) => {
        fetchCallRequests(); setCallsBlink(true); setTimeout(()=>setCallsBlink(false),8000);
        addToast(`📞 Call request from Suite ${p.new.room_number}`, "info");
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchRooms, fetchBookings, fetchOrders, fetchMenuItems, fetchServiceRequests, fetchChats, fetchCallRequests, fetchHkTasks, fetchShiftNotes, addToast]);

  // ── Actions ───────────────────────────────────────────────
  const updateOrderStatus = async (orderId, newStatus, roomNumber) => {
    const { error } = await supabase.from("orders").update({ status:newStatus, updated_at:new Date().toISOString() }).eq("id", orderId);
    if (error) { addToast("Failed to update order", "error"); return; }
    setOrders(p => p.map(o => o.id===orderId ? {...o, status:newStatus} : o));
    addToast(`Order #${orderId} → ${newStatus}`, "success");
    if (newStatus==="delivered") {
      const order = orders.find(o=>o.id===orderId);
      if (order) await supabase.from("guest_ledger").insert({ room_number:roomNumber, order_id:orderId, description:`Food Order #${orderId}`, amount:order.total_amount, status:"pending" });
    }
  };

  const handleCheckOut = async (id, roomNumber) => {
    const { error } = await supabase.from("bookings").update({ status:"COMPLETED", check_out_at:new Date().toISOString() }).eq("id", id);
    if (error) { addToast("Check-out failed", "error"); return; }
    setBookings(p => p.filter(b => b.id!==id));
    await supabase.from("rooms").update({ status:"CLEANING" }).eq("room_number", roomNumber);
    setRooms(p => p.map(r => r.id===roomNumber.toString() ? {...r, status:"CLEANING", color:STATUS_COLORS["CLEANING"]} : r));
    addToast(`Suite ${roomNumber} checked out`, "success");
    setSelectedGuest(null); setConfirmDialog(null);
  };

  const updateRoomStatus = async (roomNumber, newStatus) => {
    const { error } = await supabase.from("rooms").update({ status:newStatus }).eq("room_number", roomNumber);
    if (!error) { setRooms(p => p.map(r => r.id===roomNumber.toString() ? {...r, status:newStatus, color:STATUS_COLORS[newStatus]} : r)); addToast(`Suite ${roomNumber} → ${newStatus}`, "success"); }
  };

  const handleResolveRequest = async (requestId) => {
    const { error } = await supabase.from("service_requests").update({ status:"resolved" }).eq("id", requestId);
    if (!error) { setServiceRequests(p=>p.filter(r=>r.id!==requestId)); setServiceRequestCount(p=>Math.max(0,p-1)); addToast("Request resolved", "success"); }
  };

  const markCallResolved = async (id, roomNumber) => {
    const { error } = await supabase.from("call_requests").update({ status:"called" }).eq("id", id);
    if (error) { addToast("Failed", "error"); return; }
    addToast(`Suite ${roomNumber} marked as called`, "success"); fetchCallRequests();
  };

  const closeChatThread = async (roomNumber) => {
    await supabase.from("staff_chats").update({ thread_status:"closed", handled:true }).eq("room_number", roomNumber).eq("thread_status","open");
    if (activeChatRoom===roomNumber) setActiveChatRoom(null);
    addToast(`Chat with Suite ${roomNumber} closed`, "success"); fetchChats();
  };

  const sendChatReply = async () => {
    const text = chatReplyInput.trim();
    if (!text || !activeChatRoom) return;
    setChatReplyInput("");
    const { error } = await supabase.from("staff_chats").insert({ room_number:activeChatRoom, guest_name:chats.find(c=>c.room_number===activeChatRoom)?.guest_name||"Guest", sender:"staff", message:text, thread_status:"open" });
    if (error) addToast("Failed to send", "error");
  };

  const startCleaning = async (roomNumber) => {
    const existing = hkTasks[roomNumber] || [];
    const existingNames = existing.map(t=>t.task_name);
    const missing = HK_ITEMS.filter(item=>!existingNames.includes(item));
    if (missing.length > 0) await supabase.from("housekeeping_tasks").insert(missing.map(task_name=>({ room_number:roomNumber, task_name, completed:false })));
    setHkModal(roomNumber); fetchHkTasks();
  };

  const toggleTask = async (task) => {
    await supabase.from("housekeeping_tasks").update({ completed:!task.completed, completed_at:!task.completed?new Date().toISOString():null }).eq("id", task.id);
    fetchHkTasks();
  };

  const markRoomVacant = async (roomNumber) => {
    await supabase.from("rooms").update({ status:"VACANT" }).eq("room_number", roomNumber);
    await supabase.from("housekeeping_tasks").delete().eq("room_number", roomNumber);
    setHkModal(null); addToast(`Suite ${roomNumber} marked VACANT`, "success"); fetchRooms(); fetchHkTasks();
  };

  const saveShiftNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const { data: { user: staffUser } } = await supabase.auth.getUser();
    const staffName = staffUser?.user_metadata?.full_name || staffUser?.email || "Staff";
    const { error } = await supabase.from("shift_notes").insert({ staff_name:staffName, note:newNote.trim() });
    setSavingNote(false);
    if (error) { addToast("Failed to save note", "error"); return; }
    setNewNote(""); addToast("Note saved", "success"); fetchShiftNotes();
  };

  const generateReport = async (date) => {
    setReportLoading(true);
    const start = `${date}T00:00:00.000Z`, end = `${date}T23:59:59.999Z`;
    const [{ data:checkIns },{ data:checkOuts },{ data:ordersToday },{ data:requestsToday },{ data:chatsToday },{ data:roomsData }] = await Promise.all([
      supabase.from("bookings").select("id,guest_name,room_number,total_amount").eq("status","ACTIVE").gte("check_in_date",date).lte("check_in_date",date),
      supabase.from("bookings").select("id,guest_name,room_number").eq("status","COMPLETED").gte("check_out_at",start).lte("check_out_at",end),
      supabase.from("orders").select("id,total_amount,status,payment_status").gte("created_at",start).lte("created_at",end),
      supabase.from("service_requests").select("id,status,request_type").gte("created_at",start).lte("created_at",end),
      supabase.from("staff_chats").select("id,room_number").gte("created_at",start).lte("created_at",end),
      supabase.from("rooms").select("room_number,status"),
    ]);
    const occupied = (roomsData||[]).filter(r=>r.status==="OCCUPIED").length;
    const totalRooms = (roomsData||[]).length;
    setReportData({ date, checkIns:checkIns||[], checkOuts:checkOuts||[], orders:ordersToday||[], orderRevenue:(ordersToday||[]).reduce((s,o)=>s+Number(o.total_amount||0),0), bookingRevenue:(checkIns||[]).reduce((s,b)=>s+Number(b.total_amount||0),0), requestsResolved:(requestsToday||[]).filter(r=>r.status==="resolved").length, requestsPending:(requestsToday||[]).filter(r=>r.status==="pending").length, chats:chatsToday||[], occupied, totalRooms, occupancyPct:totalRooms?Math.round((occupied/totalRooms)*100):0 });
    setReportLoading(false);
  };

  const copyReport = () => {
    if (!reportData) return;
    const text = `THE AFIA — DAILY REPORT\nDate: ${reportData.date}\n\nOccupancy: ${reportData.occupied}/${reportData.totalRooms} (${reportData.occupancyPct}%)\nCheck-ins: ${reportData.checkIns.length}\nCheck-outs: ${reportData.checkOuts.length}\nOrders: ${reportData.orders.length}\nF&B Revenue: ₵${reportData.orderRevenue.toLocaleString()}\nBooking Revenue: ₵${reportData.bookingRevenue.toLocaleString()}\nRequests Pending: ${reportData.requestsPending}\nRequests Resolved: ${reportData.requestsResolved}\nGuest Chats: ${reportData.chats.length}`;
    navigator.clipboard.writeText(text);
    addToast("Report copied", "success");
  };

  const fetchLedger = async (room) => {
    if (!room) return;
    setLedgerLoading(true);
    const { data } = await supabase.from("guest_ledger").select("*, orders(*)").eq("room_number",room).eq("status","pending");
    setLedgerData(data||[]); setLedgerLoading(false);
  };

  const handleSettleLedger = async (room, paymentMethod) => {
    await supabase.from("guest_ledger").update({ status:"paid" }).eq("room_number",room).eq("status","pending");
    await supabase.from("orders").update({ payment_status:"paid", payment_method:paymentMethod }).eq("room_number",room).neq("status","completed");
    fetchLedger(room); addToast(`Suite ${room} settled via ${paymentMethod}`, "success");
  };

  const handleMenuSave = async () => {
    if (!menuForm.name || !menuForm.price) { addToast("Name and price required", "error"); return; }
    setMenuUploading(true);
    let imageUrl = menuForm.image_url;
    if (menuImageFile) {
      const ext = menuImageFile.name.split(".").pop();
      const path = `menu/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, menuImageFile, { upsert:true });
      if (!error) { const { data } = supabase.storage.from("menu-images").getPublicUrl(path); imageUrl = data.publicUrl; }
    }
    const payload = { ...menuForm, price:parseFloat(menuForm.price), image_url:imageUrl };
    if (editingMenu) { await supabase.from("menu_items").update(payload).eq("id",editingMenu); addToast("Item updated","success"); }
    else { await supabase.from("menu_items").insert(payload); addToast("Item added","success"); }
    setMenuForm({ name:"", description:"", price:"", category:"Main", image_url:"", is_available:true });
    setEditingMenu(null); setMenuImageFile(null); setMenuUploading(false); fetchMenuItems();
  };

  const handleMenuEdit = (item) => { setMenuForm({ name:item.name, description:item.description||"", price:item.price, category:item.category||"Main", image_url:item.image_url||"", is_available:item.is_available }); setEditingMenu(item.id); };
  const handleMenuToggle = async (id, current) => { await supabase.from("menu_items").update({ is_available:!current }).eq("id",id); fetchMenuItems(); addToast(`Item ${!current?"enabled":"disabled"}`, "success"); };

  // ── Derived ───────────────────────────────────────────────
  const activeOrders = orders.filter(o=>!["completed","cancelled"].includes(o.status));
  const totalRevenue = orders.filter(o=>o.payment_status==="paid").reduce((s,o)=>s+(o.total_amount||0),0);
  const occupancyRate = rooms.length>0 ? Math.round((rooms.filter(r=>r.status==="OCCUPIED").length/rooms.length)*100) : 0;
  const vipCount = bookings.filter(b=>b.is_vip).length;
  const statusCounts = { VACANT:rooms.filter(r=>r.status==="VACANT").length, OCCUPIED:rooms.filter(r=>r.status==="OCCUPIED").length, CLEANING:rooms.filter(r=>r.status==="CLEANING").length, MAINTENANCE:rooms.filter(r=>r.status==="MAINTENANCE").length };
  const filteredBookings = bookings.filter(b=>b.guest_name?.toLowerCase().includes(guestFilter.toLowerCase())||b.room_number?.toString().includes(guestFilter));
  const openChatRooms = [...new Set(chats.map(c=>c.room_number))];
  const last7Days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
  const lineData = last7Days.map(d=>({ day:d.toLocaleDateString("en-US",{weekday:"short"}), bookings:bookings.filter(b=>b.created_at?.startsWith(d.toISOString().split("T")[0])).length, orders:orders.filter(o=>o.created_at?.startsWith(d.toISOString().split("T")[0])).length }));
  const donutData = [{ name:"Vacant",value:statusCounts.VACANT,color:"#3b82f6" },{ name:"Occupied",value:statusCounts.OCCUPIED,color:"#10b981" },{ name:"Cleaning",value:statusCounts.CLEANING,color:"#f59e0b" },{ name:"Maint.",value:statusCounts.MAINTENANCE,color:"#ef4444" }].filter(d=>d.value>0);
  const monthStats = (() => {
    const calYear=calMonth.getFullYear(), calMon=calMonth.getMonth();
    const start=new Date(calYear,calMon,1).toISOString().split("T")[0], end=new Date(calYear,calMon+1,0).toISOString().split("T")[0];
    const inMonth=allBookings.filter(b=>b.status!=="CANCELLED"&&b.check_in_date<=end&&b.check_out_date>=start);
    return { count:inMonth.length, revenue:inMonth.reduce((s,b)=>s+Number(b.total_amount||0),0) };
  })();

  const ADMIN_ONLY = ["analytics","billing","catalog","settings","reports"];
  const navItems = [
    { key:"rooms", label:"Suite Status" },
    { key:"kitchen", label:"Kitchen Orders", blink:ordersBlink, count:activeOrders.length },
    { key:"chats", label:"Guest Chats", blink:chatsBlink, count:openChatRooms.length },
    { key:"calls", label:"Call Requests", blink:callsBlink, count:callRequests.length },
    { key:"reservations", label:"Reservations", count:allBookings.filter(b=>b.status==="ACTIVE").length },
    { key:"housekeeping", label:"Housekeeping", count:rooms.filter(r=>r.status==="CLEANING").length },
  ].filter(n=>!ADMIN_ONLY.includes(n.key)||isAdmin);

  // ── Loading ───────────────────────────────────────────────
  if (isLoading || !userRole) return (
    <div style={{ minHeight:"100vh", background:"#020617", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:44, height:44, border:"3px solid rgba(59,130,246,0.15)", borderTop:"3px solid #3b82f6", borderRadius:"50%", margin:"0 auto 16px", animation:"spin 1s linear infinite" }} />
        <p style={{ color:"#334155", fontSize:12, fontWeight:700, letterSpacing:2 }}>LOADING...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#020617", color:"white", fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", display:"flex" }}>
      <style>{KEYFRAMES}</style>

      {/* Mobile hamburger */}
      {isMobile && (
        <button onClick={() => setSidebarOpen(s=>!s)} style={{ position:"fixed", top:16, left:16, zIndex:600, width:42, height:42, borderRadius:12, background:"rgba(2,6,23,0.95)", border:"1px solid rgba(59,130,246,0.2)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer", backdropFilter:"blur(12px)" }}>
          <div style={{ width:20, height:2, background:sidebarOpen?"#3b82f6":"#475569", borderRadius:2, transform:sidebarOpen?"rotate(45deg) translate(5px,5px)":"none", transition:"all 0.3s" }} />
          <div style={{ width:20, height:2, background:sidebarOpen?"transparent":"#475569", borderRadius:2, transition:"all 0.3s" }} />
          <div style={{ width:20, height:2, background:sidebarOpen?"#3b82f6":"#475569", borderRadius:2, transform:sidebarOpen?"rotate(-45deg) translate(5px,-5px)":"none", transition:"all 0.3s" }} />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:400, backdropFilter:"blur(2px)" }} />}

      {/* Sidebar */}
      <DashboardSidebar
        isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        activeTab={activeTab} setActiveTab={setActiveTab}
        navItems={navItems} isAdmin={isAdmin} isStaff={isStaff} userName={userName}
        totalRevenue={totalRevenue} occupancyRate={occupancyRate} activeOrders={activeOrders}
        rooms={rooms} serviceRequestCount={serviceRequestCount} requestsBlink={requestsBlink}
        navigate={navigate} supabase={supabase}
      />

      {/* Modals */}
      <HkModal hkModal={hkModal} setHkModal={setHkModal} hkTasks={hkTasks} HK_ITEMS={HK_ITEMS} toggleTask={toggleTask} markRoomVacant={markRoomVacant} startCleaning={startCleaning} />
      <GuestSlideOver selectedGuest={selectedGuest} setSelectedGuest={setSelectedGuest} orders={orders} setConfirmDialog={setConfirmDialog} handleCheckOut={handleCheckOut} isMobile={isMobile} />
      <Toast toasts={toasts} />
      <ConfirmDialog open={!!confirmDialog} title={confirmDialog?.title||"Confirm"} message={confirmDialog?.message} onConfirm={confirmDialog?.onConfirm} onCancel={() => setConfirmDialog(null)} />

      {/* Main content */}
      <main style={{ flex:1, marginLeft:isMobile?0:260, padding:isMobile?"70px 16px 32px":"32px 40px", minHeight:"100vh", overflowY:"auto" }}>

        {/* Page header */}
        <div style={{ marginBottom:24, paddingLeft:isMobile?44:0 }}>
          <h1 style={{ fontSize:isMobile?20:28, fontWeight:800, margin:0, color:"#fff", letterSpacing:-0.5 }}>
            {activeTab==="analytics"?"Analytics":activeTab==="kitchen"?"Kitchen":activeTab==="rooms"?"Suite Status":activeTab==="chats"?"Guest Chats":activeTab==="calls"?"Call Requests":activeTab==="reservations"?"Reservations":activeTab==="housekeeping"?"Housekeeping":activeTab==="reports"?"Daily Reports":activeTab==="billing"?"Guest Billing":activeTab==="catalog"?"Menu Catalog":activeTab==="requests"?"Service Requests":"Dashboard"}
          </h1>
          <p style={{ fontSize:12, color:"#334155", margin:"4px 0 0", fontWeight:600 }}>
            {isAdmin?"Admin":"Staff"} · {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
          </p>
        </div>

        {/* Tabs */}
        {activeTab==="analytics"&&isAdmin&&<AnalyticsTab isMobile={isMobile} occupancyRate={occupancyRate} vipCount={vipCount} activeOrders={activeOrders} totalRevenue={totalRevenue} bookings={bookings} orders={orders} rooms={rooms} filteredBookings={filteredBookings} guestFilter={guestFilter} setGuestFilter={setGuestFilter} setSelectedGuest={setSelectedGuest} setConfirmDialog={setConfirmDialog} handleCheckOut={handleCheckOut} lineData={lineData} donutData={donutData} />}
        {activeTab==="kitchen"&&<KitchenTab isMobile={isMobile} orders={orders} activeOrders={activeOrders} kitchenFilter={kitchenFilter} setKitchenFilter={setKitchenFilter} updateOrderStatus={updateOrderStatus} isAdmin={isAdmin} />}
        {activeTab==="rooms"&&<RoomsTab isMobile={isMobile} rooms={rooms} roomSearch={roomSearch} setRoomSearch={setRoomSearch} bookings={bookings} updateRoomStatus={updateRoomStatus} startCleaning={startCleaning} />}
        {activeTab==="chats"&&<ChatsTab isMobile={isMobile} chats={chats} activeChatRoom={activeChatRoom} setActiveChatRoom={setActiveChatRoom} chatReplyInput={chatReplyInput} setChatReplyInput={setChatReplyInput} sendChatReply={sendChatReply} closeChatThread={closeChatThread} />}
        {activeTab==="calls"&&<CallsTab isMobile={isMobile} callRequests={callRequests} markCallResolved={markCallResolved} />}
        {activeTab==="requests"&&<RequestsTab isMobile={isMobile} serviceRequests={serviceRequests} handleResolveRequest={handleResolveRequest} />}
        {activeTab==="reservations"&&<ReservationsTab isMobile={isMobile} allBookings={allBookings} calMonth={calMonth} setCalMonth={setCalMonth} calSelectedDay={calSelectedDay} setCalSelectedDay={setCalSelectedDay} monthStats={monthStats} />}
        {activeTab==="housekeeping"&&<HousekeepingTab isMobile={isMobile} rooms={rooms} hkTasks={hkTasks} shiftNotes={shiftNotes} newNote={newNote} setNewNote={setNewNote} savingNote={savingNote} saveShiftNote={saveShiftNote} startCleaning={startCleaning} />}
        {activeTab==="reports"&&isAdmin&&<ReportsTab isMobile={isMobile} reportDate={reportDate} setReportDate={setReportDate} reportData={reportData} reportLoading={reportLoading} generateReport={generateReport} copyReport={copyReport} />}
        {activeTab==="billing"&&isAdmin&&<BillingTab isMobile={isMobile} orders={orders} totalRevenue={totalRevenue} statusCounts={statusCounts} bookings={bookings} ledgerRoom={ledgerRoom} setLedgerRoom={setLedgerRoom} ledgerData={ledgerData} ledgerLoading={ledgerLoading} fetchLedger={fetchLedger} handleSettleLedger={handleSettleLedger} setConfirmDialog={setConfirmDialog} />}
        {activeTab==="catalog"&&isAdmin&&<CatalogTab isMobile={isMobile} menuItems={menuItems} menuForm={menuForm} setMenuForm={setMenuForm} editingMenu={editingMenu} setEditingMenu={setEditingMenu} menuUploading={menuUploading} menuImageFile={menuImageFile} setMenuImageFile={setMenuImageFile} handleMenuSave={handleMenuSave} handleMenuEdit={handleMenuEdit} handleMenuToggle={handleMenuToggle} />}
      </main>
    </div>
  );
}
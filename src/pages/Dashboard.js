import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

// ── KEYFRAMES ────────────────────────────────────────────────────────────────
const blinkKeyframes = `
  @keyframes navBlink {
    0%,100%{background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.4);color:#f59e0b}
    50%{background:rgba(245,158,11,0.03);border-color:rgba(245,158,11,0.1);color:#94a3b8}
  }
  @keyframes badgePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes toastIn{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes toastOut{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-10px) scale(0.95)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
`;
function useWindowWidth() {
  const [width, setWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

const STATUS_COLORS = { VACANT:"#3b82f6", OCCUPIED:"#10b981", CLEANING:"#f59e0b", MAINTENANCE:"#ef4444" };
const ORDER_STATUS = ["pending","accepted","preparing","ready","delivered","completed"];
const ORDER_COLORS = {
  pending:"#f59e0b", accepted:"#3b82f6", preparing:"#8b5cf6",
  ready:"#06b6d4", delivered:"#10b981", completed:"#475569"
};
const ORDER_LABELS = {
  pending:"Pending", accepted:"Accepted", preparing:"Preparing",
  ready:"Ready", delivered:"Delivered", completed:"Completed"
};

// ── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position:"fixed", bottom:30, right:30, display:"flex", flexDirection:"column", gap:10, zIndex:9999 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding:"14px 22px", borderRadius:16, fontSize:13, fontWeight:700, backdropFilter:"blur(20px)",
        animation: t.leaving ? "toastOut 0.3s ease forwards" : "toastIn 0.3s ease forwards",
        background: t.type==="success" ? "rgba(16,185,129,0.15)" : t.type==="error" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
        border: t.type==="success" ? "1px solid rgba(16,185,129,0.4)" : t.type==="error" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(59,130,246,0.4)",
        color: t.type==="success" ? "#10b981" : t.type==="error" ? "#ef4444" : "#3b82f6",
        boxShadow:"0 10px 30px rgba(0,0,0,0.4)",
        display:"flex", alignItems:"center", gap:10,
      }}>
        {t.type==="success" ? "✓" : t.type==="error" ? "✕" : "•"} {t.message}
      </div>
    ))}
  </div>
);

// ── CONFIRM DIALOG ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(2,6,23,0.85)", backdropFilter:"blur(10px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"rgba(15,23,42,0.98)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:28, padding:40, maxWidth:400, width:"90%", boxShadow:"0 40px 80px rgba(0,0,0,0.6)" }}>
        <h3 style={{ margin:"0 0 10px", fontSize:20, fontWeight:900 }}>{title}</h3>
        <p style={{ color:"#64748b", fontSize:14, margin:"0 0 30px" }}>{message}</p>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onCancel} style={{ flex:1, padding:14, borderRadius:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(51,65,85,0.5)", color:"#94a3b8", cursor:"pointer", fontWeight:800, fontSize:13 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:14, borderRadius:14, background:"linear-gradient(45deg,#ef4444,#dc2626)", border:"none", color:"white", cursor:"pointer", fontWeight:900, fontSize:13, boxShadow:"0 8px 20px rgba(239,68,68,0.3)" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ── ORDER STATUS BADGE ────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span style={{
    padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:900,
    background: ORDER_COLORS[status] + "22",
    border: `1px solid ${ORDER_COLORS[status]}55`,
    color: ORDER_COLORS[status],
  }}>{ORDER_LABELS[status] || status}</span>
);

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const Dashboard = () => {
  // Role-based access
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");

  const [activeTab,    setActiveTab]    = useState("kitchen");
  const [roomSearch,   setRoomSearch]   = useState("");
  const [currentTime,  setCurrentTime]  = useState(new Date().toLocaleTimeString());
  const [bookings,     setBookings]     = useState([]);
  const [rooms,        setRooms]        = useState([]);
  const [selectedGuest,setSelectedGuest]= useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [guestFilter,  setGuestFilter]  = useState("");
  const [confirmDialog,setConfirmDialog]= useState(null);
  const [toasts,       setToasts]       = useState([]);
  const [logs,         setLogs]         = useState([{ time: new Date().toLocaleTimeString().slice(0,5), action:"Satellite Link Active", user:"SYS" }]);

  // Service requests
  const [serviceRequests,     setServiceRequests]     = useState([]);
  const [serviceRequestCount, setServiceRequestCount] = useState(0);
  const [requestsBlink,       setRequestsBlink]       = useState(false);

  // Orders & Kitchen
  const [orders,          setOrders]         = useState([]);
  const [ordersBlink,     setOrdersBlink]    = useState(false);
  const [newOrderCount,   setNewOrderCount]  = useState(0);
  const [kitchenFilter,   setKitchenFilter]  = useState("all"); // all | active | completed

  // Menu catalog
  const [menuItems,     setMenuItems]     = useState([]);
  const [menuForm,      setMenuForm]      = useState({ name:"", description:"", price:"", category:"Main", image_url:"", is_available:true });
  const [editingMenu,   setEditingMenu]   = useState(null);
  const [menuUploading, setMenuUploading] = useState(false);
  const [menuImageFile, setMenuImageFile] = useState(null);

  // Guest ledger
  const [ledgerRoom,    setLedgerRoom]    = useState("");
  const [ledgerData,    setLedgerData]    = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [chats,          setChats]          = useState([]); // open chat threads grouped by room
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatReplyInput, setChatReplyInput] = useState("");
  const [chatsBlink,     setChatsBlink]     = useState(false);
  const [callRequests,   setCallRequests]   = useState([]);
  const [callsBlink,     setCallsBlink]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useWindowWidth() < 768;
  const [hkTasks,        setHkTasks]        = useState({});   // { roomNumber: [tasks] }
  const [hkModal,        setHkModal]        = useState(null); // room_number being cleaned
  const [shiftNotes,     setShiftNotes]     = useState([]);
  const [newNote,        setNewNote]        = useState("");
  const [savingNote,     setSavingNote]     = useState(false);
  const [reportDate,     setReportDate]     = useState(new Date().toISOString().split("T")[0]);
  const [reportData,     setReportData]     = useState(null);
  const [reportLoading,  setReportLoading]  = useState(false);
 
  // Standard checklist items (admin can add more later)
  const HK_ITEMS = [
    "Linens Changed",
    "Bathroom Cleaned",
    "Towels Replaced",
    "Minibar Restocked",
    "Vacuumed",
    "Windows Wiped",
    "Trash Removed",
  ];
  const [allBookings,    setAllBookings]    = useState([]);
  const [calMonth,       setCalMonth]       = useState(new Date());
  const [calSelectedDay, setCalSelectedDay] = useState(null);
 

  const navigate = useNavigate();
  // ── Housekeeping handlers ──
  const startCleaning = async (roomNumber) => {
    // Insert the 7 default tasks if they don't exist yet
    const existing = hkTasks[roomNumber] || [];
    const existingNames = existing.map(t => t.task_name);
    const missing = HK_ITEMS.filter(item => !existingNames.includes(item));
    if (missing.length > 0) {
      await supabase.from("housekeeping_tasks").insert(
        missing.map(task_name => ({ room_number: roomNumber, task_name, completed: false }))
      );
    }
    setHkModal(roomNumber);
    fetchHkTasks();
  };
 
  const toggleTask = async (task) => {
    const now = new Date().toISOString();
    await supabase.from("housekeeping_tasks")
      .update({ completed: !task.completed, completed_at: !task.completed ? now : null })
      .eq("id", task.id);
    fetchHkTasks();
  };
 
  const markRoomVacant = async (roomNumber) => {
    await supabase.from("rooms").update({ status: "VACANT" }).eq("room_number", roomNumber);
    await supabase.from("housekeeping_tasks").delete().eq("room_number", roomNumber);
    setHkModal(null);
    addToast(`Suite ${roomNumber} marked VACANT`, "success");
    addLog(`Suite ${roomNumber} cleaned and marked VACANT`);
    fetchRooms();
    fetchHkTasks();
  };
 
  const saveShiftNote = async () => {
  if (!newNote.trim()) return;
  setSavingNote(true);
  const { data: { user: staffUser } } = await supabase.auth.getUser();
  const staffName = staffUser?.user_metadata?.full_name || staffUser?.email || "Staff";
  const { error } = await supabase.from("shift_notes").insert({
    staff_name: staffName,
    note: newNote.trim(),
  });
  setSavingNote(false);
  if (error) { addToast("Failed to save note", "error"); return; }
  setNewNote("");
  addToast("Handover note saved", "success");
  fetchShiftNotes();
};
 
  const copyReport = () => {
    if (!reportData) return;
    const text = `
THE AFIA — DAILY REPORT
Date: ${reportData.date}
Generated: ${new Date().toLocaleTimeString()}
 
OCCUPANCY
  Rooms Occupied: ${reportData.occupied} / ${reportData.totalRooms} (${reportData.occupancyPct}%)
 
GUEST MOVEMENT
  Check-ins Today:  ${reportData.checkIns.length}
  Check-outs Today: ${reportData.checkOuts.length}
 
FOOD & BEVERAGE
  Orders Today: ${reportData.orders.length}
  F&B Revenue:  ₵${reportData.orderRevenue.toLocaleString()}
 
BOOKING REVENUE
  ₵${reportData.bookingRevenue.toLocaleString()}
 
SERVICE REQUESTS
  Resolved: ${reportData.requestsResolved}
  Pending:  ${reportData.requestsPending}
 
GUEST COMMUNICATIONS
  Chat threads today: ${reportData.chats.length}
 
— End of Report —
    `.trim();
    navigator.clipboard.writeText(text);
    addToast("Report copied to clipboard", "success");
  };
  // ── Chat + call handlers ──
  const sendChatReply = async () => {
    const text = chatReplyInput.trim();
    if (!text || !activeChatRoom) return;
    setChatReplyInput("");
    const { error } = await supabase.from("staff_chats").insert({
      room_number: activeChatRoom,
      guest_name: chats.find(c => c.room_number === activeChatRoom)?.guest_name || "Guest",
      sender: "staff",
      message: text,
      thread_status: "open",
    });
    if (error) { addToast("Failed to send reply", "error"); return; }
    addLog(`Staff replied to Suite ${activeChatRoom}`);
  };

  const markCallResolved = async (id, roomNumber) => {
    const { error } = await supabase.from("call_requests").update({ status: "called" }).eq("id", id);
    if (error) { addToast("Failed to mark called", "error"); return; }
    addLog(`Call to Suite ${roomNumber} marked as called`);
    addToast(`Suite ${roomNumber} marked as called`, "success");
    fetchCallRequests();
  };

  const closeChatThread = async (roomNumber) => {
    await supabase.from("staff_chats")
      .update({ thread_status: "closed", handled: true })
      .eq("room_number", roomNumber)
      .eq("thread_status", "open");
    if (activeChatRoom === roomNumber) setActiveChatRoom(null);
    addToast(`Chat with Suite ${roomNumber} closed`, "success");
    fetchChats();
  };

  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";

  // Tabs only admin can see
  const ADMIN_ONLY_TABS = ["analytics", "billing", "catalog", "settings"];

  // ── ROLE LOAD ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = session?.user?.user_metadata?.role || null;
      const name = session?.user?.user_metadata?.full_name || session?.user?.email || "Operator";
      setUserRole(role);
      setUserName(name);
      // Admin lands on analytics, staff lands on kitchen
      setActiveTab(role === "admin" ? "analytics" : "kitchen");
    })();
  }, []);

  // Bounce staff away if they somehow land on an admin-only tab
  useEffect(() => {
    if (isStaff && ADMIN_ONLY_TABS.includes(activeTab)) {
      setActiveTab("kitchen");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, activeTab]);

  // ── TOAST HELPER ────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type="info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type, leaving:false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id===id ? {...t, leaving:true} : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id!==id)), 350);
    }, 3500);
  }, []);

  const addLog = useCallback((action) => {
    setLogs(p => [{ time:new Date().toLocaleTimeString().slice(0,5), action, user: userRole === "staff" ? "STAFF" : "ADMIN" }, ...p].slice(0,10));
  }, [userRole]);

  // ── CLOCK ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── FETCH FUNCTIONS ──────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    const { data } = await supabase.from("rooms").select("*").order("room_number", { ascending:true });
    if (data) setRooms(data.map(r => ({ ...r, id:r.room_number.toString(), color: STATUS_COLORS[r.status] || "#3b82f6" })));
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
    const { data } = await supabase
      .from("staff_chats")
      .select("*")
      .eq("thread_status", "open")
      .order("created_at", { ascending: true });
    setChats(data || []);
  }, []);
 
  // Fetch pending call-back requests
  const fetchCallRequests = useCallback(async () => {
    const { data } = await supabase
      .from("call_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setCallRequests(data || []);
  }, []);
  const fetchAllBookings = useCallback(async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("check_in_date", { ascending: true });
    setAllBookings(data || []);
  }, []);
   const fetchHkTasks = useCallback(async () => {
  const { data } = await supabase
    .from("housekeeping_tasks")
    .select("*")
    .eq("completed", false)
    .order("created_at", { ascending: true });
  const grouped = {};
  (data || []).forEach(t => {
    if (!grouped[t.room_number]) grouped[t.room_number] = [];
    grouped[t.room_number].push(t);
  });
  setHkTasks(grouped);
}, []);
 
  // Fetch shift handover notes (last 5)
  const fetchShiftNotes = useCallback(async () => {
    const { data } = await supabase
      .from("shift_notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setShiftNotes(data || []);
  }, []);
 
  // Generate daily report for a given date
  const generateReport = useCallback(async (date) => {
    setReportLoading(true);
    const start = `${date}T00:00:00.000Z`;
    const end   = `${date}T23:59:59.999Z`;
    const [
      { data: checkIns },
      { data: checkOuts },
      { data: ordersToday },
      { data: requestsToday },
      { data: chatsToday },
      { data: roomsData },
    ] = await Promise.all([
      supabase.from("bookings").select("id,guest_name,room_number,total_amount").eq("status","ACTIVE").gte("check_in_date", date).lte("check_in_date", date),
      supabase.from("bookings").select("id,guest_name,room_number").eq("status","COMPLETED").gte("check_out_at", start).lte("check_out_at", end),
      supabase.from("orders").select("id,total_amount,status,payment_status").gte("created_at", start).lte("created_at", end),
      supabase.from("service_requests").select("id,status,request_type").gte("created_at", start).lte("created_at", end),
      supabase.from("staff_chats").select("id,room_number").gte("created_at", start).lte("created_at", end),
      supabase.from("rooms").select("room_number,status"),
    ]);
    const occupied   = (roomsData||[]).filter(r => r.status === "OCCUPIED").length;
    const totalRooms = (roomsData||[]).length;
    const orderRevenue = (ordersToday||[]).reduce((s,o) => s + Number(o.total_amount||0), 0);
    const bookingRevenue = (checkIns||[]).reduce((s,b) => s + Number(b.total_amount||0), 0);
    const resolved = (requestsToday||[]).filter(r => r.status === "resolved").length;
    const pending  = (requestsToday||[]).filter(r => r.status === "pending").length;
    setReportData({
      date,
      checkIns:      checkIns || [],
      checkOuts:     checkOuts || [],
      orders:        ordersToday || [],
      orderRevenue,
      bookingRevenue,
      requests:      requestsToday || [],
      requestsResolved: resolved,
      requestsPending:  pending,
      chats:         chatsToday || [],
      occupied,
      totalRooms,
      occupancyPct:  totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
    });
    setReportLoading(false);
  }, []);
 
  // ── INITIAL LOAD ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
    await Promise.all([fetchRooms(), fetchBookings(), fetchOrders(), fetchMenuItems(), fetchServiceRequests(), fetchChats(), fetchCallRequests(), fetchAllBookings(), fetchShiftNotes()]);
      setIsLoading(false);
    })();
    }, [fetchRooms, fetchBookings, fetchOrders, fetchMenuItems, fetchServiceRequests, fetchChats, fetchCallRequests, fetchAllBookings, fetchShiftNotes, fetchHkTasks]);

  // ── REALTIME SUBSCRIPTIONS ──────────────────────────────────────────────────
  useEffect(() => {
   const ch = supabase.channel("hotel-sync-v2")
     .on("postgres_changes", { event:"*", schema:"public", table:"rooms" }, () => { fetchRooms(); fetchHkTasks(); })
      .on("postgres_changes", { event:"*", schema:"public", table:"bookings" }, () => {
        fetchBookings();
        fetchAllBookings();
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"menu_items" }, () => fetchMenuItems())
      .on("postgres_changes", { event:"*", schema:"public", table:"orders"   }, (payload) => {
        fetchOrders();
        if (payload.eventType === "INSERT") {
          setNewOrderCount(p => p + 1);
          setOrdersBlink(true);
          setTimeout(() => setOrdersBlink(false), 8000);
          addLog(`New order: Suite ${payload.new.room_number}`);
          addToast(`🍽 New order from Suite ${payload.new.room_number}`, "info");
        }
        if (payload.eventType === "UPDATE") {
          addLog(`Order #${payload.new.id} → ${payload.new.status}`);
        }
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"service_requests" }, (payload) => {
        fetchServiceRequests();
        setRequestsBlink(true);
        setTimeout(() => setRequestsBlink(false), 6000);
        addLog(`New service request: Suite ${payload.new.room_number || "?"}`);
        addToast(`New request: Suite ${payload.new.room_number || "?"}`, "info");
      })
       .on("postgres_changes", { event:"*", schema:"public", table:"staff_chats" }, (payload) => {
        fetchChats();
        if (payload.eventType === "INSERT" && payload.new.sender === "guest") {
          setChatsBlink(true);
          setTimeout(() => setChatsBlink(false), 8000);
          addLog(`New chat message: Suite ${payload.new.room_number}`);
          addToast(`💬 Suite ${payload.new.room_number}: ${payload.new.message.slice(0,40)}`, "info");
        }
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"housekeeping_tasks" }, () => fetchHkTasks())
      .on("postgres_changes", { event:"*", schema:"public", table:"shift_notes" }, () => fetchShiftNotes())
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"call_requests" }, (payload) => {
        fetchCallRequests();
        setCallsBlink(true);
        setTimeout(() => setCallsBlink(false), 8000);
        addLog(`Call requested: Suite ${payload.new.room_number}`);
        addToast(`📞 Call request from Suite ${payload.new.room_number}`, "info");
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchRooms, fetchBookings, fetchOrders, fetchMenuItems, fetchServiceRequests, fetchChats, fetchCallRequests, addLog, addToast]);

  // ── ORDER ACTIONS ────────────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId, newStatus, roomNumber) => {
    const { error } = await supabase.from("orders").update({ status:newStatus, updated_at:new Date().toISOString() }).eq("id", orderId);
    if (error) { addToast("Failed to update order", "error"); return; }
    setOrders(p => p.map(o => o.id===orderId ? {...o, status:newStatus} : o));
    addLog(`Order #${orderId} Suite ${roomNumber} → ${newStatus}`);
    addToast(`Order #${orderId} marked as ${ORDER_LABELS[newStatus]}`, "success");

    // If delivered, add to ledger
    if (newStatus === "delivered") {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await supabase.from("guest_ledger").insert({
          room_number: roomNumber,
          order_id: orderId,
          description: `Food Order #${orderId}`,
          amount: order.total_amount,
          status: "pending",
        });
      }
    }
  };

  const nextStatus = (current) => {
    const idx = ORDER_STATUS.indexOf(current);
    return idx < ORDER_STATUS.length - 1 ? ORDER_STATUS[idx+1] : null;
  };

  // ── CHECKOUT ────────────────────────────────────────────────────────────────
 const handleCheckOut = async (id, roomNumber) => {
  const { error } = await supabase.from("bookings").update({
    status: "COMPLETED",
    check_out_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { addToast("Check-out failed.", "error"); return; }
  setBookings(p => p.filter(b => b.id !== id));
  await updateRoomStatus(roomNumber, "CLEANING");
  addLog(`Check-out: Suite ${roomNumber}`);
  addToast(`Suite ${roomNumber} checked out`, "success");
  setSelectedGuest(null);
  setConfirmDialog(null);
};

  const updateRoomStatus = async (roomNumber, newStatus) => {
    const { error } = await supabase.from("rooms").update({ status:newStatus }).eq("room_number", roomNumber);
    if (!error) {
      setRooms(p => p.map(r => r.id===roomNumber.toString() ? {...r, status:newStatus, color:STATUS_COLORS[newStatus]} : r));
      addToast(`Suite ${roomNumber} → ${newStatus}`, "success");
    }
  };

  // ── SERVICE REQUESTS ────────────────────────────────────────────────────────
  const handleResolveRequest = async (requestId) => {
    const { error } = await supabase.from("service_requests").update({ status:"resolved" }).eq("id", requestId);
    if (!error) {
      setServiceRequests(p => p.filter(r => r.id !== requestId));
      setServiceRequestCount(p => Math.max(0, p-1));
      addToast("Request resolved", "success");
    }
  };

  // ── MENU CATALOG ─────────────────────────────────────────────────────────────
  const handleMenuImageUpload = async (file) => {
    if (!file) return null;
    const ext  = file.name.split(".").pop();
    const path = `menu/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert:true });
    if (error) { addToast("Image upload failed", "error"); return null; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMenuSave = async () => {
    if (!menuForm.name || !menuForm.price) { addToast("Name and price are required", "error"); return; }
    setMenuUploading(true);
    let imageUrl = menuForm.image_url;
    if (menuImageFile) imageUrl = await handleMenuImageUpload(menuImageFile) || imageUrl;

    const payload = { ...menuForm, price: parseFloat(menuForm.price), image_url: imageUrl };

    if (editingMenu) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingMenu);
      if (!error) { addToast("Menu item updated", "success"); }
      else addToast("Update failed", "error");
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (!error) { addToast("Menu item added", "success"); }
      else addToast("Insert failed", "error");
    }

    setMenuForm({ name:"", description:"", price:"", category:"Main", image_url:"", is_available:true });
    setEditingMenu(null);
    setMenuImageFile(null);
    setMenuUploading(false);
    fetchMenuItems();
  };

  const handleMenuDelete = async (id) => {
    const { error } = await supabase.from("menu_items").update({ is_available:false }).eq("id", id);
    if (!error) { fetchMenuItems(); addToast("Item hidden from menu", "success"); }
  };

  const handleMenuEdit = (item) => {
    setMenuForm({ name:item.name, description:item.description||"", price:item.price, category:item.category||"Main", image_url:item.image_url||"", is_available:item.is_available });
    setEditingMenu(item.id);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const handleMenuToggle = async (id, current) => {
    await supabase.from("menu_items").update({ is_available:!current }).eq("id", id);
    fetchMenuItems();
    addToast(`Item ${!current ? "enabled" : "disabled"}`, "success");
  };

  // ── LEDGER ───────────────────────────────────────────────────────────────────
  const fetchLedger = async (room) => {
    if (!room) return;
    setLedgerLoading(true);
    const { data } = await supabase.from("guest_ledger").select("*, orders(*)").eq("room_number", room).eq("status","pending");
    setLedgerData(data || []);
    setLedgerLoading(false);
  };

  const handleSettleLedger = async (room, paymentMethod) => {
    await supabase.from("guest_ledger").update({ status:"paid" }).eq("room_number", room).eq("status","pending");
    await supabase.from("orders").update({ payment_status:"paid", payment_method:paymentMethod }).eq("room_number", room).neq("status","completed");
    fetchLedger(room);
    addToast(`Suite ${room} bill settled (${paymentMethod})`, "success");
    addLog(`Bill settled: Suite ${room} via ${paymentMethod}`);
  };

  // ── STATS ────────────────────────────────────────────────────────────────────
  const statusCounts = {
    VACANT:      rooms.filter(r => r.status==="VACANT").length,
    OCCUPIED:    rooms.filter(r => r.status==="OCCUPIED").length,
    CLEANING:    rooms.filter(r => r.status==="CLEANING").length,
    MAINTENANCE: rooms.filter(r => r.status==="MAINTENANCE").length,
  };
  const occupancyRate = rooms.length > 0 ? Math.round((statusCounts.OCCUPIED / rooms.length) * 100) : 0;
  const vipCount = bookings.filter(b => b.is_vip).length;
  const activeOrders = orders.filter(o => !["completed","cancelled"].includes(o.status));
  const totalRevenue = orders.filter(o => o.payment_status==="paid").reduce((s,o) => s + (o.total_amount||0), 0);

  // ── CHART DATA ───────────────────────────────────────────────────────────────
  const last7Days = Array.from({ length:7 }, (_,i) => { const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; });
  const lineData  = last7Days.map(d => ({
    day: d.toLocaleDateString("en-US",{weekday:"short"}),
    bookings: bookings.filter(b => b.created_at?.startsWith(d.toISOString().split("T")[0])).length,
    orders:   orders.filter(o => o.created_at?.startsWith(d.toISOString().split("T")[0])).length,
  }));
  const donutData = [
    { name:"Vacant",  value:statusCounts.VACANT,      color:"#3b82f6" },
    { name:"Occupied",value:statusCounts.OCCUPIED,     color:"#10b981" },
    { name:"Cleaning",value:statusCounts.CLEANING,     color:"#f59e0b" },
    { name:"Maint.",  value:statusCounts.MAINTENANCE,  color:"#ef4444" },
  ].filter(d => d.value > 0);

  const tooltipStyle = { background:"rgba(15,23,42,0.9)", border:"1px solid #3b82f633", borderRadius:12, color:"white", fontSize:12, backdropFilter:"blur(10px)" };

  const filteredBookings = bookings.filter(b =>
    b.guest_name?.toLowerCase().includes(guestFilter.toLowerCase()) ||
    b.room_number?.toString().includes(guestFilter)
  );

  const displayedOrders = orders.filter(o => {
    if (kitchenFilter === "active")    return !["completed","cancelled"].includes(o.status);
    if (kitchenFilter === "completed") return o.status === "completed";
    return true;
  });

  const searchResult = rooms.find(r => r.id === roomSearch);

  // ── STYLES ───────────────────────────────────────────────────────────────────
  const S = {
    page: { background:"radial-gradient(circle at top right,#0f172a,#020617)", minHeight:"100vh", color:"white", display:"flex", fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", overflowX:"hidden", flexDirection: "column" },
    container: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    sidebar: { 
      width: isMobile ? "100%" : 280, 
      background:"rgba(15,23,42,0.8)", 
      padding:"40px 20px", 
      borderRight: isMobile ? "none" : "1px solid rgba(51,65,85,0.5)", 
      display:"flex", 
      flexDirection:"column", 
      justifyContent:"space-between", 
      zIndex:10, 
      position: isMobile ? "fixed" : "relative",
      top: isMobile ? 0 : "auto",
      left: isMobile ? 0 : "auto",
      bottom: isMobile ? 0 : "auto",
      height: isMobile ? "100vh" : "auto",
      transform: isMobile && sidebarOpen ? "translateX(0)" : isMobile ? "translateX(-100%)" : "none",
      transition: isMobile ? "transform 0.3s cubic-bezier(0.4,0,0.2,1)" : "none",
      boxShadow: isMobile && sidebarOpen ? "4px 0 30px rgba(0,0,0,0.5)" : "none",
    },
    main: { 
      flex:1, 
      marginLeft: isMobile ? 0 : 280, 
      padding: isMobile ? "20px" : "40px 60px", 
      display:"flex", 
      flexDirection:"column", 
      gap:30, 
      overflowY:"auto",
      width: "100%",
    },
    navBtn: (active, blink) => ({ 
      width:"100%", 
      padding:"14px 20px", 
      marginBottom:10, 
      borderRadius:16, 
      border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent", 
      background: active ? "linear-gradient(90deg,rgba(59,130,246,0.15),transparent)" : "transparent", 
      color: active ? "#3b82f6" : "#64748b", 
      fontSize:14, 
      fontWeight:700, 
      cursor:"pointer", 
      transition:"all 0.3s", 
      textAlign:"left", 
      display:"flex", 
      justifyContent:"space-between", 
      alignItems:"center", 
      ...(blink ? { animation:"navBlink 0.8s ease-in-out infinite" } : {}) 
    }),
    statCard: { background:"linear-gradient(135deg,rgba(30,41,59,0.4),rgba(15,23,42,0.4))", padding:25, borderRadius:28, border:"1px solid rgba(51,65,85,0.3)", backdropFilter:"blur(10px)", cursor:"default" },
    glass: { background:"rgba(15,23,42,0.3)", borderRadius:32, border:"1px solid rgba(51,65,85,0.3)", padding:30, backdropFilter:"blur(40px)", boxShadow:"0 20px 40px rgba(0,0,0,0.2)", width: "100%" },
    input: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(51,65,85,0.5)", borderRadius:12, padding:"12px 16px", color:"white", fontSize:13, fontWeight:600, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
    label: { fontSize:10, fontWeight:800, letterSpacing:"1.5px", color:"#64748b", marginBottom:6, display:"block" },
    btnPrimary: { padding:"12px 24px", background:"linear-gradient(90deg,#3b82f6,#2563eb)", border:"none", borderRadius:12, color:"white", fontWeight:900, fontSize:13, cursor:"pointer" },
    btnDanger:  { padding:"8px 16px", background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", borderRadius:10, cursor:"pointer", fontSize:10, fontWeight:900 },
    btnSuccess: { padding:"8px 16px", background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", borderRadius:10, cursor:"pointer", fontSize:10, fontWeight:900 },
    chip: (active, color="#3b82f6") => ({
      padding:"6px 16px", borderRadius:20,
      border:`1px solid ${active ? color : "rgba(51,65,85,0.4)"}`,
      background: active ? color+"22" : "transparent",
      color: active ? color : "#64748b",
      fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit"
    }),
    mobileHamburger: {
      position: 'fixed', top: 16, left: 16, zIndex: 600,
      width: 42, height: 42, borderRadius: 12,
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(59,130,246,0.25)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 5, cursor: 'pointer', backdropFilter: 'blur(12px)',
    },
  };

  if (isLoading) return (
    <div style={{ ...S.page, alignItems:"center", justifyContent:"center", display: "flex" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48, height:48, border:"3px solid rgba(59,130,246,0.2)", borderTop:"3px solid #3b82f6", borderRadius:"50%", margin:"0 auto 20px", animation:"spin 1s linear infinite" }} />
        <p style={{ color:"#64748b", fontSize:13, fontWeight:700, letterSpacing:2 }}>ESTABLISHING LINK...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const monthLabel = calMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const calYear  = calMonth.getFullYear();
  const calMon   = calMonth.getMonth();
  const firstDay = new Date(calYear, calMon, 1).getDay();
  const lastDate = new Date(calYear, calMon + 1, 0).getDate();
  const todayISO = new Date().toISOString().split("T")[0];

  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= lastDate; d++) calCells.push(d);
  while (calCells.length < 42) calCells.push(null);

  const bookingsByDay = (day) => {
    if (!day) return [];
    const dayISO = new Date(calYear, calMon, day, 12).toISOString().split("T")[0];
    return allBookings.filter(b => {
      if (!b.check_in_date || !b.check_out_date) return false;
      if (b.status === "CANCELLED") return false;
      return b.check_in_date <= dayISO && b.check_out_date > dayISO;
    });
  };

  const goPrevMonth = () => setCalMonth(new Date(calYear, calMon - 1, 1));
  const goNextMonth = () => setCalMonth(new Date(calYear, calMon + 1, 1));
  const goToday     = () => { setCalMonth(new Date()); setCalSelectedDay(null); };

  const selectedDayBookings = bookingsByDay(calSelectedDay);

  const monthStats = (() => {
    const start = new Date(calYear, calMon, 1).toISOString().split("T")[0];
    const end   = new Date(calYear, calMon + 1, 0).toISOString().split("T")[0];
    const inMonth = allBookings.filter(b =>
      b.status !== "CANCELLED" &&
      b.check_in_date <= end && b.check_out_date >= start);
    const totalRevenue = inMonth.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    return { count: inMonth.length, revenue: totalRevenue };
  })();

  const openChatRooms = [...new Set(chats.map(c => c.room_number))];
  const navItems = [
    { key:"analytics",    label:"Analytics Overview", adminOnly:true },
    { key:"rooms",        label:"Suite Status Grid" },
    { key:"kitchen",      label:"Kitchen Orders",   blink:ordersBlink, count:activeOrders.length },
    { key:"chats",        label:"Guest Chats",       blink:chatsBlink,  count:openChatRooms.length },
    { key:"calls",        label:"Call Requests",     blink:callsBlink,  count:callRequests.length },
    { key:"reservations", label:"Reservations",      count:allBookings.filter(b => b.status === "ACTIVE").length },
    { key:"housekeeping", label:"Housekeeping",      count:rooms.filter(r => r.status === "CLEANING").length },
    { key:"reports",      label:"Daily Reports",     adminOnly:true },
    { key:"billing",      label:"Guest Billing",     adminOnly:true },
    { key:"catalog",      label:"Menu Catalog",      adminOnly:true },
    { key:"settings",     label:"System Assets",     adminOnly:true },
  ].filter(n => !n.adminOnly || isAdmin);

  return (
    <div style={S.page}>

      {/* Mobile hamburger */}
      {isMobile && (
        <button
          style={S.mobileHamburger}
          onClick={() => setSidebarOpen(s => !s)}
        >
          <div style={{ width:20, height:2, background: sidebarOpen ? '#3b82f6' : '#64748b', borderRadius:2, transform: sidebarOpen ? 'rotate(45deg) translate(5px,5px)' : 'none', transition:'all 0.3s' }} />
          <div style={{ width:20, height:2, background: sidebarOpen ? 'transparent' : '#64748b', borderRadius:2, transition:'all 0.3s' }} />
          <div style={{ width:20, height:2, background: sidebarOpen ? '#3b82f6' : '#64748b', borderRadius:2, transform: sidebarOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none', transition:'all 0.3s' }} />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, backdropFilter:'blur(2px)' }} />
      )}

      <style>{blinkKeyframes}</style>
      {/* ── HOUSEKEEPING CHECKLIST MODAL ── */}
      {hkModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
          onClick={() => setHkModal(null)}>
          <div style={{ background:"#0f172a", border:"1px solid rgba(245,158,11,0.3)", borderRadius:24, padding:32, maxWidth:480, width:"90%", position:"relative" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setHkModal(null)} style={{ position:"absolute", top:16, right:16, width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:16 }}>✕</button>
            <div style={{ fontSize:10, color:"#f59e0b", fontWeight:800, letterSpacing:2, marginBottom:6 }}>SUITE {hkModal}</div>
            <h3 style={{ fontSize:22, fontWeight:900, color:"#fff", margin:"0 0 6px" }}>Cleaning Checklist</h3>
            {(() => {
              const tasks = hkTasks[hkModal] || [];
              const done  = tasks.filter(t => t.completed).length;
              const allDone = tasks.length > 0 && done === tasks.length;
              return (
                <>
                  <p style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>{done} of {tasks.length} tasks completed</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                    {(tasks.length > 0 ? tasks : HK_ITEMS.map((name,i) => ({ id:i, task_name:name, completed:false }))).map(task => (
                      <div key={task.id}
                        onClick={() => task.id && typeof task.id === "number" && task.id > 100 ? null : toggleTask(task)}
                        style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12,
                          background: task.completed ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${task.completed ? "rgba(16,185,129,0.25)" : "rgba(51,65,85,0.3)"}`,
                          cursor:"pointer", transition:"all 0.2s" }}>
                        <div style={{ width:22, height:22, borderRadius:6,
                          background: task.completed ? "#10b981" : "transparent",
                          border: `2px solid ${task.completed ? "#10b981" : "#475569"}`,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {task.completed && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:14, color: task.completed ? "#10b981" : "#cbd5e1", fontWeight:600,
                          textDecoration: task.completed ? "line-through" : "none" }}>
                          {task.task_name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {allDone && (
                    <button onClick={() => markRoomVacant(hkModal)}
                      style={{ width:"100%", padding:16, borderRadius:14, background:"linear-gradient(135deg,#10b981,#059669)", border:"none", color:"#fff", fontSize:13, fontWeight:800, letterSpacing:1, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 24px rgba(16,185,129,0.3)" }}>
                      ✓ All Done — Mark Suite {hkModal} VACANT
                    </button>
                  )}
                  {!allDone && tasks.length === 0 && (
                    <button onClick={() => startCleaning(hkModal)}
                      style={{ width:"100%", padding:16, borderRadius:14, background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.4)", color:"#f59e0b", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                      🧹 Start — Create Checklist
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title || "Confirm"}
        message={confirmDialog?.message}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* ── SIDEBAR ── */}
      <aside style={{
        ...S.sidebar,
        ...(isMobile ? {
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 500,
          boxShadow: sidebarOpen ? '4px 0 30px rgba(0,0,0,0.5)' : 'none',
        } : {}),
      }}>
        <div>
          <div style={{ marginBottom:50, paddingLeft:10 }}>
            <h1 style={{ fontSize:22, fontWeight:900, margin:0, letterSpacing:3, background:"linear-gradient(to right,#fff,#3b82f6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>STAYPILOT</h1>
            <p style={{ fontSize:10, color:"#3b82f6", fontWeight:800, letterSpacing:1, marginTop:4 }}>OS v2.0 | {isAdmin ? "COMMAND" : "STAFF"}</p>
          </div>
          <nav>
            {navItems.map(n => (
             <button key={n.key} onClick={() => { setActiveTab(n.key); if(n.key==="kitchen") setNewOrderCount(0); if(isMobile) setSidebarOpen(false);; if(n.key==="kitchen") setNewOrderCount(0); }} style={S.navBtn(activeTab===n.key, n.blink)}>
                <span>{n.label}</span>
                {n.count > 0 && (
                  <span style={{ background:n.blink?"#f59e0b":"rgba(245,158,11,0.15)", color:n.blink?"#000":"#f59e0b", border:"1px solid rgba(245,158,11,0.4)", borderRadius:20, fontSize:10, fontWeight:900, padding:"2px 9px", animation:n.blink?"badgePulse 0.8s ease-in-out infinite":"none" }}>
                    {n.count}
                  </span>
                )}
              </button>
            ))}
            <button onClick={() => { setActiveTab("requests"); setServiceRequestCount(0); setRequestsBlink(false); }}
              style={S.navBtn(activeTab==="requests", requestsBlink)}>
              <span>Service Requests</span>
              {serviceRequestCount > 0 && (
                <span style={{ background:requestsBlink?"#f59e0b":"rgba(245,158,11,0.15)", color:requestsBlink?"#000":"#f59e0b", border:"1px solid rgba(245,158,11,0.4)", borderRadius:20, fontSize:10, fontWeight:900, padding:"2px 9px", animation:requestsBlink?"badgePulse 0.8s ease-in-out infinite":"none" }}>
                  {serviceRequestCount}
                </span>
              )}
            </button>
            {isAdmin && (
              <div style={{ marginTop:20, borderTop:"1px solid rgba(51,65,85,0.3)", paddingTop:20 }}>
                <button onClick={() => navigate("/book")} style={{ ...S.navBtn(false, false), color:"#3b82f6", border:"1px solid rgba(59,130,246,0.2)" }}>
                  + New Reservation
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Legend */}
        <div style={{ marginBottom:20 }}>
          <small style={{ color:"#334155", fontSize:9, fontWeight:800, letterSpacing:2, display:"block", marginBottom:10 }}>STATUS KEY</small>
          {[["Vacant","#3b82f6"],["Occupied","#10b981"],["Cleaning","#f59e0b"],["Maintenance","#ef4444"]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c }} />
              <span style={{ fontSize:11, color:"#475569", fontWeight:700 }}>{l}</span>
            </div>
          ))}
          {isAdmin && (
            <div style={{ marginTop:16, padding:"12px 16px", borderRadius:12, background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize:10, color:"#10b981", fontWeight:800, letterSpacing:1 }}>PAID REVENUE</div>
              <div style={{ fontSize:20, fontWeight:900, color:"white", marginTop:4 }}>${totalRevenue.toLocaleString()}</div>
            </div>
          )}
          {isStaff && (
            <div style={{ marginTop:16, padding:"12px 16px", borderRadius:12, background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.2)" }}>
              <div style={{ fontSize:10, color:"#3b82f6", fontWeight:800, letterSpacing:1 }}>SIGNED IN AS</div>
              <div style={{ fontSize:13, fontWeight:900, color:"white", marginTop:4 }}>{userName}</div>
              <div style={{ fontSize:9, color:"#64748b", fontWeight:700, marginTop:2, letterSpacing:1 }}>STAFF · LIMITED ACCESS</div>
            </div>
          )}
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); navigate("/staff-portal"); }}
          style={{ background:"rgba(239,68,68,0.05)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.2)", padding:"14px 24px", borderRadius:16, fontWeight:700, fontSize:13, cursor:"pointer", width:"100%", marginBottom:30 }}>
          Terminate Session
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={S.main}>
        {/* Your existing content */}
      </main>

      {/* ── GUEST SLIDE-OVER (admin only) ── */}
      {isAdmin && (
        <div style={{
          position:"fixed",
          right: selectedGuest ? 0 : "-100%",
          top: 0,
          width: isMobile ? "100%" : 420,
          height:"100vh",
          background:"rgba(15,23,42,0.95)",
          borderLeft:"1px solid rgba(59,130,246,0.2)",
          boxShadow:"-20px 0 60px rgba(0,0,0,0.8)",
          zIndex:100,
          transition:"0.5s cubic-bezier(0.19,1,0.22,1)",
          padding:isMobile ? "20px" : "60px 40px",
          display:"flex",
          flexDirection:"column",
          backdropFilter:"blur(30px)",
          overflowY:"auto"
        }}>
          {selectedGuest && (
            <>
              {/* Your guest slide content */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
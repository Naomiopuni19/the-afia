import { useIsMobile, useDashboardStyles } from "../hooks/useDashboardStyles";
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

  const [activeTab,    setActiveTab]    = useState("kitchen"); // safe default for both roles
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
const isMobile = useIsMobile();
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
    
 
  // Mark a call request as called
  const markCallResolved = async (id, roomNumber) => {
    const { error } = await supabase.from("call_requests").update({ status: "called" }).eq("id", id);
    if (error) { addToast("Failed to mark called", "error"); return; }
    addLog(`Call to Suite ${roomNumber} marked as called`);
    addToast(`Suite ${roomNumber} marked as called`, "success");
    fetchCallRequests();
  };
 
  // Close a chat thread from staff side
  const closeChatThread = async (roomNumber) => {
    await supabase.from("staff_chats")
      .update({ thread_status: "closed", handled: true })
      .eq("room_number", roomNumber)
      .eq("thread_status", "open");
    if (activeChatRoom === roomNumber) setActiveChatRoom(null);
    addToast(`Chat with Suite ${roomNumber} closed`, "success");
    fetchChats();
  };
 
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
  const S = useDashboardStyles(isMobile);

  if (isLoading) return (
    <div style={{ ...S.page, alignItems:"center", justifyContent:"center" }}>
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
        <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <h2 style={{ fontSize:36, fontWeight:900, margin:0, letterSpacing:-1 }}>{isAdmin ? "Elite Intelligence" : "Operations View"}</h2>
            <p style={{ color:"#64748b", margin:"5px 0 0", fontSize:14, fontWeight:600 }}>
              {isAdmin ? "Admin Root Access" : `Staff View · ${userName}`} · <span style={{ color:"#3b82f6" }}>{currentTime}</span>
            </p>
          </div>
          <div style={{ color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"8px 24px", borderRadius:50, fontSize:11, fontWeight:900, border:"1px solid rgba(16,185,129,0.2)", letterSpacing:1 }}>
            ENCRYPTED UPLINK
          </div>
        </header>

        {/* ══ ANALYTICS ══ (admin only) */}
        {activeTab === "analytics" && isAdmin && (
          <>
            <div style={{ ...S.analyticsStats }}>
              {[
                { label:"DAILY ORDERS", value:activeOrders.length, color:"#f59e0b" },
                { label:"OCCUPANCY",    value:`${occupancyRate}%`,  color:"#3b82f6" },
                { label:"VIP PATRONS",  value:vipCount,             color:"#f59e0b" },
                { label:"REVENUE",      value:`$${totalRevenue.toLocaleString()}`, color:"#10b981" },
              ].map(({ label, value, color }) => (
                <div key={label} style={S.statCard} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-5px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                  <small style={{ color:"#64748b", fontWeight:800, fontSize:10, letterSpacing:"1.5px" }}>{label}</small>
                  <h3 style={{ fontSize:32, margin:"10px 0 0", fontWeight:900, color }}>{value}</h3>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr", gap:30 }}>
              <div style={S.glass}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:25 }}>
                  <h4 style={{ margin:0, fontWeight:900, fontSize:16 }}>Guest Manifest</h4>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <input type="text" value={guestFilter} onChange={e=>setGuestFilter(e.target.value)} placeholder="Filter guests..." style={{ ...S.input, width:200 }} />
                    <span style={{ fontSize:10, color:"#475569", fontWeight:800, whiteSpace:"nowrap" }}>{filteredBookings.length} RECORDS</span>
                  </div>
                </div>
                <div style={{ maxHeight:400, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ color:"#475569", fontSize:11, textAlign:"left", borderBottom:"1px solid rgba(51,65,85,0.5)" }}>
                        {["GUEST IDENTITY","LOCATION","ORDERS","PROCEDURE"].map(h => <th key={h} style={{ paddingBottom:15, paddingRight:10 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => {
                        const guestOrders = orders.filter(o => o.room_number?.toString()===b.room_number?.toString() && !["completed","cancelled"].includes(o.status));
                        return (
                          <tr key={b.id} onClick={() => setSelectedGuest(b)} style={{ borderBottom:"1px solid rgba(51,65,85,0.2)", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"18px 0", fontSize:14 }}>
                              <span style={{ fontWeight:700, color:b.is_vip?"#f59e0b":"white" }}>{b.guest_name}</span>
                              {b.is_vip && <span style={{ background:"linear-gradient(45deg,#f59e0b,#fbbf24)", color:"#000", padding:"3px 8px", borderRadius:6, fontSize:9, fontWeight:900, marginLeft:8 }}>VIP</span>}
                            </td>
                            <td style={{ color:"#3b82f6", fontWeight:800, fontSize:13 }}>SUITE {b.room_number}</td>
                            <td style={{ fontSize:12 }}>
                              {guestOrders.length > 0
                                ? <span style={{ color:"#f59e0b", fontWeight:800 }}>{guestOrders.length} active</span>
                                : <span style={{ color:"#475569" }}>—</span>}
                            </td>
                            <td style={{ textAlign:"right" }}>
                              <button onClick={e=>{ e.stopPropagation(); setConfirmDialog({ title:"Authorize Check-Out", message:`Check-out ${b.guest_name} from Suite ${b.room_number}?`, onConfirm:()=>handleCheckOut(b.id,b.room_number) }); }} style={S.btnDanger}>CHECK-OUT</button>
                            </td>
                          </tr>
                        );
                      })}
                      {!filteredBookings.length && <tr><td colSpan="4" style={{ padding:40, textAlign:"center", color:"#475569", fontSize:14 }}>{guestFilter ? "No match." : "No active guests."}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:30 }}>
                <div style={S.glass}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                    <h4 style={{ fontSize:11, color:"#94a3b8", margin:0, letterSpacing:"1.5px", fontWeight:800 }}>REAL-TIME GRID</h4>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:8 }}>
                    {rooms.map(r => (
                      <div key={r.id} title={`Suite ${r.id} — ${r.status}`}
                        style={{ width:"100%", paddingBottom:"100%", background:r.color, borderRadius:6, cursor:"pointer", transition:"all 0.2s" }}
                        onClick={() => { setRoomSearch(r.id); setActiveTab("rooms"); }}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />
                    ))}
                  </div>
                </div>
                <div style={{ ...S.glass, flex:1 }}>
                  <small style={{ color:"#64748b", fontWeight:800, fontSize:9, letterSpacing:2, marginBottom:15, display:"block" }}>ACTIVITY LOG</small>
                  {logs.map((log,i) => (
                    <div key={i} style={{ fontSize:11, marginBottom:10, display:"flex", gap:10, opacity:1-i*0.1 }}>
                      <span style={{ color:"#3b82f6", fontWeight:800 }}>[{log.time}]</span>
                      <span style={{ color:"#94a3b8" }}>{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 0.8fr", gap:30 }}>
              <div style={S.glass}>
                <h4 style={{ fontSize:11, color:"#94a3b8", marginBottom:25, letterSpacing:"1.5px", fontWeight:900 }}>BOOKINGS & ORDERS TREND</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="day" tick={{ fill:"#475569", fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#475569", fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={3} dot={{ fill:"#3b82f6", r:4 }} name="Bookings" />
                    <Line type="monotone" dataKey="orders"   stroke="#f59e0b" strokeWidth={3} dot={{ fill:"#f59e0b", r:4 }} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={S.glass}>
                <h4 style={{ fontSize:11, color:"#94a3b8", marginBottom:25, letterSpacing:"1.5px", fontWeight:900 }}>ORDER STATUS BREAKDOWN</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={Object.entries(ORDER_LABELS).map(([k,v])=>({ name:v, count:orders.filter(o=>o.status===k).length }))} barSize={24}>
                    <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#475569", fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.glass}>
                <h4 style={{ fontSize:11, color:"#94a3b8", marginBottom:15, letterSpacing:"1.5px", fontWeight:900 }}>SUITE ALLOCATION</h4>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0} paddingAngle={5}>
                      {donutData.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:15 }}>
                  {donutData.map((d,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:9, color:"#94a3b8", fontWeight:800 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:d.color }} />
                      {d.name.toUpperCase()} <span style={{ color:"white" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ KITCHEN / ORDERS ══ */}
        {activeTab === "kitchen" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <h3 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:-1 }}>Kitchen Orders</h3>
                <p style={{ color:"#64748b", margin:"4px 0 0", fontSize:13 }}>{activeOrders.length} active · {orders.filter(o=>o.status==="completed").length} completed today</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {[["all","All"],["active","Active"],["completed","Done"]].map(([k,l]) => (
                  <button key={k} style={S.chip(kitchenFilter===k, "#3b82f6")} onClick={()=>setKitchenFilter(k)}>{l}</button>
                ))}
              </div>
            </div>

           <div style={{  ...S.kitchenGrid }}>
             {["pending","accepted","preparing","ready"].map(stage => {
                const stageOrders = displayedOrders.filter(o => o.status === stage);
                return (
                  <div key={stage}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:ORDER_COLORS[stage] }} />
                      <span style={{ fontSize:12, fontWeight:800, letterSpacing:1, color:ORDER_COLORS[stage] }}>{ORDER_LABELS[stage].toUpperCase()}</span>
                      <span style={{ fontSize:11, color:"#475569", marginLeft:"auto" }}>{stageOrders.length}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      {stageOrders.map(order => (
                        <div key={order.id} style={{ background:"rgba(15,23,42,0.6)", border:`1px solid ${ORDER_COLORS[order.status]}33`, borderRadius:20, padding:20, backdropFilter:"blur(10px)" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                            <div>
                              <div style={{ fontSize:11, color:"#64748b", fontWeight:700 }}>ORDER #{order.id}</div>
                              <div style={{ fontSize:16, fontWeight:900, color:"white" }}>SUITE {order.room_number}</div>
                              <div style={{ fontSize:12, color:"#94a3b8" }}>{order.guest_name}</div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              {isAdmin && <div style={{ fontSize:18, fontWeight:900, color:"#10b981" }}>${order.total_amount?.toFixed(2)}</div>}
                              <div style={{ fontSize:10, color:"#475569" }}>{new Date(order.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                            </div>
                          </div>

                          <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10, marginBottom:14 }}>
                            {(Array.isArray(order.items) ? order.items : JSON.parse(order.items||"[]")).map((item,i) => (
                              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#cbd5e1", marginBottom:4 }}>
                                <span>{item.qty}× {item.name}</span>
                                {isAdmin && <span style={{ color:"#94a3b8" }}>${(item.price*item.qty).toFixed(2)}</span>}
                              </div>
                            ))}
                            {order.notes && <p style={{ fontSize:11, color:"#f59e0b", marginTop:8, fontStyle:"italic" }}>Note: {order.notes}</p>}
                          </div>

                          <div style={{ display:"flex", gap:8 }}>
                            {nextStatus(order.status) && nextStatus(order.status) !== "completed" && (
                              <button onClick={()=>updateOrderStatus(order.id, nextStatus(order.status), order.room_number)}
                                style={{ flex:1, padding:"10px", borderRadius:12, background: ORDER_COLORS[nextStatus(order.status)]+"22", border:`1px solid ${ORDER_COLORS[nextStatus(order.status)]}55`, color:ORDER_COLORS[nextStatus(order.status)], fontSize:11, fontWeight:900, cursor:"pointer" }}>
                                → {ORDER_LABELS[nextStatus(order.status)]}
                              </button>
                            )}
                            {order.status === "ready" && (
                              <button onClick={()=>updateOrderStatus(order.id,"delivered",order.room_number)}
                                style={{ flex:1, padding:"10px", borderRadius:12, background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.4)", color:"#10b981", fontSize:11, fontWeight:900, cursor:"pointer" }}>
                                ✓ Mark Delivered
                              </button>
                            )}
                            {order.status === "pending" && (
                              <button onClick={()=>updateOrderStatus(order.id,"accepted",order.room_number)}
                                style={{ flex:1, padding:"10px", borderRadius:12, background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.4)", color:"#3b82f6", fontSize:11, fontWeight:900, cursor:"pointer" }}>
                                ✓ Accept Order
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {!stageOrders.length && (
                        <div style={{ textAlign:"center", padding:"30px 20px", color:"#334155", fontSize:13, border:"1px dashed rgba(51,65,85,0.3)", borderRadius:20 }}>No {ORDER_LABELS[stage].toLowerCase()} orders</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={S.glass}>
              <h4 style={{ margin:"0 0 20px", fontWeight:900 }}>Delivered & Completed</h4>
              <div style={{ maxHeight:300, overflowY:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ fontSize:10, color:"#475569", borderBottom:"1px solid rgba(51,65,85,0.4)" }}>
                      {(isAdmin ? ["ORDER","SUITE","GUEST","ITEMS","TOTAL","STATUS","PAYMENT","TIME"] : ["ORDER","SUITE","GUEST","ITEMS","STATUS","TIME"]).map(h=><th key={h} style={{ paddingBottom:12, textAlign:"left", fontWeight:800 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o=>["delivered","completed"].includes(o.status)).map(o=>(
                      <tr key={o.id} style={{ borderBottom:"1px solid rgba(51,65,85,0.2)", fontSize:13 }}>
                        <td style={{ padding:"12px 0", fontWeight:800 }}>#{o.id}</td>
                        <td style={{ color:"#3b82f6", fontWeight:700 }}>Suite {o.room_number}</td>
                        <td style={{ color:"#94a3b8" }}>{o.guest_name}</td>
                        <td style={{ color:"#94a3b8" }}>{Array.isArray(o.items)?o.items.length:"-"} items</td>
                        {isAdmin && <td style={{ color:"#10b981", fontWeight:900 }}>${o.total_amount?.toFixed(2)}</td>}
                        <td><StatusBadge status={o.status} /></td>
                        {isAdmin && (
                          <td>
                            <span style={{ fontSize:10, fontWeight:800, color:o.payment_status==="paid"?"#10b981":"#f59e0b" }}>
                              {o.payment_status==="paid" ? "✓ PAID" : "UNPAID"}
                            </span>
                          </td>
                        )}
                        <td style={{ color:"#475569", fontSize:11 }}>{new Date(o.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</td>
                      </tr>
                    ))}
                    {!orders.filter(o=>["delivered","completed"].includes(o.status)).length && (
                      <tr><td colSpan={isAdmin ? "8" : "6"} style={{ padding:30, textAlign:"center", color:"#475569" }}>No completed orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ BILLING ══ (admin only) */}
        {activeTab === "billing" && isAdmin && (
          <>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:-1 }}>Guest Billing</h3>
              <p style={{ color:"#64748b", margin:"4px 0 0", fontSize:13 }}>View outstanding balances and process payments</p>
            </div>

            <div style={{  ...S.billingStats }}>
              {[
                { label:"TOTAL UNPAID", value:`$${orders.filter(o=>o.payment_status==="unpaid"&&["delivered","completed"].includes(o.status)).reduce((s,o)=>s+(o.total_amount||0),0).toFixed(2)}`, color:"#ef4444" },
                { label:"TOTAL PAID",   value:`$${totalRevenue.toFixed(2)}`, color:"#10b981" },
                { label:"ACTIVE ROOMS", value:statusCounts.OCCUPIED, color:"#3b82f6" },
              ].map(({ label, value, color }) => (
                <div key={label} style={S.statCard}>
                  <small style={{ color:"#64748b", fontWeight:800, fontSize:10, letterSpacing:"1.5px" }}>{label}</small>
                  <h3 style={{ fontSize:30, margin:"10px 0 0", fontWeight:900, color }}>{value}</h3>
                </div>
              ))}
            </div>

            <div style={{ ...S.glass, marginBottom:20 }}>
              <h4 style={{ margin:"0 0 20px", fontWeight:900 }}>Room Ledger Lookup</h4>
              <div style={{ display:"flex", gap:12, marginBottom:20 }}>
                <input value={ledgerRoom} onChange={e=>setLedgerRoom(e.target.value)} placeholder="Enter room number (e.g. 101)" style={{ ...S.input, width:300 }} />
                <button onClick={()=>fetchLedger(ledgerRoom)} style={S.btnPrimary}>Fetch Ledger</button>
              </div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20, minWidth: isMobile ? "60px" : "auto" }}>
                {bookings.map(b => (
                  <button key={b.id} onClick={()=>{ setLedgerRoom(b.room_number?.toString()); fetchLedger(b.room_number?.toString()); }}
                    style={{ padding:"6px 14px", borderRadius:10, border:"1px solid rgba(59,130,246,0.3)", background:"rgba(59,130,246,0.08)", color:"#3b82f6", fontSize:12, fontWeight:800, cursor:"pointer" }}>
                    Suite {b.room_number} — {b.guest_name}
                  </button>
                ))}
              </div>

              {ledgerLoading && <div style={{ textAlign:"center", padding:20, color:"#64748b" }}>Loading...</div>}

              {!ledgerLoading && ledgerData.length > 0 && (
                <>
                  <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:20 }}>
                    <thead>
                      <tr style={{ fontSize:10, color:"#475569", borderBottom:"1px solid rgba(51,65,85,0.4)" }}>
                        {["DESCRIPTION","ORDER #","AMOUNT","STATUS","DATE"].map(h=><th key={h} style={{ paddingBottom:12, textAlign:"left", fontWeight:800 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerData.map(entry => (
                        <tr key={entry.id} style={{ borderBottom:"1px solid rgba(51,65,85,0.2)", fontSize:13 }}>
                          <td style={{ padding:"12px 0" }}>{entry.description}</td>
                          <td style={{ color:"#3b82f6" }}>{entry.order_id ? `#${entry.order_id}` : "—"}</td>
                          <td style={{ color:"#10b981", fontWeight:900 }}>${entry.amount?.toFixed(2)}</td>
                          <td><span style={{ fontSize:10, fontWeight:800, color:entry.status==="paid"?"#10b981":"#f59e0b" }}>{entry.status==="paid"?"✓ PAID":"PENDING"}</span></td>
                          <td style={{ fontSize:11, color:"#475569" }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"rgba(16,185,129,0.05)", borderRadius:16, border:"1px solid rgba(16,185,129,0.2)" }}>
                    <div>
                      <div style={{ fontSize:12, color:"#64748b", fontWeight:700 }}>TOTAL OUTSTANDING — Suite {ledgerRoom}</div>
                      <div style={{ fontSize:28, fontWeight:900, color:"white" }}>${ledgerData.reduce((s,e)=>s+e.amount,0).toFixed(2)}</div>
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      {["cash","card","room_charge"].map(method => (
                        <button key={method} onClick={()=>setConfirmDialog({ title:"Settle Bill", message:`Mark Suite ${ledgerRoom} bill as paid via ${method}?`, onConfirm:()=>handleSettleLedger(ledgerRoom,method) })}
                          style={{ padding:"10px 18px", borderRadius:12, border:"1px solid rgba(16,185,129,0.3)", background:"rgba(16,185,129,0.08)", color:"#10b981", fontWeight:800, fontSize:12, cursor:"pointer" }}>
                          {method === "room_charge" ? "Room Charge" : method.charAt(0).toUpperCase()+method.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!ledgerLoading && ledgerData.length === 0 && ledgerRoom && (
                <div style={{ textAlign:"center", padding:30, color:"#475569" }}>No outstanding charges for Suite {ledgerRoom}.</div>
              )}
            </div>

            <div style={S.glass}>
              <h4 style={{ margin:"0 0 20px", fontWeight:900 }}>All Unpaid Orders</h4>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {orders.filter(o=>o.payment_status==="unpaid"&&["delivered","completed"].includes(o.status)).map(o=>(
                  <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderRadius:16, background:"rgba(245,158,11,0.04)", border:"1px solid rgba(245,158,11,0.15)" }}>
                    <div>
                      <span style={{ fontWeight:800 }}>Suite {o.room_number}</span>
                      <span style={{ color:"#64748b", fontSize:12, marginLeft:12 }}>{o.guest_name}</span>
                      <span style={{ color:"#94a3b8", fontSize:11, marginLeft:12 }}>Order #{o.id}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                      <span style={{ fontSize:20, fontWeight:900, color:"#f59e0b" }}>${o.total_amount?.toFixed(2)}</span>
                      <button onClick={()=>{ setLedgerRoom(o.room_number?.toString()); fetchLedger(o.room_number?.toString()); setActiveTab("billing"); }}
                        style={{ ...S.btnSuccess, fontSize:11 }}>View Ledger</button>
                    </div>
                  </div>
                ))}
                {!orders.filter(o=>o.payment_status==="unpaid"&&["delivered","completed"].includes(o.status)).length && (
                  <div style={{ textAlign:"center", padding:30, color:"#475569" }}>All clear — no unpaid orders.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══ MENU CATALOG ══ (admin only) */}
        {activeTab === "catalog" && isAdmin && (
          <>
            <div style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:-1 }}>Menu Catalog</h3>
              <p style={{ color:"#64748b", margin:"4px 0 0", fontSize:13 }}>Items appear in real-time on the guest ordering page</p>
            </div>

            <div style={S.glass}>
              <h4 style={{ margin:"0 0 20px", fontWeight:900 }}>{editingMenu ? "✏ Edit Item" : "+ Add New Item"}</h4>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <label style={S.label}>ITEM NAME *</label>
                  <input value={menuForm.name} onChange={e=>setMenuForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Grilled Wagyu Beef" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>PRICE (USD) *</label>
                  <input type="number" value={menuForm.price} onChange={e=>setMenuForm(f=>({...f,price:e.target.value}))} placeholder="0.00" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>CATEGORY</label>
                  <select value={menuForm.category} onChange={e=>setMenuForm(f=>({...f,category:e.target.value}))} style={{ ...S.input, appearance:"none" }}>
                    {["Starter","Main","Dessert","Drinks","Special"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>IMAGE URL (or upload below)</label>
                  <input value={menuForm.image_url} onChange={e=>setMenuForm(f=>({...f,image_url:e.target.value}))} placeholder="https://..." style={S.input} />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={S.label}>DESCRIPTION</label>
                  <textarea value={menuForm.description} onChange={e=>setMenuForm(f=>({...f,description:e.target.value}))} placeholder="Brief description of the dish..." rows={2} style={{ ...S.input, resize:"vertical" }} />
                </div>
                <div>
                  <label style={S.label}>UPLOAD IMAGE (Supabase Storage)</label>
                  <input type="file" accept="image/*" onChange={e=>setMenuImageFile(e.target.files[0])} style={{ ...S.input, cursor:"pointer" }} />
                  {menuImageFile && <div style={{ fontSize:11, color:"#10b981", marginTop:6 }}>✓ {menuImageFile.name} ready to upload</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <label style={{ ...S.label, margin:0 }}>AVAILABLE</label>
                  <div onClick={()=>setMenuForm(f=>({...f,is_available:!f.is_available}))}
                    style={{ width:48, height:26, borderRadius:13, background:menuForm.is_available?"#10b981":"rgba(51,65,85,0.5)", cursor:"pointer", position:"relative", transition:"all 0.3s" }}>
                    <div style={{ position:"absolute", top:3, left:menuForm.is_available?27:3, width:18, height:18, borderRadius:"50%", background:"white", transition:"all 0.3s" }} />
                  </div>
                  <span style={{ fontSize:12, color:menuForm.is_available?"#10b981":"#64748b", fontWeight:700 }}>{menuForm.is_available?"Active":"Hidden"}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:12, marginTop:24 }}>
                <button onClick={handleMenuSave} disabled={menuUploading} style={{ ...S.btnPrimary, opacity:menuUploading?0.6:1 }}>
                  {menuUploading ? "Uploading..." : editingMenu ? "Save Changes" : "Add to Menu"}
                </button>
                {editingMenu && (
                  <button onClick={()=>{ setEditingMenu(null); setMenuForm({ name:"", description:"", price:"", category:"Main", image_url:"", is_available:true }); setMenuImageFile(null); }}
                    style={{ padding:"12px 24px", background:"transparent", border:"1px solid rgba(51,65,85,0.4)", borderRadius:12, color:"#64748b", fontWeight:700, cursor:"pointer" }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {["Starter","Main","Dessert","Drinks","Special"].map(cat => {
              const catItems = menuItems.filter(m => m.category === cat);
              if (!catItems.length) return null;
              return (
                <div key={cat} style={S.glass}>
                  <h4 style={{ margin:"0 0 20px", fontWeight:900, fontSize:16 }}>
                    {cat} <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>({catItems.length} items)</span>
                  </h4>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
                    {catItems.map(item => (
                      <div key={item.id} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${item.is_available?"rgba(51,65,85,0.3)":"rgba(239,68,68,0.2)"}`, borderRadius:16, overflow:"hidden" }}>
                        {item.image_url && <img src={item.image_url} alt={item.name} style={{ width:"100%", height:140, objectFit:"cover" }} onError={e=>e.target.style.display="none"} />}
                        <div style={{ padding:16 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>{item.name}</div>
                              <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>{item.description}</div>
                            </div>
                            <div style={{ fontSize:20, fontWeight:900, color:"#10b981", marginLeft:12 }}>${item.price}</div>
                          </div>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <span style={{ fontSize:10, fontWeight:800, color:item.is_available?"#10b981":"#ef4444", padding:"2px 8px", borderRadius:6, background:item.is_available?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${item.is_available?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}` }}>
                              {item.is_available?"ACTIVE":"HIDDEN"}
                            </span>
                            <button onClick={()=>handleMenuEdit(item)} style={{ padding:"4px 12px", borderRadius:8, background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", color:"#3b82f6", fontSize:11, fontWeight:800, cursor:"pointer", marginLeft:"auto" }}>Edit</button>
                            <button onClick={()=>handleMenuToggle(item.id,item.is_available)} style={{ padding:"4px 12px", borderRadius:8, background:"transparent", border:"1px solid rgba(51,65,85,0.4)", color:"#64748b", fontSize:11, fontWeight:800, cursor:"pointer" }}>
                              {item.is_available?"Hide":"Show"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!menuItems.length && (
              <div style={{ ...S.glass, textAlign:"center", padding:60 }}>
                <div style={{ fontSize:40, marginBottom:16, opacity:0.3 }}>🍽</div>
                <p style={{ color:"#475569", fontWeight:700 }}>No menu items yet. Add your first item above.</p>
              </div>
            )}
          </>
        )}

        {/* ══ ROOMS TAB ══ */}
        {activeTab === "rooms" && (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:40, overflow:"hidden", position:"relative", background:'url("https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=2071") center/cover', minHeight:600 }}>
            <div style={{ position:"absolute", inset:0, background:"rgba(2,6,23,0.85)", backdropFilter:"blur(12px)" }} />
            <div style={{ position:"relative", width:"100%", maxWidth:550, textAlign:"center", zIndex:2 }}>
              <h3 style={{ fontSize:32, fontWeight:900, marginBottom:5, letterSpacing:-1 }}>Asset Inspector</h3>
              <p style={{ color:"#64748b", fontSize:14, marginBottom:30 }}>Select a suite from the grid or enter ID</p>
              <input type="text" value={roomSearch} placeholder="ENTER SUITE ID (e.g. 101)"
                style={{ width:"100%", padding:25, borderRadius:24, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(59,130,246,0.5)", color:"white", textAlign:"center", fontSize:22, fontWeight:900, outline:"none", boxSizing:"border-box" }}
                onChange={e=>setRoomSearch(e.target.value)} />

              {!searchResult && (
                <div style={{ marginTop:20, display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                  {rooms.map(r => (
                    <button key={r.id} onClick={()=>setRoomSearch(r.id)}
                      style={{ padding:"6px 14px", borderRadius:10, cursor:"pointer", background:r.color+"15", border:`1px solid ${r.color}44`, color:r.color, fontSize:11, fontWeight:800 }}>
                      {r.id}
                    </button>
                  ))}
                </div>
              )}

              {searchResult && (
                <div style={{ marginTop:40, padding:45, borderRadius:40, background:"rgba(15,23,42,0.95)", border:`1px solid ${searchResult.color}55`, backdropFilter:"blur(30px)" }}>
                  <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:20, marginBottom:10 }}>
                    <h1 style={{ fontSize:84, margin:0, fontWeight:900, letterSpacing:-4 }}>{searchResult.id}</h1>
                    <div style={{ padding:"6px 15px", background:searchResult.color+"22", border:`1px solid ${searchResult.color}`, color:searchResult.color, borderRadius:10, fontSize:10, fontWeight:900 }}>{searchResult.status}</div>
                  </div>
                  {searchResult.status==="OCCUPIED" && (() => {
                    const guest = bookings.find(b=>b.room_number?.toString()===searchResult.id);
                    return guest ? <div style={{ margin:"0 0 20px", padding:"12px 20px", borderRadius:12, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", fontSize:13, color:"#10b981", fontWeight:700 }}>👤 {guest.guest_name}{guest.is_vip?" · VIP":""}</div> : null;
                  })()}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:15, marginTop:20 }}>
                    {[["MARK VACANT","VACANT","#3b82f6"],["MARK OCCUPIED","OCCUPIED","#10b981"],["CLEANING REQ.","CLEANING","#f59e0b"],["MAINTENANCE","MAINTENANCE","#ef4444"]].map(([label,status,color])=>(
                      <button key={status} onClick={()=>updateRoomStatus(searchResult.id,status)} disabled={searchResult.status===status}
                        style={{ padding:16, background:`${color}${searchResult.status===status?"25":"0d"}`, border:`1px solid ${searchResult.status===status?color:color+"44"}`, borderRadius:16, color:searchResult.status===status?color:"white", cursor:searchResult.status===status?"default":"pointer", fontWeight:800, fontSize:12 }}>
                        {searchResult.status===status ? `✓ ${label}` : label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {searchResult?.status === "CLEANING" && (
  <button
    onClick={() => startCleaning(searchResult.id)}
    style={{
      marginTop: 16, width: "100%", padding: "14px 0",
      borderRadius: 14, background: "rgba(245,158,11,0.15)",
      border: "1px solid rgba(245,158,11,0.4)",
      color: "#f59e0b", fontSize: 12, fontWeight: 800,
      letterSpacing: 1, cursor: "pointer", fontFamily: "inherit",
    }}>
    🧹 Open Cleaning Checklist
  </button>
)}

        {/* ══ SERVICE REQUESTS ══ */}
        {activeTab === "requests" && (
          <div style={S.glass}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:30 }}>
              <div>
                <h3 style={{ fontWeight:900, fontSize:24, letterSpacing:-1, margin:0 }}>Service Requests</h3>
                <p style={{ color:"#64748b", fontSize:13, marginTop:5 }}>{serviceRequests.length} pending</p>
              </div>
              <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", padding:"8px 20px", borderRadius:50, fontSize:11, fontWeight:900, letterSpacing:1 }}>LIVE FEED</div>
            </div>
            {serviceRequests.length === 0
              ? <div style={{ textAlign:"center", padding:"60px 0", color:"#475569" }}><div style={{ fontSize:40, marginBottom:15, opacity:0.4 }}>✓</div><p style={{ fontSize:14, fontWeight:700 }}>All clear — no pending requests</p></div>
              : serviceRequests.map(req => (
                <div key={req.id} style={{ padding:25, borderRadius:20, background:"rgba(245,158,11,0.03)", border:"1px solid rgba(245,158,11,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:15 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                      <span style={{ background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, fontSize:10, fontWeight:900, padding:"3px 10px" }}>SUITE {req.room_number||"—"}</span>
                      {req.request_type && <span style={{ fontSize:11, color:"#94a3b8", fontWeight:700 }}>{req.request_type.toUpperCase()}</span>}
                      <span style={{ fontSize:10, color:"#475569", marginLeft:"auto" }}>{req.created_at ? new Date(req.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : ""}</span>
                    </div>
                    <p style={{ margin:0, fontSize:14, color:"#cbd5e1" }}>{req.notes||req.description||"No details."}</p>
                  </div>
                  <button onClick={()=>handleResolveRequest(req.id)} style={{ ...S.btnSuccess, marginLeft:20, padding:"12px 20px", whiteSpace:"nowrap" }}>RESOLVE ✓</button>
                </div>
              ))
            }
          </div>
        )}
         {/* ══ GUEST CHATS ══ */}
        {activeTab === "chats" && (
          <div style={S.glass}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:30 }}>
              <div>
                <h3 style={{ fontWeight:900, fontSize:24, letterSpacing:-1, margin:0 }}>Guest Chats</h3>
                <p style={{ color:"#64748b", fontSize:13, marginTop:5 }}>
                  {openChatRooms.length} active {openChatRooms.length === 1 ? "thread" : "threads"}
                </p>
              </div>
              <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", padding:"8px 20px", borderRadius:50, fontSize:11, fontWeight:900, letterSpacing:1 }}>LIVE</div>
            </div>
 
            {openChatRooms.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#475569" }}>
                <div style={{ fontSize:40, marginBottom:15, opacity:0.4 }}>💬</div>
                <p style={{ fontSize:14, fontWeight:700 }}>No active chats — all clear</p>
              </div>
            ) : (
              <div style={{ ...S.chatsGrid}}>
                {/* Left column: thread list */}
                <div style={{ background:"rgba(15,23,42,0.4)", borderRadius:20, border:"1px solid rgba(51,65,85,0.3)", padding:14, overflowY:"auto", maxHeight:600 }}>
                  {openChatRooms.map(room => {
                    const threadMessages = chats.filter(c => c.room_number === room);
                    const lastMessage = threadMessages[threadMessages.length - 1];
                    const guestName = threadMessages.find(m => m.guest_name)?.guest_name || "Guest";
                    const isActive = activeChatRoom === room;
                    const hasUnread = lastMessage?.sender === "guest";
                    return (
                      <div key={room}
                        onClick={() => setActiveChatRoom(room)}
                        style={{
                          padding:14, marginBottom:8, borderRadius:14, cursor:"pointer",
                          background: isActive ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isActive ? "rgba(59,130,246,0.4)" : "rgba(51,65,85,0.3)"}`,
                          transition:"all 0.2s",
                        }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <span style={{ fontSize:11, fontWeight:900, color:"#3b82f6", letterSpacing:1 }}>SUITE {room}</span>
                          {hasUnread && <span style={{ width:8, height:8, background:"#f59e0b", borderRadius:"50%", animation:"pulse 1.5s ease-in-out infinite" }} />}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:4 }}>{guestName}</div>
                        <div style={{ fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {lastMessage?.sender === "staff" ? "You: " : ""}{lastMessage?.message}
                        </div>
                        <div style={{ fontSize:9, color:"#475569", marginTop:6 }}>
                          {lastMessage?.created_at ? new Date(lastMessage.created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
 
                {/* Right column: conversation */}
                <div style={{ background:"rgba(15,23,42,0.4)", borderRadius:20, border:"1px solid rgba(51,65,85,0.3)", display:"flex", flexDirection:"column", maxHeight:600 }}>
                  {!activeChatRoom ? (
                    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#475569", fontSize:13 }}>
                      Select a thread to view the conversation
                    </div>
                  ) : (
                    <>
                      <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(51,65,85,0.3)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:900, color:"#3b82f6", letterSpacing:1 }}>SUITE {activeChatRoom}</div>
                          <div style={{ fontSize:14, fontWeight:700, marginTop:2 }}>
                            {chats.find(c => c.room_number === activeChatRoom && c.guest_name)?.guest_name || "Guest"}
                          </div>
                        </div>
                        <button onClick={() => closeChatThread(activeChatRoom)} style={{ ...S.btnDanger, padding:"8px 14px" }}>
                          CLOSE THREAD
                        </button>
                      </div>
 
                      <div style={{ flex:1,  padding: isMobile ? '16px' : '40px',
  paddingTop: isMobile ? '70px' : '40px', overflowY:"auto", display:"flex", flexDirection:"column", gap:10 }}>
                        {chats.filter(c => c.room_number === activeChatRoom).map(m => (
                          <div key={m.id} style={{ display:"flex", justifyContent: m.sender === "staff" ? "flex-end" : "flex-start" }}>
                            <div style={{
                              maxWidth:"75%", padding:"10px 14px", fontSize:13, lineHeight:1.5,
                              borderRadius: m.sender === "staff" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                              background: m.sender === "staff" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.12)",
                              border: `1px solid ${m.sender === "staff" ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.25)"}`,
                            }}>
                              <div style={{ fontSize:9, fontWeight:800, marginBottom:4, letterSpacing:1, textTransform:"uppercase",
                                color: m.sender === "staff" ? "#10b981" : "#3b82f6" }}>
                                {m.sender === "staff" ? "You · Staff" : m.guest_name || "Guest"}
                              </div>
                              {m.message}
                              <div style={{ fontSize:9, color:"#475569", marginTop:4 }}>
                                {new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
 
                      <div style={{ padding:14, borderTop:"1px solid rgba(51,65,85,0.3)", display:"flex", gap:10 }}>
                        <input
                          value={chatReplyInput}
                          onChange={e => setChatReplyInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && sendChatReply()}
                          placeholder="Type your reply to the guest..."
                          style={{ ...S.input, flex:1 }}
                        />
                        <button onClick={sendChatReply} style={{ ...S.btnPrimary, padding:"10px 20px" }}>
                          SEND
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
 
        {/* ══ CALL REQUESTS ══ */}
        {activeTab === "calls" && (
          <div style={S.glass}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:30 }}>
              <div>
                <h3 style={{ fontWeight:900, fontSize:24, letterSpacing:-1, margin:0 }}>Call Requests</h3>
                <p style={{ color:"#64748b", fontSize:13, marginTop:5 }}>{callRequests.length} pending</p>
              </div>
              <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", padding:"8px 20px", borderRadius:50, fontSize:11, fontWeight:900, letterSpacing:1 }}>LIVE</div>
            </div>
 
            {callRequests.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#475569" }}>
                <div style={{ fontSize:40, marginBottom:15, opacity:0.4 }}>📞</div>
                <p style={{ fontSize:14, fontWeight:700 }}>No call-back requests</p>
              </div>
            ) : callRequests.map(req => (
              <div key={req.id} style={{
                padding:25, borderRadius:20, marginBottom:15,
                background:"rgba(245,158,11,0.04)",
                border:"1px solid rgba(245,158,11,0.2)",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                    <span style={{ background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, fontSize:10, fontWeight:900, padding:"3px 10px" }}>
                      SUITE {req.room_number}
                    </span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{req.guest_name}</span>
                    <span style={{ fontSize:10, color:"#475569", marginLeft:"auto" }}>
                      {req.created_at ? new Date(req.created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : ""}
                    </span>
                  </div>
                  <p style={{ margin:"0 0 6px", fontSize:13, color:"#cbd5e1" }}>{req.reason || "Guest requested a call back"}</p>
                  {req.phone && (
                    <a href={`tel:${req.phone.replace(/\s/g, "")}`}
                      style={{ display:"inline-block", marginTop:6, padding:"6px 14px", borderRadius:10,
                        background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)",
                        color:"#3b82f6", fontSize:12, fontWeight:800, textDecoration:"none" }}>
                      📞 {req.phone}
                    </a>
                  )}
                  
                </div>
                <button onClick={() => markCallResolved(req.id, req.room_number)}
                  style={{ ...S.btnSuccess, marginLeft:20, padding:"12px 20px", whiteSpace:"nowrap" }}>
                  ✓ MARK CALLED
                </button>
              </div>
            ))}
          </div>
        )}
        {/* ══ HOUSEKEEPING ══ */}
        {activeTab === "housekeeping" && (
          <div style={S.glass}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:30 }}>
              <div>
                <h3 style={{ fontWeight:900, fontSize:24, letterSpacing:-1, margin:0 }}>Housekeeping</h3>
                <p style={{ color:"#64748b", fontSize:13, marginTop:5 }}>
                  {rooms.filter(r=>r.status==="CLEANING").length} room{rooms.filter(r=>r.status==="CLEANING").length!==1?"s":""} need attention
                </p>
              </div>
              <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", padding:"8px 20px", borderRadius:50, fontSize:11, fontWeight:900, letterSpacing:1 }}>
                {rooms.filter(r=>r.status==="CLEANING").length} CLEANING
              </div>
            </div>
 
            {/* Shift Handover Notes */}
            <div style={{ background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:20, padding:24, marginBottom:28 }}>
              <div style={{ fontSize:10, color:"#3b82f6", fontWeight:800, letterSpacing:2, marginBottom:14 }}>SHIFT HANDOVER NOTES</div>
              <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveShiftNote()}
                  placeholder="Write a note for the next shift... (e.g. 'Suite 5 wants late checkout')"
                  style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:10, padding:"10px 14px", color:"#f1f5f9", fontSize:13, fontFamily:"inherit", outline:"none" }}
                />
                <button onClick={saveShiftNote} disabled={savingNote}
                  style={{ padding:"10px 20px", borderRadius:10, background:"#3b82f6", border:"none", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit", opacity:savingNote?0.6:1 }}>
                  {savingNote ? "Saving..." : "SAVE NOTE"}
                </button>
              </div>
              {shiftNotes.length === 0 ? (
                <div style={{ color:"#475569", fontSize:13, textAlign:"center", padding:"10px 0" }}>No handover notes yet.</div>
              ) : shiftNotes.map(n => (
                <div key={n.id} style={{ padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(51,65,85,0.3)", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, marginBottom:4 }}>{n.staff_name} · {new Date(n.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                    <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.5 }}>{n.note}</div>
                  </div>
                  <div style={{ fontSize:10, color:"#475569", whiteSpace:"nowrap", marginLeft:16 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
 
            {/* Cleaning rooms grid */}
            {rooms.filter(r=>r.status==="CLEANING").length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#475569" }}>
                <div style={{ fontSize:40, marginBottom:14, opacity:0.4 }}>✨</div>
                <p style={{ fontSize:14, fontWeight:700 }}>All rooms are clean — great work team!</p>
              </div>
            ) : (
             <div style={{  ...S.hkGrid }}>
                {rooms.filter(r=>r.status==="CLEANING").map(r => {
                  const roomNum  = r.room_number || r.id;
                  const tasks    = hkTasks[roomNum] || [];
                  const done     = tasks.filter(t => t.completed).length;
                  const total    = tasks.length;
                  const pct      = total > 0 ? Math.round((done/total)*100) : 0;
                  return (
                    <div key={roomNum} style={{ background:"rgba(245,158,11,0.04)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:20, padding:22 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:"#f59e0b", fontWeight:800, letterSpacing:1 }}>SUITE {roomNum}</div>
                          <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginTop:2 }}>Cleaning in Progress</div>
                        </div>
                        <div style={{ fontSize:22, fontWeight:900, color: pct===100?"#10b981":"#f59e0b" }}>{pct}%</div>
                      </div>
                      {total > 0 && (
                        <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, marginBottom:14 }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#10b981":"#f59e0b", borderRadius:2, transition:"width 0.4s" }} />
                        </div>
                      )}
                      {total > 0 && (
                        <div style={{ marginBottom:14, fontSize:12, color:"#94a3b8" }}>{done} of {total} tasks done</div>
                      )}
                      <button onClick={() => startCleaning(roomNum)}
                        style={{ width:"100%", padding:"10px 0", borderRadius:12, background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.4)", color:"#f59e0b", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                        🧹 {total === 0 ? "Start Cleaning" : "View Checklist"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
 
        {/* ══ DAILY REPORTS ══ (admin only) */}
        {activeTab === "reports" && isAdmin && (
          <div style={S.glass}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:30, flexWrap:"wrap", gap:16 }}>
              <div>
                <h3 style={{ fontWeight:900, fontSize:24, letterSpacing:-1, margin:0 }}>Daily Report</h3>
                <p style={{ color:"#64748b", fontSize:13, marginTop:5 }}>Auto-generated from live data</p>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(51,65,85,0.4)", borderRadius:10, padding:"8px 14px", color:"#f1f5f9", fontSize:13, fontFamily:"inherit", outline:"none" }} />
                <button onClick={() => generateReport(reportDate)}
                  style={{ padding:"9px 20px", borderRadius:10, background:"#3b82f6", border:"none", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                  GENERATE
                </button>
                {reportData && (
                  <button onClick={copyReport}
                    style={{ padding:"9px 20px", borderRadius:10, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                    📋 COPY
                  </button>
                )}
              </div>
            </div>
 
            {reportLoading && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#475569" }}>
                <div style={{ fontSize:13, fontWeight:600 }}>Generating report...</div>
              </div>
            )}
 
            {!reportLoading && !reportData && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#475569" }}>
                <div style={{ fontSize:40, marginBottom:14, opacity:0.4 }}>📊</div>
                <p style={{ fontSize:14, fontWeight:700 }}>Pick a date and click Generate</p>
              </div>
            )}
 
            {!reportLoading && reportData && (
              <>
                <div style={{  ...S.reportsStats }}>
                  {[
                    { label:"Occupancy",       val:`${reportData.occupied}/${reportData.totalRooms} (${reportData.occupancyPct}%)`, color:"#3b82f6" },
                    { label:"Check-ins",        val:reportData.checkIns.length,    color:"#10b981" },
                    { label:"Check-outs",       val:reportData.checkOuts.length,   color:"#94a3b8" },
                    { label:"Orders Today",     val:reportData.orders.length,      color:"#f59e0b" },
                    { label:"F&B Revenue",      val:`₵${reportData.orderRevenue.toLocaleString()}`, color:"#10b981" },
                    { label:"Booking Revenue",  val:`₵${reportData.bookingRevenue.toLocaleString()}`, color:"#10b981" },
                    { label:"Requests Pending", val:reportData.requestsPending,    color:"#ef4444" },
                    { label:"Requests Resolved",val:reportData.requestsResolved,   color:"#10b981" },
                    { label:"Guest Chats",      val:reportData.chats.length,       color:"#3b82f6" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"rgba(15,23,42,0.6)", border:"1px solid rgba(51,65,85,0.3)", borderRadius:16, padding:20, textAlign:"center" }}>
                      <div style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>{s.label.toUpperCase()}</div>
                      <div style={{ fontSize:28, fontWeight:900, color:s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
 
                {reportData.checkIns.length > 0 && (
                  <div style={{ background:"rgba(15,23,42,0.4)", border:"1px solid rgba(51,65,85,0.3)", borderRadius:16, padding:20, marginBottom:16 }}>
                    <div style={{ fontSize:10, color:"#3b82f6", fontWeight:800, letterSpacing:2, marginBottom:14 }}>TODAY'S CHECK-INS</div>
                    {reportData.checkIns.map(b => (
                      <div key={b.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(51,65,85,0.2)", fontSize:13 }}>
                        <span style={{ color:"#fff", fontWeight:600 }}>{b.guest_name}</span>
                        <span style={{ color:"#3b82f6" }}>Suite {b.room_number}</span>
                        <span style={{ color:"#10b981" }}>₵{Number(b.total_amount||0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
 
                {reportData.checkOuts.length > 0 && (
                  <div style={{ background:"rgba(15,23,42,0.4)", border:"1px solid rgba(51,65,85,0.3)", borderRadius:16, padding:20 }}>
                    <div style={{ fontSize:10, color:"#94a3b8", fontWeight:800, letterSpacing:2, marginBottom:14 }}>TODAY'S CHECK-OUTS</div>
                    {reportData.checkOuts.map(b => (
                      <div key={b.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(51,65,85,0.2)", fontSize:13 }}>
                        <span style={{ color:"#fff", fontWeight:600 }}>{b.guest_name}</span>
                        <span style={{ color:"#94a3b8" }}>Suite {b.room_number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
 
 
        {/* ══ RESERVATIONS CALENDAR ══ */}
        {activeTab === "reservations" && (
          <div style={S.glass}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1, margin: 0 }}>Reservations</h3>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
                  {monthStats.count} bookings this month · ₵{monthStats.revenue.toLocaleString()} revenue
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={goPrevMonth}
                  style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(51,65,85,0.4)", color: "#cbd5e1", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontFamily: "inherit" }}>
                  ‹
                </button>
                <div style={{ minWidth: 200, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
                  {monthLabel}
                </div>
                <button onClick={goNextMonth}
                  style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(51,65,85,0.4)", color: "#cbd5e1", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontFamily: "inherit" }}>
                  ›
                </button>
                <button onClick={goToday}
                  style={{ padding: "9px 18px", borderRadius: 10, background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6", cursor: "pointer",
                    fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "inherit" }}>
                  Today
                </button>
              </div>
            </div>
 
            <div style={{ ...S.calendarGrid }}>
              {/* CALENDAR GRID */}
              <div style={{ background: "rgba(15,23,42,0.4)", borderRadius: 20, border: "1px solid rgba(51,65,85,0.3)", padding: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} style={{ textAlign: "center", padding: "8px 0",
                      fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: 1.5 }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {calCells.map((day, idx) => {
                    if (!day) return <div key={idx} style={{ height: 84 }} />;
                    const dayBookings = bookingsByDay(day);
                    const count = dayBookings.length;
                    const dayISO = new Date(calYear, calMon, day, 12).toISOString().split("T")[0];
                    const isToday = dayISO === todayISO;
                    const isSelected = calSelectedDay === day;
                    const occupancyPct = count / 10; // 10 rooms total
                    return (
                      <div key={idx}
                        onClick={() => setCalSelectedDay(day)}
                        style={{
                          height: 84, padding: 8, borderRadius: 12, cursor: "pointer",
                          background: isSelected ? "rgba(59,130,246,0.18)" :
                                      count > 0  ? "rgba(59,130,246,0.06)" :
                                                   "rgba(255,255,255,0.02)",
                          border: `1px solid ${isSelected ? "rgba(59,130,246,0.5)" :
                                                isToday    ? "rgba(245,158,11,0.5)" :
                                                             "rgba(51,65,85,0.3)"}`,
                          transition: "all 0.2s",
                          display: "flex", flexDirection: "column", justifyContent: "space-between",
                          position: "relative", overflow: "hidden",
                        }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{
                            fontSize: 13, fontWeight: isToday ? 900 : 600,
                            color: isToday ? "#f59e0b" : "#fff",
                          }}>{day}</span>
                          {count > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, color: "#3b82f6",
                              background: "rgba(59,130,246,0.15)", borderRadius: 12,
                              padding: "2px 7px", letterSpacing: 0.5,
                            }}>{count}</span>
                          )}
                        </div>
                        {count > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {dayBookings.slice(0, 2).map(b => (
                              <div key={b.id} style={{
                                fontSize: 9, color: "#94a3b8",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                #{b.room_number} · {b.guest_name?.split(" ")[0]}
                              </div>
                            ))}
                            {count > 2 && (
                              <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700 }}>
                                +{count - 2} more
                              </div>
                            )}
                          </div>
                        )}
                        {count > 0 && (
                          <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                            background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                            transform: `scaleX(${Math.min(occupancyPct, 1)})`, transformOrigin: "left",
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
 
              {/* DAY DETAIL PANEL */}
              <div style={{ background: "rgba(15,23,42,0.4)", borderRadius: 20,
                border: "1px solid rgba(51,65,85,0.3)", padding: 22, minHeight: 400 }}>
                {!calSelectedDay ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                    <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.4 }}>📅</div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Click any day to see its bookings</p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>
                        SELECTED DAY
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
                        {new Date(calYear, calMon, calSelectedDay).toLocaleDateString("en-GB", {
                          weekday: "long", day: "numeric", month: "long",
                        })}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        {selectedDayBookings.length} {selectedDayBookings.length === 1 ? "guest" : "guests"} in residence
                      </div>
                    </div>
 
                    {selectedDayBookings.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px 0", color: "#475569", fontSize: 13 }}>
                        No bookings on this day.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
                        {selectedDayBookings.map(b => (
                          <div key={b.id} style={{
                            padding: 14, borderRadius: 12,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(51,65,85,0.3)",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: 1 }}>
                                SUITE {b.room_number}
                              </span>
                              {b.is_vip && (
                                <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 1 }}>★ VIP</span>
                              )}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                              {b.guest_name}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                              {b.check_in_date} → {b.check_out_date} · {b.nights || "?"} nights
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "#64748b" }}>
                                {b.guest_count || 1} {b.guest_count === 1 ? "guest" : "guests"}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>
                                ₵{Number(b.total_amount || 0).toLocaleString()}
                              </span>
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
        )} 
 


        {/* ══ SETTINGS ══ (admin only) */}
        {activeTab === "settings" && isAdmin && (
          <div style={S.glass}>
            <h3 style={{ fontWeight:900, fontSize:24 }}>System Configuration</h3>
            <p style={{ color:"#64748b", fontSize:14 }}>Secure Node: <span style={{ color:"#3b82f6" }}>STAYPILOT-HQ-ALPHA</span></p>
            <div style={{ marginTop:30, padding:30, borderRadius:20, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(51,65,85,0.3)" }}>
              <p style={{ margin:0, fontSize:13, color:"#94a3b8" }}>Read-only mode. Database migrations managed via Core Command terminal.</p>
            </div>
          </div>
        )}
      </main>

      {/* ── GUEST SLIDE-OVER (admin only) ── */}
      {isAdmin && (
        <div style={{ position:"fixed", right:selectedGuest?"0":"-450px", top:0, width:420, height:"100vh", background:"rgba(15,23,42,0.95)", borderLeft:"1px solid rgba(59,130,246,0.2)", boxShadow:"-20px 0 60px rgba(0,0,0,0.8)", zIndex:100, transition:"0.5s cubic-bezier(0.19,1,0.22,1)", padding:"60px 40px", display:"flex", flexDirection:"column", backdropFilter:"blur(30px)", overflowY:"auto" }}>
          {selectedGuest && (
            <>
              <button onClick={()=>setSelectedGuest(null)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(51,65,85,0.5)", padding:"10px 20px", borderRadius:12, color:"#64748b", cursor:"pointer", marginBottom:40, fontWeight:800, fontSize:11, width:"fit-content" }}>← CLOSE PROFILE</button>
              <div style={{ marginBottom:30 }}>
                <div style={{ display:"flex", alignItems:"center", marginBottom:10 }}>
                  <h2 style={{ margin:0, fontSize:34, fontWeight:900, letterSpacing:-2 }}>{selectedGuest.guest_name}</h2>
                  {selectedGuest.is_vip && <span style={{ background:"linear-gradient(45deg,#f59e0b,#fbbf24)", color:"#000", padding:"3px 8px", borderRadius:6, fontSize:9, fontWeight:900, marginLeft:12 }}>VIP</span>}
                </div>
                <p style={{ color:"#3b82f6", fontWeight:800, fontSize:15, letterSpacing:1 }}>SUITE {selectedGuest.room_number}</p>
              </div>

              <div style={{ background:"linear-gradient(135deg,rgba(59,130,246,0.1),transparent)", padding:30, borderRadius:24, border:"1px solid rgba(59,130,246,0.3)", marginBottom:30 }}>
                <small style={{ color:"#64748b", fontWeight:800, letterSpacing:2, fontSize:10 }}>DIGITAL ACCESS PASS</small>
                <p style={{ fontSize:28, letterSpacing:8, margin:"12px 0 0", color:"#10b981", fontWeight:900 }}>{selectedGuest.access_token||"UNASSIGNED"}</p>
              </div>

              {(() => {
                const guestOrders = orders.filter(o => o.room_number?.toString()===selectedGuest.room_number?.toString() && !["cancelled"].includes(o.status));
                return guestOrders.length > 0 && (
                  <div style={{ marginBottom:30 }}>
                    <small style={{ color:"#64748b", fontWeight:800, letterSpacing:2, fontSize:10, display:"block", marginBottom:12 }}>ACTIVE ORDERS</small>
                    {guestOrders.map(o=>(
                      <div key={o.id} style={{ padding:"14px 16px", borderRadius:14, background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.2)", marginBottom:8, fontSize:13 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontWeight:700 }}>Order #{o.id}</span>
                          <StatusBadge status={o.status} />
                        </div>
                        <div style={{ color:"#94a3b8", fontSize:11, marginTop:4 }}>{Array.isArray(o.items)?o.items.map(i=>`${i.qty}× ${i.name}`).join(", "):""}</div>
                        <div style={{ color:"#10b981", fontWeight:900, marginTop:4 }}>${o.total_amount?.toFixed(2)} · <span style={{ color:o.payment_status==="paid"?"#10b981":"#f59e0b", fontWeight:700 }}>{o.payment_status}</span></div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ flex:1 }}>
                <small style={{ color:"#64748b", fontWeight:800, letterSpacing:2, fontSize:10 }}>PATRON BRIEFING</small>
                <div style={{ color:"#94a3b8", fontSize:14, lineHeight:1.8, marginTop:15, padding:25, background:"rgba(255,255,255,0.02)", borderRadius:20, border:"1px solid rgba(51,65,85,0.3)" }}>
                  {selectedGuest.guest_notes || "No special requests registered."}
                </div>
              </div>

              <button onClick={()=>setConfirmDialog({ title:"Authorize Check-Out", message:`Check-out ${selectedGuest.guest_name} from Suite ${selectedGuest.room_number}?`, onConfirm:()=>handleCheckOut(selectedGuest.id,selectedGuest.room_number) })}
                style={{ width:"100%", padding:22, background:"linear-gradient(45deg,#ef4444,#dc2626)", color:"white", border:"none", borderRadius:20, fontWeight:900, cursor:"pointer", boxShadow:"0 15px 30px rgba(239,68,68,0.3)", fontSize:14, letterSpacing:1, marginTop:30 }}>
                AUTHORIZE CHECK-OUT
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
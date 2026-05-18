import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { processGuestMessage } from '../lib/concierge';
import { sendBookingConfirmation, sendPaymentReceipt, sendInvoiceEmail } from '../lib/sendEmail';

// ═══ HOTEL CONFIG ═══════════════════════════════════════════════════════════
// REPLACE this with the real hotel front desk number when you go live.
// Currently your own number, so test calls reach you.
const HOTEL_PHONE = '+233 54 366 2896';

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);
const Icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  dining:    "M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3",
  chat:      "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  billing:   "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M1 12h22",
  settings:  "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  xplore:   "M3 12a9 9 0 1018 0 9 9 0 00-18 0M12 8v4M12 12l3 3",
  logout:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  key:       "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  bell:      "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  thermo:    "M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z",
  clock:     "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
  card:      "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M1 12h22",
  pin:       "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 7a3 3 0 100 6 3 3 0 000-6z",
  sun:       "M12 17A5 5 0 1012 7a5 5 0 000 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  coffee:    "M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3",
  send:      "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  phone:     "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z",
  headset:   "M3 18v-6a9 9 0 0118 0v6 M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
};

// ─── COLORS / STYLES ─────────────────────────────────────────────────────────
const C = {
  accent: '#3b82f6', accent2: '#60a5fa',
  dark: '#020617', card: '#0f172a', card2: '#1e293b',
  border: 'rgba(59,130,246,0.15)', text: '#f1f5f9',
  muted: '#94a3b8', red: '#ef4444', green: '#10b981', gold: '#f59e0b',
};

const css = {
  wrap: { display:'flex', height:'100vh', background:C.dark, color:C.text,
    fontFamily:"'DM Sans', 'Segoe UI', sans-serif", overflow:'hidden' },
  sidebar: { width:240, minWidth:240, background:'rgba(2,6,23,0.98)',
    borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column',
    padding:'24px 16px', gap:6, zIndex:10 },
  logo: { display:'flex', alignItems:'center', gap:10, padding:'0 8px', marginBottom:28 },
  logoIcon: { width:32, height:32, background:`linear-gradient(135deg,${C.accent},${C.accent2})`,
    borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 },
  logoText: { fontSize:18, letterSpacing:3, color:C.accent, fontWeight:300 },
  navItem: (active) => ({
    display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
    borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:400,
    color: active ? C.accent : C.muted,
    background: active ? 'rgba(59,130,246,0.10)' : 'transparent',
    border: `1px solid ${active ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
    transition:'all 0.2s', letterSpacing:'0.3px',
  }),
  main: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' },
  bgImg: { position:'absolute', inset:0, backgroundImage:`url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064')`,
    backgroundSize:'cover', backgroundPosition:'center', opacity:0.04, pointerEvents:'none' },
  content: { flex:1, overflowY:'auto', padding:'28px 32px', position:'relative', zIndex:1 },
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 },
  glassCard: { background:'rgba(15,23,42,0.95)', border:`1px solid ${C.border}`, borderRadius:20, padding:'28px 32px' },
  cardTitle: { fontSize:10, textTransform:'uppercase', letterSpacing:'2.5px', color:C.accent, fontWeight:600 },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  btnPrimary: { padding:'10px 22px', background:C.accent, color:'#ffffff', border:'none',
    borderRadius:10, fontSize:12, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase',
    cursor:'pointer', fontFamily:'inherit' },
  btnGhost: { padding:'10px 22px', background:'transparent', color:C.text,
    border:`1px solid ${C.border}`, borderRadius:10, fontSize:12, fontWeight:500,
    letterSpacing:'1px', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit' },
  btnFull: { width:'100%', padding:'10px', borderRadius:10, border:`1px solid ${C.border}`,
    background:C.card2, color:C.text, fontSize:11, fontWeight:500, letterSpacing:'1.2px',
    textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit', marginTop:10,
    display:'flex', alignItems:'center', justifyContent:'center', gap:8 },
  grid3: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 },
  grid2: { display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 },
  serif: { fontFamily:"'Georgia', 'Times New Roman', serif" },
  tempBtn: { width:34, height:34, borderRadius:'50%', background:C.card2,
    border:`1px solid ${C.border}`, color:C.text, fontSize:18, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center' },
  chip: (sel) => ({ padding:'5px 12px', borderRadius:20,
    border:`1px solid ${sel ? C.accent : C.border}`,
    background: sel ? 'rgba(59,130,246,0.10)' : C.card2,
    color: sel ? C.accent : C.muted,
    fontSize:11, cursor:'pointer', fontFamily:'inherit' }),
};



const CAT_ICON = { Starter:'🥗', Main:'🍽️', Dessert:'🍫', Drinks:'🍷', Special:'⭐', default:'🍴' };

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, visible }) {
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:999,
      background:C.card2, border:`1px solid ${type==='green' ? 'rgba(16,185,129,0.4)' : type==='red' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
      color: type==='green' ? C.green : type==='red' ? C.red : C.accent,
      borderRadius:12, padding:'12px 20px', fontSize:13, maxWidth:320,
      transform: visible ? 'translateY(0)' : 'translateY(80px)',
      opacity: visible ? 1 : 0,
      transition:'all 0.3s', pointerEvents:'none',
      boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
    }}>{msg}</div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:500,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:32,
        maxWidth:440, width:'90%', position:'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, width:30, height:30,
          borderRadius:'50%', background:C.card2, border:`1px solid ${C.border}`, color:C.muted,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Welcome() {
  const navigate = useNavigate();

  // Auth + booking
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const guestName  = booking?.guest_name || user?.user_metadata?.full_name || "Guest";
  const roomNumber = booking?.room_number ? booking.room_number.toString() : "—";
  const isVip      = !!booking?.is_vip;
  const guestEmail = user?.email || booking?.guest_email || "";

  // Live data
  const [menuItems, setMenuItems] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [ledger, setLedger] = useState([]);

  // UI state
  const [activeTab,    setActiveTab]    = useState('overview');
  const [stayEnded, setStayEnded] = useState(false);
  const [temp,         setTemp]         = useState(22);
  const [isDND,        setIsDND]        = useState(false);
  const [keyCode,      setKeyCode]      = useState('----');
  const [cartItems,    setCartItems]    = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState('');
  const [reqNote,      setReqNote]      = useState('');
  const [selCat,       setSelCat]       = useState('');
  const [lightMode,    setLightMode]    = useState('Warm');
  const [wakeTime,     setWakeTime]     = useState('07:00');
  const [toast,        setToast]        = useState({ msg:'', type:'accent', visible:false });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showLogout,   setShowLogout]   = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [payingNow,    setPayingNow]    = useState(false);

  // Staff chat state
  const [staffChatOpen, setStaffChatOpen] = useState(false);
  const [staffMessages, setStaffMessages] = useState([]);
  const [staffInput,    setStaffInput]    = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [roomTypes,       setRoomTypes]       = useState([]);
  const [modifyCheckIn,   setModifyCheckIn]   = useState("");
  const [modifyCheckOut,  setModifyCheckOut]  = useState("");
  const [modifyTypeId,    setModifyTypeId]    = useState(null);
  const [modifyGuests,    setModifyGuests]    = useState(2);
  const [modifyBusy,      setModifyBusy]      = useState(false);
  const [cancelBusy,      setCancelBusy]      = useState(false);

  const chatRef = useRef(null);
  const staffChatRef = useRef(null);
  const accentColor = C.accent;

  function showToast(msg, type='accent') {
    setToast({ msg, type, visible:true });
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3200);
  }

  // Auth + booking load
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate('/login'); return; }
      setUser(session.user);
      setAuthChecked(true);

      const { data: bookings } = await supabase
        .from('bookings').select('*')
        .eq('user_id', session.user.id).eq('status','ACTIVE')
        .order('created_at', { ascending:false }).limit(1);

      if (bookings && bookings.length > 0) {
        setBooking(bookings[0]);
        setKeyCode(bookings[0].access_token || '----');
      }
      setLoadingData(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Greeting once name is known
  useEffect(() => {
    if (guestName && guestName !== "Guest" && chatMessages.length === 0) {
      setChatMessages([{ role:'concierge', text:`Hello ${guestName}! I'm your AI Concierge. Ask me about dining, the spa, transport, or anything else — I'm here 24/7.` }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestName]);

  // Data fetchers
  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').eq('is_available',true).order('category').order('name');
    if (data) setMenuItems(data);
  };
  const fetchMyOrders = async (room) => {
    if (!room) return;
    const { data } = await supabase.from('orders').select('*').eq('room_number',room.toString()).order('created_at',{ascending:false});
    if (data) setMyOrders(data);
  };
  const fetchLedger = async (room) => {
    if (!room) return;
    const { data } = await supabase.from('guest_ledger').select('*').eq('room_number',room.toString()).eq('status','pending').order('created_at',{ascending:false});
    if (data) setLedger(data);
  };
  const fetchStaffMessages = async (room) => {
    if (!room) return;
    const { data } = await supabase.from('staff_chats').select('*')
      .eq('room_number', room.toString())
      .eq('thread_status','open')
      .order('created_at', { ascending:true });
    if (data) {
      setStaffMessages(data);
      // If there are open messages from a previous session, restore the chat view
      if (data.length > 0 && !staffChatOpen) setStaffChatOpen(true);
    }
  };
   const fetchRoomTypes = async () => {
    const { data } = await supabase.from("room_types").select("*").order("price_per_night");
    if (data) setRoomTypes(data);
  };
 

  useEffect(() => { fetchMenu(); fetchRoomTypes(); }, []);
  useEffect(() => {
    if (roomNumber && roomNumber !== "—") {
      fetchMyOrders(roomNumber);
      fetchLedger(roomNumber);
      fetchStaffMessages(roomNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNumber]);
  // ── Auto logout when stay ends ──
useEffect(() => {
  if (!booking?.check_out_date) return;

  const checkStayEnded = () => {
    const now = new Date();
    const checkoutDate = new Date(booking.check_out_date);
    // Set checkout time to 12:00 PM on checkout date (Ghana time UTC+0)
    checkoutDate.setUTCHours(12, 0, 0, 0);

    if (now >= checkoutDate && booking.status === 'ACTIVE') {
      setStayEnded(true);
      // Auto logout after 10 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 10000);
    }
  };

  // Check immediately and then every 5 minutes
  checkStayEnded();
  const interval = setInterval(checkStayEnded, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [booking, navigate]);

  // Realtime
  useEffect(() => {
    if (!roomNumber || roomNumber === "—") return;
    const ch = supabase.channel(`guest-room-${roomNumber}`)
     .on('postgres_changes', { event:'*', schema:'public', table:'bookings',
    filter:`room_number=eq.${roomNumber}` }, async (payload) => {
    if (payload.new?.status === 'COMPLETED') {
      setStayEnded(true);
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 10000);
    }
  })
      .on('postgres_changes', { event:'*', schema:'public', table:'orders', filter:`room_number=eq.${roomNumber}` }, () => fetchMyOrders(roomNumber))
      .on('postgres_changes', { event:'*', schema:'public', table:'guest_ledger', filter:`room_number=eq.${roomNumber}` }, () => fetchLedger(roomNumber))
      .on('postgres_changes', { event:'*', schema:'public', table:'menu_items' }, () => fetchMenu())
      .on('postgres_changes', { event:'*', schema:'public', table:'staff_chats', filter:`room_number=eq.${roomNumber}` }, (payload) => {
        fetchStaffMessages(roomNumber);
        if (payload.eventType === 'INSERT' && payload.new.sender === 'staff') {
          showToast('💬 New message from staff', 'accent');
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNumber]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chatMessages]);
  useEffect(() => { if (staffChatRef.current) staffChatRef.current.scrollTop = staffChatRef.current.scrollHeight; }, [staffMessages, staffChatOpen]);

  // Derived
  const cartTotal = cartItems.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
  const activeOrder = myOrders.find(o => !['completed','cancelled','delivered'].includes(o.status));
  const orderStatusLabel = (() => {
    if (!activeOrder) {
      const last = myOrders.find(o => o.status === 'delivered' || o.status === 'completed');
      return last ? '✓ Order delivered' : 'No active orders';
    }
    const map = { pending:'Order received', accepted:'Accepted by kitchen', preparing:'Preparing your meal', ready:'Ready — on its way' };
    return map[activeOrder.status] || activeOrder.status;
  })();
  const orderProgressPct = (() => {
    if (!activeOrder) return myOrders.some(o=>['delivered','completed'].includes(o.status)) ? 100 : 0;
    const map = { pending:15, accepted:40, preparing:65, ready:90 };
    return map[activeOrder.status] || 10;
  })();
  const activeOrderName = (() => {
    const target = activeOrder || myOrders[0];
    if (!target) return 'No orders yet';
    const items = Array.isArray(target.items) ? target.items : [];
    return items.map(i => i.name).join(' & ').slice(0,40) || 'Order';
  })();
  const totalOwed = ledger.reduce((s,e) => s + (Number(e.amount)||0), 0);

  // Actions
  function generateToken() {
    const code = String(Math.floor(1000 + Math.random()*9000));
    setKeyCode(code);
    showToast(`Session token refreshed: ${code}`, 'accent');
  }
  function addToCart(item) {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: (c.qty||1) + 1 } : c);
      return [...prev, { ...item, qty:1 }];
    });
    showToast(`${item.name} added to cart`, 'accent');
  }

  async function placeOrder() {
    if (!cartItems.length) { showToast('Cart is empty','accent'); return; }
    if (!booking) { showToast('No active booking found','red'); return; }
    setPlacingOrder(true);
    const orderItems = cartItems.map(c => ({ id:c.id, name:c.name, price:Number(c.price), qty:c.qty||1 }));
    const { data, error } = await supabase.from('orders').insert({
      room_number: roomNumber, guest_name: guestName, guest_email: guestEmail,
      items: orderItems, total_amount: cartTotal,
      status:'pending', payment_status:'unpaid', notes:'',
    }).select().single();
    setPlacingOrder(false);
    if (error) { console.error(error); showToast(`Order failed: ${error.message}`,'red'); return; }
    setCartItems([]); fetchMyOrders(roomNumber);
    showToast(`Order #${data.id} placed! Kitchen notified.`, 'green');
    setActiveTab('overview');
  }

  async function sendRequest() {
    if (!reqNote && !selCat) { showToast('Please select a category or enter a note','accent'); return; }
    if (!booking) { showToast('No active booking found','red'); return; }
    const { error } = await supabase.from('service_requests').insert({
      room_number: roomNumber, guest_name: guestName,
      request_type: selCat || 'General',
      item_name: selCat || 'General Request',
      notes: reqNote || null, status:'pending',
    });
    if (error) { console.error(error); showToast(`Request failed: ${error.message}`,'red'); return; }
    showToast(`Request sent: ${selCat || reqNote}`, 'green');
    setReqNote(''); setSelCat('');
  }

  async function sendChat(msgOverride) {
    const msg = msgOverride || chatInput;
    if (!msg.trim()) return;
    setChatMessages(prev => [...prev, { role:'user', text:msg }]);
    setChatInput('');
 
    const result = await processGuestMessage({
      message: msg,
      guestName,
      roomNumber,
      booking,
      userId: user?.id || null,
      menuItems,
    });
 
    setChatMessages(prev => [...prev, {
      role: 'concierge',
      text: result.text,
      offerHandoff: result.offerHandoff || false,
    }]);
    console.log('CONCIERGE RESULT:', result);
  }
 

  // Staff handoff — Chat
  async function startStaffChat() {
    if (!booking) { showToast('No active booking','red'); return; }
    const opener = "Hi, I'd like to speak with a staff member, please.";
    const { error } = await supabase.from('staff_chats').insert({
      room_number: roomNumber, guest_name: guestName, user_id: user?.id || null,
      sender:'guest', message: opener, thread_status:'open',
    });
    if (error) { console.error(error); showToast(`Could not start chat: ${error.message}`,'red'); return; }
    setStaffChatOpen(true);
    showToast('Connected — staff will reply shortly', 'green');
  }

  async function sendToStaff() {
    const msg = staffInput.trim();
    if (!msg) return;
    setStaffInput('');
    const { error } = await supabase.from('staff_chats').insert({
      room_number: roomNumber, guest_name: guestName, user_id: user?.id || null,
      sender:'guest', message: msg, thread_status:'open',
    });
    if (error) { console.error(error); showToast(`Could not send: ${error.message}`,'red'); }
  }

  async function endStaffChat() {
    await supabase.from('staff_chats')
      .update({ thread_status:'closed', handled:true })
      .eq('room_number', roomNumber).eq('thread_status','open');
    setStaffChatOpen(false);
    setStaffMessages([]);
    showToast('Chat closed. Thank you!', 'green');
  }

  // Staff handoff — Call
  async function requestCall() {
    if (!booking) { showToast('No active booking','red'); return; }
    const { error } = await supabase.from('call_requests').insert({
      room_number: roomNumber, guest_name: guestName, user_id: user?.id || null,
      phone: HOTEL_PHONE, reason:'Guest requested call from AI concierge',
      status:'pending',
    });
    if (error) { console.error(error); showToast(`Could not request call: ${error.message}`,'red'); return; }
    setShowCallModal(true);
  }

  // Paystack
  async function settleAll() {
    if (totalOwed <= 0) { showToast('Nothing outstanding','green'); return; }
    const paystackKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    if (!paystackKey) { showToast('Payment not configured. Add Paystack key to .env','red'); return; }
    if (!guestEmail) { showToast('No email on file','red'); return; }
    setPayingNow(true);
    const startPaystack = () => {
      // eslint-disable-next-line no-undef
      const handler = window.PaystackPop && window.PaystackPop.setup({
        key: paystackKey, email: guestEmail,
        amount: Math.round(totalOwed * 100), currency:'GHS',
        ref: `STAY-${roomNumber}-${Date.now()}`,
        metadata: { custom_fields: [
          { display_name:"Suite", variable_name:"suite", value:roomNumber },
          { display_name:"Guest", variable_name:"guest", value:guestName },
        ]},
        callback: function(response) {
          (async () => {
            const ref = response.reference;
            await supabase.from('payments').insert({
              reference:ref, room_number:roomNumber, user_id:user?.id||null,
              amount:totalOwed, currency:'GHS', status:'success', channel:'paystack',
              order_ids: myOrders.map(o => o.id), ledger_ids: ledger.map(l => l.id),
              verified_at: new Date().toISOString(),
            });
            await supabase.from('guest_ledger').update({ status:'paid' }).eq('room_number',roomNumber).eq('status','pending');
            await supabase.from('orders').update({ payment_status:'paid', payment_method:'paystack' }).eq('room_number',roomNumber).eq('payment_status','unpaid');
            fetchLedger(roomNumber); fetchMyOrders(roomNumber);
            setPayingNow(false);
            showToast(`Payment successful! Ref: ${ref}`, 'green');
          })();
        },
        onClose: function() { setPayingNow(false); showToast('Payment window closed','accent'); },
      });
      if (handler) handler.openIframe();
      else { setPayingNow(false); showToast('Could not start Paystack','red'); }
    };
    if (window.PaystackPop) startPaystack();
    else {
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.onload = startPaystack;
      s.onerror = () => { setPayingNow(false); showToast('Failed to load Paystack','red'); };
      document.body.appendChild(s);
    }
  }
function hoursUntilCheckIn() {
    if (!booking?.check_in_date) return 999;
    const checkInTime = new Date(booking.check_in_date + "T15:00:00");
    const now = new Date();
    return (checkInTime - now) / (1000 * 60 * 60);
  }
  const canCancelFree = hoursUntilCheckIn() >= 24;
 
  function openModifyModal() {
    if (!booking) return;
    setModifyCheckIn(booking.check_in_date || "");
    setModifyCheckOut(booking.check_out_date || "");
    setModifyGuests(booking.guest_count || 2);
    // Find current room's type
    (async () => {
      const { data: room } = await supabase
        .from("rooms").select("type_id")
        .eq("room_number", booking.room_number).single();
      if (room) setModifyTypeId(room.type_id);
    })();
    setShowModifyModal(true);
  }
 
  async function submitModify() {
    setModifyBusy(true);
    try {
      const ci = modifyCheckIn, co = modifyCheckOut;
      const newNights = Math.max(0, Math.round((new Date(co) - new Date(ci)) / 86400000));
      if (newNights < 1) { showToast("Pick valid dates","red"); setModifyBusy(false); return; }
      if (!modifyTypeId) { showToast("Pick a suite type","red"); setModifyBusy(false); return; }
 
      const newType = roomTypes.find(t => t.id === modifyTypeId);
      if (modifyGuests > newType.capacity) {
        showToast(`${newType.name} fits ${newType.capacity} max`,"red");
        setModifyBusy(false); return;
      }
 
      // Find a free room of that type for the new dates (excluding THIS booking)
      const { data: rooms } = await supabase.from("rooms").select("*").eq("type_id", modifyTypeId);
      const { data: conflicts } = await supabase
        .from("bookings").select("room_number, id")
        .eq("status","ACTIVE")
        .neq("id", booking.id)
        .lt("check_in_date", co).gt("check_out_date", ci);
      const blocked = new Set((conflicts||[]).map(b => b.room_number));
      const candidate = (rooms||[]).find(r => !blocked.has(r.room_number) && r.status !== "MAINTENANCE");
      if (!candidate) {
        showToast("No room of that type available for those dates","red");
        setModifyBusy(false); return;
      }
 
      const newTotal = Number(newType.price_per_night) * newNights;
      const oldRoom = booking.room_number;
 
      const { error } = await supabase.from("bookings").update({
        check_in_date: ci, check_out_date: co,
        check_in_at: new Date(ci + "T15:00:00").toISOString(),
        check_out_at: new Date(co + "T12:00:00").toISOString(),
        room_number: candidate.room_number,
        nights: newNights, total_amount: newTotal,
        guest_count: modifyGuests, stay_duration_hours: newNights * 24,
      }).eq("id", booking.id);
 
      if (error) { showToast(`Modify failed: ${error.message}`,"red"); setModifyBusy(false); return; }
 
      // Free the old room if it changed
      if (oldRoom !== candidate.room_number) {
        await supabase.from("rooms").update({ status:"VACANT" }).eq("room_number", oldRoom);
        await supabase.from("rooms").update({ status:"OCCUPIED" }).eq("room_number", candidate.room_number);
      }
 
      showToast("Reservation updated","green");
      setShowModifyModal(false);
      setModifyBusy(false);
      // Refresh booking
      const { data: updated } = await supabase.from("bookings").select("*").eq("id", booking.id).single();
      if (updated) setBooking(updated);
    } catch (e) {
      console.error(e); showToast(`Modify failed: ${e.message}`,"red"); setModifyBusy(false);
    }
  }
 
  async function submitCancel() {
    setCancelBusy(true);
    try {
      await supabase.from("bookings")
        .update({ status: "CANCELLED" })
        .eq("id", booking.id);
      await supabase.from("rooms")
        .update({ status: "VACANT" })
        .eq("room_number", booking.room_number);
      // Mark ledger paid (refunded) or cancelled depending on policy
      await supabase.from("guest_ledger")
        .update({ status: canCancelFree ? "refunded" : "cancelled" })
        .eq("room_number", booking.room_number.toString())
        .eq("status", "pending");
 
      showToast(canCancelFree ? "Booking cancelled — full refund issued" : "Booking cancelled","green");
      setShowCancelModal(false);
      setCancelBusy(false);
      setBooking(null);  // triggers the no-booking screen
    } catch (e) {
      console.error(e); showToast(`Cancel failed: ${e.message}`,"red"); setCancelBusy(false);
    }
  }
  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const navItems = [
    { key:'overview',  label:'Overview',       icon:Icons.dashboard },
    { key:'explore',   label:'Explore',        icon:Icons.explore   },
    { key:'dining',    label:'Gourmet Dining', icon:Icons.dining    },
    { key:'concierge', label:'AI Concierge',   icon:Icons.chat      },
    { key:'billing',   label:'My Folio',       icon:Icons.billing   },
    { key:'settings',  label:'Room Settings',  icon:Icons.settings  },
  ];

  const menuByCat = menuItems.reduce((acc, m) => {
    const cat = m.category || 'Main';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  // Loading
  if (!authChecked || loadingData) {
    return (
      <div style={{ ...css.wrap, alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:44, height:44, border:'3px solid rgba(59,130,246,0.2)', borderTop:'3px solid #3b82f6', borderRadius:'50%', margin:'0 auto 18px', animation:'spin 1s linear infinite' }} />
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:2 }}>LOADING YOUR SUITE...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // No booking — premium screen
  if (!booking) {
    return (
      <div style={{
        minHeight:'100vh', width:'100%', position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'DM Sans', 'Segoe UI', sans-serif",
        background:'#020617', overflow:'hidden', padding:20,
      }}>
        <style>{`
          @keyframes nbKenBurns { 0%{transform:scale(1.0) translate(0,0)} 50%{transform:scale(1.08) translate(-1.2%,-1%)} 100%{transform:scale(1.0) translate(0,0)} }
          @keyframes nbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes nbCardIn { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes nbShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
          @keyframes nbGlow { 0%,100%{box-shadow:0 18px 50px rgba(59,130,246,0.28)} 50%{box-shadow:0 18px 60px rgba(59,130,246,0.45)} }
        `}</style>
        <div style={{ position:'absolute', inset:0,
          backgroundImage:'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070")',
          backgroundSize:'cover', backgroundPosition:'center',
          opacity:0.5, animation:'nbKenBurns 32s ease-in-out infinite', zIndex:1 }} />
        <div style={{ position:'absolute', inset:0, zIndex:2,
          background:'linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.6) 50%, rgba(2,6,23,0.9) 100%)' }} />
        <div style={{ position:'absolute', top:'-15%', right:'-8%', width:480, height:480, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)',
          filter:'blur(60px)', zIndex:2, pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:3, width:'100%', maxWidth:460,
          background:'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(15,23,42,0.7))',
          backdropFilter:'blur(28px)', border:'1px solid rgba(59,130,246,0.2)',
          borderRadius:28, padding:'48px 42px', textAlign:'center',
          boxShadow:'0 30px 70px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation:'nbCardIn 0.7s cubic-bezier(0.19,1,0.22,1)', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
            background:'linear-gradient(90deg, transparent, rgba(59,130,246,0.7), transparent)',
            animation:'nbShimmer 4s ease-in-out infinite' }} />
          <div style={{ width:60, height:60, margin:'0 auto 24px', borderRadius:18,
            background:'linear-gradient(135deg, #3b82f6, #60a5fa)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'#fff',
            boxShadow:'0 10px 30px rgba(59,130,246,0.4)', animation:'nbFloat 4s ease-in-out infinite' }}>✦</div>
          <div style={{ fontSize:10, letterSpacing:4, color:'#3b82f6', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>
            Private Suite Access
          </div>
          <h1 style={{ fontFamily:"'Georgia', 'Times New Roman', serif", fontSize:38, fontWeight:300,
            color:'#f8fafc', margin:'0 0 14px', letterSpacing:'-0.5px', lineHeight:1.1 }}>
            Welcome, {guestName}
          </h1>
          <p style={{ color:'#94a3b8', fontSize:14, lineHeight:1.7, margin:'0 auto 30px', maxWidth:360 }}>
            Your account is ready, but you don't have an active suite reservation yet.
            Reserve your stay to unlock your encrypted digital key, 24/7 room service, and your personal concierge.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:26, marginBottom:32, paddingBottom:4 }}>
            {[{ icon:'🔑', label:'Digital Key' },{ icon:'🍽️', label:'Room Service' },{ icon:'✦', label:'Concierge' }].map(f => (
              <div key={f.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:42, height:42, borderRadius:12,
                  background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{f.icon}</div>
                <span style={{ fontSize:10, color:'#64748b', fontWeight:600, letterSpacing:0.5 }}>{f.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/book')}
            style={{ width:'100%', padding:16, borderRadius:14, border:'none',
              background:'linear-gradient(135deg, #3b82f6, #2563eb)',
              color:'#fff', fontWeight:700, fontSize:14, letterSpacing:0.5,
              cursor:'pointer', fontFamily:'inherit', animation:'nbGlow 3s ease-in-out infinite', transition:'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Book Your Suite →
          </button>
          <button onClick={handleSignOut}
            style={{ width:'100%', padding:13, borderRadius:14, marginTop:12,
              background:'transparent', border:'1px solid rgba(59,130,246,0.15)',
              color:'#64748b', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit',
              letterSpacing:0.5, transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; }}>
            Sign Out
          </button>
          <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.05)',
            fontSize:9, color:'#475569', letterSpacing:3, textTransform:'uppercase' }}>
            StayPilot · Encrypted End-to-End
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div style={css.wrap}>
      {/* ── Stay ended overlay ── */}
{stayEnded && (
  <div style={{
    position:'fixed', inset:0, zIndex:9999,
    background:'radial-gradient(circle at center, #0f172a, #020617)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'Inter', sans-serif", color:'#fff',
  }}>
    <div style={{
      textAlign:'center', maxWidth:480, padding:40,
      background:'rgba(15,23,42,0.9)', backdropFilter:'blur(24px)',
      border:'1px solid rgba(59,130,246,0.18)', borderRadius:28,
      boxShadow:'0 30px 60px rgba(0,0,0,0.6)',
    }}>
      <div style={{ fontSize:64, marginBottom:20 }}>✦</div>
      <div style={{ fontSize:10, color:accentColor, letterSpacing:4, fontWeight:700,
        textTransform:'uppercase', marginBottom:14 }}>The Afia</div>
      <h2 style={{ fontFamily:"Georgia, serif", fontSize:32, fontWeight:300,
        margin:'0 0 14px', letterSpacing:-0.5 }}>
        Thank you for staying with us
      </h2>
      <p style={{ color:'#94a3b8', fontSize:14, lineHeight:1.8, marginBottom:28 }}>
        Your stay has ended, {guestName}. It was an honour hosting you at The Afia.
        We hope to welcome you back soon.
      </p>
      <div style={{ padding:'14px 20px', borderRadius:12, marginBottom:28,
        background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)',
        fontSize:12, color:'#94a3b8' }}>
        You will be signed out automatically in a few seconds...
      </div>
      <div style={{ display:'flex', gap:12 }}>
        <button onClick={() => navigate('/book')}
          style={{ flex:1, padding:16, borderRadius:14,
            background:'linear-gradient(135deg, #3b82f6, #2563eb)',
            border:'none', color:'#fff', fontSize:13, fontWeight:700,
            letterSpacing:1.5, textTransform:'uppercase',
            cursor:'pointer', fontFamily:'inherit' }}>
          Book Your Next Stay
        </button>
        <button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
          style={{ flex:1, padding:16, borderRadius:14,
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.1)',
            color:'#94a3b8', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit' }}>
          Sign Out Now
        </button>
      </div>
      <div style={{ marginTop:24, fontSize:9, color:'#475569',
        letterSpacing:3, textTransform:'uppercase' }}>
        The Afia · Designed for those who notice
      </div>
    </div>
  </div>
)}
      <aside style={css.sidebar}>
        <div style={css.logo}>
          <div style={css.logoIcon}>✦</div>
          <div style={{ ...css.logoText, ...css.serif }}>STAY</div>
        </div>
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          {navItems.map(n => (
            <div key={n.key} style={css.navItem(activeTab === n.key)} onClick={() => setActiveTab(n.key)}>
              <Icon d={n.icon} size={16} color={activeTab === n.key ? accentColor : C.muted} />
              {n.label}
            </div>
          ))}
        </nav>
        <div style={{ height:1, background:C.border, margin:'8px 0' }} />
        <div style={{ ...css.navItem(false), color:C.red }} onClick={() => setShowLogout(true)}>
          <Icon d={Icons.logout} size={16} color={C.red} /> Sign Out
        </div>
      </aside>

      <main style={css.main}>
        <div style={css.bgImg} />
        <div style={css.content}>
          <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:'3px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>
                {isVip ? 'Good evening — Elite Member' : 'Good evening — Welcome'}
              </div>
              <h1 style={{ ...css.serif, fontSize:34, fontWeight:300, color:'#f8fafc', letterSpacing:'-0.5px', lineHeight:1.1 }}>
                Welcome, {guestName}
              </h1>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={() => showToast(`${myOrders.length} orders · ${ledger.length} open charges`,'accent')}
                style={{ width:38, height:38, borderRadius:10, border:`1px solid ${C.border}`, background:C.card,
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
                <Icon d={Icons.bell} size={16} color={C.muted} />
                <span style={{ position:'absolute', top:8, right:8, width:6, height:6, background:accentColor, borderRadius:'50%' }} />
              </button>
              {isVip && (
                <span style={{ padding:'5px 12px', background:'rgba(59,130,246,0.12)',
                  border:`1px solid rgba(59,130,246,0.3)`, borderRadius:20,
                  fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:accentColor, fontWeight:600 }}>
                  ✦ VIP ACCESS
                </span>
              )}
            </div>
          </header>

         
          {activeTab === 'overview' && (
            <>
              {/* ── Digital Room Key ── */}
              <div style={{ ...css.glassCard, display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, marginBottom:20, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-60, right:160, width:200, height:200,
                  background:`radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%)`, pointerEvents:'none' }} />
                <div style={{ maxWidth:400 }}>
                  <div style={{ fontSize:10, letterSpacing:'2.5px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:10 }}>
                    ▸ Suite {roomNumber} — Encrypted Access
                  </div>
                  <h2 style={{ ...css.serif, fontSize:34, fontWeight:300, color:'#f8fafc', lineHeight:1, marginBottom:8 }}>
                    Digital Room Key
                  </h2>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
                    Hold your device near the door sensor. Your key is end-to-end encrypted and refreshes every session.
                  </p>
                  <div style={{ display:'flex', gap:10 }}>
                    <button style={css.btnPrimary} onClick={generateToken}>Generate Token</button>
                    <button style={css.btnGhost} onClick={() => setShowKeyModal(true)}>View Details</button>
                  </div>
                </div>
                <div style={{ width:150, height:150, minWidth:150, borderRadius:'50%',
                  border:`1.5px dashed rgba(59,130,246,0.35)`,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  background:`radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%)`, position:'relative' }}>
                  <Icon d={Icons.key} size={28} color={accentColor} style={{ marginBottom:8 }} />
                  <div style={{ fontSize:22, fontWeight:700, letterSpacing:6, color:accentColor }}>{keyCode}</div>
                  <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginTop:4, textTransform:'uppercase' }}>
                    Secure ID · {roomNumber}
                  </div>
                </div>
              </div>
 
              {/* ── Reservation Card ── */}
              <div style={{ ...css.card, marginBottom:16 }}>
                <div style={css.cardHeader}>
                  <span style={css.cardTitle}>My Reservation</span>
                  <Icon d={Icons.clock} size={16} color={C.muted} />
                </div>
 
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, marginBottom:18 }}>
                  <div>
                    <div style={{ fontSize:10, color:C.muted, letterSpacing:1.5, marginBottom:4 }}>CHECK-IN</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
                      {booking?.check_in_date ? new Date(booking.check_in_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.muted, letterSpacing:1.5, marginBottom:4 }}>CHECK-OUT</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
                      {booking?.check_out_date ? new Date(booking.check_out_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.muted, letterSpacing:1.5, marginBottom:4 }}>NIGHTS · GUESTS</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
                      {booking?.nights || '—'} · {booking?.guest_count || 1}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.muted, letterSpacing:1.5, marginBottom:4 }}>TOTAL</div>
                    <div style={{ ...css.serif, fontSize:20, color:accentColor, lineHeight:1 }}>
                      ₵{booking?.total_amount ? Number(booking.total_amount).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
 
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={openModifyModal}
                    style={{ flex:1, padding:10, borderRadius:10, background:'rgba(59,130,246,0.08)',
                      border:`1px solid ${C.border}`, color:accentColor, fontSize:11, fontWeight:700,
                      letterSpacing:1.2, textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit' }}>
                    Modify Reservation
                  </button>
                  <button onClick={() => setShowCancelModal(true)}
                    style={{ flex:1, padding:10, borderRadius:10, background:'rgba(239,68,68,0.08)',
                      border:'1px solid rgba(239,68,68,0.25)', color:C.red, fontSize:11, fontWeight:700,
                      letterSpacing:1.2, textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit' }}>
                    Cancel Booking
                  </button>
                </div>
 
                {!canCancelFree && (
                  <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(245,158,11,0.08)',
                    border:'1px solid rgba(245,158,11,0.25)', borderRadius:10,
                    fontSize:11, color:C.gold || '#f59e0b' }}>
                    ⚠ Less than 24 hours to check-in — cancellation will not be refunded.
                  </div>
                )}
              </div>
 
              {/* ── Quick links row ── */}
              <div style={{ display:'flex', gap:12 }}>
                {[
                  { label:'Order Food', icon:'🍽', tab:'dining', color:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', text:'#f59e0b' },
                  { label:'AI Concierge', icon:'✦', tab:'concierge', color:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)', text:accentColor },
                  { label:'My Folio', icon:'₵', tab:'billing', color:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.25)', text:'#10b981' },
                  { label:'Explore Hotel', icon:'🏊', tab:'explore', color:'rgba(139,92,246,0.1)', border:'rgba(139,92,246,0.25)', text:'#8b5cf6' },
                ].map(q => (
                  <button key={q.tab} onClick={() => setActiveTab(q.tab)}
                    style={{ flex:1, padding:'14px 8px', borderRadius:14, background:q.color,
                      border:`1px solid ${q.border}`, color:q.text, fontSize:11, fontWeight:700,
                      cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column',
                      alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:20 }}>{q.icon}</span>
                    <span style={{ letterSpacing:0.5 }}>{q.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {/* ══ EXPLORE TAB ══ */}
          {activeTab === 'explore' && (
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'3px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Discover</div>
                <h2 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc' }}>Explore The Afia</h2>
              </div>
 
              {/* Facilities grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
                {[
                  { icon:'🏊', name:'Sky Pool', floor:14, hours:'6 AM – 11 PM', temp:'28°C', color:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.25)', action:'Reserve Cabana' },
                  { icon:'💆', name:'Zen Spa', floor:2, hours:'8 AM – 10 PM', temp:'Treatments from ₵180', color:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.25)', action:'Book Session' },
                  { icon:'🏋', name:'Fitness Center', floor:4, hours:'Open 24 hours', temp:'Personal trainers available', color:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', action:'Book Trainer' },
                  { icon:'🍸', name:'Sky Bar', floor:15, hours:'5 PM – 2 AM', temp:'Panoramic city views', color:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', action:'Reserve Table' },
                ].map(f => (
                  <div key={f.name} style={{ ...css.card, background:f.color, border:`1px solid ${f.border}` }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>{f.icon}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>{f.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Floor {f.floor} · {f.hours}</div>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>{f.temp}</div>
                    <button style={{ ...css.btnFull, marginTop:0 }}
                      onClick={() => showToast(`${f.action} request sent!`, 'accent')}>
                      {f.action}
                    </button>
                  </div>
                ))}
              </div>
 
              {/* Day trips */}
              <div style={css.card}>
                <div style={css.cardHeader}>
                  <span style={css.cardTitle}>Day Experiences</span>
                  <span style={{ color:accentColor }}>✦</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { name:'Cape Coast Castle', duration:'Full day', price:'₵450', icon:'🏰' },
                    { name:'Kakum Canopy Walk', duration:'Half day', price:'₵380', icon:'🌿' },
                    { name:'Aburi Gardens', duration:'Half day', price:'₵220', icon:'🌺' },
                    { name:'Accra City Tour', duration:'4 hours', price:'₵300', icon:'🏙' },
                  ].map(t => (
                    <div key={t.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:22 }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{t.name}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{t.duration} · Transport included</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ ...css.serif, fontSize:16, color:accentColor }}>{t.price}</span>
                        <button style={{ ...css.btnFull, marginTop:0, padding:'6px 14px', width:'auto' }}
                          onClick={() => showToast(`${t.name} booking request sent!`, 'accent')}>
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Transport */}
              <div style={{ ...css.card, marginTop:14 }}>
                <div style={css.cardHeader}>
                  <span style={css.cardTitle}>Transport</span>
                  <span style={{ fontSize:18 }}>🚗</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { name:'City Ride', price:'₵120', icon:'🚙' },
                    { name:'Airport Transfer', price:'₵250', icon:'✈️' },
                    { name:'Luxury Chauffeur', price:'₵200/hr', icon:'🎩' },
                    { name:'Tuk Tuk Tour', price:'₵80', icon:'🛺' },
                  ].map(t => (
                    <button key={t.name} onClick={() => showToast(`${t.name} arranged!`, 'accent')}
                      style={{ padding:'14px 12px', borderRadius:12, background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)', color:'#fff', cursor:'pointer',
                        fontFamily:'inherit', textAlign:'left' }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{t.icon}</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{t.name}</div>
                      <div style={{ fontSize:12, color:accentColor, marginTop:2 }}>{t.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'dining' && (
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'3px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Gourmet Dining</div>
                <h2 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc' }}>Chef's Selection — Tonight</h2>
              </div>
              {menuItems.length === 0 ? (
                <div style={{ ...css.card, textAlign:'center', padding:40, color:C.muted }}>
                  The menu is being prepared. Please check back shortly.
                </div>
              ) : Object.keys(menuByCat).map(cat => (
                <div key={cat} style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:C.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10, fontWeight:600 }}>{cat}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    {menuByCat[cat].map(item => (
                      <div key={item.id} style={css.card}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div style={{ flex:1 }}>
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} style={{ width:'100%', height:90, objectFit:'cover', borderRadius:10, marginBottom:8 }} onError={e => e.target.style.display='none'} />
                              : <div style={{ fontSize:22, marginBottom:8 }}>{CAT_ICON[item.category] || CAT_ICON.default}</div>}
                            <div style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>{item.name}</div>
                            <div style={{ fontSize:11, color:C.muted }}>{item.description}</div>
                          </div>
                          <div style={{ textAlign:'right', marginLeft:12 }}>
                            <div style={{ ...css.serif, fontSize:22, color:accentColor }}>₵{item.price}</div>
                            <button style={{ ...css.btnFull, marginTop:8, padding:'6px 16px', width:'auto' }} onClick={() => addToCart(item)}>Add</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={css.card}>
                <div style={css.cardHeader}>
                  <span style={css.cardTitle}>Your Cart</span>
                  <span style={{ fontSize:16 }}>🛒</span>
                </div>
                {cartItems.length === 0
                  ? <div style={{ textAlign:'center', padding:'10px 0', fontSize:13, color:C.muted }}>Cart is empty</div>
                  : cartItems.map(ci => (
                    <div key={ci.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                      <span>{ci.qty}× {ci.name}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ color:accentColor }}>₵{(ci.price * ci.qty).toFixed(2)}</span>
                        <button onClick={() => setCartItems(prev => prev.filter(c => c.id !== ci.id))}
                          style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:14 }}>✕</button>
                      </span>
                    </div>
                  ))}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid ${C.border}`, paddingTop:12, marginTop:8 }}>
                  <span style={{ fontSize:13, color:C.muted }}>
                    Total: <span style={{ ...css.serif, fontSize:18, color:C.text }}>₵{cartTotal.toFixed(2)}</span>
                  </span>
                  <button style={{ ...css.btnPrimary, opacity: placingOrder ? 0.6 : 1 }} disabled={placingOrder} onClick={placeOrder}>
                    {placingOrder ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'concierge' && (
            <>
              <div style={{ marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'3px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>
                    {staffChatOpen ? 'Live Staff Chat' : 'AI Concierge'}
                  </div>
                  <h2 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc' }}>
                    {staffChatOpen ? 'Connected with our team' : 'How can I assist you?'}
                  </h2>
                </div>
                {staffChatOpen && (
                  <button style={{ ...css.btnGhost, color:C.red, borderColor:'rgba(239,68,68,0.3)' }} onClick={endStaffChat}>
                    End Chat
                  </button>
                )}
              </div>

              {!staffChatOpen ? (
                <div style={css.card}>
                  <div ref={chatRef} style={{ minHeight:280, maxHeight:380, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                    {chatMessages.map((m, i) => (
                      <div key={i}>
                        <div style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth:'80%', padding:'10px 14px', fontSize:13, lineHeight:1.5,
                            borderRadius: m.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: m.role==='user' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${m.role==='user' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          }}>{m.text}</div>
                        </div>
                        {m.offerHandoff && (
                          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                            <button onClick={startStaffChat}
                              style={{ padding:'10px 16px', borderRadius:12, border:'1px solid rgba(59,130,246,0.4)',
                                background:'rgba(59,130,246,0.10)', color:accentColor, fontWeight:700, fontSize:12,
                                cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
                              <Icon d={Icons.chat} size={14} color={accentColor} /> Chat with Staff
                            </button>
                            <button onClick={requestCall}
                              style={{ padding:'10px 16px', borderRadius:12, border:'1px solid rgba(245,158,11,0.4)',
                                background:'rgba(245,158,11,0.10)', color:C.gold, fontWeight:700, fontSize:12,
                                cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:'inherit' }}>
                              <Icon d={Icons.phone} size={14} color={C.gold} /> Request a Call
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Ask about hotel services..."
                      style={{ flex:1, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10,
                        padding:'10px 14px', color:C.text, fontFamily:'inherit', fontSize:13, outline:'none', height:42 }} />
                    <button style={{ ...css.btnPrimary, height:42, padding:'10px 18px' }} onClick={() => sendChat()}>Send</button>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
                    {['Pool hours?','Book spa','WiFi password','Restaurant menu','Late checkout','Airport taxi'].map(s => (
                      <button key={s} style={css.chip(false)} onClick={() => { setChatInput(s); sendChat(s); }}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={css.card}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12,
                    background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', marginBottom:14 }}>
                    <Icon d={Icons.headset} size={16} color={C.green} />
                    <div style={{ fontSize:12, color:C.green, fontWeight:600 }}>
                      Live · Connected to Front Desk
                    </div>
                  </div>
                  <div ref={staffChatRef} style={{ minHeight:280, maxHeight:380, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                    {staffMessages.length === 0 ? (
                      <div style={{ textAlign:'center', padding:30, color:C.muted, fontSize:13 }}>
                        Connecting you to a staff member...
                      </div>
                    ) : staffMessages.map(m => (
                      <div key={m.id} style={{ display:'flex', justifyContent: m.sender === 'guest' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth:'80%', padding:'10px 14px', fontSize:13, lineHeight:1.5,
                          borderRadius: m.sender === 'guest' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: m.sender === 'guest' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.12)',
                          border: `1px solid ${m.sender === 'guest' ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
                        }}>
                          {m.sender === 'staff' && (
                            <div style={{ fontSize:9, color:C.green, fontWeight:700, marginBottom:4, letterSpacing:1, textTransform:'uppercase' }}>
                              Staff · Front Desk
                            </div>
                          )}
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <input value={staffInput} onChange={e => setStaffInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendToStaff()}
                      placeholder="Type your message..."
                      style={{ flex:1, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10,
                        padding:'10px 14px', color:C.text, fontFamily:'inherit', fontSize:13, outline:'none', height:42 }} />
                    <button style={{ ...css.btnPrimary, height:42, padding:'10px 18px' }} onClick={sendToStaff}>Send</button>
                  </div>
                </div>
              )}
            </>
          )}

         {activeTab === 'billing' && (
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'3px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>My Folio</div>
                <h2 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc' }}>Suite {roomNumber} — Statement</h2>
              </div>
              <div style={css.grid3}>
                {[
                  { label:'Total Outstanding', val:`₵${totalOwed.toFixed(2)}`, color:C.text },
                  { label:'Open Charges', val:ledger.length, color:accentColor },
                  { label:'Orders Placed', val:myOrders.length, color:accentColor },
                ].map(s => (
                  <div key={s.label} style={{ ...css.card, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{s.label}</div>
                    <div style={{ ...css.serif, fontSize:36, fontWeight:300, color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...css.card, marginBottom:14 }}>
                <div style={css.cardHeader}><span style={css.cardTitle}>Transaction History</span></div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ fontSize:10, color:C.muted, letterSpacing:'1.5px' }}>
                      {['DATE','DESCRIPTION','STATUS','AMOUNT'].map(h => (
                        <th key={h} style={{ padding:'8px 0', textAlign: h==='AMOUNT' ? 'right' : 'left', fontWeight:500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.length === 0
                      ? <tr><td colSpan="4" style={{ padding:'20px 0', textAlign:'center', color:C.muted }}>No outstanding charges — you're all settled.</td></tr>
                      : ledger.map(r => (
                        <tr key={r.id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding:'10px 0', fontSize:12, color:C.muted }}>{new Date(r.created_at).toLocaleDateString()}</td>
                          <td style={{ padding:'10px 0' }}>{r.description}</td>
                          <td style={{ padding:'10px 0' }}>
                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10,
                              background:'rgba(245,158,11,0.08)', color:'#f59e0b', border:`1px solid rgba(245,158,11,0.2)` }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding:'10px 0', textAlign:'right', ...css.serif, fontSize:13 }}>₵{Number(r.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={settleAll} disabled={payingNow || totalOwed <= 0}
                  style={{ flex:1, padding:14, borderRadius:10, background:'rgba(16,185,129,0.15)',
                    border:'1px solid rgba(16,185,129,0.35)', color:C.green, fontSize:13, fontWeight:600,
                    letterSpacing:'1px', cursor:(payingNow || totalOwed<=0) ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', opacity:(payingNow || totalOwed<=0) ? 0.6 : 1 }}>
                  {payingNow ? 'Opening payment...' : totalOwed <= 0 ? '✓ All Settled' : `✓ Pay ₵${totalOwed.toFixed(2)} (Card / MoMo)`}
                </button>
                <button style={css.btnPrimary} onClick={async () => {
                  showToast("Sending invoice...", "accent");
                  const result = await sendInvoiceEmail({
                    to: user?.email || "[email protected]",
                    guestName,
                    roomNumber,
                    suiteType: booking?.room_types?.name || "Suite",
                    checkInDate: booking?.check_in_date,
                    checkOutDate: booking?.check_out_date,
                    nights: booking?.nights,
                    charges: ledger.map(l => ({
                      description: l.description || l.item_name || "Charge",
                      amount: l.amount,
                      category: l.category || "General",
                    })),
                    totalCharged: ledger.reduce((s, l) => s + Number(l.amount || 0), 0),
                    totalPaid: ledger.filter(l => l.status === "paid").reduce((s, l) => s + Number(l.amount || 0), 0),
                    bookingId: booking?.id,
                  });
                  if (result.ok) {
                    showToast("Invoice sent to your email!", "accent");
                  } else {
                    showToast("Failed to send — try on the live site", "red");
                  }
                }}>
                  📄Send Invoice
                </button>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'3px', color:accentColor, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Room Settings</div>
                <h2 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc' }}>Suite Preferences</h2>
              </div>
              <div style={css.grid2}>
                <div style={css.card}>
                  <div style={css.cardHeader}><span style={css.cardTitle}>Climate Control</span></div>
                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    <div>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Temperature</div>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <button style={css.tempBtn} onClick={() => setTemp(t => Math.max(16,t-1))}>−</button>
                        <span style={{ ...css.serif, fontSize:36, fontWeight:300, color:'#f8fafc' }}>{temp}°C</span>
                        <button style={css.tempBtn} onClick={() => setTemp(t => Math.min(30,t+1))}>+</button>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13 }}>Do Not Disturb</span>
                      <div onClick={() => { setIsDND(d => !d); showToast(isDND ? 'DND off' : 'DND on','accent'); }}
                        style={{ width:48, height:26, borderRadius:13, border:`1px solid ${isDND ? accentColor : C.border}`,
                          background: isDND ? 'rgba(59,130,246,0.3)' : C.card2, cursor:'pointer', position:'relative', transition:'all 0.3s' }}>
                        <div style={{ position:'absolute', top:3, left: isDND ? 27 : 3, width:18, height:18,
                          borderRadius:'50%', background: isDND ? accentColor : C.muted, transition:'all 0.3s' }} />
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13 }}>Lighting Mode</span>
                      <div style={{ display:'flex', gap:6 }}>
                        {['Warm','Cool','Auto'].map(m => (
                          <button key={m} style={css.chip(lightMode === m)}
                            onClick={() => { setLightMode(m); showToast(`Lighting: ${m}`,'accent'); }}>{m}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={css.card}>
                    <div style={css.cardHeader}><span style={css.cardTitle}>Wake-Up Call</span></div>
                    <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                      style={{ width:'100%', background:C.card2, border:`1px solid ${C.border}`, borderRadius:10,
                        padding:'10px 14px', color:C.text, fontFamily:'inherit', fontSize:13, outline:'none', marginBottom:10, boxSizing:'border-box' }} />
                    <button style={{ ...css.btnPrimary, width:'100%', padding:10 }}
                      onClick={() => showToast(`Wake-up call set: ${wakeTime}`,'accent')}>Set Wake-Up Call</button>
                  </div>
                  <div style={css.card}>
                    <div style={css.cardHeader}><span style={css.cardTitle}>Housekeeping</span></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <button style={css.btnFull} onClick={() => { setSelCat('Housekeeping'); setReqNote('Schedule a cleaning'); sendRequest(); }}>Schedule Cleaning</button>
                      <button style={css.btnFull} onClick={() => { setSelCat('Towels'); setReqNote('Extra towels please'); sendRequest(); }}>Extra Towels</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ textAlign:'center', marginTop:40, opacity:0.2 }}>
            <p style={{ fontSize:9, letterSpacing:5, fontWeight:500 }}>STAYPILOT · ENCRYPTED END-TO-END · SUITE {roomNumber}</p>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <Modal show={showKeyModal} onClose={() => setShowKeyModal(false)}>
        <h3 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc', marginBottom:8 }}>Room Key Details</h3>
        <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
          Your digital key is cryptographically secured. Hold your device near the NFC reader.
        </p>
        <div style={{ textAlign:'center', padding:24, background:'rgba(59,130,246,0.06)',
          border:`1px dashed rgba(59,130,246,0.3)`, borderRadius:14, marginBottom:20 }}>
          <div style={{ ...css.serif, fontSize:40, fontWeight:300, letterSpacing:10, color:accentColor }}>{keyCode}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:8, letterSpacing:2 }}>SUITE {roomNumber} · SESSION TOKEN</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button style={{ ...css.btnPrimary, flex:1 }} onClick={() => generateToken()}>Refresh Token</button>
          <button style={{ ...css.btnGhost, flex:1 }} onClick={() => setShowKeyModal(false)}>Close</button>
        </div>
      </Modal>

      <Modal show={showLogout} onClose={() => setShowLogout(false)}>
        <h3 style={{ ...css.serif, fontSize:26, fontWeight:300, color:'#f8fafc', marginBottom:8 }}>Sign Out?</h3>
        <p style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
          End your session? You'll need to sign in again to access your suite.
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button style={{ ...css.btnPrimary, flex:1, background:C.red }} onClick={handleSignOut}>Confirm Sign Out</button>
          <button style={{ ...css.btnGhost, flex:1 }} onClick={() => setShowLogout(false)}>Stay</button>
        </div>
      </Modal>

      <Modal show={showCallModal} onClose={() => setShowCallModal(false)}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:60, height:60, borderRadius:'50%',
            background:'linear-gradient(135deg, #f59e0b, #fbbf24)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 18px', boxShadow:'0 10px 30px rgba(245,158,11,0.4)' }}>
            <Icon d={Icons.phone} size={26} color="#fff" />
          </div>
          <h3 style={{ ...css.serif, fontSize:24, fontWeight:300, color:'#f8fafc', margin:'0 0 8px' }}>
            Call Requested
          </h3>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:20 }}>
            Our team has been notified and will call you shortly.
            You can also reach our front desk directly:
          </p>
          <a href={`tel:${HOTEL_PHONE.replace(/\s/g,'')}`}
            style={{ display:'block', padding:'16px 20px',
              background:'rgba(245,158,11,0.08)',
              border:'1px dashed rgba(245,158,11,0.4)', borderRadius:14,
              textDecoration:'none', marginBottom:20 }}>
            <div style={{ fontSize:10, color:C.gold, letterSpacing:2, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>
              Tap to Call
            </div>
            <div style={{ ...css.serif, fontSize:24, color:'#fff', fontWeight:300, letterSpacing:1 }}>
              {HOTEL_PHONE}
            </div>
          </a>
          <button style={{ ...css.btnPrimary, width:'100%' }} onClick={() => setShowCallModal(false)}>Got It</button>
        </div>
      </Modal>
{/* ── MODIFY MODAL ── */}
      <Modal show={showModifyModal} onClose={() => setShowModifyModal(false)}>
        <h3 style={{ ...css.serif, fontSize: 24, fontWeight: 300, color: "#f8fafc", margin: "0 0 8px" }}>
          Modify Reservation
        </h3>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 22 }}>
          Pick new dates, suite type, or guest count. We'll re-check availability and reassign your room.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: accentColor, marginBottom: 6, fontWeight: 700 }}>CHECK-IN</div>
            <input type="date" value={modifyCheckIn} min={new Date().toISOString().split("T")[0]}
              onChange={e => setModifyCheckIn(e.target.value)}
              style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: accentColor, marginBottom: 6, fontWeight: 700 }}>CHECK-OUT</div>
            <input type="date" value={modifyCheckOut} min={modifyCheckIn}
              onChange={e => setModifyCheckOut(e.target.value)}
              style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: accentColor, marginBottom: 6, fontWeight: 700 }}>SUITE TYPE</div>
          <select value={modifyTypeId || ""} onChange={e => setModifyTypeId(Number(e.target.value))}
            style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            <option value="" style={{ background: C.dark }}>— Select —</option>
            {roomTypes.map(t => (
              <option key={t.id} value={t.id} style={{ background: C.dark }}>
                {t.name} · ₵{Number(t.price_per_night).toLocaleString()}/night · fits {t.capacity}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: accentColor, marginBottom: 6, fontWeight: 700 }}>GUESTS</div>
          <select value={modifyGuests} onChange={e => setModifyGuests(Number(e.target.value))}
            style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n} style={{ background: C.dark }}>{n} {n===1?"Guest":"Guests"}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...css.btnGhost, flex: 1 }} onClick={() => setShowModifyModal(false)}>Cancel</button>
          <button style={{ ...css.btnPrimary, flex: 2, opacity: modifyBusy ? 0.6 : 1 }}
            disabled={modifyBusy} onClick={submitModify}>
            {modifyBusy ? "Updating..." : "Update Reservation"}
          </button>
        </div>
      </Modal>
 
      {/* ── CANCEL MODAL ── */}
      <Modal show={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <h3 style={{ ...css.serif, fontSize: 24, fontWeight: 300, color: "#f8fafc", margin: "0 0 8px" }}>
          Cancel Reservation?
        </h3>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>
          {canCancelFree
            ? "Cancelling now qualifies for a full refund. Your room will be released and your folio refunded."
            : "Your check-in is less than 24 hours away. Per our policy, this cancellation will not be refunded."}
        </p>
        <div style={{ padding: 14, borderRadius: 12, marginBottom: 22,
          background: canCancelFree ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${canCancelFree ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          fontSize: 12, color: canCancelFree ? C.green : C.red, fontWeight: 600, textAlign: "center" }}>
          {canCancelFree ? "✓ Eligible for full refund" : "⚠ No refund — within 24-hour window"}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...css.btnGhost, flex: 1 }} onClick={() => setShowCancelModal(false)}>Keep Booking</button>
          <button style={{ ...css.btnPrimary, flex: 2, background: C.red, opacity: cancelBusy ? 0.6 : 1 }}
            disabled={cancelBusy} onClick={submitCancel}>
            {cancelBusy ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </Modal>
      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  );
}
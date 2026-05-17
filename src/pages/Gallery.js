import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  ArrowLeft, X, Maximize2, Star, MapPin, Shield, Sparkles,
  Wifi, Coffee, Dumbbell, Waves, Users, Crown,
  CarTaxiFront, Clock3, Music4, Plane,
  HeartHandshake, Martini, BadgeCheck,
  Camera, Flower2, SunMedium, ShoppingCart, Search,
  Plus, Minus, Trash2, ChevronRight, CheckCircle2,
  Heart, MessageCircle, Send, Volume2, VolumeX,
  Sun, Sunset, Moon, Sunrise, Bot, ChevronDown,
  Zap, Gift, Compass, RotateCcw, Check, SlidersHorizontal,
  Star as StarIcon
} from 'lucide-react';

/* ─── Design tokens ─────────────────────────────────────────── */
const T = {
  bg:       '#020617',
  surface:  '#0b1628',
  card:     '#0f1f38',
  border:   'rgba(99,179,237,0.12)',
  accent:   '#3b82f6',
  accentHi: '#60a5fa',
  gold:     '#f59e0b',
  text:     '#f1f5f9',
  muted:    '#64748b',
  subtle:   '#94a3b8',
  danger:   '#ef4444',
  success:  '#22c55e',
};

/* ─── Tiny style helpers ────────────────────────────────────── */
const flex = (align='center', justify='flex-start', dir='row') =>
  ({ display:'flex', alignItems:align, justifyContent:justify, flexDirection:dir });

const btn = (bg=T.accent, extra={}) => ({
  background: bg,
  border: 'none',
  color: T.text,
  borderRadius: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all .2s',
  ...extra,
});

/* ─── Inject global styles once ───────────────────────────────*/
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${T.surface}; }
  ::-webkit-scrollbar-thumb { background: ${T.accent}; border-radius: 3px; }

  @keyframes fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulseRing { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:.7} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes spin360 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes heartPop { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
  @keyframes conciergeIn { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes typingDot { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
  @keyframes orbit { from{transform:rotate(0deg) translateX(6px) rotate(0deg)} to{transform:rotate(360deg) translateX(6px) rotate(-360deg)} }

  .fade-in    { animation: fadeIn  .4s ease both; }
  .slide-up   { animation: slideUp .5s ease both; }
  .slide-in-right { animation: slideInRight .4s ease both; }
  .card-hover { transition: transform .25s, box-shadow .25s; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(59,130,246,.18); }
  .pill-btn   { transition: background .2s, transform .15s; }
  .pill-btn:hover { transform: translateY(-1px); }
  .icon-btn   { transition: opacity .2s, transform .2s; }
  .icon-btn:hover { opacity: .75; transform: scale(1.1); }
  .qty-btn    { transition: background .15s; }
  .qty-btn:hover { background: ${T.accent} !important; }
  .heart-pop  { animation: heartPop .35s ease; }
  .concierge-in { animation: conciergeIn .35s cubic-bezier(.34,1.56,.64,1) both; }

  .typing-dot { display:inline-block; width:7px; height:7px; border-radius:50%;
    background:${T.accentHi}; margin:0 2px; animation: typingDot 1.4s infinite ease; }
  .typing-dot:nth-child(2) { animation-delay:.2s; }
  .typing-dot:nth-child(3) { animation-delay:.4s; }

  .panorama-container { cursor:grab; user-select:none; }
  .panorama-container:active { cursor:grabbing; }
  .hotspot { transition: transform .2s, box-shadow .2s; }
  .hotspot:hover { transform: scale(1.15); box-shadow: 0 0 20px rgba(59,130,246,.6); }
  .package-card { transition: transform .3s, box-shadow .3s, border-color .3s; }
  .package-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(59,130,246,.22); border-color: ${T.accent}; }
`;

function InjectCSS() {
  useEffect(() => {
    if (document.getElementById('gallery-css')) return;
    const s = document.createElement('style');
    s.id = 'gallery-css';
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}

/* ─── Data ──────────────────────────────────────────────────── */
const HERO_SLIDES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
];

const SECTIONS = [
  {
    title:"The StayPilot Experience", price:"Complimentary",
    description:"Luxury facilities curated for elite comfort and unforgettable moments.",
    items:[
      {id:1,title:"Grand Lobby Entrance",url:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"},
      {id:2,title:"Infinity Pool & Cabanas",url:"https://images.unsplash.com/photo-1571896349842-33c89424de2d"},
      {id:3,title:"Skyline Bar & Grill",url:"https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b"},
      {id:4,title:"Executive Meeting Center",url:"https://images.unsplash.com/photo-1431540015161-0bf868a2d407"},
      {id:5,title:"Luxury Spa Lounge",url:"https://images.unsplash.com/photo-1519823551278-64ac92734fb1"},
      {id:6,title:"Private Cinema Room",url:"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"},
    ],
  },
  {
    title:"Royal VIP Suites", price:"$1,200 / Night",
    description:"Designed for royalty with premium interiors and unmatched privacy.",
    items:[
      {id:7,title:"Royal Master Bedroom",url:"https://images.unsplash.com/photo-1590490360182-c33d57733427"},
      {id:8,title:"Gold Marble Bathroom",url:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a"},
      {id:9,title:"Private Dining Room",url:"https://images.unsplash.com/photo-1556912173-3bb406ef7e77"},
      {id:10,title:"Luxury Dressing Suite",url:"https://images.unsplash.com/photo-1558997519-83ea9252edf8"},
    ],
  },
  {
    title:"Events & Weddings", price:"Custom Packages",
    description:"Celebrate life's finest moments in premium style.",
    items:[
      {id:11,title:"Luxury Wedding Garden",url:"https://images.unsplash.com/photo-1519741497674-611481863552"},
      {id:12,title:"Conference Hall",url:"https://images.unsplash.com/photo-1505373877841-8d25f7d46678"},
      {id:13,title:"VIP Boardroom",url:"https://images.unsplash.com/photo-1497366216548-37526070297c"},
    ],
  },
  {
    title:"Signature Dining", price:"À la carte & Set Menus",
    description:"From sunrise brunch to sunset dinner and late-night cocktails.",
    items:[
      {id:14,title:"Oceanfront Brunch Terrace",url:"https://images.unsplash.com/photo-1551632433-2f0d3c6e5c5b"},
      {id:15,title:"Fine Dining Restaurant",url:"https://images.unsplash.com/photo-1517248135467-4c7edcad34b4"},
      {id:16,title:"Rooftop Sunset Dinner",url:"https://images.unsplash.com/photo-1565299623644-1a0e1f8f0f8e"},
      {id:17,title:"Private Chef Table",url:"https://images.unsplash.com/photo-1556909114-f6e7ad7d14a7"},
    ],
  },
];

const MENU_CATEGORIES = [
  {key:'all',   label:'All'},
  {key:'breakfast', label:'Breakfast'},
  {key:'lunch', label:'Lunch'},
  {key:'dinner', label:'Dinner'},
  {key:'drinks_alc', label:'Bar'},
  {key:'drinks_na', label:'Mocktails'},
  {key:'kids',  label:"Kids"},
];

const ALL_MENU_ITEMS = [
  {id:'m1', title:"English Breakfast",       price:25, category:"breakfast",  url:"https://images.unsplash.com/photo-1533089860892-a7c6f0a88666",  label:"Breakfast"},
  {id:'m2', title:"Avocado Brunch Bowl",     price:32, category:"breakfast",  url:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1",  label:"Brunch"},
  {id:'m3', title:"Grilled Octopus",         price:68, category:"lunch",      url:"https://images.unsplash.com/photo-1565299623644-1a0e1f8f0f8e",  label:"Lunch"},
  {id:'m4', title:"Fresh Lobster",           price:85, category:"dinner",     url:"https://images.unsplash.com/photo-1559742811-822873691df8",  label:"Dinner"},
  {id:'m5', title:"Premium Wagyu Steak",     price:145,category:"dinner",     url:"https://images.unsplash.com/photo-1544025162-d76694265947",  label:"Dinner"},
  {id:'m6', title:"Signature Martini",       price:18, category:"drinks_alc", url:"https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b",  label:"Cocktail"},
  {id:'m7', title:"Old Fashioned Whiskey",   price:28, category:"drinks_alc", url:"https://images.unsplash.com/photo-1517430811363-8c3a4f8e5b3c",  label:"Spirits"},
  {id:'m8', title:"Premium Champagne",       price:45, category:"drinks_alc", url:"https://images.unsplash.com/photo-1608889825204-5b1e3b5e5e5e",  label:"Champagne"},
  {id:'m9', title:"Virgin Mojito",           price:13, category:"drinks_na",  url:"https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b",  label:"Mocktail"},
  {id:'m10',title:"Berry Detox Smoothie",    price:11, category:"drinks_na",  url:"https://images.unsplash.com/photo-1554312914-8c8f5f2b2b2b",  label:"Smoothie"},
  {id:'m11',title:"Fresh Mango Juice",       price:10, category:"drinks_na",  url:"https://images.unsplash.com/photo-1622597468218-5e5e5e5e5e5e",  label:"Juice"},
  {id:'m12',title:"Chicken Nuggets & Fries", price:18, category:"kids",       url:"https://images.unsplash.com/photo-1568908869437-1e2f1e0c1e0e",  label:"Kids"},
  {id:'m13',title:"Mini Margherita Pizza",   price:16, category:"kids",       url:"https://images.unsplash.com/photo-1565299623644-1a0e1f8f0f8e",  label:"Kids"},
  {id:'m14',title:"Fruit Paradise Bowl",     price:14, category:"kids",       url:"https://images.unsplash.com/photo-1490474418585-ba9f2f8d5e2a",  label:"Kids"},
  {id:'m15',title:"Chocolate Milkshake",     price:9,  category:"kids",       url:"https://images.unsplash.com/photo-1554312914-8c8f5f2b2b2b",  label:"Kids"},
];

const AMENITIES = [
  {icon:<Wifi size={20}/>,        text:'High Speed WiFi',       sub:'food'},
  {icon:<Coffee size={20}/>,      text:'Luxury Breakfast',      sub:'food'},
  {icon:<Dumbbell size={20}/>,    text:'Fitness Center',        sub:'gallery'},
  {icon:<Users size={20}/>,       text:'Meeting Rooms',         sub:'gallery'},
  {icon:<CarTaxiFront size={20}/>,text:'Airport Pickup',        sub:'gallery'},
  {icon:<Crown size={20}/>,       text:'VIP Butler',            sub:'gallery'},
  {icon:<Plane size={20}/>,       text:'Helipad Access',        sub:'gallery'},
  {icon:<Music4 size={20}/>,      text:'Live Music Nights',     sub:'gallery'},
  {icon:<Waves size={20}/>,       text:'Private Beach',         sub:'gallery'},
  {icon:<Martini size={20}/>,     text:'Cocktail Hour',         sub:'food'},
  {icon:<Camera size={20}/>,      text:'Photoshoots',           sub:'gallery'},
  {icon:<Flower2 size={20}/>,     text:'Kids Club',             sub:'gallery'},
];

/* ─── NEW: Suite tiers ──────────────────────────────────────── */
const SUITE_TIERS = [
  {
    id:'deluxe',
    name:'Deluxe Room',
    price:320,
    badge: null,
    color:'#3b82f6',
    url:'https://images.unsplash.com/photo-1590490360182-c33d57733427',
    sqft:480,
    features:[
      'King or Twin Beds',
      'City or Pool View',
      'Premium Minibar',
      'Smart TV & Sonos',
      'Rain Shower',
      'Daily Housekeeping',
    ],
    notIncluded:['Private Plunge Pool','Butler Service','Airport Transfer'],
  },
  {
    id:'royal',
    name:'Suite Royale',
    price:1200,
    badge:'Most Popular',
    color:'#f59e0b',
    url:'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
    sqft:1100,
    features:[
      'Separate Living Room',
      'Panoramic Ocean View',
      'Private Plunge Pool',
      'Butler Service 16h',
      'Daily Champagne',
      'Spa Credits ($200)',
      'Airport Transfer (1-way)',
      'Premium Minibar',
    ],
    notIncluded:['Helicopter Transfer'],
  },
  {
    id:'presidential',
    name:'Presidential',
    price:3800,
    badge:'Ultra Luxury',
    color:'#a855f7',
    url:'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    sqft:3200,
    features:[
      '3 Bedroom Penthouse',
      'Private Infinity Pool',
      '24/7 Dedicated Butler',
      'Helicopter Transfer',
      'Unlimited Spa Access',
      'Private Chef on Request',
      'Rolls Royce Chauffeur',
      'Daily Floral & Champagne',
      'Priority Reservations',
    ],
    notIncluded:[],
  },
];

/* ─── NEW: Experience packages ──────────────────────────────── */
const PACKAGES = [
  {
    id:'romance',
    title:'Romance Escape',
    subtitle:'For Two',
    price:2800,
    nights:3,
    icon:'💑',
    gradient:'linear-gradient(135deg,#f43f5e22,#fb718522)',
    accentColor:'#f43f5e',
    includes:[
      'Suite Royale (3 nights)',
      'Candlelit Dinner for 2',
      'Couples Spa Treatment',
      'Rose Petal Turndown',
      'Champagne on Arrival',
      'Sunset Cruise (2hrs)',
    ],
  },
  {
    id:'executive',
    title:'Executive Retreat',
    subtitle:'Business Elite',
    price:4200,
    nights:5,
    icon:'💼',
    gradient:'linear-gradient(135deg,#3b82f622,#06b6d422)',
    accentColor:'#3b82f6',
    includes:[
      'Presidential Suite (5 nights)',
      'Airport Limousine Transfer',
      'Private Meeting Room (10hrs)',
      'Business Lounge Access',
      'Daily Fine Dining Credit $150',
      'Express Laundry Service',
    ],
  },
  {
    id:'wellness',
    title:'Wellness Journey',
    subtitle:'Mind & Body Reset',
    price:1950,
    nights:4,
    icon:'🧘',
    gradient:'linear-gradient(135deg,#22c55e22,#86efac22)',
    accentColor:'#22c55e',
    includes:[
      'Deluxe Garden View (4 nights)',
      'Daily Yoga & Meditation',
      'Full Spa Day Package',
      'Detox Menu Access',
      'Nutritionist Consultation',
      'Sunrise Beach Walk',
    ],
  },
  {
    id:'celebration',
    title:'Grand Celebration',
    subtitle:'Make it Unforgettable',
    price:6500,
    nights:2,
    icon:'🥂',
    gradient:'linear-gradient(135deg,#f59e0b22,#fde68a22)',
    accentColor:'#f59e0b',
    includes:[
      'Presidential Suite (2 nights)',
      'Private Event Space (6hrs)',
      'Cake & Floral Decoration',
      'Photo & Video Coverage',
      'Gourmet Catering for 20',
      'Fireworks Display (subject to availability)',
    ],
  },
];

/* ─── NEW: Panorama rooms ────────────────────────────────────── */
const PANORAMA_ROOMS = [
  {
    id:'lobby',
    label:'Grand Lobby',
    url:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    hotspots:[
      {x:30, y:55, label:'Concierge Desk', target:'suite'},
      {x:68, y:45, label:'Pool Access', target:'pool'},
    ],
  },
  {
    id:'suite',
    label:'Royal Suite',
    url:'https://images.unsplash.com/photo-1590490360182-c33d57733427',
    hotspots:[
      {x:20, y:60, label:'Back to Lobby', target:'lobby'},
      {x:75, y:50, label:'Marble Bathroom', target:'bathroom'},
    ],
  },
  {
    id:'pool',
    label:'Infinity Pool',
    url:'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
    hotspots:[
      {x:15, y:50, label:'Back to Lobby', target:'lobby'},
      {x:80, y:65, label:'Pool Bar', target:'bar'},
    ],
  },
  {
    id:'bathroom',
    label:'Marble Bathroom',
    url:'https://images.unsplash.com/photo-1584622650111-993a426fbf0a',
    hotspots:[
      {x:50, y:70, label:'Back to Suite', target:'suite'},
    ],
  },
  {
    id:'bar',
    label:'Skyline Bar',
    url:'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b',
    hotspots:[
      {x:20, y:60, label:'Back to Pool', target:'pool'},
      {x:75, y:55, label:'Fine Dining', target:'dining'},
    ],
  },
  {
    id:'dining',
    label:'Fine Dining',
    url:'https://images.unsplash.com/photo-1517248135467-4c7edcad34b4',
    hotspots:[
      {x:30, y:65, label:'Back to Bar', target:'bar'},
    ],
  },
];

/* ─── NEW: AI Concierge knowledge ──────────────────────────── */
const CONCIERGE_QA = [
  {
    triggers:['check-in','check in','checkin','arrival'],
    answer:"Check-in is from 3:00 PM. Early check-in from 12 PM is available (subject to availability). Your room key will be ready at the Grand Lobby concierge desk. Please have your booking reference handy.",
  },
  {
    triggers:['check-out','checkout','late','departure'],
    answer:"Check-out is at 12:00 PM. Late check-out until 3 PM can be arranged for $80 and until 6 PM for $140. Please notify our front desk 24hrs in advance.",
  },
  {
    triggers:['pool','swim','infinity'],
    answer:"Our Infinity Pool is open daily from 7:00 AM to 10:00 PM. Towels and loungers are complimentary. The pool bar serves cocktails and light bites from 10 AM–9 PM. Private cabana bookings are available from $120/day.",
  },
  {
    triggers:['spa','massage','wellness','treatment'],
    answer:"The Serenity Spa is open 9 AM–9 PM daily. We offer massages, facials, hydrotherapy, and bespoke wellness rituals. A 50-min signature massage starts at $130. Book through our concierge or dial 5 from your room phone.",
  },
  {
    triggers:['wifi','internet','password','connect'],
    answer:"Complimentary high-speed WiFi is available throughout the hotel. Network: StayPilot_Luxury | Password: Elite2026. Business lounge guests enjoy dedicated 1Gbps fiber.",
  },
  {
    triggers:['breakfast','restaurant','dining','food','menu','eat'],
    answer:"Breakfast is served in The Grand Terrace from 6:30–11:00 AM (buffet + à la carte). Signature Dining opens for lunch 12–3 PM and dinner 7–11 PM. 24/7 in-room dining is available. Check the Dining & Bar tab to pre-order!",
  },
  {
    triggers:['airport','transfer','taxi','transport','shuttle'],
    answer:"We offer complimentary airport transfer for Presidential Suite guests. Luxury sedan transfers for other rooms are $65 one-way. Book at least 4 hours in advance through the concierge (dial 0 from your room or message us here).",
  },
  {
    triggers:['gym','fitness','workout','exercise'],
    answer:"Our 24/7 Fitness Center features Technogym equipment, free weights, and a yoga studio. Personal training sessions are available from $90/hr. The center is located on Level 2.",
  },
  {
    triggers:['room service','deliver','bring','order'],
    answer:"Room service is available 24/7. Use the Dining & Bar tab to browse our full menu and add items to your order — they'll be charged directly to your room. Average delivery time is 25–35 minutes.",
  },
  {
    triggers:['suite','upgrade','room','book','reserve'],
    answer:"We have Deluxe Rooms from $320/night, Suite Royale from $1,200/night, and the Presidential Penthouse from $3,800/night. Use the Suite Comparison section to see all inclusions, or tap 'Book Now' to reserve your preferred room.",
  },
  {
    triggers:['price','cost','rate','how much'],
    answer:"Room rates range from $320 (Deluxe) to $3,800/night (Presidential). Our Experience Packages start at $1,950 for 4 nights and include curated extras. Check the Packages section for full details.",
  },
  {
    triggers:['cancel','refund','policy'],
    answer:"Cancellations made 48+ hours before arrival are fully refunded. Cancellations within 48 hours incur a one-night charge. No-shows are charged in full. Please review our full policy in your booking confirmation.",
  },
];

function getConciergeReply(msg) {
  const lower = msg.toLowerCase();
  for (const qa of CONCIERGE_QA) {
    if (qa.triggers.some(t => lower.includes(t))) {
      return qa.answer;
    }
  }
  return "Thank you for reaching out! I'd be delighted to help. For immediate assistance with specialized requests — private events, special dietary needs, or bespoke experiences — please call our 24/7 concierge line: +233 (0) 30 000 0000, or I can connect you directly. Is there anything else I can clarify?";
}

/* ─── Cart helpers ──────────────────────────────────────────── */
function cartTotal(cart) { return cart.reduce((s,it) => s + it.price * it.qty, 0); }
function cartCount(cart) { return cart.reduce((s,it) => s + it.qty, 0); }

/* ─── Time of day helper ────────────────────────────────────── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5  && h < 9)  return { label:'Good Morning',    icon:<Sunrise size={16}/>,  color:'#fbbf24' };
  if (h >= 9  && h < 17) return { label:'Good Afternoon',  icon:<Sun size={16}/>,      color:'#f59e0b' };
  if (h >= 17 && h < 20) return { label:'Good Evening',    icon:<Sunset size={16}/>,   color:'#f97316' };
  return                         { label:'Good Evening',    icon:<Moon size={16}/>,     color:'#818cf8' };
}

/* ─── Sub-components ───────────────────────────────────────── */

function QtyControl({ qty, onDec, onInc, small }) {
  const size = small ? 28 : 36;
  const font = small ? 13 : 15;
  return (
    <div style={{...flex('center','center'), gap:6}}>
      <button className="qty-btn" onClick={onDec} style={{
        width:size, height:size, borderRadius:8,
        background:'rgba(255,255,255,0.06)', border:`1px solid ${T.border}`,
        color:T.text, cursor:'pointer', fontSize:font, ...flex('center','center')
      }}><Minus size={small?12:14}/></button>
      <span style={{minWidth:22, textAlign:'center', fontWeight:700, fontSize:font}}>{qty}</span>
      <button className="qty-btn" onClick={onInc} style={{
        width:size, height:size, borderRadius:8,
        background:'rgba(255,255,255,0.06)', border:`1px solid ${T.border}`,
        color:T.text, cursor:'pointer', fontSize:font, ...flex('center','center')
      }}><Plus size={small?12:14}/></button>
    </div>
  );
}

/* ─── NEW: Panorama Viewer ──────────────────────────────────── */
function PanoramaViewer({ onClose }) {
  const [currentRoom, setCurrentRoom] = useState('lobby');
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const room = PANORAMA_ROOMS.find(r => r.id === currentRoom);

  const handleMouseDown = (e) => { setDragging(true); dragStart.current = e.clientX - offset; };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current;
    setOffset(Math.max(-200, Math.min(200, dx)));
  };
  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e) => { setDragging(true); dragStart.current = e.touches[0].clientX - offset; };
  const handleTouchMove = (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - dragStart.current;
    setOffset(Math.max(-200, Math.min(200, dx)));
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:2500,
      background:'rgba(2,6,23,0.97)',
      ...flex('center','center','column'),
    }}>
      {/* Header */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        padding:'18px 24px',
        ...flex('center','space-between'),
        background:'linear-gradient(to bottom, rgba(2,6,23,1), transparent)',
        zIndex:10,
      }}>
        <div style={{...flex('center','flex-start'), gap:12}}>
          <Compass size={18} color={T.accentHi}/>
          <span style={{fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700}}>
            360° Virtual Tour
          </span>
          <span style={{
            background:'rgba(59,130,246,0.2)', color:T.accentHi,
            padding:'3px 10px', borderRadius:50, fontSize:12,
          }}>{room.label}</span>
        </div>
        <button className="icon-btn" onClick={onClose} style={{
          background:'rgba(255,255,255,0.08)', border:'none', color:T.text,
          cursor:'pointer', borderRadius:50, padding:'8px',
          ...flex('center','center'),
        }}><X size={20}/></button>
      </div>

      {/* Panoramic image */}
      <div
        className="panorama-container"
        style={{
          position:'relative', width:'100vw', height:'100vh', overflow:'hidden',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <img
          src={room.url}
          alt={room.label}
          style={{
            position:'absolute',
            top:0, left:`calc(50% + ${offset}px)`,
            transform:'translateX(-50%)',
            height:'100%',
            width:'160%',
            maxWidth:'none',
            objectFit:'cover',
            transition: dragging ? 'none' : 'left .3s ease',
            pointerEvents:'none',
          }}
        />

        {/* Gradient overlays */}
        <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(2,6,23,0.5) 0%, transparent 30%, transparent 70%, rgba(2,6,23,0.8) 100%)', pointerEvents:'none'}}/>

        {/* Hotspots */}
        {room.hotspots.map((hs, i) => (
          <button key={i} className="hotspot" onClick={() => { setCurrentRoom(hs.target); setOffset(0); }}
            style={{
              position:'absolute',
              left:`calc(${hs.x}% + ${offset * 0.3}px)`,
              top:`${hs.y}%`,
              transform:'translate(-50%,-50%)',
              background:'rgba(59,130,246,0.25)',
              border:`2px solid ${T.accent}`,
              borderRadius:50,
              padding:'10px 18px',
              color:T.text, cursor:'pointer',
              ...flex('center','center'), gap:6,
              fontSize:12, fontWeight:700,
              backdropFilter:'blur(6px)',
            }}>
            <ChevronRight size={14}/> {hs.label}
          </button>
        ))}

        {/* Drag hint */}
        <div style={{
          position:'absolute', bottom:90, left:'50%', transform:'translateX(-50%)',
          color:T.muted, fontSize:12,
          ...flex('center','center'), gap:6,
          pointerEvents:'none',
        }}>
          <RotateCcw size={13}/> Drag to look around
        </div>
      </div>

      {/* Room selector nav */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding:'16px 24px',
        background:'linear-gradient(to top, rgba(2,6,23,1), transparent)',
        ...flex('center','center'), gap:8, flexWrap:'wrap',
      }}>
        {PANORAMA_ROOMS.map(r => (
          <button key={r.id} onClick={() => { setCurrentRoom(r.id); setOffset(0); }}
            className="pill-btn" style={{
              padding:'8px 18px', borderRadius:50, cursor:'pointer',
              fontSize:12, fontWeight:600,
              background: r.id === currentRoom ? T.accent : 'rgba(255,255,255,0.08)',
              border: r.id === currentRoom ? 'none' : `1px solid ${T.border}`,
              color:T.text,
            }}>{r.label}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── NEW: AI Concierge ─────────────────────────────────────── */
function AIConcierge({ onClose }) {
  const [messages, setMessages] = useState([
    {role:'ai', text:"Welcome to StayPilot! I'm Aria, your personal AI concierge. I'm here 24/7 to help with room info, dining, reservations, spa bookings, and anything else you need. How may I assist you today?"}
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef();

  const QUICK = ['Check-in time?','Pool hours?','Spa treatments?','Room service?','WiFi password?'];

  const sendMessage = useCallback((text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, {role:'user', text:msg}]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, {role:'ai', text: getConciergeReply(msg)}]);
    }, 1200 + Math.random() * 600);
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  return (
    <div className="concierge-in" style={{
      position:'fixed', bottom:100, right:24, zIndex:1800,
      width:'min(400px, calc(100vw - 32px))',
      background:T.surface,
      border:`1px solid ${T.border}`,
      borderRadius:24, overflow:'hidden',
      boxShadow:'0 32px 80px rgba(0,0,0,0.6)',
      ...flex('stretch','flex-start','column'),
      maxHeight:'70vh',
    }}>
      {/* Header */}
      <div style={{
        padding:'16px 20px',
        background:`linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))`,
        borderBottom:`1px solid ${T.border}`,
        ...flex('center','space-between'),
      }}>
        <div style={{...flex('center','flex-start'), gap:10}}>
          <div style={{
            width:38, height:38, borderRadius:50,
            background:'linear-gradient(135deg, #3b82f6, #6366f1)',
            ...flex('center','center'),
          }}>
            <Bot size={18} color='#fff'/>
          </div>
          <div>
            <p style={{fontWeight:700, fontSize:14}}>Aria · AI Concierge</p>
            <div style={{...flex('center','flex-start'), gap:5, marginTop:2}}>
              <div style={{width:7, height:7, borderRadius:50, background:T.success}}/>
              <span style={{fontSize:11, color:T.subtle}}>Always online</span>
            </div>
          </div>
        </div>
        <div style={{...flex('center','flex-start'), gap:8}}>
          <button className="icon-btn" onClick={() => setMuted(m => !m)} style={{
            background:'none', border:'none', color: muted ? T.muted : T.accentHi, cursor:'pointer',
          }}>{muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>
          <button className="icon-btn" onClick={onClose} style={{
            background:'none', border:'none', color:T.muted, cursor:'pointer'
          }}><X size={18}/></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{flex:1, overflowY:'auto', padding:'16px 20px', ...flex('stretch','flex-start','column'), gap:12}}>
        {messages.map((m, i) => (
          <div key={i} className="fade-in" style={{
            ...flex('flex-end', m.role==='user' ? 'flex-end' : 'flex-start'),
          }}>
            {m.role === 'ai' && (
              <div style={{
                width:26, height:26, borderRadius:50, flexShrink:0, marginRight:8, marginTop:'auto',
                background:'linear-gradient(135deg,#3b82f6,#6366f1)',
                ...flex('center','center'),
              }}><Bot size={13} color='#fff'/></div>
            )}
            <div style={{
              maxWidth:'80%',
              background: m.role==='ai'
                ? 'rgba(59,130,246,0.12)'
                : T.accent,
              borderRadius: m.role==='ai' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
              padding:'11px 15px',
              fontSize:13, lineHeight:1.55,
              color:T.text,
            }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div style={{...flex('center','flex-start'), gap:8}}>
            <div style={{
              width:26, height:26, borderRadius:50, flexShrink:0,
              background:'linear-gradient(135deg,#3b82f6,#6366f1)',
              ...flex('center','center'),
            }}><Bot size={13} color='#fff'/></div>
            <div style={{
              background:'rgba(59,130,246,0.12)',
              borderRadius:'4px 18px 18px 18px',
              padding:'14px 18px',
              ...flex('center','flex-start'), gap:2,
            }}>
              <span className="typing-dot"/>
              <span className="typing-dot"/>
              <span className="typing-dot"/>
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div style={{padding:'8px 16px', borderTop:`1px solid ${T.border}`, ...flex('center','flex-start'), gap:6, flexWrap:'wrap'}}>
        {QUICK.map(q => (
          <button key={q} onClick={() => sendMessage(q)} className="pill-btn" style={{
            padding:'5px 12px', borderRadius:50, fontSize:11, fontWeight:600,
            background:'rgba(59,130,246,0.1)', border:`1px solid rgba(59,130,246,0.25)`,
            color:T.accentHi, cursor:'pointer',
          }}>{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding:'12px 16px',
        borderTop:`1px solid ${T.border}`,
        ...flex('center','space-between'), gap:10,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && sendMessage()}
          placeholder="Ask Aria anything…"
          style={{
            flex:1, background:'rgba(255,255,255,0.04)',
            border:`1px solid ${T.border}`, borderRadius:12,
            padding:'10px 14px', color:T.text, fontSize:13,
            outline:'none',
          }}
        />
        <button onClick={() => sendMessage()} style={{
          ...btn(T.accent),
          width:40, height:40, borderRadius:12, flexShrink:0,
          ...flex('center','center'),
        }}><Send size={16}/></button>
      </div>
    </div>
  );
}

/* ─── NEW: Suite comparison ─────────────────────────────────── */
function SuiteComparison({ onBook }) {
  const [viewPref, setViewPref] = useState('ocean');
  const [bedConfig, setBedConfig] = useState('king');

  return (
    <div style={{padding:'60px 5%'}}>
      <div style={{textAlign:'center', marginBottom:48}}>
        <p style={{color:T.accentHi, letterSpacing:3, fontSize:12, fontWeight:500, marginBottom:10}}>
          CHOOSE YOUR SANCTUARY
        </p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(30px,3.5vw,48px)', fontWeight:700, marginBottom:12}}>
          Suite Comparison
        </h2>
        <p style={{color:T.subtle, fontSize:15}}>Compare every tier side by side. Customize your preferences below.</p>
      </div>

      {/* Preference selectors */}
      <div style={{...flex('center','center'), gap:24, flexWrap:'wrap', marginBottom:40}}>
        <div style={{...flex('center','flex-start'), gap:10}}>
          <SlidersHorizontal size={15} color={T.muted}/>
          <span style={{fontSize:13, color:T.subtle}}>View:</span>
          {['ocean','city','garden'].map(v => (
            <button key={v} onClick={() => setViewPref(v)} className="pill-btn" style={{
              padding:'6px 16px', borderRadius:50, fontSize:12, fontWeight:600, cursor:'pointer',
              background: viewPref===v ? T.accent : 'rgba(255,255,255,0.06)',
              border: viewPref===v ? 'none' : `1px solid ${T.border}`,
              color:T.text, textTransform:'capitalize',
            }}>{v}</button>
          ))}
        </div>
        <div style={{...flex('center','flex-start'), gap:10}}>
          <span style={{fontSize:13, color:T.subtle}}>Bed:</span>
          {['king','twin','queen'].map(b => (
            <button key={b} onClick={() => setBedConfig(b)} className="pill-btn" style={{
              padding:'6px 16px', borderRadius:50, fontSize:12, fontWeight:600, cursor:'pointer',
              background: bedConfig===b ? T.accent : 'rgba(255,255,255,0.06)',
              border: bedConfig===b ? 'none' : `1px solid ${T.border}`,
              color:T.text, textTransform:'capitalize',
            }}>{b}</button>
          ))}
        </div>
      </div>

      {/* Suite cards */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
        gap:24, alignItems:'stretch',
      }}>
        {SUITE_TIERS.map(suite => (
          <div key={suite.id} className="card-hover" style={{
            background:T.card,
            border:`1px solid ${suite.badge ? suite.color + '55' : T.border}`,
            borderRadius:24, overflow:'hidden',
            position:'relative',
          }}>
            {suite.badge && (
              <div style={{
                position:'absolute', top:16, right:16, zIndex:10,
                background:suite.color, color:'#000',
                padding:'4px 12px', borderRadius:50,
                fontSize:11, fontWeight:800,
              }}>{suite.badge}</div>
            )}
            <div style={{height:180, overflow:'hidden'}}>
              <img src={suite.url} alt={suite.name} style={{
                width:'100%', height:'100%', objectFit:'cover',
              }}/>
            </div>
            <div style={{padding:'22px 22px 24px'}}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, marginBottom:4}}>
                {suite.name}
              </h3>
              <div style={{...flex('baseline','flex-start'), gap:4, marginBottom:6}}>
                <span style={{fontSize:26, fontWeight:800, color:suite.color}}>${suite.price.toLocaleString()}</span>
                <span style={{color:T.muted, fontSize:13}}>/night</span>
              </div>
              <div style={{...flex('center','flex-start'), gap:8, marginBottom:20, flexWrap:'wrap'}}>
                <span style={{color:T.subtle, fontSize:12}}>{suite.sqft} sq ft</span>
                <span style={{color:T.border}}>·</span>
                <span style={{color:T.subtle, fontSize:12, textTransform:'capitalize'}}>{viewPref} view</span>
                <span style={{color:T.border}}>·</span>
                <span style={{color:T.subtle, fontSize:12, textTransform:'capitalize'}}>{bedConfig} bed</span>
              </div>

              {/* Features */}
              <div style={{...flex('stretch','flex-start','column'), gap:7, marginBottom:16}}>
                {suite.features.map((f,i) => (
                  <div key={i} style={{...flex('center','flex-start'), gap:8}}>
                    <Check size={13} color={suite.color} strokeWidth={2.5}/>
                    <span style={{fontSize:13, color:T.subtle}}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Not included */}
              {suite.notIncluded.length > 0 && (
                <div style={{...flex('stretch','flex-start','column'), gap:6, marginBottom:20}}>
                  {suite.notIncluded.map((f,i) => (
                    <div key={i} style={{...flex('center','flex-start'), gap:8}}>
                      <Minus size={13} color={T.muted} strokeWidth={2}/>
                      <span style={{fontSize:12, color:T.muted, textDecoration:'line-through'}}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => onBook(suite)} style={{
                ...btn(suite.color === T.gold ? '#f59e0b' : suite.color),
                width:'100%', padding:'14px',
                borderRadius:14, fontSize:13,
                color: suite.color === T.gold ? '#000' : '#fff',
              }}>
                Book {suite.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── NEW: Experience Packages ──────────────────────────────── */
function ExperiencePackages({ onBook }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{padding:'60px 5%', background:T.surface}}>
      <div style={{textAlign:'center', marginBottom:48}}>
        <p style={{color:T.accentHi, letterSpacing:3, fontSize:12, fontWeight:500, marginBottom:10}}>
          CURATED EXPERIENCES
        </p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(30px,3.5vw,48px)', fontWeight:700, marginBottom:12}}>
          Signature Packages
        </h2>
        <p style={{color:T.subtle, fontSize:15}}>Everything thoughtfully bundled for the perfect stay.</p>
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
        gap:24,
      }}>
        {PACKAGES.map(pkg => (
          <div key={pkg.id} className="package-card card-hover" onClick={() => setSelected(selected===pkg.id ? null : pkg.id)} style={{
            background: pkg.gradient,
            border:`1px solid ${selected===pkg.id ? pkg.accentColor : T.border}`,
            borderRadius:24, padding:'28px 26px',
            cursor:'pointer',
          }}>
            <div style={{...flex('flex-start','space-between'), marginBottom:16}}>
              <span style={{fontSize:38}}>{pkg.icon}</span>
              <div style={{textAlign:'right'}}>
                <p style={{fontWeight:800, fontSize:22, color:pkg.accentColor}}>${pkg.price.toLocaleString()}</p>
                <p style={{color:T.muted, fontSize:12}}>{pkg.nights} nights</p>
              </div>
            </div>

            <h3 style={{fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, marginBottom:4}}>
              {pkg.title}
            </h3>
            <p style={{color:T.subtle, fontSize:13, marginBottom:20}}>{pkg.subtitle}</p>

            <div style={{
              maxHeight: selected===pkg.id ? '500px' : '0px',
              overflow:'hidden',
              transition:'max-height .4s ease',
            }}>
              <div style={{...flex('stretch','flex-start','column'), gap:8, marginBottom:20}}>
                {pkg.includes.map((inc,i) => (
                  <div key={i} style={{...flex('center','flex-start'), gap:8}}>
                    <CheckCircle2 size={14} color={pkg.accentColor}/>
                    <span style={{fontSize:13, color:T.subtle}}>{inc}</span>
                  </div>
                ))}
              </div>
              <button onClick={e => { e.stopPropagation(); onBook(pkg); }} style={{
                ...btn(pkg.accentColor),
                width:'100%', padding:'14px', borderRadius:14, fontSize:13,
                color: pkg.accentColor === T.gold ? '#000' : '#fff',
              }}>
                Reserve This Package
              </button>
            </div>

            <div style={{
              ...flex('center','space-between'),
              marginTop: selected===pkg.id ? 0 : 0,
              paddingTop: selected===pkg.id ? 0 : 0,
            }}>
              {selected !== pkg.id && (
                <span style={{fontSize:12, color:pkg.accentColor, ...flex('center','flex-start'), gap:4}}>
                  <ChevronDown size={14}/> View inclusions
                </span>
              )}
              <div style={{...flex('center','flex-end'), gap:4, marginLeft:'auto'}}>
                {[1,2,3,4,5].map(s => <StarIcon key={s} size={11} fill={pkg.accentColor} color={pkg.accentColor}/>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Cart Drawer (unchanged) ───────────────────────────────── */
function CartDrawer({ cart, onClose, onUpdate, onRemove, onCheckout }) {
  const total = cartTotal(cart);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, ...flex('stretch','flex-end') }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(2,6,23,0.75)', backdropFilter:'blur(4px)' }}/>
      <div style={{
        position:'relative', zIndex:1,
        width:'min(420px, 100vw)', height:'100vh',
        background:T.surface, borderLeft:`1px solid ${T.border}`,
        ...flex('stretch','flex-start','column'),
        animation:'slideUp .3s ease',
      }}>
        <div style={{ padding:'24px 24px 18px', borderBottom:`1px solid ${T.border}`, ...flex('center','space-between') }}>
          <div style={{ ...flex('center','flex-start'), gap:10 }}>
            <ShoppingCart size={20} color={T.accentHi}/>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Your Order</span>
            {cart.length > 0 && (
              <span style={{ background:T.accent, color:'#fff', borderRadius:999, padding:'2px 9px', fontSize:12, fontWeight:700 }}>{cartCount(cart)}</span>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} style={{ background:'none', border:'none', color:T.muted, cursor:'pointer' }}><X size={22}/></button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:'center', color:T.muted, paddingTop:60, ...flex('center','center','column'), gap:12 }}>
              <ShoppingCart size={40} strokeWidth={1}/><p style={{fontSize:15}}>Your cart is empty</p><p style={{fontSize:13}}>Add items from the menu below</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="fade-in" style={{ ...flex('center','space-between'), gap:12, padding:'14px 0', borderBottom:`1px solid ${T.border}` }}>
              <img src={item.url} alt={item.title} style={{ width:52, height:52, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</p>
                <p style={{ color:T.accentHi, fontWeight:700, fontSize:14, marginTop:3 }}>${(item.price * item.qty).toFixed(2)}</p>
              </div>
              <QtyControl small qty={item.qty} onDec={() => onUpdate(item.id, item.qty-1)} onInc={() => onUpdate(item.id, item.qty+1)}/>
              <button className="icon-btn" onClick={() => onRemove(item.id)} style={{ background:'none', border:'none', color:T.muted, cursor:'pointer' }}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding:'20px 24px', borderTop:`1px solid ${T.border}` }}>
            <div style={{ ...flex('center','space-between'), marginBottom:16 }}>
              <span style={{ color:T.subtle }}>Subtotal ({cartCount(cart)} items)</span>
              <span style={{ fontWeight:800, fontSize:20 }}>${total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} style={{ ...btn(T.accent), width:'100%', padding:'16px', borderRadius:14, fontSize:15, letterSpacing:'.5px' }}>
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Checkout Modal (unchanged) ────────────────────────────── */
function CheckoutModal({ cart, roomNumber, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('review');
  const total = cartTotal(cart);

  const chargeToRoom = async () => {
    if (!roomNumber) { alert("No room linked to this session."); return; }
    setLoading(true);
    try {
      const { data: booking, error: bErr } = await supabase
        .from("bookings").select("id, guest_name, room_number")
        .eq("room_number", roomNumber).eq("status","ACTIVE")
        .order("created_at",{ascending:false}).limit(1).single();
      if (bErr || !booking) throw new Error("No active booking found.");
      const rows = cart.map(it => ({
        booking_id:it.booking_id, room_number:booking.room_number,
        guest_name:booking.guest_name, item_type:it.category?.toUpperCase()||"FOOD",
        item_name:it.title, quantity:it.qty, unit_price:it.price,
        amount:it.price*it.qty, entry_type:"DEBIT", payment_method:"ROOM_CHARGE",
        status:"POSTED", note:"Charged via gallery cart",
      }));
      const { error: lErr } = await supabase.from("guest_ledger").insert(rows);
      if (lErr) throw lErr;
      setStep('success');
    } catch(err) { alert(err.message || "Failed to charge items."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, ...flex('center','center'), background:'rgba(2,6,23,0.85)', backdropFilter:'blur(6px)', padding:20 }}>
      <div className="slide-up" style={{ width:'100%', maxWidth:500, background:T.card, border:`1px solid ${T.border}`, borderRadius:28, overflow:'hidden' }}>
        {step === 'success' ? (
          <div style={{ padding:48, textAlign:'center', ...flex('center','center','column'), gap:16 }}>
            <CheckCircle2 size={56} color={T.success} strokeWidth={1.5}/>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28 }}>Order Placed!</h3>
            <p style={{ color:T.subtle, fontSize:14, maxWidth:320 }}>Your order has been received. Our team will deliver it shortly.</p>
            <button onClick={() => { onSuccess(); onClose(); }} style={{ ...btn(T.accent), marginTop:8, padding:'14px 36px' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding:'22px 24px', borderBottom:`1px solid ${T.border}`, ...flex('center','space-between') }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Confirm Order</span>
              <button className="icon-btn" onClick={onClose} style={{ background:'none', border:'none', color:T.muted, cursor:'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding:'20px 24px', maxHeight:'40vh', overflowY:'auto' }}>
              {cart.map(it => (
                <div key={it.id} style={{ ...flex('center','space-between'), gap:10, padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
                  <span style={{fontSize:14}}>{it.title} × {it.qty}</span>
                  <span style={{ color:T.accentHi, fontWeight:700, fontSize:14 }}>${(it.price*it.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'20px 24px', borderTop:`1px solid ${T.border}` }}>
              <div style={{ ...flex('center','space-between'), marginBottom:20 }}>
                <span style={{color:T.subtle}}>Total</span>
                <span style={{ fontSize:24, fontWeight:800 }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ ...flex('stretch','stretch','column'), gap:10 }}>
                <button onClick={() => { alert("MoMo/Card payment integration here."); setStep('success'); }} style={{ ...btn(T.accent), padding:'15px', borderRadius:14, fontSize:14 }}>PAY NOW</button>
                <button onClick={chargeToRoom} disabled={loading} style={{ ...btn('rgba(255,255,255,0.04)'), padding:'15px', borderRadius:14, fontSize:14, border:`1px solid ${T.border}` }}>
                  {loading ? 'PROCESSING…' : 'CHARGE TO ROOM'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */
const Gallery = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const roomNumber = location.state?.roomNumber || null;

  const [page,          setPage]         = useState('gallery');
  const [heroIndex,     setHeroIndex]    = useState(0);
  const [selectedImg,   setSelectedImg]  = useState(null);
  const [activeCat,     setActiveCat]    = useState('all');
  const [searchQ,       setSearchQ]      = useState('');
  const [cart,          setCart]         = useState([]);
  const [cartOpen,      setCartOpen]     = useState(false);
  const [checkoutOpen,  setCheckoutOpen] = useState(false);
  const [addedId,       setAddedId]      = useState(null);

  // NEW state
  const [wishlist,      setWishlist]     = useState(new Set());
  const [heartAnim,     setHeartAnim]    = useState(null);
  const [conciergeOpen, setConciergeOpen]= useState(false);
  const [panoramaOpen,  setPanoramaOpen] = useState(false);
  const [audioOn,       setAudioOn]      = useState(false);
  const [viewedRooms,   setViewedRooms]  = useState([]);
  const audioRef = useRef(null);
  const timeOfDay = getTimeOfDay();

  /* hero auto-advance */
  useEffect(() => {
    const t = setInterval(() => setHeroIndex(p => (p+1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  /* ambient audio toggle */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.18;
    }
    if (audioOn) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    return () => audioRef.current?.pause();
  }, [audioOn]);

  /* user behavior tracking */
  const trackView = useCallback((roomId) => {
    setViewedRooms(prev => {
      if (prev.includes(roomId)) return prev;
      return [...prev, roomId];
    });
  }, []);

  /* filtered menu */
  const filteredMenu = ALL_MENU_ITEMS.filter(it => {
    const matchCat = activeCat === 'all' || it.category === activeCat;
    const matchQ   = !searchQ || it.title.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  /* cart ops */
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === item.id);
      return ex ? prev.map(x => x.id===item.id ? {...x, qty:x.qty+1} : x) : [...prev, {...item, qty:1}];
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };
  const updateQty = (id, qty) => { if (qty < 1) removeItem(id); else setCart(prev => prev.map(x => x.id===id ? {...x,qty} : x)); };
  const removeItem = (id) => setCart(prev => prev.filter(x => x.id !== id));
  const clearCart  = () => setCart([]);
  const count = cartCount(cart);

  /* wishlist */
  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setHeartAnim(id);
    setTimeout(() => setHeartAnim(null), 400);
  };

  /* book handler */
  const handleBook = () => navigate('/register');

  /* ── Renders ── */

  const renderHero = () => (
    <div style={{ position:'relative', height:'92vh', overflow:'hidden' }}>
      {HERO_SLIDES.map((src,i) => (
        <img key={src} src={src} alt="" style={{
          position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
          opacity: i===heroIndex ? 1 : 0, transition:'opacity 1.2s ease',
        }}/>
      ))}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,.3) 0%, rgba(2,6,23,1) 100%)' }}/>

      {/* Nav */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, ...flex('center','space-between'), padding:'24px 5%' }}>
        <button onClick={() => navigate('/')} style={{ ...btn('rgba(255,255,255,0.08)'), padding:'11px 22px', borderRadius:50, border:`1px solid rgba(255,255,255,0.12)`, ...flex('center','center'), gap:6 }}>
          <ArrowLeft size={16}/> BACK
        </button>

        <div style={{ ...flex('center','center'), gap:10, flexWrap:'wrap' }}>
          {/* Time of day indicator */}
          <div style={{ ...flex('center','center'), gap:6, padding:'8px 14px', borderRadius:50, background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.08)`, fontSize:12, color:timeOfDay.color }}>
            {timeOfDay.icon} {timeOfDay.label}
          </div>

          {/* Audio toggle */}
          <button onClick={() => setAudioOn(a => !a)} style={{ ...btn('rgba(255,255,255,0.08)'), padding:'11px 14px', borderRadius:50, border:`1px solid rgba(255,255,255,0.12)`, ...flex('center','center'), gap:6, fontSize:12 }}>
            {audioOn ? <Volume2 size={15} color={T.accentHi}/> : <VolumeX size={15}/>}
            {audioOn ? 'Ambient On' : 'Ambient'}
          </button>

          {/* 360 tour */}
          <button onClick={() => setPanoramaOpen(true)} style={{ ...btn('rgba(255,255,255,0.08)'), padding:'11px 16px', borderRadius:50, border:`1px solid rgba(255,255,255,0.12)`, ...flex('center','center'), gap:6, fontSize:12 }}>
            <Compass size={15} color={T.accentHi}/> 360° Tour
          </button>

          {/* Cart */}
          <button onClick={() => setCartOpen(true)} style={{ ...btn('rgba(255,255,255,0.08)'), padding:'11px 18px', borderRadius:50, border:`1px solid rgba(255,255,255,0.12)`, ...flex('center','center'), gap:8, position:'relative' }}>
            <ShoppingCart size={18}/>
            {count > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, background:T.accent, color:'#fff', borderRadius:999, minWidth:20, height:20, fontSize:11, fontWeight:800, ...flex('center','center') }}>{count}</span>
            )}
            {count > 0 && <span style={{ fontSize:13, fontWeight:600 }}>${cartTotal(cart).toFixed(0)}</span>}
          </button>

          <button onClick={() => navigate('/register')} style={{ ...btn(T.accent), padding:'12px 26px', borderRadius:50, fontWeight:700 }}>BOOK NOW</button>
        </div>
      </div>

      {/* Hero text */}
      <div style={{ position:'absolute', top:'22%', left:'5%', zIndex:20, maxWidth:700, animation:'slideUp .8s ease both' }}>
        <p style={{ color:T.accentHi, letterSpacing:3, fontSize:12, marginBottom:14, fontWeight:500 }}>5-STAR GLOBAL LUXURY EXPERIENCE</p>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(52px,7vw,88px)', fontWeight:700, lineHeight:1.05, marginBottom:18 }}>
          Virtual<br/>Discovery
        </h1>
        <p style={{ fontSize:18, color:T.subtle, maxWidth:480, lineHeight:1.6 }}>
          Premium suites, private experiences, elite dining and world-class comfort.
        </p>
        <div style={{ ...flex('center','flex-start'), gap:24, flexWrap:'wrap', marginTop:24 }}>
          {[
            [<Star fill={T.gold} color={T.gold} size={14}/>, '5.0 Rating'],
            [<MapPin size={14}/>, 'Ghana'],
            [<Shield size={14}/>, 'Secure Booking'],
            [<Clock3 size={14}/>, '24/7 Concierge'],
          ].map(([icon,text],i) => (
            <span key={i} style={{ ...flex('center','center'), gap:6, fontSize:14, color:T.subtle }}>{icon} {text}</span>
          ))}
        </div>

        {/* Wishlist count if any */}
        {wishlist.size > 0 && (
          <div className="fade-in" style={{ marginTop:18, ...flex('center','flex-start'), gap:8 }}>
            <Heart size={14} fill={T.danger} color={T.danger}/>
            <span style={{ fontSize:13, color:T.subtle }}>{wishlist.size} saved to wishlist</span>
          </div>
        )}
      </div>

      {/* Slide dots */}
      <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', ...flex('center','center'), gap:8, zIndex:20 }}>
        {HERO_SLIDES.map((_,i) => (
          <button key={i} onClick={() => setHeroIndex(i)} style={{ width:i===heroIndex?24:8, height:8, borderRadius:4, background:i===heroIndex?T.accent:'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', transition:'all .3s' }}/>
        ))}
      </div>
    </div>
  );

  const renderAmenities = () => (
    <div style={{ padding:'0 5%', marginTop:-50, position:'relative', zIndex:50 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:14 }}>
        {AMENITIES.map((a,i) => (
          <div key={i} onClick={() => setPage(a.sub)} className="card-hover" style={{ background:T.card, borderRadius:18, padding:'20px 16px', border:`1px solid ${T.border}`, textAlign:'center', cursor:'pointer' }}>
            <div style={{ color:T.accentHi, marginBottom:8 }}>{a.icon}</div>
            <span style={{ fontSize:13, fontWeight:500 }}>{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPageTabs = () => (
    <div style={{ ...flex('center','center'), gap:8, padding:'48px 5% 0', flexWrap:'wrap' }}>
      {[['gallery','Gallery'],['food','Dining & Bar'],['suites','Suite Comparison'],['packages','Packages']].map(([key,label]) => (
        <button key={key} onClick={() => setPage(key)} className="pill-btn" style={{
          padding:'12px 32px', borderRadius:50, fontWeight:700, cursor:'pointer',
          background: page===key ? T.accent : 'transparent',
          border: page===key ? 'none' : `1px solid ${T.border}`,
          color:T.text, fontSize:14,
        }}>{label}</button>
      ))}
    </div>
  );

  const renderGallery = () => (
    <div style={{ padding:'40px 5% 100px' }}>
      {SECTIONS.map((sec,idx) => (
        <div key={idx} style={{ marginTop:72 }}>
          <div style={{ borderLeft:`3px solid ${T.accent}`, paddingLeft:20, marginBottom:30 }}>
            <div style={{ ...flex('flex-start','space-between'), flexWrap:'wrap', gap:12 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(26px,3vw,38px)', fontWeight:700 }}>{sec.title}</h2>
              <span style={{ color:T.accentHi, fontWeight:800, fontSize:18 }}>{sec.price}</span>
            </div>
            <p style={{ color:T.subtle, marginTop:8, fontSize:14 }}>{sec.description}</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:22 }}>
            {sec.items.map(item => {
              const loved = wishlist.has(item.id);
              return (
                <div key={item.id} onClick={() => { setSelectedImg(item.url); trackView(item.id); }}
                  className="card-hover" style={{ position:'relative', height:320, borderRadius:22, overflow:'hidden', cursor:'pointer', border:`1px solid ${T.border}` }}>
                  <img src={item.url} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s' }}/>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(2,6,23,.92), transparent 55%)' }}/>
                  <div style={{ position:'absolute', bottom:18, left:18 }}>
                    <h4 style={{ fontWeight:600, fontSize:15 }}>{item.title}</h4>
                    <p style={{ color:T.subtle, fontSize:12, marginTop:4 }}>Tap to preview</p>
                  </div>
                  <div style={{ position:'absolute', top:14, right:14, ...flex('center','center'), gap:8 }}>
                    {/* Wishlist heart */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleWishlist(item.id); }}
                      className={heartAnim===item.id ? 'heart-pop' : ''}
                      style={{ background:'rgba(0,0,0,0.45)', border:'none', borderRadius:50, width:36, height:36, ...flex('center','center'), cursor:'pointer' }}>
                      <Heart size={16} fill={loved ? T.danger : 'transparent'} color={loved ? T.danger : T.text}/>
                    </button>
                    <div style={{ background:'rgba(0,0,0,0.4)', padding:8, borderRadius:'50%' }}>
                      <Maximize2 size={16}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Behavior nudge */}
      {viewedRooms.length >= 3 && (
        <div className="fade-in" style={{
          marginTop:60, padding:'24px 28px',
          background:'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.08))',
          border:`1px solid rgba(59,130,246,0.25)`, borderRadius:20,
          ...flex('center','space-between'), flexWrap:'wrap', gap:12,
        }}>
          <div style={{ ...flex('center','flex-start'), gap:12 }}>
            <Zap size={20} color={T.accentHi}/>
            <div>
              <p style={{ fontWeight:700, fontSize:15 }}>You've explored {viewedRooms.length} spaces</p>
              <p style={{ color:T.subtle, fontSize:13, marginTop:2 }}>Ready to make it yours? Book your preferred suite now.</p>
            </div>
          </div>
          <button onClick={handleBook} style={{ ...btn(T.accent), padding:'12px 28px', borderRadius:50, fontSize:13 }}>
            Book Now <ChevronRight size={14} style={{ verticalAlign:'middle' }}/>
          </button>
        </div>
      )}
    </div>
  );

  const renderFood = () => (
    <div style={{ padding:'40px 5% 100px' }}>
      <div style={{ marginBottom:36 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(32px,4vw,52px)', fontWeight:700, marginBottom:8 }}>Michelin-Inspired Dining</h2>
        <p style={{ color:T.subtle }}>Crafted by master chefs. Every plate is an experience.</p>
      </div>

      <div style={{ ...flex('center','space-between'), flexWrap:'wrap', gap:14, marginBottom:36 }}>
        <div style={{ ...flex('center','flex-start'), gap:10, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:'10px 16px', minWidth:220, flex:1, maxWidth:340 }}>
          <Search size={16} color={T.muted}/>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search menu…"
            style={{ background:'none', border:'none', color:T.text, outline:'none', fontSize:14, width:'100%' }}/>
          {searchQ && <button onClick={() => setSearchQ('')} style={{ background:'none', border:'none', color:T.muted, cursor:'pointer' }}><X size={14}/></button>}
        </div>
        <div style={{ ...flex('center','flex-start'), gap:8, flexWrap:'wrap' }}>
          {MENU_CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCat(cat.key)} className="pill-btn" style={{
              padding:'9px 20px', borderRadius:50, cursor:'pointer', fontWeight:600, fontSize:13,
              background: activeCat===cat.key ? T.accent : 'transparent',
              border: activeCat===cat.key ? 'none' : `1px solid ${T.border}`,
              color:T.text,
            }}>{cat.label}</button>
          ))}
        </div>
      </div>

      <p style={{ color:T.muted, fontSize:13, marginBottom:24 }}>{filteredMenu.length} item{filteredMenu.length!==1?'s':''} found</p>

      {filteredMenu.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:T.muted }}>
          <Search size={40} strokeWidth={1} style={{ marginBottom:12 }}/><p>No items match your search</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:24 }}>
          {filteredMenu.map(item => {
            const inCart = cart.find(x => x.id === item.id);
            const justAdded = addedId === item.id;
            return (
              <div key={item.id} className="card-hover fade-in" style={{ background:T.card, borderRadius:22, overflow:'hidden', border:`1px solid ${justAdded?T.accent:T.border}`, transition:'border-color .3s' }}>
                <div style={{ position:'relative', height:220, overflow:'hidden' }}>
                  <img src={item.url} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  <div style={{ position:'absolute', top:12, right:12, background:`${T.card}cc`, backdropFilter:'blur(4px)', padding:'4px 12px', borderRadius:50, fontSize:12, fontWeight:600, color:T.accentHi }}>
                    {item.label}
                  </div>
                </div>
                <div style={{ padding:'18px 20px' }}>
                  <div style={{ ...flex('flex-start','space-between'), gap:8, marginBottom:6 }}>
                    <h4 style={{ fontWeight:600, fontSize:15, lineHeight:1.3 }}>{item.title}</h4>
                    <span style={{ color:T.accentHi, fontWeight:800, fontSize:17, flexShrink:0 }}>${item.price}</span>
                  </div>
                  {inCart ? (
                    <div style={{ ...flex('center','space-between'), marginTop:14 }}>
                      <span style={{ fontSize:13, color:T.subtle }}>In cart: {inCart.qty}</span>
                      <QtyControl qty={inCart.qty} onDec={() => updateQty(item.id, inCart.qty-1)} onInc={() => updateQty(item.id, inCart.qty+1)}/>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} style={{ ...btn(justAdded?T.success:T.accent), marginTop:14, width:'100%', padding:'13px', borderRadius:12, fontSize:13, letterSpacing:'.4px' }}>
                      {justAdded ? '✓ ADDED' : 'ADD TO ORDER'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCTA = () => (
    <div style={{ padding:'80px 5%', background:T.surface, textAlign:'center', borderTop:`1px solid ${T.border}` }}>
      <Sparkles size={28} color={T.accentHi} style={{ marginBottom:14 }}/>
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(32px,4vw,52px)', fontWeight:700, marginBottom:12 }}>Experience Elite Hospitality</h2>
      <p style={{ color:T.subtle, maxWidth:600, margin:'0 auto 28px', lineHeight:1.7 }}>Reserve your suite today and enjoy the finest standard of modern luxury.</p>
      <button onClick={() => navigate('/register')} style={{ ...btn(T.accent), padding:'16px 40px', borderRadius:50, fontSize:15, fontWeight:700 }}>
        Reserve Your Suite <ChevronRight size={16} style={{ verticalAlign:'middle' }}/>
      </button>
    </div>
  );

  /* ── Main render ── */
  return (
    <div style={{ background:T.bg, color:T.text, minHeight:'100vh' }}>
      <InjectCSS/>

      {renderHero()}
      {renderAmenities()}
      {renderPageTabs()}

      {page === 'food'     && renderFood()}
      {page === 'gallery'  && renderGallery()}
      {page === 'suites'   && <SuiteComparison onBook={handleBook}/>}
      {page === 'packages' && <ExperiencePackages onBook={handleBook}/>}

      {renderCTA()}

      <div style={{ textAlign:'center', padding:36, color:T.muted, fontSize:13 }}>
        © 2026 StayPilot Luxury Hotels — Where Elegance Lives
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div onClick={() => setSelectedImg(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:1500, ...flex('center','center') }}>
          <button className="icon-btn" onClick={() => setSelectedImg(null)} style={{ position:'absolute', top:24, right:24, background:'none', border:'none', color:T.text, cursor:'pointer' }}><X size={36}/></button>
          <img src={selectedImg} alt="Preview" style={{ maxWidth:'90vw', maxHeight:'88vh', borderRadius:16, objectFit:'contain' }}/>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdate={updateQty} onRemove={removeItem} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}/>}

      {/* Checkout */}
      {checkoutOpen && <CheckoutModal cart={cart} roomNumber={roomNumber} onClose={() => setCheckoutOpen(false)} onSuccess={clearCart}/>}

      {/* 360 panorama */}
      {panoramaOpen && <PanoramaViewer onClose={() => setPanoramaOpen(false)}/>}

      {/* AI Concierge */}
      {conciergeOpen && <AIConcierge onClose={() => setConciergeOpen(false)}/>}

      {/* Floating cart FAB */}
      {count > 0 && !cartOpen && !checkoutOpen && (
        <button onClick={() => setCartOpen(true)} style={{ position:'fixed', bottom:28, right:28, zIndex:500, ...btn(T.accent), ...flex('center','center'), gap:10, padding:'14px 22px', borderRadius:50, boxShadow:'0 8px 30px rgba(59,130,246,.45)', animation:'pulseRing 2.5s ease infinite', fontSize:14, fontWeight:700 }}>
          <ShoppingCart size={18}/> {count} item{count!==1?'s':''} · ${cartTotal(cart).toFixed(2)}
        </button>
      )}

      {/* AI Concierge FAB */}
      {!conciergeOpen && (
        <button onClick={() => setConciergeOpen(true)} style={{
          position:'fixed',
          bottom: count > 0 ? 90 : 28,
          left:28, zIndex:500,
          ...btn('linear-gradient(135deg,#3b82f6,#6366f1)'),
          ...flex('center','center'), gap:8,
          padding:'14px 20px', borderRadius:50,
          boxShadow:'0 8px 30px rgba(99,102,241,.45)',
          fontSize:13, fontWeight:700,
          transition:'bottom .3s ease',
        }}>
          <Bot size={17}/> Aria · Concierge
        </button>
      )}
    </div>
  );
};

export default Gallery;
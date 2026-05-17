// src/lib/concierge.js
// ═══════════════════════════════════════════════════════════════════════════
// THE AFIA — AI Concierge Engine
// Luxury concierge logic with FREE smart features
// - Memory
// - Smart recommendations
// - Typo tolerance
// - Sentiment alerts
// - Guest preferences
// - Food recommendations
// - VIP detection
// - Realtime-ready architecture
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from "../supabaseClient";

// ───────────────────────────────────────────────────────────────────────────
// HOTEL CONFIG
// ───────────────────────────────────────────────────────────────────────────
const HOTEL = {
  name: "The Afia",
  phone: "+233 54 366 2896",

  checkOut: "12:00 PM",

  lateCheckout: {
    time: "3:00 PM",
    fee: 80,
  },

  pool: {
    floor: 14,
    opens: 6,
    closes: 23,
    temp: 28,
  },

  spa: {
    floor: 2,
    opens: 8,
    closes: 22,
  },

  gym: {
    floor: 4,
    opens: 0,
    closes: 24,
  },

  bar: {
    floor: 15,
    opens: 17,
    closes: 26,
  },

  breakfast: {
    opens: 6,
    closes: 10,
    openMin: 30,
  },

  wifi: {
    network: "StayPilot",
    password: "StayPilot-Secure",
  },
};

// ───────────────────────────────────────────────────────────────────────────
// TIME HELPERS
// ───────────────────────────────────────────────────────────────────────────
function nowGhana() {
  const h = new Date().getUTCHours();
  const m = new Date().getUTCMinutes();

  return {
    h,
    m,
    totalMins: h * 60 + m,
  };
}

function ghanaTimeStr() {
  const { h, m } = nowGhana();

  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;

  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function greeting() {
  const { h } = nowGhana();

  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";

  return "Good evening";
}

function timeOfDayNote() {
  const { h } = nowGhana();

  if (h >= 22 || h < 5) return "late evening";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";

  return "evening";
}

function isOpen(opensHour, closesHour, opensMin = 0) {
  const { totalMins } = nowGhana();

  const openMins = opensHour * 60 + opensMin;
  const closeMins = (closesHour % 24) * 60;

  return totalMins >= openMins && totalMins < closeMins;
}

function untilOpen(opensHour, opensMin = 0) {
  const { totalMins } = nowGhana();

  const openMins = opensHour * 60 + opensMin;

  if (openMins <= totalMins) return null;

  const diff = openMins - totalMins;

  const hh = Math.floor(diff / 60);
  const mm = diff % 60;

  return hh > 0
    ? `${hh} hour${hh > 1 ? "s" : ""} and ${mm} minutes`
    : `${mm} minutes`;
}

// ───────────────────────────────────────────────────────────────────────────
// MEMORY SYSTEM (FREE AI-LIKE FEATURE)
// ───────────────────────────────────────────────────────────────────────────
const guestMemory = new Map();

function remember(userId, key, value) {
  if (!userId) return;

  if (!guestMemory.has(userId)) {
    guestMemory.set(userId, {});
  }

  guestMemory.get(userId)[key] = value;
}

function recall(userId, key) {
  return guestMemory.get(userId)?.[key];
}

// ───────────────────────────────────────────────────────────────────────────
// FUZZY MATCHING
// ───────────────────────────────────────────────────────────────────────────
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;

  const dp = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];

    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        i === 0
          ? j
          : a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 +
            Math.min(
              dp[i - 1][j],
              dp[i][j - 1],
              dp[i - 1][j - 1]
            );
    }
  }

  return dp[m][n];
}

function fuzzyContains(message, keyword) {
  const msg = message.toLowerCase();
  const kw = keyword.toLowerCase();

  if (msg.includes(kw)) return true;

  const words = msg.split(/\s+/);

  for (const w of words) {
    if (w.length < 3) continue;

    const dist = editDistance(w, kw);

    const tolerance = kw.length <= 4 ? 1 : 2;

    if (dist <= tolerance) {
      return true;
    }
  }

  return false;
}

function matches(message, keywords) {
  return keywords.some((kw) => fuzzyContains(message, kw));
}

// ───────────────────────────────────────────────────────────────────────────
// SMART INTENT DETECTION
// ───────────────────────────────────────────────────────────────────────────
function detectIntent(msg) {
  const lower = msg.toLowerCase();

  const intents = [
    {
      name: "food",
      patterns: [
        "hungry",
        "food",
        "eat",
        "dinner",
        "lunch",
        "breakfast",
      ],
    },

    {
      name: "cleaning",
      patterns: [
        "clean",
        "housekeeping",
        "dirty",
        "mess",
      ],
    },

    {
      name: "sleep",
      patterns: [
        "sleep",
        "pillow",
        "blanket",
        "bed",
        "duvet",
      ],
    },

    {
      name: "wifi",
      patterns: [
        "wifi",
        "internet",
        "password",
        "connect",
      ],
    },
  ];

  for (const intent of intents) {
    if (intent.patterns.some((p) => lower.includes(p))) {
      return intent.name;
    }
  }

  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// SENTIMENT
// ───────────────────────────────────────────────────────────────────────────
const FRUSTRATION_WORDS = [
  "angry",
  "furious",
  "terrible",
  "awful",
  "worst",
  "broken",
  "not working",
  "manager",
  "refund",
  "complaint",
];

function detectSentiment(msg) {
  const l = msg.toLowerCase();

  const count = FRUSTRATION_WORDS.filter((w) =>
    l.includes(w)
  ).length;

  if (count >= 2) return "very_frustrated";
  if (count >= 1) return "frustrated";

  return "neutral";
}

// ───────────────────────────────────────────────────────────────────────────
// HUMAN HANDOFF
// ───────────────────────────────────────────────────────────────────────────
const HANDOFF_WORDS = [
  "human",
  "staff",
  "manager",
  "agent",
  "real person",
  "front desk",
];

function wantsHuman(msg) {
  return HANDOFF_WORDS.some((w) =>
    msg.toLowerCase().includes(w)
  );
}

// ───────────────────────────────────────────────────────────────────────────
// VIP DETECTION
// ───────────────────────────────────────────────────────────────────────────
function isVIP(booking) {
  if (!booking) return false;

  return (
    booking.room_type === "Presidential Suite" ||
    booking.total_spent > 5000
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ADMIN ALERT
// ───────────────────────────────────────────────────────────────────────────
async function alertAdmin({
  roomNumber,
  guestName,
  message,
  sentiment,
}) {
  try {
    await supabase.from("staff_chats").insert({
      room_number: roomNumber,
      guest_name: guestName,
      sender: "ai",

      message: `⚠️ ${sentiment.toUpperCase()} ALERT — Suite ${roomNumber}: "${message.slice(
        0,
        120
      )}"`,

      thread_status: "open",
      handled: false,
    });
  } catch (e) {
    console.warn("[concierge] Alert failed:", e.message);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// SAVE CHAT HISTORY
// ───────────────────────────────────────────────────────────────────────────
async function saveConversation({
  userId,
  guestName,
  roomNumber,
  message,
  response,
}) {
  try {
    await supabase.from("concierge_messages").insert({
      user_id: userId,
      guest_name: guestName,
      room_number: roomNumber,
      guest_message: message,
      ai_response: response,
    });
  } catch (e) {
    console.warn("[concierge] Save failed:", e.message);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// SMART FOOD RECOMMENDATIONS
// ───────────────────────────────────────────────────────────────────────────
function recommendFood(menuItems = []) {
  if (!menuItems.length) {
    return "Tonight's chef specials include grilled lobster, creamy jollof risotto, and chocolate lava cake.";
  }

  const spicy = menuItems.find((i) =>
    i.name?.toLowerCase().includes("spicy")
  );

  if (spicy) {
    return `You might love our ${spicy.name} — it's one of tonight's guest favourites.`;
  }

  return `Our chef recommends the ${menuItems[0].name} this evening.`;
}

// ───────────────────────────────────────────────────────────────────────────
// ACTIONS
// ───────────────────────────────────────────────────────────────────────────
async function runAction(
  action,
  {
    roomNumber,
    guestName,
    booking,
  }
) {
  const sr = async (
    item_name,
    request_type,
    notes
  ) => {
    const { error } = await supabase
      .from("service_requests")
      .insert({
        room_number: roomNumber,
        guest_name: guestName,
        request_type,
        item_name,
        notes,
        status: "pending",
      });

    if (error) throw error;
  };

  switch (action) {
    case "towels":
      await sr(
        "Extra Towels",
        "Housekeeping",
        "Requested via AI"
      );

      return `Absolutely, ${guestName}. Fresh luxury towels are already on their way to Suite ${roomNumber}.`;

    case "housekeeping":
      await sr(
        "Room Cleaning",
        "Housekeeping",
        "Requested via AI"
      );

      return `Housekeeping has been notified and will refresh your suite shortly, ${guestName}.`;

    case "pillows":
      await sr(
        "Extra Pillows",
        "Housekeeping",
        "Requested via AI"
      );

      return `A selection of premium pillows will be delivered to your suite shortly, ${guestName}.`;

    case "late_checkout":
      return `Late check-out until ${HOTEL.lateCheckout.time} is available for ₵${HOTEL.lateCheckout.fee}, subject to availability. I've sent your request to reception.`;

    default:
      return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// KNOWLEDGE BASE
// ───────────────────────────────────────────────────────────────────────────
function buildKB(guestName, menuItems = []) {
  const g = greeting();
  const tod = timeOfDayNote();

  return [
    {
      keys: [
        "hello",
        "hi",
        "hey",
      ],

      reply: () =>
        `${g}, ${guestName}. Welcome to The Afia. How may I elevate your ${tod}?`,
    },

    {
      keys: [
        "food",
        "hungry",
        "eat",
        "menu",
      ],

      reply: () =>
        `Room service is available 24/7, ${guestName}. ${recommendFood(
          menuItems
        )} Would you like a recommendation for something spicy, light, or luxurious?`,
    },

    {
      keys: [
        "wifi",
        "internet",
        "password",
      ],

      reply: () =>
        `Connect to "${HOTEL.wifi.network}" using password "${HOTEL.wifi.password}".`,
    },

    {
      keys: [
        "pool",
        "swim",
      ],

      reply: () =>
        isOpen(
          HOTEL.pool.opens,
          HOTEL.pool.closes
        )
          ? `The Sky Pool is currently open on Floor ${HOTEL.pool.floor}, heated to ${HOTEL.pool.temp}°C.`
          : `The Sky Pool opens in ${
              untilOpen(HOTEL.pool.opens) || "the morning"
            }.`,
    },

    {
      keys: [
        "spa",
        "massage",
      ],

      reply: () =>
        isOpen(
          HOTEL.spa.opens,
          HOTEL.spa.closes
        )
          ? `The Zen Spa is open now on Floor ${HOTEL.spa.floor}.`
          : `The Zen Spa opens in ${
              untilOpen(HOTEL.spa.opens) || "the morning"
            }.`,
    },

    {
      keys: [
        "towels",
        "towel",
      ],

      action: "towels",
    },

    {
      keys: [
        "clean",
        "housekeeping",
      ],

      action: "housekeeping",
    },

    {
      keys: [
        "pillows",
        "blanket",
      ],

      action: "pillows",
    },

    {
      keys: [
        "late checkout",
        "check out late",
      ],

      action: "late_checkout",
    },
  ];
}

// ───────────────────────────────────────────────────────────────────────────
// FALLBACKS
// ───────────────────────────────────────────────────────────────────────────
const FALLBACK_MESSAGES = [
  (name) =>
    `I'd love to help with that, ${name}. Let me connect you with our team for the perfect assistance.`,

  (name) =>
    `${name}, I want to make sure you receive the best support possible. Shall I connect you with reception?`,
];

// ───────────────────────────────────────────────────────────────────────────
// MAIN ENGINE
// ───────────────────────────────────────────────────────────────────────────
export async function processGuestMessage({
  message,
  guestName,
  roomNumber,
  booking,
  userId,
  menuItems = [],
}) {
  if (!message?.trim()) {
    return {
      text: "",
      offerHandoff: false,
    };
  }

  const msg = message.trim();

  // ─────────────────────────────────────────────────
  // SENTIMENT DETECTION
  // ─────────────────────────────────────────────────
  const sentiment = detectSentiment(msg);

  if (sentiment !== "neutral") {
    await alertAdmin({
      roomNumber,
      guestName,
      message: msg,
      sentiment,
    });
  }

  // ─────────────────────────────────────────────────
  // HUMAN REQUEST
  // ─────────────────────────────────────────────────
  if (wantsHuman(msg)) {
    return {
      text: `Of course, ${guestName}. I'm connecting you with our hospitality team now.`,
      offerHandoff: true,
    };
  }

  // ─────────────────────────────────────────────────
  // MEMORY
  // ─────────────────────────────────────────────────
  const previousIntent = recall(userId, "intent");

  const currentIntent = detectIntent(msg);

  if (currentIntent) {
    remember(userId, "intent", currentIntent);
  }

  // Example contextual memory
  if (
    previousIntent === "food" &&
    msg.toLowerCase().includes("spicy")
  ) {
    return {
      text: `Excellent choice, ${guestName}. Our spicy seafood pasta and pepper chicken are guest favourites tonight.`,
      offerHandoff: false,
    };
  }

  // ─────────────────────────────────────────────────
  // VIP RESPONSE
  // ─────────────────────────────────────────────────
  const vip = isVIP(booking);

  // ─────────────────────────────────────────────────
  // KNOWLEDGE BASE
  // ─────────────────────────────────────────────────
  const kb = buildKB(
    guestName,
    menuItems
  );

  for (const entry of kb) {
    if (!matches(msg, entry.keys)) continue;

    // ACTIONS
    if (entry.action) {
      try {
        const result = await runAction(
          entry.action,
          {
            roomNumber,
            guestName,
            booking,
          }
        );

        if (result) {
          await saveConversation({
            userId,
            guestName,
            roomNumber,
            message: msg,
            response: result,
          });

          return {
            text: vip
              ? `${result} As one of our valued VIP guests, we're prioritising your request immediately.`
              : result,

            offerHandoff: false,

            actionTaken: entry.action,
          };
        }
      } catch (e) {
        console.error(
          "[concierge] Action failed:",
          e.message
        );

        return {
          text: `${guestName}, I encountered a small issue while processing that request. Let me connect you with our team immediately.`,
          offerHandoff: true,
        };
      }
    }

    // NORMAL REPLY
    if (entry.reply) {
      const response = entry.reply();

      await saveConversation({
        userId,
        guestName,
        roomNumber,
        message: msg,
        response,
      });

      return {
        text: vip
          ? `${response} As always, our VIP team is available for anything additional you may need.`
          : response,

        offerHandoff: false,
      };
    }
  }

  // ─────────────────────────────────────────────────
  // FALLBACK
  // ─────────────────────────────────────────────────
  const fallback =
    FALLBACK_MESSAGES[
      Math.floor(
        Math.random() *
          FALLBACK_MESSAGES.length
      )
    ];

  const response = fallback(guestName);

  await saveConversation({
    userId,
    guestName,
    roomNumber,
    message: msg,
    response,
  });

  return {
    text: response,
    offerHandoff: true,
  };
}
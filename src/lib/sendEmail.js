// src/lib/sendEmail.js
// Helper to send transactional emails via the Supabase Edge Function (Resend)
import { supabase } from "../supabaseClient";

// ─── BASE CALL ──────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, type }) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html, type },
    });
    if (error) {
      console.error("[sendEmail] error:", error);
      return { ok: false, error: error.message };
    }
    console.log("[sendEmail] sent:", data);
    return { ok: true, data };
  } catch (e) {
    console.error("[sendEmail] exception:", e);
    return { ok: false, error: e.message };
  }
}

// ─── SHARED EMAIL CHROME (header / footer wrapper) ──────────────────────────
function wrap(innerHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#020617;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#0f172a;border:1px solid rgba(59,130,246,0.18);border-radius:24px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:36px 36px 28px;border-bottom:1px solid rgba(59,130,246,0.12);text-align:center;">
              <div style="display:inline-block;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#60a5fa);line-height:54px;color:#fff;font-size:26px;margin-bottom:14px;">✦</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#fff;font-weight:300;letter-spacing:2px;">The Afia</div>
              <div style="font-size:10px;color:#3b82f6;letter-spacing:4px;text-transform:uppercase;font-weight:700;margin-top:6px;">Boutique Luxury</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              ${innerHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px 30px;border-top:1px solid rgba(59,130,246,0.08);text-align:center;">
              <div style="font-size:11px;color:#64748b;line-height:1.7;">
                Need anything? Reply to this email or use the AI Concierge in your suite.<br/>
                <span style="color:#475569;">In the heart of the city · Open 24/7</span>
              </div>
              <div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.04);font-size:9px;color:#475569;letter-spacing:3px;text-transform:uppercase;">
                The Afia · Powered by StayPilot · Encrypted End-to-End
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── BOOKING CONFIRMATION ───────────────────────────────────────────────────
export async function sendBookingConfirmation({
  to,
  guestName,
  roomNumber,
  suiteType,
  checkInDate,
  checkOutDate,
  nights,
  guests,
  totalAmount,
  accessToken,
}) {
  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const inner = `
    <div style="font-size:10px;color:#3b82f6;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">
      ✦ Reservation Confirmed
    </div>
    <h1 style="font-family:Georgia,serif;font-size:32px;color:#fff;font-weight:300;margin:0 0 14px;letter-spacing:-0.5px;line-height:1.15;">
      Welcome, ${guestName}.
    </h1>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
      Your suite is reserved. Your encrypted digital key is ready, your AI concierge is standing by,
      and our team can't wait to host you.
    </p>

    <!-- Reservation card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.18);border-radius:18px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <div style="font-size:10px;color:#3b82f6;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">
            Your Reservation
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;width:40%;">Suite</td>
              <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:right;">${suiteType} · #${roomNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Check-In</td>
              <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${formatDate(checkInDate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Check-Out</td>
              <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${formatDate(checkOutDate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Nights · Guests</td>
              <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${nights} · ${guests}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Total -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.04));border:1px solid rgba(59,130,246,0.25);border-radius:18px;margin-bottom:28px;">
      <tr>
        <td style="padding:22px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <div style="font-size:10px;color:#64748b;letter-spacing:1.5px;margin-bottom:4px;">TOTAL DUE</div>
                <div style="font-size:11px;color:#94a3b8;">Settle at hotel or via your folio</div>
              </td>
              <td style="text-align:right;">
                <div style="font-family:Georgia,serif;font-size:34px;color:#fff;font-weight:300;letter-spacing:-1px;line-height:1;">
                  ₵${Number(totalAmount).toLocaleString()}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${accessToken ? `
    <!-- Digital key preview -->
    <div style="text-align:center;padding:20px;background:rgba(59,130,246,0.04);border:1px dashed rgba(59,130,246,0.3);border-radius:14px;margin-bottom:28px;">
      <div style="font-size:10px;color:#3b82f6;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:8px;">
        Your Digital Key
      </div>
      <div style="font-family:Georgia,serif;font-size:32px;color:#3b82f6;font-weight:300;letter-spacing:10px;">
        ${accessToken}
      </div>
      <div style="font-size:11px;color:#64748b;margin-top:8px;">
        Hold your device near the door · Refreshes each session
      </div>
    </div>
    ` : ""}

    <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 24px;">
      Once you arrive, sign in to your account to unlock your full suite experience —
      room service, the spa, transport, and our 24/7 AI concierge.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin:8px 0 8px;">
      <a href="http://localhost:3000/welcome" style="display:inline-block;padding:14px 34px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">
        View Your Suite →
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Reservation Confirmed · The Afia · Suite ${roomNumber}`,
    html: wrap(inner),
    type: "booking_confirmation",
  });
}

// ─── PAYMENT RECEIPT ────────────────────────────────────────────────────────
export async function sendPaymentReceipt({
  to,
  guestName,
  roomNumber,
  amount,
  reference,
  paidAt,
  breakdown = [], // [{ label, amount }]
}) {
  const date = new Date(paidAt || Date.now()).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const breakdownRows = breakdown.map(b => `
    <tr>
      <td style="padding:8px 0;color:#94a3b8;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04);">${b.label}</td>
      <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04);">₵${Number(b.amount).toLocaleString()}</td>
    </tr>
  `).join("");

  const inner = `
    <div style="font-size:10px;color:#10b981;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">
      ✓ Payment Received
    </div>
    <h1 style="font-family:Georgia,serif;font-size:30px;color:#fff;font-weight:300;margin:0 0 14px;letter-spacing:-0.5px;line-height:1.15;">
      Thank you, ${guestName}.
    </h1>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
      We've received your payment of <strong style="color:#10b981;">₵${Number(amount).toLocaleString()}</strong>.
      Your folio is settled — please keep this email as your receipt.
    </p>

    <!-- Receipt card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:18px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <div style="font-size:10px;color:#10b981;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">
            Receipt
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;width:40%;">Reference</td>
              <td style="padding:8px 0;color:#fff;font-size:12px;font-weight:500;text-align:right;font-family:'Courier New',monospace;">${reference || "—"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Suite</td>
              <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">#${roomNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Paid On</td>
              <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${date}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Method</td>
              <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">Paystack · Card / MoMo</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${breakdown.length > 0 ? `
    <!-- Itemized -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:18px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <div style="font-size:10px;color:#94a3b8;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;margin-bottom:14px;">
            Charges Settled
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${breakdownRows}
          </table>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Total paid -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04));border:1px solid rgba(16,185,129,0.3);border-radius:18px;margin-bottom:28px;">
      <tr>
        <td style="padding:22px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <div style="font-size:10px;color:#64748b;letter-spacing:1.5px;margin-bottom:4px;">TOTAL PAID</div>
                <div style="font-size:11px;color:#10b981;">✓ Settled in full</div>
              </td>
              <td style="text-align:right;">
                <div style="font-family:Georgia,serif;font-size:34px;color:#10b981;font-weight:300;letter-spacing:-1px;line-height:1;">
                  ₵${Number(amount).toLocaleString()}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0;">
      This receipt is automatically generated and serves as proof of payment.
      For questions about this transaction, reply to this email.
    </p>
  `;

  return sendEmail({
    to,
    subject: `Payment Receipt · ₵${Number(amount).toLocaleString()} · The Afia`,
    html: wrap(inner),
    type: "payment_receipt",
  });
}
// ─── INVOICE EMAIL ──────────────────────────────────────────────────────────
// ADD THIS FUNCTION to the bottom of your src/lib/sendEmail.js file
// (paste it right before the last closing line of the file)

export async function sendInvoiceEmail({
  to,
  guestName,
  roomNumber,
  suiteType,
  checkInDate,
  checkOutDate,
  nights,
  charges    = [], // [{ description, amount, category }]
  totalCharged,
  totalPaid,
  bookingId,
}) {
  const invoiceNumber = `INV-${String(bookingId).padStart(5, "0")}-${new Date().getFullYear()}`;
  const issueDate     = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  const balanceDue    = Math.max(0, Number(totalCharged) - Number(totalPaid));
  const isPaid        = balanceDue <= 0;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"long", year:"numeric" });
  };

  const chargeRows = charges.map(c => `
    <tr>
      <td style="padding:10px 0;color:#cbd5e1;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04);">
        ${c.description || "Charge"}
      </td>
      <td style="padding:10px 0;color:#94a3b8;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04);text-align:center;">
        <span style="padding:2px 8px;border-radius:10px;background:rgba(59,130,246,0.08);color:#3b82f6;font-weight:600;">
          ${c.category || "General"}
        </span>
      </td>
      <td style="padding:10px 0;color:#fff;font-size:13px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;">
        ₵${Number(c.amount).toFixed(2)}
      </td>
    </tr>
  `).join("");

  const inner = `
    <!-- Invoice header row -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td>
          <div style="font-size:10px;color:#3b82f6;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:6px;">
            Tax Invoice
          </div>
          <h1 style="font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:300;margin:0;letter-spacing:-0.5px;">
            Invoice for ${guestName}
          </h1>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="display:inline-block;padding:8px 18px;border-radius:30px;
            background:${isPaid ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)"};
            border:1px solid ${isPaid ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"};
            color:${isPaid ? "#10b981" : "#f59e0b"};
            font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
            ${isPaid ? "✓ PAID IN FULL" : "⏳ BALANCE DUE"}
          </div>
        </td>
      </tr>
    </table>

    <!-- Invoice meta -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:22px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="width:50%;vertical-align:top;">
                <div style="font-size:10px;color:#64748b;letter-spacing:1.5px;margin-bottom:4px;">INVOICE NUMBER</div>
                <div style="font-size:14px;color:#fff;font-weight:700;font-family:'Courier New',monospace;">${invoiceNumber}</div>
              </td>
              <td style="width:50%;text-align:right;vertical-align:top;">
                <div style="font-size:10px;color:#64748b;letter-spacing:1.5px;margin-bottom:4px;">ISSUE DATE</div>
                <div style="font-size:13px;color:#fff;font-weight:600;">${issueDate}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Stay details -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(51,65,85,0.4);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:22px 24px;">
          <div style="font-size:10px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:16px;">
            Stay Details
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;width:40%;">Suite</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">${suiteType || "Suite"} · #${roomNumber}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Check-In</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${formatDate(checkInDate)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Check-Out</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${formatDate(checkOutDate)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Nights</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:500;text-align:right;">${nights || "—"}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Itemized charges -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(51,65,85,0.4);border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:22px 24px;">
          <div style="font-size:10px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:16px;">
            Itemized Charges
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <th style="padding:0 0 10px;color:#475569;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:left;">Description</th>
              <th style="padding:0 0 10px;color:#475569;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:center;">Category</th>
              <th style="padding:0 0 10px;color:#475569;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-align:right;">Amount</th>
            </tr>
            ${chargeRows || `<tr><td colspan="3" style="padding:20px 0;color:#475569;text-align:center;font-size:13px;">No charges recorded</td></tr>`}
          </table>
        </td>
      </tr>
    </table>

    <!-- Totals -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="background:linear-gradient(135deg,rgba(59,130,246,0.10),rgba(59,130,246,0.04));border:1.5px solid rgba(59,130,246,0.25);border-radius:16px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Total Charges</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">₵${Number(totalCharged).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Amount Paid</td>
              <td style="padding:6px 0;color:#10b981;font-size:13px;font-weight:600;text-align:right;">− ₵${Number(totalPaid).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:16px 0 0;border-top:1px solid rgba(59,130,246,0.2);">
                <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${isPaid ? "SETTLED IN FULL" : "BALANCE DUE"}</div>
              </td>
              <td style="padding:16px 0 0;text-align:right;border-top:1px solid rgba(59,130,246,0.2);">
                <div style="font-family:Georgia,serif;font-size:32px;color:${isPaid ? "#10b981" : "#f59e0b"};font-weight:300;letter-spacing:-1px;">
                  ₵${balanceDue.toFixed(2)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${isPaid ? `
    <div style="text-align:center;padding:16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;color:#10b981;font-size:12px;font-weight:600;margin-bottom:20px;">
      ✓ This invoice has been settled in full. Thank you, ${guestName}!
    </div>
    ` : `
    <div style="text-align:center;padding:16px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;color:#f59e0b;font-size:12px;margin-bottom:20px;">
      Outstanding balance of <strong>₵${balanceDue.toFixed(2)}</strong> — settle via your suite portal.
    </div>
    `}

    <p style="color:#64748b;font-size:11px;line-height:1.7;margin:0;text-align:center;">
      This invoice was automatically generated by The Afia hotel management system.<br/>
      Invoice #${invoiceNumber} · For queries contact us at ${"+233 54 366 2896"}
    </p>
  `;

  return sendEmail({
    to,
    subject: `${isPaid ? "Invoice (Paid)" : "Invoice"} · ${invoiceNumber} · The Afia`,
    html: wrap(inner),
    type: "invoice",
  });
} 
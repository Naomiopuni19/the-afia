// Add this function to the bottom of src/lib/sendEmail.js

export async function sendPromoEmail({
  to,
  guestName,
  roomNumber,
  promoTitle,
  promoBody,
  promoEmoji,
  promoCategory,
  ctaText,
  validUntil,
}) {
  const inner = `
    <!-- Promo badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:20px;
        background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(96,165,250,0.1));
        border:1px solid rgba(59,130,246,0.3);
        line-height:72px;font-size:36px;margin-bottom:16px;">
        ${promoEmoji || '✦'}
      </div>
      <div style="font-size:10px;color:#3b82f6;letter-spacing:4px;text-transform:uppercase;font-weight:700;margin-bottom:8px;">
        ${promoCategory || 'Exclusive Offer'} · Suite ${roomNumber}
      </div>
      <h1 style="font-family:Georgia,serif;font-size:30px;color:#fff;font-weight:300;margin:0;letter-spacing:-0.5px;line-height:1.2;">
        ${promoTitle}
      </h1>
    </div>

    <!-- Promo content -->
    <div style="background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);border-radius:18px;padding:28px;margin-bottom:24px;">
      <p style="color:#cbd5e1;font-size:15px;line-height:1.8;margin:0;">
        ${promoBody}
      </p>
    </div>

    ${validUntil ? `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:7px 18px;border-radius:30px;
        background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);
        color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
        ⏳ Valid until ${validUntil}
      </span>
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin:8px 0 24px;">
      <a href="https://naomiopuni19.github.io/the-afia/#/welcome"
        style="display:inline-block;padding:15px 36px;
        background:linear-gradient(135deg,#3b82f6,#2563eb);
        color:#fff;text-decoration:none;border-radius:12px;
        font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;
        box-shadow:0 8px 24px rgba(59,130,246,0.3);">
        ${ctaText || 'Claim Your Offer →'}
      </a>
    </div>

    <p style="color:#475569;font-size:11px;line-height:1.7;margin:0;text-align:center;">
      This exclusive offer is for The Afia guests only.<br/>
      To redeem, visit your suite portal or contact our team via the AI Concierge.
    </p>
  `;

  return sendEmail({
    to,
    subject: `${promoEmoji || '✦'} ${promoTitle} · Exclusive for Suite ${roomNumber}`,
    html: wrap(inner),
    type: 'promo',
  });
}
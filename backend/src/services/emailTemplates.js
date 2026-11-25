// GAZU transactional email templates. Email-client-compatible, table-based HTML.
// Never insert customer or order fields into markup without escaping.
const STORE_URL = 'https://gazufashionstore.vercel.app';
const ACCOUNT_URL = `${STORE_URL}/account/orders`;
const esc = (input) => String(input ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const money = (paise) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR',
}).format((Number(paise) || 0) / 100);
const safeNumber = (number) => Number.isFinite(Number(number)) ? Number(number) : 0;

function frame({ eyebrow, headline, summary, body, action, actionHref = ACCOUNT_URL, preheader = '' }) {
  const button = action ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0">
      <tr><td bgcolor="#121212" style="background:#121212">
        <a href="${actionHref}" style="display:inline-block;padding:16px 25px;color:#ffffff;text-decoration:none;font:bold 12px Arial,sans-serif;letter-spacing:1.5px">${esc(action)}</a>
      </td></tr>
    </table>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GAZU Fashion Store</title></head>
  <body style="margin:0;padding:0;background:#f0f0ed;font-family:Arial,Helvetica,sans-serif;color:#171717">
  <div style="display:none!important;max-height:0;overflow:hidden;opacity:0">${esc(preheader || summary)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f0ed"><tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff">
      <tr><td bgcolor="#121212" align="center" style="padding:36px 20px;background:#121212">
        <div style="font:bold 38px Arial,sans-serif;letter-spacing:8px;color:#ffffff">GAZU</div>
        <div style="margin-top:10px;font:10px Arial,sans-serif;letter-spacing:3px;color:#c7c7c7">MODERN ESSENTIALS</div>
      </td></tr>
      <tr><td style="padding:34px 28px 30px">
        <div style="font:11px Arial,sans-serif;letter-spacing:2px;color:#777777">${esc(eyebrow).toUpperCase()}</div>
        <h1 style="font:bold 27px/1.3 Arial,sans-serif;color:#111111;margin:16px 0">${esc(headline)}</h1>
        <p style="font:15px/1.75 Arial,sans-serif;color:#555555;margin:0 0 24px">${esc(summary)}</p>
        ${body}${button}
      </td></tr>
      <tr><td align="center" style="border-top:1px solid #e6e6e4;background:#f8f8f6;padding:24px 20px">
        <div style="font:bold 17px Arial,sans-serif;letter-spacing:4px;color:#111111">GAZU</div>
        <p style="font:12px/1.6 Arial,sans-serif;color:#777777;margin:10px 0 0">Fashion. Simplicity. Elegance.<br>Transactional message from GAZU Fashion Store.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function panel(inner) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f5f3" style="background:#f5f5f3"><tr><td style="padding:20px">${inner}</td></tr></table>`;
}
function smallLabel(text) {
  return `<p style="font:10px Arial,sans-serif;letter-spacing:2px;color:#777777;margin:0 0 10px">${esc(text).toUpperCase()}</p>`;
}
function note(text) {
  return `<p style="font:13px/1.7 Arial,sans-serif;color:#666666;margin:20px 0 0">${esc(text)}</p>`;
}
function line(label, value, strong = false) {
  return `<tr><td style="padding:7px 0;font:13px Arial,sans-serif;color:#656565">${esc(label)}</td><td align="right" style="padding:7px 0;font:${strong ? 'bold ' : ''}13px Arial,sans-serif;color:#151515">${esc(value)}</td></tr>`;
}

export function otpEmailHtml(otp) {
  const code = String(otp ?? '');
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid OTP for email template');
  return frame({
    eyebrow: 'Email verification', headline: 'Your verification code.',
    summary: 'Enter this code to verify your GAZU account.',
    body: `${panel(`${smallLabel('Your one-time code')}<div style="font:bold 34px Arial,sans-serif;letter-spacing:8px;text-align:center;color:#111111">${code}</div>`)}
      ${note('This code expires in 5 minutes. Never share it. If you did not create a GAZU account, you can ignore this email.')}`,
    preheader: 'Your GAZU verification code expires in 5 minutes.',
  });
}

export function welcomeEmailHtml({ name } = {}) {
  return frame({
    eyebrow: 'Account verified',
    headline: 'Your GAZU account is ready.',
    summary: `Hi ${name || 'Customer'}, your email address has been verified successfully.`,
    body: panel(`${smallLabel('Account status')}<p style="margin:0;font:15px/1.7 Arial,sans-serif;color:#333333">Your GAZU customer account is active. You can now sign in, manage your account, and place orders.</p>`),
    action: 'OPEN GAZU',
    actionHref: STORE_URL,
    preheader: 'Your GAZU email address is verified and your account is ready.',
  });
}

export function orderConfirmationHtml({ order, customerName } = {}) {
  if (!order) throw new Error('Order required');
  const number = order.orderNumber || String(order._id || '');
  const items = (order.items || []).map((item) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #ddddda;font:13px/1.5 Arial,sans-serif;color:#222222">${esc(item.name)}${item.size ? ` (${esc(item.size)})` : ''} &times; ${esc(item.quantity)}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid #ddddda;font:13px Arial,sans-serif">${esc(money(safeNumber(item.unitPricePaise) * safeNumber(item.quantity)))}</td></tr>`).join('');
  const shipping = order.shipping || {};
  const address = [shipping.name, shipping.address, [shipping.city, shipping.pin].filter(Boolean).join(' - ')].filter(Boolean).map(esc).join('<br>');
  const payment = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  return frame({
    eyebrow: 'Order confirmation', headline: 'Your order is confirmed.',
    summary: `Hi ${customerName || 'Customer'}, thank you for shopping with GAZU.`,
    body: `${panel(`${smallLabel('Order number')}<div style="font:bold 19px Arial,sans-serif;color:#111111">${esc(number)}</div><div style="font:13px Arial,sans-serif;color:#555555;margin-top:12px">Status: Placed</div>`)}
      <div style="height:24px"></div>${smallLabel('Your items')}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${items}
      ${line('Subtotal', money(order.subtotalPaise))}${line('Delivery', money(order.deliveryPaise))}${line('Total', money(order.totalPaise), true)}
      ${line('Payment method', payment)}</table>
      <div style="height:26px"></div>${smallLabel('Delivery address')}
      <p style="font:13px/1.7 Arial,sans-serif;color:#333333;margin:0">${address || 'See My Orders for delivery details.'}</p>
      ${note("We'll notify you when your order status changes.")}`,
    action: 'VIEW MY ORDERS',
  });
}

const statuses = {
  preparing: { label: 'Preparing', headline: "We're preparing your order.", summary: 'Our team is getting your items ready.' },
  out_for_delivery: { label: 'Out for delivery', headline: 'Your order is on its way.', summary: 'Your order has been marked out for delivery.' },
  delivered: { label: 'Delivered', headline: 'Your order has been delivered.', summary: 'Your order has been marked as delivered.' },
};

function progress(status) {
  const stages = [['preparing', 'Preparing'], ['out_for_delivery', 'Out for delivery'], ['delivered', 'Delivered']];
  const active = stages.findIndex(([key]) => key === status);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>${stages.map(([key, label], index) => {
    const current = index <= active;
    return `<td width="33%" align="center" valign="top" style="padding:10px 4px;border-top:4px solid ${current ? '#111111' : '#d5d5d2'};font:${index === active ? 'bold ' : ''}11px/1.5 Arial,sans-serif;color:${current ? '#111111' : '#888888'}">${esc(label)}</td>`;
  }).join('')}</tr></table>`;
}

export function orderStatusHtml({ order, customerName, status, description, next } = {}) {
  const stage = statuses[status];
  if (!stage || !order) throw new Error('Invalid order status template');
  const number = order.orderNumber || String(order._id || '');
  return frame({
    eyebrow: 'Order update', headline: stage.headline,
    summary: `Hi ${customerName || 'Customer'}, ${description || stage.summary}`,
    body: `${panel(`${smallLabel('Order number')}<div style="font:bold 18px Arial,sans-serif;color:#111111">${esc(number)}</div>
      <p style="font:13px Arial,sans-serif;color:#555555;margin:12px 0 0">Current status: <strong>${esc(stage.label)}</strong></p>`)}
      <div style="height:30px"></div>${smallLabel('Order progress')}${progress(status)}
      ${note(next || 'View My Orders to see the latest status.')}`,
    action: 'VIEW MY ORDERS',
  });
}

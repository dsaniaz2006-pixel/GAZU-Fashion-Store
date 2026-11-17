
import "../config/env.js";
import nodemailer from "nodemailer";

// Gmail SMTP — retained for local development
function makeTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass || pass.includes("PASTE_")) {
    throw new Error(
      "Configure EMAIL_USER and EMAIL_PASS in your project .env."
    );
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

// Resend HTTPS API
async function sendWithResend(to, subject, text, html) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "RESEND_API_KEY and RESEND_FROM are required."
    );
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Resend email failed: HTTP ${response.status}`
    );
  }

  const result = await response.json();

  if (!result.id) {
    throw new Error(
      "Resend did not return an email ID."
    );
  }

  return {
    messageId: result.id,
    accepted: [to],
    rejected: [],
    provider: "resend",
  };
}

// Brevo HTTPS API — retained but not used
// while EMAIL_PROVIDER=resend
async function sendWithBrevo(to, subject, text, html) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !senderEmail) {
    throw new Error(
      "BREVO_API_KEY and EMAIL_FROM are required."
    );
  }

  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(senderEmail)) {
    throw new Error(
      "EMAIL_FROM must contain only a valid email address."
    );
  }

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "GAZU Fashion Store",
          email: senderEmail,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Brevo email request failed with HTTP ${response.status}`
    );
  }

  const result = await response.json();

  if (!result.messageId) {
    throw new Error(
      "Brevo did not return an email message ID."
    );
  }

  return {
    messageId: result.messageId,
    accepted: [to],
    rejected: [],
    provider: "brevo",
  };
}

// Shared function for order confirmations and OTPs
export async function sendEmail(to, subject, text) {
  if (!to || !subject || !text) {
    throw new Error(
      "Email recipient, subject, and text are required."
    );
  }

  const html = `<div style="max-width:560px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#111;background:#faf9f6">
    <h1 style="text-align:center;letter-spacing:5px">GAZU</h1>
    <div style="white-space:pre-wrap;line-height:1.6">${escapeHtml(text)}</div>
  </div>`;

  const provider = (
    process.env.EMAIL_PROVIDER || "smtp"
  ).trim().toLowerCase();

  if (provider === "resend") {
    return sendWithResend(to, subject, text, html);
  }

  if (provider === "brevo") {
    return sendWithBrevo(to, subject, text, html);
  }

  if (provider !== "smtp" && provider !== "gmail") {
    throw new Error("Unsupported email provider.");
  }

  const from =
    process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const result = await makeTransporter().sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  if (
    !result.accepted?.some(
      (address) =>
        String(address).toLowerCase() ===
        String(to).toLowerCase()
    )
  ) {
    throw new Error("SMTP did not accept the recipient.");
  }

  return result;
}


import "../config/env.js";
import nodemailer from "nodemailer";

// Gmail SMTP
function makeTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass || pass.includes("PASTE_")) {
    throw new Error(
      "Configure EMAIL_USER and EMAIL_PASS in the project root .env."
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

// Escape HTML content
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

// Validate email headers
function validatedHeader(value, label) {
  const str = String(value || "").trim();

  if (!str || /[\r\n]/.test(str)) {
    throw new Error(`Invalid ${label}.`);
  }

  return str;
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

// Brevo HTTPS API
async function sendWithBrevo(to, subject, text, html) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !senderEmail) {
    throw new Error(
      "BREVO_API_KEY and EMAIL_FROM are required."
    );
  }

  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(senderEmail)
  ) {
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
      `Brevo email request failed: HTTP ${response.status}`
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

// Gmail API — HTTPS email sending
async function sendWithGmailApi(to, subject, text, html) {
  const clientId =
    process.env.GMAIL_API_CLIENT_ID?.trim();

  const clientSecret =
    process.env.GMAIL_API_CLIENT_SECRET?.trim();

  const refreshToken =
    process.env.GMAIL_API_REFRESH_TOKEN?.trim();

  const sender =
    process.env.GMAIL_SENDER?.trim();

  if (!clientId || !clientSecret || !refreshToken || !sender) {
    throw new Error(
      "GMAIL_API_CLIENT_ID, GMAIL_API_CLIENT_SECRET, " +
      "GMAIL_API_REFRESH_TOKEN and GMAIL_SENDER are required."
    );
  }

  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(sender)
  ) {
    throw new Error(
      "GMAIL_SENDER must be a plain email address."
    );
  }

  const tokenResponse = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error(
      `Gmail OAuth token request failed: HTTP ${tokenResponse.status}`
    );
  }

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error(
      "Gmail OAuth did not return an access token."
    );
  }

  const boundary =
    `gazu_${crypto.randomUUID().replaceAll("-", "")}`;

  const cleanTo = validatedHeader(to, "recipient");
  const cleanSubject =
    validatedHeader(subject, "subject");

  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(cleanTo)
  ) {
    throw new Error(
      "Gmail recipient must be an email address."
    );
  }

  const encodedSubject =
    `=?UTF-8?B?${Buffer.from(
      cleanSubject,
      "utf8"
    ).toString("base64")}?=`;

  const mime = [
    `From: "GAZU Fashion Store" <${sender}>`,
    `To: ${cleanTo}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const raw = Buffer.from(
    mime,
    "utf8"
  ).toString("base64url");

  const sendResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!sendResponse.ok) {
    throw new Error(
      `Gmail API send failed: HTTP ${sendResponse.status}`
    );
  }

  const sent = await sendResponse.json();

  if (!sent.id) {
    throw new Error(
      "Gmail API did not return a message ID."
    );
  }

  return {
    messageId: sent.id,
    accepted: [cleanTo],
    rejected: [],
    provider: "gmail_api",
  };
}

// Google Apps Script — NEW HTTPS email provider
async function sendWithAppsScript(to, subject, text, html) {
  const deploymentUrl =
    process.env.GAZU_APPS_SCRIPT_URL?.trim();

  const secret =
    process.env.GAZU_EMAIL_SECRET?.trim();

  if (!deploymentUrl || !secret) {
    throw new Error(
      "GAZU_APPS_SCRIPT_URL and GAZU_EMAIL_SECRET are required."
    );
  }

  let endpoint;

  try {
    endpoint = new URL(deploymentUrl);
  } catch {
    throw new Error(
      "Invalid Google Apps Script deployment URL."
    );
  }

  if (
    endpoint.protocol !== "https:" ||
    endpoint.hostname !== "script.google.com" ||
    !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname) ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new Error(
      "Invalid Google Apps Script deployment URL."
    );
  }

  const recipient = validatedHeader(to, "recipient");
  const emailSubject = validatedHeader(
    subject,
    "subject"
  );

  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient)
  ) {
    throw new Error("Invalid email recipient.");
  }

  const response = await fetch(
    endpoint.toString(),
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        secret,
        to: recipient,
        subject: emailSubject,
        text: String(text),
        ...(html ? { html: String(html) } : {}),
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Apps Script email request failed: HTTP ${response.status}`
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Apps Script returned a non-JSON response. " +
      "Check the web app access settings."
    );
  }

  if (result?.success !== true) {
    throw new Error(
      "Apps Script did not confirm email submission."
    );
  }

  // MailApp does not return a message ID.
  return {
    messageId: null,
    accepted: [recipient],
    rejected: [],
    provider: "apps_script",
  };
}

// Shared function for OTP and order confirmations
export async function sendEmail(to, subject, text, htmlOverride = null) {
  if (!to || !subject || !text) {
    throw new Error(
      "Email recipient, subject, and text are required."
    );
  }

  const html = htmlOverride ?? `
    <div style="max-width:560px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#111;background:#faf9f6">
      <h1 style="text-align:center;letter-spacing:5px">
        GAZU
      </h1>
      <div style="white-space:pre-wrap;line-height:1.6">
        ${escapeHtml(text)}
      </div>
    </div>
  `;

  const provider = (
    process.env.EMAIL_PROVIDER || "smtp"
  ).trim().toLowerCase();

  // Google Apps Script
  if (provider === "apps_script") {
    return sendWithAppsScript(to, subject, text, html);
  }

  // Gmail API
  if (provider === "gmail_api") {
    return sendWithGmailApi(to, subject, text, html);
  }

  // Resend
  if (provider === "resend") {
    return sendWithResend(to, subject, text, html);
  }

  // Brevo
  if (provider === "brevo") {
    return sendWithBrevo(to, subject, text, html);
  }

  // Gmail SMTP
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
    throw new Error(
      "SMTP did not accept the recipient."
    );
  }

  return result;
}

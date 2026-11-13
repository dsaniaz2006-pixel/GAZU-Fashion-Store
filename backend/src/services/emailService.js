import "../config/env.js";
import nodemailer from "nodemailer";

function makeTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
  if (!user || !pass || pass.includes("YOUR_") || pass.includes("PASTE_")) {
    throw new Error(
      "Configure EMAIL_USER and EMAIL_PASS in the project root .env first.",
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

export async function sendEmail(to, subject, text) {
  if (!to || !subject || !text) {
    throw new Error("Email recipient, subject, and text are required.");
  }
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const escape = value => value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const html = `<div style="max-width:560px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#111;background:#faf9f6"><h1>GAZU</h1><div style="white-space:pre-wrap;line-height:1.6">${escape(text)}</div></div>`;
  const result = await makeTransporter().sendMail({ from, to, subject, text, html });
  if (!result.accepted?.some(address => String(address).toLowerCase() === to.toLowerCase()))
    throw new Error("SMTP did not accept the recipient.");
  return result;
}

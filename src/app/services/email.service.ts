// src/services/email.service.ts
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";
import fs from "fs";

dotenv.config();

// ---- Env checks ----
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL; // use your own domain for best deliverability
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "YMABouncyCastle";

if (!SENDGRID_API_KEY) new Error("SENDGRID_API_KEY is not set");
if (!SENDGRID_FROM_EMAIL) new Error("SENDGRID_FROM_EMAIL is not set");

sgMail.setApiKey(SENDGRID_API_KEY);

// ---- Template resolver ----
function resolveEmailTemplate(templateName: string): any {
  const candidates = [
    path.resolve(
      process.cwd(),
      "src",
      "views",
      "emails",
      `${templateName}.ejs`
    ),
    path.resolve(
      process.cwd(),
      "dist",
      "views",
      "emails",
      `${templateName}.ejs`
    ),
    path.resolve(__dirname, "..", "views", "emails", `${templateName}.ejs`),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  new Error(`Email template not found: ${templateName}.ejs`);
}

// ---- HTML → text (basic) ----
function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ---- Render EJS with variables ----
async function renderTemplate(
  templateName: "passwordReset" | "resetSuccess",
  templateVars: Record<string, any>
): Promise<string> {
  const filePath = resolveEmailTemplate(templateName);
  return await ejs.renderFile(filePath, templateVars, { async: true });
}

// ---- Core sender (HTML already rendered) ----
export async function sendEmailHtml(to: string, subject: string, html: string) {
  const text = htmlToText(html);

  const msg: any = {
    to,
    from: { email: SENDGRID_FROM_EMAIL!, name: SENDGRID_FROM_NAME },
    subject,
    html,
    text,
    categories: ["transactional", "password-reset"],
    trackingSettings: {
      openTracking: { enable: false },
      clickTracking: { enable: false, enableText: false },
      subscriptionTracking: { enable: false },
    },
    mailSettings: {
      bypassListManagement: { enable: true },
    },
  };

  try {
    await sgMail.send(msg);
    console.log("[sendEmailHtml] Sent:", { to, subject });
  } catch (err: any) {
    console.error("[sendEmailHtml] SendGrid error:", {
      message: err?.message,
      status: err?.code,
      response: err?.response?.body,
    });
    err;
  }
}

// ---- High-level helpers for auth flow ----
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetURL: string
) {
  const html = await renderTemplate("passwordReset", {
    brand: process.env.SENDGRID_FROM_NAME || "YMABouncyCastle",
    name,
    resetURL,
    preheader:
      "Tap the button to reset your YMA Bouncy Castle password. Link expires in 10 minutes.",
    year: new Date().getFullYear(),
    brandColor: "#7C3AED",
  });
  return sendEmailHtml(
    to,
    "Reset your YMA Bouncy Castle password (valid 10 minutes)",
    html
  );
}

export async function sendResetSuccessEmail(to: string, name: string) {
  const html = await renderTemplate("resetSuccess", {
    brand: process.env.SENDGRID_FROM_NAME || "YMABouncyCastle",
    name,
    preheader:
      "This is a confirmation that your password was successfully changed.",
    year: new Date().getFullYear(),
    brandColor: "#7C3AED",
    securityNote:
      "If this wasn't you, please reset your password immediately and contact support.",
  });
  return sendEmailHtml(to, "Your YMA Bouncy Castle password was changed", html);
}

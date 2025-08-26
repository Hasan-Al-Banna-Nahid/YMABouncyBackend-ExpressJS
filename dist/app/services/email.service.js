"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailHtml = sendEmailHtml;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendResetSuccessEmail = sendResetSuccessEmail;
// src/services/email.service.ts
const dotenv_1 = __importDefault(require("dotenv"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
// ---- Env checks ----
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL; // use your own domain for best deliverability
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "YMABouncyCastle";
if (!SENDGRID_API_KEY) new Error("SENDGRID_API_KEY is not set");
if (!SENDGRID_FROM_EMAIL) new Error("SENDGRID_FROM_EMAIL is not set");
mail_1.default.setApiKey(SENDGRID_API_KEY);
// ---- Template resolver ----
function resolveEmailTemplate(templateName) {
  const candidates = [
    path_1.default.resolve(
      process.cwd(),
      "src",
      "views",
      "emails",
      `${templateName}.ejs`
    ),
    path_1.default.resolve(
      process.cwd(),
      "dist",
      "views",
      "emails",
      `${templateName}.ejs`
    ),
    path_1.default.resolve(
      __dirname,
      "..",
      "views",
      "emails",
      `${templateName}.ejs`
    ),
  ];
  for (const p of candidates) if (fs_1.default.existsSync(p)) return p;
  new Error(`Email template not found: ${templateName}.ejs`);
}
// ---- HTML → text (basic) ----
function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
// ---- Render EJS with variables ----
async function renderTemplate(templateName, templateVars) {
  const filePath = resolveEmailTemplate(templateName);
  return await ejs_1.default.renderFile(filePath, templateVars, {
    async: true,
  });
}
// ---- Core sender (HTML already rendered) ----
async function sendEmailHtml(to, subject, html) {
  const text = htmlToText(html);
  const msg = {
    to,
    from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
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
    await mail_1.default.send(msg);
    console.log("[sendEmailHtml] Sent:", { to, subject });
  } catch (err) {
    console.error("[sendEmailHtml] SendGrid error:", {
      message: err?.message,
      status: err?.code,
      response: err?.response?.body,
    });
    err;
  }
}
// ---- High-level helpers for auth flow ----
async function sendPasswordResetEmail(to, name, resetURL) {
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
async function sendResetSuccessEmail(to, name) {
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

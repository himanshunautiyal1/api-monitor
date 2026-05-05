import nodemailer from "nodemailer";
import { prisma } from "../db";
import type { PingResult } from "./ping";

// ── THE CRITICAL FIX: Create a FRESH transporter per send ────────────────────
//
// Reusing a single Nodemailer transporter as a module-level singleton fails on
// Termux because:
//   1. Android battery optimization kills idle TCP connections
//   2. The SMTP keep-alive connection becomes stale after a few minutes
//   3. The next send attempt uses the dead socket → silent failure / ECONNRESET
//
// Fix: create a new transporter for every email, with a short connection timeout.
// This is slightly slower but 100% reliable on constrained Android hardware.
// ─────────────────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: false, // PORT 587 uses STARTTLS — NOT SSL (that's 465)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // ── Critical for Termux ──────────────────────────────────────────────
    tls: {
      rejectUnauthorized: false, // Termux cert chain is incomplete
      minVersion: "TLSv1.2",
    },
    // Short timeouts so a failed send doesn't block the cron job for minutes
    connectionTimeout: 10_000, // 10s to connect
    greetingTimeout: 10_000, // 10s for SMTP greeting
    socketTimeout: 15_000, // 15s for data transfer
    // Force a new connection — no pooling
    pool: false,
  });
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: `"API Monitor" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Alerts] Email sent to ${to}: ${subject}`);
  } finally {
    // Always close — prevents socket leak on Termux
    transporter.close();
  }
}

async function getAlertRecipients(monitorId: string): Promise<string[]> {
  const configs = await prisma.alertConfig
    .findMany({
      where: {
        monitorId,
        channel: "email",
        isActive: true,
      },
      select: { destination: true },
    })
    .catch(() => []);

  return configs.map((c) => c.destination).filter(Boolean);
}

export async function sendDownAlert(
  monitorId: string,
  url: string,
  result: PingResult,
): Promise<void> {
  const recipients = await getAlertRecipients(monitorId);
  if (recipients.length === 0) {
    console.warn(`[Alerts] No email recipients for monitor ${monitorId}`);
    return;
  }

  const subject = `🔴 DOWN: ${url}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <div style="background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🔴 API is Down</h2>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
        <p><strong>URL:</strong> ${url}</p>
        ${result.statusCode ? `<p><strong>Status Code:</strong> ${result.statusCode}</p>` : ""}
        ${result.responseTimeMs ? `<p><strong>Response Time:</strong> ${result.responseTimeMs}ms</p>` : ""}
        ${result.errorMessage ? `<p><strong>Error:</strong> ${result.errorMessage}</p>` : ""}
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p style="color: #6b7280; font-size: 14px;">You will receive another email when the API recovers.</p>
      </div>
    </div>
  `;

  // Send to all recipients — don't let one failure block others
  await Promise.allSettled(
    recipients.map((to) => sendEmail(to, subject, html)),
  );
}

export async function sendRecoveryAlert(
  monitorId: string,
  url: string,
  result: PingResult,
): Promise<void> {
  const recipients = await getAlertRecipients(monitorId);
  if (recipients.length === 0) return;

  const subject = `✅ RECOVERED: ${url}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <div style="background: #22c55e; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">✅ API Recovered</h2>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
        <p><strong>URL:</strong> ${url}</p>
        ${result.statusCode ? `<p><strong>Status Code:</strong> ${result.statusCode}</p>` : ""}
        ${result.responseTimeMs ? `<p><strong>Response Time:</strong> ${result.responseTimeMs}ms</p>` : ""}
        <p><strong>Recovered at:</strong> ${new Date().toISOString()}</p>
      </div>
    </div>
  `;

  await Promise.allSettled(
    recipients.map((to) => sendEmail(to, subject, html)),
  );
}

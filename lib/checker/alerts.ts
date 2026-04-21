import nodemailer from "nodemailer";
import prisma from "@/lib/db";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendDownAlert(
  monitorId: number,
  monitorName: string,
  monitorUrl: string,
  errorMessage: string | null,
) {
  const alertConfigs = await prisma.alertConfig.findMany({
    where: { monitorId, isActive: true },
    include: { user: true },
  });

  if (alertConfigs.length === 0) return;

  for (const config of alertConfigs) {
    await transporter.sendMail({
      from: `"API Monitor" <${process.env.EMAIL_USER}>`,
      to: config.destination,
      subject: `🔴 ${monitorName} is DOWN`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">⚠️ Monitor Down Alert</h2>
          <p><strong>${monitorName}</strong> is not responding.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; color: #6b7280;">URL</td>
              <td style="padding: 8px;">${monitorUrl}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Error</td>
              <td style="padding: 8px; color: #ef4444;">${errorMessage || "No response"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Time</td>
              <td style="padding: 8px;">${new Date().toUTCString()}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">
            You are receiving this because you have alerts enabled for this monitor.
          </p>
        </div>
      `,
    });
  }
}

export async function sendRecoveryAlert(
  monitorId: number,
  monitorName: string,
  monitorUrl: string,
  downtimeMinutes: number,
) {
  const alertConfigs = await prisma.alertConfig.findMany({
    where: { monitorId, isActive: true },
    include: { user: true },
  });

  if (alertConfigs.length === 0) return;

  for (const config of alertConfigs) {
    await transporter.sendMail({
      from: `"API Monitor" <${process.env.EMAIL_USER}>`,
      to: config.destination,
      subject: `🟢 ${monitorName} is back UP`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">✅ Monitor Recovered</h2>
          <p><strong>${monitorName}</strong> is back online.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; color: #6b7280;">URL</td>
              <td style="padding: 8px;">${monitorUrl}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Downtime</td>
              <td style="padding: 8px;">${downtimeMinutes} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Recovered at</td>
              <td style="padding: 8px;">${new Date().toUTCString()}</td>
            </tr>
          </table>
        </div>
      `,
    });
  }
}

export async function sendWeeklySummary() {
  const users = await prisma.user.findMany({
    include: {
      monitors: {
        where: { isActive: true },
      },
      alertConfigs: {
        where: { isActive: true },
      },
    },
  });

  for (const user of users) {
    if (user.monitors.length === 0) continue;
    if (user.alertConfigs.length === 0) continue;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const summaryRows = await Promise.all(
      user.monitors.map(async (monitor) => {
        const checks = await prisma.checkHistory.count({
          where: { monitorId: monitor.id, checkedAt: { gte: weekAgo } },
        });
        const upChecks = await prisma.checkHistory.count({
          where: {
            monitorId: monitor.id,
            status: "up",
            checkedAt: { gte: weekAgo },
          },
        });
        const incidents = await prisma.incident.count({
          where: {
            monitorId: monitor.id,
            startedAt: { gte: weekAgo },
          },
        });
        const uptime =
          checks > 0 ? ((upChecks / checks) * 100).toFixed(2) : "N/A";

        return `
          <tr>
            <td style="padding: 8px;">${monitor.name}</td>
            <td style="padding: 8px;">${uptime}%</td>
            <td style="padding: 8px;">${incidents}</td>
            <td style="padding: 8px;">${checks}</td>
          </tr>
        `;
      }),
    );

    const destinations = [
      ...new Set(user.alertConfigs.map((config) => config.destination)),
    ];

    for (const destination of destinations) {
      await transporter.sendMail({
        from: `"API Monitor" <${process.env.EMAIL_USER}>`,
        to: destination,
        subject: `📊 Weekly Monitor Summary`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Weekly Summary</h2>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px; text-align: left;">Monitor</th>
              <th style="padding: 8px; text-align: left;">Uptime</th>
              <th style="padding: 8px; text-align: left;">Incidents</th>
              <th style="padding: 8px; text-align: left;">Total Checks</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows.join("")}
          </tbody>
        </table>
      </div>
    `,
      });
    }
  }
}

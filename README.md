# API Monitor

> A production-grade API monitoring platform running on a repurposed Samsung Galaxy A12 smartphone. Zero infrastructure cost. Built with Next.js 16, Prisma, and Neon PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## What is API Monitor?

API Monitor watches your APIs 24/7 and alerts you the moment something goes wrong. It checks your endpoints at configurable intervals, tracks response times, records incidents, and sends instant email notifications — all running on a phone that would otherwise be e-waste.

---

## Features

- **Real-time monitoring** — Check APIs every 1, 5, or 15 minutes
- **Instant email alerts** — Down and recovery notifications
- **Weekly digest** — Monday morning summary email
- **Response time graphs** — 24-hour line charts
- **Uptime charts** — 7-day bar charts with color coding
- **Incident history** — Full log of every downtime event with duration
- **Public status pages** — Shareable at `/status/username`, no login required
- **Dashboard** — Auto-refreshing overview every 30 seconds
- **Response time thresholds** — Alert even when status is 200 but response is slow
- **Custom HTTP headers** — Monitor authenticated endpoints
- **Monitor tags** — Group monitors by environment (production, staging)
- **30-day data retention** — Automatic cleanup of old check history

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     DEVELOPMENT                          │
│   Laptop → git push → GitHub Actions → GitHub Release   │
└──────────────────────────┬───────────────────────────────┘
                           │ downloads artifact
┌──────────────────────────▼───────────────────────────────┐
│            PHONE SERVER (Samsung Galaxy A12)             │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │  Next.js 16 │    │  node-cron   │    │    PM2     │  │
│  │  App Server │    │  Background  │    │  Process   │  │
│  │  Port 3004  │    │  Checker     │    │  Manager   │  │
│  └──────┬──────┘    └──────┬───────┘    └────────────┘  │
│         └──────────────────┘                            │
│                    │                                     │
│                    ▼                                     │
│           Prisma ORM (adapter-pg)                        │
└──────────────────────────┬───────────────────────────────┘
                           │ SSL connection
┌──────────────────────────▼───────────────────────────────┐
│                  NEON POSTGRESQL                         │
│         (Cloud database — data safe on restart)          │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│              CLOUDFLARE TUNNEL                           │
│      phone:3004 → https://your-url.trycloudflare.com    │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 7 with PrismaPg adapter |
| Auth | NextAuth.js v5 (JWT, bcryptjs) |
| Validation | Zod |
| Background jobs | node-cron |
| Email | Nodemailer |
| Process manager | PM2 |
| Tunnel | Cloudflare Tunnel |
| CI/CD | GitHub Actions |
| Runtime | Node.js 22 on Termux (Android) |

---

## Database Schema

```
users          — id, email, username, passwordHash, createdAt
monitors       — id, userId, name, url, intervalMinutes, method,
                 headers, responseTimeThreshold, tags, isActive
check_history  — id, monitorId, status, responseTimeMs,
                 statusCode, errorMessage, checkedAt
incidents      — id, monitorId, startedAt, resolvedAt, isResolved
alert_configs  — id, userId, monitorId, channel, destination, isActive
```

---

## Key Engineering Decisions

**Neon instead of local PostgreSQL**
Data lives in the cloud, not on the phone. If the phone restarts or crashes, all monitoring history is preserved. Separating compute from storage is the right architectural decision for constrained hardware.

**Build on laptop, run on phone**
Next.js 16 Turbopack fails on ARM (Termux). Solution: build on laptop via GitHub Actions, run compiled output on phone. The phone never needs heavy build tools.

**GitHub Releases for artifacts**
Instead of committing build output to Git or building on the phone, GitHub Actions packages the compiled app as a release artifact. The phone downloads and extracts it. Clean, versioned, reproducible.

**Prisma 7 with driver adapter**
Prisma 7 removed its built-in Rust engine. Uses PrismaPg adapter instead — explicit dependency wiring that works correctly on ARM64.

**proxy.ts instead of middleware.ts**
Next.js 16 renamed middleware to proxy. Route protection uses cookie existence check in proxy.ts (lightweight) + full JWT validation in protected layouts (secure).

**instrumentation.ts for background checker**
Next.js instrumentation hook starts the node-cron checker exactly once when the server starts. The `isRunning` flag prevents duplicate instances during hot reloads in development.

---

## Project Structure

```
api-monitor/
├── app/
│   ├── (auth)/             # Login, Register pages
│   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── monitors/
│   │   ├── incidents/
│   │   └── settings/
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── monitors/
│   │   ├── incidents/
│   │   ├── alert-configs/
│   │   ├── stats/
│   │   └── webhook/deploy/
│   └── status/[username]/  # Public status page
├── components/
│   ├── layout/             # Sidebar, AutoRefresh
│   ├── monitors/           # MonitorCard, MonitorForm
│   ├── charts/             # ResponseTimeChart, UptimeChart
│   ├── incidents/          # IncidentsList
│   └── settings/           # AlertConfigForm
├── lib/
│   ├── auth/               # NextAuth config
│   ├── checker/            # Background checker, ping, alerts
│   ├── db/                 # Prisma client
│   └── validations/        # Zod schemas
├── prisma/
│   └── schema.prisma
├── instrumentation.ts      # Starts background checker
├── proxy.ts                # Route protection (Next.js 16)
├── ecosystem.config.js     # PM2 configuration
└── deploy-from-github.sh   # Phone deployment script
```

---

## Setup

### Prerequisites

- Node.js 22+
- A [Neon](https://neon.tech) account (free tier)
- Gmail account with App Password enabled

### Local Development

```bash
# Clone the repo
git clone https://github.com/himanshunautiyal1/api-monitor.git
cd api-monitor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your values

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start dev server
npm run dev -- --port 3004
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your_32_byte_hex_secret
NEXTAUTH_URL=http://localhost:3004

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Webhook (optional)
WEBHOOK_SECRET=your_webhook_secret
```

Generate `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Phone Server Deployment

### Prerequisites on Phone
- Android phone with Termux installed (from F-Droid)
- Termux:Boot app installed
- Node.js, SSH configured

### First Deploy

```bash
# On phone in Termux
termux-wake-lock
sshd

# Create app directory
mkdir -p ~/apps/api-monitor

# Copy deploy script from laptop
scp -P 8022 deploy-from-github.sh user@phone-ip:~/apps/api-monitor/

# On phone — fix line endings and run
sed -i 's/\r//' deploy-from-github.sh
chmod +x deploy-from-github.sh
./deploy-from-github.sh

# Create .env file
nano ~/apps/api-monitor/.env
# Add all environment variables

# Start Cloudflare tunnel
nohup cloudflared tunnel --url http://localhost:3004 > ~/tunnel.log 2>&1 &
cat ~/tunnel.log | grep "trycloudflare.com"
```

### Every Deploy After First

```bash
# On laptop — push code
git add .
git commit -m "your message"
git push origin main

# GitHub Actions builds automatically
# Then on phone
cd ~/apps/api-monitor
./deploy-from-github.sh
```

### PM2 Commands

```bash
pm2 list                          # List all processes
pm2 logs api-monitor --lines 50   # View logs
pm2 restart api-monitor           # Restart app
pm2 stop api-monitor              # Stop app
pm2 save --force                  # Save process state
pm2 resurrect                     # Restore after reboot
```

---

## CI/CD Pipeline

```
git push to main
      ↓
GitHub Actions triggered
      ↓
Install dependencies → Generate Prisma client → Build Next.js
      ↓
Package: .next + prisma + lib/generated + package.json
      ↓
Create GitHub Release (tag: latest) with deployment.tar.gz
      ↓
Phone runs deploy script → downloads latest release → extracts → pm2 restart
```

---

## Known Limitations

- Cloudflare tunnel URL changes on phone restart (temporary tunnel)
- Phone is a single point of failure — no redundancy
- node-cron affected by Android battery optimization when screen off
- Not designed for monitoring hundreds of APIs simultaneously

---

## Future Scope

- Named Cloudflare tunnel with permanent domain
- Webhook auto-deploy on git push
- Google OAuth
- AES-256 encryption for sensitive headers
- SSL certificate expiry monitoring
- Light/dark mode toggle
- TCP and DNS monitoring

---

## Author

**Himanshu Nautiyal**
B.Tech Computer Science and Engineering
Dronacharya College of Engineering, Gurugram

---

## License

MIT

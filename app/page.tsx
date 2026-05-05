"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import {
  Activity,
  Bell,
  BarChart3,
  Globe,
  Zap,
  ArrowRight,
  Clock,
  Shield,
  CheckCircle,
} from "lucide-react";

function useReveal() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, isInView };
}

function RevealSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isInView } = useReveal();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const monitors = [
  { name: "Production API", status: "up", ms: "124ms", uptime: "99.9%" },
  { name: "Auth Service", status: "up", ms: "89ms", uptime: "100%" },
  { name: "Payment Gateway", status: "down", ms: "—", uptime: "98.2%" },
  { name: "CDN Edge", status: "up", ms: "34ms", uptime: "100%" },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#050505] text-white overflow-hidden"
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        
        .dot-grid {
          background-image: radial-gradient(circle, #1a1a1a 1px, transparent 1px);
          background-size: 32px 32px;
        }
        
        .glow-green {
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.3), 0 0 80px rgba(16, 185, 129, 0.1);
        }
        
        .text-glow {
          text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.05);
          transform: translateY(-2px);
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .curved-line {
          position: absolute;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>

      {/* Background decorations */}
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none" />
      <div
        className="curved-line"
        style={{
          width: "800px",
          height: "800px",
          top: "-200px",
          right: "-200px",
        }}
      />
      <div
        className="curved-line"
        style={{
          width: "600px",
          height: "600px",
          bottom: "-100px",
          left: "-150px",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-5 border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="pulse-ring w-8 h-8 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span
              className="font-bold text-lg tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              API Monitor
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-white/60 hover:text-white/80 transition-colors text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-16">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-8"
          >
            <span
              className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs px-4 py-2 rounded-full"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Running on repurposed Android hardware — ₹0 infrastructure cost
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Your APIs are
            <br />
            <span className="text-emerald-400 text-glow">always watched.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Real-time uptime checks, response time graphs, and instant email
            alerts. Know before your users do.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Start monitoring free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="mt-20 rounded-2xl border border-white/8 bg-white/2 backdrop-blur-sm overflow-hidden"
          style={{
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Window bar */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5 bg-white/2">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <div className="flex-1 mx-4 bg-white/5 rounded-md h-5 max-w-xs" />
            <div
              className="flex items-center gap-1.5 text-emerald-400 text-xs"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>

          <div className="p-5">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total", value: "12", color: "text-white" },
                { label: "Up", value: "11", color: "text-emerald-400" },
                { label: "Down", value: "1", color: "text-red-400" },
                {
                  label: "Avg Uptime",
                  value: "99.2%",
                  color: "text-emerald-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/3 border border-white/5 rounded-xl p-4"
                >
                  <p
                    className="text-white/30 text-xs mb-1"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {s.label}
                  </p>
                  <p
                    className={`text-2xl font-bold ${s.color}`}
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Monitor rows */}
            <div className="space-y-2">
              {monitors.map((m) => (
                <div
                  key={m.name}
                  className="bg-white/2 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        m.status === "up"
                          ? "bg-emerald-400"
                          : "bg-red-400 animate-pulse"
                      }`}
                    />
                    <p
                      className="text-white/80 text-sm font-medium"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {m.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 text-xs">
                    <span
                      className="text-white/30"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {m.ms}
                    </span>
                    <span
                      className="text-white/30"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {m.uptime}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === "up"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {m.status === "up" ? "UP" : "DOWN"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <RevealSection className="text-center mb-16">
          <p
            className="text-emerald-400 text-xs tracking-widest uppercase mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Features
          </p>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Everything you need.
            <br />
            <span className="text-white/30">Nothing you don't.</span>
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Activity className="w-5 h-5 text-emerald-400" />,
              title: "Real-time checks",
              desc: "Ping every 1, 5, or 15 minutes. Detect outages the moment they happen.",
            },
            {
              icon: <Bell className="w-5 h-5 text-emerald-400" />,
              title: "Instant alerts",
              desc: "Email alerts on down and recovery. Never be the last to know.",
            },
            {
              icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
              title: "Response graphs",
              desc: "24-hour response time charts. Spot slowdowns before they become outages.",
            },
            {
              icon: <Clock className="w-5 h-5 text-emerald-400" />,
              title: "Incident history",
              desc: "Every downtime event logged with duration and timestamps.",
            },
            {
              icon: <Globe className="w-5 h-5 text-emerald-400" />,
              title: "Status pages",
              desc: "Public /status/username page. Share with clients, no login needed.",
            },
            {
              icon: <Zap className="w-5 h-5 text-emerald-400" />,
              title: "Weekly digest",
              desc: "Monday morning summary with uptime % and incident counts.",
            },
          ].map((f, i) => (
            <RevealSection key={f.title} delay={i * 0.05}>
              <div className="card-hover bg-white/2 border border-white/6 rounded-2xl p-6 h-full">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3
                  className="text-white font-semibold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-white/35 text-sm leading-relaxed"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <RevealSection className="text-center mb-16">
          <p
            className="text-emerald-400 text-xs tracking-widest uppercase mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            How it works
          </p>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Up in 2 minutes.
          </h2>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              title: "Add your API",
              desc: "Enter URL, set interval and response threshold.",
            },
            {
              n: "02",
              title: "We ping it",
              desc: "Checker runs on schedule, records every result.",
            },
            {
              n: "03",
              title: "You get alerted",
              desc: "Instant email on down. Another on recovery.",
            },
          ].map((s, i) => (
            <RevealSection key={s.n} delay={i * 0.1}>
              <div className="relative">
                <p
                  className="text-7xl font-extrabold text-white/4 mb-4 leading-none"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.n}
                </p>
                <h3
                  className="text-white font-semibold text-xl mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-white/35 text-sm leading-relaxed"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Story section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <RevealSection>
          <div
            className="rounded-3xl border border-emerald-500/10 bg-emerald-500/3 p-12 text-center relative overflow-hidden"
            style={{ boxShadow: "inset 0 0 80px rgba(16, 185, 129, 0.03)" }}
          >
            <div className="absolute inset-0 dot-grid opacity-30" />
            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 border border-emerald-500/20 text-emerald-400/70 text-xs px-3 py-1.5 rounded-full mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Shield className="w-3 h-3" />
                The engineering story
              </div>
              <h2
                className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Built on a phone.
                <br />
                <span className="text-emerald-400">Seriously.</span>
              </h2>
              <p
                className="text-white/35 text-base leading-relaxed max-w-2xl mx-auto mb-10"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                This entire system runs on a Samsung Galaxy A12 — e-waste
                repurposed into a production server. Termux, Node.js, PM2, and
                Cloudflare Tunnel. PostgreSQL on Neon for reliability. The phone
                monitors your APIs 24/7 at zero infrastructure cost.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                {[
                  { v: "24/7", l: "Uptime monitoring" },
                  { v: "1 min", l: "Check frequency" },
                  { v: "₹0", l: "Infrastructure" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="bg-black/30 border border-white/5 rounded-xl p-4"
                  >
                    <p
                      className="text-2xl font-bold text-emerald-400 mb-1"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {s.v}
                    </p>
                    <p
                      className="text-white/45 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center border-t border-white/5">
        <RevealSection>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Start watching your APIs.
          </h2>
          <p
            className="text-white/30 mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Free. No credit card. 2 minutes to set up.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-sm glow-green"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div
          className="max-w-6xl mx-auto flex items-center justify-center text-white/40 text-xs"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span>API Monitor — Built on a Samsung Galaxy A12</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

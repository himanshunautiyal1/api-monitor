"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle, Bell, BarChart3, Globe } from "lucide-react";

const mockMonitors = [
  { name: "Production API", status: "up", ms: "124ms" },
  { name: "Auth Service", status: "up", ms: "89ms" },
  { name: "Payment Gateway", status: "down", ms: "—" },
];

export default function LoginPage() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slides = [
    {
      title: "Keep your APIs alive",
      desc: "Real-time uptime checks, instant alerts, and response tracking for all your critical services.",
    },
    {
      title: "Monitor uptime in real-time",
      desc: "Track API health globally with fast checks and instant visibility.",
    },
    {
      title: "Get alerts before users notice",
      desc: "Be notified instantly when something breaks — before it impacts your users.",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [typedText, setTypedText] = useState("");

  // Carousel interval (5s)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Typewriter effect
  useEffect(() => {
    const text = slides[current].title;
    let i = 0;
    setTypedText("");

    const typing = setInterval(() => {
      i++;
      setTypedText(text.slice(0, i));
      if (i >= text.length) clearInterval(typing);
    }, 40);

    return () => clearInterval(typing);
  }, [current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen bg-[#050505] flex"
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .dot-grid { background-image: radial-gradient(circle, #1c1c1c 1px, transparent 1px); background-size: 28px 28px; }
        .field { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; width: 100%; padding: 11px 14px; border-radius: 10px; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; }
        .field:focus { border-color: rgba(16,185,129,0.5); box-shadow: 0 0 0 3px rgba(16,185,129,0.06); }
        .field::placeholder { color: rgba(255,255,255,0.18); }
      `}</style>

      {/* LEFT SIDE */}
      <div className="w-1/2 dot-grid flex flex-col">
        <div className="p-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-white font-bold text-sm">API Monitor</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <motion.div
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-[28px] font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-white/30 text-sm mb-6">
              Sign in to your monitoring dashboard
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded mb-4 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="you@example.com"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="••••••••"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-xl"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="text-white/40 text-xs text-center mt-5">
              No account?{" "}
              <Link href="/register" className="text-emerald-400">
                Create one free
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden lg:flex w-1/2 h-screen bg-[#050505] p-6">
        <motion.div className="w-full h-full bg-[#eef2ec] rounded-3xl flex flex-col justify-between p-10">
          {/* BRAND */}
          <div className="flex justify-center items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold text-black">
              API Monitor
            </span>
          </div>

          {/* STATUS */}
          <div className="bg-[#050505] rounded-2xl p-4  w-5/6 mx-auto">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className="text-white/60 text-[11px]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Live
              </span>
            </div>
            <div className="space-y-2.5">
              {mockMonitors.map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${m.status === "up" ? "bg-emerald-400" : "bg-red-400 animate-pulse"}`}
                    />
                    <span
                      className="text-white/60 text-xs"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {m.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-white/40 text-[11px]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {m.ms}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${m.status === "up" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                    >
                      {m.status === "up" ? "UP" : "DOWN"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CAROUSEL */}
          <div className="text-center max-w-md mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-semibold text-[#111] mb-4">
                  {typedText}
                </h2>
                <p className="text-[#666] text-sm">{slides[current].desc}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-[2px] w-6 transition-all duration-300 ${
                    i === current ? "bg-[#111]" : "bg-[#ccc]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-1 gap-4 text-sm text-[#333] max-w-xs mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Real-time uptime checks
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" />
              Instant email alerts
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Response time graphs
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Public status pages
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

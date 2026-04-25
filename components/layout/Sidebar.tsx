"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Settings,
  LogOut,
  Activity,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitors", label: "Monitors", icon: Radio },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 flex flex-col border-r border-white/5 bg-[#050505]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span
            className="text-white font-bold text-sm tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            API Monitor
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                  : "text-white/30 hover:text-white/70 hover:bg-white/4 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-white/30"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/45 hover:text-white/60 hover:bg-white/4 transition-all w-full border border-transparent"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Monitor {
  id: number;
  name: string;
}

interface AlertConfig {
  id: number;
  monitorId: number;
  monitorName: string;
  destination: string;
  isActive: boolean;
}

interface Props {
  monitors: Monitor[];
  alertConfigs: AlertConfig[];
}

export default function AlertConfigForm({ monitors, alertConfigs }: Props) {
  const router = useRouter();
  const [monitorId, setMonitorId] = useState<number | "">(
    monitors[0]?.id ?? "",
  );
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!monitorId) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/alert-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monitorId, destination: email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setEmail("");
    router.refresh();
    setLoading(false);
  }

  async function handleToggle(id: number, isActive: boolean) {
    await fetch(`/api/alert-configs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this alert?")) return;
    await fetch(`/api/alert-configs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add new alert config */}
      <form onSubmit={handleAdd} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {monitors.length === 0 ? (
          <p className="text-white/45 text-sm">
            Add a monitor first before configuring alerts.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Monitor
                </label>
                <select
                  value={monitorId}
                  onChange={(e) => setMonitorId(Number(e.target.value))}
                  className="w-full bg-white/4 border border-white/8 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monitors.map((monitor) => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/4 border border-white/8 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-black disabled:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? "Adding..." : "Add Alert"}
            </button>
          </>
        )}
      </form>

      {/* Existing alert configs */}
      {alertConfigs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">
            Configured Alerts
          </h3>
          <div className="space-y-2">
            {alertConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between bg-white/4 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {config.monitorName}
                  </p>
                  <p className="text-white/60 text-xs">{config.destination}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(config.id, config.isActive)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      config.isActive
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-gray-700 text-white/60 hover:bg-gray-600"
                    }`}
                  >
                    {config.isActive ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

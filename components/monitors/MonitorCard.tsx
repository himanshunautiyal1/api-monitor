"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Monitor {
  id: number;
  name: string;
  url: string;
  intervalMinutes: number;
  method: string;
  isActive: boolean;
  tags: string[];
  responseTimeThreshold: number;
}

export default function MonitorCard({ monitor }: { monitor: Monitor }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete monitor "${monitor.name}"?`)) return;
    setDeleting(true);

    await fetch(`/api/monitors/${monitor.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleToggle() {
    await fetch(`/api/monitors/${monitor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !monitor.isActive }),
    });
    router.refresh();
  }
  console.log("MonitorCard rendered", monitor.id);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/monitors/${monitor.id}`}
              className="text-white font-semibold text-lg hover:text-blue-400 transition-colors"
            >
              {monitor.name}
            </Link>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                monitor.isActive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {monitor.isActive ? "Active" : "Paused"}
            </span>
          </div>

          <p className="text-gray-400 text-sm truncate mb-3">{monitor.url}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{monitor.method}</span>
            <span>Every {monitor.intervalMinutes}m</span>
            <span>Threshold: {monitor.responseTimeThreshold}ms</span>
            {monitor.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-4">
          <button
            onClick={handleToggle}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            {monitor.isActive ? "Pause" : "Resume"}
          </button>
          <Link
            href={`/monitors/${monitor.id}/edit`}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Edit
          </Link>
          <Link
            href={`/monitors/${monitor.id}`}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Details
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

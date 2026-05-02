"use client";

import { useState } from "react";

interface Incident {
  id: number;
  monitorId: number;
  monitorName: string;
  monitorUrl: string;
  startedAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
}

interface Props {
  initialIncidents: Incident[];
  totalCount: number;
  monitorIds: number[];
}

function formatDuration(startedAt: string, resolvedAt: string | null): string {
  const start = new Date(startedAt);
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);

  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMinutes}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function IncidentsList({
  initialIncidents,
  totalCount,
  monitorIds,
}: Props) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [loading, setLoading] = useState(false);

  const activeIncidents = incidents.filter((i) => !i.isResolved);
  const resolvedIncidents = incidents.filter((i) => i.isResolved);
  const hasMore = incidents.length < totalCount;

  async function loadMore() {
    setLoading(true);

    const res = await fetch(
      `/api/incidents?skip=${incidents.length}&monitorIds=${monitorIds.join(",")}`,
    );
    const data = await res.json();

    setIncidents((prev) => [...prev, ...data]);
    setLoading(false);
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-20 text-white/25">
        <p className="text-lg">No incidents yet</p>
        <p className="text-sm mt-1">
          Incidents are created when a monitor goes down
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
            Active Incidents ({activeIncidents.length})
          </h2>
          <div className="space-y-2">
            {activeIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/90 font-medium">
                      {incident.monitorName}
                    </p>
                    <p className="text-white/40 text-sm mt-1 truncate max-w-md">
                      {incident.monitorUrl}
                    </p>
                  </div>
                  <span className="bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full font-medium">
                    Ongoing
                  </span>
                </div>
                <div className="flex items-center gap-6 mt-2 text-xs text-white/40">
                  <span>
                    Started: {new Date(incident.startedAt).toLocaleString()}
                  </span>
                  <span className="text-red-400 font-medium">
                    Duration: {formatDuration(incident.startedAt, null)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Incidents */}
      {resolvedIncidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Resolved Incidents ({resolvedIncidents.length} of{" "}
            {totalCount - activeIncidents.length} total)
          </h2>
          <div className="space-y-2">
            {resolvedIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-white/2 border border-white/6 rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/90 font-medium">
                      {incident.monitorName}
                    </p>
                    <p className="text-white/40 text-sm mt-1 truncate max-w-md">
                      {incident.monitorUrl}
                    </p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-medium">
                    Resolved
                  </span>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-white/40">
                  <span>
                    Started: {new Date(incident.startedAt).toLocaleString()}
                  </span>
                  <span>
                    Resolved:{" "}
                    {incident.resolvedAt
                      ? new Date(incident.resolvedAt).toLocaleString()
                      : "—"}
                  </span>
                  <span className="text-white font-medium">
                    Duration:{" "}
                    {formatDuration(incident.startedAt, incident.resolvedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-white/4 hover:bg-white/6 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors text-sm font-medium"
              >
                {loading
                  ? "Loading..."
                  : `Load More (${totalCount - incidents.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import MonitorCard from "@/components/monitors/MonitorCard";

export const dynamic = "force-dynamic";

export default async function MonitorsPage() {
  const session = await auth();

  const monitors = await prisma.monitor.findMany({
    where: { userId: Number(session?.user?.id) },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitors</h1>
          <p className="text-gray-400 mt-1">Manage your API monitors</p>
        </div>
        <Link
          href="/monitors/new"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Add Monitor
        </Link>
      </div>

      {monitors.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No monitors yet</p>
          <p className="text-sm mt-1">Add your first monitor to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import AlertConfigForm from "@/components/settings/AlertConfigForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const alertConfigs = await prisma.alertConfig.findMany({
    where: { userId },
    include: { monitor: true },
  });

  const monitors = await prisma.monitor.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-gray-400 mb-8">
        Manage your account and alert preferences
      </p>

      {/* Account Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Username</span>
            <span className="text-white">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Public status page</span>
            <span className="text-blue-400">/status/{user?.username}</span>
          </div>
        </div>
      </div>

      {/* Alert Configs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Email Alerts</h2>
        <p className="text-gray-400 text-sm mb-6">
          Configure which email address receives alerts for each monitor.
        </p>
        <AlertConfigForm
          monitors={monitors}
          alertConfigs={alertConfigs.map((config) => ({
            id: config.id,
            monitorId: config.monitorId,
            monitorName: config.monitor.name,
            destination: config.destination,
            isActive: config.isActive,
          }))}
        />
      </div>
    </div>
  );
}

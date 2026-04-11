import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import MonitorForm from "@/components/monitors/MonitorForm";
import { notFound } from "next/navigation";

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const monitor = await prisma.monitor.findFirst({
    where: {
      id: Number(id),
      userId: Number(session?.user?.id),
    },
  });

  if (!monitor) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Edit Monitor</h1>
      <p className="text-gray-400 mb-8">Update your monitor settings</p>
      <MonitorForm
        initialData={{
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          intervalMinutes: monitor.intervalMinutes,
          method: monitor.method,
          headers: monitor.headers as Record<string, string>,
          responseTimeThreshold: monitor.responseTimeThreshold,
          tags: monitor.tags,
        }}
      />
    </div>
  );
}

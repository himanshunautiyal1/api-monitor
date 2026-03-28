import { auth } from "@/lib/auth/config";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Welcome back, {session?.user?.name}
      </h1>
      <p className="text-gray-400">
        Your monitors will appear here once you add them.
      </p>
    </div>
  );
}

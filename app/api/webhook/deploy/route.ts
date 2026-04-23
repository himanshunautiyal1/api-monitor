import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");

  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deployScript =
    "/data/data/com.termux/files/home/apps/api-monitor/deploy-from-github.sh";

  execAsync(`bash ${deployScript}`).catch((err) => {
    console.error("Deploy script error:", err);
  });

  return NextResponse.json({ message: "Deployment started" });
}

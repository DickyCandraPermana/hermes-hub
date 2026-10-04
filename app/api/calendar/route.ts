import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const scriptPath =
      "/opt/data/skills/productivity/google-workspace/scripts/google_api.py";
    const pythonBin = "/opt/hermes/.venv/bin/python";

    const { stdout } = await execAsync(`${pythonBin} ${scriptPath} calendar list`);
    const events = JSON.parse(stdout || "[]");
    return NextResponse.json({ events });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching calendar";
    return NextResponse.json({ events: [], error: message });
  }
}

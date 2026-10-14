import { NextResponse } from "next/server";

export async function GET() {
  let commands: { command: string; description: string; category?: string }[] = [];

  // Try fetching dynamically from Telegram Bot API if token is present
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN || "";

    if (token) {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMyCommands`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.result)) {
          commands = json.result;
        }
      }
    }
  } catch (e) {
    console.error("Error fetching telegram commands:", e);
  }

  // Fallback / Categorization mapping
  const categoryMap: Record<string, string> = {
    help: "System",
    new: "Session",
    status: "Runtime",
    stop: "Control",
    model: "Model",
    usage: "Runtime",
    diff: "Git",
    context: "Runtime",
    review: "Agents",
    plan: "Agents",
    agents: "Agents",
    goal: "Workflow",
    save: "Session",
    undo: "Session",
    retry: "Session",
    compress: "Session",
    sessions: "Session",
    resume: "Session",
    memory: "Memory",
    learn: "Skills",
    commands: "System",
    yolo: "Approvals",
    approvals: "Approvals",
    restart: "System",
    update: "System",
    debug: "System",
    rollback: "Control",
    pause: "Control",
  };

  const enrichedCommands = commands.map((c) => ({
    command: c.command.startsWith("/") ? c.command : `/${c.command}`,
    description: c.description,
    category: categoryMap[c.command.replace("/", "")] || "General",
  }));

  return NextResponse.json({ commands: enrichedCommands });
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    agent: "Hermes Agent",
    model: "hermes-combo",
    user: "Dicky Candra Permana",
    services: [
      { name: "Google Calendar", status: "active", icon: "calendar" },
      { name: "Gmail", status: "active", icon: "mail" },
      { name: "GitHub CLI", status: "active", icon: "github" },
      { name: "Vercel Deployments", status: "active", icon: "cloud" },
      { name: "Google Stitch MCP", status: "active", icon: "palette" },
      { name: "Postgres (Neon)", status: "active", icon: "database" },
      { name: "Supabase", status: "active", icon: "server" },
    ],
  });
}

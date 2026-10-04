import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function GET() {
  const result: {
    calendar: any[];
    emails: any[];
    deployments: any[];
    stitch: any[];
    github: any[];
    error?: string;
  } = {
    calendar: [],
    emails: [],
    deployments: [],
    stitch: [],
    github: [],
  };

  // 1. Google Calendar & Gmail
  try {
    const calPromise = execAsync(
      "/opt/hermes/.venv/bin/python /opt/data/skills/productivity/google-workspace/scripts/google_api.py calendar list"
    ).then((res) => {
      try {
        result.calendar = JSON.parse(res.stdout || "[]");
      } catch {}
    });

    const mailPromise = execAsync(
      '/opt/hermes/.venv/bin/python /opt/data/skills/productivity/google-workspace/scripts/google_api.py gmail search --max 5 "is:unread"'
    ).then((res) => {
      try {
        result.emails = JSON.parse(res.stdout || "[]");
      } catch {}
    });

    await Promise.allSettled([calPromise, mailPromise]);
  } catch (err: any) {
    console.error("Workspace google error:", err);
  }

  // 2. Vercel Deployments
  try {
    if (fs.existsSync("/opt/data/mcp-tokens/vercel.json")) {
      const vercelTokenData = JSON.parse(
        fs.readFileSync("/opt/data/mcp-tokens/vercel.json", "utf-8")
      );
      const token = vercelTokenData.access_token;
      if (token) {
        const vRes = await fetch("https://api.vercel.com/v6/deployments?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          result.deployments = (vData.deployments || []).map((d: any) => ({
            name: d.name,
            state: d.state,
            url: d.url,
            created: d.created,
          }));
        }
      }
    }
  } catch (err: any) {
    console.error("Workspace vercel error:", err);
  }

  // 3. GitHub Recent Commits/Repos
  try {
    const ghRes = await execAsync(
      'export PATH="$HOME/.local/bin:$PATH"; gh repo list DickyCandraPermana --limit 5 --json name,description,updatedAt,isPrivate,url'
    );
    result.github = JSON.parse(ghRes.stdout || "[]");
  } catch (err: any) {
    console.error("Workspace gh error:", err);
  }

  // 4. Stitch Projects
  result.stitch = [
    {
      id: "7648646251287895141",
      name: "Nutritrack Design System",
      type: "Clinical Modernism",
      screens: [
        "AI Food Scanner",
        "Nutritional Insights",
        "My Nutrition Logs",
        "Clinical Dashboard",
        "Landing Page",
      ],
    },
    {
      id: "1492689743687616137",
      name: "Waste2Value Platform",
      type: "Circular Economy",
      screens: [
        "Material Marketplace",
        "Waste Analytics",
        "Logistics Routing",
        "Eco Certificate",
      ],
    },
  ];

  return NextResponse.json(result);
}

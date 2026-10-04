import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://api.thearinazs.my.id";
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || "";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "10";

    const res = await fetch(`${GATEWAY_URL}/v1/logs/recent?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${GATEWAY_API_KEY}`,
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Gateway returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || "";
    const limit = body.limit || 5;

    const res = await fetch(`${GATEWAY_URL}/v1/logs/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Gateway search failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}

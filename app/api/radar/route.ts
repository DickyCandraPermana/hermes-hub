import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://api.thearinazs.my.id";
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || "";

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/v1/knowledge/radar`, {
      headers: {
        Authorization: `Bearer ${GATEWAY_API_KEY}`,
      },
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

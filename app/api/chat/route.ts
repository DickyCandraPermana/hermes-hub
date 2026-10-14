import { validateAndPrepareMessages } from "../../../lib/security/validator.ts";
import { redactSensitiveOutput } from "../../../lib/security/sanitizer.ts";

export const maxDuration = 30;

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: Request): Promise<Response> {
  // 1. IP extraction & Rate limiting
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({
        type: "https://hermes-hub.local/errors/RATE_LIMITED",
        title: "Too Many Requests",
        status: 429,
        code: "RATE_LIMITED",
        detail: "Batas permintaan percakapan terlampaui (maksimal 10 req/menit). Silakan coba sesaat lagi.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/problem+json",
          "Retry-After": "60",
        },
      }
    );
  }

  // 2. Parse JSON body
  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        type: "https://hermes-hub.local/errors/EMPTY_BODY",
        title: "Bad Request",
        status: 400,
        code: "EMPTY_BODY",
        detail: "Format JSON tidak valid atau request body kosong.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      }
    );
  }

  // 3. Strict schema validation & Guest Persona Injection
  const validation = validateAndPrepareMessages(rawBody);
  if (!validation.ok) {
    return new Response(
      JSON.stringify({
        type: `https://hermes-hub.local/errors/${validation.code}`,
        title: "Validation Error",
        status: validation.status,
        code: validation.code,
        detail: validation.detail,
      }),
      {
        status: validation.status,
        headers: { "Content-Type": "application/problem+json" },
      }
    );
  }

  // 4. Upstream LLM Routing & Fallback
  const upstreamBase =
    process.env.HERMES_API_URL ||
    process.env.ROUTER_URL ||
    "https://9router.thearinazs.my.id/v1";
  const upstreamKey =
    process.env.HERMES_API_KEY ||
    process.env.ROUTER_API_KEY ||
    "";
  const upstreamModel =
    process.env.HERMES_GUEST_MODEL ||
    "hermes-combo";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout (Vercel maxDuration 30s)

  try {
    const upstreamUrl = upstreamBase.endsWith("/chat/completions")
      ? upstreamBase
      : `${upstreamBase.replace(/\/+$/, "")}/chat/completions`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(upstreamKey ? { Authorization: `Bearer ${upstreamKey}` } : {}),
      },
      body: JSON.stringify({
        model: upstreamModel,
        messages: validation.messages,
        tools: [],
        tool_choice: "none",
        stream: true,
        temperature: 0.7,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text().catch(() => "");
      console.error("[Chat API] Upstream error:", upstreamResponse.status, errText);

      return new Response(
        JSON.stringify({
          type: "https://hermes-hub.local/errors/UPSTREAM_ERROR",
          title: "Service Unavailable",
          status: 503,
          code: "UPSTREAM_ERROR",
          detail: "The Key sedang menenangkan pikiran sejenak. Silakan coba kembali sesaat lagi.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/problem+json" },
        }
      );
    }

    if (!upstreamResponse.body) {
      return new Response(
        JSON.stringify({
          type: "https://hermes-hub.local/errors/EMPTY_RESPONSE",
          title: "Bad Gateway",
          status: 502,
          code: "EMPTY_RESPONSE",
          detail: "Respon dari server upstream kosong.",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/problem+json" },
        }
      );
    }

    // 5. Stream DLP Transform
    const textDecoder = new TextDecoder();
    const textEncoder = new TextEncoder();

    const dlpTransform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, streamController) {
        const text = textDecoder.decode(chunk, { stream: true });
        const redacted = redactSensitiveOutput(text);
        streamController.enqueue(textEncoder.encode(redacted));
      },
      flush(streamController) {
        const remaining = textDecoder.decode();
        if (remaining) {
          const redacted = redactSensitiveOutput(remaining);
          streamController.enqueue(textEncoder.encode(redacted));
        }
      },
    });

    const transformedStream = upstreamResponse.body.pipeThrough(dlpTransform);

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error?.name === "AbortError";
    console.error("[Chat API] Error:", isTimeout ? "Timeout" : error?.message);

    return new Response(
      JSON.stringify({
        type: "https://hermes-hub.local/errors/GATEWAY_TIMEOUT",
        title: "Gateway Timeout",
        status: 504,
        code: "GATEWAY_TIMEOUT",
        detail: "Waktu respon habis saat menghubungi The Key. Silakan coba beberapa saat lagi.",
      }),
      {
        status: 504,
        headers: { "Content-Type": "application/problem+json" },
      }
    );
  }
}
